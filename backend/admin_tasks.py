from config import YOUTUBE_API_KEY, STRIPE_API_KEY, db, WEB_URL, ADMIN_USERNAME, ADMIN_PASSWORD, API_KEY, PROJECT_ID
from utils.youtube_api import YouTubeAPI
from utils.common import pretty_json, getFilePath, read_from_json_file, write_into_file, get_currency_json, update_one_supporter
from firebase_admin import firestore
from flask import Blueprint, request, abort, jsonify
import requests
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from google.api_core import retry
import time
from tenacity import retry, stop_after_attempt, wait_exponential, RetryError
import sys

youtube_api = YouTubeAPI()
tasks_blueprint = Blueprint('tasks', __name__)


@tasks_blueprint.route('/tasks/update_currency', methods=['GET'])
def update_currency():
    currency_res = requests.get("https://v6.exchangerate-api.com/v6/efa278f126f16633add02fb6/latest/JPY")
    currency_json = currency_res.json()
    currency_json['conversion_rates']['₫'] = currency_json['conversion_rates']['VND']
    currency_json['conversion_rates']['₱'] = currency_json['conversion_rates']['PHP']
    db.collection('currency').document('latest').set(currency_json)
    return {
        "updated": True
    }

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=5, max=60))
def get_superchats_with_retry(yt_url):
    return youtube_api.get_superchats(yt_url)

def update_for_each_video(youtuber_info, video):
    video_info = {
        "_year": '_' + (video['snippet']['publishedAt'])[:4],
        "_month": '_' + (video['snippet']['publishedAt'])[5:7],
        "video_id": video['id']
    }
    yt_url = f'https://www.youtube.com/watch?v={video["id"]}'
    youtuber_doc = db.collection("youtubers").document(youtuber_info['youtuber_id']).get().to_dict()
    if youtuber_doc is None or video['id'] not in youtuber_doc.get('videoIds', []):
        try:
            all_supporters_info, video_total_earning = get_superchats_with_retry(yt_url)
            video_info['video_total_earning'] = video_total_earning
            update_doc(youtuber_info, video_info, all_supporters_info)
        except RetryError as e:
            logging.error(f"Failed to process video {video['id']} after 5 retries: {str(e)}")
            raise  # この例外を再度発生させ、呼び出し元に伝播させる
        finally:
            time.sleep(5)

def update_supporter(supporter, _year, _month, amount, youtuber_id, processing_youtubers_video_ref, processing_youtubers_video_data, is_processing):
    supporter_name, supporter_id, supporter_icon_url = (
        supporter[k] for k in ('supporterName', 'supporterId', 'supporterIconUrl')
    )
    new_amount = firestore.Increment(amount)
    youtuber_supporter_ref = db.collection('youtubers').document(youtuber_id).collection('supporters').document(supporter_id)
    supporter_ref = db.collection("supporters").document(supporter_id)
    supporter_doc = supporter_ref.get().exists
    if not supporter_doc.exists:
        supporter_custom_url = get_supporter_custom_url(supporter_id)
    else:
        supporter_custom_url = supporter_doc.get('supporterCustomUrl', "@")
    if is_processing and supporter_id in processing_youtubers_video_data.get("youtuberSupporterRef", []):
        return
    youtuber_supporter_ref.set({
        "supporterName": supporter_name,
        "supporterId": supporter_id,
        "supporterIconUrl": supporter_icon_url,
        "supporterCustomUrl": supporter_custom_url,
        "totalAmount": new_amount,
        "monthlyAmount": {
            _year + _month: new_amount
        },
        "yearlyAmount": {
            _year: new_amount
        },
    }, merge=True)
    processing_youtubers_video_ref.set({
        "youtuberSupporterRef": firestore.ArrayUnion([supporter_id])
    }, merge=True)
    if is_processing and supporter_id in processing_youtubers_video_data.get("supporterRef", []):
        return
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
            _year + _month: firestore.ArrayUnion([youtuber_id]),
        },
    }, merge=True)
    processing_youtubers_video_ref.set({
        "supporterRef": firestore.ArrayUnion([supporter_id])
    }, merge=True)
    # logging.info(f"processing_supporter: {supporter}")

def get_supporter_custom_url(supporter_id):
    api_str = f"https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id={supporter_id}&key={YOUTUBE_API_KEY}"
    response = requests.get(api_str)
    response.raise_for_status()
    return response['items'][0]['snippet']['customUrl']

