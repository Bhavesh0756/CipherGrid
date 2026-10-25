import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Compass,
  Eye,
  Layers,
  Maximize2,
  Minimize2,
  MousePointer,
  RotateCcw,
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

export const NetworkPlant3DView: React.FC<NetworkPlant3DViewProps> = ({
  onSelectDevice,
  onOpenDigitalTwin,
}) => {
  const { devices, connections, selectedDevice, setSelectedDevice } = useSimulatorStore();
  const mountRef = useRef<HTMLDivElement>(null);

  const [hoveredDev, setHoveredDev] = useState<Device | null>(null);
  const [selected3DDev, setSelected3DDev] = useState<Device | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 200);
    camera.position.set(0, 16, 22);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 45;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
    controls.target.set(0, 0, 0);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 2.0);
    dirLight.position.set(12, 24, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 1.2);
    blueFill.position.set(-15, 10, -10);
    scene.add(blueFill);

    // 5. Industrial Floor Grid
    const floorGrid = new THREE.GridHelper(36, 36, 0x38bdf8, 0x1e293b);
    floorGrid.position.y = -0.01;
    scene.add(floorGrid);

    // Purdue Zone Layout Calculation
    // Map Purdue level to Z-axis bands
    const purdueZMap: Record<PurdueLevel, number> = {
      'Level 0': 7.5,
      'Level 1': 2.5,
      'Level 2': -2.5,
      'Level 3': -7.5,
      'Level 3.5': -11.0,
      'Untrusted': 0,
    };

    const purdueColors: Record<PurdueLevel, number> = {
      'Level 0': 0xf59e0b, // Amber
      'Level 1': 0x38bdf8, // Blue
      'Level 2': 0xa855f7, // Purple
      'Level 3': 0x10b981, // Emerald
      'Level 3.5': 0x06b6d4, // Cyan
      'Untrusted': 0xf43f5e, // Rose
    };

    // Render Purdue Zone demarcation boundaries on the floor
    const zoneBands = [
      { name: 'LEVEL 0 · PROCESS SENSORS', z: 7.5, color: 0xf59e0b },
      { name: 'LEVEL 1 · BASIC CONTROL (PLC)', z: 2.5, color: 0x38bdf8 },
      { name: 'LEVEL 2 · SCADA & HMI', z: -2.5, color: 0xa855f7 },
      { name: 'LEVEL 3 · OPERATIONS & GATEWAYS', z: -7.5, color: 0x10b981 },
    ];

    zoneBands.forEach((band) => {
      const zoneLineGeo = new THREE.PlaneGeometry(32, 4.2);
      const zoneLineMat = new THREE.MeshBasicMaterial({
        color: band.color,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
      });
      const zonePlane = new THREE.Mesh(zoneLineGeo, zoneLineMat);
      zonePlane.rotation.x = -Math.PI / 2;
      zonePlane.position.set(0, 0, band.z);
      scene.add(zonePlane);
    });

    // 6. Spawn 3D Devices in Scene
    const deviceMeshes: { mesh: THREE.Mesh; device: Device }[] = [];
    const devicePosMap = new Map<string, THREE.Vector3>();

    // Calculate positions evenly within each Purdue band
    const devByPurdue = new Map<PurdueLevel, Device[]>();
    devices.forEach((d) => {
      const p = d.purdue_level || 'Level 1';
      if (!devByPurdue.has(p)) devByPurdue.set(p, []);
      devByPurdue.get(p)!.push(d);
    });

    devByPurdue.forEach((devList, pLevel) => {
      const zPos = purdueZMap[pLevel] ?? 0;
      const count = devList.length;
      const spacing = count > 1 ? 24 / (count + 1) : 0;

      devList.forEach((d, idx) => {
        const xPos = count > 1 ? -12 + (idx + 1) * spacing : 0;
        const pos = new THREE.Vector3(xPos, 0, zPos);
        devicePosMap.set(d.id, pos);

        // Pedestal base
        const pColor = purdueColors[d.purdue_level] || 0x38bdf8;
        const pedGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.25, 32);
        const pedMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.4,
          metalness: 0.8,
        });
        const pedMesh = new THREE.Mesh(pedGeo, pedMat);
        pedMesh.position.set(pos.x, 0.125, pos.z);
        pedMesh.receiveShadow = true;
        scene.add(pedMesh);

        // Neon Glow Ring
        const ringGeo = new THREE.RingGeometry(1.2, 1.28, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: d.trust_status === 'Untrusted' ? 0xf43f5e : pColor,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.26, pos.z);
        scene.add(ring);

        // 3D Procedural Hardware Unit
        const isTurb = d.name.toLowerCase().includes('turbine') || d.name.toLowerCase().includes('loop');
        const isSrv = d.device_type === 'SCADA Server' || d.device_type === 'Monitoring Server';

        let unitGeo: THREE.BufferGeometry;
        let unitMat: THREE.Material;

        if (isTurb) {
          // Turbine Cylinder
          unitGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.4, 24);
          unitGeo.rotateZ(Math.PI / 2);
          unitMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
        } else if (isSrv) {
          // 4U Server box
          unitGeo = new THREE.BoxGeometry(1.6, 0.9, 1.2);
          unitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
        } else {
          // Modular PLC
          unitGeo = new THREE.BoxGeometry(1.2, 1.1, 0.8);
          unitMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.5 });
        }

        const unitMesh = new THREE.Mesh(unitGeo, unitMat);
        unitMesh.position.set(pos.x, 0.8, pos.z);
        unitMesh.castShadow = true;
        unitMesh.userData = { device: d };
        scene.add(unitMesh);
        deviceMeshes.push({ mesh: unitMesh, device: d });

        // Indicator Light on Unit
        const ledGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const ledMat = new THREE.MeshBasicMaterial({
          color: d.trust_status === 'Untrusted' ? 0xf43f5e : 0x10b981,
        });
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(pos.x, 1.45, pos.z);
        scene.add(ledMesh);
      });
    });

    // 7. 3D Laser Conduits Linking Devices
    const conduitLines: THREE.Line[] = [];
    connections.forEach((conn) => {
      const srcPos = devicePosMap.get(conn.source_id);
      const dstPos = devicePosMap.get(conn.target_id);
      if (!srcPos || !dstPos) return;

      const points = [
        new THREE.Vector3(srcPos.x, 0.4, srcPos.z),
        new THREE.Vector3((srcPos.x + dstPos.x) / 2, 0.8, (srcPos.z + dstPos.z) / 2),
        new THREE.Vector3(dstPos.x, 0.4, dstPos.z),
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.75,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      scene.add(tubeMesh);
    });

    // 8. Animated 3D Cryptographic Packet Particles
    const packetGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const packetPulses: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; progress: number; speed: number }[] = [];

    connections.slice(0, 8).forEach((conn, idx) => {
      const srcPos = devicePosMap.get(conn.source_id);
      const dstPos = devicePosMap.get(conn.target_id);
      if (!srcPos || !dstPos) return;

      const pMesh = new THREE.Mesh(packetGeo, packetMat);
      pMesh.position.copy(srcPos);
      scene.add(pMesh);
      packetPulses.push({
        mesh: pMesh,
        start: new THREE.Vector3(srcPos.x, 0.4, srcPos.z),
        end: new THREE.Vector3(dstPos.x, 0.4, dstPos.z),
        progress: (idx * 0.25) % 1.0,
        speed: 0.4 + (idx % 3) * 0.15,
      });
    });

    // Raycasting for device clicking & hover
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
        setSelected3DDev(hit);
        if (onSelectDevice) onSelectDevice(hit);
        if (onOpenDigitalTwin) onOpenDigitalTwin(hit);
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Animate packet particles along conduits
      packetPulses.forEach((p) => {
        p.progress += delta * p.speed;
        if (p.progress >= 1.0) p.progress = 0;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);
        p.mesh.position.y += Math.sin(p.progress * Math.PI) * 0.4;
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
  }, [devices, connections]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#060913] select-none overflow-hidden">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD: Plant Legend & Instructions */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="bg-[#090f1c]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase font-display tracking-wide">
              3D CYBER-PHYSICAL INDUSTRIAL PLANT
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[10.5px] font-mono text-slate-300 border-l border-slate-700 pl-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> L0 Process</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> L1 Control</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> L2 SCADA</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> L3 Operations</span>
          </div>
        </div>

        <div className="bg-[#090f1c]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[10.5px] font-mono text-slate-400 pointer-events-auto">
          Click any device to open 3D Digital Twin
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredDev && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#090f1c]/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-cyan-500/50 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white font-display flex items-center gap-2">
              <span>{hoveredDev.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {hoveredDev.purdue_level}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              IP: {hoveredDev.ip_address} &bull; Type: {hoveredDev.device_type} &bull; Click to Inspect 3D Model
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
