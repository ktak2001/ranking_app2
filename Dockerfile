# ---- build stage ----
FROM python:3.12-slim AS builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --user -r requirements.txt

# ---- runtime stage ----
FROM python:3.12-slim
WORKDIR /app
# 依存パッケージだけコピー
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
# アプリ本体
COPY . /app
ENTRYPOINT ["python"]   # 実行スクリプトは Cloud Run Job 側で --args で渡す
  