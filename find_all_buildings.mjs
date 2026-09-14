import * as THREE from 'three';
import fs from 'fs';

globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = {
  createElementNS: () => ({ style: {} }),
  createElement: () => ({ style: {} }),
};
globalThis.Image = class {
  constructor() {
    setTimeout(() => { if (this.onload) this.onload(); }, 1);
  }
};
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });
globalThis.URL = {
  createObjectURL: () => 'blob:mock',
  revokeObjectURL: () => {},
};

import('three-stdlib').then(({ GLTFLoader }) => {
  const fileBuf = fs.readFileSync('public/models/city_track_1k.glb');
  const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

  const loader = new GLTFLoader();
  loader.parse(arrayBuf, '', (gltf) => {
    const scene = gltf.scene;
    // Align city as in CityTrack.jsx
    scene.position.set(0, 0.17, 0);
    scene.updateMatrixWorld(true);

    const buildingBoxes = [];

    scene.traverse(c => {
      if (c.isMesh) {
        const mat = Array.isArray(c.material) ? c.material.map(m=>m.name).join(',') : c.material?.name;
        const name = c.name;
        
        // Skip road, trottoir, sky, ivy leaves
        if (/route|trottoir|paves|ciel|sphere|grass|ivy|plant/i.test(mat) || /route|trottoir|ciel|sphere|grass|ivy/i.test(name)) {
          return;
        }

        c.geometry.computeBoundingBox();
        const b = c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);
        const size = b.getSize(new THREE.Vector3());
        const center = b.getCenter(new THREE.Vector3());
        
        // If it's larger than 2 meters, it's a building or major barrier
        if (size.x > 2 || size.z > 2 || size.y > 3) {
          buildingBoxes.push({
            name,
            mat,
            center: [Number(center.x.toFixed(2)), Number(center.y.toFixed(2)), Number(center.z.toFixed(2))],
            size: [Number(size.x.toFixed(2)), Number(size.y.toFixed(2)), Number(size.z.toFixed(2))],
            min: [Number(b.min.x.toFixed(2)), Number(b.min.y.toFixed(2)), Number(b.min.z.toFixed(2))],
            max: [Number(b.max.x.toFixed(2)), Number(b.max.y.toFixed(2)), Number(b.max.z.toFixed(2))],
          });
        }
      }
    });

    console.log(`Found ${buildingBoxes.length} building / structure meshes:`);
    buildingBoxes.forEach((b, i) => {
      console.log(`[${i}] ${b.name} (mat: ${b.mat})`);
      console.log(`    center: [${b.center.join(', ')}]`);
      console.log(`    size:   [${b.size.join(', ')}]`);
      console.log(`    bounds: X=[${b.min[0]} to ${b.max[0]}], Y=[${b.min[1]} to ${b.max[1]}], Z=[${b.min[2]} to ${b.max[2]}]`);
    });
  });
}).catch(console.error);
