# YouTube Superchats プロジェクト運用ガイド

## インスタンス管理

### スタートアップスクリプトの更新

gcloud compute instances add-metadata set-youtuber-superchats \
--metadata-from-file startup-script=./startup-script.sh \
--zone=asia-northeast1-a

### インスタンスの操作

- 起動:
  gcloud compute instances start set-youtuber-superchats --zone=asia-northeast1-a

- SSH接続:
  gcloud compute ssh set-youtuber-superchats --zone=asia-northeast1-a

- 停止:
  - インスタンス内から: sudo poweroff
  - インスタンス外から:
    gcloud compute instances stop set-youtuber-superchats --zone=asia-northeast1-a

## ログの確認

インスタンス内でスタートアップスクリプトのログを確認:
tail -f /tmp/startup-script.log

## コード更新手順

1. コードを変更
2. 変更をコミット:
   git add .
   git commit -m "update"

3. リモートリポジトリにプッシュ:
   git push

注意: 常に最新のgcloudコマンドを使用していることを確認してください。
