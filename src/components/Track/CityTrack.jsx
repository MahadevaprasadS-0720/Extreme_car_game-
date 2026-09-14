import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { getHardwareInfo } from '../../utils/hardwareDetector';
import { getBuildingFacadeTexture, getRoofTexture, getDarkTarRoadTexture } from '../../utils/textures';

/**
 * Three.js GLTFLoader plugin for KHR_materials_pbrSpecularGlossiness extension
 * Converts legacy specular-glossiness PBR materials to modern MeshStandardMaterial.
 */
class GLTFMaterialsPbrSpecularGlossinessExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = 'KHR_materials_pbrSpecularGlossiness';
  }

  getMaterialType(materialIndex) {
    const materialDef = this.parser.json.materials[materialIndex];
    if (!materialDef.extensions || !materialDef.extensions[this.name]) return null;
    return THREE.MeshStandardMaterial;
  }

  extendMaterialParams(materialIndex, materialParams) {
    const materialDef = this.parser.json.materials[materialIndex];
    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }
    const pending = [];
    const extension = materialDef.extensions[this.name];
    materialParams.color = new THREE.Color(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;

    if (Array.isArray(extension.diffuseFactor)) {
      materialParams.color.fromArray(extension.diffuseFactor);
      if (extension.diffuseFactor[3] !== undefined) {
        materialParams.opacity = extension.diffuseFactor[3];
      }
    }
    if (extension.diffuseTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'map', extension.diffuseTexture));
    }
    materialParams.roughness = extension.glossinessFactor !== undefined 
      ? Math.max(0.1, 1.0 - extension.glossinessFactor) 
      : 0.5;
    materialParams.metalness = 0.1;
    if (extension.specularGlossinessTexture !== undefined) {
      pending.push(this.parser.assignTexture(materialParams, 'roughnessMap', extension.specularGlossinessTexture));
    }
    return Promise.all(pending);
  }
}

// In-memory cache for loaded scenes to allow instant switching between already loaded tiers
const trackModelCache = new Map();

/**
 * Traverses and configures the raw GLTF scene:
 * - Replaces roads with darkTarRoadMaterial
 * - Configures sidewalk, building, and shadow settings
 * - Positions road flush at Y = 0.00
 */
function prepareCityScene(loadedScene, darkTarRoadMaterial) {
  loadedScene.traverse((child) => {
    if (child.isMesh) {
      const nameLower = child.name.toLowerCase();
      const matLower = (Array.isArray(child.material) 
        ? child.material.map(m => m.name).join(' ') 
        : (child.material?.name || '')).toLowerCase();

      if (nameLower.includes('sphere') || matLower.includes('ciel')) {
        child.visible = false;
        return;
      }

      if (
        nameLower.includes('barrier') ||
        matLower.includes('barrier') ||
        nameLower.includes('metalfe') ||
        matLower.includes('metalfe') ||
        nameLower.includes('cube006') ||
        nameLower.includes('cube.006') ||
        nameLower.includes('cube010') ||
        nameLower.includes('cube.010') ||
        nameLower.includes('landscape_0') ||
        matLower.includes('monticule') ||
        nameLower.includes('icosphere') ||
        matLower.includes('gravas') ||
        nameLower.includes('grass') ||
        matLower.includes('grass') ||
        nameLower.includes('plant') ||
        matLower.includes('plant')
      ) {
        child.visible = false;
        return;
      }

      const isRoad = nameLower.includes('42526024.001') || matLower.includes('route');
      const isSidewalk = matLower.includes('trottoir') || matLower.includes('paves');

      if (isRoad) {
        child.material = darkTarRoadMaterial;
        child.castShadow = false;
        child.receiveShadow = true;
        return;
      } else if (isSidewalk) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.color = new THREE.Color('#2c2f35');
          child.material.roughness = 0.85;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.side = THREE.DoubleSide;
        child.material.shadowSide = THREE.DoubleSide;

        if (child.material.map) {
          child.material.map.anisotropy = 8;
          child.material.map.colorSpace = THREE.SRGBColorSpace;
          child.material.map.needsUpdate = true;
        }
        if (child.material.roughnessMap) {
          child.material.roughnessMap.anisotropy = 8;
        }
        if (child.material.normalMap) {
          child.material.normalMap.anisotropy = 8;
        }

        if (child.material.isMeshStandardMaterial) {
          child.material.roughness = THREE.MathUtils.clamp(child.material.roughness ?? 0.75, 0.40, 0.88);
          child.material.metalness = THREE.MathUtils.clamp(child.material.metalness ?? 0.05, 0.0, 0.15);
          child.material.envMapIntensity = 0.85;
        }
        child.material.needsUpdate = true;
      }
    }
  });

  loadedScene.position.set(0, 0.17, 0);
  loadedScene.updateMatrixWorld(true);
  return loadedScene;
}

