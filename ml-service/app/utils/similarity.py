from sklearn.metrics.pairwise import cosine_similarity

def get_similar(input_vec, X, deviations, threshold=0.4):
    similarities = cosine_similarity(input_vec, X)[0]

    results = []
    for i, score in enumerate(similarities):
        if score > threshold:
            results.append({
                "id": deviations[i]["id"],
                "title": deviations[i]["deviation_no"],
                "description": deviations[i].get("description", ""),
                "rootCause": deviations[i].get("remarks") or "Unknown",
                "score": float(score)
            })

    return results
