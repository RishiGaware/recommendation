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
from app.domains.DVMS.data.deviations import deviations as base_deviations

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# The storage is self-contained strictly within the deviation domain
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "ml-data"))
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "deviations.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")
# The custom dev json lives in the node.js backend. We calculate the absolute path:
# ...\ml-service\app\domains\deviation\model\  -> back 6 levels to get to desktop/dvms_recommendation -> then dive down
CUSTOM_DEVIATIONS_PATH = os.path.join(MODEL_DIR, "..", "..", "..", "..", "..", "backend", "data", "custom_deviations.json")

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
    # Load base deviations
    all_deviations = list(base_deviations)

    # Load custom deviations if they exist
    if os.path.exists(CUSTOM_DEVIATIONS_PATH):
        try:
            with open(CUSTOM_DEVIATIONS_PATH, "r") as f:
                custom_deviations = json.load(f)
                all_deviations.extend(custom_deviations)
        except Exception as e:
            print(f"Error loading custom deviations: {e}")

    # Map "whole object" to text for embedding
    texts = [extract_whole_text(d) for d in all_deviations]

    # Generate embeddings
    embeddings = model.encode(texts)
    embeddings = np.array(embeddings).astype('float32')

    # Create and save FAISS index
    dimension = embeddings.shape[1]
    # IndexFlatIP is for Inner Product, which is equivalent to Cosine Similarity if vectors are normalized
    # SentenceTransformers usually recommends Inner Product on normalized vectors
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(dimension)
    index.add(embeddings)

    faiss.write_index(index, FAISS_INDEX_PATH)

    # Save metadata (mappings and original objects)
    with open(METADATA_PATH, "wb") as f:
        pickle.dump({
            "deviations": all_deviations
        }, f)

    message = f"FAISS Training completed. Indexed {len(all_deviations)} deviations with whole-object context."
    print(message)
    
    # Reload predictor in memory if available
    try:
        from app.domains.DVMS.model.vector_store import reload_index
        reload_index()
    except Exception:
        pass
        
    return {"message": message, "total_vectors": len(all_deviations)}

if __name__ == "__main__":
    train_model()
