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

## Developing

When new module is imported, always run the following command to install the module to the `requirements.txt` file:

```bash
pip3 freeze > requirements.txt
```

## Deployment Script

```bash
# just execute this command
gcloud builds submit --config cloudbuild.yaml
```

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
