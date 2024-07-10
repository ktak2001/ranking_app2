import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.admin_tasks import update_youtubers

if __name__ == "__main__":
  update_youtubers()