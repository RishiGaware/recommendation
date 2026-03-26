import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import pickle
from app.data.deviations import deviations as base_deviations

# Path to save artifacts
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_INDEX_PATH = os.path.join(MODEL_DIR, "deviations.index")
METADATA_PATH = os.path.join(MODEL_DIR, "embeddings.pkl")
CUSTOM_DEVIATIONS_PATH = os.path.join(MODEL_DIR, "..", "..", "..", "backend", "data", "custom_deviations.json")

model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_whole_text(d):
    """Extracts all meaningful text from a deviation object for semantic indexing."""
    text_parts = [
        d.get("deviation_no", ""),
        d.get("description", "") or "",
        d.get("deviation_type", "") or "",
        d.get("severity", "") or d.get("deviation_classification", "") or "",
        d.get("remarks", "") or d.get("correction_action", "") or ""
    ]
    
    # Add investigation approach details
    approach_list = d.get("investigation_approach") or []
    if isinstance(approach_list, list):
        for app in approach_list:
            text_parts.append(app.get("methodology", "") or "")
            text_parts.append(app.get("findings", "") or "")
            
    # Add investigation report details
    report_list = d.get("investigation_report") or []
    if isinstance(report_list, list):
        for rep in report_list:
            text_parts.append(rep.get("finding", "") or "")
            text_parts.append(rep.get("root_cause_type", "") or "")
            text_parts.append(rep.get("impact", "") or "")
            text_parts.append(rep.get("categorization", "") or "")
            
    return " ".join([str(p).strip() for p in text_parts if p])

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

print(f"FAISS Training completed. Indexed {len(all_deviations)} deviations with whole-object context.")
