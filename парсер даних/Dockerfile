FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./requirements.txt
COPY web/requirements.txt ./web/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r web/requirements.txt

COPY . .

# Lock down the public deployment: SSRF guard + crawl-size caps (see web/app.py)
ENV PUBLIC_DEPLOY=1

# Hugging Face Spaces (and most PaaS) expect the app on 7860
EXPOSE 7860
CMD ["uvicorn", "web.app:app", "--host", "0.0.0.0", "--port", "7860"]
