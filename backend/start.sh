#!/bin/sh
set -e

echo "[UrbanCoolSim] Starting embedded Redis server..."
redis-server --daemonize yes --protected-mode no

echo "[UrbanCoolSim] Starting Celery background worker..."
celery -A app.worker.celery_app worker --loglevel=info --concurrency=1 &

echo "[UrbanCoolSim] Starting FastAPI web server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
