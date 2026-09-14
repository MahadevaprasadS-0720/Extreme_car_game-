import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

/**
 * Custom hook to load a GLTF/GLB vehicle model with error resilience.
 * Searching for `/models/bmw_m4.glb`.
 * If found, auto-scales, centers, and prepares meshes with shadow casting.
 * If not found (404/SPA text/html fallback), cleanly falls back to procedural BMW M4.
 */
export function useVehicleModel(modelUrl = '/models/bmw_m4.glb') {
  const [modelData, setModelData] = useState({
    scene: null,
    isLoading: true,
    isAvailable: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadModel() {
      try {
        // 1. Verify existence and content type to prevent Vite SPA HTML fallback from crashing GLTF parser
        const res = await fetch(modelUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-100' },
          signal: controller.signal,
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('text/html')) {
          throw new Error(`Model asset not present at ${modelUrl} (status: ${res.status}, type: ${contentType})`);
        }

        // 2. Load GLB model via GLTFLoader
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (!isMounted) return;

            const loadedScene = gltf.scene;

            // Compute bounding box to normalize scale and center model
            const box = new THREE.Box3().setFromObject(loadedScene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Target BMW M4 Competition dimensions: ~4.7m length, ~1.9m width, ~1.4m height
            const targetLength = 4.7;
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0.1 && (maxDim < 2.0 || maxDim > 8.0)) {
              const scaleFactor = targetLength / (size.z > size.x ? size.z : size.x);
              loadedScene.scale.setScalar(scaleFactor);
            }

            // Center model horizontally and seat tires on ground level (y=0)
            const updatedBox = new THREE.Box3().setFromObject(loadedScene);
            const updatedCenter = updatedBox.getCenter(new THREE.Vector3());
            loadedScene.position.x -= updatedCenter.x;
            loadedScene.position.z -= updatedCenter.z;
            loadedScene.position.y -= updatedBox.min.y;

            // Enable shadows on all child meshes
            loadedScene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material.side = THREE.DoubleSide;
                }
              }
            });

            setModelData({
              scene: loadedScene,
              isLoading: false,
              isAvailable: true,
              progress: 100,
              error: null,
            });
          },
          (xhr) => {
            if (!isMounted) return;
            if (xhr.total > 0) {
              const percent = Math.round((xhr.loaded / xhr.total) * 100);
              setModelData((prev) => ({ ...prev, progress: percent }));
            }
          },
          (err) => {
            if (!isMounted) return;
            setModelData({
              scene: null,
              isLoading: false,
              isAvailable: false,
              progress: 0,
              error: err.message || 'GLTF Parsing Error',
            });
          }
        );
      } catch (err) {
        if (!isMounted) return;
        // Graceful fallback to procedural BMW M4 Competition Coupe
        setModelData({
          scene: null,
          isLoading: false,
          isAvailable: false,
          progress: 0,
          error: err.name === 'AbortError' ? null : err.message,
        });
      }
    }

    loadModel();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [modelUrl]);

  return modelData;
}
