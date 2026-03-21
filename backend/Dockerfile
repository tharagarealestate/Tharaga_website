FROM python:3.11-slim

# Accept an optional requirements file arg (default: requirements.txt)
ARG REQUIREMENTS=requirements.txt

WORKDIR /app

COPY requirements.txt requirements-prod.txt ./
RUN pip install --no-cache-dir -r ${REQUIREMENTS}

COPY . .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
