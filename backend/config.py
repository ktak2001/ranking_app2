import os
import firebase_admin
from firebase_admin import credentials, firestore

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
WEB_URL = os.environ.get('WEB_URL')

is_app_engine = os.environ.get('GAE_ENV', '').startswith('standard')

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

db = firestore.client()