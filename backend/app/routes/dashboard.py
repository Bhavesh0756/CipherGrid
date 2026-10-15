"""Overview Dashboard API Routes."""
import os
from flask import Blueprint, jsonify
from ..database.db import query_db
from ..security.certificates import inspect_current_certificate, CERT_PATH

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_stats():
    """Returns aggregated live statistics directly from the database."""
    # 1. Total devices
    tot_devices_row = query_db("SELECT COUNT(*) as count FROM devices", one=True)
    total_devices = tot_devices_row["count"] if tot_devices_row else 0

    # 2. Authorized devices
    auth_devices_row = query_db("SELECT COUNT(*) as count FROM devices WHERE status = 'Authorized'", one=True)
    authorized_devices = auth_devices_row["count"] if auth_devices_row else 0

    # 3. Messages processed
    msgs_row = query_db("SELECT COUNT(*) as count FROM simulation_records", one=True)
    messages_processed = msgs_row["count"] if msgs_row else 0

    # 4. Rejected access requests
    rejected_row = query_db("SELECT COUNT(*) as count FROM simulation_records WHERE status = 'REJECTED'", one=True)
    rejected_requests = rejected_row["count"] if rejected_row else 0

    # 5. Integrity verification failures (tamper events in security_events)
    integrity_failures_row = query_db(
        "SELECT COUNT(*) as count FROM security_events WHERE event_type LIKE '%TAMPER%' OR event_type = 'SIGNATURE_REJECTED' OR event_type LIKE '%INTEGRITY%'",
        one=True
    )
    integrity_failures = integrity_failures_row["count"] if integrity_failures_row else 0

    # 6. Secure connection status
    has_cert = os.path.exists(CERT_PATH)
    cert_info = None
    if has_cert:
        try:
            cert_info = inspect_current_certificate()
        except Exception:
            pass

    secure_connection_status = {
        "tls_ready": has_cert,
        "active_protocol": "TLS 1.3 / TLS 1.2" if has_cert else "AWAITING_X509_CERTIFICATE",
        "certificate_installed": has_cert,
        "cert_common_name": cert_info.get("subject_common_name") if cert_info else None,
        "is_self_signed": cert_info.get("is_self_signed", True) if cert_info else True
    }

    # 7. Recent security events (last 8)
    recent_events = query_db("SELECT * FROM security_events ORDER BY id DESC LIMIT 8")

    # 8. Chart data: distribution by device and status
    chart_by_device = query_db("""
        SELECT device_id,
               SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
               SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
               COUNT(*) as total
        FROM simulation_records
        GROUP BY device_id
        ORDER BY total DESC
        LIMIT 6
    """)

    # Distribution by action
    chart_by_action = query_db("""
        SELECT action,
               SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
               SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
        FROM simulation_records
        GROUP BY action
        ORDER BY (accepted + rejected) DESC
        LIMIT 6
    """)

    return jsonify({
        "success": True,
        "total_devices": total_devices,
        "authorized_devices": authorized_devices,
        "messages_processed": messages_processed,
        "rejected_requests": rejected_requests,
        "integrity_failures": integrity_failures,
        "secure_connection_status": secure_connection_status,
        "recent_events": recent_events,
        "chart_by_device": chart_by_device,
        "chart_by_action": chart_by_action,
        "is_empty": (total_devices == 0 and messages_processed == 0 and len(recent_events) == 0)
    })
