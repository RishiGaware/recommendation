import pickle
import numpy as np
import faiss
import app.domains.DVMS.model.vector_store as store

def add_to_index(data: dict):
    """
    Vectorizes a new deviation, adds it to the FAISS index (RAM), 
    and persists both index and metadata to disk.
    """

    if store.index is None:
        # If index is missing, we must initialize a baseline index first
        return {"error": "FAISS index not initialized. Please run training script once."}

    text_parts = [
        data.get("description", ""),
        data.get("rootCauses", ""),
        data.get("deviationType", ""),
        data.get("deviationClassification", "")
    ]
    input_text = " ".join([str(p).strip() for p in text_parts if p])
    
    if not input_text.strip():
        return {"error": "No meaningful text found to vectorize."}

    # Encode and normalize
    new_vec = store.model.encode([input_text])
    new_vec = np.array(new_vec).astype('float32')
    faiss.normalize_L2(new_vec)

    # 1. Update in RAM
    store.index.add(new_vec)
    store.deviations.append(data)

    # 2. Persist to Disk
    try:
        faiss.write_index(store.index, store.FAISS_INDEX_PATH)
        with open(store.METADATA_PATH, "wb") as f:
            pickle.dump({"deviations": store.deviations}, f)
        
        return {
            "status": "success",
            "message": f"Deviation '{data.get('deviation_no', 'New')}' vectorized and added to index.",
            "total_vectors": len(store.deviations)
        }
    except Exception as e:
        return {"error": f"Failed to persist index: {str(e)}"}
