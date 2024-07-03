from config import db

class YoutuberManager:
    def __init__(self, youtuber_id):
        self.youtuber_ref = db.collection('youtubers').document(youtuber_id)
    
    def get_youtuber_data(self):
        return self.youtuber_ref.get().to_dict()
    
    def update_youtuber_doc(self, data):
        self.youtuber_ref.set(data, merge=True)
        return True