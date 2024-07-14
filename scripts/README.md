startup-scripts.shの変更を反映:
gcloud compute instances add-metadata set-youtuber-superchats \
--metadata-from-file startup-script=./startup-script.sh \
--zone=asia-northeast1-a

コードを変更した後:
git add .
git commit -m "update"
git push

instanceを起動:
gcloud compute instances start set-youtuber-superchats --zone=asia-northeast1-a

ssh接続:
gcloud compute ssh set-youtuber-superchats --zone=asia-northeast1-a

instance内でログを見る:
tail -f /tmp/startup-script.log

instance内でinstance停止:
sudo poweroff

instance外でinstance停止:
gcloud compute instances stop set-youtuber-superchats --zone=asia-northeast1-a