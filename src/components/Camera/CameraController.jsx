import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * CameraController — Three camera modes toggled by [C] key:
 *  - 'chase'   : Spring-physics trailing 3rd-person with FOV 60→78 based on speed.
 *                Lateral G-force sway tilts the camera into corners for immersion.
 *  - 'hood'    : Low bonnet POV — fastened to the car's nose, dynamic FOV 68→82.
 *  - 'cockpit' : Immersive interior view with head-bob and cornering head-tilt.
 *
 * cameraTargetRef.current = { position, quaternion, forward, speed, lateralG }
 */
export function CameraController({ cameraTargetRef, mode = 'chase' }) {
  const { camera } = useThree();

  // ── Spring-physics state for chase cam ───────────────────────────────────
  const camPos     = useRef(new THREE.Vector3(0, 3.5, -8));
  const camVel     = useRef(new THREE.Vector3());
  const camLookAt  = useRef(new THREE.Vector3(0, 1.2, 0));
  const lookVel    = useRef(new THREE.Vector3());

  // Lateral sway state (spring-smoothed) for chase cam
  const swayAngle  = useRef(0);       // current roll tilt (radians)
  const swayVel    = useRef(0);       // sway velocity

  // Previous lateral speed for G-estimation
  const prevLatSpeed = useRef(0);

  // Track previous mode to snap springs on mode switch
  const prevMode = useRef(mode);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (mode !== prevMode.current) {
      camVel.current.set(0, 0, 0);
      lookVel.current.set(0, 0, 0);
      swayVel.current = 0;
      prevMode.current = mode;
      isInitialized.current = false;
    }
  }, [mode]);

  useFrame((state, delta) => {
    if (!cameraTargetRef?.current) return;

    const {
      position: carPos,
      quaternion: carQuat,
      forward,
      speed = 0,
    } = cameraTargetRef.current;

    if (!carPos || !forward) return;

    const dt = Math.min(delta, 0.05);

    // ── CHASE MODE — spring-physics trailing camera ────────────────────────
    if (mode === 'chase') {
      const speedRatio  = Math.min(1, speed / 240);

      // Speed-dependent pull-back + height: farther and higher at speed
      const distance = 7.5 + speedRatio * 2.5;   // 7.5 → 10 m behind
      const height   = 3.8 + speedRatio * 0.8;    // 3.8 → 4.6 m above

      // Ideal camera position: behind car along its current heading
      const idealPos = carPos.clone()
        .addScaledVector(forward, -distance)
        .add(new THREE.Vector3(0, height, 0));

      // Ideal look-ahead: ahead of and above the car
      const idealLookAt = carPos.clone()
        .addScaledVector(forward, 6.0)
        .add(new THREE.Vector3(0, 0.8, 0));

      if (!isInitialized.current) {
        camPos.current.copy(idealPos);
        camLookAt.current.copy(idealLookAt);
        camera.position.copy(idealPos);
        camera.lookAt(idealLookAt);
        isInitialized.current = true;
      }

      // Spring-damper for position (k=12, c=7 → slightly under-damped → nice trail)
      _springDamp(camPos.current, camVel.current, idealPos,   12, 7, dt);
      // Look-at spring (stiffer so it leads the car properly)
      _springDamp(camLookAt.current, lookVel.current, idealLookAt, 18, 9, dt);

      camera.position.copy(camPos.current);
      camera.lookAt(camLookAt.current);

      // High-speed micro-vibration (road texture feel)
      if (speed > 140) {
        const shake = (speed - 140) * 0.00025;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.4;
      }

      // Dynamic FOV: 60 at rest → 78 at 240+ km/h
      const targetFov = THREE.MathUtils.lerp(60, 78, speedRatio);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 3.5);
      camera.updateProjectionMatrix();
      return;
    }

    // ── COCKPIT / INTERIOR VIEW ───────────────────────────────────────────
    if (mode === 'cockpit') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuat);
      const up    = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuat);

      // Driver eye-point inside cabin
      const eyeLocal = new THREE.Vector3(0.22, 0.92, 0.18);
      const eyeWorld = carPos.clone()
        .addScaledVector(forward, eyeLocal.z)
        .addScaledVector(right,   eyeLocal.x)
        .addScaledVector(up,      eyeLocal.y);

      // Speed-based vertical head-bob (engine vibration)
      const t = performance.now() * 0.001;
      const bob = speed > 20
        ? Math.sin(t * (1.8 + speed * 0.008)) * 0.0035 * Math.min(speed / 80, 1)
        : 0;

      // Lateral head-tilt from cornering G (natural head sway into corners)
      const carRight = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuat);
      const lookFwd  = eyeWorld.clone().addScaledVector(forward, 60).add(new THREE.Vector3(0, -0.35, 0));
      const lookDir2 = lookFwd.clone().sub(eyeWorld).normalize();
      const latG     = lookDir2.dot(carRight) * speed * 0.0004;
      const headTilt = THREE.MathUtils.clamp(latG, -0.06, 0.06);

      camera.position.set(eyeWorld.x, eyeWorld.y + bob, eyeWorld.z);
      camera.lookAt(lookFwd);

      // Apply head tilt (roll) around forward axis
      const rollQuat = new THREE.Quaternion().setFromAxisAngle(forward, -headTilt);
      camera.quaternion.multiply(rollQuat);

      const targetFov = THREE.MathUtils.lerp(70, 78, Math.min(speed / 220, 1));
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 4.5);
      camera.updateProjectionMatrix();
      return;
    }

    // ── HOOD CAM ─────────────────────────────────────────────────────────
    if (mode === 'hood') {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuat);
      const up    = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuat);

      // Hood mount point: on front-center of bonnet above engine
      const hoodWorld = carPos.clone()
        .addScaledVector(forward, 1.9)
        .addScaledVector(up, 0.95);

      camera.position.copy(hoodWorld);

      const lookTarget = hoodWorld.clone()
        .addScaledVector(forward, 50)
        .add(new THREE.Vector3(0, 0.25, 0));
      camera.lookAt(lookTarget);

      // Speed-micro-shake at top-speed
      if (speed > 160) {
        const shake = (speed - 160) * 0.00015;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.3;
      }

      const targetFov = THREE.MathUtils.lerp(68, 82, Math.min(speed / 240, 1));
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 3);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * Spring-damper integration that mutates `pos` toward `target`.
 * @param {THREE.Vector3} pos     Current position (mutated in-place)
 * @param {THREE.Vector3} vel     Current velocity (mutated in-place)
 * @param {THREE.Vector3} target  Goal position
 * @param {number} stiffness      Spring constant k
 * @param {number} damping        Damping coefficient c
 * @param {number} dt             Delta time (s)
 */
function _springDamp(pos, vel, target, stiffness, damping, dt) {
  const dx = pos.x - target.x;
  const dy = pos.y - target.y;
  const dz = pos.z - target.z;

  vel.x += (-stiffness * dx - damping * vel.x) * dt;
  vel.y += (-stiffness * dy - damping * vel.y) * dt;
  vel.z += (-stiffness * dz - damping * vel.z) * dt;

  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
}
