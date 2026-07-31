# ============================================
# TradeGuard AI — Django + Scikit-Learn ML Service
# Production-ready image served by Gunicorn
# ============================================
FROM python:3.12-slim

# Keep Python lean and logs unbuffered so container logs stream in real time
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# tini for correct signal handling; build tools kept out (wheels are prebuilt)
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source
COPY . .

# Retrain the ML model INSIDE the image so the pickled artifacts always match
# the scikit-learn version installed here (avoids version-mismatch unpickling
# errors from artifacts trained on a different machine).
RUN python ml/generate_dataset.py && python ml/train_model.py

# Collect Django static files (admin, DRF browsable API assets)
RUN python manage.py collectstatic --noinput || true

# Run as a non-root user
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health/').status==200 else 1)" || exit 1

# Invoke via `sh` so the script runs regardless of the file's executable bit
# (Windows checkouts don't preserve the +x permission).
ENTRYPOINT ["/usr/bin/tini", "--", "sh", "entrypoint.sh"]
