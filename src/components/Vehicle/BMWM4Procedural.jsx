import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  getCarbonFiberTexture,
  getBrakeRotorTexture,
  getTireTreadTexture,
} from '../../utils/textures';

/**
 * M Double-Spoke Alloy Wheel with Performance Tire, Cross-Drilled Rotor & M-Sport Caliper
 */
function MDoubleSpokeWheel({
  isFront = false,
  isLeft = true,
  wheelRef,
  rotorRef,
  brakeRotorTex,
  tireTreadTex,
  bmwBadgeTex,
}) {
  const sign = isLeft ? -1 : 1;
  const radius = isFront ? 0.36 : 0.38;
  const width = isFront ? 0.31 : 0.36;
  const wheelFaceX = sign * (width / 2 + 0.005);

  // Generate 5 pairs of double-spokes (10 spokes total)
  const spokes = useMemo(() => {
    const arr = [];
    const numPairs = 5;
    for (let i = 0; i < numPairs; i++) {
      const baseAngle = (i / numPairs) * Math.PI * 2;
      arr.push(baseAngle - 0.08);
      arr.push(baseAngle + 0.08);
    }
    return arr;
  }, []);

  return (
    <group>
      {/* 1. STATIONARY AXLE & BRAKE ASSEMBLY (Does not spin with wheel) */}
      {/* Cross-Drilled Ventilated Brake Rotor Disc */}
      <group position={[sign * (width * 0.15), 0, 0]}>
        {/* Rotor Core Mesh */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.70, radius * 0.70, 0.035, 32]} />
          <meshStandardMaterial color="#b0b8c0" metalness={0.92} roughness={0.28} />
        </mesh>
        {/* Exterior Rotor Face with Cross-Drilled Holes & Dynamic Glow */}
        <mesh
          ref={rotorRef}
          position={[sign * 0.019, 0, 0]}
          rotation={[0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <ringGeometry args={[0.06, radius * 0.69, 32]} />
          <meshStandardMaterial
            map={brakeRotorTex}
            metalness={0.94}
            roughness={0.22}
            color="#e2e8f0"
          />
        </mesh>

        {/* M-Sport 6-Piston Brake Caliper in Iconic M Blue */}
        <group position={[sign * 0.02, radius * 0.44, 0.04]} rotation={[0, 0, sign * 0.15]}>
          {/* Main Caliper Housing */}
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.13, 0.18]} />
            <meshPhysicalMaterial
              color="#0055d4"
              metalness={0.85}
              roughness={0.18}
              clearcoat={1.0}
              clearcoatRoughness={0.08}
            />
          </mesh>
          {/* Caliper Piston Chambers */}
          <mesh position={[sign * 0.042, 0, 0]}>
            <boxGeometry args={[0.015, 0.09, 0.14]} />
            <meshStandardMaterial color="#003c99" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* M Performance White Stripe Emblem */}
          <mesh
            position={[sign * 0.043, 0, 0]}
            rotation={[0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.08, 0.02]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* 2. ROTATING WHEEL & TIRE ASSEMBLY (Spins dynamically with car speed) */}
      <group ref={wheelRef}>
        {/* Performance Tire Rubber */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[radius, radius, width, 32]} />
          <meshStandardMaterial
            map={tireTreadTex}
            roughness={0.88}
            metalness={0.06}
            color="#141518"
          />
        </mesh>

        {/* Machined Rim Outer Lip / Flange */}
        <mesh
          position={[sign * (width / 2 - 0.008), 0, 0]}
          rotation={[0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <ringGeometry args={[radius * 0.82, radius * 0.88, 32]} />
          <meshStandardMaterial color="#e0e8f0" metalness={0.96} roughness={0.12} />
        </mesh>

        {/* Dark Rim Barrel Inset */}
        <mesh
          position={[sign * (width / 2 - 0.02), 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius * 0.82, radius * 0.74, 0.04, 32, 1, true]} />
          <meshStandardMaterial color="#1a1c22" metalness={0.92} roughness={0.2} />
        </mesh>

        {/* Center Wheel Hub */}
        <mesh
          position={[sign * (width / 2 - 0.025), 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.085, 0.085, 0.035, 24]} />
          <meshStandardMaterial color="#121316" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* BMW Roundel Center Cap */}
        <mesh
          position={[sign * (width / 2 + 0.004), 0, 0]}
          rotation={[0, sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <circleGeometry args={[0.036, 24]} />
          <meshStandardMaterial map={bmwBadgeTex} roughness={0.2} metalness={0.8} />
        </mesh>

        {/* 5 Wheel Lug Bolts */}
        {[0, 1, 2, 3, 4].map((n) => {
          const a = (n / 5) * Math.PI * 2;
          return (
            <mesh
              key={n}
              position={[
                sign * (width / 2 - 0.012),
                Math.sin(a) * 0.055,
                Math.cos(a) * 0.055,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.008, 0.008, 0.018, 6]} />
              <meshStandardMaterial color="#88929c" metalness={0.95} roughness={0.2} />
            </mesh>
          );
        })}

        {/* 10 Sculpted M Double-Spokes (Bi-Color Machined Face & Satin Black Pockets) */}
        {spokes.map((ang, idx) => {
          const spokeLen = radius * 0.74;
          const midR = spokeLen / 2 + 0.045;
          const yPos = Math.sin(ang) * midR;
          const zPos = Math.cos(ang) * midR;

          return (
            <group
              key={idx}
              position={[wheelFaceX, yPos, zPos]}
              rotation={[ang - Math.PI / 2, 0, 0]}
            >
              {/* Main Machined Aluminum Spoke Face */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.016, spokeLen * 0.92, 0.024]} />
                <meshStandardMaterial color="#d8e2ea" metalness={0.95} roughness={0.14} />
              </mesh>
              {/* Dark Satin Aerodynamic Pocket Inset */}
              <mesh position={[sign * -0.01, 0, 0]}>
                <boxGeometry args={[0.014, spokeLen * 0.88, 0.018]} />
                <meshStandardMaterial color="#1a1c22" metalness={0.9} roughness={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Procedural BMW M4 Competition Coupe (G82)
 * High-fidelity fallback featuring authentic M4 G82 architecture:
 * - Aggressive vertical twin kidney grilles with 5 horizontal slats and M badge
 * - Sculpted power-dome hood with dual aerodynamic indentations
 * - Carbon fiber double-bubble roof panel & shark fin antenna
 * - Tinted high-transmission automotive glass canopy
 * - M twin-stalk aero mirrors with upper flick
 * - Flared widebody front & rear fenders with M side gills
 * - Sculpted carbon side sill blades
 * - Carbon fiber rear diffuser with quad circular exhaust tailpipes
 * - M-spoke alloy wheels with cross-drilled rotors & glowing M-Sport calipers
 * - BMW Laserlight LED DRL angel eyes & 3D L-shaped OLED taillights with bloom reflection
 */
export function BMWM4Procedural({
  steeringAngle = 0,
  speed = 0,
  isBraking = false,
  isHeadlightsOn = true,
  carColor = '#004f38', // Isle of Man Green default
}) {
  const frontLeftWheelRef = useRef();
  const frontRightWheelRef = useRef();
  const rearLeftWheelRef = useRef();
  const rearRightWheelRef = useRef();

  const brakeDiscFLRef = useRef();
  const brakeDiscFRRef = useRef();
  const brakeDiscRLRef = useRef();
  const brakeDiscRRRef = useRef();

  // Procedural Textures
  const carbonFiberTex = useMemo(() => getCarbonFiberTexture(), []);
  const brakeRotorTex = useMemo(() => getBrakeRotorTexture(), []);
  const tireTreadTex = useMemo(() => getTireTreadTexture(), []);

  // BMW Roundel Badge Texture (Front Hood, Rear Trunk, and Wheel Center Caps)
  const bmwBadgeTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Outer black ring
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();

    // Chrome outer border
    ctx.strokeStyle = '#d0d8e2';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(64, 64, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0c';
    ctx.fill();

    // BMW 4 Bavarian Quadrants (Blue and White)
    const r = 44;
    // Top-Right Blue
    ctx.fillStyle = '#0066b1';
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, r, -Math.PI / 2, 0);
    ctx.fill();
    // Bottom-Left Blue
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, r, Math.PI / 2, Math.PI);
    ctx.fill();
    // Top-Left White
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, r, Math.PI, -Math.PI / 2);
    ctx.fill();
    // Bottom-Right White
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.arc(64, 64, r, 0, Math.PI / 2);
    ctx.fill();

    // Chrome quadrant dividing cross
    ctx.strokeStyle = '#bcc4cc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(64, 20);
    ctx.lineTo(64, 108);
    ctx.moveTo(20, 64);
    ctx.lineTo(108, 64);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  // High-Gloss Automotive Car Paint Shader (MeshPhysicalMaterial)
  const carPaintMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(carColor),
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      envMapIntensity: 2.2,
    });
  }, [carColor]);

  // Carbon Fiber Composite Material
  const carbonMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: carbonFiberTex,
      roughness: 0.28,
      metalness: 0.65,
      envMapIntensity: 1.8,
    });
  }, [carbonFiberTex]);

  // Tinted Automotive Glass Material
  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a1118'),
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.92,
      thickness: 0.7,
      ior: 1.52,
      transparent: true,
      opacity: 0.92,
      reflectivity: 0.95,
      envMapIntensity: 2.5,
    });
  }, []);

  // Gloss Shadowline Black Trim Material
  const shadowlineBlackMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#08090b',
      roughness: 0.15,
      metalness: 0.88,
    });
  }, []);

  // Emissive LED DRL Headlight Material (Calibrated with Tone Mapping for Bloom Glow)
  const drlHeadlightMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e0f6ff',
      emissive: '#7df9ff',
      emissiveIntensity: isHeadlightsOn ? 4.5 : 0.8,
    });
  }, [isHeadlightsOn]);

  // Emissive 3D OLED Taillight Strip Material (Calibrated with Tone Mapping for Bloom Glow)
  const taillightMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#ff0044',
      emissive: '#ff0022',
      emissiveIntensity: isBraking ? 7.0 : 3.2,
    });
  }, [isBraking]);

  // Real-time Wheel Spin, Steering Yaw & Brake Disc Dynamic Glow
  useFrame((_, delta) => {
    const spinAngle = speed * 0.28 * delta;
    if (frontLeftWheelRef.current) frontLeftWheelRef.current.rotation.x += spinAngle;
    if (frontRightWheelRef.current) frontRightWheelRef.current.rotation.x += spinAngle;
    if (rearLeftWheelRef.current) rearLeftWheelRef.current.rotation.x += spinAngle;
    if (rearRightWheelRef.current) rearRightWheelRef.current.rotation.x += spinAngle;

    // Front Steering Yaw
    if (frontLeftWheelRef.current?.parent) {
      frontLeftWheelRef.current.parent.rotation.y = steeringAngle;
    }
    if (frontRightWheelRef.current?.parent) {
      frontRightWheelRef.current.parent.rotation.y = steeringAngle;
    }

    // Dynamic Carbon-Ceramic Brake Disc Glow under High-Speed Braking
    const isHardBraking = isBraking && speed > 25;
    const glowColor = isHardBraking ? '#ff3b00' : '#000000';
    const glowIntensity = isHardBraking ? Math.min(3.5, (speed / 100) * 3.5) : 0;

    const discs = [brakeDiscFLRef, brakeDiscFRRef, brakeDiscRLRef, brakeDiscRRRef];
    discs.forEach((ref) => {
      if (ref.current?.material) {
        ref.current.material.emissive.set(glowColor);
        ref.current.material.emissiveIntensity = glowIntensity;
      }
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ==================================================================== */}
      {/* 1. SCULPTED CHASSIS & PBR CLEARCOAT BODYWORK                         */}
      {/* ==================================================================== */}
      
      {/* Lower Main Tub (Athletic M Profile) */}
      <mesh position={[0, 0.44, 0]} material={carPaintMat} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.38, 4.4]} />
      </mesh>

      {/* Flared Front Wheel Arches (Muscular M Fenders) */}
      <mesh position={[0, 0.46, 1.35]} material={carPaintMat} castShadow>
        <boxGeometry args={[1.98, 0.36, 1.1]} />
      </mesh>

      {/* Flared Muscular Rear Haunches (M4 Widebody Stance) */}
      <mesh position={[0, 0.48, -1.35]} material={carPaintMat} castShadow>
        <boxGeometry args={[2.02, 0.4, 1.2]} />
      </mesh>

      {/* Front Fender M Side Gills (Air Extractors with Chrome/Black M Badge) */}
      {[-1.0, 1.0].map((x, i) => (
        <group key={i} position={[x, 0.52, 0.85]}>
          {/* Black Recessed Vent Inset */}
          <mesh>
            <boxGeometry args={[0.02, 0.12, 0.28]} />
            <meshStandardMaterial color="#08090a" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* M4 Competition Chromed Badge Strip */}
          <mesh position={[(i === 0 ? -0.012 : 0.012), 0.01, 0]}>
            <boxGeometry args={[0.008, 0.03, 0.16]} />
            <meshStandardMaterial color="#d0d8e0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Sculpted M Power-Dome Hood with Aerodynamic Creases */}
      <mesh position={[0, 0.58, 1.3]} rotation={[-0.08, 0, 0]} material={carPaintMat} castShadow>
        <boxGeometry args={[1.76, 0.12, 1.6]} />
      </mesh>

      {/* Dual Power-Dome Indentation Channels (G82 Signature Hood Vents) */}
      {[-0.26, 0.26].map((x, i) => (
        <mesh key={i} position={[x, 0.65, 1.3]} rotation={[-0.08, 0, 0]} material={carPaintMat} castShadow>
          <boxGeometry args={[0.12, 0.04, 1.4]} />
        </mesh>
      ))}

      {/* Front Nose Cone Overhang */}
      <mesh position={[0, 0.48, 2.18]} rotation={[-0.22, 0, 0]} material={carPaintMat} castShadow>
        <boxGeometry args={[1.78, 0.28, 0.35]} />
      </mesh>

      {/* BMW Hood Roundel Badge */}
      <mesh position={[0, 0.65, 2.12]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
        <circleGeometry args={[0.07, 24]} />
        <meshStandardMaterial map={bmwBadgeTex} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* ==================================================================== */}
      {/* 2. AGGRESSIVE G82 VERTICAL TWIN KIDNEY GRILLES                       */}
      {/* ==================================================================== */}
      {/* Dual Vertical Hexagonal Grille Frames */}
      {[-0.22, 0.22].map((xOffset, i) => (
        <group key={i} position={[xOffset, 0.44, 2.29]} rotation={[-0.1, 0, 0]}>
          {/* Frameless Gloss-Black Kidney Surround */}
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.52, 0.08]} />
            <primitive object={shadowlineBlackMat} />
          </mesh>

          {/* Deep Honeycomb Radiator Core */}
          <mesh position={[0, 0, -0.035]}>
            <planeGeometry args={[0.31, 0.49]} />
            <meshStandardMaterial color="#040507" roughness={0.95} />
          </mesh>

          {/* 5-Tier Horizontal Double-Slats (M Signature Louvers) */}
          {[-0.18, -0.09, 0, 0.09, 0.18].map((yOffset, j) => (
            <mesh key={j} position={[0, yOffset, 0.02]}>
              <boxGeometry args={[0.3, 0.024, 0.04]} />
              <primitive object={shadowlineBlackMat} />
            </mesh>
          ))}

          {/* M4 Competition Grille Badge on Upper Right Kidney */}
          {i === 1 && (
            <mesh position={[0.08, 0.18, 0.045]}>
              <boxGeometry args={[0.09, 0.035, 0.015]} />
              <meshStandardMaterial color="#c0c8d0" metalness={0.9} roughness={0.2} />
            </mesh>
          )}
        </group>
      ))}

      {/* Front Bumper Lower Air Curtains & Full Carbon Front Splitter */}
      <group position={[0, 0.18, 2.22]}>
        {/* Center Lower Air Dam */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.1, 0.14, 0.2]} />
          <meshStandardMaterial color="#08080a" roughness={0.8} />
        </mesh>

        {/* Full-Width Carbon Fiber Front Splitter */}
        <mesh position={[0, -0.02, 0.08]} material={carbonMat} castShadow>
          <boxGeometry args={[1.96, 0.05, 0.36]} />
        </mesh>

        {/* Left & Right Carbon Corner Aero Fangs */}
        {[-0.86, 0.86].map((x, i) => (
          <mesh
            key={i}
            position={[x, 0.08, 0.05]}
            rotation={[0, (i === 0 ? 0.2 : -0.2), 0]}
            material={carbonMat}
            castShadow
          >
            <boxGeometry args={[0.26, 0.18, 0.16]} />
          </mesh>
        ))}
      </group>

      {/* ==================================================================== */}
      {/* 3. M CARBON FIBER ROOF WITH AERODYNAMIC DOUBLE-BUBBLE CHANNEL        */}
      {/* ==================================================================== */}
      <group position={[0, 1.15, -0.15]}>
        {/* Main Carbon Roof Panel */}
        <mesh material={carbonMat} castShadow>
          <boxGeometry args={[1.34, 0.05, 1.7]} />
        </mesh>

        {/* Central Aerodynamic Depression / Air Channel */}
        <mesh position={[0, -0.015, 0]} material={carbonMat}>
          <boxGeometry args={[0.35, 0.03, 1.68]} />
        </mesh>

        {/* Aerodynamic Shark-Fin Antenna */}
        <mesh position={[0, 0.07, -0.65]} rotation={[-0.3, 0, 0]} material={carbonMat} castShadow>
          <coneGeometry args={[0.04, 0.14, 4]} />
        </mesh>
      </group>

      {/* ==================================================================== */}
      {/* 4. TINTED AUTOMOTIVE GLASS CANOPY & PILLARS                          */}
      {/* ==================================================================== */}
      <group position={[0, 0.95, -0.15]}>
        {/* High-Transmission Tinted Cockpit Glass */}
        <mesh material={glassMat} castShadow>
          <boxGeometry args={[1.38, 0.44, 2.05]} />
        </mesh>

        {/* Front Windshield A-Pillars in Body Paint */}
        <mesh position={[-0.66, -0.02, 0.72]} rotation={[-0.45, 0, 0.15]} material={carPaintMat} castShadow>
          <boxGeometry args={[0.08, 0.62, 0.08]} />
        </mesh>
        <mesh position={[0.66, -0.02, 0.72]} rotation={[-0.45, 0, -0.15]} material={carPaintMat} castShadow>
          <boxGeometry args={[0.08, 0.62, 0.08]} />
        </mesh>

        {/* Rear C-Pillars (Iconic Hofmeister Kink Profile) */}
        <mesh position={[-0.66, -0.05, -0.72]} rotation={[0.42, 0, 0.15]} material={carPaintMat} castShadow>
          <boxGeometry args={[0.09, 0.58, 0.12]} />
        </mesh>
        <mesh position={[0.66, -0.05, -0.72]} rotation={[0.42, 0, -0.15]} material={carPaintMat} castShadow>
          <boxGeometry args={[0.09, 0.58, 0.12]} />
        </mesh>

        {/* Gloss Black Shadowline Window Surrounds */}
        {[-0.69, 0.69].map((x, i) => (
          <mesh key={i} position={[x, -0.18, 0]}>
            <boxGeometry args={[0.02, 0.03, 1.85]} />
            <primitive object={shadowlineBlackMat} />
          </mesh>
        ))}
      </group>

      {/* ==================================================================== */}
      {/* 5. ICONIC M AERODYNAMIC TWIN-STALK SIDE MIRRORS                      */}
      {/* ==================================================================== */}
      {[-1.0, 1.0].map((x, i) => {
        const sign = i === 0 ? -1 : 1;
        return (
          <group key={i} position={[x, 0.82, 0.55]}>
            {/* Gloss Black Door Mount Base */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[0.12, 0.03, 0.08]} />
              <primitive object={shadowlineBlackMat} />
            </mesh>
            {/* Carbon Fiber Mirror Housing */}
            <mesh position={[sign * 0.08, 0.02, 0]} rotation={[0, sign * 0.1, 0]} material={carbonMat} castShadow>
              <boxGeometry args={[0.22, 0.11, 0.13]} />
            </mesh>
            {/* Distinctive M Upper Aerodynamic Flick / Horn */}
            <mesh position={[sign * 0.02, 0.08, -0.01]} rotation={[0, 0, sign * 0.45]} material={carbonMat} castShadow>
              <boxGeometry args={[0.14, 0.025, 0.04]} />
            </mesh>
            {/* Rear-Facing Highly Reflective Mirror Glass */}
            <mesh position={[sign * 0.08, 0.02, -0.066]}>
              <planeGeometry args={[0.18, 0.09]} />
              <meshStandardMaterial color="#f0f6ff" metalness={0.98} roughness={0.04} />
            </mesh>
          </group>
        );
      })}

      {/* Sculpted Carbon Fiber Side Rocker Sills with Rear Aero Winglets */}
      {[-0.98, 0.98].map((x, i) => (
        <group key={i} position={[x, 0.22, 0]}>
          {/* Main Sill Blade */}
          <mesh material={carbonMat} castShadow>
            <boxGeometry args={[0.12, 0.06, 2.7]} />
          </mesh>
          {/* Rear Aero Flick in Front of Rear Wheel */}
          <mesh position={[0, 0.08, -1.25]} material={carbonMat} castShadow>
            <boxGeometry args={[0.14, 0.12, 0.18]} />
          </mesh>
        </group>
      ))}

      {/* ==================================================================== */}
      {/* 6. BMW LASERLIGHT HEADLIGHTS & HEXAGONAL DRLs (BLOOM REFLECTION)    */}
      {/* ==================================================================== */}
      {[-0.68, 0.68].map((x, i) => (
        <group key={i} position={[x, 0.52, 2.18]}>
          {/* Angular Dark Headlight Housing */}
          <mesh rotation={[0, (i === 0 ? 0.25 : -0.25), 0]}>
            <boxGeometry args={[0.38, 0.12, 0.12]} />
            <meshStandardMaterial color="#050608" roughness={0.2} metalness={0.9} />
          </mesh>

          {/* Hexagonal DRL Daytime Running Light Signature Light Brows */}
          <mesh position={[0, 0, 0.062]} rotation={[0, (i === 0 ? 0.25 : -0.25), 0]} material={drlHeadlightMat}>
            <planeGeometry args={[0.32, 0.055]} />
          </mesh>

          {/* Dual Projector Laser Lenses */}
          {[-0.08, 0.08].map((px, pIdx) => (
            <mesh key={pIdx} position={[px, 0, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.02, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#7df9ff"
                emissiveIntensity={isHeadlightsOn ? 3.5 : 0.5}
              />
            </mesh>
          ))}

          {/* Real Three.js Headlight Beam Projector */}
          {isHeadlightsOn && (
            <spotLight
              position={[0, 0, 0.1]}
              target-position={[x * 1.5, -0.4, 45]}
              angle={0.48}
              penumbra={0.5}
              intensity={50}
              distance={85}
              color="#e0f6ff"
              castShadow
            />
          )}
        </group>
      ))}

      {/* ==================================================================== */}
      {/* 7. REAR FASCIA: DUCKTAIL LIP, 3D OLED TAILLIGHTS, CARBON DIFFUSER & QUADS */}
      {/* ==================================================================== */}
      {/* Carbon Fiber Ducktail Trunk Lip Spoiler */}
      <mesh position={[0, 0.88, -2.18]} rotation={[0.22, 0, 0]} material={carbonMat} castShadow>
        <boxGeometry args={[1.52, 0.04, 0.18]} />
      </mesh>

      {/* BMW Rear Roundel Badge */}
      <mesh position={[0, 0.72, -2.21]} rotation={[-Math.PI / 2 - 0.15, Math.PI, 0]}>
        <circleGeometry args={[0.06, 24]} />
        <meshStandardMaterial map={bmwBadgeTex} roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Slender 3D L-Shaped OLED Taillight Bars with Bloom Glow */}
      {[-0.72, 0.72].map((x, i) => (
        <group key={i} position={[x, 0.62, -2.2]}>
          {/* Main Horizontal Taillight Strip */}
          <mesh material={taillightMat}>
            <boxGeometry args={[0.42, 0.075, 0.06]} />
          </mesh>
          {/* L-Shaped Downward Return Wing */}
          <mesh position={[(i === 0 ? 0.18 : -0.18), -0.06, 0]} material={taillightMat}>
            <boxGeometry args={[0.06, 0.08, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Carbon Fiber Multi-Fin Rear Diffuser */}
      <group position={[0, 0.22, -2.15]}>
        {/* Main Diffuser Undertray */}
        <mesh material={carbonMat} castShadow>
          <boxGeometry args={[1.82, 0.22, 0.26]} />
        </mesh>

        {/* 4 Vertical Aerodynamic Strakes / Fins */}
        {[-0.32, -0.11, 0.11, 0.32].map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.05]} material={carbonMat} castShadow>
            <boxGeometry args={[0.025, 0.13, 0.22]} />
          </mesh>
        ))}

        {/* Central F1-Style Red Rain Reflector */}
        <mesh position={[0, -0.02, 0.12]}>
          <boxGeometry args={[0.12, 0.04, 0.02]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.5} />
        </mesh>

        {/* --- ICONIC QUAD CIRCULAR EXHAUST TAILPIPES (2 Left, 2 Right) --- */}
        {[-0.56, -0.40, 0.40, 0.56].map((x, i) => (
          <group key={i} position={[x, -0.02, -0.1]}>
            {/* Polished Chrome/Dark Titanium Exhaust Tip Outer Barrel */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.068, 0.068, 0.19, 20]} />
              <meshStandardMaterial color="#22252a" metalness={0.96} roughness={0.15} />
            </mesh>
            {/* Beveled Tip Polished Ring */}
            <mesh position={[0, 0, -0.096]}>
              <ringGeometry args={[0.056, 0.068, 20]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.1} />
            </mesh>
            {/* Deep Hollow Bore Interior */}
            <mesh position={[0, 0, -0.094]}>
              <circleGeometry args={[0.055, 20]} />
              <meshStandardMaterial color="#040404" roughness={0.98} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ==================================================================== */}
      {/* 8. M DOUBLE-SPOKE ALLOY WHEELS & M-SPORT BRAKES (4 CORNERS)          */}
      {/* ==================================================================== */}
      {/* Front Left Wheel Assembly */}
      <group position={[-1.02, 0.35, 1.35]}>
        <MDoubleSpokeWheel
          isFront={true}
          isLeft={true}
          wheelRef={frontLeftWheelRef}
          rotorRef={brakeDiscFLRef}
          brakeRotorTex={brakeRotorTex}
          tireTreadTex={tireTreadTex}
          bmwBadgeTex={bmwBadgeTex}
        />
      </group>

      {/* Front Right Wheel Assembly */}
      <group position={[1.02, 0.35, 1.35]}>
        <MDoubleSpokeWheel
          isFront={true}
          isLeft={false}
          wheelRef={frontRightWheelRef}
          rotorRef={brakeDiscFRRef}
          brakeRotorTex={brakeRotorTex}
          tireTreadTex={tireTreadTex}
          bmwBadgeTex={bmwBadgeTex}
        />
      </group>

      {/* Rear Left Wheel Assembly */}
      <group position={[-1.04, 0.36, -1.35]}>
        <MDoubleSpokeWheel
          isFront={false}
          isLeft={true}
          wheelRef={rearLeftWheelRef}
          rotorRef={brakeDiscRLRef}
          brakeRotorTex={brakeRotorTex}
          tireTreadTex={tireTreadTex}
          bmwBadgeTex={bmwBadgeTex}
        />
      </group>

      {/* Rear Right Wheel Assembly */}
      <group position={[1.04, 0.36, -1.35]}>
        <MDoubleSpokeWheel
          isFront={false}
          isLeft={false}
          wheelRef={rearRightWheelRef}
          rotorRef={brakeDiscRRRef}
          brakeRotorTex={brakeRotorTex}
          tireTreadTex={tireTreadTex}
          bmwBadgeTex={bmwBadgeTex}
        />
      </group>
    </group>
  );
}
