import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

/**
 * PoliceCar
 * Authentic Los Santos Police Department Interceptor Cruiser:
 * - 3D Black & White cruiser body with push bumper bullbar
 * - Rooftop LED lightbar with alternate flashing Red & Blue strobes
 * - Front grille wig-wag warning flashers
 * - Pursuit AI tracking player position & trigger evasion / busted states
 */
export function PoliceCar({
  wantedLevel = 0,
  vehicleStateRef,
  onBusted,
  onEvaded,
  onPoliceDistanceUpdate,
}) {
  const policeGroupRef = useRef();
  const policePos = useRef(new THREE.Vector3(6.0, 0.0, -10.0));
  const policeYaw = useRef(0);
  const policeSpeed = useRef(0);
  const strobeState = useRef(false);
  const strobeTimer = useRef(0);
  const evasionTimer = useRef(0);
  const lastRadioTimer = useRef(0);

  const [lightColorPhase, setLightColorPhase] = useState(false);

  // Reset or initialize police spawn relative to player when wanted level increases
  useEffect(() => {
    if (wantedLevel >= 1) {
      audioSynthesizer.playPoliceSiren(true);
      audioSynthesizer.playPoliceRadio();

      const vstate = vehicleStateRef?.current;
      if (vstate && vstate.position) {
        // Spawn 35m behind or ahead on avenue
        const pz = vstate.position.z > -20 ? vstate.position.z - 38 : vstate.position.z + 38;
        policePos.current.set(vstate.position.x || 6.0, 0.0, pz);
        policeYaw.current = vstate.position.z > -20 ? 0 : Math.PI;
      }
    } else {
      audioSynthesizer.playPoliceSiren(false);
    }
  }, [wantedLevel, vehicleStateRef]);

  useFrame((_, delta) => {
    if (wantedLevel <= 0) {
      if (policeGroupRef.current) policeGroupRef.current.visible = false;
      return;
    }
    if (policeGroupRef.current) policeGroupRef.current.visible = true;

    // Strobe flasher cycle (10 Hz emergency flash)
    strobeTimer.current += delta;
    if (strobeTimer.current > 0.08) {
      strobeTimer.current = 0;
      strobeState.current = !strobeState.current;
      setLightColorPhase(strobeState.current);
    }

    const vstate = vehicleStateRef?.current;
    if (!vstate || !vstate.position) return;

    const playerPos = vstate.position;
    const toPlayer = new THREE.Vector3().subVectors(playerPos, policePos.current);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();

    if (onPoliceDistanceUpdate) {
      onPoliceDistanceUpdate(distToPlayer);
    }

    // Occasional radio dispatch squawk
    lastRadioTimer.current += delta;
    if (lastRadioTimer.current > 14) {
      lastRadioTimer.current = 0;
      audioSynthesizer.playPoliceRadio();
    }

    // Evasion detection: If player is far (> 50m) or moving fast away
    if (distToPlayer > 48) {
      evasionTimer.current += delta;
      if (evasionTimer.current > 9.0) {
        // Cops lost!
        evasionTimer.current = 0;
        if (onEvaded) onEvaded();
      }
    } else {
      evasionTimer.current = 0;
    }

    // Busted detection: Close proximity (< 3.8m) while player is stopped (< 6 km/h)
    if (distToPlayer < 3.8 && vstate.speed < 6) {
      if (onBusted) onBusted();
    }

    // Pursuit AI: Steer and accelerate towards player along street grid
    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    // Smooth angle interpolation
    let angleDiff = targetAngle - policeYaw.current;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    policeYaw.current += angleDiff * Math.min(1.0, delta * 3.5);

    // Target pursuit speed based on wanted level (up to 140 km/h)
    const maxKmh = 75 + wantedLevel * 14;
    const maxMs = maxKmh / 3.6;
    const desiredSpeed = distToPlayer > 6.0 ? maxMs : Math.min(maxMs, vstate.speed / 3.6);
    policeSpeed.current += (desiredSpeed - policeSpeed.current) * Math.min(1.0, delta * 2.2);

    // Move along forward heading
    const moveStep = policeSpeed.current * delta;
    policePos.current.x += Math.sin(policeYaw.current) * moveStep;
    policePos.current.z += Math.cos(policeYaw.current) * moveStep;
    policePos.current.y = 0.0; // Keep flush with asphalt

    // Constrain within drivable city boundaries
    policePos.current.x = THREE.MathUtils.clamp(policePos.current.x, -28, 42);
    policePos.current.z = THREE.MathUtils.clamp(policePos.current.z, -74, 34);

    if (policeGroupRef.current) {
      policeGroupRef.current.position.copy(policePos.current);
      policeGroupRef.current.rotation.y = policeYaw.current;
    }
  });

  const blueLightColor = lightColorPhase ? '#00e5ff' : '#002244';
  const redLightColor = !lightColorPhase ? '#ff0033' : '#330006';

  return (
    <group ref={policeGroupRef} visible={wantedLevel >= 1}>
      {/* ── Main Cruiser Chassis & Body ── */}
      {/* Black Lower Body & Quarter Panels */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.65, 4.4]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* White Doors & Center Cabin Section (Authentic LSPD Black/White) */}
      <mesh position={[0, 0.52, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.62, 2.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Cabin Roof & Pillars */}
      <mesh position={[0, 1.05, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.58, 2.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Front Windshield */}
      <mesh position={[0, 1.02, 0.95]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[1.44, 0.56, 0.05]} />
        <meshStandardMaterial color="#050a14" roughness={0.1} metalness={0.9} transparent opacity={0.88} />
      </mesh>

      {/* Rear Window */}
      <mesh position={[0, 1.05, -1.35]} rotation={[-0.42, 0, 0]}>
        <boxGeometry args={[1.44, 0.52, 0.05]} />
        <meshStandardMaterial color="#050a14" roughness={0.1} metalness={0.9} transparent opacity={0.88} />
      </mesh>

      {/* Front Heavy-Duty Push Bumper / Bullbar */}
      <group position={[0, 0.38, 2.3]}>
        <mesh>
          <boxGeometry args={[1.4, 0.45, 0.15]} />
          <meshStandardMaterial color="#050505" roughness={0.8} metalness={0.9} />
        </mesh>
        {/* Vertical Bumper Guards */}
        {[-0.45, 0.45].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0.05]}>
            <boxGeometry args={[0.08, 0.62, 0.12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── Rooftop Emergency Lightbar (Red / Blue Strobes) ── */}
      <group position={[0, 1.38, -0.2]}>
        {/* Lightbar Base Mount */}
        <mesh>
          <boxGeometry args={[1.1, 0.08, 0.28]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.9} />
        </mesh>

        {/* Left Blue Strobe Capsule */}
        <mesh position={[-0.38, 0.06, 0]}>
          <boxGeometry args={[0.32, 0.12, 0.24]} />
          <meshBasicMaterial color={blueLightColor} />
        </mesh>

        {/* Right Red Strobe Capsule */}
        <mesh position={[0.38, 0.06, 0]}>
          <boxGeometry args={[0.32, 0.12, 0.24]} />
          <meshBasicMaterial color={redLightColor} />
        </mesh>

        {/* Center White Take-Down Lights */}
        <mesh position={[0, 0.06, 0.11]}>
          <boxGeometry args={[0.22, 0.09, 0.04]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Active Emergency Point Light Casting onto Surrounding World */}
        {wantedLevel >= 1 && (
          <>
            <pointLight
              position={[-0.4, 0.3, 0]}
              color="#00d4ff"
              intensity={lightColorPhase ? 40 : 2}
              distance={25}
              decay={2}
            />
            <pointLight
              position={[0.4, 0.3, 0]}
              color="#ff1133"
              intensity={!lightColorPhase ? 40 : 2}
              distance={25}
              decay={2}
            />
          </>
        )}
      </group>

      {/* Headlights & Tail Lights */}
      {/* Front Dual Headlights */}
      {[-0.72, 0.72].map((x, i) => (
        <group key={i} position={[x, 0.45, 2.22]}>
          <mesh>
            <boxGeometry args={[0.32, 0.18, 0.05]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
          <pointLight color="#ffffff" intensity={18} distance={20} decay={2} />
        </group>
      ))}

      {/* Rear Dual Tail Lights */}
      {[-0.72, 0.72].map((x, i) => (
        <mesh key={i} position={[x, 0.52, -2.22]}>
          <boxGeometry args={[0.28, 0.16, 0.04]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}

      {/* 4 Wheels */}
      {[
        [-0.92, 0.32, 1.3],
        [0.92, 0.32, 1.3],
        [-0.92, 0.32, -1.3],
        [0.92, 0.32, -1.3],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          {/* Black Steel Wheel Rim with Chrome Center Cap */}
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.26, 20]} />
            <meshStandardMaterial color="#0a0c10" roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[0, x > 0 ? 0.14 : -0.14, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
