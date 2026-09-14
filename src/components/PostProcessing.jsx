import React from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing';

export function PostProcessing({
  speed = 0,
  enableBloom = true,
  enableMotionFX = true,
  enableVignette = true,
}) {
  if (!enableBloom && !enableMotionFX && !enableVignette) {
    return null;
  }

  // Chromatic aberration offset scales dynamically with car speed
  const normalizedSpeed = Math.min(Math.max(speed / 220, 0), 1);
  const chromOffset = enableMotionFX
    ? 0.0003 + Math.pow(normalizedSpeed, 2) * 0.0028
    : 0.0003;

  return (
    <EffectComposer multisampling={0}>
      {enableBloom && (
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.3}
        />
      )}

      {enableMotionFX && (
        <ChromaticAberration
          offset={new THREE.Vector2(chromOffset, chromOffset)}
          radialModulation={true}
          modulationOffset={0.4}
        />
      )}

      {enableVignette && (
        <Vignette
          eskil={false}
          offset={0.15}
          darkness={0.6}
        />
      )}
    </EffectComposer>
  );
}
