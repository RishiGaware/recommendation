import time
from qdrant_client.models import PointStruct
from app.db.qdrant import client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model

# Shared state between API calls
model = get_shared_model()

def add_to_index(data: dict):
    """
    Vectorizes a new deviation separately for description and rootCauses,
    adds it to BOTH Qdrant collections.
    """
    try:
        description = str(data.get("description", "") or "").strip()
        root_causes = str(data.get("rootCauses", "") or "").strip()

        if not description and not root_causes:
            return {"error": "No meaningful text found to vectorize."}

        # Fallback logic
        desc_text = description or root_causes
        root_text = root_causes or description

        # Qdrant IDs must be 64-bit ints or UUIDs
        point_id_raw = data.get("id")
        try:
            point_id = int(point_id_raw)
        except (ValueError, TypeError):
            point_id = int(time.time() * 1000)

        # 1. Vectorize description
        desc_vec = model.encode([desc_text])[0].tolist()
        client.upsert(
            collection_name=DVMS_DESC_COLLECTION,
            points=[PointStruct(id=point_id, vector=desc_vec, payload=data)]
        )

        # 2. Vectorize root causes
        root_vec = model.encode([root_text])[0].tolist()
        client.upsert(
            collection_name=DVMS_ROOT_COLLECTION,
            points=[PointStruct(id=point_id, vector=root_vec, payload=data)]
        )

        count_res = client.count(collection_name=DVMS_DESC_COLLECTION)
        
        return {
            "status": "success",
            "message": f"Deviation '{data.get('deviation_no')}' indexed instantly.",
            "total_vectors": count_res.count
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"Internal Indexing Error: {str(e)}"}
