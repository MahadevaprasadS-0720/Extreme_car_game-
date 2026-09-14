import fs from 'fs';

const buf = fs.readFileSync('public/models/city_track_4k.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
console.log('4K GLB meshes:', gltf.meshes.length, 'materials:', gltf.materials.length, 'textures:', gltf.textures?.length, 'images:', gltf.images?.length);
console.log('File size:', (buf.length / 1024 / 1024).toFixed(1), 'MB');

// Check texture names and mime types
if (gltf.images) {
  console.log('Images count:', gltf.images.length);
  gltf.images.slice(0, 10).forEach((img, i) => {
    console.log(`  [${i}] ${img.name || 'unnamed'} mime: ${img.mimeType} bufferView: ${img.bufferView}`);
  });
}
