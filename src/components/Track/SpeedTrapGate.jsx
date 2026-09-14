import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

/**
 * SpeedTrapGate
 * Extreme Car Driving Simulator Radar Gate with overhead camera flash sensors
 */
export function SpeedTrapGate({
  position = [6.0, 0, 45],
  rotation = [0, 0, 0],
  onTriggerSpeedTrap,
  vehicleStateRef,
}) {
  const [isFlashing, setIsFlashing] = useState(false);
  const lastTriggerTime = useRef(0);
  const gatePos = useRef(new THREE.Vector3(...position)).current;

  useFrame(() => {
    const vstate = vehicleStateRef?.current;
    if (!vstate || !vstate.position) return;

    const carDist = vstate.position.distanceTo(gatePos);
    const now = Date.now();

    // Trigger radar when car crosses gate within 6m at speed > 55 km/h
    if (carDist < 6.5 && vstate.speed > 55 && now - lastTriggerTime.current > 6000) {
      lastTriggerTime.current = now;
      setIsFlashing(true);
      audioSynthesizer.playSpeedTrap();

      if (onTriggerSpeedTrap) {
        onTriggerSpeedTrap(Math.round(vstate.speed));
      }

      setTimeout(() => setIsFlashing(false), 380);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Left Pillar */}
      <mesh position={[-7.5, 3.5, 0]}>
        <boxGeometry args={[0.6, 7.0, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Left Yellow Hazard Band */}
      <mesh position={[-7.5, 2.0, 0]}>
        <boxGeometry args={[0.64, 1.2, 0.64]} />
        <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[7.5, 3.5, 0]}>
        <boxGeometry args={[0.6, 7.0, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Right Yellow Hazard Band */}
      <mesh position={[7.5, 2.0, 0]}>
        <boxGeometry args={[0.64, 1.2, 0.64]} />
        <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Overhead Crossbar Truss */}
      <mesh position={[0, 6.8, 0]}>
        <boxGeometry args={[15.6, 0.7, 0.6]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Neon Speed Radar Signboard */}
      <mesh position={[0, 6.8, 0.35]}>
        <boxGeometry args={[4.2, 0.55, 0.08]} />
        <meshBasicMaterial color="#00f2fe" />
      </mesh>

      {/* Dual High-Speed Radar Camera Housings */}
      {[-2.5, 2.5].map((x, i) => (
        <group key={i} position={[x, 6.3, 0.3]}>
          <mesh>
            <boxGeometry args={[0.6, 0.45, 0.6]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Lens */}
          <mesh position={[0, 0, 0.32]}>
            <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#050811" roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Strobe Camera Flash Emitters */}
      {isFlashing && (
        <group position={[0, 6.5, 1.0]}>
          <pointLight color="#ffffff" intensity={120} distance={45} decay={2} />
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      )}
    </group>
  );
}
