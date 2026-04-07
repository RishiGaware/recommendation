from fastapi.responses import JSONResponse
from typing import Any, Optional

def standard_response(
    status: str = "success",
    message: str = "",
    data: Any = None,
    status_code: int = 200
) -> JSONResponse:
    """
    Unified response handler for all ML services.
    Ensures a consistent {status, message, data} JSON schema.
    """
    content = {
        "status": status,
        "message": message,
        "data": data
    }
    
    # Remove 'data' if it is None for clean error responses
    if data is None:
        del content["data"]
        
    return JSONResponse(
        status_code=status_code,
        content=content
    )
