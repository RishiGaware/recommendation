import sys
import os

# Add root ml-service directory to path dynamically relative to this script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")))


from app.domains.DVMS.model.analyze import analyze_text

query = "solenoid failure in backup generator"
print(f"Testing Query: '{query}'")
result = analyze_text(query)
import json
print(json.dumps(result, indent=2))
