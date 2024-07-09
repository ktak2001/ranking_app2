import requests
import os
import csv
from base64 import b64encode
from dotenv import load_dotenv
import logging
import sys

# Load environment variables from .env file
load_dotenv()

# Get authentication info from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
API_URL = os.environ.get('API_URL', 'https://your-app-id.appspot.com')  # Set App Engine URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_request(endpoint, data):
    # Create Basic auth header
    credentials = b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode('ascii')
    headers = {
        'Authorization': f'Basic {credentials}',
        'Content-Type': 'application/json'
    }
    
    url = f"{API_URL}/{endpoint}"
    logger.info(f"Sending request to: {url}")
    logger.info(f"Request data: {data}")
    
    response = requests.post(url, headers=headers, json=data)
    return response

def send_manual_update_request(update_type):
    # Request body
    data = {
        'update_type': update_type
    }

    # Send request
    response = send_request('admin/manual_update', data)

    # Process response
    if response.status_code == 200:
        logger.info("Manual update successful:", response.json())
    else:
        logger.error(f"Error in manual update: {response.status_code} {response.text}")

def set_youtuber_superchats():
    # Read CSV file
    youtubers = []
    csv_path = '/ranking_app2/scripts/vtubers_info.csv'
    logger.info(f"Reading CSV file from: {csv_path}")
    try:
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                youtubers.append({
                    'youtuberName': row['vtuber_name'],
                    'youtuberId': row['channel_id']
                })
    except FileNotFoundError:
        logger.error(f"CSV file not found: {csv_path}")
        return
    except Exception as e:
        logger.error(f"Error reading CSV file: {str(e)}")
        return

    # Request body
    data = {
        'youtubers': youtubers
    }

    # Send request
    response = send_request('admin/set_youtuber_superchats', data)
    
    # Process response
    if response.status_code == 200:
        logger.info("Set youtuber superchats successful:", response.json())
    else:
        logger.error(f"Error in setting youtuber superchats: {response.status_code} {response.text}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == 'set_superchats':
            set_youtuber_superchats()
        elif action == 'manual_update':
            if len(sys.argv) > 2:
                update_type = sys.argv[2]
                if update_type in ['currency', 'youtube']:
                    send_manual_update_request(update_type)
                else:
                    logger.error("Invalid update type. Please enter 'currency' or 'youtube'.")
            else:
                logger.error("Please specify update type (currency/youtube).")
        else:
            logger.error("Invalid action. Please enter 'manual_update' or 'set_superchats'.")
    else:
        logger.error("Please specify an action (manual_update/set_superchats).")