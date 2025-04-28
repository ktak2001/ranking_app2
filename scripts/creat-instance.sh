#!/bin/bash

##### 変数 ##############################################################
INSTANCE="set-youtuber-superchats"
ZONE="asia-northeast1-a"
PROJECT="ranking-app-bf2df"
STARTUP_SCRIPT="/Users/takehikazuki/Desktop/my_app3/ranking_app/scripts/startup-script.sh"
LOG_FILE="/tmp/startup-script.log"
DONE_MARK="Task completed successfully."

##### 1) インスタンスが無ければ作成 ######################################

gcloud compute instances create "${INSTANCE}" \
  --zone="${ZONE}" --project="${PROJECT}" \
  --machine-type=e2-standard-4 \
  --service-account="compute-engine-sa@${PROJECT}.iam.gserviceaccount.com" \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --metadata-from-file startup-script="${STARTUP_SCRIPT}"