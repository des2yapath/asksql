# Slim base - we don't need build tools at runtime since asyncpg ships
# manylinux wheels for the platforms Render/Fly/etc actually run on.
FROM python:3.12-slim

WORKDIR /app

# Install deps first so this layer is cached across code changes - the
# requirements.txt hash rarely changes compared to app/ during normal dev.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Render (and most PaaS free tiers) inject $PORT at runtime rather than
# using a fixed port - respect it instead of hardcoding 8000, or the
# platform's health check will hit the wrong port and mark the service down.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
