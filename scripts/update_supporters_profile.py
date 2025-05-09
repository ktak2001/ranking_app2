import google.cloud.logging
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.config import db
from backend.utils.youtube_api import YouTubeAPI
from datetime import datetime
import google.cloud.logging, logging

client = google.cloud.logging.Client(); client.setup_logging()
logger = logging.getLogger(__name__)
yt = YouTubeAPI()

def main():
    supporters = db.collection("supporters").stream()
    for doc in supporters:
        data = doc.to_dict()
        sid = data["supporterId"]
        info = yt.get_channel_info(sid)
        doc.reference.set({
            "supporterName":  info["youtuber_name"],
            "supporterIconUrl": info["youtuber_icon_url"],
            "supporterCustomUrl": info["youtuber_custom_url"]
        }, merge=True)
        logger.info(f"Updated {sid}")

if __name__ == "__main__":
    main()
