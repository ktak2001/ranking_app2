from chat_downloader import ChatDownloader;
import numpy as np
import pandas as pd
import requests
from pprint import pp
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import json
from flask import Flask
from flask_cors import CORS
from flask import request, make_response, jsonify, Flask, redirect
import os
import stripe
from datetime import datetime
from dotenv import load_dotenv
from google.cloud import secretmanager
import logging

app = Flask(__name__)

CORS(app)

def pretty_json(data):
  return json.dumps(data, indent = 4, ensure_ascii=False)

def log_env_vars():
    env_vars = {key: value for key, value in os.environ.items()}
    env_vars['PORT'] = os.environ.get('PORT', 'Not Set')
    logging.info("Environment Variables: %s", pretty_json(env_vars))

log_env_vars()



load_dotenv()
# print("\nAfter loading .env.local:")
# print(dict(os.environ))



def getFilePath(fileName):
  return os.path.join(os.path.dirname(__file__), fileName)

is_app_engine = os.environ.get('GAE_ENV', '').startswith('standard')

# Function to access secrets from Secret Manager
def access_secret_version(project_id, secret_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

if is_app_engine:
    project_id = os.environ.get('GOOGLE_CLOUD_PROJECT')
    if not project_id:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is not set")
    YOUTUBE_API_KEY = access_secret_version(project_id, "YOUTUBE_API_KEY")
    STRIPE_API_KEY = access_secret_version(project_id, "STRIPE_API_KEY")
    firebase_admin.initialize_app()
else:
    # Running locally, use service account credentials
    cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
    firebase_admin.initialize_app(cred)
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
    STRIPE_API_KEY = os.getenv('STRIPE_API_KEY')

stripe.api_key = STRIPE_API_KEY
db = firestore.client()

WEB_URL=os.getenv('WEB_URL')

@app.route("/api/app_engine")
def test_app_engine():
  return jsonify({"message": True})

@app.route("/api/dump_currency_data")
def send_currency_to_file():

  currency_res = requests.get("https://v6.exchangerate-api.com/v6/efa278f126f16633add02fb6/latest/JPY")
  currency_json = currency_res.json()
  currency_json['conversion_rates']['₫'] = currency_json['conversion_rates']['VND']
  currency_json['conversion_rates']['₱'] = currency_json['conversion_rates']['PHP']
  # print(json.dumps(currency_json, indent=4, ensure_ascii=False))
  with open(getFilePath('currency.json'), 'w') as currency_file:
    json.dump(currency_json, currency_file, indent = 4)

def read_from_json_file(file_name):
  with open(file_name, 'r') as tmp_file:
    res = json.load(tmp_file)
  return res

def write_into_file(source, target_file_name):
  with open(target_file_name, 'w') as target:
    json.dump(source, target, indent = 4)

@app.route("/api/check_file")
def get_currency_from_file():
  with open(getFilePath('currency.json'), 'r') as currency_file:
    return json.load(currency_file)

currency_json = get_currency_from_file()

@app.route("/api/test_superchats")
def test_superchats():
  get_superchats("https://www.youtube.com/watch?v=8Ugr2GSb2Ec")
  return {
    "success": True
  }

def get_superchats(url):
  try:
    chat = ChatDownloader().get_chat(url, message_groups=["superchat"])
  except Exception as err:
    print(f"error: {err=}")
    raise
  total_superchat_earnings = 0.0
  # chat_list = []
  res = {}
  for i, message in enumerate(chat):
    if message['message_type'] == 'paid_message' or message['message_type'] == 'paid_sticker':
      print("message", pretty_json(message))
      message_money = int(message['money']['amount'])
      message_currency = message['money']['currency']
      jpn_msg = message_money / currency_json["conversion_rates"][message_currency]
      total_superchat_earnings += jpn_msg
      # chat_list.append(message)
      supporterId = message["author"]["id"]
      obj = {
        "supporterName": message["author"]["name"],
        "supporterId": supporterId,
        "amount": jpn_msg,
        "supporterIconUrl": message['author']['images'][0]['url']
      }
      print("chat No.", i, ": ", obj)
      if res.get(supporterId) == None:
        res[supporterId] = obj
      else:
        res[supporterId]['amount']+=jpn_msg
      # break
  # print(total_superchat_earnings)
  return res, total_superchat_earnings

#version2
@app.route("/api/getUntilApril")
def getVideosUntilApril(channel_id):
  api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id={0}&key={1}"
  deet = api_str.format(channel_id, YOUTUBE_API_KEY)
  z = requests.get(deet).json()
  item = z["items"][0]
  uploads_id = item["contentDetails"]["relatedPlaylists"]["uploads"]
  youtuberIconUrl = item['snippet']['thumbnails']['medium']['url']
  youtuberName = item['snippet']['title']
  youtuberCustomUrl = item['snippet']['customUrl']
  print("z", pretty_json(z))
  nextPageToken = "start"
  all_video_ids = []
  finished = False
  while (nextPageToken is not None and not finished):
    videos_list_p1 = "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId={0}&key={1}"
    deet2 = videos_list_p1.format(uploads_id, YOUTUBE_API_KEY)
    if nextPageToken != "start":
      deet2 = deet2+"&pageToken="+nextPageToken
    search_response = requests.get(deet2).json()
    try:
      nextPageToken = search_response['nextPageToken']
    except:
      nextPageToken = None
    for item in search_response['items']:
      publishedAt = item['contentDetails']['videoPublishedAt'][:7]
      if int(publishedAt[5:7]) < 4:
        finished = True
        break
      all_video_ids.append(item['contentDetails']['videoId'])
  youtuber_info = {
    "youtuberId": channel_id,
    "youtuberName": youtuberName,
    "youtuberIconUrl": youtuberIconUrl,
    "youtuberCustomUrl": youtuberCustomUrl
  }
  return youtuber_info, all_video_ids

def process_videos(video_ids):
  res = []
  for vid_id in video_ids:
    request_url = "https://youtube.googleapis.com/youtube/v3/videos?part=liveStreamingDetails%2Cstatistics%2Cstatus%2CtopicDetails%2Clocalizations%2Csnippet%2CcontentDetails&id={0}&key={1}"
    deet3 = request_url.format(vid_id, YOUTUBE_API_KEY)
    vid_details = requests.get(deet3).json()
    print("vid_details", pretty_json(vid_details))
    res.append(vid_details['items'][0])
  return res


def update_for_each_video(youtuber_info, video):
  # youtuberInfo {youtuberId, youtuberName, youtuberIconUrl, youtuberCustomUrl}
  video_info = {
    "_year": '_'+(video['snippet']['publishedAt'])[:4],
    "_month": '_'+(video['snippet']['publishedAt'])[5:7],
    "videoId": video['id']
  }
  yt_url = 'https://www.youtube.com/watch?v=' + video['id']
  all_supporters_info_path = f"/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/data_for_test/all_supporters_info/{video['id']}.json"
  if not video['id'] in (db.collection("youtubers").document(youtuber_info['youtuberId']).get().to_dict()).get('videoIds', []):
    if os.path.exists(all_supporters_info_path):
      all_supporters_info = read_from_json_file(all_supporters_info_path)
      video_total_earning = sum(supporter['amount'] for supporter in all_supporters_info.values())
    else:
      all_supporters_info, video_total_earning = get_superchats(yt_url)
      write_into_file(all_supporters_info, all_supporters_info_path)

    video_info['videoTotalEarning'] = video_total_earning
    update_doc(youtuber_info, video_info, all_supporters_info)

@app.route("/api/init/version2")
def update_until_April():
  c_names = pd.read_csv("vtubers_info.csv")
  for i, row in c_names.iterrows():
    youtuberId = row['youtuber_id']
    youtuberName = row['youtuber_name']
    youtuber_info_path = f"/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/data_for_test/youtuber_info/{youtuberId}.json"
    all_vid_infos_path = f"/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/data_for_test/all_vid_infos/{youtuberId}.json"
    youtuber_info={}
    all_vid_infos = []
    if os.path.exists(youtuber_info_path) and os.path.exists(all_vid_infos_path):  
      youtuber_info = read_from_json_file(youtuber_info_path)
      all_vid_infos = read_from_json_file(all_vid_infos_path)
    else:
      youtuber_info, video_ids = getVideosUntilApril(youtuberId)
      write_into_file(youtuber_info, youtuber_info_path)
      all_vid_infos = process_videos(video_ids)
      write_into_file(all_vid_infos, all_vid_infos_path)
    selected_vid_infos_path = f"/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/data_for_test/selected_vid_infos/{youtuberId}.json"
    if not os.path.exists(selected_vid_infos_path):
      continue
    selected_vid_infos = read_from_json_file(selected_vid_infos_path)
    for k, vid in enumerate(all_vid_infos):
      if vid.get('liveStreamingDetails')==None or vid['snippet']['liveBroadcastContent']=='live' or vid['liveStreamingDetails'].get('actualEndTime') == None:
        continue
      print(f"updating {youtuberName}'s video: {vid['id']}")
      update_for_each_video(youtuber_info, vid)
  return {"sucecss": True}

@app.route("/api/test/version2")
def test2():
  api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id={0}&key={1}"
  deet = api_str.format("UCK9V2B22uJYu3N7eR_BT9QA", YOUTUBE_API_KEY)
  z = requests.get(deet).json()
  print("z", pretty_json(z))
  return {
    "success": True
  }

def get_video_details(vid_id):
    vid_details_template = "https://youtube.googleapis.com/youtube/v3/videos?part=liveStreamingDetails%2Cstatistics%2Cstatus%2CtopicDetails%2Clocalizations%2Csnippet%2CcontentDetails&id={0}&key={1}"
    deet3 = vid_details_template.format(vid_id, YOUTUBE_API_KEY)
    video_details = requests.get(deet3).json()
    return video_details

def get_all_vids_details(channel_videos):
    out = []
    for i in channel_videos["items"]:
        vid_id = i["contentDetails"]["videoId"]
        a = get_video_details(vid_id)
        out.append(a)
    return out

@app.route("/api/test/version4")
def test4():
  youtuber_info = read_from_json_file("/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/omaru_polka_youtuber_info.json")
  all_vid_infos = read_from_json_file("/Users/takehikazuki/Desktop/my_app/ranking_app3/python_files/omaru_videos_final.json")
  for k, vid in enumerate(all_vid_infos):
    if vid.get('liveStreamingDetails')==None or vid['snippet']['liveBroadcastContent']=='live' or vid['liveStreamingDetails'].get('actualEndTime') == None:
      continue
    update_for_each_video(youtuber_info, vid)
  return {"sucecss": True}

@app.route("/api/test/version3")
def test3():
  supporters = db.collection("supporters").stream()
  for supporter in supporters:
    supporterDetails = getSupporterDetail(supporter.id)
    db.collection("supporters").document(supporter.id).set({
      "supporterCustomUrl": supporterDetails['supporterCustomUrl']
    }, merge=True)
  return {
    "success": True
  }

#version2
def update_doc(youtuber_info, video_info, all_supporters_info):
  youtuberId, youtuberName, youtuberIconUrl, youtuberCustomUrl = (
      youtuber_info[k] for k in ('youtuberId', 'youtuberName', 'youtuberIconUrl', 'youtuberCustomUrl')
  )
  videoId = video_info['videoId']
  _year = video_info['_year']
  _month = video_info['_month']
  videoTotalEarning = video_info['videoTotalEarning']

  youtuber_ref = db.collection("youtubers").document(youtuberId)
  youtuber_doc = youtuber_ref.get()
  if not youtuber_doc.exists:
    youtuber_ref.set({
      "youtuberName": youtuberName,
      "totalAmount": videoTotalEarning,
      "youtuberId": youtuberId,
      "videoIds": [videoId],
      "youtuberIconUrl": youtuberIconUrl,
      "youtuberCustomUrl": youtuberCustomUrl
    })
  elif videoId in youtuber_doc.to_dict().get('videoIds', []):
    print("already took the chats for this videoId", videoId)
    return
  else:
    youtuber_ref.set({
      "videoIds": firestore.ArrayUnion([videoId]),
      "totalAmount": firestore.Increment(videoTotalEarning)
      }, merge=True)
  youtuber_summary_year_ref = youtuber_ref.collection("summary").document(_year)
  youtuber_summary_year_ref.set({
    "totalAmount": firestore.Increment(videoTotalEarning),
    "monthlyAmount": {
      _month: firestore.Increment(videoTotalEarning)
    }
  }, merge=True)
  for _, supporter in all_supporters_info.items():
    # all_supporters_details [{supporterName, supporterId, amount, supporterIconUrl}]
    api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id={0}&key={1}"
    deet = api_str.format(supporter['supporterId'], YOUTUBE_API_KEY)
    z = requests.get(deet).json()
    supporter['supporterCustomUrl'] = z['items'][0]['snippet']['customUrl']
    update_one_supporter(supporter, _year, _month,supporter['amount'],youtuberId)

@app.route("/api/youtubers")
def getYoutubers():
  youtubers_docs = db.collection('youtubers').stream()
  arr=[]
  for youtuber_doc in youtubers_docs:
    # print("doc", doc)
    youtuber = youtuber_doc.to_dict()
    arr.append({
      "amount": youtuber['totalAmount'],
      "youtuberName": youtuber['youtuberName'],
      "youtuberId": youtuber['youtuberId'],
      "youtuberIconUrl": youtuber['youtuberIconUrl']
    })
  logging.info(f"youtubers: {arr}")
  return arr

@app.route("/api/test/version5")
def test_ver5():
  getSupporterDetail("UCZf__ehlCEBPop-_sldpBUQ")
  return {
    "success": True
  }

def getSupporterDetail(supporterId):
  api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id={0}&key={1}"
  supporter_info = api_str.format(supporterId, YOUTUBE_API_KEY)
  z = requests.get(supporter_info).json()
  item = z["items"][0]
  supporterIconUrl = item['snippet']['thumbnails']['medium']['url']
  supporterCustomUrl = item['snippet']['customUrl']
  supporterName = item['snippet']['title']
  return {
    "supporterIconUrl": supporterIconUrl,
    "supporterName": supporterName,
    "supporterCustomUrl": supporterCustomUrl
  }

@app.route("/api/connectUserToSupporter", methods=["post"])
def connectUserToSupporter():
  data = request.get_json()
  logging.info("connectUserToSupporter", data)
  userId = data['userId']
  supporterId = data['supporterId']
  supporter_ref = db.collection("supporters").document(supporterId)
  if supporter_ref.get().exists:
    supporter_ref.set({
      "connectedUser": userId
    }, merge=True)
    return {
      "success": True
    }
  supporter_info = getSupporterDetail(supporterId)
  print("supporter_info", supporter_info)
  supporter_ref.set({
    "supporterIconUrl": supporter_info['supporterIconUrl'],
    "supporterName": supporter_info['supporterName'],
    "supporterCustomUrl": supporter_info['supporterCustomUrl'],
    "supporterId": supporterId,
    "connectedUser": userId
  })
  return supporter_info

@app.route("/api/getYoutubersRanking", methods=["POST"])
def getYoutubersRanking():
  data = request.get_json()
  _year = '_'+ data['year']
  _month = '_'+ data['month']
  youtubers_docs = db.collection('youtubers').stream()
  res=[]
  for youtuber_doc in youtubers_docs:
    # print("doc", doc)
    youtuber = youtuber_doc.to_dict()
    youtuber_monthly_doc = db.collection('youtubers').document(youtuber_doc.id).collection('summary').document(_year).get()
    if not youtuber_monthly_doc.exists:
      continue
    monthlyAmount = (youtuber_monthly_doc.to_dict()).get('monthlyAmount', {}).get(_month, 0)
    if monthlyAmount == 0:
      continue
    res.append({
      "amount": monthlyAmount,
      "youtuberName": youtuber['youtuberName'],
      "youtuberId": youtuber['youtuberId'],
      "youtuberIconUrl": youtuber['youtuberIconUrl']
    })
  sortedRes = sorted(res, key=lambda x: x['amount'], reverse=True)
  return sortedRes


@app.route("/api/getSupporterMonthRanking", methods=["POST"])
def getSupporterMonthRanking():
  # print("request in getRanking", request)
  data = request.get_json()
  _year = '_'+ data['year']
  _month = '_'+ data['month']
  youtuberId = data['youtuberId']

  logging.info("data", data)
  logging.info("channelId", youtuberId)

  youtuber_ref = db.collection('youtubers').document(youtuberId)
  youtuberName = (youtuber_ref.get().to_dict())['youtuberName']
  total_month_amount = (youtuber_ref.collection('summary').document(_year).get().to_dict()).get('monthlyAmount', {}).get(_month, 0)
  youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"monthlyAmount.{_year}{_month}", direction=firestore.Query.DESCENDING).limit(30).stream()
  top_supporters = []
  for supporter in youtuber_supporter_list:
    supporter_data = supporter.to_dict()
    monthlyAmount = supporter_data.get('monthlyAmount', {})
    amount = monthlyAmount.get(_year+_month, 0)
    top_supporters.append({
      'supporterName': supporter_data['supporterName'],
      'supporterId': supporter.id,
      'amount': amount,
      "supporterIconUrl": supporter_data['supporterIconUrl'],
      'supporterCustomUrl': supporter_data.get('supporterCustomUrl', "")
    })
  return {
    "total_month_amount": total_month_amount,
    "top_supporters": top_supporters,
    'youtuberName': youtuberName
  }