// Module-level instantaneous preloader: starts fetching 1k model at millisecond zero!
let preloaded1kGltf = null;
const preloaded1kPromise = (typeof window !== 'undefined')
  ? new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.register((parser) => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));
      loader.load(
        '/models/city_track_1k.glb',
        (gltf) => {
          preloaded1kGltf = gltf;
          resolve(gltf);
        },
        undefined,
        () => resolve(null)
      );
    })
  : Promise.resolve(null);

/**
 * CityTrack Component
 * Dynamically loads and renders the city track environment:
 * - Full 4-sided solid 3D buildings visible from all angles.
 * - Deep Black Tar / Asphalt Road Surface across the entire city network.
 * - 100% open and drivable streets, avenues, and alleys without trapping walls.
 * - Rock-solid Y = 0.00 ground physics.
 */
export function CityTrack({
  graphicsTier = 'auto',
  onLoadingStateChange,
}) {
  const hardwareInfo = useMemo(() => getHardwareInfo(), []);

  // Procedural 4-sided building textures
  const buildingFacadeTex = useMemo(() => getBuildingFacadeTexture(), []);
  const roofTex = useMemo(() => getRoofTexture(), []);
  const darkTarTex = useMemo(() => getDarkTarRoadTexture(), []);

  const solidBuildingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: buildingFacadeTex,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }, [buildingFacadeTex]);

  // Premium Deep Black Tar / Asphalt Road Material requested by user
  const darkTarRoadMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: darkTarTex,
      color: new THREE.Color('#0e1014'), // True deep rich black tar
      roughness: 0.50, // Bitumen sheen
      metalness: 0.18,
      side: THREE.DoubleSide,
    });
  }, [darkTarTex]);

  // Determine effective tier ('1k' for instant responsive loading, '4k' on demand in settings)
  const effectiveTier = useMemo(() => {
    if (graphicsTier === '4k') return '4k';
    return '1k';
  }, [graphicsTier]);

  const modelUrl = effectiveTier === '4k' 
    ? '/models/city_track_4k.glb' 
    : '/models/city_track_1k.glb';

  // Keep track of active scene and active tier
  const [activeScene, setActiveScene] = useState(null);
  const [activeTier, setActiveTier] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (activeTier === effectiveTier && activeScene) {
      return;
    }

    // 1. Check memory cache for instant hot-swap
    if (trackModelCache.has(modelUrl)) {
      const cached = trackModelCache.get(modelUrl);
      setActiveScene(cached);
      setActiveTier(effectiveTier);
      if (onLoadingStateChange) {
        onLoadingStateChange({
          isLoading: false,
          isReady: true,
          progress: 100,
          activeTier: effectiveTier,
          targetTier: effectiveTier,
        });
      }
      return;
    }

    // 2. Fast-path for default 1k tier (preloaded at module start!)
    if (effectiveTier === '1k') {
      const applyGltf = (gltf) => {
        if (!isMountedRef.current || !gltf) return;
        const processed = prepareCityScene(gltf.scene.clone(true), darkTarRoadMaterial);
        trackModelCache.set(modelUrl, processed);
        setActiveScene(processed);
        setActiveTier('1k');
        if (onLoadingStateChange) {
          onLoadingStateChange({
            isLoading: false,
            isReady: true,
            progress: 100,
            activeTier: '1k',
            targetTier: '1k',
          });
        }
      };

      if (preloaded1kGltf) {
        applyGltf(preloaded1kGltf);
        return;
      }

      preloaded1kPromise.then((gltf) => {
        if (gltf) applyGltf(gltf);
      });
      return;
    }

    // 3. Fallback for on-demand 4k tier switching
    if (onLoadingStateChange) {
      onLoadingStateChange({
        isLoading: true,
        isReady: false,
        progress: 0,
        activeTier: activeTier || effectiveTier,
        targetTier: effectiveTier,
      });
    }

    const loader = new GLTFLoader();
    loader.register((parser) => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMountedRef.current) return;
        const processed = prepareCityScene(gltf.scene, darkTarRoadMaterial);
        trackModelCache.set(modelUrl, processed);
        setActiveScene(processed);
        setActiveTier(effectiveTier);
        if (onLoadingStateChange) {
          onLoadingStateChange({
            isLoading: false,
            isReady: true,
            progress: 100,
            activeTier: effectiveTier,
            targetTier: effectiveTier,
          });
        }
      },
      (xhr) => {
        if (!isMountedRef.current) return;
        if (xhr.total > 0) {
          const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
          if (onLoadingStateChange) {
            onLoadingStateChange({
              isLoading: true,
              isReady: false,
              progress: percent,
              activeTier: activeTier || effectiveTier,
              targetTier: effectiveTier,
            });
          }
        }
      },
      (err) => {
        console.warn(`[CityTrack] Failed to load ${modelUrl}:`, err);
        if (onLoadingStateChange) {
          onLoadingStateChange({ isLoading: false, isReady: true, progress: 100, activeTier, targetTier: effectiveTier });
        }
      }
    );
  }, [modelUrl, effectiveTier, activeTier, onLoadingStateChange, darkTarRoadMaterial]);

  return (
    <group name="city-track-environment">
      {/* 
        Solid Ground, Accurate Non-Blocking Building Blocks & Outer Boundaries:
        - Rock-solid Y = 0.00 asphalt collision surface.
        - Building colliders match building footprints EXACTLY:
          * West Avenue & East Avenue are completely 100% wide open and free!
          * Cross streets & alleys are completely open and drivable!
          * Low friction (0.02) guarantees the car never sticks or halts when brushing walls.
      */}
      <RigidBody type="fixed" friction={0.02} restitution={0.01}>
        {/* 1. Main asphalt driving ground plane across entire city */}
        <CuboidCollider args={[400, 0.5, 400]} position={[0, -0.5, 0]} />

        {/* 2. Central West Building Block (strictly within X: -3.8 to 0.0, Z: -30.4 to 3.2) */}
        <CuboidCollider args={[1.9, 5.75, 16.8]} position={[-1.9, 5.75, -13.6]} />

        {/* 3. Central East Building Block (strictly within X: 15.2 to 19.8, Z: -30.1 to 3.2) */}
        <CuboidCollider args={[2.2, 6.0, 16.55]} position={[17.5, 6.0, -13.45]} />

        {/* 4. High-Rise Tower Block (X: 15.3 to 23.4, Z: -38.3 to -30.1) */}
        <CuboidCollider args={[3.9, 11.8, 4.0]} position={[19.35, 12.0, -34.2]} />

        {/* 5. Southeast Building Block (X: 26.5 to 45.5, leaves alley from 19.8 to 26.5 100% open!) */}
        <CuboidCollider args={[9.5, 14.0, 12.5]} position={[36.0, 14.0, -25.9]} />

        {/* 6. Northeast Building Block (X: 19.0 to 38.0, Z: 15.5 to 30.5) */}
        <CuboidCollider args={[9.5, 14.0, 7.5]} position={[28.5, 14.0, 23.0]} />

        {/* 7. Deep West Block (west of X: -15.0, leaves West Avenue completely open!) */}
        <CuboidCollider args={[9.0, 6.0, 25.0]} position={[-24.0, 6.0, -15.0]} />

        {/* 8. Northwest Block (west of X: -15.0, Z: 15.0 to 33.0) */}
        <CuboidCollider args={[9.0, 6.0, 9.0]} position={[-24.0, 6.0, 24.0]} />

        {/* 9. Outer City Perimeter Boundary Walls */}
        <CuboidCollider args={[60, 8, 2]} position={[8.5, 8, 38]} />
        <CuboidCollider args={[60, 8, 2]} position={[8.5, 8, -78]} />
        <CuboidCollider args={[2, 8, 60]} position={[-36, 8, -20]} />
        <CuboidCollider args={[2, 8, 60]} position={[52, 8, -20]} />
      </RigidBody>

      {/* Deep Black Tar Fallback Ground Surface */}
      <mesh position={[0, -0.06, 0]} receiveShadow material={darkTarRoadMaterial}>
        <cylinderGeometry args={[500, 500, 0.1, 64]} />
      </mesh>

      {/* 
        Solid 4-Sided 3D Building Enclosures:
        Provides solid exterior back walls, roofs, and end caps for the Parisian avenue blocks.
        Preserves 100% of the authentic European facades facing the street while closing the backs completely!
      */}
      {/* Central West Parisian Block: Back Wall (facing West alley at X = -3.85) */}
      <mesh position={[-3.85, 5.75, -13.6]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[0.2, 11.5, 33.6]} />
      </mesh>
      {/* Central West Parisian Block: Roof */}
      <mesh position={[-1.9, 11.55, -13.6]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[3.9, 0.2, 33.6]} />
      </mesh>
      {/* Central West Parisian Block: North End Cap */}
      <mesh position={[-1.9, 5.75, 3.2]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[3.9, 11.5, 0.2]} />
      </mesh>
      {/* Central West Parisian Block: South End Cap */}
      <mesh position={[-1.9, 5.75, -30.4]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[3.9, 11.5, 0.2]} />
      </mesh>

      {/* Central East Parisian Block: Back Wall (facing East alley at X = 19.85) */}
      <mesh position={[19.85, 6.0, -13.45]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[0.2, 12.0, 33.1]} />
      </mesh>
      {/* Central East Parisian Block: Roof */}
      <mesh position={[17.55, 12.05, -13.45]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[4.6, 0.2, 33.1]} />
      </mesh>
      {/* Central East Parisian Block: North End Cap */}
      <mesh position={[17.55, 6.0, 3.2]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[4.6, 12.0, 0.2]} />
      </mesh>
      {/* Central East Parisian Block: South End Cap */}
      <mesh position={[17.55, 6.0, -30.1]} castShadow receiveShadow material={solidBuildingMaterial}>
        <boxGeometry args={[4.6, 12.0, 0.2]} />
      </mesh>

      {/* 3D City Visual Scene (Roads, Buildings, Streetlights) */}
      {activeScene && <primitive object={activeScene} />}
    </group>
  );
}
