from qdrant_client import QdrantClient
import os
import sys

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings

def check_all_collections():
    STORAGE_PATH = settings.QDRANT_STORAGE_PATH
    print(f"Connecting to Qdrant at: {STORAGE_PATH}")
    client = QdrantClient(path=STORAGE_PATH)
    
    collections = client.get_collections().collections
    if not collections:
        print("No collections found.")
        return

    for c in collections:
        count = client.count(c.name).count
        print(f"Collection: {c.name} | Vectors: {count}")

if __name__ == "__main__":
    check_all_collections()