def processCheckoutSessions():
  pass

@app.route("/api/getYoutuberInfo", methods=["POST"])
def getYoutuberInfo():
  data=request.get_json()
  logging.info(f"request in getYoutuberInfo: {pretty_json(data)}")
  youtuberId=data['youtuberId']
  youtuber_doc = db.collection('youtubers').document(youtuberId).get()
  if not youtuber_doc.exists:
    return {
      "error": "this youtuber does not exists"
    }
  y_data = youtuber_doc.to_dict()
  
  youtuberName, youtuberCustomUrl, youtuberIconUrl = (
    y_data['youtuberName'], y_data['youtuberCustomUrl'], y_data['youtuberIconUrl']
  )
  logging.info(f"y_data: {y_data}")
  return {
    "youtuberName": youtuberName,
    "youtuberCustomUrl": youtuberCustomUrl,
    "youtuberIconUrl": youtuberIconUrl
  }

@app.route("/api/getSupporterInfo", methods=["POST"])
def getSupporterInfo():
  data=request.get_json()
  supporterId=data['supporterId']
  supporters_ref = db.collection('supporters').document(supporterId)
  if not supporters_ref.get().exists:
    print("this supporter does not exist")
    return {
      "error": "failed to retrieve"
    }
  supporter_data = supporters_ref.get().to_dict()
  supporterName, connectedUser, supporterIconUrl = supporter_data['supporterName'], supporter_data['connectedUser'], supporter_data['supporterIconUrl']
  return {
    "supporterName": supporterName,
    "connectedUser": connectedUser,
    "supporterIconUrl": supporterIconUrl
  }

