import json
import os
from config import db
from firebase_admin import firestore
from datetime import datetime, timedelta

def pretty_json(data):
    return json.dumps(data, indent=4, ensure_ascii=False)

def getFilePath(fileName):
    return os.path.join(os.path.dirname(__file__), fileName)

def read_from_json_file(file_name):
    with open(file_name, 'r') as tmp_file:
        res = json.load(tmp_file)
    return res

def write_into_file(source, target_file_name):
    with open(target_file_name, 'w') as target:
        json.dump(source, target, indent=4)

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

def update_one_supporter(supporter, _year, _month, amount, youtuber_id):
    supporter_name, supporter_id, supporter_icon_url, supporter_custom_url = (
        supporter[k] for k in ('supporterName', 'supporterId', 'supporterIconUrl', 'supporterCustomUrl')
    )
    new_amount = firestore.Increment(amount)
    youtuber_supporter_ref = db.collection('youtubers').document(youtuber_id).collection('supporters').document(supporter_id)
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
    supporter_ref = db.collection("supporters").document(supporter_id)
    supporter_doc = supporter_ref.get()
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