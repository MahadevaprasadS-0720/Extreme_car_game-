import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Sky, Environment, Lightformer } from '@react-three/drei';

export function EnvironmentSky({ timeOfDay = 'sunset' }) {
  // Preset lighting parameters
  const config = useMemo(() => {
    switch (timeOfDay) {
      case 'daylight':
        return {
          sunPosition: [120, 180, -90],
          sunColor: '#fffaf0',
          sunIntensity: 3.2,
          ambientColor: '#d6e8ff',
          ambientIntensity: 0.8,
          turbidity: 4,
          rayleigh: 0.6,
          mieCoefficient: 0.005,
          mieDirectionalG: 0.8,
          fogColor: '#9ec7f5',
          fogDensity: 0.0015,
          lightformerColor1: '#ffffff',
          lightformerColor2: '#b8dcff',
        };
      case 'night':
        return {
          sunPosition: [0, -30, 0],
          sunColor: '#101626',
          sunIntensity: 0.05,
          ambientColor: '#0a1020',
          ambientIntensity: 0.35,
          turbidity: 10,
          rayleigh: 0.1,
          mieCoefficient: 0.02,
          mieDirectionalG: 0.9,
          fogColor: '#060a12',
          fogDensity: 0.0035,
          lightformerColor1: '#1e3a8a',
          lightformerColor2: '#00f2fe',
        };
      case 'sunset':
      default:
        return {
          sunPosition: [180, 28, -140],
          sunColor: '#ffaa66',
          sunIntensity: 3.4,
          ambientColor: '#8899aa',
          ambientIntensity: 0.55,
          turbidity: 7.0,
          rayleigh: 2.2,
          mieCoefficient: 0.01,
          mieDirectionalG: 0.85,
          fogColor: '#45323c',
          fogDensity: 0.0018,
          lightformerColor1: '#ffaa55',
          lightformerColor2: '#ff6633',
        };
    }
  }, [timeOfDay]);

  return (
    <>
      {/* Skybox with atmospheric scattering */}
      {timeOfDay !== 'night' ? (
        <Sky
          distance={450000}
          sunPosition={config.sunPosition}
          turbidity={config.turbidity}
          rayleigh={config.rayleigh}
          mieCoefficient={config.mieCoefficient}
          mieDirectionalG={config.mieDirectionalG}
        />
      ) : (
        <color attach="background" args={['#050811']} />
      )}

      {/* Atmospheric distance fog */}
      <fogExp2 attach="fog" args={[config.fogColor, config.fogDensity]} />

      {/* Procedural GPU Environment Reflection Map - Zero External Network Latency */}
      <Environment background={false}>
        <Lightformer
          form="rect"
          intensity={2.5}
          position={[0, 25, 0]}
          scale={[50, 50, 1]}
          color={config.lightformerColor1}
        />
        <Lightformer
          form="circle"
          intensity={3.0}
          position={[40, 15, -40]}
          scale={[25, 25, 1]}
          color={config.lightformerColor1}
        />
        <Lightformer
          form="circle"
          intensity={2.0}
          position={[-40, 15, 40]}
          scale={[25, 25, 1]}
          color={config.lightformerColor2}
        />
      </Environment>

      {/* Ambient Fill Light */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />

      {/* Cascading Directional Sunlight with Soft PCF Shadows */}
      <directionalLight
        position={config.sunPosition}
        color={config.sunColor}
        intensity={config.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={10}
        shadow-camera-far={600}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
      />
    </>
  );
}
