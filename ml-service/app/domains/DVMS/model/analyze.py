import numpy as np
import faiss
import app.domains.DVMS.model.vector_store as store

def analyze_text(data):
    if store.index is None or len(store.deviations) == 0:
        return {"error": "Model not trained or index missing. Please run training script."}

    # Extract text from structured input or fallback to string
    if isinstance(data, dict):
        text_parts = [
            data.get("description", ""),
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
    input_vec = store.model.encode([input_text])
    input_vec = np.array(input_vec).astype('float32')
    faiss.normalize_L2(input_vec)

    # Search in FAISS (k=10 nearest neighbors)
    k = min(10, len(store.deviations))
    distances, indices = store.index.search(input_vec, k)

    similar = []
    max_score = 0.0
    if len(distances[0]) > 0:
        max_score = float(distances[0][0])

    # IndexFlatIP returns inner product, which is cosine similarity for normalized vectors
    # distances are similarity scores in this case
    for score, i in zip(distances[0], indices[0]):
        if i == -1: continue # FAISS returns -1 if fewer than k neighbors found
        
        # Lower threshold for more relaxed matching
        if score > 0.1:
            similar.append({
                "id": store.deviations[i]["id"],
                "title": store.deviations[i].get("deviation_no", "Unknown"),
                "rootCause": store.deviations[i].get("remarks") or "Unknown",
                "score": float(score),
                # Include more info if needed for frontend UI to show "why" it's similar
                "description": store.deviations[i].get("description") or ""
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
            "totalAnalyzed": len(store.deviations),
            "inputLength": len(input_text)
        }
    }
