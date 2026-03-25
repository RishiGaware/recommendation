import os
import pickle
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Path to embeddings relative to this file
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
EMBEDDINGS_PATH = os.path.join(MODEL_DIR, "embeddings.pkl")

# Load model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load trained embeddings
# Note: In a production environment, you might want to load this once at startup
try:
    with open(EMBEDDINGS_PATH, "rb") as f:
        data = pickle.load(f)
    stored_embeddings = data["embeddings"]
    deviations = data["deviations"]
except FileNotFoundError:
    stored_embeddings = []
    deviations = []
    print("Warning: embeddings.pkl not found. Please run training script.")

def analyze_text(input_text):
    if len(stored_embeddings) == 0:
        return {"error": "Model not trained. Please run training script."}

    input_vec = model.encode([input_text])

    similarities = cosine_similarity(input_vec, stored_embeddings)[0]

    similar = []
    for i, score in enumerate(similarities):
        if score > 0.4: # Using 0.4 threshold for better recall, can be adjusted
            similar.append({
                "id": deviations[i]["id"],
                "title": deviations[i].get("deviation_no", "Unknown"),
                "rootCause": deviations[i].get("remarks") or "Unknown",
                "score": float(score)
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
        "explanation": f"Based on {len(similar)} semantically similar deviations"
    }