@app.route("/api/getSupportingYoutubers", methods=["POST"])
def getSupportingYoutubers():
  data=request.get_json()
  print("request in getSupporterInfo", pretty_json(data))
  supporterId=data['supporterId']
  _year='_'+data['year']
  _month='_'+data['month']
  supporters_ref = db.collection('supporters').document(supporterId)
  if not supporters_ref.get().exists:
    print("this supporter does not exist")
    return {
      "error": "failed to retrieve"
    }
  supporter_data = supporters_ref.get().to_dict()
  youtubers = supporter_data.get('supportedYoutubers', {}).get(_year+_month, [])
  allYoutubers = []
  for youtuberId in youtubers:
    youtuber_ref = db.collection('youtubers').document(youtuberId)
    youtuber_data = youtuber_ref.get().to_dict()
    youtuberName = youtuber_data['youtuberName']
    youtuberIconUrl = youtuber_data['youtuberIconUrl']
    youtuber_supporter_ref = youtuber_ref.collection('supporters').document(supporterId)
    chattedAmount = (youtuber_supporter_ref.get().to_dict()).get('monthlyAmount', {}).get(_year+_month, 0)
    youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"monthlyAmount.{_year}{_month}", direction=firestore.Query.DESCENDING).limit(100).stream()
    supporterRank = 0
    for rank, supporter in enumerate(youtuber_supporter_list):
      # print("supporter.id, supporterId", supporter.id, supporterId)
      if supporter.id == supporterId:
        supporterRank = rank + 1
        break
    allYoutubers.append({
      "youtuberId": youtuberId,
      "youtuberName": youtuberName,
      "amount": chattedAmount,
      "youtuberIconUrl": youtuberIconUrl,
      "supporterRank": supporterRank
    })
  return allYoutubers

