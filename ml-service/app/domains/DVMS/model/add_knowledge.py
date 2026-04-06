import pickle
import numpy as np
import faiss
import app.domains.DVMS.model.vector_store as store

def add_to_index(data: dict):
    """
    Vectorizes a new deviation separately for description and rootCauses,
    adds it to BOTH FAISS indices (RAM), and persists to disk.
    """
    if store.desc_index is None:
        return {"error": "FAISS index not initialized. Please run training script once."}

    description = str(data.get("description", "") or "").strip()
    root_causes = str(data.get("rootCauses", "") or "").strip()

    if not description and not root_causes:
        return {"error": "No meaningful text found to vectorize."}

    # Fallback: if only one is provided, use it for both
    desc_text = description or root_causes
    root_text = root_causes or description

    def encode(text):
        vec = store.model.encode([text])
        vec = np.array(vec).astype("float32")
        faiss.normalize_L2(vec)
        return vec

    # Add to description index
    store.desc_index.add(encode(desc_text))

    # Add to rootCauses index (create if missing)
    if store.root_index is None:
        dim = store.desc_index.d
        store.root_index = faiss.IndexFlatIP(dim)
    store.root_index.add(encode(root_text))

    # Update in-memory deviations list
    store.deviations.append(data)

    # Persist both indices and metadata to disk
    try:
        faiss.write_index(store.desc_index, store.DESC_INDEX_PATH)
        faiss.write_index(store.root_index, store.ROOT_INDEX_PATH)
        with open(store.METADATA_PATH, "wb") as f:
            pickle.dump({"deviations": store.deviations}, f)

        return {
            "status": "success",
            "message": f"Deviation '{data.get('deviation_no', 'New')}' vectorized and added to both description and rootCauses indices.",
            "total_vectors": len(store.deviations)
        }
    except Exception as e:
        return {"error": f"Failed to persist index: {str(e)}"}
