import requests
from config import YOUTUBE_API_KEY
from chat_downloader import ChatDownloader
from utils.common import get_currency_json, pretty_json
import logging

class YouTubeAPI:
  BASE_URL = "https://www.googleapis.com/youtube/v3"

  def __init__(self, api_key=YOUTUBE_API_KEY):
    self.api_key = api_key

  def get_channel_info(self, channel_id):
    url = f"{self.BASE_URL}/channels?part=contentDetails,snippet&id={channel_id}&key={self.api_key}"
    response = requests.get(url).json()
    item = response["items"][0]
    return {
      "uploads_id": item["contentDetails"]["relatedPlaylists"]["uploads"],
      "youtuber_icon_url": item['snippet']['thumbnails']['medium']['url'],
      "youtuber_name": item['snippet']['title'],
      "youtuber_custom_url": item['snippet']['customUrl']
    }

  def get_playlist_items(self, playlist_id, max_results=50, page_token=None):
    url = f"{self.BASE_URL}/playlistItems?part=contentDetails&maxResults={max_results}&playlistId={playlist_id}&key={self.api_key}"
    if page_token:
      url += f"&pageToken={page_token}"
    return requests.get(url).json()

  def get_video_details(self, video_id):
    url = f"{self.BASE_URL}/videos?part=liveStreamingDetails,statistics,status,topicDetails,localizations,snippet,contentDetails&id={video_id}&key={self.api_key}"
    return requests.get(url).json()['items'][0]

  def get_videos_until_date(self, youtuber_id, YEAR, MONTH, DAY):
    channel_info = self.get_channel_info(youtuber_id)
    uploads_id = channel_info['uploads_id']
    all_video_ids = []
    next_page_token = None
    finished = False

    while not finished:
      response = self.get_playlist_items(uploads_id, page_token=next_page_token)
      next_page_token = response.get('nextPageToken')
      
      for item in response['items']:
        published_at = item['contentDetails']['videoPublishedAt']
        # "videoPublishedAt": "2024-06-24T19:04:48Z"
        year, month, day = int(published_at[:4]), int(published_at[5:7]), int(published_at[8:10])
        if year < YEAR or (year == YEAR and month < MONTH) or (year == YEAR and month == MONTH and day < DAY):
          finished = True
          break
        all_video_ids.append(item['contentDetails']['videoId'])
      
      if not next_page_token:
        finished = True

    return {
      "youtuber_id": youtuber_id,
      "youtuber_name": channel_info['youtuber_name'],
      "youtuber_icon_url": channel_info['youtuber_icon_url'],
      "youtuber_custom_url": channel_info['youtuber_custom_url']
    }, all_video_ids

  def process_videos(self, video_ids):
    return [self.get_video_details(vid_id) for vid_id in video_ids]
  
  def get_superchats(self, url):
    currency_json = get_currency_json()
    try:
      chat = ChatDownloader().get_chat(url, message_groups=["superchat"])
    except Exception as err:
      logging.error(f"error: {err=}")
      raise
    total_superchat_earnings = 0.0
    res = {}
    for i, message in enumerate(chat):
      if message['message_type'] == 'paid_message' or message['message_type'] == 'paid_sticker':
        message_money = int(message['money']['amount'])
        message_currency = message['money']['currency']
        jpn_msg = message_money / currency_json["conversion_rates"][message_currency]
        total_superchat_earnings += jpn_msg
        supporter_id = message["author"]["id"]
        obj = {
          "supporterName": message["author"]["name"],
          "supporterId": supporter_id,
          "amount": jpn_msg,
          "supporterIconUrl": message['author']['images'][0]['url']
        }
        logging.info(f"chat No.{i}: {obj}")
        if supporter_id not in res:
          res[supporter_id] = obj
        else:
          res[supporter_id]['amount'] += jpn_msg
    return res, total_superchat_earnings
  
  def test_get_superchats(self, url):
    try:
      chat = ChatDownloader().get_chat(url, message_groups=["superchat"])
    except Exception as err:
      logging.error(f"error: {err=}")
      raise
    for i, message in enumerate(chat):
      if message['message_type'] == 'paid_message' or message['message_type'] == 'paid_sticker':
          print(f"{i}: {pretty_json(message)}")