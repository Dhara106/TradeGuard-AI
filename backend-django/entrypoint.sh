#!/bin/sh
# ============================================
# TradeGuard AI — Django service entrypoint
# Applies DB migrations, then starts Gunicorn.
# ============================================
set -e

echo "[entrypoint] Applying database migrations..."
python manage.py migrate --noinput

echo "[entrypoint] Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn tradeguard.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${GUNICORN_WORKERS:-3}" \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
