from typing import Optional
from qdrant_client import QdrantClient

# Share a single connection across the app. Using embedded embedded Qdrant (NO Docker)
import os

from app.core.config import settings

STORAGE_PATH = settings.QDRANT_STORAGE_PATH
os.makedirs(STORAGE_PATH, exist_ok=True)

_clients = {}

def get_qdrant_client(path: Optional[str] = None):
    global _clients
    target_path = path or STORAGE_PATH
    
    if target_path not in _clients:
        try:
            os.makedirs(target_path, exist_ok=True)
            _clients[target_path] = QdrantClient(path=target_path)
        except Exception as e:
            raise RuntimeError(f"Could not initialize QdrantClient at {target_path}. Error: {e}")
    return _clients[target_path]

# Collection names from centralized settings
DVMS_DESC_COLLECTION = settings.DVMS_DESC_COLLECTION
DVMS_ROOT_COLLECTION = settings.DVMS_ROOT_COLLECTION
