#!/bin/bash

cd /Users/takehikazuki/Desktop/my_app3/ranking_app
git add .
git commit -m "update"
git push

gcloud compute instances add-metadata set-youtuber-superchats \
--metadata-from-file startup-script=/Users/takehikazuki/Desktop/my_app3/ranking_app/scripts/startup-script.sh \
--zone=asia-northeast1-a

gcloud compute instances start set-youtuber-superchats --zone=asia-northeast1-a