# stripe.Account.create(
#   controller={
#     "losses": {"payments": "application"},
#     "fees": {"payer": "application"},
#     "stripe_dashboard": {"type": "express"},
#   },
# )

# stripe.AccountLink.create(
#   account="ca_FkyHCg7X8mlvCUdMDao4mMxagUfhIwXb",
#   refresh_url="https://example.com/reauth",
#   return_url="https://example.com/return",
#   type="account_onboarding",
# )

@app.route('/api/create-connected-account', methods=['POST'])
def create_connected_account():
    try:
        account = stripe.Account.create(
          controller={
            "losses": {"payments": "application"},
            "fees": {"payer": "application"},
            "stripe_dashboard": {"type": "express"},
          },
        )
        return jsonify({'account_id': account.id})
    except Exception as e:
        return jsonify(error=str(e)), 403

@app.route('/api/create-account-link', methods=['POST'])
def create_account_link():
    data = request.get_json()
    account_id = data.get('account_id')

    try:
        account_link = stripe.AccountLink.create(
            account=account_id,
            refresh_url="https://example.com/reauth",
            return_url="https://example.com/return",
            type="account_onboarding",
        )
        return jsonify({'url': account_link.url})
    except Exception as e:
        return jsonify(error=str(e)), 403

def update_one_supporter(supporter, _year, _month, amount, youtuberId):
  supporterName, supporterId, supporterIconUrl, supporterCustomUrl = (
    supporter[k] for k in ('supporterName', 'supporterId', 'supporterIconUrl', 'supporterCustomUrl')
  )
  newAmount = firestore.Increment(amount)
  youtuber_supporter_ref = db.collection('youtubers').document(youtuberId).collection('supporters').document(supporterId)
  youtuber_supporter_ref.set({
    "supporterName": supporterName,
    "supporterId": supporterId,
    "supporterIconUrl": supporterIconUrl,
    "supporterCustomUrl": supporterCustomUrl,
    "totalAmount": newAmount,
    "monthlyAmount": {
      _year+_month: newAmount},
    "yearlyAmount": {
      _year: newAmount},
  }, merge=True)
  supporter_ref = db.collection("supporters").document(supporterId)
  supporter_doc = supporter_ref.get()
  if not supporter_doc.exists:
    supporter_ref.set({
      "supporterName": supporterName,
      "supporterId": supporterId,
      "connectedUser": None,
      "supporterIconUrl": supporterIconUrl,
      "supporterCustomUrl": supporterCustomUrl,
    })
  supporter_ref.set({
    "supportedYoutubers": {
      _year: firestore.ArrayUnion([youtuberId]),
      _year+_month: firestore.ArrayUnion([youtuberId]),
      },
  }, merge=True)

