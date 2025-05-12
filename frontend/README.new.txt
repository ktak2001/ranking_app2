env for firebase:
firebase functions:secrets:set FB_PRIVATE_KEY "$(cat private_key.pem)"
firebase functions:secrets:set FB_CLIENT_EMAIL "firebase-adminsdk-xxx@ranking-app-bf2df.iam.gserviceaccount.com"


localでdevelop:

npm run dev

deploy:

1. npm run build

2. firebase login --reauth

3. firebase deploy --only hosting