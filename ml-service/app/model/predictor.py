import os
import pickle
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Path to artifacts (Project root / ml-data)
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
# Move up 3 levels to reach dvms_recommendation/ then into ml-data/
DATA_DIR = os.path.abspath(os.path.join(MODEL_DIR, "..", "..", "..", "ml-data"))
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "deviations.index")
METADATA_PATH = os.path.join(DATA_DIR, "embeddings.pkl")

# Load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load FAISS index and metadata
try:
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(METADATA_PATH, "rb") as f:
        metadata = pickle.load(f)
    deviations = metadata["deviations"]
except Exception as e:
    index = None
    deviations = []
    print(f"Warning: Could not load FAISS index or metadata: {e}. Please run training script.")

def analyze_text(data):
    if index is None or len(deviations) == 0:
        return {"error": "Model not trained or index missing. Please run training script."}

    # Extract text from structured input or fallback to string
    if isinstance(data, dict):
        text_parts = [
            data.get("description", ""),
            data.get("correctionAction", ""),
            data.get("rootCauses", ""),
            data.get("deviationType", ""),
            data.get("deviationClassification", "")
        ]
        input_text = " ".join([str(p).strip() for p in text_parts if p])
    else:
        input_text = str(data)

    if not input_text.strip():
        return {"error": "No input text provided for analysis."}

    # Encode and normalize input
    input_vec = model.encode([input_text])
    input_vec = np.array(input_vec).astype('float32')
    faiss.normalize_L2(input_vec)

    # Search in FAISS (k=10 nearest neighbors)
    k = min(10, len(deviations))
    distances, indices = index.search(input_vec, k)

    similar = []
    max_score = 0.0
    if len(distances[0]) > 0:
        max_score = float(distances[0][0])

    # IndexFlatIP returns inner product, which is cosine similarity for normalized vectors
    # distances are similarity scores in this case
    for score, i in zip(distances[0], indices[0]):
        if i == -1: continue # FAISS returns -1 if fewer than k neighbors found
        
        # Higher threshold for production/requested precision
        if score > 0.6:
            similar.append({
                "id": deviations[i]["id"],
                "title": deviations[i].get("deviation_no", "Unknown"),
                "rootCause": deviations[i].get("remarks") or "Unknown",
                "score": float(score),
                # Include more info if needed for frontend UI to show "why" it's similar
                "description": deviations[i].get("description") or ""
            })

    # Group root causes
    cause_count = {}
    for s in similar:
        cause = s["rootCause"]
        cause_count[cause] = cause_count.get(cause, 0) + 1

    total = sum(cause_count.values()) or 1

    possible_causes = [
        {"name": k, "probability": round(v / total, 2)}
        for k, v in cause_count.items()
    ]

    # Sort similar deviations by score
    similar = sorted(similar, key=lambda x: x["score"], reverse=True)

    return {
        "possibleRootCauses": possible_causes,
        "similarDeviations": similar,
        "explanation": f"Based on {len(similar)} semantically similar historical deviations (FAISS powered)",
        "debug": {
            "maxScore": max_score,
            "totalAnalyzed": len(deviations),
            "inputLength": len(input_text)
        }
    }

def add_to_index(data: dict):
    """
    Vectorizes a new deviation, adds it to the FAISS index (RAM), 
    and persists both index and metadata to disk.
    """
    global index, deviations

    if index is None:
        # If index is missing, we must initialize a baseline index first
        return {"error": "FAISS index not initialized. Please run training script once."}

    # Extract text (same logic as analyze_text)
    text_parts = [
        data.get("description", ""),
        data.get("correctionAction", ""),
        data.get("rootCauses", ""),
        data.get("deviationType", ""),
        data.get("deviationClassification", "")
    ]
    input_text = " ".join([str(p).strip() for p in text_parts if p])
    
    if not input_text.strip():
        return {"error": "No meaningful text found to vectorize."}

    # Encode and normalize
    new_vec = model.encode([input_text])
    new_vec = np.array(new_vec).astype('float32')
    faiss.normalize_L2(new_vec)

    # 1. Update in RAM
    index.add(new_vec)
    deviations.append(data)

    # 2. Persist to Disk
    try:
        faiss.write_index(index, FAISS_INDEX_PATH)
        with open(METADATA_PATH, "wb") as f:
            pickle.dump({"deviations": deviations}, f)
        
        return {
            "status": "success",
            "message": f"Deviation '{data.get('deviation_no', 'New')}' vectorized and added to index.",
            "total_vectors": len(deviations)
        }
    except Exception as e:
        return {"error": f"Failed to persist index: {str(e)}"}
