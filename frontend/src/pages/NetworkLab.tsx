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

  const nodes: Node[] = useMemo(() => {
    return devices.map((d) => {
      const isSelected = selectedDevice?.id === d.id;
      const isHighlighted = highlightedPath.includes(d.id);
      const isActiveHop = activeHopId === d.id;
      const isSource = highlightedPath.length > 0 && highlightedPath[0] === d.id;
      const isDestination = highlightedPath.length > 1 && highlightedPath[highlightedPath.length - 1] === d.id;

      return {
        id: d.id,
        type: 'industrialDevice',
        position: { x: d.position_x, y: d.position_y },
        data: { device: d, isSelected, isHighlighted, isActiveHop, isSource, isDestination },
      };
    });
  }, [devices, selectedDevice, highlightedPath, activeHopId]);

  const edges: Edge[] = useMemo(() => {
    return connections.map((c) => {
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
          stroke: inPath ? '#0891b2' : '#d6d3d1',
          strokeWidth: inPath ? 2.5 : 1.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: inPath ? '#0891b2' : '#a8a29e',
          width: 12,
          height: 12,
        },
        label: `${c.latency_ms}ms`,
        labelStyle: { fill: '#78716c', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace' },
        labelBgStyle: { fill: '#fafaf9', fillOpacity: 0.95 },
        labelBgPadding: [3, 2] as [number, number],
        labelBgBorderRadius: 3,
      };
    });
  }, [connections, highlightedPath]);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      setDevicePosition(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [setDevicePosition]
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const dev = devices.find((d) => d.id === node.id);
      setSelectedDevice(dev || null);
    },
    [devices, setSelectedDevice]
  );

  const onPaneClick = useCallback(() => {
    setSelectedDevice(null);
  }, [setSelectedDevice]);

  const onConnect = useCallback(
    (params: FlowConnection) => {
      if (params.source && params.target && params.source !== params.target) {
        addConnection({ source: params.source, target: params.target });
      }
    },
    [addConnection]
  );

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
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
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
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fafaf9' }}>
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Device Palette */}
        <DevicePalette onAddDevice={handleAddFromPalette} />

        {/* Center: Canvas */}
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
            snapGrid={[16, 16]}
            minZoom={0.2}
            maxZoom={2.5}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e7e5e4" />
            <Controls />
            <MiniMap
              nodeColor={() => '#a8a29e'}
              maskColor="rgba(250, 250, 249, 0.75)"
            />
          </ReactFlow>

          {/* Canvas tip overlay */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-stone-200/80 text-stone-500 px-3 py-1.5 rounded-lg text-[10.5px] shadow-xs pointer-events-none">
            <span className="font-medium text-stone-700">Drag</span> palette items onto canvas ·{' '}
            <span className="font-medium text-stone-700">Connect</span> port handles to wire links ·{' '}
            <span className="font-medium text-stone-700">Click</span> node to inspect
          </div>
        </div>

        {/* Right: Device Inspector */}
        {selectedDevice && (
          <DeviceInspector device={selectedDevice} onClose={() => setSelectedDevice(null)} />
        )}
      </div>

      {/* Bottom: Simulation controls */}
      <SimulationControls />

      {/* Modal */}
      <MessageSimulatorModal isOpen={isMessageModalOpen} onClose={() => setMessageModalOpen(false)} />
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
