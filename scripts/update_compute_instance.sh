gcloud compute instances add-metadata set-youtuber-superchats \
--metadata-from-file startup-script=/Users/takehikazuki/Desktop/my_app3/ranking_app/scripts/startup-script.sh \
--zone=asia-northeast1-a

gcloud compute instances stop set-youtuber-superchats --zone=asia-northeast1-a
gcloud compute instances start set-youtuber-superchats --zone=asia-northeast1-a

gcloud compute ssh set-youtuber-superchats --zone=asia-northeast1-a

sudo cat /var/log/syslog | grep startup-script

tail -f /tmp/startup-script.log