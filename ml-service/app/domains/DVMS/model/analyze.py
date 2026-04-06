import numpy as np
import faiss
import app.domains.DVMS.model.vector_store as store

def analyze_text(data):
    """
    Always computes match score based on BOTH description and rootCauses:
      - Searches desc.index  (weight: 70%)
      - Searches root.index  (weight: 30%)
      - Final matchScore (%) = combined weighted cosine similarity × 100
    
    If only description provided → rootCauses weight falls back to 0
    If only rootCauses provided  → description weight falls back to 0
    If both provided             → 70/30 split
    """
    if store.desc_index is None or len(store.deviations) == 0:
        return {"error": "Model not trained or index missing. Please run training script."}

    description = ""
    root_causes = ""

    if isinstance(data, dict):
        description = str(data.get("description", "") or "").strip()
        root_causes = str(data.get("rootCauses", "") or "").strip()
    else:
        description = str(data).strip()

    if not description and not root_causes:
        return {"error": "Provide at least a description or rootCauses for analysis."}

    k = min(10, len(store.deviations))

    def encode(text):
        vec = store.model.encode([text])
        vec = np.array(vec).astype("float32")
        faiss.normalize_L2(vec)
        return vec

    # --- Search description index ---
    desc_scores = {}
    if description:
        dists, idxs = store.desc_index.search(encode(description), k)
        for score, i in zip(dists[0], idxs[0]):
            if i != -1:
                desc_scores[int(i)] = float(score)

    # --- Search rootCauses index ---
    root_scores = {}
    if root_causes and store.root_index is not None:
        dists, idxs = store.root_index.search(encode(root_causes), k)
        for score, i in zip(dists[0], idxs[0]):
            if i != -1:
                root_scores[int(i)] = float(score)

    # --- Determine weights based on what was provided ---
    if description and root_causes:
        desc_weight = 0.7
        root_weight = 0.3
    elif description:
        desc_weight = 1.0
        root_weight = 0.0
    else:
        desc_weight = 0.0
        root_weight = 1.0

    # --- Combine scores across all candidate indices ---
    all_indices = set(desc_scores.keys()) | set(root_scores.keys())

    results = []
    for i in all_indices:
        d_score = desc_scores.get(i, 0.0)
        r_score = root_scores.get(i, 0.0)

        combined = (d_score * desc_weight) + (r_score * root_weight)

        # Only include meaningful matches (>10% similarity)
        if combined > 0.1:
            dev = store.deviations[i]
            results.append({
                "id": dev.get("id"),
                "deviation_no": dev.get("deviation_no", ""),
                "description": dev.get("description", ""),
                "rootCauses": dev.get("rootCauses", ""),
                "deviationType": dev.get("deviationType") or dev.get("deviation_type", ""),
                "deviationClassification": dev.get("deviationClassification") or dev.get("severity", ""),
                "matchScore": round(combined * 100, 1),   # e.g. 87.3%
            })

    results = sorted(results, key=lambda x: x["matchScore"], reverse=True)

    return {
        "similarDeviations": results,
        "totalMatched": len(results),
    }
