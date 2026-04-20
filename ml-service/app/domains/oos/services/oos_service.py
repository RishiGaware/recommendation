import time
import traceback
from typing import Union, List, Dict, Optional
from qdrant_client.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, Range

from app.db.qdrant import get_qdrant_client
from app.core.config import settings
from app.core.model_manager import get_shared_model
from app.core.response_handler import standard_response
from app.domains.common.service import robust_text_extraction, normalize_root_causes

import os
# Shared state between API calls
shared_model = get_shared_model()

def _get_storage_path(phase: int):
    """
    Returns the appropriate storage path based on the phase.
    """
    base_path = os.path.join(os.path.dirname(__file__), "..", "qdrant_storage")
    if phase == 2:
        return os.path.abspath(os.path.join(base_path, "phase 2"))
    return os.path.abspath(os.path.join(base_path, "phase 1"))

def _get_collection_names(phase: int):
    """
    Returns the appropriate collection names based on the phase.
    """
    if phase == 2:
        return settings.OOS_DESC_P2_COLLECTION, settings.OOS_ROOT_P2_COLLECTION
    # Default to Phase 1
    return settings.OOS_DESC_P1_COLLECTION, settings.OOS_ROOT_P1_COLLECTION

def _ensure_oos_collections(client, phase: int) -> None:
    """
    Ensure relevant OOS collections exist for the provided client (phase-specific).
    """
    desc_col, root_col = _get_collection_names(phase)
    collections_to_check = [desc_col, root_col]
    
    try:
        current_collections = {c.name for c in client.get_collections().collections}
        for name in collections_to_check:
            if name not in current_collections:
                client.recreate_collection(
                    collection_name=name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
    except Exception as e:
        print(f"Error ensuring OOS collections: {e}")

def analyze_text(payload: dict):
    """
    Analyzes input text against phased OOS collections.
    """
    phase = int(payload.get("phase", 1))
    desc_col, root_col = _get_collection_names(phase)
    storage_path = _get_storage_path(phase)
    
    qdrant_client = get_qdrant_client(storage_path)
    _ensure_oos_collections(qdrant_client, phase)
    
    input_description = robust_text_extraction(str(payload.get("description", "") or ""))
    
    rc_raw = payload.get("rootCauses", "")
    norm_rc_str, _ = normalize_root_causes(rc_raw)
    input_root_causes = robust_text_extraction(norm_rc_str)

    match_threshold = float(payload.get("threshold", 10.0))
    start_date = payload.get("startDate")
    end_date = payload.get("endDate")

    if not input_description and not input_root_causes:
        return standard_response(
            status="error",
            message="Please provide a description or root causes to analyze.",
            status_code=400
        )

    # --- 1. Intelligent Weighting Logic ---
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
        
    # --- 2. Construct Qdrant Filter (Metadata filtering) ---
    query_filter = None
    if start_date or end_date:
        range_args = {}
        if start_date:
            range_args["gte"] = int(start_date.replace("-", ""))
        if end_date:
            range_args["lte"] = int(end_date.replace("-", ""))
            
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="initiation_date_numeric",
                    range=Range(**range_args)
                )
            ]
        )

    try:
        # --- 2. Dual-Vector Search ---
        description_results = []
        if input_description:
            description_vector = shared_model.encode(input_description).tolist()
            description_results = qdrant_client.query_points(
                collection_name=desc_col,
                query=description_vector,
                limit=15,
                query_filter=query_filter,
                with_payload=True
            ).points

        root_cause_results = []
        if input_root_causes:
            root_cause_vector = shared_model.encode(input_root_causes).tolist()
            root_cause_results = qdrant_client.query_points(
                collection_name=root_col,
                query=root_cause_vector,
                limit=15,
                query_filter=query_filter,
                with_payload=True
            ).points

        # --- 3. Score Fusion ---
        match_scores = {}

        for hit in description_results:
            match_scores[hit.id] = {
                "id": hit.id,
                "description_score": hit.score * 100,
                "root_cause_score": 0.0,
                "payload": hit.payload
            }

        for hit in root_cause_results:
            if hit.id in match_scores:
                match_scores[hit.id]["root_cause_score"] = hit.score * 100
                if not match_scores[hit.id].get("payload"):
                    match_scores[hit.id]["payload"] = hit.payload
            else:
                match_scores[hit.id] = {
                    "id": hit.id,
                    "description_score": 0.0,
                    "root_cause_score": hit.score * 100,
                    "payload": hit.payload
                }

        # --- 4. Final Result Calculation ---
        results_list = []
        for match_id, scores in match_scores.items():
            final_match_score = (
                (scores["description_score"] * description_weight) + 
                (scores["root_cause_score"] * root_cause_weight)
            ) / (description_weight + root_cause_weight)

            if final_match_score >= match_threshold:
                p = scores.get("payload", {})
                results_list.append({
                    "id": match_id,
                    "matchScore": round(final_match_score, 1),
                    "descriptionMatch": round(scores["description_score"], 1),
                    "rootCauseMatch": round(scores["root_cause_score"], 1),
                    "deviationNo": p.get("deviationNo") or p.get("oosNo"), # Support both keys
                    "investigationId": p.get("investigationId"),
                    "description": str(p.get("description", "")).replace("\n", " ").strip(),
                    "rootCauses": str(p.get("rootCauses", "")).replace("\n", " ").strip(),
                    "payload": p
                })

        sorted_results = sorted(results_list, key=lambda x: x["matchScore"], reverse=True)

        return standard_response(
            status="success",
            message="OOS Analysis completed successfully",
            data={
                "similarDeviations": sorted_results[:10],
                "phase": phase,
                "searchMode": mode,
                "threshold": match_threshold
            }
        )

    except Exception as analysis_error:
        traceback.print_exc()
        return standard_response(
            status="error",
            message=f"Similarity Analysis failed: {str(analysis_error)}",
            status_code=500
        )

