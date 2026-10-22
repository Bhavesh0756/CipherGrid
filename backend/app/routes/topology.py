"""Network Topology Configuration and Persistence API Routes."""
# API Route Documentation:
# - GET /api/topology: Retrieves node-link graph data for canvas rendering.
# - POST /api/topology/link: Establishes bidirectional communication channel between industrial devices.
# - DELETE /api/topology/link: Simulates physical fiber/Ethernet link failure or air-gap severance.

import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..database.db import query_db, execute_db, seed_default_topology, generate_device_keys

topology_bp = Blueprint("topology", __name__, url_prefix="/api/topology")

@topology_bp.route("", methods=["GET"])
def get_topology():
    """Retrieves the active network topology (React Flow nodes and edges)."""
    topo = query_db("SELECT * FROM topologies WHERE is_default = 1 LIMIT 1", one=True)
    if not topo:
        topo = query_db("SELECT * FROM topologies ORDER BY updated_at DESC LIMIT 1", one=True)

    if not topo:
        seed_default_topology()
        topo = query_db("SELECT * FROM topologies WHERE is_default = 1 LIMIT 1", one=True)

    data = json.loads(topo["data_json"]) if topo else {"nodes": [], "edges": []}
    return jsonify({
        "success": True,
        "topology_id": topo["id"] if topo else "default",
        "name": topo["name"] if topo else "Untitled Topology",
        "description": topo["description"] if topo else "",
        "nodes": data.get("nodes", []),
        "edges": data.get("edges", []),
        "updated_at": topo["updated_at"] if topo else None
    })

@topology_bp.route("", methods=["POST"])
def save_topology():
    """Saves or updates the network canvas topology, syncing nodes and connections."""
    data = request.get_json() or {}
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    name = data.get("name", "Active Industrial Topology")
    description = data.get("description", "")
    now = datetime.now(timezone.utc).isoformat()

    topo = query_db("SELECT id FROM topologies WHERE is_default = 1 LIMIT 1", one=True)
    topology_id = topo["id"] if topo else "starter-topology-01"

    data_payload = json.dumps({"nodes": nodes, "edges": edges})

    execute_db(
        """INSERT INTO topologies (id, name, description, data_json, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               description = excluded.description,
               data_json = excluded.data_json,
               updated_at = excluded.updated_at""",
        (topology_id, name, description, data_payload, now, now)
    )

    # Sync connections table for backend pathfinding
    execute_db("DELETE FROM connections WHERE topology_id = ?", (topology_id,))
    
    for edge in edges:
        edge_id = edge.get("id") or f"conn-{uuid.uuid4().hex[:6]}"
        src = edge.get("source")
        tgt = edge.get("target")
        edge_data = edge.get("data", {})
        latency = float(edge_data.get("latency_ms", 2.0))
        status = edge_data.get("status", "Active")
        link_type = edge_data.get("link_type", "Ethernet")

        if src and tgt:
            execute_db(
                """INSERT INTO connections (id, topology_id, source_id, target_id, source_port, target_port, link_type, status, latency_ms)
                   VALUES (?, ?, ?, ?, 'eth0', 'eth0', ?, ?, ?)""",
                (edge_id, topology_id, src, tgt, link_type, status, latency)
            )

    # Also update or insert device records in devices table
    for node in nodes:
        node_id = node.get("id")
        if not node_id:
            continue
        pos = node.get("position", {})
        x = float(pos.get("x", 0))
        y = float(pos.get("y", 0))
        node_data = node.get("data", {})

        existing = query_db("SELECT id FROM devices WHERE id = ?", (node_id,), one=True)
        if existing:
            execute_db("UPDATE devices SET x_pos = ?, y_pos = ? WHERE id = ?", (x, y, node_id))
        else:
            name = node_data.get("name") or node_id
            dev_type = node_data.get("type") or "PLC"
            ip = node_data.get("ip_address") or "192.168.1.100"
            mac = node_data.get("mac_address") or f"00:1A:2B:3C:4D:{abs(hash(node_id)) % 90 + 10}"
            role = node_data.get("role") or "Controller"
            trust = node_data.get("trust_status") or "Trusted"
            purdue = node_data.get("purdue_level") or "Level 1"
            enabled = 1 if node_data.get("enabled", True) else 0

            pub_pem, priv_pem, aes_key = generate_device_keys(node_id)
            execute_db(
                """INSERT INTO devices 
                   (id, name, type, ip_address, mac_address, purdue_level, role, trust_status, enabled, allowed_actions, public_key_pem, private_key_pem, aes_key_hex, x_pos, y_pos, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    node_id, name, dev_type, ip, mac, purdue, role, trust, enabled,
                    json.dumps(["Sensor Reading", "Device Status", "Controller Command", "Alarm Notification"]),
                    pub_pem, priv_pem, aes_key, x, y, now, now
                )
            )

    return jsonify({"success": True, "message": "Topology successfully saved.", "topology_id": topology_id})

@topology_bp.route("/reset", methods=["POST"])
def reset_topology():
    """Resets the network topology back to the standard industrial starter installation."""
    execute_db("DELETE FROM connections")
    execute_db("DELETE FROM topologies")
    execute_db("DELETE FROM devices")
    seed_default_topology()
    return jsonify({"success": True, "message": "Topology reset to standard starter installation."})

@topology_bp.route("/connections", methods=["GET"])
def get_connections():
    """Lists all active network links."""
    conns = query_db("SELECT * FROM connections ORDER BY id ASC")
    return jsonify({"success": True, "connections": conns, "total": len(conns)})
