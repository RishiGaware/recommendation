from qdrant_client.models import VectorParams, Distance
from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.response_handler import standard_response

def initialize_database_collections():
    """
    Correctly initializes Qdrant collections for the DVMS application.
    """
    client = get_qdrant_client()
    client.recreate_collection(
        collection_name=DVMS_DESC_COLLECTION, 
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    client.recreate_collection(
        collection_name=DVMS_ROOT_COLLECTION, 
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    return standard_response(
        status="success",
        message="Qdrant collections correctly initialized for the app."
    )

def fetch_qdrant_status():
    """
    Checks connection to Qdrant and returns collection stats and sample data.
    """
    client = get_qdrant_client()
    desc_c = client.count(DVMS_DESC_COLLECTION).count
    root_c = client.count(DVMS_ROOT_COLLECTION).count
    
    # Grab snippet of the first item
    res = client.scroll(
        collection_name=DVMS_DESC_COLLECTION, 
        limit=1,
        with_payload=True, 
        with_vectors=False
    )
    sample = res[0][0].payload if res[0] else None
    
    return standard_response(
        status="success",
        message="Connected to local qdrant", 
        data={
            "stored_vectors": {"dvms_desc": desc_c, "dvms_root": root_c},
            "sample_data": sample
        }
    )
