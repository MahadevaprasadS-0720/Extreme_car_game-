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

    let roadMesh;
    scene.traverse(c => {
      if (c.isMesh && (c.name.includes('42526024001_0') || c.material?.name === 'route')) {
        roadMesh = c;
      }
    });

    const pos = roadMesh.geometry.attributes.position;
    const m = roadMesh.matrixWorld;
    const v = new THREE.Vector3();
    const verts = [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      verts.push(v.clone());
    }

    console.log('Total road vertices:', verts.length);

    // Let's test multiple candidate spawn points and check forward clearance for 50 meters
    const candidates = [
      { name: 'Avenue North facing South (Z decreasing)', pos: new THREE.Vector3(5.0, 0.45, 25.0), dir: new THREE.Vector3(0, 0, -1), yaw: Math.PI },
      { name: 'Avenue South facing North (Z increasing)', pos: new THREE.Vector3(5.0, 0.45, -30.0), dir: new THREE.Vector3(0, 0, 1), yaw: 0 },
      { name: 'Main Boulevard West facing East (X increasing)', pos: new THREE.Vector3(-25.0, 0.45, -15.0), dir: new THREE.Vector3(1, 0, 0), yaw: Math.PI / 2 },
      { name: 'Main Boulevard East facing West (X decreasing)', pos: new THREE.Vector3(35.0, 0.45, -15.0), dir: new THREE.Vector3(-1, 0, 0), yaw: -Math.PI / 2 },
      { name: 'Open Plaza facing Boulevard', pos: new THREE.Vector3(18.0, 0.45, -10.0), dir: new THREE.Vector3(0, 0, -1), yaw: Math.PI },
    ];

    candidates.forEach(c => {
      // Check road vertices along this direction for 10m, 20m, 30m, 40m
      let maxClearance = 0;
      for (let dist = 5; dist <= 60; dist += 5) {
        const checkPoint = c.pos.clone().addScaledVector(c.dir, dist);
        const nearRoad = verts.filter(p => p.distanceTo(checkPoint) < 6);
        if (nearRoad.length >= 2) {
          maxClearance = dist;
        } else {
          break;
        }
      }
      console.log(`Candidate: "${c.name}" -> Road Clearance: ${maxClearance}m`);
    });
  });
}).catch(console.error);
