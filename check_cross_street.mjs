import * as THREE from 'three';
import fs from 'fs';

globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) };
globalThis.Image = class { constructor() { setTimeout(() => { if (this.onload) this.onload(); }, 1); } };
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });
globalThis.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };

const { GLTFLoader } = await import('three-stdlib');
const fileBuf = fs.readFileSync('public/models/city_track_1k.glb');
const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  const scene = gltf.scene;
  scene.position.set(0, 0.17, 0);
  scene.updateMatrixWorld(true);

  // Check all meshes around Z = -5 to 5, X = -30 to 5
  scene.traverse(c => {
    if (c.isMesh) {
      const b = new THREE.Box3().setFromObject(c);
      if (b.min.x < 5 && b.max.x > -30 && b.min.z < 10 && b.max.z > -10) {
        console.log(`Mesh: ${c.name} | mat: ${c.material?.name} | X=[${b.min.x.toFixed(1)}, ${b.max.x.toFixed(1)}], Z=[${b.min.z.toFixed(1)}, ${b.max.z.toFixed(1)}], Y=[${b.min.y.toFixed(1)}, ${b.max.y.toFixed(1)}]`);
      }
    }
  });
});
