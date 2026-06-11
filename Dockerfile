# --- Stage 1: Build the React Frontend ---
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies first for Docker layer caching
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend code and build it
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build the FastAPI Backend & Serve Frontend ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (like build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Copy the pre-built React frontend static assets from Stage 1
COPY --from=frontend-builder /app/frontend/build ./backend/frontend_build

# Expose the default FastAPI port
EXPOSE 8000

# Set working directory to backend folder to run server
WORKDIR /app/backend

# Run FastAPI app
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]

