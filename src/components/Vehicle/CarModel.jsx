import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { getCarbonFiberTexture } from '../../utils/textures';

const MODEL_PATH = '/models/bmw_m4.glb';

export function CarModel({
  isBraking = false,
  isHeadlightsOn = true,
  carColor = '#004f38',
  isBoosting = false,
  underglowColor = '#6b17d9',
  rimColor = '#111317',
  windowTint = 0.92,
  damageLevel = 0,
}) {
  const { scene } = useGLTF(MODEL_PATH);

  // Custom PBR Car Paint Material with glossy automotive clearcoat (scratches when damaged)
  const paintMaterial = useMemo(() => {
    const damageFactor = Math.min(1.0, damageLevel / 100);
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(carColor),
      metalness: 0.85 - damageFactor * 0.25,
      roughness: 0.15 + damageFactor * 0.38,
      clearcoat: Math.max(0.1, 1.0 - damageFactor * 0.65),
      clearcoatRoughness: 0.08 + damageFactor * 0.25,
      reflectivity: 0.9 - damageFactor * 0.3,
      envMapIntensity: 2.2,
    });
  }, [carColor, damageLevel]);

  // Carbon Fiber Composite Material for aerodynamic trim
  const carbonMaterial = useMemo(() => {
    const tex = getCarbonFiberTexture();
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.28,
      metalness: 0.65,
      envMapIntensity: 1.8,
    });
  }, []);

  // Custom Rim Material
  const wheelRimMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(rimColor),
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 2.0,
    });
  }, [rimColor]);

  // Tinted Automotive Glass Material with transmission & smooth reflection
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0a1118'),
      roughness: 0.04,
      metalness: 0.1,
      transmission: Math.max(0.05, 1.0 - windowTint * 0.8),
      thickness: 0.7,
      ior: 1.52,
      transparent: true,
      opacity: Math.max(0.85, windowTint),
      reflectivity: 0.95,
      envMapIntensity: 2.5,
    });
  }, [windowTint]);

  // Emissive LED Headlights Material with bloom glow
  const headlightMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#c8f5ff'),
      emissiveIntensity: isHeadlightsOn ? 3.0 : 0.6,
      toneMapped: false,
    });
  }, [isHeadlightsOn]);

  // Emissive 3D Taillights Material with bloom glow and braking intensification
  const taillightMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ff0033'),
      emissive: new THREE.Color('#ff0033'),
      emissiveIntensity: isBraking ? 6.5 : 3.0,
      toneMapped: false,
    });
  }, [isBraking]);

  // Gloss Shadowline Black Accent Material
  const shadowlineMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0a0b0e'),
      metalness: 0.9,
      roughness: 0.18,
    });
  }, []);

  // Single clean normalized GLB model instance
  const normalizedScene = useMemo(() => {
    if (!scene) return null;

    // Deep clone the GLTF scene
    const cloned = scene.clone(true);

    // Apply PBR materials and enable shadows across all meshes
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const matName = (child.material?.name || '').toLowerCase();
        const nodeName = (child.name || '').toLowerCase();

        // 1. Primary Car Body Paint
        if (
          matName.includes('paint_material') ||
          nodeName.includes('paint_geo_loda_bmw_m4csl') ||
          matName === 'bmw_m4cslrewardrecycled_2022paint_material' ||
          (matName.includes('paint') && !matName.includes('black') && !matName.includes('red'))
        ) {
          child.material = paintMaterial;
        }
        // 2. Wheel Rims / Alloys
        else if (
          matName.includes('wheel') ||
          matName.includes('rim') ||
          nodeName.includes('wheel') ||
          nodeName.includes('rim')
        ) {
          child.material = wheelRimMaterial;
        }
        // 3. Tinted Glass & Windows
        else if (
          matName.includes('window') ||
          nodeName.includes('window') ||
          (matName.includes('glass') && !matName.includes('red'))
        ) {
          child.material = glassMaterial;
        }
        // 4. Taillights & Rear Red Glass Emissives
        else if (
          matName.includes('red_glass') ||
          nodeName.includes('red_glass') ||
          matName.includes('taillight') ||
          matName.includes('brakelight')
        ) {
          child.material = taillightMaterial;
        }
        // 5. Headlights & Front Lighting Emissives
        else if (
          matName.includes('lighta_material') ||
          nodeName.includes('light_geo') ||
          matName.includes('headlight')
        ) {
          child.material = headlightMaterial;
        }
        // 6. Carbon Fiber aero components
        else if (
          matName.includes('carbon') ||
          nodeName.includes('carbon') ||
          matName.includes('diffuser') ||
          matName.includes('spoiler')
        ) {
          child.material = carbonMaterial;
        }
        // 7. Shadowline Black trim & grilles
        else if (
          matName.includes('black_paint') ||
          matName.includes('grille') ||
          matName.includes('base_material')
        ) {
          child.material = shadowlineMaterial;
        }
      }
    });

    // Scale to authentic BMW M4 size (4.75m length) counteracting FBX 0.01 scale
    cloned.scale.setScalar(100.0);
    cloned.updateMatrixWorld(true);

    // Center GLB model pivot at [0, 0, 0] using Box3.setFromObject
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());

    // Center horizontally at [0, 0, 0]
    cloned.position.x = -center.x;
    cloned.position.z = -center.z;
    // Adjust chassis offset so the tires sit flush on the road at y = 0.00
    cloned.position.y = -box.min.y;

    return cloned;
  }, [
    scene,
    paintMaterial,
    carbonMaterial,
    wheelRimMaterial,
    glassMaterial,
    headlightMaterial,
    taillightMaterial,
    shadowlineMaterial,
  ]);

  const hasUnderglow = underglowColor && underglowColor !== 'none' && underglowColor !== 'transparent';

  return (
    <group position={[0, 0, 0]}>
      {/* Single Clean Visual Instance */}
      {normalizedScene && <primitive object={normalizedScene} />}

      {/* Dynamic Forward Headlight Projectors */}
      {isHeadlightsOn && (
        <group>
          <spotLight
            position={[-0.65, 0.72, 2.1]}
            target-position={[-0.8, -0.4, 45]}
            angle={0.48}
            penumbra={0.5}
            intensity={60}
            distance={90}
            color="#e0f6ff"
            castShadow
          />
          <spotLight
            position={[0.65, 0.72, 2.1]}
            target-position={[0.8, -0.4, 45]}
            angle={0.48}
            penumbra={0.5}
            intensity={60}
            distance={90}
            color="#e0f6ff"
            castShadow
          />
        </group>
      )}

      {/* ── Neon Underglow Chassis Illumination (Extreme Tuning) ── */}
      {hasUnderglow && (
        <group position={[0, 0.12, 0]}>
          {/* Central Ground Light Bloom */}
          <pointLight
            position={[0, 0.05, 0.2]}
            color={underglowColor}
            intensity={22}
            distance={5.5}
            decay={2}
          />
          {/* Front & Rear Underglow Fill */}
          <pointLight
            position={[0, 0.05, 1.4]}
            color={underglowColor}
            intensity={14}
            distance={4.0}
            decay={2}
          />
          <pointLight
            position={[0, 0.05, -1.3]}
            color={underglowColor}
            intensity={14}
            distance={4.0}
            decay={2}
          />

          {/* Left Side Skirt LED Tube */}
          <mesh position={[-0.82, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2.6, 8]} />
            <meshBasicMaterial color={underglowColor} />
          </mesh>

          {/* Right Side Skirt LED Tube */}
          <mesh position={[0.82, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 2.6, 8]} />
            <meshBasicMaterial color={underglowColor} />
          </mesh>
        </group>
      )}

      {/* ── Nitro Boost Dual/Quad Exhaust Flames ── */}
      {isBoosting && (
        <group position={[0, 0.32, -2.18]}>
          {/* Quad Exhaust Tailpipe Flame Jets */}
          {[-0.48, -0.36, 0.36, 0.48].map((xOffset, i) => (
            <group key={i} position={[xOffset, 0, 0]}>
              {/* Inner supersonic cyan-blue plasma jet */}
              <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.07, 0.7, 8]} />
                <meshBasicMaterial color="#00d4ff" />
              </mesh>
              {/* Outer flame orange-magenta fire plume */}
              <mesh position={[0, 0, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.11, 0.95, 8]} />
                <meshBasicMaterial color="#ff5500" transparent opacity={0.82} />
              </mesh>
            </group>
          ))}

          {/* Dynamic Night Exhaust Light Flare */}
          <pointLight
            position={[0, 0, -0.5]}
            color="#00f2fe"
            intensity={28}
            distance={7.0}
            decay={2}
          />
        </group>
      )}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);