def update_doc(youtuber_info, video_info, all_supporters_info):
    youtuber_id, youtuber_name, youtuber_icon_url, youtuber_custom_url = (
        youtuber_info[k] for k in ('youtuber_id', 'youtuber_name', 'youtuber_icon_url', 'youtuber_custom_url')
    )
    video_id = video_info['video_id']
    _year = video_info['_year']
    _month = video_info['_month']
    video_total_earning = video_info['video_total_earning']
    processing_youtubers_ref = db.collection("processing_youtubers").document(youtuber_id)
    processing_youtubers_ref.set({
        "processed": firestore.ArrayUnion([video_id])
    }, merge=True)
    processing_youtubers_video_ref = processing_youtubers_ref.collection("videos").document(video_id)
    processing_youtubers_video_doc = processing_youtubers_video_ref.get()
    is_processing = processing_youtubers_video_doc.exists
    processing_youtubers_video_data = processing_youtubers_video_doc.to_dict() if is_processing else {}
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
        })
    logging.info(f"is_processing: {is_processing}, {youtuber_id}, {video_id}")
    if not is_processing:
        youtuber_ref.set({
            "totalAmount": firestore.Increment(video_total_earning)
        }, merge=True)
        processing_youtubers_video_ref.set({
            "summary": False,
            "youtuberSupporterRef": [],
            "supporterRef": []
        })
        logging.info(f"set is_processing, {youtuber_id}, {video_id}")
    if not is_processing or not processing_youtubers_video_data.get("summary", False):
        youtuber_summary_year_ref = youtuber_ref.collection("summary").document(_year)
        youtuber_summary_year_ref.set({
            "totalAmount": firestore.Increment(video_total_earning),
            "monthlyAmount": {
                _month: firestore.Increment(video_total_earning)
            }
        }, merge=True)
        processing_youtubers_video_ref.set({
            "summary": True
        }, merge=True)
    for _, supporter in all_supporters_info.items():
        update_supporter(supporter, _year, _month, supporter['amount'], youtuber_id, processing_youtubers_video_ref, processing_youtubers_video_data, is_processing)
    youtuber_ref.set({
        "videoIds": firestore.ArrayUnion([video_id])
    }, merge=True)
    processing_youtubers_video_ref.delete()

def set_youtuber_superChats(youtubers):
    try:
        for youtuber in youtubers:
            youtuber_id = youtuber['youtuberId']
            youtuber_name = youtuber['youtuberName']
            logging.info(f"Processing youtuber: {youtuber_name} ({youtuber_id})")
            
            youtuber_info, video_ids = youtube_api.get_videos_until_date(youtuber_id, 2024, 3, 31)
            logging.info(f"Retrieved {len(video_ids)} videos for {youtuber_name}")
            
            for vid_id in video_ids:
                vid_info = youtube_api.get_video_details(vid_id)
                if vid_info.get('liveStreamingDetails') is None or vid_info['snippet']['liveBroadcastContent'] == 'live' or vid_info['liveStreamingDetails'].get('actualEndTime') is None:
                    continue
                logging.info(f"Updating {youtuber_name}'s video: {vid_id}")
                update_for_each_video(youtuber_info, vid_info)
        
        return {"success": True}
    except Exception as e:
        logging.error(f"Error in set_youtuber_superChats: {str(e)}")
        return {"error": str(e)}

# @tasks_blueprint.route('/tasks/update_youtubers', methods=['GET'])
def update_youtubers():
    youtubers_docs = db.collection('youtubers').stream()
    for youtuber in youtubers_docs:
        today = datetime.today() - timedelta(days=5)
        youtuber_info, video_ids = youtube_api.get_videos_until_date(youtuber.id, today.year, today.month, today.day)
        all_vid_infos = youtube_api.process_videos(video_ids)
        for vid in all_vid_infos:
            if vid.get('liveStreamingDetails') == None or vid['snippet']['liveBroadcastContent'] == 'live' or vid['liveStreamingDetails'].get('actualEndTime') == None:
                continue
            update_for_each_video(youtuber_info, vid)
    return {"success": True}

@tasks_blueprint.route('/admin/manual_update', methods=['POST'])
def manual_update():
    if not authenticate_admin(request):
        abort(401)
    pass

def authenticate_admin(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return False

    import base64
    try:
        auth_decoded = base64.b64decode(auth_header.split()[1]).decode('utf-8')
        username, password = auth_decoded.split(':')
    except (IndexError, ValueError):
        return False

    if username != ADMIN_USERNAME:
        return False

    password_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    expected_hash = hashlib.sha256(ADMIN_PASSWORD.encode('utf-8')).hexdigest()

    return hmac.compare_digest(password_hash, expected_hash)