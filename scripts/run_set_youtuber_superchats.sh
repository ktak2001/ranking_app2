#!/bin/bash
set -euo pipefail

##### 変数 ##############################################################
INSTANCE="set-youtuber-superchats"
ZONE="asia-northeast1-a"
PROJECT="ranking-app-bf2df"
STARTUP_SCRIPT="/Users/takehikazuki/Desktop/my_app3/ranking_app/scripts/startup-script.sh"
LOG_FILE="/tmp/startup-script.log"
DONE_MARK="Task completed successfully."

##### 1) インスタンスが無ければ作成 ######################################
if ! gcloud compute instances describe "${INSTANCE}" \
        --zone="${ZONE}" --project="${PROJECT}" &>/dev/null; then
  echo "Instance '${INSTANCE}' not found. Creating..."
  gcloud compute instances create "${INSTANCE}" \
    --zone="${ZONE}" --project="${PROJECT}" \
    --machine-type=e2-standard-4 \
    --service-account="firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com" \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --metadata-from-file startup-script="${STARTUP_SCRIPT}"
else
  # 既存ならメタデータだけ更新
  gcloud compute instances add-metadata "${INSTANCE}" \
    --metadata-from-file startup-script="${STARTUP_SCRIPT}" \
    --zone="${ZONE}" --project="${PROJECT}"
fi

##### 2) インスタンス起動 ################################################
echo "Starting instance..."
gcloud compute instances start "${INSTANCE}" \
  --zone="${ZONE}" --project="${PROJECT}"

##### 3) SSH が開くまで待つ #############################################
echo -n "Waiting for SSH to become available"
until gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="echo ok" &>/dev/null; do
  echo -n "."
  sleep 5
done
echo " connected."

##### 4) 起動ログが出来るまで待つ #######################################
echo -n "Waiting for ${LOG_FILE}"
until gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="test -f ${LOG_FILE}" &>/dev/null; do
  echo -n "."
  sleep 5
done
echo " found."

##### 5) ログを追いながら DONE_MARK を監視 ###############################
gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="tail -F ${LOG_FILE}" &
TAIL_PID=$!

echo "Streaming log. Waiting for completion mark..."
until gcloud compute ssh "${INSTANCE}" --zone="${ZONE}" --project="${PROJECT}" \
        --command="grep -q '${DONE_MARK}' ${LOG_FILE}" &>/dev/null; do
  sleep 10
done
echo "Startup-script finished."

kill ${TAIL_PID} || true

##### 6) インスタンス停止 ###############################################
echo "Stopping instance..."
gcloud compute instances stop "${INSTANCE}" \
  --zone="${ZONE}" --project="${PROJECT}"

echo "All done 🎉"
