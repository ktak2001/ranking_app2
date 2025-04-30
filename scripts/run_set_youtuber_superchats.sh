#!/bin/bash
set -euo pipefail

cd /Users/takehikazuki/Desktop/my_app3/ranking_app

# 変更をステージングしてコミット
git add .
git commit -m "Auto sync before superchats run" || echo "No changes to commit"

# リモートへプッシュ
git push

cd /Users/takehikazuki/Desktop/my_app3/ranking_app/scripts
# ───────────────────────────────
# 変数
# ───────────────────────────────
INSTANCE="set-youtuber-superchats"
ZONE="asia-northeast1-a"
PROJECT="ranking-app-bf2df"
STARTUP_SCRIPT="/Users/takehikazuki/Desktop/my_app3/ranking_app/scripts/startup-script.sh"

LOG_FILE="/tmp/startup-script.log"
DONE_MARK="Task completed successfully."
TIMEOUT_SEC=$((48*60*60))     # 48 時間

# ───────────────────────────────
# 共通関数
# ───────────────────────────────
stop_instance() {
  echo "Stopping instance ..."
  gcloud compute instances stop "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" || true
}

trap stop_instance EXIT        # スクリプトが落ちても必ず停止

# ───────────────────────────────
# 1) インスタンスを用意
# ───────────────────────────────
if ! gcloud compute instances describe "${INSTANCE}" \
        --zone="${ZONE}" --project="${PROJECT}" &>/dev/null; then
  echo "Instance '${INSTANCE}' not found. Creating ..."
  gcloud compute instances create "${INSTANCE}" \
    --zone="${ZONE}" --project="${PROJECT}" \
    --machine-type=e2-standard-4 \
    --service-account="firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com" \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --metadata-from-file startup-script="${STARTUP_SCRIPT}"
else
  echo "Instance exists. Updating startup-script metadata ..."
  gcloud compute instances add-metadata "${INSTANCE}" \
    --metadata-from-file startup-script="${STARTUP_SCRIPT}" \
    --zone="${ZONE}" --project="${PROJECT}"
fi

# ───────────────────────────────
# 2) 起動
# ───────────────────────────────
echo "Starting instance ..."
gcloud compute instances start "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}"

# ───────────────────────────────
# 3) SSH が開くまで待つ
# ───────────────────────────────
echo -n "Waiting for SSH"
until gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" --command="echo ok" &>/dev/null; do
  echo -n "."
  sleep 5
done
echo " connected."

# ───────────────────────────────
# 4) ログファイル生成を待つ
# ───────────────────────────────
echo -n "Waiting for ${LOG_FILE}"
until gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="test -f ${LOG_FILE}" &>/dev/null; do
  echo -n "."
  sleep 5
done
echo " found."

# ───────────────────────────────
# 5) ログをストリームしつつ DONE_MARK を待つ
# ───────────────────────────────
gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="tail -F ${LOG_FILE}" &
TAIL_PID=$!

echo "Streaming log. Waiting for completion mark (timeout: 48h) …"

# タイムアウト付きループ
START_TIME=$(date +%s)
while true; do
  if gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="grep -qF '${DONE_MARK}' ${LOG_FILE}" &>/dev/null; then
    echo "DONE_MARK detected."
    break
  fi
  NOW=$(date +%s)
  if (( NOW - START_TIME > TIMEOUT_SEC )); then
    echo "⚠️  48-hour timeout reached. Forcing shutdown."
    break
  fi
  sleep 10
done

# ログ tail を止める
kill "${TAIL_PID}" 2>/dev/null || true
wait   "${TAIL_PID}" 2>/dev/null || true

# ───────────────────────────────
# 6) インスタンス停止  (trap でも実行されるが念のため)
# ───────────────────────────────
stop_instance
echo "All done 🎉"
