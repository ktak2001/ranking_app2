## スケジューラ作成方法
##1: dockerfile build
cd /Users/takehikazuki/Desktop/my_app3/ranking_app/

gcloud builds submit --tag gcr.io/ranking-app-bf2df/ranking-app-jobs:latest .

## 2 cloud run job 作成
# ① 毎日：動画集計
gcloud beta run jobs create update-videos-job \
  --image gcr.io/ranking-app-bf2df/ranking-app-jobs:latest \
  --region asia-northeast1 \
  --command python \
  --args scripts/update_videos.py \
  --task-timeout 18000 \
  --service-account firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com

# ② 週1：VTuber プロフィール
gcloud beta run jobs create update-vtubers-job \
  --image gcr.io/ranking-app-bf2df/ranking-app-jobs:latest \
  --region asia-northeast1 \
  --command python \
  --args scripts/update_vtubers_profile.py \
  --task-timeout 18000 \
  --service-account firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com

# ③ 2週1：Supporter プロフィール
gcloud beta run jobs create update-supporters-job \
  --image gcr.io/ranking-app-bf2df/ranking-app-jobs:latest \
  --region asia-northeast1 \
  --command python \
  --args scripts/update_supporters_profile.py \
  --task-timeout 18000 \
  --service-account firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com

## scheduler 作成
# a) 毎日 03:00 JST (18:00 UTC 前日)
gcloud scheduler jobs create http update_videos_everyday \
  --location asia-northeast1 \
  --schedule "0 3 * * *" \
  --uri "https://run.googleapis.com/v2/projects/ranking-app-bf2df/locations/asia-northeast1/jobs/update-videos-job:run" \
  --http-method POST \
  --oidc-service-account-email firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com

# b) 週1 (月曜 04:30 JST)
gcloud scheduler jobs create http update_vtubers_weekly \
  --location asia-northeast1 \
  --schedule "30 4 * * 1" \
  --uri "https://run.googleapis.com/v2/projects/ranking-app-bf2df/locations/asia-northeast1/jobs/update-vtubers-job:run" \
  --http-method POST \
  --oidc-service-account-email firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com

# c) 2週1 (毎月1日 & 15日 05:00 JST)
gcloud scheduler jobs create http update_supporters_biweekly \
  --location asia-northeast1 \
  --schedule "0 5 1,15 * *" \
  --uri "https://run.googleapis.com/v2/projects/ranking-app-bf2df/locations/asia-northeast1/jobs/update-supporters-job:run" \
  --http-method POST \
  --oidc-service-account-email firebase-adminsdk-vtb8n@ranking-app-bf2df.iam.gserviceaccount.com
