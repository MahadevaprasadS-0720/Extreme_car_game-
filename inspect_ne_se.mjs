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

  scene.traverse(c => {
    if (c.isMesh && (c.name.includes('42526024010') || c.name.includes('42526024015'))) {
      const box = new THREE.Box3().setFromObject(c);
      console.log(`${c.name}: box min=`, box.min, 'max=', box.max, 'size=', box.getSize(new THREE.Vector3()));
    }
  });
});
