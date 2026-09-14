import * as THREE from 'three';

const v = new THREE.Vector3(0, 0, 1);
const vNeg = v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.5);
const vPos = v.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), +0.5);
console.log('Original forward (0,0,1)');
console.log('Angle -0.5: x=', vNeg.x.toFixed(2), 'z=', vNeg.z.toFixed(2));
console.log('Angle +0.5: x=', vPos.x.toFixed(2), 'z=', vPos.z.toFixed(2));