@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = 'whsec_9994d1a34489d9c0096938e895a52a90368947853a7b0a2aae9c8f57d48a9675'
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        # print("event", event )

    except ValueError as e:
        return jsonify(success=False), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify(success=False), 400
    event_dict = event.to_dict()
    if event_dict['type'] == 'payment_intent.succeeded':
        print("event", event_dict)
        # print("event object", event_dict)
        session = event_dict['data']['object']
        youtuberId = session['metadata'] ['youtuberId']
        supporterId = session['metadata']['supporterId']
        created = event_dict['created']
        _year = datetime.utcfromtimestamp(created).strftime("_%Y")
        _month = datetime.utcfromtimestamp(created).strftime("_%m")
        newAmount = session['amount_received']
        print(datetime.utcfromtimestamp(created).strftime("_%Y_%m"))
        supporter_data = db.collection('supporters').document(supporterId).get().to_dict()
        update_one_supporter(supporter_data, _year, _month, newAmount, youtuberId)
        youtuber_ref = db.collection('youtubers').document(youtuberId)
        youtuber_ref.set({
        "totalAmount": firestore.Increment(newAmount)
        }, merge=True)
        youtuber_summary_year_ref = youtuber_ref.collection("summary").document(_year)
        youtuber_summary_year_ref.set({
          "totalAmount": firestore.Increment(newAmount),
          "monthlyAmount": {
            _month: firestore.Increment(newAmount)
          }
        }, merge=True)

    return jsonify(success=True), 200

