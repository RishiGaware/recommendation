from qdrant_client import QdrantClient

# Share a single connection across the app. Using embedded embedded Qdrant (NO Docker)
import os

from app.core.config import settings

STORAGE_PATH = settings.QDRANT_STORAGE_PATH
os.makedirs(STORAGE_PATH, exist_ok=True)

_client = None

def get_qdrant_client():
    global _client
    if _client is None:
        try:
            # We prioritize the path from settings
            _client = QdrantClient(path=STORAGE_PATH)
        except Exception as e:
            raise RuntimeError(f"Could not initialize QdrantClient at {STORAGE_PATH}. Error: {e}")
    return _client

# Collection names from centralized settings
DVMS_DESC_COLLECTION = settings.DVMS_DESC_COLLECTION
DVMS_ROOT_COLLECTION = settings.DVMS_ROOT_COLLECTION
