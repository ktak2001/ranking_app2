import json
import os
from config import db
from firebase_admin import firestore
from datetime import datetime, timedelta

def pretty_json(data):
  return json.dumps(data, indent = 4, ensure_ascii=False)

def getFilePath(fileName):
  return os.path.join(os.path.dirname(__file__), fileName)

def read_from_json_file(file_name):
  with open(file_name, 'r') as tmp_file:
    res = json.load(tmp_file)
  return res

def write_into_file(source, target_file_name):
  with open(target_file_name, 'w') as target:
    json.dump(source, target, indent = 4)

# Cache for currency data
currency_cache = {'data': None, 'last_updated': None}

def get_currency_json():
  global currency_cache
  now = datetime.now()
  
  # If cache is empty or older than 1 hour, refresh it
  if currency_cache['data'] is None or currency_cache['last_updated'] is None or \
    now - currency_cache['last_updated'] > timedelta(hours=1):
    doc = db.collection('currency').document('latest').get()
    if doc.exists:
      currency_cache['data'] = doc.to_dict()
      currency_cache['last_updated'] = now
    else:
      currency_cache['data'] = None
      currency_cache['last_updated'] = now
  return currency_cache['data']

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
