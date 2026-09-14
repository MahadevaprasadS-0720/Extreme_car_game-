import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// ────────────────────────────────────────────────────────────────────────────
// TIRE SMOKE  — Instanced Billboard Particle System
//
// Emits soft grey/white smoke from rear wheel contact patches during:
//   • Burnout  (throttle + speed < 45 km/h)
//   • Drift    (normalised slip > 0.24)
//
// Each particle is a billboard quad (always faces camera) in an InstancedMesh.
// Per-particle state lives in plain JS objects; Matrix4 mutated each frame.
// ────────────────────────────────────────────────────────────────────────────
const SMOKE_MAX = 400;

// Radial gradient texture — soft disc that fades out at the edges
function makeSmokeTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0.00, 'rgba(255,255,255,0.90)');
  grad.addColorStop(0.45, 'rgba(220,220,220,0.55)');
  grad.addColorStop(0.80, 'rgba(180,180,180,0.18)');
  grad.addColorStop(1.00, 'rgba(150,150,150,0.00)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function TireSmoke({ vehicleStateRef, customSmokeColor = '#e8ecf2' }) {
  const meshRef = useRef();

  const particles = useRef(
    Array.from({ length: SMOKE_MAX }, () => ({
      alive:       false,
      px: 0, py: 0, pz: 0,   // world position
      vx: 0, vy: 0, vz: 0,   // velocity
      age:         0,
      life:        0,
      baseScale:   0.15,
      tint:        1.0,       // grey shade 0–1
    }))
  ).current;

  const emitCursor = useRef(0);

  // Reusable math objects
  const _mat   = useMemo(() => new THREE.Matrix4(), []);
  const _pos   = useMemo(() => new THREE.Vector3(), []);
  const _quat  = useMemo(() => new THREE.Quaternion(), []);
  const _scale = useMemo(() => new THREE.Vector3(), []);
  const _col   = useMemo(() => new THREE.Color(), []);

  const smokeGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const smokeTex = useMemo(() => makeSmokeTexture(), []);
  const smokeMat = useMemo(() => new THREE.MeshBasicMaterial({
    map:         smokeTex,
    color:       new THREE.Color(customSmokeColor),
    transparent: true,
    opacity:     0.32,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
    side:        THREE.DoubleSide,
  }), [smokeTex, customSmokeColor]);

  function emitSmoke(px, py, pz, intensity, spreadDir) {
    if (intensity < 0.12) return;
    const p = particles[emitCursor.current % SMOKE_MAX];
    emitCursor.current++;

    p.alive = true;
    p.px = px + (Math.random() - 0.5) * 0.28;
    p.py = py + 0.04;
    p.pz = pz + (Math.random() - 0.5) * 0.28;

    const spread = 0.35 + intensity * 0.4;
    p.vx = (Math.random() - 0.5) * spread + (spreadDir?.x ?? 0) * 0.2;
    p.vy = 0.40 + Math.random() * 0.45;
    p.vz = (Math.random() - 0.5) * spread + (spreadDir?.z ?? 0) * 0.2;

    p.age  = 0;
    p.life = 0.45 + Math.random() * 0.40;
    p.baseScale = 0.12 + intensity * 0.22;
  }

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dt = Math.min(delta, 0.05);

    // ── Emit during drift, TC-off burnout, ABS-off wheel lock, or intentional handbrake burnout ──
    const vstate = vehicleStateRef?.current;
    if (vstate) {
      const { wheelContacts, slip, throttle, speed, forward, isTireSpinning, isWheelLocked, smokeColor } = vstate;
      if (smokeColor && smokeMat.color.getHexString() !== new THREE.Color(smokeColor).getHexString()) {
        smokeMat.color.set(smokeColor);
      }

      const isBurnout = (throttle && vstate.isHandbrake && speed < 30) || (isTireSpinning && speed < 45);
      const isDrifting = slip > 0.45 && speed > 18;
      const isLockedSkid = isWheelLocked && speed > 20;

      if ((isBurnout || isDrifting || isLockedSkid) && wheelContacts) {
        const intensity = isBurnout ? 0.75 : (isLockedSkid ? 0.8 : Math.min(0.7, (slip - 0.45) / 0.45));

        if (Math.random() < 0.65) {
          const startIdx = isLockedSkid ? 0 : 2; // All 4 wheels if locked skid
          for (let wi = startIdx; wi < 4; wi++) {
            const wc = wheelContacts[wi];
            if (wc?.isGrounded) {
              emitSmoke(wc.contactPoint.x, wc.contactPoint.y, wc.contactPoint.z, intensity, forward);
            }
          }
        }
      }
    }

    // ── Simulate and render particles ─────────────────────────────────────
    const camQuat = state.camera.quaternion;

    for (let i = 0; i < SMOKE_MAX; i++) {
      const p = particles[i];

      if (!p.alive) {
        _mat.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, _mat);
        continue;
      }

      p.age += dt;
      if (p.age >= p.life) {
        p.alive = false;
        _mat.makeScale(0, 0, 0);
        mesh.setMatrixAt(i, _mat);
        continue;
      }

      const t = p.age / p.life;

      // Gentle buoyant rise
      p.vy = Math.max(0.04, p.vy - 0.2 * dt);
      p.vx *= 1 - 0.6 * dt;
      p.vz *= 1 - 0.6 * dt;
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;

      // Small gentle expansion
      const sc = p.baseScale * (1 + t * 2.0);

      // Billboard
      _pos.set(p.px, p.py, p.pz);
      _quat.copy(camQuat);
      _scale.set(sc, sc, sc);
      _mat.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[smokeGeo, smokeMat, SMOKE_MAX]}
      frustumCulled={false}
      renderOrder={3}
    />
  );
}


