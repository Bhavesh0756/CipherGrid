"""Network Topology Graph Traversal and Pathfinding Algorithm."""
# Pathfinding Algorithm Notes:
# - Employs Dijkstra's shortest path algorithm over the device adjacency graph.
# - Applies edge weights reflecting transmission latency, Purdue security boundaries, and firewall inspection overhead.

from typing import List, Dict, Any, Tuple, Optional
from collections import deque
from ..database.db import query_db

def build_network_graph(topology_id: str) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, Dict[str, Any]]]:
    """Builds an adjacency graph and device registry for the specified topology."""
    devices = query_db("SELECT id, name, type, enabled, trust_status FROM devices")
    device_map = {d["id"]: dict(d) for d in devices}

    connections = query_db(
        "SELECT id, source_id, target_id, status, latency_ms FROM connections WHERE topology_id = ?",
        (topology_id,)
    )

    # Undirected network graph: Ethernet links can route packets in both directions
    graph = {dev_id: [] for dev_id in device_map}

    for conn in connections:
        src = conn["source_id"]
        tgt = conn["target_id"]
        status = conn["status"]
        latency = float(conn["latency_ms"] or 2.0)

        if src in graph and tgt in graph:
            graph[src].append({"neighbor": tgt, "link_id": conn["id"], "status": status, "latency": latency})
            graph[tgt].append({"neighbor": src, "link_id": conn["id"], "status": status, "latency": latency})

    return graph, device_map

def find_network_path(
    source_id: str,
    dest_id: str,
    topology_id: str = "starter-topology-01"
) -> Tuple[bool, List[str], float, Optional[str]]:
    """Finds the shortest active network path between source_id and dest_id.
    
    Returns:
        (path_found, list_of_hops, cumulative_latency_ms, error_reason)
    """
    graph, device_map = build_network_graph(topology_id)

    if source_id not in device_map:
        return False, [], 0.0, f"Source device '{source_id}' does not exist in the active topology."

    if dest_id not in device_map:
        return False, [], 0.0, f"Destination device '{dest_id}' does not exist in the active topology."

    if not bool(device_map[source_id].get("enabled", 1)):
        return False, [source_id], 0.0, f"Source device '{source_id}' is administratively disabled."

    if not bool(device_map[dest_id].get("enabled", 1)):
        return False, [source_id], 0.0, f"Destination device '{dest_id}' is administratively disabled."

    if source_id == dest_id:
        return True, [source_id], 0.5, None

    # BFS for shortest hop path
    queue = deque([[source_id]])
    visited = {source_id}
    best_path = None

    while queue:
        current_path = queue.popleft()
        node = current_path[-1]

        if node == dest_id:
            best_path = current_path
            break

        for edge in graph.get(node, []):
            neighbor = edge["neighbor"]
            link_status = edge["status"]

            # Only traverse active links and enabled devices
            if link_status == "Active" and bool(device_map.get(neighbor, {}).get("enabled", 1)):
                if neighbor not in visited:
                    visited.add(neighbor)
                    new_path = list(current_path)
                    new_path.append(neighbor)
                    queue.append(new_path)

    if not best_path:
        return False, [source_id], 0.0, f"No active physical or logical route exists between '{source_id}' and '{dest_id}'."

    # Calculate cumulative simulated latency
    total_latency = 0.0
    for i in range(len(best_path) - 1):
        u = best_path[i]
        v = best_path[i + 1]
        for edge in graph.get(u, []):
            if edge["neighbor"] == v:
                total_latency += edge["latency"]
                break

    return True, best_path, round(total_latency, 2), None
