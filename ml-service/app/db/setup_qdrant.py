import os
import sys

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

# Connect to Qdrant local embedded database
STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "qdrant_storage"))
os.makedirs(STORAGE_PATH, exist_ok=True)

try:
    client = QdrantClient(path=STORAGE_PATH)
    print(f"Connected to Qdrant Local at {STORAGE_PATH} successfully.")
except Exception as e:
    print(f"Failed to connect to Qdrant: {e}")
    sys.exit(1)

# 384 = dimension of all-MiniLM-L6-v2 embeddings
for name in ["dvms_desc", "dvms_root"]:
    try:
        client.recreate_collection(
            collection_name=name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        print(f"Collection '{name}' created/recreated.")
    except Exception as e:
        print(f"Error creating collection '{name}': {e}")
