import google.cloud.logging
from config import YOUTUBE_API_KEY, STRIPE_API_KEY, db, WEB_URL, IS_CLOUD_RUN
from utils.common import pretty_json, getFilePath, read_from_json_file, write_into_file, get_currency_json, update_one_supporter
import numpy as np
import pandas as pd
import requests
from pprint import pp
from firebase_admin import firestore
import json
from flask import Flask, request, jsonify, abort, redirect
from flask_cors import CORS
import os
import stripe
from datetime import datetime, timedelta
import logging
from admin_tasks import tasks_blueprint
import functools
import time
import threading



client = google.cloud.logging.Client()
client.setup_logging()

app = Flask(__name__)
CORS(app)
app.register_blueprint(tasks_blueprint)
stripe.api_key = STRIPE_API_KEY

if IS_CLOUD_RUN:
    cache = {}
    cache_lock = threading.Lock()
else:
    cache = None
    cache_lock = None


def cache_with_persistence(ttl_minutes=30):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            logging.info(f"inside cache_with_persistence")
            if not IS_CLOUD_RUN:
                # Cloud Run以外の環境では、キャッシュを使用せずに直接関数を実行
                logging.info(f"not IS_CLOUD_RUN")
                return func(*args, **kwargs)
            
            with cache_lock:
                if cache_key in cache:
                    result, timestamp = cache[cache_key]
                    if datetime.now() - timestamp < timedelta(minutes=ttl_minutes):
                        logging.info(f"used Cache in Server")
                        return result
            
            doc_ref = db.collection('cache').document(cache_key)
            doc = doc_ref.get()
            
            if doc.exists:
                cached_data = doc.to_dict()
                if datetime.now() - cached_data['timestamp'].replace(tzinfo=None) < timedelta(minutes=ttl_minutes):
                    with cache_lock:
                        cache[cache_key] = (cached_data['result'], cached_data['timestamp'])
                    logging.info(f"used Cache in FireStore")
                    return cached_data['result']
            
            result = func(*args, **kwargs)
            
            with cache_lock:
                cache[cache_key] = (result, datetime.now())
            
            doc_ref.set({
                'result': result,
                'timestamp': datetime.now()
            })
            
            return result
        return wrapper
    return decorator

def persist_cache():
    while True:
        time.sleep(3600)  # 1時間ごとに永続化
        if not IS_CLOUD_RUN:
            return  # Cloud Run以外の環境では永続化を行わない
        
        with cache_lock:
            for key, (value, timestamp) in cache.items():
                if datetime.now() - timestamp < timedelta(minutes=30):
                    db.collection('cache').document(key).set({
                        'result': value,
                        'timestamp': timestamp
                    })
                else:
                    del cache[key]

if IS_CLOUD_RUN:
    threading.Thread(target=persist_cache, daemon=True).start()

@app.route("/api/app_engine")
def test_app_engine():
    return jsonify({"message": True})

# @cache_firestore()
# def get_youtubers():
#     youtubers_docs = db.collection('youtubers').stream()
#     youtubers_list = []
#     for youtuber_doc in youtubers_docs:
#         youtuber = youtuber_doc.to_dict()
#         youtubers_list.append({
#             "amount": youtuber['totalAmount'],
#             "youtuberName": youtuber['youtuberName'],
#             "youtuberId": youtuber['youtuberId'],
#             "youtuberIconUrl": youtuber['youtuberIconUrl']
#         })
#     logging.info(f"youtubers: {youtubers_list}")
#     return jsonify(youtubers_list)

# @app.route("/api/youtubers")
# def getYoutubers():
#     return get_youtubers()


def get_supporter_detail(supporter_id):
    api_str = "https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id={0}&key={1}"
    supporter_info = api_str.format(supporter_id, YOUTUBE_API_KEY)
    response = requests.get(supporter_info).json()
    item = response["items"][0]
    supporter_icon_url = item['snippet']['thumbnails']['medium']['url']
    supporter_custom_url = item['snippet']['customUrl']
    supporter_name = item['snippet']['title']
    return {
        "supporterIconUrl": supporter_icon_url,
        "supporterName": supporter_name,
        "supporterCustomUrl": supporter_custom_url
    }

