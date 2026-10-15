"""Industrial SecureSim Flask Application Factory."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from .database.db import init_db
from .security.certificates import generate_local_x509_certificate, CERT_PATH
from .routes.dashboard import dashboard_bp
from .routes.devices import devices_bp
from .routes.crypto import crypto_bp
from .routes.logs import logs_bp
from .routes.tls import tls_bp

def create_app(test_config=None):
    app = Flask(__name__, instance_relative_config=True)

    # Load secret key from environment or default dev key
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "ics_securesim_dev_secret_key_change_in_prod"),
    )

    if test_config:
        app.config.update(test_config)

    # Enable CORS for frontend deployment (Vercel) and local dev
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )

    # Initialize database tables and initial seed data
    init_db()

    # Pre-generate local X.509 certificate for TLS readiness if not already created
    if not os.path.exists(CERT_PATH):
        try:
            generate_local_x509_certificate(common_name="localhost")
        except Exception as e:
            app.logger.warning(f"Could not pre-generate certificate: {e}")

    # Register blueprints
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(devices_bp)
    app.register_blueprint(crypto_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(tls_bp)

    @app.route("/", methods=["GET"])
    @app.route("/health", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ONLINE",
            "service": "AegisGrid ICS SCADA Security Engine",
            "version": "1.0.0",
            "api_prefix": "/api",
            "modules_supported": [
                "Module 1: Classical Cryptography",
                "Module 2: Modern Symmetric, Asymmetric, Hashing & PKI",
                "Module 3: Access Control & Industrial RBAC",
                "Module 4: Secure Transport (TLS 1.3) & IPsec Modeling"
            ]
        })

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app
