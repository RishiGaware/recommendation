import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "ml-service")))
try:
    from app.domains.DVMS.router import router
    print("Success: Router loaded")
except Exception as e:
    import traceback
    traceback.print_exc()
