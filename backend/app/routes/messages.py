"""Industrial Message Simulator API Routes."""
import json
from flask import Blueprint, request, jsonify
from ..simulation.engine import simulate_industrial_message
from ..database.db import query_db

messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")

@messages_bp.route("/send", methods=["POST"])
def send_message():
    """Dispatches a message across the simulated industrial network with selected security profile."""
    # Parse dispatch payload parameters and simulation security flags
    data = request.get_json() or {}
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message_type = data.get("message_type", "Sensor Reading")
    raw_payload = data.get("payload", {})
    security_profile = data.get("security_profile", "Authenticated Secure Communication")
    scenario_id = data.get("scenario_id", "normal")
    session_id = data.get("session_id")

    if not sender_id or not receiver_id:
        return jsonify({"success": False, "error": "sender_id and receiver_id are required."}), 400

    try:
        result = simulate_industrial_message(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=message_type,
            raw_payload=raw_payload,
            security_profile=security_profile,
            scenario_id=scenario_id,
            session_id=session_id
        )
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": f"Internal simulation failure: {str(e)}"}), 500

@messages_bp.route("", methods=["GET"])
def list_messages():
    """Lists simulated messages with pagination and filtering."""
    limit = int(request.args.get("limit", 50))
    status = request.args.get("status")

    query = "SELECT * FROM messages"
    args = []
    if status and status != "ALL":
        query += " WHERE status = ?"
        args.append(status)

    query += " ORDER BY created_at DESC LIMIT ?"
    args.append(limit)

    messages = query_db(query, tuple(args))
    return jsonify({"success": True, "messages": messages, "total": len(messages)})

@messages_bp.route("/<message_id>", methods=["GET"])
def get_message_detail(message_id):
    """Retrieves detailed lifecycle and hop-by-hop packet inspection events for a message."""
    msg = query_db("SELECT * FROM messages WHERE id = ?", (message_id,), one=True)
    if not msg:
        return jsonify({"success": False, "error": f"Message '{message_id}' not found."}), 404

    events = query_db(
        "SELECT * FROM simulation_events WHERE message_id = ? ORDER BY step_index ASC",
        (message_id,)
    )

    for ev in events:
        if ev.get("wire_details_json"):
            try:
                ev["wire_details"] = json.loads(ev["wire_details_json"])
            except Exception:
                ev["wire_details"] = {}

    return jsonify({"success": True, "message": msg, "events": events})
