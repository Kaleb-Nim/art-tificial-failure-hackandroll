FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIPENV_VENV_IN_PROJECT=1

WORKDIR /app

# Install pipenv and system dependencies
RUN pip install --no-cache-dir pipenv && \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc python3-dev libpq-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock ./

# Install dependencies
RUN pipenv install --system --deploy

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]