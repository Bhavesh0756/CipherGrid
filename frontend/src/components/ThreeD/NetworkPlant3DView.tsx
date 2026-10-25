import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  Camera,
  Compass,
  Eye,
  Layers,
  Lock,
  Maximize2,
  MousePointer,
  Network,
  Radio,
  RotateCcw,
  RotateCw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Device, PurdueLevel } from '../../types';

interface NetworkPlant3DViewProps {
  onSelectDevice?: (device: Device) => void;
  onOpenDigitalTwin?: (device: Device) => void;
}

// Canvas helper to draw rounded rectangle for high-res billboard labels
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Creates crisp 3D Billboard Sprite with Device Name, Purdue Level, and Status Dot
function createDeviceLabelSprite(device: Device, isSelected: boolean, isActiveHop: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 136;
  const ctx = canvas.getContext('2d')!;

  // Background Glassmorphism Badge
  const isUntrusted = device.trust_status === 'Untrusted';
  const borderColor = isActiveHop
    ? '#fbbf24'
    : isSelected
    ? '#a855f7'
    : isUntrusted
    ? '#f43f5e'
    : '#38bdf8';

  const bgColor = isActiveHop
    ? 'rgba(30, 24, 10, 0.92)'
    : isSelected
    ? 'rgba(26, 12, 45, 0.92)'
    : 'rgba(9, 15, 30, 0.90)';

  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = isSelected || isActiveHop ? 5 : 3.5;

  drawRoundedRect(ctx, 8, 8, 496, 120, 24);
  ctx.fill();
  ctx.stroke();

  // Status Indicator Dot
  ctx.fillStyle = isUntrusted ? '#f43f5e' : isActiveHop ? '#fbbf24' : '#10b981';
  ctx.beginPath();
  ctx.arc(36, 68, 12, 0, Math.PI * 2);
  ctx.fill();

  // Device Name (Main Headline)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "JetBrains Mono", monospace, sans-serif';
  const displayName = device.name.length > 20 ? device.name.slice(0, 19) + '…' : device.name;
  ctx.fillText(displayName, 62, 58);

  // Purdue Level & IP Address (Subtitle)
  ctx.fillStyle = isActiveHop ? '#fef08a' : isSelected ? '#e9d5ff' : '#94a3b8';
  ctx.font = '22px "JetBrains Mono", monospace, sans-serif';
  ctx.fillText(`${device.purdue_level || 'Level 1'} · ${device.ip_address}`, 62, 98);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(3.4, 0.9, 1);
  sprite.renderOrder = 999; // Always render clearly above 3D models
  return sprite;
}

