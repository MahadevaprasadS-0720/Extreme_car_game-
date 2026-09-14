const fs = require('fs');

const buf = fs.readFileSync('public/models/city_track_1k.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

const tex = gltf.textures[19];
console.log('Tex 19:', tex);
const img = gltf.images[tex.source];
console.log('Img:', img.name, img.mimeType);
