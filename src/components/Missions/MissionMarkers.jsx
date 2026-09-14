import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

/**
 * MissionMarkers
 * Renders authentic GTA 5 style 3D world beacons, race checkpoint gates, and floating cash briefcases.
 */
export function MissionMarkers({
  activeMission,
  missionStep = 0,
  vehicleStateRef,
  onMissionStepReached,
  cashPickups = [],
  onCollectCash,
}) {
  const beaconRef = useRef();
  const ringRef = useRef();
  const briefcasesRef = useRef([]);

  const currentStep = activeMission?.steps?.[missionStep];
  const targetPos = currentStep?.targetPos;
  const markerColor = currentStep?.markerColor || '#eab308';

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const vstate = vehicleStateRef?.current;
    if (!vstate || !vstate.position) return;

    const playerPos = vstate.position;

    // 1. Mission Step Proximity Check
    if (currentStep && targetPos) {
      const beaconPos = new THREE.Vector3(targetPos[0], 0, targetPos[2]);
      const dist = new THREE.Vector3(playerPos.x, 0, playerPos.z).distanceTo(beaconPos);
      const triggerRadius = currentStep.radius || 5.0;

      if (dist <= triggerRadius) {
        if (currentStep.type === 'speed_check') {
          if (vstate.speed >= (currentStep.minSpeed || 150)) {
            onMissionStepReached(missionStep);
          }
        } else {
          onMissionStepReached(missionStep);
        }
      }

      // Animate ground ring pulsing
      if (ringRef.current) {
        const scale = 1.0 + Math.sin(time * 3.5) * 0.15;
        ringRef.current.scale.set(scale, 1, scale);
      }
    }

    // 2. Cash Pickups Proximity Check & Hover Animation
    cashPickups.forEach((pickup, idx) => {
      if (pickup.collected) return;
      const cpPos = new THREE.Vector3(pickup.pos[0], 0, pickup.pos[2]);
      const dist = new THREE.Vector3(playerPos.x, 0, playerPos.z).distanceTo(cpPos);

      if (dist < 3.2) {
        audioSynthesizer.playCashChime();
        if (onCollectCash) {
          onCollectCash(pickup.id, pickup.amount);
        }
      }

      // Rotate briefcase
      const mesh = briefcasesRef.current[idx];
      if (mesh) {
        mesh.rotation.y = time * 1.8;
        mesh.position.y = pickup.pos[1] + Math.sin(time * 2.5 + idx) * 0.18;
      }
    });
  });

  return (
    <group name="gta-mission-markers">
      {/* ── Active Mission Skyward Beacon ── */}
      {targetPos && (
        <group ref={beaconRef} position={[targetPos[0], 0, targetPos[2]]}>
          {/* Glowing Ground Disk */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <circleGeometry args={[3.2, 32]} />
            <meshBasicMaterial color={markerColor} transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>

          {/* Pulsing Outer Neon Ring */}
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[3.4, 3.8, 32]} />
            <meshBasicMaterial color={markerColor} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>

          {/* Vertical Skyward Pillar Laser Beam (Reaches 45m into the clouds) */}
          <mesh position={[0, 22.5, 0]}>
            <cylinderGeometry args={[0.35, 1.4, 45, 16, 1, true]} />
            <meshBasicMaterial color={markerColor} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>

          {/* Core High-Intensity Beam */}
          <mesh position={[0, 22.5, 0]}>
            <cylinderGeometry args={[0.12, 0.25, 45, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>

          {/* Downward Floating Directional Chevron */}
          <mesh position={[0, 3.8, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.85, 1.5, 4]} />
            <meshBasicMaterial color={markerColor} />
          </mesh>

          <pointLight color={markerColor} intensity={35} distance={20} decay={2} position={[0, 2.5, 0]} />
        </group>
      )}

      {/* ── Hidden Cash Pickups (Floating Briefcases) ── */}
      {cashPickups.map((pickup, idx) => {
        if (pickup.collected) return null;
        return (
          <group
            key={pickup.id}
            position={[pickup.pos[0], pickup.pos[1], pickup.pos[2]]}
            ref={(el) => (briefcasesRef.current[idx] = el)}
          >
            {/* Briefcase Shell */}
            <mesh castShadow>
              <boxGeometry args={[0.65, 0.45, 0.2]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Metallic Handle */}
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.22, 0.08, 0.04]} />
              <meshStandardMaterial color="#22c55e" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Cash Dollar Decal Banner */}
            <mesh position={[0, 0, 0.11]}>
              <planeGeometry args={[0.35, 0.22]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
            {/* Pulsing Green Ground Light */}
            <pointLight color="#22c55e" intensity={12} distance={8} decay={2} />
          </group>
        );
      })}
    </group>
  );
}
