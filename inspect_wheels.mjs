import fs from 'fs';

const buf = fs.readFileSync('public/models/bmw_m4.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

// Find all nodes in gltf
console.log('Total nodes:', gltf.nodes.length);

// What is node 47 (Wheel1A_3D)?
const n47 = gltf.nodes[47];
console.log('n47:', n47.name, 'trans:', n47.translation, 'rot:', n47.rotation, 'scale:', n47.scale);

// Does the file have ANY other wheel nodes?
gltf.nodes.forEach((n, i) => {
  if (n.name && (n.name.includes('Wheel') || n.name.includes('wheel') || n.name.includes('Tire') || n.name.includes('tire'))) {
    if (i !== 47 && i !== 48 && i !== 49 && !n.name.startsWith('polySurface')) {
      console.log(`Other wheel node [${i}]: "${n.name}"`);
    }
  }
});
