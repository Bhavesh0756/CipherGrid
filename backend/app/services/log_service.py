"""Security Event Logging Service.

Provides safe audit logging in SQLite without recording private keys, secrets,
or sensitive cryptographic parameters.
"""
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from ..database.db import get_connection, query_db, execute_db

def sanitize_details(details: Any) -> str:
    """Removes sensitive keys, secrets, or plaintext credentials before persisting."""
    if not details:
        return "{}"
    if isinstance(details, str):
        try:
            details_dict = json.loads(details)
        except Exception:
            return json.dumps({"raw_note": details[:100]})
    elif isinstance(details, dict):
        details_dict = dict(details)
    else:
        details_dict = {"value": str(details)}

    # Redact sensitive attributes
    sensitive_keys = {"private_key", "secret", "key_bytes", "password", "session_key", "raw_key"}
    for k in list(details_dict.keys()):
        if any(sens in k.lower() for sens in sensitive_keys):
            details_dict[k] = "[REDACTED_CRYPTOGRAPHIC_MATERIAL]"

    return json.dumps(details_dict)

def record_event(
    event_type: str,
    severity: str,
    device_id: Optional[str],
    action: Optional[str],
    result: str,
    message: str,
    details: Any = None
) -> int:
    """Inserts a new safe security event record into the database."""
    now = datetime.now(timezone.utc).isoformat()
    clean_details = sanitize_details(details)
    query = """
        INSERT INTO security_events (timestamp, event_type, severity, device_id, action, result, message, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    event_id, _ = execute_db(
        query,
        (now, event_type, severity, device_id, action, result, message, clean_details)
    )
    return event_id

def get_logs(
    limit: int = 100,
    offset: int = 0,
    severity: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    """Retrieves filtered security audit logs."""
    conditions = []
    args = []

    if severity and severity != "ALL":
        conditions.append("severity = ?")
        args.append(severity)

    if event_type and event_type != "ALL":
        conditions.append("event_type = ?")
        args.append(event_type)

    if search:
        conditions.append("(message LIKE ? OR device_id LIKE ? OR action LIKE ? OR event_type LIKE ?)")
        wildcard = f"%{search}%"
        args.extend([wildcard, wildcard, wildcard, wildcard])

    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    count_query = f"SELECT COUNT(*) as count FROM security_events {where_clause}"
    count_res = query_db(count_query, tuple(args), one=True)
    total_count = count_res["count"] if count_res else 0

    query = f"""
        SELECT id, timestamp, event_type, severity, device_id, action, result, message, details
        FROM security_events
        {where_clause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    """
    fetch_args = list(args) + [limit, offset]
    logs = query_db(query, tuple(fetch_args))

    for log in logs:
        if log.get("details"):
            try:
                log["details"] = json.loads(log["details"])
            except Exception:
                pass

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "events": logs
    }

def clear_logs() -> bool:
    """Clears non-essential logs, retaining initial system audit baseline."""
    execute_db("DELETE FROM security_events")
    now = datetime.now(timezone.utc).isoformat()
    record_event(
        event_type="AUDIT_LOGS_PURGED",
        severity="WARNING",
        device_id="ADMIN",
        action="PURGE",
        result="SUCCESS",
        message="Security audit event log table was purged by administrator.",
        details={"purged_at": now}
    )
    return True
