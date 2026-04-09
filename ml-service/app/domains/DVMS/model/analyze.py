import os
from app.db.qdrant import get_qdrant_client, DVMS_DESC_COLLECTION, DVMS_ROOT_COLLECTION
from app.core.model_manager import get_shared_model
from app.core.response_handler import standard_response

# Shared state between API calls
shared_model = get_shared_model()

def analyze_text(payload: dict):
    """
    Analyzes input text against TWO Qdrant collections:
      1. description (Primary Context)
      2. root_causes (Precision Constraint)
    
    Returns 'Thin Results' (IDs and Match Scores) for Backend Hydration.
    """
    qdrant_client = get_qdrant_client()
    
    input_description = str(payload.get("description", "") or "").strip()
    input_root_causes = str(payload.get("rootCauses", "") or "").strip()

    if not input_description and not input_root_causes:
        return standard_response(
            status="error",
            message="Please provide a description or root causes to analyze.",
            status_code=400
        )

    # --- 1. Intelligent Weighting Logic ---
    match_threshold = 10.0

    if input_description and input_root_causes:
        mode = "both"
        description_weight = 1.2
        root_cause_weight = 0.8
    elif input_description:
        mode = "description_only"
        description_weight = 1.0
        root_cause_weight = 0.0
    else:
        mode = "root_causes_only"
        description_weight = 0.0
        root_cause_weight = 1.0

    try:
        # --- 2. Dual-Vector Search ---
        description_results = []
        if input_description:
            description_vector = shared_model.encode(input_description).tolist()
            description_results = qdrant_client.query_points(
                collection_name=DVMS_DESC_COLLECTION,
                query=description_vector,
                limit=15
            ).points

        root_cause_results = []
        if input_root_causes:
            root_cause_vector = shared_model.encode(input_root_causes).tolist()
            root_cause_results = qdrant_client.query_points(
                collection_name=DVMS_ROOT_COLLECTION,
                query=root_cause_vector,
                limit=15
            ).points

        # --- 3. Score Fusion (Thin Results) ---
        match_scores = {}

        # Process description findings
        for hit in description_results:
            match_scores[hit.id] = {
                "id": hit.id,
                "description_score": hit.score * 100,
                "root_cause_score": 0.0
            }

        # Merge root cause findings
        for hit in root_cause_results:
            if hit.id in match_scores:
                match_scores[hit.id]["root_cause_score"] = hit.score * 100
            else:
                match_scores[hit.id] = {
                    "id": hit.id,
                    "description_score": 0.0,
                    "root_cause_score": hit.score * 100
                }

        # --- 4. Final Result Hydration Calculation ---
        results_list = []
        for match_id, scores in match_scores.items():
            # Calculate weighted average
            final_match_score = (
                (scores["description_score"] * description_weight) + 
                (scores["root_cause_score"] * root_cause_weight)
            ) / (description_weight + root_cause_weight)

            if final_match_score >= match_threshold:
                results_list.append({
                    "id": match_id,
                    "matchScore": round(final_match_score, 1),
                    "descriptionMatch": round(scores["description_score"], 1),
                    "rootCauseMatch": round(scores["root_cause_score"], 1)
                })

        # Sort by best match score descending
        sorted_results = sorted(results_list, key=lambda x: x["matchScore"], reverse=True)

        return standard_response(
            status="success",
            message="Analysis completed successfully",
            data={
                "similarDeviations": sorted_results[:10],
                "searchMode": mode,
                "threshold": match_threshold,
                "description_weight": description_weight,
                "root_weight": root_cause_weight
            }
        )

    except Exception as analysis_error:
        import traceback
        traceback.print_exc()
        return standard_response(
            status="error",
            message=f"Similarity Analysis failed: {str(analysis_error)}",
            status_code=500
        )
