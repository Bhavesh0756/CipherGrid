"""Network Topology Configuration and Persistence API Routes."""
import json
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..database.db import query_db, execute_db, seed_default_topology

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

    # Also update device positions in devices table
    for node in nodes:
        node_id = node.get("id")
        pos = node.get("position", {})
        x = pos.get("x", 0)
        y = pos.get("y", 0)
        execute_db("UPDATE devices SET x_pos = ?, y_pos = ? WHERE id = ?", (x, y, node_id))

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
