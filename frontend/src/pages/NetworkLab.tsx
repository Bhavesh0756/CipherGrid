import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection as FlowConnection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  NodeChange,
  EdgeChange,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DeviceInspector } from '../components/NetworkLab/DeviceInspector';
import { DevicePalette } from '../components/NetworkLab/DevicePalette';
import { IndustrialNode } from '../components/NetworkLab/IndustrialNode';
import { MessageSimulatorModal } from '../components/NetworkLab/MessageSimulatorModal';
import { SimulationControls } from '../components/NetworkLab/SimulationControls';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { Device, DeviceType, PurdueLevel } from '../types';

const nodeTypes = {
  industrialDevice: IndustrialNode,
};

const NetworkLabContent: React.FC = () => {
  const {
    devices,
    connections,
    selectedDevice,
    setSelectedDevice,
    setDevicePosition,
    createDevice,
    addConnection,
    deleteConnection,
    fetchTopology,
    highlightedPath,
    activeHopId,
    isMessageModalOpen,
    setMessageModalOpen,
    activeSessionId,
  } = useSimulatorStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  // Convert our store devices to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    return devices.map((d) => {
      const isSelected = selectedDevice?.id === d.id;
      const isHighlighted = highlightedPath.includes(d.id);
      const isActiveHop = activeHopId === d.id;
      const isSource = highlightedPath.length > 0 && highlightedPath[0] === d.id;
      const isDestination =
        highlightedPath.length > 1 && highlightedPath[highlightedPath.length - 1] === d.id;

      return {
        id: d.id,
        type: 'industrialDevice',
        position: { x: d.position_x, y: d.position_y },
        data: {
          device: d,
          isSelected,
          isHighlighted,
          isActiveHop,
          isSource,
          isDestination,
        },
      };
    });
  }, [devices, selectedDevice, highlightedPath, activeHopId]);

  // Convert our store connections to React Flow edges
  const edges: Edge[] = useMemo(() => {
    return connections.map((c) => {
      // Check if this connection is part of the highlighted route
      let inPath = false;
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        if (
          (highlightedPath[i] === c.source_id && highlightedPath[i + 1] === c.target_id) ||
          (highlightedPath[i] === c.target_id && highlightedPath[i + 1] === c.source_id)
        ) {
          inPath = true;
          break;
        }
      }

      return {
        id: c.id,
        source: c.source_id,
        target: c.target_id,
        sourceHandle: 'r',
        targetHandle: 'l',
        animated: inPath,
        style: {
          stroke: inPath ? '#2563eb' : '#64748b',
          strokeWidth: inPath ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: inPath ? '#2563eb' : '#64748b',
          width: 14,
          height: 14,
        },
        label: `${c.latency_ms}ms`,
        labelStyle: { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 2,
      };
    });
  }, [connections, highlightedPath]);

  // Handle node drag stop to persist coordinates in memory
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      setDevicePosition(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [setDevicePosition]
  );

  // Handle node click to inspect
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const dev = devices.find((d) => d.id === node.id);
      setSelectedDevice(dev || null);
    },
    [devices, setSelectedDevice]
  );

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    setSelectedDevice(null);
  }, [setSelectedDevice]);

  // Handle connect (wiring links between devices)
  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (params.source && params.target && params.source !== params.target) {
        addConnection({ source: params.source, target: params.target });
      }
    },
    [addConnection]
  );

  // Handle edge delete (click edge and delete or via edge change)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteConnection(change.id);
        }
      });
    },
    [deleteConnection]
  );

  // Drag and Drop from Palette onto React Flow canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const paletteData = event.dataTransfer.getData('application/palette-item');
      if (!paletteData) return;

      const item = JSON.parse(paletteData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const uniqueCount = devices.filter((d) => d.device_type === item.type).length + 1;
      const cleanName = `${item.label.replace(/[\s/]/g, '-')}-${String(uniqueCount).padStart(2, '0')}`;
      const uniqueId = `${item.type.toLowerCase().replace(/[\s/]/g, '_')}_${Date.now()}`;

      // Generate plausible private network IP
      const ip = `192.168.${item.type === 'Sensor' ? 10 : item.type === 'PLC' ? 20 : 30}.${10 + uniqueCount}`;

      createDevice({
        id: uniqueId,
        name: cleanName,
        device_type: item.type as DeviceType,
        ip_address: ip,
        role: item.role,
        trust_status: item.type === 'Untrusted Device' ? 'Untrusted' : 'Trusted',
        purdue_level: item.defaultPurdue as PurdueLevel,
        is_enabled: true,
        allowed_actions:
          item.type === 'Sensor'
            ? ['Sensor Reading']
            : item.type === 'PLC'
            ? ['Sensor Reading', 'Device Status', 'Controller Command']
            : ['Sensor Reading', 'Device Status', 'Controller Command', 'Alarm Notification'],
        position_x: Math.round(position.x),
        position_y: Math.round(position.y),
      });
    },
    [createDevice, devices, screenToFlowPosition]
  );

  const handleAddFromPalette = (item: any) => {
    const uniqueCount = devices.filter((d) => d.device_type === item.type).length + 1;
    const cleanName = `${item.label.replace(/[\s/]/g, '-')}-${String(uniqueCount).padStart(2, '0')}`;
    const uniqueId = `${item.type.toLowerCase().replace(/[\s/]/g, '_')}_${Date.now()}`;
    const ip = `192.168.${item.type === 'Sensor' ? 10 : item.type === 'PLC' ? 20 : 30}.${10 + uniqueCount}`;

    createDevice({
      id: uniqueId,
      name: cleanName,
      device_type: item.type as DeviceType,
      ip_address: ip,
      role: item.role,
      trust_status: item.type === 'Untrusted Device' ? 'Untrusted' : 'Trusted',
      purdue_level: item.defaultPurdue as PurdueLevel,
      is_enabled: true,
      allowed_actions: ['Sensor Reading', 'Device Status'],
      position_x: 200 + uniqueCount * 30,
      position_y: 150 + uniqueCount * 30,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafbfc]">
      {/* Central Editor Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Device Palette */}
        <DevicePalette onAddDevice={handleAddFromPalette} />

        {/* Center: React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onConnect={onConnect}
            onEdgesChange={onEdgesChange}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} color="#cbd5e1" />
            <Controls className="!bg-white !border-slate-200 !shadow-sm !rounded text-slate-700" />
            <MiniMap
              nodeColor={() => '#94a3b8'}
              maskColor="rgba(241, 245, 249, 0.7)"
              className="!border !border-slate-200 !rounded !shadow-sm"
            />
          </ReactFlow>

          {/* Canvas Floating Quick Hint */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded text-[11px] shadow-xs pointer-events-none">
            <span className="font-semibold text-slate-800">Topology Canvas:</span> Connect port handles to wire links. Drag nodes to reposition.
          </div>
        </div>

        {/* Right: Contextual Device Inspector */}
        {selectedDevice && (
          <DeviceInspector device={selectedDevice} onClose={() => setSelectedDevice(null)} />
        )}
      </div>

      {/* Bottom: Simulation Event Controls */}
      <SimulationControls />

      {/* Message Simulator Modal */}
      <MessageSimulatorModal
        isOpen={isMessageModalOpen}
        onClose={() => setMessageModalOpen(false)}
      />
    </div>
  );
};

export const NetworkLab: React.FC = () => {
  return (
    <ReactFlowProvider>
      <NetworkLabContent />
    </ReactFlowProvider>
  );
};
