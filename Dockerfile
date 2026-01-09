# Cloud Run デプロイ用 Dockerfile
FROM python:3.11-slim

# ffmpeg のインストール（audio変換に必要）
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係インストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコピー
COPY app.py .
COPY static ./static
RUN mkdir -p downloads

# Cloud Run はポート 8080 がデフォルト
ENV PORT=8080

# 本番環境フラグ
ENV ENV=production

# uvicorn 起動（Cloud Run は $PORT を使用）
CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT}
