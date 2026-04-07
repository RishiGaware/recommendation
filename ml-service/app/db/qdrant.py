from qdrant_client import QdrantClient

# Share a single connection across the app. Using embedded embedded Qdrant (NO Docker)
import os

STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "domains", "DVMS", "qdrant_storage"))
os.makedirs(STORAGE_PATH, exist_ok=True)

_client = None

def get_qdrant_client():
    global _client
    if _client is None:
        try:
            _client = QdrantClient(path=STORAGE_PATH)
        except Exception as e:
            # Handle lock issues gracefully by retrying or raising context-rich error
            raise RuntimeError(f"Could not initialize QdrantClient at {STORAGE_PATH}. Is it locked? Error: {e}")
    return _client

# We use two separate collections
DVMS_DESC_COLLECTION = "dvms_desc"    # indexed by description
DVMS_ROOT_COLLECTION = "dvms_root"    # indexed by rootCauses
