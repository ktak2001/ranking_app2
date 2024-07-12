import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from admin_tasks import set_youtuber_superChats
import logging
logging.basicConfig(filename='/tmp/startup-script.log', level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
    set_youtuber_superChats(youtubers[1:4])

if __name__ == "__main__":
    try:
        init()
        logger.info("Script completed successfully")
    except Exception as e:
        logger.exception(f"An error occurred: {str(e)}")