import os
import importlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Universal ML Service Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allowing all. Change to specific origin in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Universal Domain Auto-Discovery ---
DOMAINS_DIR = os.path.join(os.path.dirname(__file__), "domains")

def register_domains():
    """Dynamically find and register all domain routers from the domains directory."""
    if not os.path.exists(DOMAINS_DIR):
        print(f"Warning: Domains directory not found at {DOMAINS_DIR}")
        return

    # Loop through each folder in app/domains/
    for domain_name in os.listdir(DOMAINS_DIR):
        domain_path = os.path.join(DOMAINS_DIR, domain_name)
        
        if os.path.isdir(domain_path) and not domain_name.startswith('__'):
            try:
                # Dynamically import the router from the found domain
                # e.g., app.domains.DVMS.router
                module_path = f"app.domains.{domain_name}.router"
                domain_module = importlib.import_module(module_path)
                
                if hasattr(domain_module, "router"):
                    print(f"Mounting Domain -> [{domain_name}] at /ml-service/{domain_name}")
                    app.include_router(
                        domain_module.router, 
                        prefix=f"/ml-service/{domain_name}", 
                        tags=[domain_name]
                    )
                else:
                    print(f"Skipping [{domain_name}]: No 'router' object found in {module_path}")
            except Exception as e:
                import traceback
                print(f"Error loading domain [{domain_name}]: {e}")
                traceback.print_exc()

# Execute discovery on startup
register_domains()


from app.core.response_handler import standard_response

@app.get("/health")
def health_check():
    return standard_response(
        status="success",
        message="Universal ML Service is online"
    )
