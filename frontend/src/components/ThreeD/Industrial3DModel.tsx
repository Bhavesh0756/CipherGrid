import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity,
  AlertTriangle,
  Compass,
  Cpu,
  Eye,
  Gauge,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Device, DeviceType } from '../../types';

interface Industrial3DModelProps {
  device: Device;
  height?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  onClose?: () => void;
}

export const Industrial3DModel: React.FC<Industrial3DModelProps> = ({
  device,
  height = '500px',
  autoRotate: defaultAutoRotate = true,
  showControls = true,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // View state
  const [viewMode, setViewMode] = useState<'realistic' | 'wireframe' | 'xray'>('realistic');
  const [exploded, setExploded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(defaultAutoRotate);
  const [rotorSpeed, setRotorSpeed] = useState<number>(device.device_type === 'Sensor' || device.name.toLowerCase().includes('turbine') ? 1.5 : 1.0);
  const [securityState, setSecurityState] = useState<'nominal' | 'warning' | 'compromised'>(
    device.trust_status === 'Untrusted' ? 'compromised' : 'nominal'
  );

  // References for three.js animation loop
  const animRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    rotatables: THREE.Object3D[];
    pulseLeds: { mesh: THREE.Mesh; baseColor: THREE.Color }[];
    explodables: { obj: THREE.Object3D; originalPos: THREE.Vector3; explodedPos: THREE.Vector3 }[];
    materials: THREE.Material[];
    frameId: number;
    clock: THREE.Clock;
  } | null>(null);

  // Determine subcategory based on device name & type
  const isTurbine =
    device.name.toLowerCase().includes('turbine') ||
    device.name.toLowerCase().includes('generator') ||
    device.name.toLowerCase().includes('loop') ||
    device.name.toLowerCase().includes('motor');

  const isPLC =
    device.device_type === 'PLC' ||
    device.name.toLowerCase().includes('plc') ||
    device.name.toLowerCase().includes('controller');

  const isServer =
    device.device_type === 'SCADA Server' ||
    device.device_type === 'Monitoring Server' ||
    device.name.toLowerCase().includes('scada') ||
    device.name.toLowerCase().includes('server');

  const isValve =
    device.name.toLowerCase().includes('valve') ||
    device.name.toLowerCase().includes('actuator') ||
    device.name.toLowerCase().includes('pipe') ||
    device.name.toLowerCase().includes('rtu');

  const isSwitch =
    device.device_type === 'Ethernet Switch' ||
    device.device_type === 'Router' ||
    device.device_type === 'Industrial Gateway';

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const heightPx = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 15;
    controls.minDistance = 2;
    controls.target.set(0, 0.5, 0);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 1.0);
    rimLight.position.set(0, -4, -6);
    scene.add(rimLight);

    // Status point light
    const statusLightColor =
      securityState === 'compromised' ? 0xf43f5e : securityState === 'warning' ? 0xf59e0b : 0x10b981;
    const statusPointLight = new THREE.PointLight(statusLightColor, 3.5, 6);
    statusPointLight.position.set(0, 1.5, 1.8);
    scene.add(statusPointLight);

    // 5. Industrial Pedestal & Grid Plane
    const gridHelper = new THREE.GridHelper(14, 28, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Circular glowing pedestal
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.15, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.8,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.42;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Pedestal Neon Ring
    const ringGeo = new THREE.RingGeometry(2.35, 2.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: statusLightColor,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.34;
    scene.add(ring);

    // Lists for tracking animation & modes
    const rotatables: THREE.Object3D[] = [];
    const pulseLeds: { mesh: THREE.Mesh; baseColor: THREE.Color }[] = [];
    const explodables: { obj: THREE.Object3D; originalPos: THREE.Vector3; explodedPos: THREE.Vector3 }[] = [];
    const materials: THREE.Material[] = [];

    const regMat = (m: THREE.Material) => {
      materials.push(m);
      return m;
    };

    // Shared Palette
    const steelMat = regMat(new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 }));
    const chromeMat = regMat(new THREE.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.95, roughness: 0.1 }));
    const darkChassisMat = regMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.5 }));
    const copperMat = regMat(new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.3 }));
    const yellowHazardMat = regMat(new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.3, roughness: 0.6 }));
    const glowingCyanMat = regMat(new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
    }));
    const statusLedMat = regMat(new THREE.MeshStandardMaterial({
      color: statusLightColor,
      emissive: statusLightColor,
      emissiveIntensity: 1.5,
    }));

    // Group for complete model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // ==========================================
    // PROCEDURAL MODEL BUILDERS
    // ==========================================

    if (isTurbine) {
      // ----------------------------------------------------
      // MODEL 1: TURBINE LOOP CONTROLLER / STEAM TURBINE
      // ----------------------------------------------------
      // Base Heavy Frame with Mounting Feet
      const baseGeo = new THREE.BoxGeometry(3.6, 0.3, 2.2);
      const baseMesh = new THREE.Mesh(baseGeo, darkChassisMat);
      baseMesh.position.set(0, -0.2, 0);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      modelGroup.add(baseMesh);

      // Yellow Hazard Strips on base
      const stripeGeo = new THREE.BoxGeometry(3.62, 0.08, 0.05);
      const stripeMesh = new THREE.Mesh(stripeGeo, yellowHazardMat);
      stripeMesh.position.set(0, -0.15, 1.12);
      modelGroup.add(stripeMesh);

      // Main Outer Turbine Cylinder (Semi-transparent in X-Ray)
      const casingGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.6, 36, 1, true);
      casingGeo.rotateZ(Math.PI / 2);
      const casingMat = regMat(new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.8,
        roughness: 0.35,
        side: THREE.DoubleSide,
      }));
      const casingMesh = new THREE.Mesh(casingGeo, casingMat);
      casingMesh.position.set(0, 0.7, 0);
      casingMesh.castShadow = true;
      modelGroup.add(casingMesh);

      explodables.push({
        obj: casingMesh,
        originalPos: casingMesh.position.clone(),
        explodedPos: new THREE.Vector3(0, 1.8, 0),
      });

      // Flange Rings on Casing Ends
      [-1.3, 1.3].forEach((xPos) => {
        const flangeGeo = new THREE.TorusGeometry(1.08, 0.08, 16, 32);
        flangeGeo.rotateY(Math.PI / 2);
        const flangeMesh = new THREE.Mesh(flangeGeo, steelMat);
        flangeMesh.position.set(xPos, 0.7, 0);
        modelGroup.add(flangeMesh);
      });

      // Internal Central Rotor Shaft (Rotatable)
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 0.7, 0);

      const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 3.2, 24);
      shaftGeo.rotateZ(Math.PI / 2);
      const shaftMesh = new THREE.Mesh(shaftGeo, chromeMat);
      shaftMesh.castShadow = true;
      rotorGroup.add(shaftMesh);

      // 3 Stages of Curved Aerofoil Turbine Impeller Blades
      const bladeStages = [-0.7, 0, 0.7];
      const bladeCounts = [14, 16, 18];
      const bladeRadii = [0.85, 0.95, 0.85];

      bladeStages.forEach((stageX, stageIdx) => {
        const count = bladeCounts[stageIdx];
        const radius = bladeRadii[stageIdx];
        const stageHubGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 24);
        stageHubGeo.rotateZ(Math.PI / 2);
        const hubMesh = new THREE.Mesh(stageHubGeo, steelMat);
        hubMesh.position.set(stageX, 0, 0);
        rotorGroup.add(hubMesh);

        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const bladeGeo = new THREE.BoxGeometry(0.04, radius * 0.7, 0.18);
          const bladeMesh = new THREE.Mesh(bladeGeo, chromeMat);
          bladeMesh.position.set(stageX, Math.cos(angle) * (radius * 0.5), Math.sin(angle) * (radius * 0.5));
          bladeMesh.rotation.x = angle + 0.3; // Pitch angle
          bladeMesh.rotation.y = 0.2;
          rotorGroup.add(bladeMesh);
        }
      });

      modelGroup.add(rotorGroup);
      rotatables.push(rotorGroup);

      // Electromagnetic Stator Copper Coils (Mounted on lower casing)
      for (let i = 0; i < 8; i++) {
        const coilAngle = (i / 8) * Math.PI * 2;
        const coilGeo = new THREE.TorusGeometry(0.25, 0.08, 12, 24);
        const coilMesh = new THREE.Mesh(coilGeo, copperMat);
        coilMesh.position.set(
          -0.8 + (i % 3) * 0.8,
          0.7 + Math.sin(coilAngle) * 0.8,
          Math.cos(coilAngle) * 0.8
        );
        modelGroup.add(coilMesh);
      }

      // Cooling Heat Pipe Manifold & Fin Block
      const finGroup = new THREE.Group();
      finGroup.position.set(0, 1.85, 0);
      for (let f = -1.0; f <= 1.0; f += 0.15) {
        const finGeo = new THREE.BoxGeometry(0.05, 0.4, 1.4);
        const finMesh = new THREE.Mesh(finGeo, steelMat);
        finMesh.position.set(f, 0, 0);
        finGroup.add(finMesh);
      }
      modelGroup.add(finGroup);
      explodables.push({
        obj: finGroup,
        originalPos: finGroup.position.clone(),
        explodedPos: new THREE.Vector3(0, 2.7, 0),
      });

      // Front Industrial Control Pod (Digital Tachometer / Loop Governor)
      const podGeo = new THREE.BoxGeometry(1.2, 0.8, 0.5);
      const podMesh = new THREE.Mesh(podGeo, darkChassisMat);
      podMesh.position.set(0, 0.7, 1.35);
      podMesh.castShadow = true;
      modelGroup.add(podMesh);

      // Dial Face Glass
      const dialGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 32);
      dialGeo.rotateX(Math.PI / 2);
      const dialMesh = new THREE.Mesh(dialGeo, glowingCyanMat);
      dialMesh.position.set(-0.25, 0.7, 1.62);
      modelGroup.add(dialMesh);

      // Dial Needle (Rotates with speed)
      const needleGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
      const needleMesh = new THREE.Mesh(needleGeo, regMat(new THREE.MeshBasicMaterial({ color: 0xffffff })));
      needleMesh.position.set(-0.25, 0.7, 1.65);
      modelGroup.add(needleMesh);
      rotatables.push(needleMesh);

      // Status Diagnostic LEDs on Controller Face
      [-0.1, 0.1, 0.3].forEach((xOff, idx) => {
        const ledGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const ledMat = idx === 0 ? statusLedMat : glowingCyanMat;
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(xOff, 0.95, 1.62);
        modelGroup.add(ledMesh);
        pulseLeds.push({ mesh: ledMesh, baseColor: new THREE.Color(statusLightColor) });
      });

      // Steam / Gas Pipe Flanges (Inlet top, Outlet bottom)
      const inletPipeGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 24);
      const inletPipeMesh = new THREE.Mesh(inletPipeGeo, steelMat);
      inletPipeMesh.position.set(-0.6, 1.8, 0);
      modelGroup.add(inletPipeMesh);

      const outletPipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 24);
      const outletPipeMesh = new THREE.Mesh(outletPipeGeo, steelMat);
      outletPipeMesh.position.set(0.6, -0.3, 0);
      modelGroup.add(outletPipeMesh);

    } else if (isPLC) {
      // ----------------------------------------------------
      // MODEL 2: PLC / AUTOMATION CONTROLLER (Siemens S7 Style)
      // ----------------------------------------------------
      // Aluminum DIN-rail mount backing
      const dinGeo = new THREE.BoxGeometry(3.2, 0.4, 0.1);
      const dinMesh = new THREE.Mesh(dinGeo, steelMat);
      dinMesh.position.set(0, 0.6, -0.6);
      modelGroup.add(dinMesh);

      // Multi-module Modular Chassis (CPU, DI, DO, CP)
      const modules = [
        { name: 'PS', width: 0.6, color: 0x334155, offset: -1.1 },
        { name: 'CPU', width: 0.8, color: 0x1e293b, offset: -0.3 },
        { name: 'I/O 1', width: 0.5, color: 0x334155, offset: 0.4 },
        { name: 'I/O 2', width: 0.5, color: 0x334155, offset: 1.0 },
      ];

      modules.forEach((mod) => {
        const modGeo = new THREE.BoxGeometry(mod.width, 1.8, 1.1);
        const modMat = regMat(new THREE.MeshStandardMaterial({ color: mod.color, roughness: 0.4, metalness: 0.5 }));
        const modMesh = new THREE.Mesh(modGeo, modMat);
        modMesh.position.set(mod.offset, 0.6, 0);
        modMesh.castShadow = true;
        modelGroup.add(modMesh);

        explodables.push({
          obj: modMesh,
          originalPos: modMesh.position.clone(),
          explodedPos: new THREE.Vector3(mod.offset * 1.5, 0.6, 0.5),
        });

        // Removable Green Terminal Screw Strip
        const termGeo = new THREE.BoxGeometry(mod.width * 0.9, 0.35, 0.3);
        const termMat = regMat(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 }));
        const termMesh = new THREE.Mesh(termGeo, termMat);
        termMesh.position.set(mod.offset, -0.15, 0.5);
        modelGroup.add(termMesh);

        // Terminal copper contact screws
        for (let s = -mod.width * 0.35; s <= mod.width * 0.35; s += 0.12) {
          const screwGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12);
          const screwMesh = new THREE.Mesh(screwGeo, copperMat);
          screwMesh.position.set(mod.offset + s, 0.05, 0.5);
          modelGroup.add(screwMesh);
        }
      });

      // Front Diagnostic LCD Screen on CPU
      const lcdGeo = new THREE.BoxGeometry(0.6, 0.45, 0.05);
      const lcdMesh = new THREE.Mesh(lcdGeo, glowingCyanMat);
      lcdMesh.position.set(-0.3, 0.9, 0.58);
      modelGroup.add(lcdMesh);

      // Dual Shielded RJ45 Ethernet Ports
      [-0.15, 0.15].forEach((xOff) => {
        const portGeo = new THREE.BoxGeometry(0.2, 0.18, 0.15);
        const portMesh = new THREE.Mesh(portGeo, chromeMat);
        portMesh.position.set(-0.3 + xOff, 0.4, 0.58);
        modelGroup.add(portMesh);

        // RJ45 Blinking Activity LEDs
        const rjLedGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
        const rjLedMesh = new THREE.Mesh(rjLedGeo, statusLedMat);
        rjLedMesh.position.set(-0.3 + xOff, 0.52, 0.62);
        modelGroup.add(rjLedMesh);
        pulseLeds.push({ mesh: rjLedMesh, baseColor: new THREE.Color(statusLightColor) });
      });

      // Front Status LED Column (RUN, STOP, FAULT)
      const ledLabels = [0.2, 0.08, -0.04];
      ledLabels.forEach((yOff, idx) => {
        const ledGeo = new THREE.SphereGeometry(0.04, 16, 16);
        const ledColor = idx === 0 ? 0x10b981 : idx === 1 ? 0xf59e0b : 0xf43f5e;
        const ledMat = regMat(new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: 1.2 }));
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(-0.55, 0.9 + yOff, 0.58);
        modelGroup.add(ledMesh);
        pulseLeds.push({ mesh: ledMesh, baseColor: new THREE.Color(ledColor) });
      });

    } else if (isServer) {
      // ----------------------------------------------------
      // MODEL 3: SCADA SERVER / 4U INDUSTRIAL RACK HOST
      // ----------------------------------------------------
      // 4U Rackmount Chassis
      const rackGeo = new THREE.BoxGeometry(3.4, 1.4, 2.6);
      const rackMesh = new THREE.Mesh(rackGeo, darkChassisMat);
      rackMesh.position.set(0, 0.5, 0);
      rackMesh.castShadow = true;
      modelGroup.add(rackMesh);

      // Front Rack Ears with Mounting Screws
      [-1.75, 1.75].forEach((xPos) => {
        const earGeo = new THREE.BoxGeometry(0.12, 1.5, 0.3);
        const earMesh = new THREE.Mesh(earGeo, steelMat);
        earMesh.position.set(xPos, 0.5, 1.3);
        modelGroup.add(earMesh);

        [-0.5, 0.5].forEach((yPos) => {
          const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
          boltGeo.rotateX(Math.PI / 2);
          const boltMesh = new THREE.Mesh(boltGeo, chromeMat);
          boltMesh.position.set(xPos, 0.5 + yPos, 1.46);
          modelGroup.add(boltMesh);
        });
      });

      // Front Hexagonal Perforated Mesh Grille
      const grilleGeo = new THREE.BoxGeometry(2.8, 1.1, 0.05);
      const grilleMat = regMat(new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.8,
        metalness: 0.9,
      }));
      const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
      grilleMesh.position.set(0, 0.5, 1.32);
      modelGroup.add(grilleMesh);

      // Dual High-Speed Internal Cooling Fans (Spinning)
      [-0.7, 0.7].forEach((fanX) => {
        const fanGroup = new THREE.Group();
        fanGroup.position.set(fanX, 0.5, 1.2);

        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        hubGeo.rotateX(Math.PI / 2);
        const hubMesh = new THREE.Mesh(hubGeo, chromeMat);
        fanGroup.add(hubMesh);

        for (let b = 0; b < 7; b++) {
          const angle = (b / 7) * Math.PI * 2;
          const bladeGeo = new THREE.BoxGeometry(0.03, 0.35, 0.08);
          const bladeMesh = new THREE.Mesh(bladeGeo, steelMat);
          bladeMesh.position.set(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, 0);
          bladeMesh.rotation.z = angle + 0.4;
          fanGroup.add(bladeMesh);
        }

        modelGroup.add(fanGroup);
        rotatables.push(fanGroup);
      });

      // 4 Hot-Swappable 3.5" Drive Trays with Activity LEDs
      for (let d = 0; d < 4; d++) {
        const trayX = -1.0 + d * 0.65;
        const trayGeo = new THREE.BoxGeometry(0.55, 0.2, 0.08);
        const trayMesh = new THREE.Mesh(trayGeo, steelMat);
        trayMesh.position.set(trayX, -0.05, 1.34);
        modelGroup.add(trayMesh);

        // Drive Activity LED
        const driveLedGeo = new THREE.BoxGeometry(0.03, 0.03, 0.02);
        const driveLedMesh = new THREE.Mesh(driveLedGeo, statusLedMat);
        driveLedMesh.position.set(trayX + 0.2, -0.05, 1.39);
        modelGroup.add(driveLedMesh);
        pulseLeds.push({ mesh: driveLedMesh, baseColor: new THREE.Color(statusLightColor) });
      }

    } else if (isValve) {
      // ----------------------------------------------------
      // MODEL 4: INDUSTRIAL FLOW ACTUATOR / RTU VALVE
      // ----------------------------------------------------
      // High-pressure Pipeline Segment
      const pipeGeo = new THREE.CylinderGeometry(0.65, 0.65, 3.2, 32);
      pipeGeo.rotateZ(Math.PI / 2);
      const pipeMesh = new THREE.Mesh(pipeGeo, steelMat);
      pipeMesh.position.set(0, 0, 0);
      pipeMesh.castShadow = true;
      modelGroup.add(pipeMesh);

      // Double Flanges
      [-1.5, 1.5].forEach((xPos) => {
        const flangeGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.15, 32);
        flangeGeo.rotateZ(Math.PI / 2);
        const flangeMesh = new THREE.Mesh(flangeGeo, steelMat);
        flangeMesh.position.set(xPos, 0, 0);
        modelGroup.add(flangeMesh);

        for (let b = 0; b < 8; b++) {
          const angle = (b / 8) * Math.PI * 2;
          const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 12);
          boltGeo.rotateZ(Math.PI / 2);
          const boltMesh = new THREE.Mesh(boltGeo, chromeMat);
          boltMesh.position.set(xPos, Math.cos(angle) * 0.8, Math.sin(angle) * 0.8);
          modelGroup.add(boltMesh);
        }
      });

      // Central Toroidal Valve Body
      const valveBodyGeo = new THREE.SphereGeometry(0.85, 24, 24);
      const valveBodyMesh = new THREE.Mesh(valveBodyGeo, darkChassisMat);
      valveBodyMesh.position.set(0, 0, 0);
      modelGroup.add(valveBodyMesh);

      // Rotating Butterfly Valve Disc (Inside Pipe)
      const discGroup = new THREE.Group();
      discGroup.position.set(0, 0, 0);
      const discGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 24);
      const discMesh = new THREE.Mesh(discGeo, chromeMat);
      discGroup.add(discMesh);
      modelGroup.add(discGroup);
      rotatables.push(discGroup);

      // Motorized Actuator Head (Mounted on top)
      const stemGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 16);
      const stemMesh = new THREE.Mesh(stemGeo, chromeMat);
      stemMesh.position.set(0, 0.9, 0);
      modelGroup.add(stemMesh);

      const actuatorGeo = new THREE.BoxGeometry(1.2, 0.9, 1.1);
      const actuatorMesh = new THREE.Mesh(actuatorGeo, yellowHazardMat);
      actuatorMesh.position.set(0, 1.6, 0);
      actuatorMesh.castShadow = true;
      modelGroup.add(actuatorMesh);

      explodables.push({
        obj: actuatorMesh,
        originalPos: actuatorMesh.position.clone(),
        explodedPos: new THREE.Vector3(0, 2.5, 0),
      });

      // Manual Override Handwheel (Rotatable)
      const handwheelGroup = new THREE.Group();
      handwheelGroup.position.set(0.7, 1.6, 0);
      const wheelGeo = new THREE.TorusGeometry(0.35, 0.05, 16, 32);
      wheelGeo.rotateY(Math.PI / 2);
      const wheelMesh = new THREE.Mesh(wheelGeo, steelMat);
      handwheelGroup.add(wheelMesh);
      modelGroup.add(handwheelGroup);
      rotatables.push(handwheelGroup);

      // Position Dial Indicator (0-100% Flow)
      const posDialGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24);
      posDialGeo.rotateX(Math.PI / 2);
      const posDialMesh = new THREE.Mesh(posDialGeo, glowingCyanMat);
      posDialMesh.position.set(0, 1.6, 0.58);
      modelGroup.add(posDialMesh);

    } else {
      // ----------------------------------------------------
      // MODEL 5: INDUSTRIAL SWITCH / GATEWAY / SENSOR UNIT
      // ----------------------------------------------------
      const chassisGeo = new THREE.BoxGeometry(2.6, 1.2, 1.6);
      const chassisMesh = new THREE.Mesh(chassisGeo, darkChassisMat);
      chassisMesh.position.set(0, 0.4, 0);
      chassisMesh.castShadow = true;
      modelGroup.add(chassisMesh);

      // Side Cooling Heat Sink Fins
      [-1.35, 1.35].forEach((xSide) => {
        for (let z = -0.6; z <= 0.6; z += 0.2) {
          const finGeo = new THREE.BoxGeometry(0.08, 0.9, 0.08);
          const finMesh = new THREE.Mesh(finGeo, steelMat);
          finMesh.position.set(xSide, 0.4, z);
          modelGroup.add(finMesh);
        }
      });

      // Port Banks (16 Ethernet Ports)
      for (let p = 0; p < 8; p++) {
        const portX = -0.9 + p * 0.25;
        [0.55, 0.25].forEach((portY) => {
          const rjGeo = new THREE.BoxGeometry(0.18, 0.16, 0.1);
          const rjMesh = new THREE.Mesh(rjGeo, chromeMat);
          rjMesh.position.set(portX, portY, 0.82);
          modelGroup.add(rjMesh);

          // Port Link LED
          const pLedGeo = new THREE.BoxGeometry(0.03, 0.03, 0.02);
          const pLedMesh = new THREE.Mesh(pLedGeo, statusLedMat);
          pLedMesh.position.set(portX, portY + 0.1, 0.86);
          modelGroup.add(pLedMesh);
          pulseLeds.push({ mesh: pLedMesh, baseColor: new THREE.Color(statusLightColor) });
        });
      }
    }

    // Save references for animation
    const clock = new THREE.Clock();
    animRefs.current = {
      scene,
      camera,
      renderer,
      controls,
      rotatables,
      pulseLeds,
      explodables,
      materials,
      frameId: 0,
      clock,
    };

    // ==========================================
    // ANIMATION & RENDER LOOP
    // ==========================================
    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate dynamic components (turbine blades, fans, needles)
      const currentSpeed = rotorSpeed * (securityState === 'compromised' ? 2.5 : 1.0);
      rotatables.forEach((rot) => {
        rot.rotation.x += delta * 4.0 * currentSpeed;
      });

      // Subtly pulse status LEDs
      pulseLeds.forEach((led, idx) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5.0 + idx * 0.8);
        (led.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + pulse * 1.5;
      });

      // Auto-orbit camera if enabled
      if (autoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
      } else {
        controls.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
      animRefs.current!.frameId = requestAnimationFrame(animate);
    };

    animRefs.current.frameId = requestAnimationFrame(animate);

    // Resize Handler
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
      if (animRefs.current) {
        cancelAnimationFrame(animRefs.current.frameId);
        renderer.dispose();
      }
    };
  }, [device.id, device.device_type, device.name, rotorSpeed, securityState, autoRotate]);

  // Handle View Mode toggles (Realistic, Wireframe, X-Ray)
  useEffect(() => {
    if (!animRefs.current) return;
    animRefs.current.materials.forEach((mat) => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        if (viewMode === 'wireframe') {
          mat.wireframe = true;
          mat.color.setHex(0x38bdf8);
        } else if (viewMode === 'xray') {
          mat.wireframe = false;
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.depthWrite = false;
        } else {
          mat.wireframe = false;
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        }
        mat.needsUpdate = true;
      }
    });
  }, [viewMode]);

  // Handle Exploded CAD Assembly View
  useEffect(() => {
    if (!animRefs.current) return;
    const { explodables } = animRefs.current;
    explodables.forEach(({ obj, originalPos, explodedPos }) => {
      if (exploded) {
        obj.position.copy(explodedPos);
      } else {
        obj.position.copy(originalPos);
      }
    });
  }, [exploded]);

  const handleResetCamera = () => {
    if (!animRefs.current) return;
    const { camera, controls } = animRefs.current;
    camera.position.set(4.5, 3.2, 5.0);
    controls.target.set(0, 0.5, 0);
    controls.update();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070b14] shadow-2xl flex flex-col" style={{ height }}>
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Top HUD Overlay: Model Identification & Health Status */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 bg-[#090f1c]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
          <div className={`w-3 h-3 rounded-full ${
            securityState === 'compromised' ? 'bg-rose-500 animate-ping' : securityState === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
          }`} />
          <div>
            <div className="text-xs font-bold text-white font-display flex items-center gap-1.5">
              <span>{device.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {isTurbine ? 'ROTARY TURBINE UNIT' : isPLC ? 'DETERMINISTIC PLC' : isServer ? 'SCADA 4U RACK' : isValve ? 'FLOW ACTUATOR' : 'INDUSTRIAL SWITCH'}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Purdue {device.purdue_level} &bull; {device.ip_address} &bull; {device.trust_status}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#090f1c]/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
              title="Close 3D View"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Interactive 3D Control Bar */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-[#090f1c]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
          {/* Mode Switchers */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">VIEW:</span>
            {[
              { id: 'realistic' as const, label: 'Realistic PBR' },
              { id: 'wireframe' as const, label: 'CAD Blueprint' },
              { id: 'xray' as const, label: 'X-Ray Cutaway' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                  viewMode === m.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}

            <button
              onClick={() => setExploded(!exploded)}
              className={`ml-2 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer border ${
                exploded
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              Exploded View
            </button>
          </div>

          {/* Rotor RPM / Animation Slider */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10.5px]">RPM: {Math.round(rotorSpeed * 1800)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.1"
              value={rotorSpeed}
              onChange={(e) => setRotorSpeed(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Camera Utilities & Auto-Rotate */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-semibold transition-all cursor-pointer ${
                autoRotate
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Toggle Auto-Orbit"
            >
              Auto-Rotate
            </button>
            <button
              onClick={handleResetCamera}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reset View Angle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
