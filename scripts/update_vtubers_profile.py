import google.cloud.logging
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.config import db, YOUTUBE_API_KEY
from backend.utils.youtube_api import YouTubeAPI
from datetime import datetime
import google.cloud.logging, logging

client = google.cloud.logging.Client(); client.setup_logging()
logger = logging.getLogger(__name__)
yt = YouTubeAPI()

def main():
    vtubers = db.collection("youtubers").stream()
    for doc in vtubers:
        data = doc.to_dict()
        cid = data["youtuberId"]
        info = yt.get_channel_info(cid)   # あなたの util にある想定
        doc.reference.set({
            "youtuberName":  info["youtuber_name"],
            "youtuberIconUrl": info["youtuber_icon_url"],
            "youtuberCustomUrl": info["youtuber_custom_url"],
        }, merge=True)
        logger.info(f"Updated {cid}")

if __name__ == "__main__":
    main()
