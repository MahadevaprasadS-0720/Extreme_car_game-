const fs = require('fs');

const buf = fs.readFileSync('public/models/city_track_1k.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

const matRoute = gltf.materials.find(m => m.name === 'route');
console.log('Material route:', matRoute);

if (matRoute?.pbrMetallicRoughness?.baseColorTexture) {
  const texIdx = matRoute.pbrMetallicRoughness.baseColorTexture.index;
  console.log('Texture:', gltf.textures[texIdx]);
  const imgIdx = gltf.textures[texIdx].source;
  console.log('Image:', gltf.images[imgIdx]);
}

if (matRoute?.extensions) {
  console.log('Extensions:', matRoute.extensions);
}