@app.route('/api/createCheckoutSession', methods=['POST'])
def create_checkout_session():
  youtuberId = request.form['youtuberId']
  supporterId = request.form['supporterId']
  userId = request.form['userId']
  try:
      checkout_session = stripe.checkout.Session.create(
          line_items=[
              {
                  # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                  'price': "price_1PTGt6P0X4ULjrnYLrKBHzUA",
                  'quantity': 1,
              },
          ],
          payment_intent_data={
            "application_fee_amount": 123,
            "transfer_data": {"destination": "acct_1PTJlN076kLKSREE"},
            "metadata": {
              "youtuberId": youtuberId,
              "supporterId": supporterId,
              "userId": userId
            }
          },
          mode='payment',
          success_url=f"{WEB_URL}/youtubers/{youtuberId}?payment=success",
          cancel_url=f"{WEB_URL}/youtubers/{youtuberId}?payment=cancel",
      )
      payments_session_ref = db.collection('youtubers').document(youtuberId)
      payments_session_ref.set({
        "checkout_session": firestore.ArrayUnion([{
          "sessionId": checkout_session.id,
          "supporterId": supporterId,
          "youtuberId": youtuberId
        }])
      }, merge=True)
      print("checkout_session", checkout_session)
  except Exception as e:
      return str(e)

  return redirect(checkout_session.url, code=303)

if __name__ == "__main__":
    # We're running locally, use the development server
    app.run(port=8000, debug=True)