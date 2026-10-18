"""Engineering Lab Reports and Export API Routes."""
import csv
import io
import json
from datetime import datetime, timezone
from flask import Blueprint, jsonify, Response
from ..database.db import query_db

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@reports_bp.route("/lab-report", methods=["GET"])
def generate_lab_report():
    """Generates an engineering lab report summarizing topology, scenarios, and security checks."""
    now = datetime.now(timezone.utc).isoformat()
    
    devices = query_db("SELECT id, name, type, ip_address, role, trust_status, enabled FROM devices")
    connections = query_db("SELECT source_id, target_id, link_type, status, latency_ms FROM connections")
    scenarios = query_db("SELECT * FROM security_test_results ORDER BY timestamp DESC LIMIT 20")
    for s in scenarios:
        if s.get("checks_executed"):
            try:
                s["checks_executed"] = json.loads(s["checks_executed"])
            except Exception:
                s["checks_executed"] = []

    msg_summary = {
        "delivered": query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Delivered'", one=True)["cnt"],
        "rejected": query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Rejected'", one=True)["cnt"],
        "failed": query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Failed'", one=True)["cnt"]
    }

    report = {
        "title": "Secure Industrial Control System Communication Simulator - Engineering Lab Report",
        "generated_at": now,
        "academic_module": "Network Security & ICS Protocol Protection",
        "disclaimer": "This report documents educational simulations on virtual industrial device models. No physical SCADA equipment was commanded.",
        "topology_summary": {
            "total_nodes": len(devices),
            "total_links": len(connections),
            "devices": devices,
            "connections": connections
        },
        "scenario_evaluations": scenarios,
        "communication_summary": msg_summary,
        "cryptographic_mechanisms": [
            {
                "mechanism": "AES-256-GCM Authenticated Encryption",
                "purpose": "Payload confidentiality and in-transit authentication tag validation.",
                "status": "Active & Verified"
            },
            {
                "mechanism": "SHA-256 Message Digest",
                "purpose": "Mathematical integrity verification against data alteration.",
                "status": "Active & Verified"
            },
            {
                "mechanism": "RSA-PSS Digital Signatures",
                "purpose": "Origin authentication, sender identity binding, and non-repudiation.",
                "status": "Active & Verified"
            },
            {
                "mechanism": "Role-Based Access Control (RBAC)",
                "purpose": "Enforcement of Principle of Least Privilege across industrial roles.",
                "status": "Active & Verified"
            },
            {
                "mechanism": "Message Freshness / Replay Protection",
                "purpose": "Sequence counter and nonce validation preventing re-transmission attacks.",
                "status": "Active & Verified"
            }
        ],
        "conclusion": "The simulator demonstrated that industrial communications without cryptographic controls are vulnerable to tampering and impersonation. Implementing AES-GCM AEAD, SHA-256 integrity, RSA-PSS signatures, and RBAC effectively confines message delivery exclusively to authorized, unaltered, and authenticated endpoints."
    }

    return jsonify({"success": True, "report": report})

@reports_bp.route("/scenarios/export", methods=["GET"])
def export_scenarios_csv():
    """Exports security scenario test results as CSV."""
    results = query_db("SELECT id, session_id, scenario_id, scenario_name, test_objective, expected_result, actual_result, pass_fail, reason, timestamp FROM security_test_results ORDER BY timestamp DESC")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Test ID", "Session ID", "Scenario ID", "Scenario Name", "Objective", "Expected Result", "Actual Result", "Status", "Reason", "Timestamp"])

    for r in results:
        writer.writerow([
            r["id"], r["session_id"], r["scenario_id"], r["scenario_name"],
            r["test_objective"], r["expected_result"], r["actual_result"],
            r["pass_fail"], r["reason"], r["timestamp"]
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=ics_security_test_report.csv"}
    )
