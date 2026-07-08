# Triad Realty CI/CD Pipeline (AWS EC2 & GitHub Actions)

This repository contains a production-ready, fully automated CI/CD pipeline configuration designed to deploy the integrated React and FastAPI application to an AWS EC2 instance (Ubuntu 24.04) using Docker Compose and Nginx.

---

## Architecture

The architecture consists of the following components:
- **Client Tier**: Web browsers visiting `https://www.triadrealty.ae`.
- **Reverse Proxy**: Nginx running directly on the host (with SSL certificates managed by Let's Encrypt / Certbot). Nginx proxies incoming traffic to port `8000`.
- **Application Server (Docker Compose)**:
  - `triad-app` (FastAPI backend on port `8000` serving the built React static files on the client side).
  - `triad-mongodb` (MongoDB instance on port `27017`).
- **Automation Runner**: GitHub Actions runs on every push to the `main` branch to securely connect to the AWS EC2 instance, deploy updates, run health verifications, and reload configurations safely.

---

## Deployment Flow

1. **Trigger**: Developer pushes commits to the `main` branch.
2. **Action Initialization**: GitHub Actions launches an virtual runner (`ubuntu-latest`).
3. **Secure Connection**: Connects to the AWS EC2 server using SSH (authentication via `EC2_SSH_KEY`).
4. **Local Repository Audit (`deploy.sh`)**:
   - Records the current commit SHA (for rollback security).
   - Resets changes and hard-aligns local files to the latest origin `main` commits.
   - Generates the `.env` configuration file dynamically using parameters passed from GitHub Secrets.
5. **Container Rebuild**: Runs `docker compose build --no-cache` to compile updated React/FastAPI docker layers.
6. **Reboot**: Shuts down older containers and starts up updated containers.
7. **Healthcheck Verification (`healthcheck.sh`)**:
   - Verifies all Docker containers are successfully active.
   - Queries backend APIs and frontend static endpoints checking for `HTTP 200` status.
8. **Nginx Safe Reload**: Runs validation tests (`nginx -t`) and reloads Nginx safely without causing downtime.
9. **Automatic Rollback (`rollback.sh`)**: If any health check fails, the pipeline restores the previous stable git commit and boots the backup stable container instance immediately.

---

## GitHub Secrets Setup

Define the following environment variables in your GitHub Repository under **Settings** ➔ **Secrets and variables** ➔ **Actions**:

| Secret Key | Purpose / Description |
| :--- | :--- |
| `EC2_HOST` | The public IP address or DNS endpoint of your AWS EC2 instance. |
| `EC2_USERNAME` | The server SSH username (typically `ubuntu` for Ubuntu servers). |
| `EC2_SSH_KEY` | The private PEM key used to authenticate SSH sessions on EC2. |
| `JWT_SECRET` | Secret token used to sign auth tokens. |
| `MONGO_URI` | MongoDB Connection string (Atlas or local container fallback). |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary storage account name. |
| `CLOUDINARY_API_KEY` | Cloudinary developer API key credentials. |
| `CLOUDINARY_API_SECRET`| Cloudinary security secret key credentials. |

---

## AWS Setup

1. **Allocate EC2 Instance**: Use an Ubuntu 24.04 LTS instance (t3.medium or above recommended for production builds).
2. **Install Docker Engine & Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   newgrp docker
   ```
3. **Install & Configure Nginx**:
   ```bash
   sudo apt-get install -y nginx
   ```
4. **Clone the Repository**:
   Clone the repository directly into your home folder:
   ```bash
   git clone https://github.com/Abhay-dd/webtriad.git ~/webtriad-main
   ```
5. **Nginx Site Configuration (`/etc/nginx/sites-available/default`)**:
   Map incoming queries to the Docker application listening on port `8000`:
   ```nginx
   server {
       listen 80;
       server_name www.triadrealty.ae triadrealty.ae;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Apply SSL certificates via Certbot (`certbot --nginx -d triadrealty.ae -d www.triadrealty.ae`).

---

## Directory Structure

```txt
.github/
    workflows/
        deploy.yml    # GitHub Actions workflow script
scripts/
    deploy.sh         # Core deployment runner
    rollback.sh       # Rollback logic for fast recoveries
    healthcheck.sh    # Integrity and service testing script
docker-compose.yml    # Docker services schema
Dockerfile            # Multi-stage production build script
render.yaml           # Retained for Render deployment compatibility
README-CICD.md        # This pipeline documentation file
```

---

## Rollback Procedure

If the validation tests in `healthcheck.sh` fail:
1. `deploy.sh` intercepts the failure response.
2. It automatically invokes `rollback.sh`, supplying the stable commit SHA recorded before the pull occurred.
3. The server runs `git reset --hard <stable_commit>`, rebuilds the cached image, and boots the previous working version.
4. The deployment workflow exits with failure to alert engineers, but the website remains online and functional without interruption.

---

## Troubleshooting

- **Build Failures / Out of Memory**: If building fails during npm build on EC2, check your server RAM. Add swap memory if utilizing t3.micro/t3.small instances:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
- **Nginx Reload Blocked**: If Nginx fails to reload, execute `sudo nginx -t` on the server manually to verify syntax. If certificates are missing, ensure Let's Encrypt is fully updated.
- **Docker Permission Errors**: Ensure that the `ubuntu` user (or deploy user) is added to the `docker` system group: `sudo usermod -aG docker ubuntu`.
