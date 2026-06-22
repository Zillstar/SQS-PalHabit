#!/usr/bin/env bash
# setup.sh – Prepare the local project for one-command startup.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CHECK_ONLY=false
INSTALL_LOCAL=false

for arg in "$@"; do
  case "$arg" in
    --check-only)
      CHECK_ONLY=true
      ;;
    --install-local)
      INSTALL_LOCAL=true
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: ./scripts/setup.sh [--check-only] [--install-local]"
      exit 1
      ;;
  esac
done

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "ERROR: Required command '$name' was not found."
    exit 1
  fi
}

echo "==> Checking required tools..."
require_command docker

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose was not found."
  echo "Please install Docker Desktop or Docker Engine with Docker Compose."
  exit 1
fi

echo "==> Checking Docker daemon..."
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker is installed, but the Docker daemon is not running."
  echo "Please start Docker Desktop or the Docker service and try again."
  exit 1
fi

echo "==> Making shell scripts executable..."
chmod +x "$SCRIPT_DIR/setup.sh" "$SCRIPT_DIR/start.sh" 2>/dev/null || true

if [[ "$CHECK_ONLY" == true ]]; then
  echo "==> Setup check complete."
  exit 0
fi

if [[ "$INSTALL_LOCAL" == true ]]; then
  echo "==> Installing local backend/frontend dependencies..."

  if [[ -d "$ROOT_DIR/backend" ]]; then
    echo "==> Resolving backend dependencies..."
    cd "$ROOT_DIR/backend"

    if [[ -f ./mvnw ]]; then
      ./mvnw --no-transfer-progress dependency:resolve
    else
      require_command mvn
      mvn --no-transfer-progress dependency:resolve
    fi
  fi

  if [[ -d "$ROOT_DIR/frontend" ]]; then
    echo "==> Installing frontend dependencies..."
    cd "$ROOT_DIR/frontend"

    require_command npm

    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install
    fi
  fi
else
  echo "==> Skipping local dependency installation."
  echo "    Docker Compose builds the backend/frontend images itself."
  echo "    Use './scripts/setup.sh --install-local' only if you also want local dev dependencies."
fi

echo "==> Setup complete."