import urllib.request
import json

def test_payload(name, payload):
    url = "http://localhost:5000/api/deviation/analyze"
    params = json.dumps(payload).encode('utf8')
    req = urllib.request.Request(url, data=params, headers={'content-type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf8'))
            print(f"--- Test: {name} ---")
            print(f"Mode: {res['data']['searchMode']}")
            print(f"Weights: Desc={res['data']['description_weight']}, Root={res['data']['root_weight']}")
            if res['data']['similarDeviations']:
                print(f"Top Match Score: {res['data']['similarDeviations'][0]['matchScore']}%")
            else:
                print("No matches.")
            print("\n")
    except Exception as e:
        print(f"Error in {name}: {e}")

# Scenario 1: Both provided
test_payload("Both Provided", {
    "description": "Temperature excursion in Cold Room 4",
    "rootCauses": "Faulty sensor"
})

# Scenario 2: Description only
test_payload("Description Only", {
    "description": "Temperature excursion in Cold Room 4",
    "rootCauses": ""
})

# Scenario 3: Root causes only
test_payload("Root Causes Only", {
    "description": "",
    "rootCauses": "Faulty sensor"
})
