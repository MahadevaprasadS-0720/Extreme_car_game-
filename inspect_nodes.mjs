import fs from 'fs';

const buf = fs.readFileSync('public/models/city_track_1k.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

for (let i = 0; i < 40; i++) {
  const n = gltf.nodes[i];
  if (n) {
    console.log(`Node [${i}] "${n.name}": trans=${JSON.stringify(n.translation)}, rot=${JSON.stringify(n.rotation)}, scale=${JSON.stringify(n.scale)}, mesh=${n.mesh}`);
  }
}
