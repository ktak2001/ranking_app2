import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
WEB_URL = os.environ.get('WEB_URL')
API_KEY = os.environ.get('API_KEY')
GOOGLE_CLOUD_PROJECT = os.environ.get('GOOGLE_CLOUD_PROJECT')

def access_secret_version(project_id, secret_id, version_id="latest"):
    try:
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("UTF-8")
    except ImportError:
        print("Warning: google-cloud-secret-manager not available. Falling back to environment variables.")
        return os.environ.get(secret_id)

if not GOOGLE_CLOUD_PROJECT:
    raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is not set")

YOUTUBE_API_KEY = access_secret_version(GOOGLE_CLOUD_PROJECT, "YOUTUBE_API_KEY")
STRIPE_API_KEY = access_secret_version(GOOGLE_CLOUD_PROJECT, "STRIPE_API_KEY")

# Initialize Firebase Admin SDK
def initialize_firebase():
    if 'K_SERVICE' in os.environ:  # Check if running in Cloud Run
        # Fetch Firebase credentials from Secret Manager
        firebase_creds_json = access_secret_version(GOOGLE_CLOUD_PROJECT, "FIREBASE_CREDENTIALS")
        cred = credentials.Certificate(json.loads(firebase_creds_json))
    else:
        # Use local credentials file for development
        cred = credentials.Certificate(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))
    
    firebase_admin.initialize_app(cred)

initialize_firebase()
db = firestore.client()