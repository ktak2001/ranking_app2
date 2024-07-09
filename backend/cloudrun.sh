gcloud run deploy backend \
--image gcr.io/$PROJECT_ID/backend \
--platform managed \
--region asia-northeast1 \
--set-env-vars WEB_URL=https://ranking-app-bf2df.firebaseapp.com,API_KEY=iuhashfkuashefasiufhoasuefoaeasoiflfeas,ADMIN_USERNAME=kazuki_takehi,ADMIN_PASSWORD=a8f5f167f44f4964e6c998dee827110c,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
--set-secrets=FIREBASE_CREDENTIALS=FIREBASE_CREDENTIALS:latest,YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,STRIPE_API_KEY=STRIPE_API_KEY:latest