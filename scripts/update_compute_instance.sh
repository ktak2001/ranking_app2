#!/bin/bash

INSTANCE_NAME="set-youtuber-superchats"
ZONE="asia-northeast1-a"

# インスタンスを起動
gcloud compute instances start $INSTANCE_NAME --zone=$ZONE

# インスタンスの起動を待つ
while [[ $(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='value(status)') != "RUNNING" ]]; do
  sleep 5
done

# スタートアップスクリプトの完了を待つ
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="tail -f /tmp/startup-script.log" &
TAIL_PID=$!

# "Task completed." が出力されるまで待つ
while ! gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="grep 'Task completed.' /tmp/startup-script.log"; do
  sleep 10
done

# tail プロセスを終了
kill $TAIL_PID

# インスタンスを停止
gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE

echo "Process completed and instance stopped."