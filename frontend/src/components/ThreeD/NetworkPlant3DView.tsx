import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  Compass,
  Eye,
  Layers,
  Lock,
  Maximize2,
  MousePointer,
  Network,
  Radio,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  Sparkles,
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
  } = useSimulatorStore();

  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredDev, setHoveredDev] = useState<Device | null>(null);

  // Security status for packet trail styling
  const secStatus = (selectedEvent?.security_status || lastResult?.status || '').toLowerCase();
  const isPacketTampered =
    selectedEvent?.packet_state === 'Rejected' ||
    selectedEvent?.packet_state === 'Failed' ||
    secStatus.includes('mismatch') ||
    secStatus.includes('tamper') ||
    secStatus.includes('invalid') ||
    secStatus.includes('violation') ||
    secStatus.includes('attack') ||
    secStatus.includes('denied');

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
    camera.position.set(0, 24, 30);

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
    controls.target.set(0, 0, 0);

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

    // ─── 8. 3D CONDUIT PIPES LINKING DEVICES ───
    connections.forEach((conn) => {
      const srcPos = devicePosMap.get(conn.source_id);
      const dstPos = devicePosMap.get(conn.target_id);
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

      const points = [
        new THREE.Vector3(srcPos.x, 0.45, srcPos.z),
        new THREE.Vector3((srcPos.x + dstPos.x) / 2, 0.85, (srcPos.z + dstPos.z) / 2),
        new THREE.Vector3(dstPos.x, 0.45, dstPos.z),
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeRadius = isConduitOnRoute ? 0.08 : 0.035;
      const tubeGeo = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);

      const tubeColor = isConduitOnRoute
        ? isPacketTampered
          ? 0xf43f5e
          : 0xa855f7
        : 0x06b6d4;

      const tubeMat = new THREE.MeshBasicMaterial({
        color: tubeColor,
        transparent: true,
        opacity: isConduitOnRoute ? 0.95 : 0.65,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
    });

    // ─── 9. REAL-TIME 3D PACKET TRANSMISSION ANIMATION (Requirement 1) ───
    // Build active transmission route spline curve from highlightedPath
    let activeRouteCurve: THREE.CatmullRomCurve3 | null = null;
    let activePacketMesh: THREE.Group | null = null;
    let activePacketProgress = 0.0;
    const packetSpeed = 0.55;

    if (highlightedPath.length > 1) {
      const routePoints: THREE.Vector3[] = [];
      highlightedPath.forEach((id) => {
        const p = devicePosMap.get(id);
        if (p) routePoints.push(new THREE.Vector3(p.x, 0.95, p.z));
      });

      if (routePoints.length > 1) {
        activeRouteCurve = new THREE.CatmullRomCurve3(routePoints);

        // Active Packet Particle Group with dynamic point light
        activePacketMesh = new THREE.Group();

        // Glowing core sphere
        const coreColor = isPacketTampered ? 0xf43f5e : 0x38bdf8;
        const pCoreGeo = new THREE.SphereGeometry(0.24, 20, 20);
        const pCoreMat = new THREE.MeshBasicMaterial({ color: coreColor });
        const pCore = new THREE.Mesh(pCoreGeo, pCoreMat);
        activePacketMesh.add(pCore);

        // Outer Aura Ring
        const pAuraGeo = new THREE.TorusGeometry(0.36, 0.06, 12, 24);
        const pAuraMat = new THREE.MeshBasicMaterial({ color: isPacketTampered ? 0xfb7185 : 0xa855f7 });
        const pAura = new THREE.Mesh(pAuraGeo, pAuraMat);
        activePacketMesh.add(pAura);

        // Packet Light casting real illumination along path
        const pLight = new THREE.PointLight(coreColor, 3.5, 6.0);
        activePacketMesh.add(pLight);

        activePacketMesh.position.copy(routePoints[0]);
        scene.add(activePacketMesh);
      }
    }

    // Ambient background packet pulses along other conduits
    const ambientPulses: {
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      end: THREE.Vector3;
      progress: number;
      speed: number;
    }[] = [];

    const ambientGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const ambientMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    connections.slice(0, 10).forEach((conn, idx) => {
      const srcPos = devicePosMap.get(conn.source_id);
      const dstPos = devicePosMap.get(conn.target_id);
      if (!srcPos || !dstPos) return;

      const pMesh = new THREE.Mesh(ambientGeo, ambientMat);
      pMesh.position.copy(srcPos);
      scene.add(pMesh);
      ambientPulses.push({
        mesh: pMesh,
        start: new THREE.Vector3(srcPos.x, 0.5, srcPos.z),
        end: new THREE.Vector3(dstPos.x, 0.5, dstPos.z),
        progress: (idx * 0.2) % 1.0,
        speed: 0.35 + (idx % 3) * 0.12,
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
      }
    };

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

      // Animate active packet transfer along route
      if (activeRouteCurve && activePacketMesh) {
        activePacketProgress += delta * packetSpeed;
        if (activePacketProgress >= 1.0) {
          activePacketProgress = 0.0;
        }

        const pointOnCurve = activeRouteCurve.getPointAt(activePacketProgress);
        activePacketMesh.position.copy(pointOnCurve);
        // Add subtle sinusoidal vertical bobbing to simulate packet wave
        activePacketMesh.position.y += Math.sin(activePacketProgress * Math.PI * 6) * 0.18;
        activePacketMesh.rotation.y += delta * 4.0;
      }

      // Animate background ambient particles
      ambientPulses.forEach((p) => {
        p.progress += delta * p.speed;
        if (p.progress >= 1.0) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
        p.mesh.position.y += Math.sin(p.progress * Math.PI) * 0.35;
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
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [devices, connections, highlightedPath, activeHopId, selectedDevice?.id, isPacketTampered]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060913] select-none overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD: Plant Info & Live Transmission Telemetry Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-[#090f1c]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase font-display tracking-wide">
              3D CYBER-PHYSICAL INDUSTRIAL PLANT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              SYNCHRONIZED WITH 2D CANVAS
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[10.5px] font-mono text-slate-300 border-l border-slate-700 pl-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> L0 Sensors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> L1 Control
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> L2 SCADA
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> L3 Operations
            </span>
          </div>
        </div>

        {/* Right Info Note */}
        <div className="bg-[#090f1c]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-[11px] font-mono text-slate-300 pointer-events-auto flex items-center gap-2 shadow-xl">
          <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click device model to open 360° Digital Twin</span>
        </div>
      </div>

      {/* Live 3D Packet Transmission Banner (Visible when packet is actively flying) */}
      {isSimulating && highlightedPath.length > 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-5 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3.5 font-mono text-xs ${
              isPacketTampered
                ? 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                : 'bg-purple-950/90 border-purple-500/80 text-purple-200'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-current animate-ping" />
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wide uppercase">
                {isPacketTampered ? 'TAMPERED PACKET IN 3D TRANSIT' : 'ACTIVE PACKET TRANSMISSION'}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-white font-bold">{highlightedPath.join(' ➔ ')}</span>
            </div>
            {activeHopId && (
              <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] border border-white/20">
                ACTIVE HOP: {activeHopId}
              </span>
            )}
          </div>
        </div>
      )}

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
