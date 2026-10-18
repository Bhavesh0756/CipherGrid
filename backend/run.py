"""Server entrypoint for Secure Industrial Control System Communication Simulator."""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from app import create_app

app = create_app()

if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "127.0.0.1")
    port = int(os.environ.get("FLASK_PORT", 5000))
    print("=" * 64)
    print("  SECURE INDUSTRIAL CONTROL SYSTEM COMMUNICATION SIMULATOR")
    print("  Cybersecurity & SCADA Network Simulation Engine")
    print("=" * 64)
    print(f"[*] API Server running at http://{host}:{port}/api/health")
    print("----------------------------------------------------------------")
    app.run(host=host, port=port, debug=True)
