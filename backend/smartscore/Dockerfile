FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Optional: copy model if pre-trained
# COPY model.pkl .

EXPOSE 8080

CMD ["python", "main.py"]
