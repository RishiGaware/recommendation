import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.qdrant import get_qdrant_client
from app.domains.dvms.services.dvms_service import _ensure_dvms_collections, DVMS_DESC_COLLECTION

def debug_qdrant():
    print("--- Qdrant Diagnostic ---")
    try:
        client = get_qdrant_client()
        print("Success: Qdrant client initialized.")
        
        _ensure_dvms_collections(client)
        print("Success: DVMS collections ensured.")
        
        collections = client.get_collections().collections
        print(f"Collections found: {[c.name for c in collections]}")
        
        for c in collections:
            count = client.count(c.name).count
            print(f" - {c.name}: {count} vectors")
            
        print("--- Diagnostic Complete ---")
    except Exception as e:
        print(f"FAIL: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_qdrant()