@app.route("/api/connectUserToSupporter", methods=["POST"])
def connect_user_to_supporter():
    data = request.get_json()
    logging.info("connectUserToSupporter", data)
    user_id = data['userId']
    supporter_id = data['supporterId']
    supporter_ref = db.collection("supporters").document(supporter_id)
    
    if supporter_ref.get().exists:
        supporter_ref.set({"connectedUser": user_id}, merge=True)
        return {"success": True}
    
    supporter_info = get_supporter_detail(supporter_id)
    supporter_ref.set({
        "supporterIconUrl": supporter_info['supporterIconUrl'],
        "supporterName": supporter_info['supporterName'],
        "supporterCustomUrl": supporter_info['supporterCustomUrl'],
        "supporterId": supporter_id,
        "connectedUser": user_id
    })
    return supporter_info

@app.route("/api/getYoutubersRanking", methods=["POST"])
def getYoutubersRanking():
    data = request.get_json()
    showYear = data['showYear']
    year = '_' + data['year']
    month = '_' + data['month']
    logging.info(f"getting youtubers ranking")
    return get_youtubers_ranking(year, month, showYear)

@cache_with_persistence()
def get_youtubers_ranking(year, month, showYear):
    youtubers_docs = db.collection('youtubers').stream()
    ranking_list = []
    print(f"showYear: {showYear}")
    logging.info(f"showYear: {showYear}")

    for youtuber_doc in youtubers_docs:
        youtuber = youtuber_doc.to_dict()
        youtuber_doc = db.collection('youtubers').document(youtuber_doc.id).collection('summary').document(year).get()
        
        if not youtuber_doc.exists:
            continue
        if showYear:
          amount = (youtuber_doc.to_dict()).get('totalAmount', 0)
        else:
          amount = (youtuber_doc.to_dict()).get('monthlyAmount', {}).get(month, 0)
        
        if amount == 0:
            continue
        
        ranking_list.append({
            "amount": amount,
            "youtuberName": youtuber['youtuberName'],
            "youtuberId": youtuber['youtuberId'],
            "youtuberIconUrl": youtuber['youtuberIconUrl']
        })
    
    sorted_ranking = sorted(ranking_list, key=lambda x: x['amount'], reverse=True)
    return sorted_ranking

@app.route("/api/getSupportersRanking", methods=["POST"])
def getSupporterRanking():
    print("inside supporterRanking")
    data = request.get_json()
    _year = '_'+ data['year']
    _month = '_'+ data['month']
    youtuberId = data['youtuberId']
    showYear = data['showYear']
    return get_supporters_ranking(_year, _month, youtuberId, showYear)

@cache_with_persistence()
def get_supporters_ranking(_year, _month, youtuberId, showYear):
  youtuber_ref = db.collection('youtubers').document(youtuberId)
  youtuberName = (youtuber_ref.get().to_dict())['youtuberName']
  if showYear:
    total_amount = (youtuber_ref.collection('summary').document(_year).get().to_dict()).get('totalAmount', 0)
    youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"yearlyAmount.{_year}", direction=firestore.Query.DESCENDING).limit(30).stream()
  else:
    total_amount = (youtuber_ref.collection('summary').document(_year).get().to_dict()).get('monthlyAmount', {}).get(_month, 0)
    youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"monthlyAmount.{_year}{_month}", direction=firestore.Query.DESCENDING).limit(30).stream()
  top_supporters = []
  for supporter in youtuber_supporter_list:
    supporter_data = supporter.to_dict()
    if showYear:
      amount = supporter_data.get('yearlyAmount', {}).get(_year, 0)
    else:
      amount = supporter_data.get('monthlyAmount', {}).get(_year+_month, 0)
    top_supporters.append({
      'supporterName': supporter_data['supporterName'],
      'supporterId': supporter.id,
      'amount': amount,
      "supporterIconUrl": supporter_data['supporterIconUrl']
    })
  return {
    "total_amount": total_amount,
    "top_supporters": top_supporters,
    'youtuberName': youtuberName
  }

