import os
from flask import Flask, request, jsonify
from utils.youtube_api import YouTubeAPI  # YouTubeAPIクラスをインポート

app = Flask(__name__)
youtube_api = YouTubeAPI()

@app.route('/api/test_superchats', methods=['GET'])
def test_superchats():
    url = "https://www.youtube.com/watch?v=VrDjuKefp20"
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    try:
        youtube_api.test_get_superchats(url)
        return jsonify({
            "success": "true"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    app.run(host='0.0.0.0', port=port, debug=True)