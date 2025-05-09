from config import YOUTUBE_API_KEY, STRIPE_API_KEY, db, WEB_URL, PROJECT_ID
from utils.youtube_api import YouTubeAPI
from firebase_admin import firestore
from flask import Blueprint, request, abort, jsonify
import requests
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
import time
import sys
from tenacity import retry, stop_after_attempt, wait_exponential, RetryError, retry_if_exception_type
from chat_downloader.errors import NoChatReplay, ChatDisabled, VideoUnavailable, LoginRequired

youtube_api = YouTubeAPI()
tasks_blueprint = Blueprint('tasks', __name__)

logger = logging.getLogger(__name__)

@retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=4, min=30, max=180),
        retry=retry_if_exception_type((requests.exceptions.RequestException, Exception)),
        before_sleep=lambda retry_state: logger.info(f"Retrying get_superchats (attempt {retry_state.attempt_number})")
      )
def get_superchats_with_retry(yt_url):
    try:
        return youtube_api.get_superchats(yt_url)
    except (NoChatReplay, ChatDisabled, VideoUnavailable, LoginRequired) as e:
        error_name = type(e).__name__
        logger.info(f"{error_name}: {str(e)} - {yt_url}")
        return None, error_name
    except Exception as e:
        logger.error(f"Error in get_superchats: {str(e)}")
        raise  # This will trigger the retry

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=30, max=300), retry=retry_if_exception_type(requests.exceptions.RequestException))
def get_supporter_custom_url(supporter_id):
    api_str = f"https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id={supporter_id}&key={YOUTUBE_API_KEY}"
    response = requests.get(api_str)
    response.raise_for_status()
    data = response.json()
    if 'items' in data and len(data['items']) > 0:
        return data['items'][0]['snippet'].get('customUrl', '@')
    else:
        logger.error(f"items not found in data, or no customUrl for supporter_id: {supporter_id}")
    return '@'

def update_supporter(supporter, _year, _month, amount, youtuber_id, video_id, vid_info):
    try:
        supporter_name, supporter_id, supporter_icon_url = (
            supporter[k] for k in ('supporterName', 'supporterId', 'supporterIconUrl')
        )
        new_amount = firestore.Increment(amount)
        youtuber_supporter_ref = db.collection('youtubers').document(youtuber_id).collection('supporters').document(supporter_id)
        supporter_ref = db.collection("supporters").document(supporter_id)
        supporter_doc = supporter_ref.get()
        # logger.info(f"updating supporter {supporter_id} for youtuber {youtuber_id}")
        if not supporter_doc.exists:
            try:
                supporter_custom_url = get_supporter_custom_url(supporter_id)
            except Exception as e:
                logger.error(f"get_supporter_custom_url failed: {e}")
                supporter_custom_url = "__error_getting_custom_url__"
        else:
            supporter_data = supporter_doc.to_dict()
            supporter_custom_url = supporter_data.get('supporterCustomUrl', "@")
        _yyyy_mm = _year + _month
        youtuber_supporter_ref.set({
            "supporterName": supporter_name,
            "supporterId": supporter_id,
            "supporterIconUrl": supporter_icon_url,
            "supporterCustomUrl": supporter_custom_url,
            "totalAmount": new_amount,
            "monthlyAmount": {
                _yyyy_mm: new_amount
            },
            "yearlyAmount": {
                _year: new_amount
            },
        }, merge=True)
        # ★ Supporter → months/donations 追記
        month_ref = db.collection("supporters").document(supporter_id).collection("months").document(_yyyy_mm)
        month_ref.set({"totalAmount": firestore.Increment(amount)}, merge=True)
        month_ref.collection("donations").document(video_id).set({
            "youtuberId": youtuber_id,
            "amount": firestore.Increment(amount),
            "publishedAt": vid_info["publishedAt"],
            "videoTitle": vid_info["title"],
            "thumbnailUrl": vid_info["thumbnailUrl"],
        }, merge=True)
        if not supporter_doc.exists:
            supporter_ref.set({
                "supporterName": supporter_name,
                "supporterId": supporter_id,
                "connectedUser": None,
                "supporterIconUrl": supporter_icon_url,
                "supporterCustomUrl": supporter_custom_url,
            })
        supporter_ref.set({
            "supportedYoutubers": {
                _year: firestore.ArrayUnion([youtuber_id]),
                _yyyy_mm: firestore.ArrayUnion([youtuber_id]),
            },
        }, merge=True)
    except Exception as e:
        logger.error(f"Error in update_supporter: {str(e)}")
        raise  # この例外を再度発生させ、呼び出し元に伝播させる

