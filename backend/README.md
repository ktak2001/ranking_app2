# Backend Deployment Guide

This guide explains how to deploy the backend service to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- Necessary permissions to deploy to Google Cloud Run

## Environment Setup

Set your project ID:

```bash
export PROJECT_ID=ranking-app-bf2df
```

## Deployment Script

## Deployment Using Cloud Build

To deploy the backend service using Cloud Build, execute the following command:

Save the following script as `deploy.sh` in your backend directory:

```bash
#!/bin/bash
set -e

# Get the project ID
PROJECT_ID=$(gcloud config get-value project)

# Build and push the Docker image
docker build -t gcr.io/${PROJECT_ID}/backend .
docker push gcr.io/${PROJECT_ID}/backend

# Deploy to Cloud Run
gcloud run deploy backend \
  --image gcr.io/${PROJECT_ID}/backend \
  --platform managed \
  --region asia-northeast1 \
  --set-env-vars WEB_URL=https://ranking-app-bf2df.firebaseapp.com,GOOGLE_CLOUD_PROJECT=${PROJECT_ID} \
  --set-secrets=FIREBASE_CREDENTIALS=FIREBASE_CREDENTIALS:latest,YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,STRIPE_API_KEY=STRIPE_API_KEY:latest

echo "Deployment completed successfully!"
```

## Usage

To deploy the backend service, run:

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will build the Docker image, push it to Google Container Registry, and deploy it to Cloud Run.

## Notes

- Ensure all necessary secrets (FIREBASE_CREDENTIALS, YOUTUBE_API_KEY, STRIPE_API_KEY) are set up in Google Secret Manager.
- The `WEB_URL` environment variable is set to the Firebase hosting URL. Update this if your frontend URL changes.
- The deployment region is set to `asia-northeast1`. Adjust this if you need to deploy to a different region.
