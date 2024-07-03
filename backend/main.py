from config import YOUTUBE_API_KEY, STRIPE_API_KEY, db, WEB_URL
from utils.common import pretty_json, getFilePath, read_from_json_file, write_into_file, get_currency_json, update_one_supporter
import numpy as np
import pandas as pd
import requests
from pprint import pp
from firebase_admin import firestore
import json
from flask import Flask
from flask_cors import CORS
from flask import request, make_response, jsonify, Flask, redirect
import os
import stripe
from datetime import datetime
import logging
from admin_tasks import tasks_blueprint

app = Flask(__name__)
CORS(app)
app.register_blueprint(tasks_blueprint)
stripe.api_key = STRIPE_API_KEY

@app.route("/api/app_engine")
def test_app_engine():
  return jsonify({"message": True})

@app.route("/api/youtubers")
def get_youtubers():
  youtubers_docs = db.collection('youtubers').stream()
  youtubers_list = []
  for youtuber_doc in youtubers_docs:
    youtuber = youtuber_doc.to_dict()
    youtubers_list.append({
      "amount": youtuber['totalAmount'],
      "youtuberName": youtuber['youtuberName'],
      "youtuberId": youtuber['youtuberId'],
      "youtuberIconUrl": youtuber['youtuberIconUrl']
    })
  logging.info(f"youtubers: {youtubers_list}")
  return youtubers_list

@app.route("/api/test/version5")
def test_ver5():
  get_supporter_detail("UCZf__ehlCEBPop-_sldpBUQ")
  return {"success": True}

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
def get_youtubers_ranking():
  data = request.get_json()
  year = '_' + data['year']
  month = '_' + data['month']
  youtubers_docs = db.collection('youtubers').stream()
  ranking_list = []
  
  for youtuber_doc in youtubers_docs:
    youtuber = youtuber_doc.to_dict()
    youtuber_monthly_doc = db.collection('youtubers').document(youtuber_doc.id).collection('summary').document(year).get()
    
    if not youtuber_monthly_doc.exists:
      continue
    
    monthly_amount = (youtuber_monthly_doc.to_dict()).get('monthlyAmount', {}).get(month, 0)
    
    if monthly_amount == 0:
      continue
    
    ranking_list.append({
      "amount": monthly_amount,
      "youtuberName": youtuber['youtuberName'],
      "youtuberId": youtuber['youtuberId'],
      "youtuberIconUrl": youtuber['youtuberIconUrl']
    })
  
  sorted_ranking = sorted(ranking_list, key=lambda x: x['amount'], reverse=True)
  return sorted_ranking

@app.route("/api/getSupporterMonthRanking", methods=["POST"])
def get_supporter_month_ranking():
  data = request.get_json()
  year = '_' + data['year']
  month = '_' + data['month']
  youtuber_id = data['youtuberId']

  logging.info("data", data)
  logging.info("channelId", youtuber_id)

  youtuber_ref = db.collection('youtubers').document(youtuber_id)
  youtuber_name = (youtuber_ref.get().to_dict())['youtuberName']
  total_month_amount = (youtuber_ref.collection('summary').document(year).get().to_dict()).get('monthlyAmount', {}).get(month, 0)
  youtuber_supporter_list = youtuber_ref.collection('supporters').order_by(f"monthlyAmount.{year}{month}", direction=firestore.Query.DESCENDING).limit(30).stream()
  top_supporters = []
  
  for supporter in youtuber_supporter_list:
    supporter_data = supporter.to_dict()
    monthly_amount = supporter_data.get('monthlyAmount', {})
    amount = monthly_amount.get(year + month, 0)
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
    'youtuberName': youtuber_name
  }

def process_checkout_sessions():
  pass

@app.route("/api/getYoutuberInfo", methods=["POST"])
def get_youtuber_info():
  data = request.get_json()
  logging.info(f"request in getYoutuberInfo: {pretty_json(data)}")
  youtuber_id = data['youtuberId']
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
def get_supporter_info():
  data = request.get_json()
  supporter_id = data['supporterId']
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
def get_supporting_youtubers():
  data = request.get_json()
  print("request in getSupporterInfo", pretty_json(data))
  supporter_id = data['supporterId']
  year = '_' + data['year']
  month = '_' + data['month']
  supporters_ref = db.collection('supporters').document(supporter_id)
  
  if not supporters_ref.get().exists:
    print("this supporter does not exist")
    return {
      "error": "failed to retrieve"
    }
  
  supporter_data = supporters_ref.get().to_dict()
  youtubers = supporter_data.get('supportedYoutubers', {}).get(year + month, [])
  all_youtubers = []
  
  for youtuber_id in youtubers:
    youtuber_ref = db.collection('youtubers').document(youtuber_id)
    youtuber_data = youtuber_ref.get().to_dict()
    youtuber_name = youtuber_data['youtuberName']
    youtuber_icon_url = youtuber_data['youtuberIconUrl']
    youtuber_supporter_ref = youtuber_ref.collection('supporters').document(supporter_id)
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

@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
  payload = request.get_data(as_text=True)
  sig_header = request.headers.get('Stripe-Signature')
  endpoint_secret = 'whsec_9994d1a34489d9c0096938e895a52a90368947853a7b0a2aae9c8f57d48a9675'
  
  try:
    event = stripe.Webhook.construct_event(
      payload, sig_header, endpoint_secret
    )
  except ValueError as e:
    return jsonify(success=False), 400
  except stripe.error.SignatureVerificationError as e:
    return jsonify(success=False), 400
  
  event_dict = event.to_dict()
  
  if event_dict['type'] == 'payment_intent.succeeded':
    print("event", event_dict)
    session = event_dict['data']['object']
    youtuber_id = session['metadata']['youtuberId']
    supporter_id = session['metadata']['supporterId']
    created = event_dict['created']
    year = '_' + datetime.utcfromtimestamp(created).strftime("%Y")
    month = '_' + datetime.utcfromtimestamp(created).strftime("%m")
    new_amount = session['amount_received']
    print(datetime.utcfromtimestamp(created).strftime("_%Y_%m"))
    supporter_data = db.collection('supporters').document(supporter_id).get().to_dict()
    update_one_supporter(supporter_data, year, month, new_amount, youtuber_id)
    youtuber_ref = db.collection('youtubers').document(youtuber_id)
    youtuber_ref.set({
      "totalAmount": firestore.Increment(new_amount)
    }, merge=True)
    youtuber_summary_year_ref = youtuber_ref.collection("summary").document(year)
    youtuber_summary_year_ref.set({
      "totalAmount": firestore.Increment(new_amount),
      "monthlyAmount": {
        month: firestore.Increment(new_amount)
      }
    }, merge=True)

  return jsonify(success=True), 200

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
  app.run(port=8000, debug=True)
