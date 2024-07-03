import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# Use a service account.
cred = credentials.Certificate('/Users/takehikazuki/Desktop/my_app/ranking_app2/python_files/credential/service_account_key.json')

app = firebase_admin.initialize_app(cred)

db = firestore.client()