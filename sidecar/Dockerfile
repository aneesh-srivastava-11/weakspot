# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /build

COPY requirements.txt .

# Install dependencies into a wheels directory to avoid saving caching/compiling junk in runtime image
RUN pip install --no-cache-dir -U pip && \
    pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

# Stage 2: Runtime image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Kuzu / LanceDB compilation if any, plus cleanups
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .

RUN pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels requirements.txt

# Copy application code
COPY app/ /app/app/

# Expose port
EXPOSE 8000

# Set environment
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
