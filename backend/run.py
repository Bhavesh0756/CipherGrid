"""Application entrypoint for Industrial SecureSim backend."""
import os
from dotenv import load_dotenv

# Load local environment variables from .env if present
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app

app = create_app()

if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"================================================================")
    print(f"  INDUSTRIAL SECURESIM - SCADA SECURITY SERVER")
    print(f"  Network Security Microproject")
    print(f"================================================================")
    print(f"[*] API Server running at http://{host}:{port}/api/health")
    print(f"[*] Serving endpoints for Modules 1, 2, 3, and 4")
    print(f"----------------------------------------------------------------")
    app.run(host=host, port=port, debug=True)