// Helper to create high-visibility 3D directional arrow with glowing head and stem
function create3DArrow(color: number, scale = 1.0): THREE.Group {
  const group = new THREE.Group();

  // 1. Arrowhead Cone (Tip points forward along +Z)
  const headGeo = new THREE.ConeGeometry(0.38 * scale, 0.75 * scale, 16);
  headGeo.rotateX(Math.PI / 2);
  const headMat = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    transparent: true,
    opacity: 0.98,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0, 0.38 * scale);
  head.renderOrder = 950;
  group.add(head);

  // 2. Arrow Shaft / Stem (Cylinder extends backwards along -Z)
  const shaftGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.55 * scale, 12);
  shaftGeo.rotateX(Math.PI / 2);
  const shaftMat = new THREE.MeshBasicMaterial({
    color,
    depthTest: false,
    transparent: true,
    opacity: 0.98,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.set(0, 0, -0.22 * scale);
  shaft.renderOrder = 950;
  group.add(shaft);

  return group;
}

export const NetworkPlant3DView: React.FC<NetworkPlant3DViewProps> = ({
  onSelectDevice,
  onOpenDigitalTwin,
}) => {
  const {
    devices,
    connections,
    selectedDevice,
    setSelectedDevice,
    highlightedPath,
    activeHopId,
    playbackState,
    simulationEvents,
    selectedEvent,
    lastResult,
    playSimulation,
  } = useSimulatorStore();

  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredDev, setHoveredDev] = useState<Device | null>(null);

  // Cinematic Camera State
  const [cameraMode, setCameraMode] = useState<'tactical' | 'topdown' | 'runway'>('tactical');
  const [isChaseCam, setIsChaseCam] = useState<boolean>(false);
  const [isAutoDrone, setIsAutoDrone] = useState<boolean>(false);

  // Preserve user's camera view across path updates
  const lastCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 24, 30));
  const lastControlsTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const activeHopIdRef = useRef<string | null>(activeHopId);
  activeHopIdRef.current = activeHopId;
  const playbackStateRef = useRef<string>(playbackState);
  playbackStateRef.current = playbackState;
  const lastPlaybackStateRef = useRef<string>(playbackState);

  // Cinematic Camera Target & Animation Refs
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 24, 30));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioningRef = useRef<boolean>(false);
  const transitionSpeedRef = useRef<number>(0.025);
  const chaseArrivalHoldRef = useRef<number>(0);
  const droneAngleRef = useRef<number>(0);
  const isChaseCamRef = useRef<boolean>(isChaseCam);
  isChaseCamRef.current = isChaseCam;
  const isAutoDroneRef = useRef<boolean>(isAutoDrone);
  isAutoDroneRef.current = isAutoDrone;

  const applyCameraPreset = (mode: 'tactical' | 'topdown' | 'runway') => {
    setCameraMode(mode);
    setIsAutoDrone(false);
    isAutoDroneRef.current = false;
    setIsChaseCam(false);
    isChaseCamRef.current = false;
    transitionSpeedRef.current = 0.045;
    isTransitioningRef.current = true;

    if (mode === 'tactical') {
      targetCamPosRef.current.set(0, 24, 30);
      targetLookAtRef.current.set(0, 0, 0);
    } else if (mode === 'topdown') {
      targetCamPosRef.current.set(0, 38, 0.05);
      targetLookAtRef.current.set(0, 0, 0);
    } else if (mode === 'runway') {
      targetCamPosRef.current.set(0, 4.5, 22);
      targetLookAtRef.current.set(0, 1.5, 0);
    }
  };

  const toggleChaseCam = () => {
    setIsChaseCam((prev) => {
      const next = !prev;
      isChaseCamRef.current = next;
      if (next) {
        setIsAutoDrone(false);
        isAutoDroneRef.current = false;
        isTransitioningRef.current = false;
        if (highlightedPath.length > 1) {
          playSimulation();
        }
      }
      return next;
    });
  };

  const toggleAutoDrone = () => {
    setIsAutoDrone((prev) => {
      const next = !prev;
      isAutoDroneRef.current = next;
      if (next) {
        setIsChaseCam(false);
        isChaseCamRef.current = false;
        isTransitioningRef.current = false;
      }
      return next;
    });
  };

  const resetCamera = () => {
    applyCameraPreset('tactical');
  };

  // Comprehensive attack/tamper/unauthorized detection
  const isPacketTampered = (() => {
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

    const pathHasUntrusted = highlightedPath.some((devId) => {
      const dev = devices.find((d) => d.id === devId || d.name === devId);
      return dev?.trust_status === 'Untrusted' || dev?.device_type === 'Untrusted Device';
    });
    if (pathHasUntrusted) return true;

    return false;
  })();

  const isSimulating = playbackState === 'playing' || playbackState === 'paused' || highlightedPath.length > 0;

  useEffect(() => {
    if (!mountRef.current || devices.length === 0) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.copy(lastCameraPos.current);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Stay above ground plane
    controls.target.copy(lastControlsTarget.current);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    dirLight.position.set(16, 32, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 1.4);
    blueFill.position.set(-18, 14, -14);
    scene.add(blueFill);

    // 5. Industrial Floor Grid
    const floorGrid = new THREE.GridHelper(44, 44, 0x38bdf8, 0x1e293b);
    floorGrid.position.y = -0.01;
    scene.add(floorGrid);

    // ─── 6. EXACT 2D-TO-3D COORDINATE MAPPING (Requirement 3) ───
    // Calculate bounding box of 2D canvas coordinates so 3D layout matches 2D 1:1
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    devices.forEach((d) => {
      const x = d.position_x ?? 100;
      const y = d.position_y ?? 100;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    if (!isFinite(minX) || maxX === minX) {
      minX = 0;
      maxX = 900;
    }
    if (!isFinite(minY) || maxY === minY) {
      minY = 0;
      maxY = 550;
    }

    const spanX = Math.max(maxX - minX, 400);
    const spanY = Math.max(maxY - minY, 300);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Map 2D dimensions to 3D plant floor bounds [-15, 15] in X, [-11, 11] in Z
    const targetWidth3D = 30;
    const targetDepth3D = 22;
    const scale = Math.min(targetWidth3D / spanX, targetDepth3D / spanY);

    const devicePosMap = new Map<string, THREE.Vector3>();
    const deviceMeshes: { mesh: THREE.Mesh; device: Device }[] = [];
    const rotatingBlades: THREE.Object3D[] = [];
    const rotatingFans: THREE.Object3D[] = [];

    // Purdue level colors for pedestal rings
    const purdueColors: Record<PurdueLevel, number> = {
      'Level 0': 0xf59e0b, // Amber
      'Level 1': 0x38bdf8, // Cyan/Blue
      'Level 2': 0xa855f7, // Purple
      'Level 3': 0x10b981, // Emerald
      'Level 3.5': 0x06b6d4, // Sky Cyan
      'Untrusted': 0xf43f5e, // Crimson Red
    };

    // ─── 7. SPAWN 3D INDUSTRIAL HARDWARE MODELS & FLOATING LABELS ───
    devices.forEach((d) => {
      const x2d = d.position_x ?? centerX;
      const y2d = d.position_y ?? centerY;

      // 2D X maps to 3D X; 2D Y maps to 3D Z (ground plane)
      const x3d = (x2d - centerX) * scale;
      const z3d = (y2d - centerY) * scale;
      const pos = new THREE.Vector3(x3d, 0, z3d);
      devicePosMap.set(d.id, pos);

      const isSelected = selectedDevice?.id === d.id;
      const isActiveHop = activeHopId === d.id;
      const isRouteNode = highlightedPath.includes(d.id);
      const isUntrusted = d.trust_status === 'Untrusted';

      // Pedestal Base
      const pedColor = isUntrusted
        ? 0xf43f5e
        : isActiveHop
        ? 0xfbbf24
        : isSelected
        ? 0xa855f7
        : purdueColors[d.purdue_level] || 0x38bdf8;

      const pedGeo = new THREE.CylinderGeometry(1.3, 1.45, 0.28, 32);
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x0b1329,
        roughness: 0.3,
        metalness: 0.85,
      });
      const pedMesh = new THREE.Mesh(pedGeo, pedMat);
      pedMesh.position.set(pos.x, 0.14, pos.z);
      pedMesh.receiveShadow = true;
      scene.add(pedMesh);

      // Neon Ring on Pedestal
      const ringGeo = new THREE.RingGeometry(1.28, 1.4, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pedColor,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.29, pos.z);
      scene.add(ring);

      // Active Hop Processing Pulse Beacon
      if (isActiveHop) {
        const beaconGeo = new THREE.RingGeometry(1.45, 1.6, 32);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.rotation.x = -Math.PI / 2;
        beaconMesh.position.set(pos.x, 0.3, pos.z);
        scene.add(beaconMesh);
      }

      // ─── 3D Procedural Hardware Mesh by Device Type ───
      const devNameLower = d.name.toLowerCase();
      const isTurbine =
        devNameLower.includes('turbine') ||
        devNameLower.includes('rotor') ||
        devNameLower.includes('generator');
      const isServer =
        d.device_type === 'SCADA Server' ||
        d.device_type === 'Monitoring Server' ||
        devNameLower.includes('scada');
      const isValve =
        devNameLower.includes('valve') ||
        devNameLower.includes('actuator') ||
        devNameLower.includes('rtu');

      let unitGroup = new THREE.Group();

      if (isTurbine) {
        // Metallic Turbine Rotor Housing
        const casingGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.8, 24);
        casingGeo.rotateZ(Math.PI / 2);
        const casingMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.9,
          roughness: 0.2,
        });
        const casingMesh = new THREE.Mesh(casingGeo, casingMat);
        unitGroup.add(casingMesh);

        // Multi-blade Rotor Impeller (Spins)
        const rotorGroup = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.08, 0.5, 0.12);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.3 });
        for (let b = 0; b < 6; b++) {
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.rotation.x = (b * Math.PI) / 3;
          rotorGroup.add(blade);
        }
        rotorGroup.position.set(0.92, 0, 0);
        unitGroup.add(rotorGroup);
        rotatingBlades.push(rotorGroup);

        // Flange Rings
        const flgGeo = new THREE.TorusGeometry(0.68, 0.08, 12, 24);
        const flgMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
        const flg1 = new THREE.Mesh(flgGeo, flgMat);
        flg1.rotation.y = Math.PI / 2;
        flg1.position.set(-0.7, 0, 0);
        unitGroup.add(flg1);
      } else if (isServer) {
        // 4U Brushed Metallic Server Chassis
        const srvGeo = new THREE.BoxGeometry(1.8, 0.9, 1.4);
        const srvMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.85,
          roughness: 0.35,
        });
        const srvMesh = new THREE.Mesh(srvGeo, srvMat);
        unitGroup.add(srvMesh);

        // Dual Front Intake Fans
        const fanGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16);
        fanGeo.rotateX(Math.PI / 2);
        const fanMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.6, roughness: 0.3 });

        [-0.5, 0.5].forEach((offset) => {
          const fan = new THREE.Mesh(fanGeo, fanMat);
          fan.position.set(offset, 0.05, 0.72);
          unitGroup.add(fan);
          rotatingFans.push(fan);
        });
      } else if (isValve) {
        // High-Pressure Pipe & Valve Actuator
        const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.6, 20);
        pipeGeo.rotateZ(Math.PI / 2);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
        const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        unitGroup.add(pipeMesh);

        // Motor Gearbox on Top
        const gearGeo = new THREE.BoxGeometry(0.65, 0.7, 0.65);
        const gearMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
        const gearMesh = new THREE.Mesh(gearGeo, gearMat);
        gearMesh.position.set(0, 0.55, 0);
        unitGroup.add(gearMesh);

        // Manual Override Handwheel
        const wheelGeo = new THREE.TorusGeometry(0.32, 0.05, 12, 24);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0, 0.95, 0);
        unitGroup.add(wheel);
      } else {
        // Modular PLC / Industrial Controller with Terminal Blocks
        const plcGeo = new THREE.BoxGeometry(1.3, 1.2, 0.9);
        const plcMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          metalness: 0.6,
          roughness: 0.45,
        });
        const plcMesh = new THREE.Mesh(plcGeo, plcMat);
        unitGroup.add(plcMesh);

        // Green Terminal Blocks
        const termGeo = new THREE.BoxGeometry(1.15, 0.18, 0.25);
        const termMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
        const termTop = new THREE.Mesh(termGeo, termMat);
        termTop.position.set(0, 0.52, 0.38);
        unitGroup.add(termTop);
        const termBtm = new THREE.Mesh(termGeo, termMat);
        termBtm.position.set(0, -0.52, 0.38);
        unitGroup.add(termBtm);
      }

      // Diagnostic LED Beacon on top
      const ledColor = isUntrusted ? 0xf43f5e : isActiveHop ? 0xfbbf24 : 0x10b981;
      const ledGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0.85, 0);
      unitGroup.add(led);

      unitGroup.position.set(pos.x, 0.85, pos.z);
      unitGroup.castShadow = true;
      scene.add(unitGroup);

      // Hitbox mesh for clicking/hovering
      const hitBoxGeo = new THREE.BoxGeometry(2.0, 2.0, 2.0);
      const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
      hitBox.position.set(pos.x, 1.0, pos.z);
      hitBox.userData = { device: d };
      scene.add(hitBox);
      deviceMeshes.push({ mesh: hitBox, device: d });

      // ─── REQUIREMENT 2: 3D FLOATING DEVICE NAME LABEL ───
      const labelSprite = createDeviceLabelSprite(d, isSelected, isActiveHop);
      labelSprite.position.set(pos.x, 2.5, pos.z);
      scene.add(labelSprite);
    });

    // Helper to get device 3D position safely across IDs, names, and slug formats
    const getPos = (idOrName: string): THREE.Vector3 | undefined => {
      if (!idOrName) return undefined;
      if (devicePosMap.has(idOrName)) return devicePosMap.get(idOrName);
      const norm = idOrName.toLowerCase().replace(/[\s_-]+/g, '');
      for (const [key, pos] of devicePosMap.entries()) {
        if (key.toLowerCase().replace(/[\s_-]+/g, '') === norm) return pos;
      }
      const matched = devices.find((d) => {
        const dNormId = d.id.toLowerCase().replace(/[\s_-]+/g, '');
        const dNormName = d.name.toLowerCase().replace(/[\s_-]+/g, '');
        return dNormId === norm || dNormName === norm;
      });
      return matched ? devicePosMap.get(matched.id) : undefined;
    };

    // ─── 8. STRAIGHT 3D CONDUIT PIPES LINKING DEVICES ───
    // All lines connecting devices are completely STRAIGHT lines (no arches or curves)
    const conduitY = 0.50;

    connections.forEach((conn) => {
      const srcPos = getPos(conn.source_id);
      const dstPos = getPos(conn.target_id);
      if (!srcPos || !dstPos) return;

      // Check if this conduit is on the active packet transmission route
      let isConduitOnRoute = false;
      if (highlightedPath.length > 1) {
        for (let i = 0; i < highlightedPath.length - 1; i++) {
          if (
            (highlightedPath[i] === conn.source_id && highlightedPath[i + 1] === conn.target_id) ||
            (highlightedPath[i] === conn.target_id && highlightedPath[i + 1] === conn.source_id)
          ) {
            isConduitOnRoute = true;
            break;
          }
        }
      }

      // Straight connection between devices
      const start = new THREE.Vector3(srcPos.x, conduitY, srcPos.z);
      const end = new THREE.Vector3(dstPos.x, conduitY, dstPos.z);

      const straightLine = new THREE.LineCurve3(start, end);
      const tubeRadius = isConduitOnRoute ? 0.085 : 0.038;
      const tubeGeo = new THREE.TubeGeometry(straightLine, 1, tubeRadius, 8, false);

      const tubeColor = isConduitOnRoute
        ? isPacketTampered
          ? 0xf43f5e
          : 0xa855f7
        : 0x0284c7;

      const tubeMat = new THREE.MeshStandardMaterial({
        color: tubeColor,
        roughness: 0.25,
        metalness: 0.85,
        emissive: isConduitOnRoute ? (isPacketTampered ? 0x9f1239 : 0x6b21a8) : 0x032840,
        emissiveIntensity: isConduitOnRoute ? 0.95 : 0.25,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);

      // Industrial metallic collars at both ends of the straight conduit
      [start, end].forEach((pt) => {
        const collarGeo = new THREE.CylinderGeometry(tubeRadius * 1.5, tubeRadius * 1.5, 0.12, 16);
        collarGeo.rotateX(Math.PI / 2);
        const collarMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.9,
          roughness: 0.2,
        });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.copy(pt);
        collar.lookAt(pt === start ? end : start);
        scene.add(collar);
      });

      // If conduit is on active route, add an inner glowing laser beam core
      if (isConduitOnRoute) {
        const laserMat = new THREE.LineBasicMaterial({
          color: isPacketTampered ? 0xff4d4d : 0x38bdf8,
          linewidth: 2,
        });
        const laserGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
        const laserLine = new THREE.Line(laserGeo, laserMat);
        scene.add(laserLine);
      }
    });

    // ─── 9. REAL-TIME 3D PACKET TRANSFER ANIMATION ALONG STRAIGHT ROUTE ───
    // Build straight multi-segment route curve path (Hop-by-hop straight conduits)
    const routeCurvePath = new THREE.CurvePath<THREE.Vector3>();
    const routeWaypoints: THREE.Vector3[] = [];

    if (highlightedPath.length > 1) {
      for (let i = 0; i < highlightedPath.length; i++) {
        const p = getPos(highlightedPath[i]);
        if (p) {
          routeWaypoints.push(new THREE.Vector3(p.x, conduitY, p.z));
        }
      }

      for (let i = 0; i < routeWaypoints.length - 1; i++) {
        const straightHop = new THREE.LineCurve3(routeWaypoints[i], routeWaypoints[i + 1]);
        routeCurvePath.add(straightHop);
      }
    }

    let activePacketMesh: THREE.Group | null = null;
    let activePacketProgress = 0.0;
    const packetSpeed = 0.42;
    const photonStream: THREE.Mesh[] = [];

    if (routeCurvePath.curves.length > 0) {
      // 1. Lead Master Packet
      activePacketMesh = new THREE.Group();
      const coreColor = isPacketTampered ? 0xf43f5e : 0x38bdf8;
      const auraColor = isPacketTampered ? 0xfb7185 : 0xa855f7;

      // Glowing Core Sphere
      const pCoreGeo = new THREE.SphereGeometry(0.24, 20, 20);
      const pCoreMat = new THREE.MeshBasicMaterial({ color: coreColor });
      const pCore = new THREE.Mesh(pCoreGeo, pCoreMat);
      activePacketMesh.add(pCore);

      // Rotating Aura Torus Ring
      const pAuraGeo = new THREE.TorusGeometry(0.40, 0.05, 12, 24);
      const pAuraMat = new THREE.MeshBasicMaterial({ color: auraColor });
      const pAura = new THREE.Mesh(pAuraGeo, pAuraMat);
      activePacketMesh.add(pAura);

      // Real-time Point Light casting illumination onto ground and devices
      const pLight = new THREE.PointLight(coreColor, 4.0, 7.5);
      activePacketMesh.add(pLight);

      activePacketMesh.position.copy(routeWaypoints[0]);
      scene.add(activePacketMesh);

      // 2. Trailing Photon Stream (5 data packets streaming along the straight route)
      const photonGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const photonMat = new THREE.MeshBasicMaterial({
        color: auraColor,
        transparent: true,
        opacity: 0.85,
      });

      for (let i = 0; i < 5; i++) {
        const photon = new THREE.Mesh(photonGeo, photonMat);
        photon.position.copy(routeWaypoints[0]);
        scene.add(photon);
        photonStream.push(photon);
      }
    }

    // ─── 9.1 PROMINENT DIRECTIONAL 3D ARROWS ALONG TRANSMISSION ROUTE (MATCHING 2D) ───
    const routeArrows: {
      group: THREE.Group;
      start: THREE.Vector3;
      end: THREE.Vector3;
      progress: number;
    }[] = [];
    const terminalArrows: THREE.Group[] = [];

    const arrowColor = isPacketTampered ? 0xf43f5e : 0x00e5ff;

    if (highlightedPath.length > 1) {
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        const fromId = highlightedPath[i];
        const toId = highlightedPath[i + 1];
        const p1 = getPos(fromId);
        const p2 = getPos(toId);
        if (p1 && p2) {
          const startHop = new THREE.Vector3(p1.x, conduitY, p1.z);
          const endHop = new THREE.Vector3(p2.x, conduitY, p2.z);

          // 1. Static Terminal Arrowhead at destination port (pointing directly into device, like 2D markerEnd: ArrowClosed)
          const termArrow = create3DArrow(arrowColor, 1.25);
          termArrow.position.lerpVectors(startHop, endHop, 0.88);
          termArrow.position.y += 0.32;
          termArrow.lookAt(endHop.x, conduitY + 0.32, endHop.z);
          scene.add(termArrow);
          terminalArrows.push(termArrow);

          // 2. Streaming Directional Flow Arrows advancing along the straight conduit
          // 4 arrows per hop for a continuous, prominent marching stream: >>> >>>>
          for (let a = 0; a < 4; a++) {
            const flowArrow = create3DArrow(arrowColor, 0.95);
            flowArrow.position.copy(startHop);
            flowArrow.position.y += 0.32;
            flowArrow.lookAt(endHop.x, conduitY + 0.32, endHop.z);
            scene.add(flowArrow);
            routeArrows.push({
              group: flowArrow,
              start: startHop,
              end: endHop,
              progress: a * 0.25,
            });
          }
        }
      }
    }

    // Ambient background pulses along other straight conduits
    const ambientPulses: {
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      end: THREE.Vector3;
      progress: number;
      speed: number;
    }[] = [];

    const ambientGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const ambientMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });

    connections.slice(0, 12).forEach((conn, idx) => {
      const srcPos = getPos(conn.source_id);
      const dstPos = getPos(conn.target_id);
      if (!srcPos || !dstPos) return;

      const start = new THREE.Vector3(srcPos.x, conduitY, srcPos.z);
      const end = new THREE.Vector3(dstPos.x, conduitY, dstPos.z);

      const pMesh = new THREE.Mesh(ambientGeo, ambientMat);
      pMesh.position.copy(start);
      scene.add(pMesh);
      ambientPulses.push({
        mesh: pMesh,
        start,
        end,
        progress: (idx * 0.18) % 1.0,
        speed: 0.3 + (idx % 3) * 0.1,
      });
    });

    // ─── 10. INTERACTION RAYCASTING (Click & Hover) ───
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceMeshes.map((m) => m.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.device as Device;
        setHoveredDev(hit);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredDev(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deviceMeshes.map((m) => m.mesh));

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.device as Device;
        setSelectedDevice(hit);
        if (onSelectDevice) onSelectDevice(hit);
        if (onOpenDigitalTwin) onOpenDigitalTwin(hit);

        // Smooth cinematic focus zoom onto the selected device
        const p = getPos(hit.id);
        if (p) {
          setIsAutoDrone(false);
          isAutoDroneRef.current = false;
          setIsChaseCam(false);
          isChaseCamRef.current = false;
          targetLookAtRef.current.set(p.x, 1.2, p.z);
          targetCamPosRef.current.set(p.x + 5.5, 5.5, p.z + 7.5);
          transitionSpeedRef.current = 0.045;
          isTransitioningRef.current = true;
        }
      }
    };

    controls.addEventListener('start', () => {
      isTransitioningRef.current = false;
      setIsAutoDrone(false);
      isAutoDroneRef.current = false;
    });

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // ─── 11. ANIMATION RENDER LOOP ───
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      const delta = clock.getDelta();

      // Spin mechanical turbine blades & server fans
      rotatingBlades.forEach((b) => (b.rotation.x += delta * 6.5));
      rotatingFans.forEach((f) => (f.rotation.z += delta * 8.0));

      const currentPlayback = playbackStateRef.current;
      const isTransferPlaying = currentPlayback === 'playing';
      const isTransferPaused = currentPlayback === 'paused';
      const isTransferFinished = currentPlayback === 'finished' || currentPlayback === 'idle';

      // ─── CINEMATIC CAMERA SYSTEM INTERPOLATION ───
      if (isChaseCamRef.current && isTransferPlaying && activePacketMesh && activePacketMesh.visible) {
        // Chase Cam: smooth follow behind the travelling packet
        const pPos = activePacketMesh.position;
        controls.target.lerp(new THREE.Vector3(pPos.x, pPos.y + 0.3, pPos.z), 0.08);
        const chasePos = new THREE.Vector3(pPos.x, pPos.y + 4.8, pPos.z + 8.2);
        camera.position.lerp(chasePos, 0.055);
      } else if (isAutoDroneRef.current) {
        // Drone Tour: smooth 360-degree orbital fly-around
        droneAngleRef.current += delta * 0.20;
        const orbitRadius = 32;
        const targetX = Math.sin(droneAngleRef.current) * orbitRadius;
        const targetZ = Math.cos(droneAngleRef.current) * orbitRadius;
        const targetY = 20 + Math.sin(droneAngleRef.current * 0.7) * 3.5;
        camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.06);
        controls.target.lerp(new THREE.Vector3(0, 1.0, 0), 0.05);
      } else if (isTransitioningRef.current) {
        // Slow, graceful, cinematic ease-out ascent back to tactical overview
        const tSpeed = transitionSpeedRef.current || 0.022;
        camera.position.lerp(targetCamPosRef.current, tSpeed);
        controls.target.lerp(targetLookAtRef.current, tSpeed + 0.005);
        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.25 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.25
        ) {
          isTransitioningRef.current = false;
        }
      }

      // Reset progress when replaying or starting a new dispatch
      if (lastPlaybackStateRef.current !== 'playing' && isTransferPlaying) {
        activePacketProgress = 0.0;
        chaseArrivalHoldRef.current = 0.0;
        if (isChaseCamRef.current) {
          isTransitioningRef.current = false;
        }
        routeArrows.forEach((arr, idx) => {
          arr.progress = (idx % 4) * 0.25;
        });
      }
      lastPlaybackStateRef.current = currentPlayback;

      // 1. Packet transfer along straight route
      if (routeCurvePath.curves.length > 0 && activePacketMesh) {
        if (isTransferFinished) {
          activePacketMesh.visible = false;
          photonStream.forEach((photon) => (photon.visible = false));
        } else {
          activePacketMesh.visible = true;
          photonStream.forEach((photon) => (photon.visible = true));

          if (isTransferPlaying) {
            if (activePacketProgress < 1.0) {
              activePacketProgress += delta * packetSpeed;
              if (activePacketProgress >= 1.0) {
                activePacketProgress = 1.0;
                chaseArrivalHoldRef.current = 0.0;
              }
            } else if (isChaseCamRef.current) {
              // Packet reached destination: hold camera at destination for 0.8s dramatic arrival pause
              chaseArrivalHoldRef.current += delta;
              if (chaseArrivalHoldRef.current >= 0.8) {
                // Smoothly glide up to overview without deselecting Chase Cam (persists until manually deselected)
                targetCamPosRef.current.set(0, 24, 30);
                targetLookAtRef.current.set(0, 0, 0);
                transitionSpeedRef.current = 0.022; // Slow, majestic glide up
                isTransitioningRef.current = true;
                chaseArrivalHoldRef.current = 0.0;
              }
            }
          }

          // Exact point on the straight multi-segment route
          const pointOnRoute = routeCurvePath.getPointAt(Math.min(activePacketProgress, 0.999));
          activePacketMesh.position.copy(pointOnRoute);
          activePacketMesh.rotation.y += delta * 4.5;
          activePacketMesh.rotation.z += delta * 3.0;

          // Position trailing photons in a stream behind the main packet
          photonStream.forEach((photon, idx) => {
            const trailOffset = (idx + 1) * 0.045;
            const rawProgress = activePacketProgress - trailOffset;
            if (rawProgress < 0 || activePacketProgress >= 1.0) {
              photon.visible = false;
            } else {
              photon.visible = true;
              const photonPoint = routeCurvePath.getPointAt(Math.min(rawProgress, 0.999));
              photon.position.copy(photonPoint);
            }
          });
        }
      }

      // 2. 3D directional flow arrows moving towards target in direction of transfer
      if (isTransferFinished) {
        // Stop and hide directional flow arrows when transfer completes
        routeArrows.forEach((arr) => {
          arr.group.visible = false;
        });
        terminalArrows.forEach((arr) => {
          arr.visible = false;
        });
      } else {
        // When transfer is playing or paused
        terminalArrows.forEach((arr) => {
          arr.visible = true;
        });

        routeArrows.forEach((arr) => {
          arr.group.visible = true;
          if (isTransferPlaying) {
            arr.progress += delta * 0.45;
            if (arr.progress >= 0.86) {
              arr.progress = 0.08;
            }
          }
          arr.group.position.lerpVectors(arr.start, arr.end, arr.progress);
          arr.group.position.y += 0.32;
          arr.group.lookAt(arr.end.x, arr.start.y + 0.32, arr.end.z);
        });
      }

      // 3. Animate background ambient particles along straight conduits
      ambientPulses.forEach((p) => {
        p.progress += delta * p.speed;
        if (p.progress >= 1.0) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
      });

      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      lastCameraPos.current.copy(camera.position);
      lastControlsTarget.current.copy(controls.target);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [devices, connections, highlightedPath, isPacketTampered]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060913] select-none overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />



      {/* Cinematic Camera Toolbar Overlay */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#090f1e]/90 border border-slate-700/60 backdrop-blur-xl shadow-2xl">
        <span className="text-[10px] font-mono text-slate-400 font-semibold px-2 uppercase tracking-wider flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Camera
        </span>

        <button
          onClick={() => applyCameraPreset('tactical')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            cameraMode === 'tactical' && !isAutoDrone && !isChaseCam
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Tactical 45° Isometric Overview"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tactical 45°</span>
        </button>

        <button
          onClick={() => applyCameraPreset('topdown')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            cameraMode === 'topdown' && !isAutoDrone && !isChaseCam
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Top-Down Bird's Eye Architectural Map"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Top-Down</span>
        </button>

        <button
          onClick={() => applyCameraPreset('runway')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            cameraMode === 'runway' && !isAutoDrone && !isChaseCam
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Floor Level Runway Perspective"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Runway</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={toggleChaseCam}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            isChaseCam
              ? 'bg-purple-500/25 text-purple-300 border border-purple-500/60 shadow-[0_0_14px_rgba(168,85,247,0.35)]'
              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/40'
          }`}
          title="Follow Packet POV during Transmission"
        >
          <Video className={`w-3.5 h-3.5 ${isChaseCam ? 'text-purple-400 animate-pulse' : ''}`} />
          <span>Chase Cam</span>
        </button>

        <button
          onClick={toggleAutoDrone}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            isAutoDrone
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40'
          }`}
          title="360° Drone Showcase Tour"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoDrone ? 'text-emerald-400 animate-spin' : ''}`} />
          <span>Drone Tour</span>
        </button>

        <button
          onClick={resetCamera}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer ml-1"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredDev && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#090f1c]/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-cyan-500/60 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex items-center gap-3 z-20">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white font-display flex items-center gap-2">
              <span>{hoveredDev.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {hoveredDev.purdue_level}
              </span>
              <span
                className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  hoveredDev.trust_status === 'Untrusted'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {hoveredDev.trust_status.toUpperCase()}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-slate-400 mt-1">
              IP: {hoveredDev.ip_address} &bull; Type: {hoveredDev.device_type} &bull; Click to Inspect 3D Model
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
