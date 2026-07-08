# AWS EC2 Migration & Deployment Guide

This document describes how to configure, deploy, and maintain the production build of **Triad Realty** on an AWS EC2 instance running Ubuntu 24.04, replacing the legacy Render setup.

---

## Architecture Overview

```txt
   Incoming User (HTTPS)
            │
            ▼
    [ Host Nginx Port 443 ]  <-- SSL Terminated via Let's Encrypt
            │
            ▼ (Proxy Pass to Port 8000)
   [ Docker Compose Network ]
    ├── triad-app      (React + FastAPI build)
    └── triad-mongodb  (Local database fallback)
```

- **Let's Encrypt SSL**: Managed by Certbot directly on the host machine.
- **Nginx Reverse Proxy**: Forwards traffic to port `8000` (Docker app service), implements compression (Gzip), assets caching, and secure HTTP headers.
- **GitHub Actions**: Rebuilds the app automatically on git pushes to the `main` branch.

---

## AWS Setup Instructions

### 1. Server Allocation
- Launch an EC2 instance using **Ubuntu 24.04 LTS**.
- Allow inbound traffic in Security Groups for:
  - **Port 22** (SSH)
  - **Port 80** (HTTP)
  - **Port 443** (HTTPS)

### 2. Host Installations
Connect to the server via SSH and execute the following setup commands:

```bash
# Update local registries
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker Engine & Compose
sudo apt-get install -y docker.io docker-compose-v2

# Configure Docker permissions for default Ubuntu user
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx & Certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 3. Deploy the Code
Clone the repository:
```bash
git clone https://github.com/Abhay-dd/webtriad.git ~/webtriad-main
cd ~/webtriad-main
```

### 4. Let's Encrypt SSL Configuration
Deploy a temporary Nginx proxy rule to authenticate the SSL challenges:
1. Edit `/etc/nginx/sites-available/default`:
   ```nginx
   server {
       listen 80;
       server_name www.triadrealty.ae triadrealty.ae;

       location /.well-known/acme-challenge/ {
           root /var/www/html;
       }
   }
   ```
2. Request certificates:
   ```bash
   sudo certbot --nginx -d triadrealty.ae -d www.triadrealty.ae
   ```
3. Copy our optimized configuration [nginx/nginx.conf](file:///Users/abhaydileep/Desktop/webtriad-main/nginx/nginx.conf) to `/etc/nginx/nginx.conf` and restart Nginx:
   ```bash
   sudo cp ~/webtriad-main/nginx/nginx.conf /etc/nginx/nginx.conf
   sudo systemctl restart nginx
   ```

---

## GitHub Secrets Setup

Navigate to your GitHub Repository ➔ **Settings** ➔ **Secrets and variables** ➔ **Actions** and add:

- `EC2_HOST`: Target EC2 IP address or public domain.
- `EC2_USERNAME`: `ubuntu`
- `EC2_SSH_KEY`: Private PEM key content.
- `JWT_SECRET`: Secure JSON Web Token secret key.
- `MONGO_URI`: MongoDB connection string.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary Cloud Name.
- `CLOUDINARY_API_KEY`: Cloudinary API Key.
- `CLOUDINARY_API_SECRET`: Cloudinary Security Secret Key.

---

## Verification Checklist

1. **Host Nginx**:
   - Status check: `sudo systemctl status nginx`
   - Config validation: `sudo nginx -t`
2. **Docker Network**:
   - Running containers: `docker ps`
   - Verify logs: `docker compose logs -f app`
3. **Application Verification**:
   - Direct Backend Query: `curl -I http://localhost:8000/api/settings/homepage`
   - SSL Validation: `curl -I https://www.triadrealty.ae/`
