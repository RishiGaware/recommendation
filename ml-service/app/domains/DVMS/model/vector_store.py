import os
import pickle
import faiss
from app.core.model_manager import get_shared_model

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "ml-data"))
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "deviations.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")

# Shared state between api calls
model = get_shared_model()
index = None
deviations = []

def reload_index():
    global index, deviations
    try:
        index = faiss.read_index(FAISS_INDEX_PATH)
        with open(METADATA_PATH, "rb") as f:
            metadata = pickle.load(f)
        deviations = metadata["deviations"]
    except Exception as e:
        index = None
        deviations = []
        print(f"Warning: Could not load FAISS index or metadata: {e}. Please run training script.")

# Automatically load the index into memory when this module is first imported by the server
reload_index()
