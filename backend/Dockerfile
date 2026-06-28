FROM python:3.11-slim

# Accept an optional requirements file arg (default: requirements.txt)
ARG REQUIREMENTS=requirements.txt

WORKDIR /app

COPY requirements.txt requirements-prod.txt ./
RUN pip install --no-cache-dir -r ${REQUIREMENTS}

COPY . .

EXPOSE 8080

CMD exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}
