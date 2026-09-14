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
    scene.position.set(0, 0.17, 0);
    scene.updateMatrixWorld(true);

    let buildingMeshCount = 0;
    let totalBuildingVerts = 0;
    let totalBuildingTris = 0;

    scene.traverse(c => {
      if (c.isMesh) {
        const mat = Array.isArray(c.material) ? c.material.map(m=>m.name).join(',') : c.material?.name;
        const name = c.name;
        if (/route|ciel|sphere|grass|ivy|plant/i.test(mat) || /route|ciel|sphere|grass|ivy/i.test(name)) {
          return;
        }
        buildingMeshCount++;
        totalBuildingVerts += c.geometry.attributes.position.count;
        if (c.geometry.index) {
          totalBuildingTris += c.geometry.index.count / 3;
        } else {
          totalBuildingTris += c.geometry.attributes.position.count / 3;
        }
      }
    });

    console.log(`Total building meshes: ${buildingMeshCount}`);
    console.log(`Total building vertices: ${totalBuildingVerts}`);
    console.log(`Total building triangles: ${totalBuildingTris}`);
  });
}).catch(console.error);
