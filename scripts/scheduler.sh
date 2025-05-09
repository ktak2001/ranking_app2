# ① 毎日 set_youtubers.py
gcloud beta run jobs create update-videos-job \
  --image gcr.io/$PROJECT_ID/ranking-app-jobs \
  --command python --args /app/scripts/update_videos.py \
  --task-timeout 18000 --region asia-northeast1 \
  --service-account cloud-run-jobs-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --max-retries 1

# ② 週１ vtuber プロフィール更新
gcloud beta run jobs create update-vtubers-job \
  --image gcr.io/$PROJECT_ID/ranking-app-jobs \
  --command python --args /app/scripts/update_vtubers_profile.py \
  --task-timeout 18000 --region asia-northeast1 \
  --service-account cloud-run-jobs-sa@$PROJECT_ID.iam.gserviceaccount.com

# ③ ２週１ supporter プロフィール更新
gcloud beta run jobs create update-supporters-job \
  --image gcr.io/$PROJECT_ID/ranking-app-jobs \
  --command python --args /app/scripts/update_supporters_profile.py \
  --task-timeout 18000 --region asia-northeast1 \
  --service-account cloud-run-jobs-sa@$PROJECT_ID.iam.gserviceaccount.com
