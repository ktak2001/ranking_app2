#!/bin/bash
PROJECT_ID=$(gcloud config get-value project)
gcloud run deploy backend \
--image gcr.io/${PROJECT_ID}/backend \
--platform managed \
--region asia-northeast1 \
--set-env-vars WEB_URL=https://ranking-app-bf2df.firebaseapp.com,GOOGLE_CLOUD_PROJECT=${PROJECT_ID} \
--set-secrets=FIREBASE_CREDENTIALS=FIREBASE_CREDENTIALS:latest,YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,STRIPE_API_KEY=STRIPE_API_KEY:latest