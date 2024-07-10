import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.admin_tasks import set_youtuber_superChats
import logging
logger = logging.getLogger(__name__)
import csv

def init():
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
    set_youtuber_superChats(youtubers)