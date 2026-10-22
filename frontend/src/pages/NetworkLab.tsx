import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Connection as FlowConnection,
  Controls,
  Edge,
  MarkerType,
  MiniMap,
  Node,
  EdgeChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Crosshair,
  Link2,
  Maximize2,
  Minus,
  MousePointer,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react';

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
  } = useSimulatorStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, getZoom, screenToFlowPosition } = useReactFlow();

  const [activeTool, setActiveTool] = useState<'select' | 'connect'>('select');
  const [zoomLevel, setZoomLevel] = useState<number>(95);

  useEffect(() => {
    fetchTopology();
  }, [fetchTopology]);

  // Initial fit view with generous padding so all nodes are beautifully framed and visible
  const initialFitDone = useRef(false);
  useEffect(() => {
    if (devices.length > 0 && !initialFitDone.current) {
      initialFitDone.current = true;
      setTimeout(() => {
        fitView({ padding: 0.18, duration: 200 });
        setTimeout(() => {
          setZoomLevel(Math.round(getZoom() * 100));
        }, 220);
      }, 200);
    }
  }, [devices.length, fitView, getZoom]);

  // Select Core OT Ethernet Switch by default if none selected
  useEffect(() => {
    if (!selectedDevice && devices.length > 0) {
      const switchDev =
        devices.find((d) => d.name.toLowerCase().includes('switch')) ||
        devices.find((d) => d.device_type === 'Ethernet Switch') ||
        devices[0];
      setSelectedDevice(switchDev);
    }
  }, [devices, selectedDevice, setSelectedDevice]);

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
        width: 240,
        height: 86,
        data: { device: d, isSelected, isHighlighted, isActiveHop, isSource, isDestination },
      };
    });
  }, [devices, selectedDevice, highlightedPath, activeHopId]);

  // Edges: Clean matte industrial conduits, highlight blue during simulation (zero neon glare)
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

      const srcDev = devices.find((d) => d.id === c.source_id);
      const dstDev = devices.find((d) => d.id === c.target_id);
      let edgeColor = '#334155';
      if (inPath) {
        edgeColor = '#3b82f6';
      } else if (srcDev?.device_type === 'PLC' || dstDev?.device_type === 'PLC') {
        edgeColor = '#3b82f6';
      } else if (srcDev?.device_type === 'SCADA Server' || dstDev?.device_type === 'SCADA Server') {
        edgeColor = '#8b5cf6';
      } else if (srcDev?.device_type === 'Monitoring Server' || dstDev?.device_type === 'Monitoring Server') {
        edgeColor = '#10b981';
      } else if (srcDev?.device_type === 'Operator Workstation' || dstDev?.device_type === 'Operator Workstation') {
        edgeColor = '#f59e0b';
      } else if (srcDev?.device_type === 'Untrusted Device' || dstDev?.device_type === 'Untrusted Device') {
        edgeColor = '#ef4444';
      }

      return {
        id: c.id,
        source: c.source_id,
        target: c.target_id,
        sourceHandle: 'r',
        targetHandle: 'l',
        type: 'default',
        animated: inPath,
        style: {
          stroke: edgeColor,
          strokeWidth: inPath ? 2.2 : 1.7,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 10,
          height: 10,
        },
        label: `${c.latency_ms} ms`,
        labelStyle: {
          fill: '#cbd5e1',
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.95,
          stroke: inPath ? '#3b82f6' : '#1e293b',
          strokeWidth: 1,
        },
        labelBgPadding: [5, 2] as [number, number],
        labelBgBorderRadius: 9999,
      };
    });
  }, [connections, highlightedPath, devices]);

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

  const onPaneClick = useCallback(() => {}, []);

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

  const handleZoomIn = () => {
    zoomIn();
    setTimeout(() => {
      setZoomLevel(Math.round(getZoom() * 100));
    }, 50);
  };

  const handleZoomOut = () => {
    zoomOut();
    setTimeout(() => {
      setZoomLevel(Math.round(getZoom() * 100));
    }, 50);
  };

  const handleFitView = () => {
    fitView({ padding: 0.16, minZoom: 0.65, maxZoom: 1.0, duration: 250 });
    setTimeout(() => {
      setZoomLevel(Math.round(getZoom() * 100));
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#060913]">
      {/* ─── Top Main Workspace Area: Left Palette | Center Canvas | Right Node Details ─── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left: Device Palette */}
        <DevicePalette onAddDevice={handleAddFromPalette} />

        {/* Center: Topology Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative flex flex-col min-w-0 bg-[#060913]">
          {/* Canvas Top Bar */}
          <div className="h-11 bg-[#0d121f] border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-10">
            {/* Left title and subtitle */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
                <Zap className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white leading-tight font-display uppercase tracking-wider">
                  TOPOLOGY CANVAS
                </h3>
                <span className="text-slate-700 text-xs font-mono">|</span>
                <p className="text-[10.5px] text-slate-400 font-mono hidden sm:inline">
                  Interactive Purdue Grid · Drag nodes & connect port handles
                </p>
              </div>
            </div>

            {/* Right Tools Bar */}
            <div className="flex items-center gap-1.5 font-mono">
              {/* Select tool */}
              <button
                onClick={() => setActiveTool('select')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  activeTool === 'select'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Select Tool"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>

              {/* Link tool */}
              <button
                onClick={() => setActiveTool('connect')}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  activeTool === 'connect'
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Connect Link Tool"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete / Clear button */}
              <button
                onClick={() => {
                  if (selectedDevice) {
                    if (window.confirm(`Delete ${selectedDevice.name}?`)) {
                      deleteConnection(selectedDevice.id);
                      setSelectedDevice(null);
                    }
                  }
                }}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete Selected Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Fit view button */}
              <button
                onClick={handleFitView}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fit View"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              {/* Zoom controls: - 100% + */}
              <div className="flex items-center px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 gap-1">
                <button
                  onClick={handleZoomOut}
                  className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-9 text-center font-mono text-[10.5px] text-slate-300">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Maximize */}
              <button
                onClick={handleFitView}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Expand View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* React Flow Container */}
          <div className="flex-1 w-full h-full relative bg-[#090d16]">
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
              defaultViewport={{ x: 10, y: 10, zoom: 0.8 }}
              snapToGrid
              snapGrid={[16, 16]}
              minZoom={0.5}
              maxZoom={1.5}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.5}
                color="#1e293b"
              />
              <MiniMap
                position="bottom-right"
                nodeStrokeWidth={1}
                maskColor="rgba(9, 13, 22, 0.75)"
                nodeColor={(node: any) => {
                  switch (node.data?.device?.device_type) {
                    case 'PLC': return '#2563eb';
                    case 'Sensor': return '#d97706';
                    case 'SCADA Server': return '#7c3aed';
                    case 'Operator Workstation': return '#ea580c';
                    case 'Untrusted Device': return '#dc2626';
                    case 'Monitoring Server': return '#059669';
                    default: return '#334155';
                  }
                }}
                className="!bg-[#0d121f] !border !border-slate-800 !rounded-xl overflow-hidden !m-4 shadow-lg"
                style={{ width: 130, height: 80 }}
              />
              <Controls
                showInteractive={false}
                position="bottom-right"
                className="!bg-[#0d121f] !border !border-slate-800 !rounded-lg !mr-4 !mb-26 shadow-lg"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Right: Node Details Inspector Panel */}
        {selectedDevice && (
          <DeviceInspector
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
          />
        )}
      </div>

      {/* ─── Bottom Workspace: Simulation Controls and Event Logs ─── */}
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
