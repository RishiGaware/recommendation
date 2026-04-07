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

        for coll in collections:
            name = coll.name
            count = client.count(name).count
            print(f"\n[Collection: {name}] ({count} vectors)")
            
            # Scroll to see valid payload samples
            res = client.scroll(collection_name=name, limit=10, with_payload=True)
            points = res[0]
            
            for p in points:
                dev_no = p.payload.get("deviation_no", "N/A")
                desc = p.payload.get("description", "N/A")[:60]
                print(f" - ID {p.id}: [{dev_no}] {desc}...")
                
    except Exception as e:
        if "already used by another process" in str(e):
            print("\n!!! ERROR: Qdrant storage is currently LOCKED by the running server.")
            print("Please stop the ML service (Uvicorn) before running this peek utility.")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    peek_qdrant()