def add_to_index(data: Union[Dict, List[Dict]]):
    """
    Unified handler for OOS knowledge indexing (Phase 1 or 2).
    """
    try:
        items_list = data if isinstance(data, list) else [data]
        if not items_list:
            return standard_response(status="error", message="No items to index.", status_code=400)

        # Group by phase for efficient batching
        phased_items = {1: [], 2: []}
        for item in items_list:
            p_val = int(item.get("phase", 1))
            if p_val in phased_items:
                phased_items[p_val].append(item)
            else:
                phased_items[1].append(item)

        summary = {}
        for phase, items in phased_items.items():
            if not items: continue
            
            storage_path = _get_storage_path(phase)
            qdrant_client = get_qdrant_client(storage_path)
            _ensure_oos_collections(qdrant_client, phase)
            desc_col, root_col = _get_collection_names(phase)
            
            # --- Retrieval for Deduplication ---
            target_ids = []
            for item in items:  
                try:
                    if "id" in item:
                        target_ids.append(int(item["id"]))
                except: pass

            existing_id_set = set()
            if target_ids:
                try:
                    existing_points = qdrant_client.retrieve(collection_name=desc_col, ids=target_ids, with_payload=False)
                    existing_id_set = {point.id for point in existing_points}
                except: pass

            new_items = [item for item in items if int(item.get("id")) not in existing_id_set]
            
            if not new_items:
                summary[f"phase_{phase}"] = {"indexed": 0, "skipped": len(items)}
                continue

            # --- Vectorization & Upsert ---
            total_indexed = 0
            CHUNK_SIZE = 50
            for i in range(0, len(new_items), CHUNK_SIZE):
                chunk = new_items[i : i + CHUNK_SIZE]
                
                clean_chunk = []
                for d in chunk:
                    d["description"] = robust_text_extraction(str(d.get("description", "") or ""))
                    rc_raw = d.get("rootCauses", "")
                    norm_rc_str, clean_rc_list = normalize_root_causes(rc_raw)
                    d["rootCauses"] = clean_rc_list
                    
                    init_date = d.get("initiationDate")
                    if init_date:
                        try:
                            d["initiation_date_numeric"] = int(str(init_date).replace("-", ""))
                        except: pass
                    clean_chunk.append(d)

                description_texts = [d["description"] for d in clean_chunk]
                root_cause_texts = [normalize_root_causes(d["rootCauses"])[0] for d in clean_chunk]
                
                desc_vectors = shared_model.encode(description_texts).tolist()
                rc_vectors = shared_model.encode(root_cause_texts).tolist()

                desc_points = []
                root_points = []
                for deviation, desc_v, rc_v in zip(chunk, desc_vectors, rc_vectors):
                    pid = int(deviation.get("id"))
                    desc_points.append(PointStruct(id=pid, vector=desc_v, payload=deviation))
                    root_points.append(PointStruct(id=pid, vector=rc_v, payload=deviation))

                qdrant_client.upsert(collection_name=desc_col, points=desc_points)
                qdrant_client.upsert(collection_name=root_col, points=root_points)
                total_indexed += len(chunk)

            summary[f"phase_{phase}"] = {"indexed": total_indexed, "skipped": len(items) - total_indexed}

        return standard_response(
            status="success",
            message="OOS Indexing completed",
            data=summary,
            status_code=201
        )

    except Exception as e:
        traceback.print_exc()
        return standard_response(status="error", message=str(e), status_code=500)

