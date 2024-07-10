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
export ENVIRONMENT="production"
export GOOGLE_CLOUD_PROJECT="ranking-app-bf2df"

# システムの更新とツールのインストール
log "Updating system and installing necessary tools..."
sudo apt-get update
sudo apt-get install -y git python3-pip

# Secret Manager から GitHub Token を取得
log "Retrieving GitHub token from Secret Manager..."
export GITHUB_TOKEN=$(gcloud secrets versions access latest --secret="github-token")

if [ -z "$GITHUB_TOKEN" ]; then
    log "Error: Failed to retrieve GitHub token from Secret Manager"
    exit 1
fi

log "Checking for existing repository..."
if [ -d "ranking_app2" ]; then
    log "Existing repository found. Updating..."
    cd ranking_app2
    git pull
else
    log "Cloning repository..."
    git clone https://oauth2:${GITHUB_TOKEN}@github.com/ktak2001/ranking_app2.git
    cd ranking_app2
fi

log "Installing Python dependencies..."
cd backend
pip3 install -r requirements.txt

log "Running admin tasks script..."
export PYTHONPATH="/ranking_app2/backend:$PYTHONPATH"
cd /ranking_app2/backend
ENVIRONMENT=production GOOGLE_CLOUD_PROJECT=ranking-app-bf2df python3 ../scripts/set_youtubers.py 2>&1 | tee -a "$LOG_FILE"

log "Task completed."
sudo poweroff