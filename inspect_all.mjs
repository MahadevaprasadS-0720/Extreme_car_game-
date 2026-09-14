import fs from 'fs';

const buf = fs.readFileSync('public/models/bmw_m4.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

console.log('--- ALL ROOT CHILDREN OF SCENE ---');
const scene = gltf.scenes[gltf.scene || 0];
console.log('Scene nodes:', scene.nodes);

function printTree(nodeIdx, depth = 0) {
  const n = gltf.nodes[nodeIdx];
  const indent = '  '.repeat(depth);
  let extra = '';
  if (n.translation) extra += ` trans: [${n.translation.map(v => v.toFixed(2))}]`;
  if (n.scale) extra += ` scale: [${n.scale.map(v => v.toFixed(2))}]`;
  if (n.mesh !== undefined) extra += ` mesh: ${n.mesh}`;
  console.log(`${indent}[${nodeIdx}] "${n.name}" (${n.children ? n.children.length + ' children' : 'leaf'})${extra}`);
  if (n.children && depth < 4) {
    n.children.forEach(c => printTree(c, depth + 1));
  }
}

scene.nodes.forEach(n => printTree(n, 0));
