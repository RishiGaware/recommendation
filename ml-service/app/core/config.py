import os
from typing import Optional

class Settings:
    # --- Project Metadata ---
    PROJECT_NAME: str = "Universal ML Service Core"
    API_V1_STR: str = "/ml-service"
    
    # --- OpenAI Configuration ---
    @property
    def OPENAI_API_KEY(self) -> str:
        return os.environ.get("OPENAI_API_KEY", "")

    @property
    def OPENAI_MODEL(self) -> str:
        return os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")

    @property
    def OPENAI_TEMPERATURE(self) -> float:
        return float(os.environ.get("OPENAI_TEMPERATURE", 0.3))

    @property
    def OPENAI_TIMEOUT_SECONDS(self) -> float:
        return float(os.environ.get("OPENAI_TIMEOUT_SECONDS", 45.0))
    
    # --- Qdrant Configuration ---
    @property
    def QDRANT_STORAGE_PATH(self) -> str:
        # Default to the domain-owned embedded Qdrant storage (keeps data next to DVMS domain)
        default_path = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "domains",
                "dvms",
                "qdrant_storage",
            )
        )
        return os.environ.get("QDRANT_STORAGE_PATH", default_path)

    DVMS_DESC_COLLECTION: str = "dvms_desc"
    DVMS_ROOT_COLLECTION: str = "dvms_root"

settings = Settings()
