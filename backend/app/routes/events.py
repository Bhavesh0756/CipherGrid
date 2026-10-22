"""Audit Logs and Simulation Events API Routes."""
# API Route Documentation:
# - GET /api/events/packet-stream: Streams real-time packet transit hops and verification events.
# - GET /api/events/audit-logs: Queries immutable audit trail with severity and date range filtering.
# - DELETE /api/events/audit-logs: Flushes transient event telemetry while preserving baseline benchmarks.

import csv
import io
import json
from flask import Blueprint, request, jsonify, Response
from ..database.db import query_db

events_bp = Blueprint("events", __name__, url_prefix="/api/events")

@events_bp.route("", methods=["GET"])
def get_audit_logs():
    """Retrieves paginated, filtered audit logs."""
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))
    event_type = request.args.get("event_type")
    decision = request.args.get("decision")
    source_device = request.args.get("source_device")
    search = request.args.get("search")

    conditions = []
    args = []

    if event_type and event_type != "ALL":
        conditions.append("event_type = ?")
        args.append(event_type)

    if decision and decision != "ALL":
        conditions.append("decision = ?")
        args.append(decision)

    if source_device and source_device != "ALL":
        conditions.append("source_device = ?")
        args.append(source_device)

    if search:
        conditions.append("(source_device LIKE ? OR destination_device LIKE ? OR rejection_reason LIKE ? OR event_type LIKE ?)")
        wildcard = f"%{search}%"
        args.extend([wildcard, wildcard, wildcard, wildcard])

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    count_res = query_db(f"SELECT COUNT(*) as cnt FROM audit_logs {where_clause}", tuple(args), one=True)
    total = count_res["cnt"] if count_res else 0

    query = f"""
        SELECT * FROM audit_logs 
        {where_clause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    """
    fetch_args = list(args) + [limit, offset]
    logs = query_db(query, tuple(fetch_args))

    for log in logs:
        if log.get("details_json"):
            try:
                log["details"] = json.loads(log["details_json"])
            except Exception:
                log["details"] = {}

    return jsonify({
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "logs": logs
    })

@events_bp.route("/packet-stream", methods=["GET"])
def get_packet_events():
    """Retrieves simulation packet events for the Packet Inspector table."""
    limit = int(request.args.get("limit", 100))
    message_id = request.args.get("message_id")
    state = request.args.get("state")

    conditions = []
    args = []

    if message_id:
        conditions.append("message_id = ?")
        args.append(message_id)

    if state and state != "ALL":
        conditions.append("packet_state = ?")
        args.append(state)

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    events = query_db(
        f"SELECT * FROM simulation_events {where_clause} ORDER BY id DESC LIMIT ?",
        tuple(args + [limit])
    )

    for ev in events:
        if ev.get("wire_details_json"):
            try:
                ev["wire_details"] = json.loads(ev["wire_details_json"])
            except Exception:
                ev["wire_details"] = {}

    return jsonify({"success": True, "events": events, "total": len(events)})

@events_bp.route("/export", methods=["GET"])
def export_audit_logs_csv():
    """Exports audit logs as a downloadable CSV."""
    logs = query_db("SELECT id, timestamp, session_id, message_id, source_device, destination_device, event_type, security_result, decision, rejection_reason FROM audit_logs ORDER BY timestamp DESC LIMIT 500")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "Timestamp", "Session ID", "Message ID", "Source", "Destination", "Event Type", "Security Result", "Decision", "Rejection Reason"])

    for log in logs:
        writer.writerow([
            log["id"], log["timestamp"], log["session_id"], log["message_id"],
            log["source_device"], log["destination_device"], log["event_type"],
            log["security_result"], log["decision"], log["rejection_reason"] or "N/A"
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=secure_ics_audit_log.csv"}
    )
