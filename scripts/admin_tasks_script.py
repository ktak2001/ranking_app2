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
API_KEY = os.environ.get('API_KEY')
API_URL = os.environ.get('API_URL', 'https://your-app-id.appspot.com')  # Set App Engine URL

def send_request(endpoint, data):
  headers = {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json'
  }
  response = requests.post(f"{API_URL}/{endpoint}", headers=headers, json=data)
  return response

def send_manual_update_request(update_type):
  # Create Basic auth header
  credentials = b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode('ascii')
  headers = {
    'Authorization': f'Basic {credentials}',
    'Content-Type': 'application/json'
  }

  # Request body
  data = {
    'update_type': update_type
  }

  # Send request
  response = send_request('admin/manual_update', data)

  # Process response
  if response.status_code == 200:
    print("Manual update successful:", response.json())
  else:
    print("Error in manual update:", response.status_code, response.text)

def set_youtuber_superchats():
  # Read CSV file
  youtubers = []
  with open('/ranking_app2/scripts/vtubers_info.csv', 'r', encoding='utf-8') as file:
    csv_reader = csv.DictReader(file)
    for row in csv_reader:
      youtubers.append({
        'youtuberName': row['vtuber_name'],
        'youtuberId': row['channel_id']
      })

  # Create Basic auth header
  credentials = b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode('ascii')
  headers = {
    'Authorization': f'Basic {credentials}',
    'Content-Type': 'application/json'
  }

  # Request body
  data = {
    'youtubers': youtubers
  }

  # Send request
  response = send_request('admin/set_youtuber_superchats', data)
  logging.info(f"{API_URL}/admin/set_youtuber_superchats")
  logging.info("youtubers", youtubers)

  # Process response
  if response.status_code == 200:
    print("Set youtuber superchats successful:", response.json())
  else:
    print("Error in setting youtuber superchats:", response.status_code, response.text)

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
                    print("Invalid update type. Please enter 'currency' or 'youtube'.")
            else:
                print("Please specify update type (currency/youtube).")
        else:
            print("Invalid action. Please enter 'manual_update' or 'set_superchats'.")
    else:
        print("Please specify an action (manual_update/set_superchats).")