@app.route("/api/getYoutuberInfo", methods=["POST"])
def getYoutuberInfo():
    data = request.get_json()
    youtuber_id = data['youtuberId']
    return get_youtuber_info(youtuber_id)

@cache_with_persistence()
def get_youtuber_info(youtuber_id):
    youtuber_doc = db.collection('youtubers').document(youtuber_id).get()
    
    if not youtuber_doc.exists:
        return {
            "error": "this youtuber does not exists"
        }
    
    y_data = youtuber_doc.to_dict()
    
    youtuber_name, youtuber_custom_url, youtuber_icon_url = (
        y_data['youtuberName'], y_data['youtuberCustomUrl'], y_data['youtuberIconUrl']
    )
    logging.info(f"y_data: {y_data}")
    return {
        "youtuberName": youtuber_name,
        "youtuberCustomUrl": youtuber_custom_url,
        "youtuberIconUrl": youtuber_icon_url
    }

@app.route("/api/getSupporterInfo", methods=["POST"])
def getSupporterInfo():
    data = request.get_json()
    supporter_id = data['supporterId']
    return get_supporter_info(supporter_id)

@cache_with_persistence()
def get_supporter_info(supporter_id):
    supporters_ref = db.collection('supporters').document(supporter_id)
    
    if not supporters_ref.get().exists:
        print("this supporter does not exist")
        return {
            "error": "failed to retrieve"
        }
    
    supporter_data = supporters_ref.get().to_dict()
    supporter_name, connected_user, supporter_icon_url = supporter_data['supporterName'], supporter_data['connectedUser'], supporter_data['supporterIconUrl']
    return {
        "supporterName": supporter_name,
        "connectedUser": connected_user,
        "supporterIconUrl": supporter_icon_url
    }

@app.route("/api/getSupportingYoutubers", methods=["POST"])
def getSupportingYoutubers():
    data = request.get_json()
    print("request in getSupporterInfo", pretty_json(data))
    supporter_id = data['supporterId']
    year = '_' + data['year']
    month = '_' + data['month']
    showYear = data['showYear']
    return get_supporting_youtubers(supporter_id, year, month, showYear)

@cache_with_persistence()
def get_supporting_youtubers(supporter_id, year, month, showYear):
    supporters_ref = db.collection('supporters').document(supporter_id)
    
    if not supporters_ref.get().exists:
        print("this supporter does not exist")
        return {
            "error": "failed to retrieve"
        }
    
    supporter_data = supporters_ref.get().to_dict()
    if showYear:
        youtubers = supporter_data.get('supportedYoutubers', {}).get(year, [])
    else:
        youtubers = supporter_data.get('supportedYoutubers', {}).get(year + month, [])
    all_youtubers = []
    
    for youtuber_id in youtubers:
        youtuber_ref = db.collection('youtubers').document(youtuber_id)
        youtuber_data = youtuber_ref.get().to_dict()
        youtuber_name = youtuber_data['youtuberName']
        youtuber_icon_url = youtuber_data['youtuberIconUrl']
        youtuber_supporter_ref = youtuber_ref.collection('supporters').document(supporter_id)
        if showYear:
            chatted_amount = (youtuber_supporter_ref.get().to_dict()).get('yearlyAmount', {}).get(year, 0)
            youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"yearlyAmount.{year}", direction=firestore.Query.DESCENDING).limit(100).stream()
        else:
            chatted_amount = (youtuber_supporter_ref.get().to_dict()).get('monthlyAmount', {}).get(year + month, 0)
            youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"monthlyAmount.{year}{month}", direction=firestore.Query.DESCENDING).limit(100).stream()
            
        supporter_rank = 0
        
        for rank, supporter in enumerate(youtuber_supporter_list):
            if supporter.id == supporter_id:
                supporter_rank = rank + 1
                break
        
        all_youtubers.append({
            "youtuberId": youtuber_id,
            "youtuberName": youtuber_name,
            "amount": chatted_amount,
            "youtuberIconUrl": youtuber_icon_url,
            "supporterRank": supporter_rank
        })
    
    return all_youtubers

