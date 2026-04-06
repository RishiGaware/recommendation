import os
import sys
import json
import numpy as np
import faiss
import pickle

# Add the root directory to the path so it can find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

from app.core.model_manager import get_shared_model
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the consolidated deviations.json in the backend
DEVIATIONS_PATH = os.path.abspath(os.path.join(MODEL_DIR, "..", "..", "..", "..", "..", "backend", "data", "deviations.json"))

# Internal ML metadata and index storage
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "ml-data"))
DESC_INDEX_PATH = os.path.join(DATA_DIR, "desc.index")
ROOT_INDEX_PATH = os.path.join(DATA_DIR, "root.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")

model = get_shared_model()

def safe_text(val):
    return str(val).strip() if val else ""

def train_model():
    """
    Trains TWO vector indices from scratch:
      1. desc.index  - built from deviation descriptions
      2. root.index  - built from rootCauses text
    """
    all_deviations = []

    # Load consolidated deviations
    if os.path.exists(DEVIATIONS_PATH):
        try:
            with open(DEVIATIONS_PATH, "r", encoding="utf-8") as f:
                all_deviations = json.load(f)
        except Exception as e:
            print(f"Error loading deviations: {e}")
    else:
        print(f"Warning: Data file not found at {DEVIATIONS_PATH}")

    if not all_deviations:
        return {"error": "No deviations found to train on."}

    # Build text lists for each dimension
    desc_texts = [safe_text(d.get("description")) for d in all_deviations]
    root_texts = [
        safe_text(d.get("rootCauses")) or safe_text(d.get("description"))
        for d in all_deviations
    ]

    def build_index(texts):
        embeddings = model.encode(texts)
        embeddings = np.array(embeddings).astype("float32")
        faiss.normalize_L2(embeddings)
        idx = faiss.IndexFlatIP(embeddings.shape[1])
        idx.add(embeddings)
        return idx

    desc_index = build_index(desc_texts)
    root_index = build_index(root_texts)

    os.makedirs(DATA_DIR, exist_ok=True)
    faiss.write_index(desc_index, DESC_INDEX_PATH)
    faiss.write_index(root_index, ROOT_INDEX_PATH)

    with open(METADATA_PATH, "wb") as f:
        pickle.dump({"deviations": all_deviations}, f)

    # Hot-reload in memory
    try:
        from app.domains.DVMS.model.vector_store import reload_index
        reload_index()
    except Exception:
        pass

    message = f"Training completed. Built 2 indices (desc + root) with {len(all_deviations)} total items."
    print(message)
    return {"message": message, "total_vectors": len(all_deviations)}

if __name__ == "__main__":
    train_model()
