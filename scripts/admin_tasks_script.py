import requests
import os
import csv
from base64 import b64encode
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

# Get authentication info from environment variables
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
API_URL = os.environ.get('API_URL', 'https://your-app-id.appspot.com')  # Set App Engine URL

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
  response = requests.post(f"{API_URL}/admin/manual_update", headers=headers, json=data)

  # Process response
  if response.status_code == 200:
    print("Manual update successful:", response.json())
  else:
    print("Error in manual update:", response.status_code, response.text)

def set_youtuber_superchats():
  # Read CSV file
  youtubers = []
  with open('vtubers_info.csv', 'r', encoding='utf-8') as file:
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
  response = requests.post(f"{API_URL}/admin/set_youtuber_superchats", headers=headers, json=data)
  logging.info(f"{API_URL}/admin/set_youtuber_superchats")
  logging.info("youtubers", youtubers)

  # Process response
  if response.status_code == 200:
    print("Set youtuber superchats successful:", response.json())
  else:
    print("Error in setting youtuber superchats:", response.status_code, response.text)

if __name__ == "__main__":
  action = input("Enter action (manual_update/set_superchats): ").strip().lower()
  if action == 'manual_update':
    update_type = input("Enter update type (currency/youtube): ").strip().lower()
    if update_type in ['currency', 'youtube']:
      send_manual_update_request(update_type)
    else:
      print("Invalid update type. Please enter 'currency' or 'youtube'.")
  elif action == 'set_superchats':
    set_youtuber_superchats()
  else:
    print("Invalid action. Please enter 'manual_update' or 'set_superchats'.")
