from qdrant_client import QdrantClient
import os

# Configuration (mirrored from app.db.qdrant)
STORAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "app", "domains", "DVMS", "qdrant_storage"))

def peek_qdrant():
    print(f"--- Qdrant Browser (Embedded Mode) ---")
    print(f"Storage path: {STORAGE_PATH}")
    
    if not os.path.exists(STORAGE_PATH):
        print("Error: Qdrant storage folder not found. Have you run the training script?")
        return

    try:
        # Connect to the local folder
        client = QdrantClient(path=STORAGE_PATH)
        collections = client.get_collections().collections
        
        if not collections:
            print("No collections found.")
            return

        for collection_info in collections:
            collection_name = collection_info.name
            vector_count = client.count(collection_name).count
            print(f"\n[Collection: {collection_name}] ({vector_count} vectors)")
            
            # Scroll to see valid payload samples
            scroll_result = client.scroll(collection_name=collection_name, limit=10, with_payload=True)
            batch_points = scroll_result[0]
            
            for point in batch_points:
                deviation_number = point.payload.get("deviation_no", "N/A")
                short_description = point.payload.get("description", "N/A")[:60]
                print(f" - ID {point.id}: [{deviation_number}] {short_description}...")
                
    except Exception as e:
        if "already used by another process" in str(e):
            print("\n!!! ERROR: Qdrant storage is currently LOCKED by the running server.")
            print("Please stop the ML service (Uvicorn) before running this peek utility.")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    peek_qdrant()
