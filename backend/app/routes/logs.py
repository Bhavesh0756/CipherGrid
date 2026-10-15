"""Security Event Logs API Routes."""
from flask import Blueprint, request, jsonify
from ..services.log_service import get_logs, clear_logs

logs_bp = Blueprint("logs", __name__, url_prefix="/api/logs")

@logs_bp.route("", methods=["GET"])
def fetch_logs():
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    severity = request.args.get("severity")
    event_type = request.args.get("event_type")
    search = request.args.get("search")

    data = get_logs(limit=limit, offset=offset, severity=severity, event_type=event_type, search=search)
    return jsonify({"success": True, **data})

@logs_bp.route("/clear", methods=["POST"])
def purge_logs():
    clear_logs()
    return jsonify({"success": True, "message": "Security logs purged successfully."})