def update_for_each_video(youtuber_info, vid_info):
    try:
        video_id = vid_info["videoId"]
        published_at = vid_info["publishedAt"]
        _yyyy_mm = "_" + published_at[:7].replace("-", "_")  # e.g. 2025_04

        # superchat 解析
        yt_url = f"https://www.youtube.com/watch?v={video_id}"
        time.sleep(30)
        all_supporters_info, video_total_earning = get_superchats_with_retry(yt_url)
        if all_supporters_info is None:
            error_name = video_total_earning
            db.collection("youtubers").document(youtuber_info['youtuber_id']).set({
                'unnecessaryVideoIds': firestore.ArrayUnion([{
                    'id': video_id,
                    'error': error_name
                }])
            }, merge=True)
            return

        # ★ 動画 Doc 書き込み (VTuber 側)
        db.collection("youtubers").document(youtuber_info["youtuber_id"])\
          .collection("months").document(_yyyy_mm)\
          .set({"totalAmount": firestore.Increment(video_total_earning)}, merge=True)

        db.collection("youtubers").document(youtuber_info["youtuber_id"])\
          .collection("months").document(_yyyy_mm)\
          .collection("videos").document(video_id)\
          .set({
              "videoId": video_id,
              "title": vid_info["title"],
              "thumbnailUrl": vid_info["thumbnailUrl"],
              "publishedAt": published_at,
              "amount": video_total_earning,
          }, merge=True)
        # 既存まとめの後、各サポーター処理へ渡す
        for _, supporter in all_supporters_info.items():
            update_supporter(supporter, '_' + published_at[:4], '_' + published_at[5:7], supporter['amount'], youtuber_info['youtuber_id'], video_id, vid_info)
        db.collection("youtubers").document(
            youtuber_info["youtuber_id"]
        ).set({"videoIds": firestore.ArrayUnion([video_id])}, merge=True)
    except RetryError as e:
        logger.error(f"Failed to process video {video_id} after 5 retries: {str(e)}")
        sys.exit(1)  # スクリプトを終了
    except Exception as e:
        logger.error(f"Unexpected error in update_for_each_video: {str(e)}")
        sys.exit(1)
    finally:
        time.sleep(5)

def set_youtuber_superChats(youtubers, days_back: int = -1):
    today_jst = datetime.now(timezone(timedelta(hours=9)))

    # --- ① until を datetime で統一 ---------------------------
    if days_back == -1:
        until = datetime(2023, 12, 31, tzinfo=timezone(timedelta(hours=9)))
    else:
        until = today_jst - timedelta(days=days_back)
    try:
        for youtuber in youtubers:
            youtuber_id = youtuber.get('youtuberId')
            youtuber_name = youtuber.get('youtuberName')
            if not youtuber_id or not youtuber_name:
                logger.warning(f"Skipping youtuber due to missing data: {youtuber}")
                continue
            logger.info(f"Processing youtuber: {youtuber_name} ({youtuber_id})")

            youtuber_info, video_ids = youtube_api.get_videos_until_date(youtuber_id, until.year, until.month, until.day)
            logger.info(f"Retrieved {len(video_ids)} videos for {youtuber_name}")
            youtuber_id, youtuber_name, youtuber_icon_url, youtuber_custom_url = (
                youtuber_info[k] for k in ('youtuber_id', 'youtuber_name', 'youtuber_icon_url', 'youtuber_custom_url')
            )
            youtuber_ref = db.collection("youtubers").document(youtuber_id)
            youtuber_doc = youtuber_ref.get()
            if not youtuber_doc.exists:
                youtuber_ref.set({
                    "youtuberName": youtuber_name,
                    "totalAmount": 0,
                    "youtuberId": youtuber_id,
                    "videoIds": [],
                    "youtuberIconUrl": youtuber_icon_url,
                    "youtuberCustomUrl": youtuber_custom_url
                }, merge=True)
                youtuber_data = None
            else:
                youtuber_ref.set({
                    "youtuberName": youtuber_name,
                    "youtuberId": youtuber_id,
                    "youtuberIconUrl": youtuber_icon_url,
                    "youtuberCustomUrl": youtuber_custom_url
                }, merge=True)
                # 後で上の行消す
                youtuber_data = youtuber_doc.to_dict()
            processed_video_ids = youtuber_data.get('videoIds', []) if youtuber_data is not None else []
            unnecessary_video_ids = [item['id'] for item in youtuber_data.get('unnecessaryVideoIds', [])] if youtuber_data is not None else []


            for vid_id in video_ids:
                if youtuber_data is None or vid_id not in (processed_video_ids + unnecessary_video_ids):
                    logger.info(f"trying to process {youtuber_name}'s video: {vid_id}")
                    vid_info = youtube_api.get_video_details(vid_id)
                    vid_info_raw = vid_info["raw"]
                    if vid_info_raw.get('liveStreamingDetails') is None or vid_info_raw['snippet']['liveBroadcastContent'] == 'live' or vid_info_raw['liveStreamingDetails'].get('actualEndTime') is None:
                        logger.info(f"{youtuber_name}'s video: {vid_id} is not live streaming, or still onlive")
                        continue
                    logger.info(f"Updating {youtuber_name}'s video: {vid_id}")
                    update_for_each_video(youtuber_info, vid_info)
                else:
                    logger.info(f"{youtuber_name}'s video: {vid_id} was already processed")
        return {"success": True}
    except KeyError as e:
        logger.error(f"KeyError in set_youtuber_superChats: {str(e)}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Critical error in set_youtuber_superChats: {str(e)}")
        sys.exit(1)  # スクリプトを終了