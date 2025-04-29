#!/bin/bash
#
# ────────────────────────────────
#   startup-script.sh  (final)
# ────────────────────────────────
# VM 起動時に
#   1. リポジトリ取得 / 更新
#   2. venv 作成 & 依存インストール
#   3. admin スクリプト実行
#   4. ログを Cloud Storage へ退避
#   5. VM をシャットダウン
#
# ※ 変えるなら BUCKET_NAME / PROJECT_ID くらい

set +e   # 失敗しても最後までログを書きたいので exit しない

## ─── 変数 ───────────────────────────────────────
LOG_FILE="/tmp/startup-script.log"
BUCKET_NAME="set_youtubers_log"
PROJECT_ID="ranking-app-bf2df"
REPO="ranking_app2"
REPO_URL="https://oauth2:$(gcloud secrets versions access latest --secret=github-token)@github.com/ktak2001/${REPO}.git"

VENV_DIR="/opt/venv"
VENV_PY="${VENV_DIR}/bin/python"
VENV_PIP="${VENV_DIR}/bin/pip"

export ENVIRONMENT="production"
export GOOGLE_CLOUD_PROJECT="${PROJECT_ID}"

## ─── 便利関数 ───────────────────────────────────
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $*" | tee -a "${LOG_FILE}"
  logger -p user.info "$*"
}

upload_log() {
  gsutil -q cp "${LOG_FILE}" "gs://${BUCKET_NAME}/logs/startup-$(date +%Y%m%d-%H%M%S).log"
}

## ─── ここから処理 ───────────────────────────────
log "Starting startup script…"

log "Updating apt & installing tools…"
sudo apt-get update -y
sudo apt-get install -y git python3-pip python3-venv

log "Cloning / pulling repository…"
if [[ -d ${REPO} ]]; then
  (cd "${REPO}" && git pull)
else
  git clone "${REPO_URL}"
fi

log "Creating venv & installing Python deps…"
python3 -m venv "${VENV_DIR}"
"${VENV_PIP}" install --no-cache-dir -r "${REPO}/backend/requirements.txt"

log "Running admin task script…"
# 仮想環境に入ったあと
export PYTHONPATH="/ranking_app2/backend:/ranking_app2:${PYTHONPATH}"
"${VENV_PY}" "${REPO}/scripts/set_youtubers.py" 2>&1 | while IFS= read -r line; do
  log "$line"
done
TASK_RC=${PIPESTATUS[0]}

if [[ ${TASK_RC} -ne 0 ]]; then
  log "Task failed with code ${TASK_RC}"
  upload_log
  sudo poweroff
fi

log "Task completed successfully."
upload_log
sudo poweroff
