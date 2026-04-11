import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.domains.dvms.services.dvms_service import clear_all_knowledge

if __name__ == "__main__":
    print("Clearing all knowledge...")
    try:
        result = clear_all_knowledge()
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
