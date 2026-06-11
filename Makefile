# ─────────────────────────────────────────────────────────────
#  Triad Realty — Makefile
#  Unified build & run entry point (replaces start.sh).
#
#  Common commands:
#    make install   — Install all dependencies (npm + pip + venv)
#    make build     — Build the React frontend and copy into backend
#    make dev       — Build frontend then start the integrated server
#    make backend   — Start the backend only (skips frontend build)
#    make clean     — Remove build artefacts
# ─────────────────────────────────────────────────────────────

# Detect macOS homebrew prefix for node/npm
BREW_PREFIX := $(shell brew --prefix 2>/dev/null || echo /usr/local)
export PATH := $(BREW_PREFIX)/bin:$(PATH)

PROJECT_ROOT := $(shell pwd)
FRONTEND_DIR := $(PROJECT_ROOT)/frontend
BACKEND_DIR  := $(PROJECT_ROOT)/backend
BUILD_OUTPUT := $(BACKEND_DIR)/frontend_build
VENV         := $(BACKEND_DIR)/venv
PYTHON       := $(VENV)/bin/python
PIP          := $(VENV)/bin/pip
UVICORN      := $(VENV)/bin/uvicorn
ENV_FILE     := $(BACKEND_DIR)/.env
ENV_EXAMPLE  := $(BACKEND_DIR)/.env.example

.PHONY: all install install-frontend install-backend build dev backend clean check-env

# ── Default target ────────────────────────────────────────────
all: dev

# ── Dependency installation ───────────────────────────────────
install: install-frontend install-backend
	@echo ""
	@echo "✅  All dependencies installed."
	@echo "    Run 'make dev' to build and start the server."

install-frontend:
	@echo "▶  Installing frontend dependencies..."
	@cd $(FRONTEND_DIR) && npm install --legacy-peer-deps --silent

install-backend:
	@echo "▶  Installing backend dependencies..."
	@if [ ! -d "$(VENV)" ]; then python3 -m venv $(VENV); fi
	@$(PIP) install -q -r $(BACKEND_DIR)/requirements.txt

# ── .env guard ────────────────────────────────────────────────
check-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
	  if [ -f "$(ENV_EXAMPLE)" ]; then \
	    cp $(ENV_EXAMPLE) $(ENV_FILE); \
	    echo "⚠️   No backend/.env found — created one from .env.example."; \
	    echo "    Review $(ENV_FILE) and set real credentials before deploying."; \
	    echo ""; \
	  else \
	    echo "❌  backend/.env is missing and no .env.example found."; \
	    exit 1; \
	  fi \
	fi

# ── Frontend build ────────────────────────────────────────────
build: install-frontend
	@echo "▶  Building React frontend..."
	@cd $(FRONTEND_DIR) && npm run build --silent
	@echo "▶  Copying build into backend..."
	@rm -rf $(BUILD_OUTPUT)
	@cp -r $(FRONTEND_DIR)/build $(BUILD_OUTPUT)
	@echo "    Frontend deployed to: $(BUILD_OUTPUT)"

# ── Start integrated server (build + serve) ───────────────────
dev: check-env install build
	@echo ""
	@echo "╔══════════════════════════════════════╗"
	@echo "║        Triad Realty — Running        ║"
	@echo "╚══════════════════════════════════════╝"
	@echo ""
	@echo "  🌐  Website  →  http://localhost:8000"
	@echo "  🔑  Admin    →  http://localhost:8000/admin/login"
	@echo "  📄  Credentials in: backend/.env"
	@echo ""
	@cd $(BACKEND_DIR) && $(UVICORN) server:app --host 0.0.0.0 --port 8000

# ── Backend only (no frontend rebuild) ───────────────────────
backend: check-env install-backend
	@echo "▶  Starting backend (frontend not rebuilt)..."
	@echo "  🌐  http://localhost:8000"
	@cd $(BACKEND_DIR) && $(UVICORN) server:app --host 0.0.0.0 --port 8000 --reload

# ── Cleanup ──────────────────────────────────────────────────
clean:
	@echo "▶  Removing build artefacts..."
	@rm -rf $(FRONTEND_DIR)/build $(BUILD_OUTPUT)
	@find $(PROJECT_ROOT) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@echo "    Done."
