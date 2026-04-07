import os
import sys

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

from qdrant_client.models import VectorParams, Distance
from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.response_handler import standard_response

def clear_knowledge():
    """
    CLEARS all AI knowledge by recreating the Qdrant collections.
    This creates a clean slate. Indexing should then be handled via the 'add-knowledge' service.
    """
    qdrant_client = get_qdrant_client()
    try:
        # Recreating a collection is the fastest way to wipe all data and reset the index
        qdrant_client.recreate_collection(
            collection_name=DVMS_DESC_COLLECTION, 
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        qdrant_client.recreate_collection(
            collection_name=DVMS_ROOT_COLLECTION, 
            vectors_config=VectorParams(size=384, distance=Distance.COSINE)
        )
        
        message = "AI Knowledge has been successfully cleared."
        print(message)
        
        return standard_response(
            status="success",
            message=message,
            data={
                "stored_vectors": 0
            }
        )
    except Exception as error:
        return standard_response(
            status="error",
            message=f"Failed to clear AI knowledge: {str(error)}",
            status_code=500
        )

if __name__ == "__main__":
    clear_knowledge()
