import * as THREE from 'three';
import fs from 'fs';

globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) };
globalThis.Image = class { constructor() { setTimeout(() => { if (this.onload) this.onload(); }, 1); } };
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });
globalThis.URL = { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} };

import('three-stdlib').then(({ GLTFLoader }) => {
  const fileBuf = fs.readFileSync('public/models/city_track_1k.glb');
  const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);

  const loader = new GLTFLoader();
  loader.parse(arrayBuf, '', (gltf) => {
    const scene = gltf.scene;
    scene.position.set(0, 0.17, 0);
    scene.updateMatrixWorld(true);

    const bldgs = [];
    scene.traverse(c => {
      if (c.isMesh) {
        const mat = Array.isArray(c.material) ? c.material.map(m=>m.name).join(',') : c.material?.name;
        // Check if building
        if (/batiment|derelict|house|residential|shop|tower|wall/i.test(mat) || /batiment|derelict|house|residential|shop|tower|wall/i.test(c.name)) {
          const b = new THREE.Box3().setFromObject(c);
          const sz = b.getSize(new THREE.Vector3());
          const ctr = b.getCenter(new THREE.Vector3());
          bldgs.push({ name: c.name, mat, b, sz, ctr });
        }
      }
    });

    console.log(`Found ${bldgs.length} building meshes:`);
    for (const b of bldgs) {
      console.log(`- ${b.name}: center=[${b.ctr.x.toFixed(1)}, ${b.ctr.y.toFixed(1)}, ${b.ctr.z.toFixed(1)}], size=[${b.sz.x.toFixed(1)}, ${b.sz.y.toFixed(1)}, ${b.sz.z.toFixed(1)}], X=[${b.b.min.x.toFixed(1)}, ${b.b.max.x.toFixed(1)}], Z=[${b.b.min.z.toFixed(1)}, ${b.b.max.z.toFixed(1)}]`);
    }
  });
}).catch(console.error);
