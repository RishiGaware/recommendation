import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION
from app.domains.dvms.services.dvms_service import _ensure_dvms_collections

def debug_full_status():
    print("--- Full Status Logic Check ---")
    try:
        client = get_qdrant_client()
        _ensure_dvms_collections(client)
        
        collections = client.get_collections().collections
        stats = {}
        for c in collections:
            stats[c.name] = client.count(c.name).count
            print(f"Count for {c.name}: {stats[c.name]}")
        
        res = client.scroll(collection_name=DVMS_DESC_COLLECTION, limit=1, with_payload=True)
        print(f"Scroll result type: {type(res)}")
        print(f"Scroll items count: {len(res[0])}")
        
        sample = res[0][0].payload if res[0] else None
        print(f"Sample payload: {sample}")
        
        data = {
            "stored_vectors": stats,
            "sample_data": sample
        }
        
        # Test serialization manually
        import json
        json_output = json.dumps(data)
        print("Success: Data is JSON serializable.")
        
    except Exception as e:
        print(f"FAIL: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_full_status()
