import os
from sentence_transformers import SentenceTransformer
import pickle
from app.data.deviations import deviations

# Path to save embeddings relative to this file
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
EMBEDDINGS_PATH = os.path.join(MODEL_DIR, "embeddings.pkl")

model = SentenceTransformer('all-MiniLM-L6-v2')

# Map deviation_no and description to text for embedding
texts = [d.get("deviation_no", "") + " " + d.get("description", "") for d in deviations]

embeddings = model.encode(texts)

# Save embeddings + data
with open(EMBEDDINGS_PATH, "wb") as f:
    pickle.dump({
        "embeddings": embeddings,
        "deviations": deviations
    }, f)

print("Training completed & embeddings saved")
