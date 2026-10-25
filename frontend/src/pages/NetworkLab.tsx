/**
 * NetworkLab - Interactive OT topology canvas powered by React Flow.
 */
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
  Box,
  Crosshair,
  Link2,
  Maximize2,
  Minus,
  MousePointer,
  Plus,
  Scissors,
  Settings,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react';

import { DeviceInspector } from '../components/NetworkLab/DeviceInspector';
import { DevicePalette } from '../components/NetworkLab/DevicePalette';
import { IndustrialNode } from '../components/NetworkLab/IndustrialNode';
import { LaserEdge } from '../components/NetworkLab/LaserEdge';
import { MessageSimulatorModal } from '../components/NetworkLab/MessageSimulatorModal';
import { SimulationControls } from '../components/NetworkLab/SimulationControls';
import { NetworkPlant3DView } from '../components/ThreeD/NetworkPlant3DView';
import { Device3DModal } from '../components/ThreeD/Device3DModal';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { Device, DeviceType, PurdueLevel } from '../types';

const nodeTypes = {
  industrialDevice: IndustrialNode,
};

const edgeTypes = {
  laserEdge: LaserEdge,
  default: LaserEdge,
};

const NetworkLabContent: React.FC = () => {
  const {
    devices,
    connections,
    selectedDevice,
    setSelectedDevice,
    setDevicePosition,
    createDevice,
    deleteDevice,
    addConnection,
    deleteConnection,
    fetchTopology,
    highlightedPath,
    activeHopId,
    playbackState,
    simulationEvents,
    selectedEvent,
    lastResult,
    isMessageModalOpen,
    setMessageModalOpen,
  } = useSimulatorStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, getZoom, screenToFlowPosition } = useReactFlow();

  const [activeTool, setActiveTool] = useState<'select' | 'connect' | 'slice'>('select');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [labViewMode, setLabViewMode] = useState<'2d' | '3d'>('2d');
  const [twinDevice, setTwinDevice] = useState<Device | null>(null);

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

  const nodes: Node[] = useMemo(() => {
    const secStatus = (selectedEvent?.security_status || lastResult?.status || '').toLowerCase();
    const isTampered =
      selectedEvent?.packet_state === 'Rejected' ||
      selectedEvent?.packet_state === 'Failed' ||
      secStatus.includes('mismatch') ||
      secStatus.includes('tamper') ||
      secStatus.includes('invalid') ||
      secStatus.includes('replay') ||
      secStatus.includes('violation') ||
      secStatus.includes('attack') ||
      secStatus.includes('denied');

    const isSimulating = playbackState === 'playing' || playbackState === 'paused';

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
        data: {
          device: d,
          isSelected,
          isHighlighted,
          isActiveHop,
          isSource,
          isDestination,
          laserStatus: isTampered ? 'tampered' : 'accepted',
          isSimulating,
        },
      };
    });
  }, [devices, selectedDevice, highlightedPath, activeHopId, selectedEvent, lastResult, playbackState]);


  // Edges: Interactive Laser Edge with animated energy pulse & tamper explosion
  const edges: Edge[] = useMemo(() => {
    // Determine the active hop pair from highlightedPath & activeHopId
    let activeSrc: string | null = null;
    let activeDst: string | null = null;

    if (selectedEvent?.current_hop && selectedEvent?.next_hop) {
      activeSrc = selectedEvent.current_hop;
      activeDst = selectedEvent.next_hop;
    } else if (highlightedPath.length > 1 && activeHopId) {
      const hopIdx = highlightedPath.indexOf(activeHopId);
      if (hopIdx > 0) {
        activeSrc = highlightedPath[hopIdx - 1];
        activeDst = highlightedPath[hopIdx];
      } else if (hopIdx === 0) {
        activeSrc = highlightedPath[0];
        activeDst = highlightedPath[1];
      }
    } else if (highlightedPath.length > 1 && (playbackState === 'playing' || playbackState === 'paused')) {
      activeSrc = highlightedPath[0];
      activeDst = highlightedPath[1];
    }

    // Comprehensive attack/tamper/unauthorized detection
    const isUnauthorizedOrAttack = (() => {
      // 1. Check lastResult for rejections, drops, and violations
      if (lastResult) {
        if (lastResult.success === false) return true;
        const resStatus = String(lastResult.status || '').toLowerCase();
        if (
          resStatus.includes('reject') ||
          resStatus.includes('drop') ||
          resStatus.includes('fail') ||
          resStatus.includes('tamper') ||
          resStatus.includes('attack') ||
          resStatus.includes('violation') ||
          resStatus.includes('unauthoriz') ||
          resStatus.includes('untrusted') ||
          resStatus.includes('denied')
        ) return true;

        const reason = String(lastResult.rejection_reason || '').toLowerCase();
        if (
          reason.includes('unauthoriz') ||
          reason.includes('blocked') ||
          reason.includes('violation') ||
          reason.includes('denial') ||
          reason.includes('attack') ||
          reason.includes('tamper') ||
          reason.includes('untrusted')
        ) return true;
      }

      // 2. Check all simulationEvents for violations/failures
      const hasFailedEvent = (simulationEvents || []).some((ev) => {
        const state = String(ev.packet_state || '').toLowerCase();
        const sec = String(ev.security_status || '').toLowerCase();
        const exp = String(ev.explanation || '').toLowerCase();
        return (
          state === 'rejected' ||
          state === 'failed' ||
          state === 'dropped' ||
          sec.includes('violation') ||
          sec.includes('tamper') ||
          sec.includes('mismatch') ||
          sec.includes('invalid') ||
          sec.includes('attack') ||
          sec.includes('replay') ||
          sec.includes('unauthoriz') ||
          sec.includes('denied') ||
          exp.includes('unauthoriz') ||
          exp.includes('denial') ||
          exp.includes('violation') ||
          exp.includes('blocked')
        );
      });
      if (hasFailedEvent) return true;

      // 3. Check selectedEvent
      if (selectedEvent) {
        const state = String(selectedEvent.packet_state || '').toLowerCase();
        const sec = String(selectedEvent.security_status || '').toLowerCase();
        if (
          state === 'rejected' ||
          state === 'failed' ||
          state === 'dropped' ||
          sec.includes('violation') ||
          sec.includes('tamper') ||
          sec.includes('mismatch') ||
          sec.includes('invalid') ||
          sec.includes('attack') ||
          sec.includes('replay') ||
          sec.includes('unauthoriz') ||
          sec.includes('denied')
        ) return true;
      }

      // 4. Check if any device on the route is Untrusted
      const pathHasUntrusted = highlightedPath.some((devId) => {
        const dev = devices.find((d) => d.id === devId || d.name === devId);
        return dev?.trust_status === 'Untrusted' || dev?.device_type === 'Untrusted Device';
      });
      if (pathHasUntrusted) return true;

      return false;
    })();

    const edgeStatus: 'accepted' | 'tampered' | 'idle' = isUnauthorizedOrAttack ? 'tampered' : 'accepted';

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

      const isActiveHop =
        (playbackState === 'playing' || playbackState === 'paused') &&
        ((c.source_id === activeSrc && c.target_id === activeDst) ||
          (c.source_id === activeDst && c.target_id === activeSrc));

      const srcDev = devices.find((d) => d.id === c.source_id);
      const dstDev = devices.find((d) => d.id === c.target_id);
      let edgeColor = '#242B3A';
      if (inPath) {
        edgeColor = isUnauthorizedOrAttack ? '#f43f5e' : '#3b82f6';
      } else if (
        srcDev?.trust_status === 'Untrusted' ||
        dstDev?.trust_status === 'Untrusted' ||
        srcDev?.device_type === 'Untrusted Device' ||
        dstDev?.device_type === 'Untrusted Device'
      ) {
        edgeColor = '#f43f5e';
      } else {
        edgeColor = '#242B3A';
      }

      const hopStrokeColor = activeTool === 'slice'
        ? '#f43f5e'
        : isActiveHop
        ? (isUnauthorizedOrAttack ? '#f43f5e' : '#10b981')
        : inPath
        ? (isUnauthorizedOrAttack ? '#f43f5e' : '#3b82f6')
        : edgeColor;

      return {
        id: c.id,
        source: c.source_id,
        target: c.target_id,
        sourceHandle: 'r',
        targetHandle: 'l',
        type: 'laserEdge',
        animated: isActiveHop || inPath,
        data: {
          isActive: isActiveHop,
          inPath,
          status: isUnauthorizedOrAttack ? 'tampered' : (isActiveHop ? 'accepted' : 'idle'),
          isTampered: isUnauthorizedOrAttack,
          latency: c.latency_ms,
          edgeColor,
          sourceDeviceName: srcDev?.name,
          targetDeviceName: dstDev?.name,
          isSliceMode: activeTool === 'slice',
          onDelete: deleteConnection,
        },
        style: {
          stroke: hopStrokeColor,
          strokeWidth: activeTool === 'slice' ? 3 : isActiveHop ? 3.2 : inPath ? 2.5 : 1.7,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: hopStrokeColor,
          width: 12,
          height: 12,
        },
      };
    });
  }, [connections, highlightedPath, activeHopId, playbackState, simulationEvents, selectedEvent, lastResult, devices, activeTool, deleteConnection]);



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

  const onEdgeClick = useCallback(
    (_: any, edge: Edge) => {
      if (activeTool === 'slice') {
        deleteConnection(edge.id);
      }
    },
    [activeTool, deleteConnection]
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090A0F]">
      {/* ─── Top Main Workspace Area: Left Palette | Center Canvas | Right Node Details ─── */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Left: Device Palette (Opens on demand) */}
        {isPaletteOpen && (
          <DevicePalette
            onAddDevice={handleAddFromPalette}
            onClose={() => setIsPaletteOpen(false)}
          />
        )}

        {/* Center: Topology Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 h-full w-full relative flex flex-col min-w-0 bg-[#090A0F]">
          {/* Canvas Top Bar */}
          <div className="h-11 bg-[#10131A] border-b border-[#1E2430] px-4 flex items-center justify-between shrink-0 z-10">
            {/* Left title, ADD button, and subtitle */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsPaletteOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  isPaletteOpen
                    ? 'bg-blue-600 border-blue-400 text-white shadow-blue-900/40 ring-1 ring-blue-400'
                    : 'bg-blue-600 hover:bg-blue-500 border-blue-500/50 text-white'
                }`}
                title="Toggle Device Palette"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD DEVICE</span>
              </button>

              <div className="w-6 h-6 rounded-md bg-[#161B26] border border-[#222B3C] flex items-center justify-center text-blue-400">
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
                    : 'bg-[#141824] border-[#1E2430] text-slate-400 hover:text-white hover:bg-[#181E2E]'
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
                    : 'bg-[#141824] border-[#1E2430] text-slate-400 hover:text-white hover:bg-[#181E2E]'
                }`}
                title="Connect Link Tool"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              {/* Slice / Cut Path tool */}
              <button
                onClick={() => setActiveTool((prev) => (prev === 'slice' ? 'select' : 'slice'))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer text-xs font-semibold ${
                  activeTool === 'slice'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/60 ring-1 ring-rose-400'
                    : 'bg-[#141824] border-[#1E2430] text-slate-400 hover:text-rose-400 hover:bg-[#181E2E]'
                }`}
                title="Slice Path Tool — Click on any connection wire to cut it"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Slice Path</span>
              </button>

              {/* Delete / Clear button */}
              <button
                onClick={() => {
                  if (selectedDevice) {
                    if (window.confirm(`Delete ${selectedDevice.name}?`)) {
                      deleteDevice(selectedDevice.id);
                      setSelectedDevice(null);
                    }
                  }
                }}
                className="p-1.5 bg-[#141824] hover:bg-[#181E2E] border border-[#1E2430] rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete Selected Node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Fit view button */}
              <button
                onClick={handleFitView}
                className="p-1.5 bg-[#141824] hover:bg-[#181E2E] border border-[#1E2430] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Fit View"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              {/* Zoom controls: - 100% + */}
              <div className="flex items-center px-1.5 py-0.5 bg-[#141824] border border-[#1E2430] rounded-lg text-xs font-semibold text-slate-300 gap-1">
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

              {/* 2D / 3D Cyber-Physical Switch */}
              <div className="flex items-center p-0.5 bg-[#141824] border border-[#1E2430] rounded-lg">
                <button
                  onClick={() => setLabViewMode('2d')}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                    labViewMode === '2d'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D TOPOLOGY
                </button>
                <button
                  onClick={() => setLabViewMode('3d')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                    labViewMode === '3d'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-cyan-300" />
                  <span>3D PLANT</span>
                </button>
              </div>

              {/* Maximize */}
              <button
                onClick={handleFitView}
                className="p-1.5 bg-[#141824] hover:bg-[#181E2E] border border-[#1E2430] rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Expand View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* React Flow or 3D Plant Container */}
          <div className="flex-1 w-full h-full relative bg-[#090A0F]">
            {labViewMode === '3d' ? (
              <NetworkPlant3DView
                onSelectDevice={setSelectedDevice}
                onOpenDigitalTwin={setTwinDevice}
              />
            ) : (
              <>
                {/* Side Floating ADD Button when Palette is closed */}
                {!isPaletteOpen && (
                  <button
                    onClick={() => setIsPaletteOpen(true)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#10131A] hover:bg-blue-600 border border-l-0 border-[#1E2430] hover:border-blue-500 text-slate-300 hover:text-white py-3.5 px-2 rounded-r-xl shadow-xl flex flex-col items-center gap-2 cursor-pointer transition-all group backdrop-blur-md"
                    title="Open Device Palette"
                  >
                    <Plus className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                    <span className="[writing-mode:vertical-lr] text-[9.5px] font-mono font-bold tracking-widest text-slate-300 group-hover:text-white">
                      ADD DEVICE
                    </span>
                  </button>
                )}

                {activeTool === 'slice' && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/70 text-rose-200 font-mono text-[11px] flex items-center gap-2.5 shadow-2xl backdrop-blur-md">
                    <Scissors className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>SLICE MODE ACTIVE — Click on any connection wire to cut & delete it</span>
                    <button
                      onClick={() => setActiveTool('select')}
                      className="ml-2 px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-white text-[10px] cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                )}

                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodeDragStop={onNodeDragStop}
                  onNodeClick={onNodeClick}
                  onEdgeClick={onEdgeClick}
                  onPaneClick={onPaneClick}
                  onConnect={onConnect}
                  onEdgesChange={onEdgesChange}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
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
                    color="#1E2430"
                  />
                  <MiniMap
                    position="bottom-right"
                    nodeStrokeWidth={1}
                    maskColor="rgba(9, 10, 15, 0.75)"
                    nodeColor={(node: any) => {
                      switch (node.data?.device?.device_type) {
                        case 'PLC': return '#3b82f6';
                        case 'SCADA Server': return '#3b82f6';
                        case 'Industrial Gateway': return '#3b82f6';
                        case 'Untrusted Device': return '#f43f5e';
                        default: return '#475569';
                      }
                    }}
                    className="!bg-[#10131A] !border !border-[#1E2430] !rounded-xl overflow-hidden !m-4 shadow-lg"
                    style={{ width: 130, height: 80 }}
                  />
                  <Controls
                    showInteractive={false}
                    position="bottom-right"
                    className="!bg-[#10131A] !border !border-[#1E2430] !rounded-lg !mr-4 !mb-26 shadow-lg"
                  />
                </ReactFlow>
              </>
            )}
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

      {/* Device 3D Digital Twin Modal */}
      {twinDevice && (
        <Device3DModal
          device={twinDevice}
          onClose={() => setTwinDevice(null)}
        />
      )}
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
