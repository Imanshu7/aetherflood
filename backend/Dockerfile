# AetherFlood API - Hugging Face Spaces (Docker SDK)
#
# Spaces serves the container on port 7860 and requires binding to 0.0.0.0.
# Build context must be the repository ROOT so `backend/` resolves:
#   docker build -f backend/Dockerfile -t aetherflood-api .

# Matches the interpreter the test suite actually runs against (3.12.x), so the
# image does not introduce an untested runtime difference.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=7860

WORKDIR /app

# Dependencies first so application edits do not invalidate the pip layer.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Application package. backend/data/aetherflood.db ships inside backend/ and is
# the path DatabaseService resolves (backend/services/../data/aetherflood.db),
# so copying backend/ is sufficient - no separate data/ directory exists.
COPY backend /app/backend

# Hugging Face Spaces runs containers with UID 1000. Create user and grant write access to SQLite directory.
RUN useradd -m -u 1000 user && \
    chown -R user:user /app && \
    chmod -R 777 /app/backend/data

USER user

# Run the existing ASGI app from its real import path. No duplicate app file.
EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:7860/api/health', timeout=4).status==200 else 1)"

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]