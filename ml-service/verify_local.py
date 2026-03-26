import sys
import os

# Add current directory to path so it can find app.model.predictor
sys.path.append(os.getcwd())

from app.model.predictor import analyze_text

query = "solenoid failure in backup generator"
print(f"Testing Query: '{query}'")
result = analyze_text(query)
import json
print(json.dumps(result, indent=2))
