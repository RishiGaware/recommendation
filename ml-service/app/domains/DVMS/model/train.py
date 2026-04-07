import os
import sys
import json

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

from app.core.model_manager import get_shared_model
from qdrant_client.models import PointStruct
from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

def train_model(all_deviations: list):
    """
    Trains TWO Qdrant vector indices from scratch using the provided bulk data:
      1. dvms_desc  - built from deviation descriptions
      2. dvms_root  - built from rootCauses text
    """
    client = get_qdrant_client()
    if not all_deviations:
        return {"error": "No deviations found in the payload to train on."}

    # Reset collections for a clean full re-index
    from qdrant_client.models import VectorParams, Distance
    client.recreate_collection(collection_name=DVMS_DESC_COLLECTION, vectors_config=VectorParams(size=384, distance=Distance.COSINE))
    client.recreate_collection(collection_name=DVMS_ROOT_COLLECTION, vectors_config=VectorParams(size=384, distance=Distance.COSINE))

    batch_size = 100
    total_items = len(all_deviations)

    for i in range(0, total_items, batch_size):
        batch = all_deviations[i : i + batch_size]
        description_points = []
        root_cause_points = []

        # Batch encode for efficiency
        descriptions = [safe_text(dev.get("description")) for dev in batch]
        root_causes = [safe_text(dev.get("rootCauses")) or desc for dev, desc in zip(batch, descriptions)]
        
        description_vectors = model.encode(descriptions).tolist()
        root_cause_vectors = model.encode(root_causes).tolist()

        for idx, (dev, desc_v, root_v) in enumerate(zip(batch, description_vectors, root_cause_vectors)):
            # Qdrant IDs must be 64-bit ints or UUIDs
            deviation_id = int(dev.get("id", i + idx))
            
            description_points.append(PointStruct(id=deviation_id, vector=desc_v, payload=dev))
            root_cause_points.append(PointStruct(id=deviation_id, vector=root_v, payload=dev))

        # Upsert this batch
        try:
            client.upsert(collection_name=DVMS_DESC_COLLECTION, points=description_points)
            client.upsert(collection_name=DVMS_ROOT_COLLECTION, points=root_cause_points)
            print(f"Indexed batch {i//batch_size + 1}: {len(batch)} items successfully.")
        except Exception as e:
            print(f"Failed to upsert batch starting at {i}: {e}")
            return {"error": f"Batch upsert failed: {str(e)}"}

    message = f"Training completed. Rebuilt 2 Qdrant collections with {total_items} total items via bulk payload."
    print(message)
    return {"message": message, "total_vectors": total_items}

if __name__ == "__main__":
    train_model()
