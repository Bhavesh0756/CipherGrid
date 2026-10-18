"""Flask Application Factory for Secure Industrial Control System Communication Simulator."""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from .database.db import init_db
from .routes import (
    devices_bp,
    topology_bp,
    messages_bp,
    security_bp,
    events_bp,
    dashboard_bp,
    reports_bp
)

def create_app(test_config=None):
    app = Flask(__name__)

    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY", "secure_ics_sim_secret_key_2026"),
    )

    if test_config:
        app.config.update(test_config)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )

    # Initialize SQLite database and seed starter topology
    init_db()

    # Register API blueprints
    app.register_blueprint(devices_bp)
    app.register_blueprint(topology_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(security_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(reports_bp)

    @app.route("/", methods=["GET"])
    @app.route("/health", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ONLINE",
            "service": "Secure Industrial Control System Communication Simulator",
            "version": "1.0.0",
            "api_prefix": "/api",
            "capabilities": [
                "Interactive Network Topology Pathfinding",
                "AES-256-GCM AEAD Authenticated Encryption",
                "SHA-256 Message Integrity Verification",
                "RSA-PSS 2048-bit Digital Signatures",
                "Industrial Role-Based Access Control (RBAC)",
                "Replay Attack Prevention",
                "9 Repeatable Cybersecurity Scenarios",
                "Audit Logging & Lab Report Generation"
            ]
        })

    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def handle_server_error(e):
        return jsonify({"success": False, "error": "Internal server error"}), 500

    return app