@app.route('/api/create-connected-account', methods=['POST'])
def create_connected_account():
    try:
        account = stripe.Account.create(
            type="express",
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
            refresh_url=f"{WEB_URL}/reauth",
            return_url=f"{WEB_URL}/success",
            type="account_onboarding",
        )
        return jsonify({'url': account_link.url})
    except Exception as e:
        return jsonify(error=str(e)), 403

# @app.route('/api/webhook', methods=['POST'])
# def stripe_webhook():
#     payload = request.get_data(as_text=True)
#     sig_header = request.headers.get('Stripe-Signature')
#     endpoint_secret = os.environ.get('STRIPE_ENDPOINT_SECRET')

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, endpoint_secret
#         )
#     except ValueError as e:
#         return jsonify(success=False), 400
#     except stripe.error.SignatureVerificationError as e:
#         return jsonify(success=False), 400

#     event_dict = stripe.util.convert_to_dict(event)

#     if event_dict['type'] == 'payment_intent.succeeded':
#         print("event", event_dict)
#         session = event_dict['data']['object']
#         youtuber_id = session['metadata']['youtuberId']
#         supporter_id = session['metadata']['supporterId']
#         created = event_dict['created']
#         year = '_' + datetime.utcfromtimestamp(created).strftime("%Y")
#         month = '_' + datetime.utcfromtimestamp(created).strftime("%m")
#         new_amount = session['amount_received']
#         print(datetime.utcfromtimestamp(created).strftime("_%Y_%m"))
#         supporter_data = db.collection('supporters').document(supporter_id).get().to_dict()
#         update_one_supporter(supporter_data, year, month, new_amount, youtuber_id)
#         youtuber_ref = db.collection('youtubers').document(youtuber_id)
#         youtuber_ref.set({
#             "totalAmount": firestore.Increment(new_amount)
#         }, merge=True)
#         youtuber_summary_year_ref = youtuber_ref.collection("summary").document(year)
#         youtuber_summary_year_ref.set({
#             "totalAmount": firestore.Increment(new_amount),
#             "monthlyAmount": {
#                 month: firestore.Increment(new_amount)
#             }
#         }, merge=True)

#     return jsonify(success=True), 200

@app.route('/api/createCheckoutSession', methods=['POST'])
def create_checkout_session():
    youtuber_id = request.form['youtuberId']
    supporter_id = request.form['supporterId']
    user_id = request.form['userId']

    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price': "price_1PTGt6P0X4ULjrnYLrKBHzUA",
                    'quantity': 1,
                },
            ],
            payment_intent_data={
                "application_fee_amount": 123,
                "transfer_data": {"destination": "acct_1PTJlN076kLKSREE"},
                "metadata": {
                    "youtuberId": youtuber_id,
                    "supporterId": supporter_id,
                    "userId": user_id
                }
            },
            mode='payment',
            success_url=f"{WEB_URL}/youtubers/{youtuber_id}?payment=success",
            cancel_url=f"{WEB_URL}/youtubers/{youtuber_id}?payment=cancel",
        )
        payments_session_ref = db.collection('youtubers').document(youtuber_id)
        payments_session_ref.set({
            "checkout_session": firestore.ArrayUnion([{
                "sessionId": checkout_session.id,
                "supporterId": supporter_id,
                "youtuberId": youtuber_id
            }])
        }, merge=True)
        print("checkout_session", checkout_session)
    except Exception as e:
        return str(e)

    return redirect(checkout_session.url, code=303)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)