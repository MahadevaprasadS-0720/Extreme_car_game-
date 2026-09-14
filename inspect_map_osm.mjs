import fs from 'fs';

const buf = fs.readFileSync('public/models/city_track_1k.glb');
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));

const mapOsmNode = gltf.nodes[36];
console.log('map.osm children:', mapOsmNode.children);
mapOsmNode.children.forEach(cIdx => {
  const cn = gltf.nodes[cIdx];
  console.log(`  child [${cIdx}] "${cn.name}" children:`, cn.children);
  if (cn.children) {
    cn.children.forEach(subIdx => {
      const sn = gltf.nodes[subIdx];
      const m = gltf.meshes[sn.mesh];
      const mat = gltf.materials[m.primitives[0].material]?.name;
      const acc = gltf.accessors[m.primitives[0].attributes.POSITION];
      console.log(`    leaf [${subIdx}] "${sn.name}" -> Mesh [${sn.mesh}] "${m.name}" mat: "${mat}", count=${acc.count}, min=[${acc.min.map(v=>v.toFixed(1))}], max=[${acc.max.map(v=>v.toFixed(1))}]`);
    });
  }
});
