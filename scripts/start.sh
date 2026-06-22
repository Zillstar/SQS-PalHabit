#!/usr/bin/env bash
# start.sh – One-command startup for the full application stack.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

QUALITY=false
DETACHED=false
NO_BUILD=false
RESET=false

for arg in "$@"; do
  case "$arg" in
    --quality)
      QUALITY=true
      ;;
    -d|--detach|--detached)
      DETACHED=true
      ;;
    --no-build)
      NO_BUILD=true
      ;;
    --reset)
      RESET=true
      ;;
    -h|--help)
      cat <<EOF
Usage:
  ./scripts/start.sh [options]

Options:
  --quality       Start app plus Quality Hub.
  -d, --detached  Start containers in the background.
  --no-build      Start without rebuilding Docker images.
  --reset         Stop containers and remove volumes before starting.
  -h, --help      Show this help.

Examples:
  ./scripts/start.sh
  ./scripts/start.sh --quality
  ./scripts/start.sh --quality --detached
  ./scripts/start.sh --reset
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Run './scripts/start.sh --help' for usage."
      exit 1
      ;;
  esac
done

echo "==> Preparing project..."
"$SCRIPT_DIR/setup.sh" --check-only

cd "$ROOT_DIR"

if [[ "$RESET" == true ]]; then
  echo "==> Resetting Docker Compose stack and volumes..."
  docker compose down -v --remove-orphans
fi

COMPOSE_ARGS=(compose)

if [[ "$QUALITY" == true ]]; then
  COMPOSE_ARGS+=(--profile quality)
fi

COMPOSE_ARGS+=(up)

if [[ "$DETACHED" == true ]]; then
  COMPOSE_ARGS+=(-d)
fi

if [[ "$NO_BUILD" == false ]]; then
  COMPOSE_ARGS+=(--build)
fi

echo ""
echo "==> Starting PokeHabit..."
echo "    Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "    Backend:  http://localhost:${BACKEND_PORT:-8181}"

if [[ "$QUALITY" == true ]]; then
  echo "    Quality:  http://localhost:${QUALITY_HUB_PORT:-8088}"
fi

echo ""
echo "==> Running: docker ${COMPOSE_ARGS[*]}"
docker "${COMPOSE_ARGS[@]}"