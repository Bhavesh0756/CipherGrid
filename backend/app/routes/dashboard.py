"""Dashboard Operational Overview API Routes."""
from flask import Blueprint, jsonify
from ..database.db import query_db

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_metrics():
    """Returns genuine operational and security metrics aggregated from the database."""
    # 1. Total devices
    tot_dev = query_db("SELECT COUNT(*) as cnt FROM devices", one=True)["cnt"]
    auth_dev = query_db("SELECT COUNT(*) as cnt FROM devices WHERE trust_status = 'Trusted'", one=True)["cnt"]

    # 2. Total simulation sessions
    tot_sess = query_db("SELECT COUNT(*) as cnt FROM simulation_sessions", one=True)["cnt"]

    # 3. Message outcomes
    delivered_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Delivered'", one=True)
    delivered = delivered_row["cnt"] if delivered_row else 0

    rejected_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Rejected'", one=True)
    rejected = rejected_row["cnt"] if rejected_row else 0

    failed_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Failed'", one=True)
    failed = failed_row["cnt"] if failed_row else 0

    total_msgs = delivered + rejected + failed

    # 4. Security test results pass rate
    tot_tests = query_db("SELECT COUNT(*) as cnt FROM security_test_results", one=True)["cnt"]
    passed_tests = query_db("SELECT COUNT(*) as cnt FROM security_test_results WHERE pass_fail = 'PASS'", one=True)["cnt"]
    pass_rate = round((passed_tests / tot_tests * 100), 1) if tot_tests > 0 else 100.0

    # 5. Recent security audit events
    recent_events = query_db("SELECT id, timestamp, event_type, source_device, destination_device, security_result, decision, rejection_reason FROM audit_logs ORDER BY timestamp DESC LIMIT 6")

    # 6. Active topology info
    active_topo = query_db("SELECT id, name, description, updated_at FROM topologies WHERE is_default = 1 LIMIT 1", one=True)

    return jsonify({
        "success": True,
        "total_devices": tot_dev,
        "trusted_devices": auth_dev,
        "total_sessions": tot_sess,
        "messages_delivered": delivered,
        "messages_rejected": rejected,
        "messages_failed": failed,
        "total_messages": total_msgs,
        "security_tests_total": tot_tests,
        "security_tests_passed": passed_tests,
        "security_pass_rate_pct": pass_rate,
        "recent_events": recent_events,
        "active_topology": active_topo,
        "is_empty": (tot_dev == 0 and total_msgs == 0)
    })
