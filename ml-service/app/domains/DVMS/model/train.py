import os
import sys
import json
import numpy as np
import faiss
import pickle

# Add the root directory to the path so it can find the 'app' module
# We are currently in ml-service/app/domains/DVMS/model/
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))

from app.core.model_manager import get_shared_model
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the consolidated deviations.json in the backend
DEVIATIONS_PATH = os.path.abspath(os.path.join(MODEL_DIR, "..", "..", "..", "..", "..", "backend", "data", "deviations.json"))

# Internal ML metadata and index storage
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "ml-data"))
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "deviations.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")

model = get_shared_model()

def extract_whole_text(d):
    """Extracts strictly required text from a deviation object for semantic indexing."""
    text_parts = [
        d.get("description", "") or "",
        d.get("deviation_type") or d.get("deviationType") or "",
        d.get("severity") or d.get("deviation_classification") or d.get("deviationClassification") or "",
        d.get("rootCauses") or ""
    ]
    return " ".join([str(p).strip() for p in text_parts if p])

def train_model():
    """
    Trains the vector model by rebuilding the index from scratch using all data.
    """
    all_deviations = []

    # Load consolidated deviations
    if os.path.exists(DEVIATIONS_PATH):
        try:
            with open(DEVIATIONS_PATH, "r") as f:
                all_deviations = json.load(f)
        except Exception as e:
            print(f"Error loading deviations: {e}")
    else:
        print(f"Warning: Data file not found at {DEVIATIONS_PATH}")

    # Map "whole object" to text for embedding
    texts = [extract_whole_text(d) for d in all_deviations]

    # Generate embeddings
    embeddings = model.encode(texts)
    embeddings = np.array(embeddings).astype('float32')

    # Create and save FAISS index
    dimension = embeddings.shape[1]
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    faiss.write_index(index, FAISS_INDEX_PATH)

    # Save metadata
    with open(METADATA_PATH, "wb") as f:
        pickle.dump({"deviations": all_deviations}, f)

    # Hot-reload in memory
    try:
        from app.domains.DVMS.model.vector_store import reload_index
        reload_index()
    except Exception:
        pass
        
    message = f"Training completed. Rebuilt index with {len(all_deviations)} total items."
    return {"message": message, "total_vectors": len(all_deviations)}

if __name__ == "__main__":
    train_model()
