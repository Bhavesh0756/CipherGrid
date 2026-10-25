"""Dashboard Operational Overview API Routes."""
# API Route Documentation:
# - GET /api/dashboard/stats: Aggregates real-time packet metrics, threat counters, and device operational statuses.
# - GET /api/dashboard/system-health: Evaluates uptime, memory footprint, and SQLite storage integrity.

from flask import Blueprint, jsonify
from ..database.db import query_db

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
def get_dashboard_metrics():
    """Returns genuine operational and security metrics aggregated directly from SQLite records."""
    # 1. Device metrics
    tot_dev_row = query_db("SELECT COUNT(*) as cnt FROM devices", one=True)
    tot_dev = tot_dev_row["cnt"] if tot_dev_row else 0

    trusted_row = query_db("SELECT COUNT(*) as cnt FROM devices WHERE trust_status = 'Trusted'", one=True)
    trusted_dev = trusted_row["cnt"] if trusted_row else 0

    untrusted_row = query_db("SELECT COUNT(*) as cnt FROM devices WHERE trust_status = 'Untrusted'", one=True)
    untrusted_dev = untrusted_row["cnt"] if untrusted_row else 0

    quarantined_row = query_db("SELECT COUNT(*) as cnt FROM devices WHERE trust_status = 'Quarantined'", one=True)
    quarantined_dev = quarantined_row["cnt"] if quarantined_row else 0

    online_row = query_db("SELECT COUNT(*) as cnt FROM devices WHERE enabled = 1", one=True)
    online_dev = online_row["cnt"] if online_row else 0

    offline_row = query_db("SELECT COUNT(*) as cnt FROM devices WHERE enabled = 0", one=True)
    offline_dev = offline_row["cnt"] if offline_row else 0

    # 2. Total simulation sessions
    tot_sess_row = query_db("SELECT COUNT(*) as cnt FROM simulation_sessions", one=True)
    tot_sess = tot_sess_row["cnt"] if tot_sess_row else 0

    # 3. Message outcomes
    delivered_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Delivered'", one=True)
    delivered = delivered_row["cnt"] if delivered_row else 0

    rejected_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Rejected'", one=True)
    rejected = rejected_row["cnt"] if rejected_row else 0

    failed_row = query_db("SELECT COUNT(*) as cnt FROM messages WHERE status = 'Failed'", one=True)
    failed = failed_row["cnt"] if failed_row else 0

    total_msgs = delivered + rejected + failed

    # 4. Security test results pass rate
    tot_tests_row = query_db("SELECT COUNT(*) as cnt FROM security_test_results", one=True)
    tot_tests = tot_tests_row["cnt"] if tot_tests_row else 0

    passed_tests_row = query_db("SELECT COUNT(*) as cnt FROM security_test_results WHERE pass_fail = 'PASS'", one=True)
    passed_tests = passed_tests_row["cnt"] if passed_tests_row else 0

    pass_rate = round((passed_tests / tot_tests * 100), 1) if tot_tests > 0 else 100.0

    # 5. Recent security audit events
    recent_events = query_db(
        "SELECT id, timestamp, event_type, source_device, destination_device, security_result, decision, rejection_reason FROM audit_logs ORDER BY timestamp DESC LIMIT 8"
    )

    # 6. Active topology info
    active_topo = query_db("SELECT id, name, description, updated_at FROM topologies WHERE is_default = 1 LIMIT 1", one=True)

    # 7. Threat indicators derived strictly from rejected packets and security alerts
    threat_events_count = query_db("SELECT COUNT(*) as cnt FROM audit_logs WHERE decision = 'REJECTED' OR security_result = 'SECURITY_ALERT'", one=True)["cnt"]

    return jsonify({
        "success": True,
        "total_devices": tot_dev,
        "trusted_devices": trusted_dev,
        "untrusted_devices": untrusted_dev,
        "quarantined_devices": quarantined_dev,
        "online_devices": online_dev,
        "offline_devices": offline_dev,
        "devices_summary": {
            "total": tot_dev,
            "trusted": trusted_dev,
            "untrusted": untrusted_dev,
            "quarantined": quarantined_dev,
            "online": online_dev,
            "offline": offline_dev,
        },
        "total_sessions": tot_sess,
        "messages_delivered": delivered,
        "messages_rejected": rejected,
        "messages_failed": failed,
        "total_messages": total_msgs,
        "threat_events_count": threat_events_count,
        "security_tests_total": tot_tests,
        "security_tests_passed": passed_tests,
        "security_pass_rate_pct": pass_rate,
        "recent_events": recent_events,
        "active_topology": active_topo,
        "is_empty": (tot_dev == 0 and total_msgs == 0)
    })
