import fs from 'fs';

const buf = fs.readFileSync('public/models/city_track_1k.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

const routeMesh = gltf.meshes[33];
const prim = routeMesh.primitives[0];
const posAcc = gltf.accessors[prim.attributes.POSITION];
const posBufferView = gltf.bufferViews[posAcc.bufferView];
const binChunkStart = 20 + jsonLen + 8;
const posByteOffset = (posBufferView.byteOffset || 0) + (posAcc.byteOffset || 0);

const indicesAcc = gltf.accessors[prim.indices];
const indBufferView = gltf.bufferViews[indicesAcc.bufferView];
const indByteOffset = (indBufferView.byteOffset || 0) + (indicesAcc.byteOffset || 0);

const vertices = [];
for (let i = 0; i < posAcc.count; i++) {
  const o = binChunkStart + posByteOffset + i * 12;
  vertices.push({
    x: buf.readFloatLE(o),
    y: buf.readFloatLE(o + 8),
    z: -buf.readFloatLE(o + 4)
  });
}

// Cluster vertices into a 2D grid (10m x 10m cells) to find the road map ASCII art
const grid = Array.from({ length: 20 }, () => Array(20).fill(' '));
// X ranges -80 to +55 (span 135) -> map to col 0 to 19
// Z ranges -68 to +85 (span 153) -> map to row 0 to 19
for (let i = 0; i < indicesAcc.count; i += 3) {
  const i0 = buf.readUInt32LE(binChunkStart + indByteOffset + i * 4);
  const i1 = buf.readUInt32LE(binChunkStart + indByteOffset + (i + 1) * 4);
  const i2 = buf.readUInt32LE(binChunkStart + indByteOffset + (i + 2) * 4);
  const cx = (vertices[i0].x + vertices[i1].x + vertices[i2].x) / 3;
  const cz = (vertices[i0].z + vertices[i1].z + vertices[i2].z) / 3;
  
  const col = Math.floor(((cx - (-80)) / 140) * 20);
  const row = Math.floor(((cz - (-70)) / 160) * 20);
  if (row >= 0 && row < 20 && col >= 0 && col < 20) {
    grid[row][col] = '#';
  }
}

console.log('Road Network ASCII Map (Top-Down X=left->right, Z=top->bottom):');
grid.forEach((r, rowIdx) => {
  const zVal = -70 + (rowIdx / 20) * 160;
  console.log(`Z=${String(Math.round(zVal)).padStart(4)} |` + r.join(''));
});
console.log('       |' + '-'.repeat(20));
console.log('       |X=-80       X=+55');