def clear_oos_knowledge(phase: Optional[int] = None):
    """
    Clears OOS knowledge. If phase is provided, only clears that phase.
    """
    try:
        if phase:
            storage_path = _get_storage_path(phase)
            client = get_qdrant_client(storage_path)
            cols = _get_collection_names(phase)
            for name in cols:
                client.delete(collection_name=name, points_selector=Filter(must=[]), wait=True)
            return standard_response(status="success", message=f"OOS Phase {phase} cleared.")
        else:
            # Clear both
            for p in [1, 2]:
                storage_path = _get_storage_path(p)
                client = get_qdrant_client(storage_path)
                cols = _get_collection_names(p)
                for name in cols:
                    client.delete(collection_name=name, points_selector=Filter(must=[]), wait=True)
            return standard_response(status="success", message="All OOS Knowledge cleared.")
    except Exception as e:
        return standard_response(status="error", message=str(e), status_code=500)

def get_oos_status():
    """
    Returns statistics for OOS collections across all phases.
    """
    try:
        summary = {}
        for p in [1, 2]:
            storage_path = _get_storage_path(p)
            client = get_qdrant_client(storage_path)
            _ensure_oos_collections(client, p)
            cols = _get_collection_names(p)
            summary[f"phase_{p}"] = {name: client.count(name).count for name in cols}
        return standard_response(status="success", data={"stored_vectors": summary})
    except Exception as e:
        return standard_response(status="error", message=str(e), status_code=500)

def get_oos_vectors_by_ids(payload: dict):
    """
    Fetch stored vectors from phased collections.
    """
    try:
        phase = int(payload.get("phase", 1))
        ids = payload.get("ids", [])
        include_vectors = payload.get("includeVectors", False)
        
        storage_path = _get_storage_path(phase)
        client = get_qdrant_client(storage_path)
        _ensure_oos_collections(client, phase)
        
        desc_col, root_col = _get_collection_names(phase)

        target_ids = []
        if isinstance(ids, list):
            for x in ids:
                try: target_ids.append(int(x))
                except: pass
        
        if not target_ids:
             res = client.scroll(collection_name=desc_col, limit=100, with_payload=True, with_vectors=include_vectors)
             desc_points = res[0]
             target_ids = [int(p.id) for p in desc_points]
             root_points = client.retrieve(collection_name=root_col, ids=target_ids, with_vectors=include_vectors) if target_ids else []
        else:
            desc_points = client.retrieve(collection_name=desc_col, ids=target_ids, with_payload=True, with_vectors=include_vectors)
            root_points = client.retrieve(collection_name=root_col, ids=target_ids, with_payload=False, with_vectors=include_vectors)

        desc_map = {int(p.id): {"id": int(p.id), "payload": p.payload, "vector": p.vector} for p in desc_points}
        root_map = {int(p.id): p.vector for p in root_points}

        merged = []
        for i in target_ids:
            merged.append({
                "id": i,
                "descriptionVector": desc_map.get(i, {}).get("vector"),
                "rootCauseVector": root_map.get(i),
                "payload": desc_map.get(i, {}).get("payload"),
                "phase": phase
            })

        return standard_response(status="success", data={"items": merged, "count": len(merged)})
    except Exception as e:
        return standard_response(status="error", message=str(e), status_code=500)
