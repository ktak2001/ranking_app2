from config import YOUTUBE_API_KEY, STRIPE_API_KEY, db, WEB_URL, ADMIN_USERNAME, ADMIN_PASSWORD, API_KEY
from utils.youtube_api import YouTubeAPI
from utils.common import pretty_json, getFilePath, read_from_json_file, write_into_file, get_currency_json, update_one_supporter
from firebase_admin import firestore
from flask import Blueprint, request, abort, jsonify
from functools import wraps
import requests
import hashlib
import hmac
from datetime import datetime, timedelta

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

def update_for_each_video(youtuber_info, video):
    video_info = {
        "_year": '_' + (video['snippet']['publishedAt'])[:4],
        "_month": '_' + (video['snippet']['publishedAt'])[5:7],
        "video_id": video['id']
    }
    yt_url = f'https://www.youtube.com/watch?v={video["id"]}'
    youtuber_doc = db.collection("youtubers").document(youtuber_info['youtuber_id']).get().to_dict()
    if youtuber_doc is None or video['id'] not in youtuber_doc.get('video_ids', []):
        all_supporters_info, video_total_earning = youtube_api.get_superchats(yt_url)
        video_info['video_total_earning'] = video_total_earning
        update_doc(youtuber_info, video_info, all_supporters_info)

def update_doc(youtuber_info, video_info, all_supporters_info):
    youtuber_id, youtuber_name, youtuber_icon_url, youtuber_custom_url = (
        youtuber_info[k] for k in ('youtuber_id', 'youtuber_name', 'youtuber_icon_url', 'youtuber_custom_url')
    )
    video_id = video_info['video_id']
    _year = video_info['_year']
    _month = video_info['_month']
    video_total_earning = video_info['video_total_earning']

    youtuber_ref = db.collection("youtubers").document(youtuber_id)
    youtuber_doc = youtuber_ref.get()
    if not youtuber_doc.exists:
        youtuber_ref.set({
            "youtuberName": youtuber_name,
            "totalAmount": video_total_earning,
            "youtuberId": youtuber_id,
            "videoIds": [video_id],
            "youtuberIconUrl": youtuber_icon_url,
            "youtuberCustomUrl": youtuber_custom_url
        })
    elif video_id in youtuber_doc.to_dict().get('videoIds', []):
        print("already took the chats for this videoId", video_id)
        return
    else:
        youtuber_ref.set({
            "videoIds": firestore.ArrayUnion([video_id]),
            "totalAmount": firestore.Increment(video_total_earning)
        }, merge=True)
    youtuber_summary_year_ref = youtuber_ref.collection("summary").document(_year)
    youtuber_summary_year_ref.set({
        "totalAmount": firestore.Increment(video_total_earning),
        "monthlyAmount": {
            _month: firestore.Increment(video_total_earning)
        }
    }, merge=True)
    for _, supporter in all_supporters_info.items():
        api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id={0}&key={1}"
        deet = api_str.format(supporter['supporterId'], YOUTUBE_API_KEY)
        z = requests.get(deet).json()
        supporter['supporterCustomUrl'] = z['items'][0]['snippet']['customUrl']
        update_one_supporter(supporter, _year, _month, supporter['amount'], youtuber_id)

@tasks_blueprint.route('/admin/set_youtuber_superchats', methods=['POST'])
def set_youtuber_superChats():
    data = request.get_json()
    if not authenticate_admin(request):
        abort(401)
    youtubers = data['youtubers']
    for youtuber in youtubers:
        youtuber_id = youtuber['youtuberId']
        youtuber_name = youtuber['youtuberName']
        youtuber_info, video_ids = youtube_api.get_videos_until_date(youtuber_id, 2024, 3, 31)
        all_vid_infos = youtube_api.process_videos(video_ids)
        for vid in all_vid_infos:
            if vid.get('liveStreamingDetails') == None or vid['snippet']['liveBroadcastContent'] == 'live' or vid['liveStreamingDetails'].get('actualEndTime') == None:
                continue
            print(f"Updating {youtuber_name}'s video: {vid['id']}")
            update_for_each_video(youtuber_info, vid)
    return {"success": True}

@tasks_blueprint.route('/tasks/update_youtubers', methods=['GET'])
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
