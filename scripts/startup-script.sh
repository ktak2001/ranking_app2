#!/bin/bash

# エラーが発生したら即座に終了
set -e

# ログファイルの設定
LOG_FILE="/tmp/startup-script.log"

# ログ記録関数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting startup script..."

# システムの更新とツールのインストール
log "Updating system and installing necessary tools..."
sudo apt-get update
sudo apt-get install -y git python3-pip

# Google Cloud SDK のインストール（もし必要な場合）
log "Installing Google Cloud SDK..."
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt-get update && sudo apt-get install -y google-cloud-sdk

# Secret Manager から GitHub Token を取得
log "Retrieving GitHub token from Secret Manager..."
export GITHUB_TOKEN=$(gcloud secrets versions access latest --secret="github-token")

if [ -z "$GITHUB_TOKEN" ]; then
    log "Error: Failed to retrieve GitHub token from Secret Manager"
    exit 1
fi

log "Cloning repository..."
git clone https://oauth2:${GITHUB_TOKEN}@github.com/ktak2001/ranking_app2.git
cd ranking_app2 || exit 1

log "Installing Python dependencies..."
cd backend || exit 1
pip3 install -r requirements.txt

log "Running admin tasks script..."
python3 ../scripts/admin_tasks_script.py set_superchats

log "Task completed."