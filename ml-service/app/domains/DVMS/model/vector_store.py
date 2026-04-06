import os
import pickle
import faiss
from app.core.model_manager import get_shared_model

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "ml-data"))

# Two separate FAISS indices
DESC_INDEX_PATH = os.path.join(DATA_DIR, "desc.index")
ROOT_INDEX_PATH = os.path.join(DATA_DIR, "root.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")

# Legacy path kept for backwards compatibility during transition
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "deviations.index")

# Shared state between API calls
model = get_shared_model()
desc_index = None   # FAISS index built from descriptions
root_index = None   # FAISS index built from rootCauses
deviations = []     # Raw deviation objects (shared metadata)

def reload_index():
    global desc_index, root_index, deviations
    try:
        if os.path.exists(DESC_INDEX_PATH) and os.path.exists(ROOT_INDEX_PATH):
            desc_index = faiss.read_index(DESC_INDEX_PATH)
            root_index = faiss.read_index(ROOT_INDEX_PATH)
        else:
            # Fallback: load legacy single index into desc_index
            desc_index = faiss.read_index(FAISS_INDEX_PATH)
            root_index = None

        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)
        deviations = metadata["deviations"]
    except Exception as e:
        desc_index = None
        root_index = None
        deviations = []
        print(f"Warning: Could not load FAISS index or metadata: {e}. Please run training script.")

# Automatically load the index into memory when this module is first imported by the server
reload_index()
