import os
import sys
import json

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

from app.core.model_manager import get_shared_model
from qdrant_client.models import PointStruct
from app.db.qdrant import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the consolidated deviations.json in the backend
DEVIATIONS_PATH = os.path.abspath(os.path.join(MODEL_DIR, "..", "..", "..", "..", "..", "backend", "data", "deviations.json"))

model = get_shared_model()

def safe_text(val):
    return str(val).strip() if val else ""

def train_model():
    """
    Trains TWO Qdrant vector indices from scratch:
      1. dvms_desc  - built from deviation descriptions
      2. dvms_root  - built from rootCauses text
    """
    all_deviations = []

    # Load consolidated deviations
    if os.path.exists(DEVIATIONS_PATH):
        try:
            with open(DEVIATIONS_PATH, "r", encoding="utf-8") as f:
                all_deviations = json.load(f)
        except Exception as e:
            print(f"Error loading deviations: {e}")
    else:
        print(f"Warning: Data file not found at {DEVIATIONS_PATH}")

    if not all_deviations:
        return {"error": "No deviations found to train on."}

    desc_points = []
    root_points = []
    
    # Process batches rather than single elements if possible, or just generate list
    for idx, dev in enumerate(all_deviations):
        dev_id = int(dev.get("id", idx))

        desc_text = safe_text(dev.get("description"))
        root_text = safe_text(dev.get("rootCauses")) or desc_text
        
        desc_vec = model.encode([desc_text])[0].tolist()
        root_vec = model.encode([root_text])[0].tolist()
        
        desc_points.append(PointStruct(id=dev_id, vector=desc_vec, payload=dev))
        root_points.append(PointStruct(id=dev_id, vector=root_vec, payload=dev))

    # Upsert batches to Qdrant (you can chunk it if it's large)
    try:
        client.upsert(collection_name=DVMS_DESC_COLLECTION, points=desc_points)
        client.upsert(collection_name=DVMS_ROOT_COLLECTION, points=root_points)
    except Exception as e:
        print(f"Failed to upsert vectors to Qdrant: {e}")
        return {"error": str(e)}

    message = f"Training completed. Rebuilt 2 Qdrant collections (desc + root) with {len(all_deviations)} total items."
    print(message)
    return {"message": message, "total_vectors": len(all_deviations)}

if __name__ == "__main__":
    train_model()