// ────────────────────────────────────────────────────────────────────────────
// SKID MARKS  — Dual-Track Projected Quad Strip
//
// Renders two independent tyre-width tracks (one per rear wheel).
// Each track maintains its own circular buffer of SKID_MAX_SEGS segments.
// A custom ShaderMaterial with per-vertex alpha fades segments over time.
// ────────────────────────────────────────────────────────────────────────────
const SKID_MAX_SEGS  = 500;   // segments per track (×2 tracks = 1000 total)
const SKID_Y_LIFT    = 0.015; // project slightly above road (z-fight fix)
const TYRE_HALF_W    = 0.12;  // half-width of each tyre track mark

const skidVert = /* glsl */`
  attribute float alpha;
  varying   float vAlpha;
  void main() {
    vAlpha      = alpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skidFrag = /* glsl */`
  varying float vAlpha;
  void main() {
    if (vAlpha < 0.004) discard;
    // Dark rubber mark — slightly brownish near centre for realism
    gl_FragColor = vec4(0.035, 0.030, 0.025, vAlpha * 0.88);
  }
`;

/** Build one skid-mark track geometry+buffer. */
function makeSkidTrackBuffers() {
  const positions = new Float32Array(SKID_MAX_SEGS * 4 * 3);
  const alphas    = new Float32Array(SKID_MAX_SEGS * 4).fill(0);
  const indices   = new Uint32Array(SKID_MAX_SEGS * 6);
  for (let s = 0; s < SKID_MAX_SEGS; s++) {
    const v = s * 4, i = s * 6;
    indices[i + 0] = v;     indices[i + 1] = v + 2; indices[i + 2] = v + 1;
    indices[i + 3] = v + 1; indices[i + 4] = v + 2; indices[i + 5] = v + 3;
  }
  return { positions, alphas, indices };
}

export function SkidMarks({ vehicleStateRef }) {
  // Two tracks: [0] = rear-left, [1] = rear-right
  const geoRef0    = useRef();
  const geoRef1    = useRef();
  const meshRef0   = useRef();
  const meshRef1   = useRef();
  const headSeg0   = useRef(0);
  const headSeg1   = useRef(0);
  const wasSkidRef = useRef(false);
  const prevPt0    = useRef(null);
  const prevPt1    = useRef(null);

  // Gathered into arrays for loop access
  const geoRefs  = [geoRef0,  geoRef1];
  const meshRefs = [meshRef0, meshRef1];
  const headSegs = [headSeg0, headSeg1];
  const prevPts  = [prevPt0,  prevPt1];

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader:   skidVert,
    fragmentShader: skidFrag,
    transparent:    true,
    depthWrite:     false,
    side:           THREE.DoubleSide,
    polygonOffset:  true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits:  -2,
  }), []);

  // Per-track buffers
  const tracks = useMemo(() => [makeSkidTrackBuffers(), makeSkidTrackBuffers()], []);

  const FADE_RATE = 0.0015; // alpha decrease per frame

  useFrame(() => {
    // Fade both tracks
    for (let t = 0; t < 2; t++) {
      const geo = geoRefs[t].current;
      if (!geo) continue;
      const { alphas } = tracks[t];
      let dirty = false;
      for (let i = 0; i < alphas.length; i++) {
        if (alphas[i] > 0) {
          alphas[i] = Math.max(0, alphas[i] - FADE_RATE);
          dirty = true;
        }
      }
      if (dirty && geo.attributes.alpha) {
        geo.attributes.alpha.needsUpdate = true;
      }
    }

    if (!vehicleStateRef?.current) return;
    const { wheelContacts, slip, speed, isHandbrake } = vehicleStateRef.current;
    // Only skid on genuine hard slide or handbrake drift, not casual turns
    const isSkidding = (slip > 0.48 || (isHandbrake && speed > 15)) && speed > 12;

    if (!isSkidding) {
      wasSkidRef.current = false;
      prevPts[0].current = null;
      prevPts[1].current = null;
      return;
    }

    const wheels = [wheelContacts?.[2], wheelContacts?.[3]]; // RL, RR

    for (let t = 0; t < 2; t++) {
      const wc = wheels[t];
      if (!wc?.isGrounded) continue;

      const geo = geoRefs[t].current;
      if (!geo) continue;

      const { positions, alphas, indices } = tracks[t];

      // Lift contact point above road surface
      const cp = wc.contactPoint.clone().addScaledVector(wc.normal, SKID_Y_LIFT);

      // Compute tyre-width offset so each track is one tyre-width wide
      // We approximate lateral direction from the normal cross forward
      const fwd = vehicleStateRef.current.forward ?? new THREE.Vector3(0, 0, 1);
      const lateralDir = new THREE.Vector3().crossVectors(wc.normal, fwd).normalize();

      const cpL = cp.clone().addScaledVector(lateralDir, -TYRE_HALF_W);
      const cpR = cp.clone().addScaledVector(lateralDir,  TYRE_HALF_W);

      if (!prevPts[t].current) {
        // First frame — seed prev without writing a segment
        prevPts[t].current = { L: cpL, R: cpR };
        continue;
      }

      const { L: pL, R: pR } = prevPts[t].current;

      // Write segment into circular buffer
      const seg = headSegs[t].current % SKID_MAX_SEGS;
      const pb  = seg * 4 * 3;
      const ab  = seg * 4;

      // v0: prevL, v1: prevR, v2: curL, v3: curR
      positions[pb + 0]  = pL.x; positions[pb + 1]  = pL.y; positions[pb + 2]  = pL.z;
      positions[pb + 3]  = pR.x; positions[pb + 4]  = pR.y; positions[pb + 5]  = pR.z;
      positions[pb + 6]  = cpL.x; positions[pb + 7] = cpL.y; positions[pb + 8] = cpL.z;
      positions[pb + 9]  = cpR.x; positions[pb + 10]= cpR.y; positions[pb + 11]= cpR.z;

      // Alpha: 1 when slip is high, scales with slip intensity
      const slipIntensity = Math.min(1, (slip - 0.26) / 0.74);
      const markAlpha = 0.72 + slipIntensity * 0.28;
      alphas[ab] = alphas[ab+1] = alphas[ab+2] = alphas[ab+3] = markAlpha;

      headSegs[t].current++;
      prevPts[t].current = { L: cpL, R: cpR };

      if (geo.attributes.position) geo.attributes.position.needsUpdate = true;
      if (geo.attributes.alpha)    geo.attributes.alpha.needsUpdate    = true;
    }

    wasSkidRef.current = true;
  });

  return (
    <group>
      {[0, 1].map((t) => (
        <mesh key={t} ref={meshRefs[t]} frustumCulled={false} renderOrder={2}>
          <bufferGeometry ref={geoRefs[t]}>
            <bufferAttribute
              attach="index"
              array={tracks[t].indices}
              count={tracks[t].indices.length}
              itemSize={1}
            />
            <bufferAttribute
              attach="attributes-position"
              array={tracks[t].positions}
              count={SKID_MAX_SEGS * 4}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
            <bufferAttribute
              attach="attributes-alpha"
              array={tracks[t].alphas}
              count={SKID_MAX_SEGS * 4}
              itemSize={1}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
