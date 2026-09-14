import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, useRapier } from '@react-three/rapier';
import { CarModel } from './CarModel';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

// City Track Spawn Constants (Central Grand Avenue, facing +Z straight down the open 60m boulevard)
const CITY_SPAWN_POINT = new THREE.Vector3(6.0, 0.0, -28.0);
const CITY_SPAWN_YAW = 0.0;

// Suspension & Vehicle Constants
const VEHICLE_MASS = 1450; // kg (BMW M4 CSL curb weight)
const WHEEL_BASE = 2.85;   // m
const TRACK_WIDTH = 1.62;  // m
const MAX_SPEED_KMH = 285; // km/h top speed

// Independent 4-Wheel Local Anchor Offsets
const WHEEL_OFFSETS = [
  { id: 'FL', x: -0.85, z: 1.35, isFront: true, isLeft: true },
  { id: 'FR', x: 0.85, z: 1.35, isFront: true, isLeft: false },
  { id: 'RL', x: -0.88, z: -1.30, isFront: false, isLeft: true },
  { id: 'RR', x: 0.88, z: -1.30, isFront: false, isLeft: false },
];

export function Car({
  onTelemetryUpdate,
  onLapComplete,
  isHeadlightsOn = true,
  carColor = '#004f38',
  cameraTargetRef,
  vehicleStateRef,
  drivingAssists = { abs: true, tc: true, esp: true },
  drivingMode = 'simulator',
  virtualInputs = {},
  isNitroActive = false,
  onNitroFuelUpdate,
  damageLevel = 0,
  onCollisionImpact,
  underglowColor = '#6b17d9',
  smokeColor = '#ffffff',
  rimColor = '#111317',
  windowTint = 0.92,
}) {
  const rigidBodyRef = useRef();
  const visualGroupRef = useRef();
  const { world, rapier } = useRapier();

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
  });

  // Dynamic physics states
  const currentSteerAngle = useRef(0);
  const currentForwardSpeed = useRef(0);
  const currentLateralSpeed = useRef(0);
  const visualPitch = useRef(0);
  const visualRoll = useRef(0);

  // Nitro Fuel Tank (0 to 100)
  const nitroFuel = useRef(100);
  const isCurrentlyBoosting = useRef(false);

  // Real-time Drift Tracker
  const driftScore = useRef(0);
  const driftDuration = useRef(0);
  const driftMultiplier = useRef(1.0);
  const totalDriftBank = useRef(0);

  const [carVisualState, setCarVisualState] = useState({
    steeringAngle: 0,
    speed: 0,
    isBraking: false,
    isBoosting: false,
  });

  // Track & Lap Progress
  const lapStartTime = useRef(Date.now());
  const hasPassedMidpoint = useRef(false);
  const currentLap = useRef(1);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      audioSynthesizer.resume();

      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        keys.current.forward = true;
      } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        keys.current.backward = true;
      }

      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        keys.current.left = true;
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        keys.current.right = true;
      }

      if (code === 'Space' || key === ' ' || key === 'space') {
        keys.current.handbrake = true;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyN' || key === 'shift' || key === 'n') {
        keys.current.nitro = true;
      }
      if (code === 'KeyR' || key === 'r') {
        resetCar();
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'arrowup') {
        keys.current.forward = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'arrowdown') {
        keys.current.backward = false;
      }
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        keys.current.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        keys.current.right = false;
      }
      if (code === 'Space' || key === ' ' || key === 'space') {
        keys.current.handbrake = false;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyN' || key === 'shift' || key === 'n') {
        keys.current.nitro = false;
      }
    };

    const handleBlur = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.handbrake = false;
      keys.current.nitro = false;
    };

    const handlePointerDown = () => {
      window.focus();
      audioSynthesizer.resume();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const resetCar = () => {
    if (!rigidBodyRef.current) return;
    rigidBodyRef.current.setTranslation({ x: CITY_SPAWN_POINT.x, y: CITY_SPAWN_POINT.y, z: CITY_SPAWN_POINT.z }, true);
    const rot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), CITY_SPAWN_YAW);
    rigidBodyRef.current.setRotation(rot, true);
    rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    currentSteerAngle.current = 0;
    currentForwardSpeed.current = 0;
    currentLateralSpeed.current = 0;
    visualPitch.current = 0;
    visualRoll.current = 0;
    if (visualGroupRef.current) {
      visualGroupRef.current.rotation.set(0, 0, 0);
    }
  };

  // Reusable 3D math vectors
  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;
  const upVec = useRef(new THREE.Vector3(0, 1, 0)).current;
  const carPos = useRef(new THREE.Vector3()).current;
  const carQuat = useRef(new THREE.Quaternion()).current;

  // Wheel state cache for VehicleFX (smoke + skids)
  const wheelsState = useRef(
    WHEEL_OFFSETS.map((wp) => ({
      ...wp,
      contactPoint: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 1, 0),
      isGrounded: true,
    }))
  ).current;

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || !world || !rapier) return;

    // Clamp delta to prevent physics jumps on frame hiccups
    const dt = Math.min(delta, 0.05);

    const rb = rigidBodyRef.current;
    const trans = rb.translation();
    const rot = rb.rotation();

    carPos.set(trans.x, trans.y, trans.z);
    carQuat.set(rot.x, rot.y, rot.z, rot.w);

    // Auto-rescue if car falls below track
    if (trans.y < -5.0) {
      resetCar();
      return;
    }

    // Vehicle forward & right vectors in world space
    forwardVec.set(0, 0, 1).applyQuaternion(carQuat).normalize();
    rightVec.set(1, 0, 0).applyQuaternion(carQuat).normalize();

    // =========================================================================
    // 1. ROCK-SOLID GROUND ALIGNMENT (Y = 0.00 ASPHALT CONTACT — ZERO BOUNCE/DANCE)
    // =========================================================================
    const roadSurfaceY = 0.0;
    const targetChassisY = 0.0;

    // Firmly maintain car tires on the ground: prevent vertical floating, clipping, or dancing
    if (Math.abs(trans.y - targetChassisY) > 0.0001) {
      rb.setTranslation({ x: trans.x, y: targetChassisY, z: trans.z }, true);
      carPos.y = targetChassisY;
    }

    // =========================================================================
    // 2. INPUT UNION (KEYBOARD + VIRTUAL TOUCH PEDALS)
    // =========================================================================
    const fwdInput = keys.current.forward || Boolean(virtualInputs?.forward);
    const bwdInput = keys.current.backward || Boolean(virtualInputs?.backward);
    const leftInput = keys.current.left || Boolean(virtualInputs?.left);
    const rightInput = keys.current.right || Boolean(virtualInputs?.right);
    const handbrakeInput = keys.current.handbrake || Boolean(virtualInputs?.handbrake);
    const nitroInput = keys.current.nitro || Boolean(virtualInputs?.nitro) || isNitroActive;

    // =========================================================================
    // 3. NITRO (NOS) BOOST & FUEL MECHANIC
    // =========================================================================
    const speedKmh = Math.abs(currentForwardSpeed.current) * 3.6;
    const isDriftingNow = driftScore.current > 0;
    const canBoost = nitroInput && nitroFuel.current > 0 && fwdInput;

    if (canBoost) {
      nitroFuel.current = Math.max(0, nitroFuel.current - 26 * dt);
      if (!isCurrentlyBoosting.current) {
        isCurrentlyBoosting.current = true;
        audioSynthesizer.playNitro(true);
      }
    } else {
      // Auto-recharge tank over time (recharges 2x faster when drifting)
      const rechargeRate = isDriftingNow ? 18 : 8.5;
      nitroFuel.current = Math.min(100, nitroFuel.current + rechargeRate * dt);
      if (isCurrentlyBoosting.current) {
        isCurrentlyBoosting.current = false;
        audioSynthesizer.playNitro(false);
      }
    }

    if (onNitroFuelUpdate) {
      onNitroFuelUpdate(nitroFuel.current);
    }

    const isNitroOn = canBoost;
    const maxSpeedKmh = isNitroOn ? 335 : (drivingMode === 'arcade' ? 305 : MAX_SPEED_KMH);
    const nitroAccelMultiplier = isNitroOn ? 1.72 : 1.0;

    // =========================================================================
    // 4. SPEED-SENSITIVE STEERING & ABS WHEEL LOCK BEHAVIOR
    // =========================================================================
    const steerInput = (rightInput ? 1 : 0) - (leftInput ? 1 : 0);
    const speedRatio = Math.min(1.0, speedKmh / 220);
    const maxSteerAngle = 0.55 * (1.0 - speedRatio * 0.50);

    // If ABS is OFF and hard braking is applied at speed, wheels lock up and steering authority drops
    let isWheelLocked = false;
    let steerMultiplier = 1.0;

    if (bwdInput && currentForwardSpeed.current > 2.0 && !drivingAssists.abs && speedKmh > 24) {
      isWheelLocked = true;
      steerMultiplier = 0.22; // Wheels locked sliding forward — understeer slide!
    }
    if (drivingMode === 'arcade') {
      steerMultiplier *= 1.25;
    }

    const targetSteer = steerInput * maxSteerAngle * steerMultiplier;

    if (steerInput !== 0) {
      const steerSpeed = drivingMode === 'drift' ? 22 : 16;
      currentSteerAngle.current = THREE.MathUtils.damp(currentSteerAngle.current, targetSteer, steerSpeed, dt);
    } else {
      currentSteerAngle.current = THREE.MathUtils.damp(currentSteerAngle.current, 0, 18, dt);
    }

    // =========================================================================
    // 5. PROPULSION, BRAKING, TC (TRACTION CONTROL) & ABS
    // =========================================================================
    let isBraking = false;
    let isTireSpinning = false;

    if (fwdInput) {
      if (speedKmh < maxSpeedKmh) {
        const speedFactor = Math.max(0.38, 1.0 - Math.pow(speedKmh / maxSpeedKmh, 1.4));
        let accelRate = 38.0 * speedFactor * nitroAccelMultiplier;

        if (!drivingAssists.tc && speedKmh < 38) {
          // TC OFF: Full throttle dumps raw torque — standing wheelspin burnout!
          isTireSpinning = true;
          accelRate *= 0.60; // Less forward grip due to tire spinning
        }
        currentForwardSpeed.current += accelRate * dt;
      }
    } else if (bwdInput) {
      if (currentForwardSpeed.current > 0.8) {
        isBraking = true;
        if (!drivingAssists.abs && speedKmh > 20) {
          // ABS OFF: Wheels lock, lower sliding braking friction
          const lockedBrakeDecel = 22.0; // m/s²
          currentForwardSpeed.current = Math.max(0, currentForwardSpeed.current - lockedBrakeDecel * dt);
        } else {
          // ABS ON: High-performance carbon ceramic threshold braking
          const brakeDecel = 35.0; // m/s²
          currentForwardSpeed.current = Math.max(0, currentForwardSpeed.current - brakeDecel * dt);
        }
      } else {
        // High-torque reverse gear
        const revAccel = 22.0; // m/s²
        currentForwardSpeed.current = Math.max(-28.0, currentForwardSpeed.current - revAccel * dt);
      }
    } else {
      // Realistic rolling resistance & aerodynamic coasting
      currentForwardSpeed.current *= Math.pow(0.9982, dt * 60);
      if (Math.abs(currentForwardSpeed.current) < 0.05) currentForwardSpeed.current = 0;
    }

    // Handbrake deceleration & drift initiate
    if (handbrakeInput && Math.abs(currentForwardSpeed.current) > 0.5) {
      isBraking = true;
      currentForwardSpeed.current *= Math.pow(0.965, dt * 60);
    }

    // =========================================================================
    // 6. KINEMATIC & DYNAMIC YAW TURNING (RESPONSIVE STEERING & ESP)
    // =========================================================================
    let yawRate = 0;
    const fwdSpeed = currentForwardSpeed.current;

    if (Math.abs(fwdSpeed) > 0.15) {
      let driftMult = handbrakeInput ? 1.85 : 1.20;
      if (drivingMode === 'drift') driftMult *= 1.45;

      yawRate = -Math.sin(currentSteerAngle.current) * (fwdSpeed / WHEEL_BASE) * driftMult;

      // ESP Stabilization
      if (drivingAssists.esp && !handbrakeInput) {
        // Prevent wild uncontrollable spins when ESP is active
        if (Math.abs(currentLateralSpeed.current) > 1.8) {
          yawRate *= 0.72;
        }
      }
    } else if (steerInput !== 0 && (fwdInput || bwdInput)) {
      const turnDir = bwdInput ? 1 : -1;
      yawRate = turnDir * Math.sin(currentSteerAngle.current) * 2.2;
    }

    // Apply angular velocity around Y axis
    rb.setAngvel({ x: 0, y: yawRate, z: 0 }, true);

    // =========================================================================
    // 7. LATERAL GRIP & DRIFT DYNAMICS
    // =========================================================================
    let baseGrip = 15.0;
    if (drivingMode === 'drift') {
      baseGrip = 4.8; // Low rear grip for easy drifting
    } else if (drivingMode === 'arcade') {
      baseGrip = 25.0; // High grip rails
    }

    const gripRate = handbrakeInput ? 2.6 : (baseGrip - speedRatio * 3.8);
    currentLateralSpeed.current = THREE.MathUtils.damp(currentLateralSpeed.current, 0, Math.max(1.8, gripRate), dt);

    // Centrifugal slip into corners
    if (Math.abs(yawRate) > 0.05 && Math.abs(fwdSpeed) > 3.0) {
      const slipMod = drivingMode === 'drift' ? 0.08 : 0.045;
      const centSlip = -yawRate * fwdSpeed * slipMod;
      currentLateralSpeed.current += centSlip * dt;
    }

    // Construct final world linear velocity (vertical is locked to 0 so no bounce/dance)
    const worldLinvel = forwardVec.clone().multiplyScalar(currentForwardSpeed.current)
      .add(rightVec.clone().multiplyScalar(currentLateralSpeed.current));
    worldLinvel.y = 0.0;

    rb.setLinvel({ x: worldLinvel.x, y: 0.0, z: worldLinvel.z }, true);

    // Dynamic tire slip calculation
    const slipAngle = Math.abs(Math.atan2(currentLateralSpeed.current, Math.abs(fwdSpeed) + 0.4));
    let normalisedSlip = Math.min(1.0, slipAngle * 2.4 + (handbrakeInput ? 0.70 : 0));
    if (isWheelLocked) normalisedSlip = 0.98;
    if (isTireSpinning) normalisedSlip = Math.max(normalisedSlip, 0.88);

    // =========================================================================
    // 8. DYNAMIC CHASSIS PITCH & BODY ROLL (VISUAL IMMERSION)
    // =========================================================================
    if (visualGroupRef.current) {
      const accelIntent = fwdInput ? 1 : (isBraking ? -1.8 : 0);
      const targetPitch = accelIntent * (fwdInput ? (isNitroOn ? -0.042 : -0.022) : 0.038);
      visualPitch.current = THREE.MathUtils.damp(visualPitch.current, targetPitch, 10, dt);

      const targetRoll = -yawRate * 0.035;
      visualRoll.current = THREE.MathUtils.damp(visualRoll.current, targetRoll, 10, dt);

      visualGroupRef.current.rotation.x = visualPitch.current;
      visualGroupRef.current.rotation.z = visualRoll.current;
    }

    // =========================================================================
    // 9. CAMERA TARGET UPDATE
    // =========================================================================
    if (cameraTargetRef) {
      cameraTargetRef.current = {
        position: carPos.clone(),
        quaternion: carQuat.clone(),
        forward: forwardVec.clone(),
        speed: speedKmh,
      };
    }

    // =========================================================================
    // 10. AUDIO ACOUSTICS, GEAR SIMULATION & ENGINE RPM
    // =========================================================================
    let gear = '1';
    let gearRpm = 1000;

    if (fwdSpeed < -0.4) {
      gear = 'R';
      gearRpm = 1200 + (speedKmh / 40) * 4800;
    } else if (speedKmh < 0.8 && !fwdInput && !bwdInput) {
      gear = 'P';
      gearRpm = 850;
    } else if (speedKmh < 45) {
      gear = '1';
      gearRpm = 1000 + (speedKmh / 45) * 6500;
    } else if (speedKmh < 85) {
      gear = '2';
      gearRpm = 3000 + ((speedKmh - 45) / 40) * 5000;
    } else if (speedKmh < 130) {
      gear = '3';
      gearRpm = 3500 + ((speedKmh - 85) / 45) * 4800;
    } else if (speedKmh < 175) {
      gear = '4';
      gearRpm = 4000 + ((speedKmh - 130) / 45) * 4500;
    } else if (speedKmh < 220) {
      gear = '5';
      gearRpm = 4500 + ((speedKmh - 175) / 40) * 4000;
    } else if (speedKmh < 270) {
      gear = '6';
      gearRpm = 4800 + ((speedKmh - 220) / 50) * 3500;
    } else {
      // 7th gear as shown in Extreme Car Driving Simulator screenshot!
      gear = '7';
      gearRpm = 5200 + ((speedKmh - 270) / 70) * 3300;
    }

    // =========================================================================
    // 11. REAL-TIME DRIFT SCORE & MULTIPLIER
    // =========================================================================
    const driftAngleDeg = Math.round((Math.abs(Math.atan2(currentLateralSpeed.current, Math.abs(fwdSpeed) + 0.1)) * 180) / Math.PI);
    const isDrifting = driftAngleDeg >= 12 && speedKmh >= 18;

    if (isDrifting) {
      driftDuration.current += dt;
      const baseMult = drivingMode === 'drift' ? 2.0 : 1.0;
      driftMultiplier.current = Math.min(6.0, baseMult + Math.floor(driftDuration.current * 1.4) * 0.5);
      const rate = driftAngleDeg * driftMultiplier.current * 32;
      driftScore.current += Math.round(rate * dt);
    } else {
      if (driftScore.current > 0) {
        totalDriftBank.current += driftScore.current;
        driftScore.current = 0;
      }
      driftDuration.current = 0;
      driftMultiplier.current = 1.0;
    }

    audioSynthesizer.update({
      speed: speedKmh,
      rpm: Math.min(8500, Math.round(gearRpm)),
      throttle: fwdInput,
      slip: normalisedSlip,
    });

    // =========================================================================
    // 12. WHEEL CONTACT PATCHES FOR SMOKE & SKID MARKS
    // =========================================================================
    for (let i = 0; i < 4; i++) {
      const wo = WHEEL_OFFSETS[i];
      const wheel = wheelsState[i];
      const localP = new THREE.Vector3(wo.x, 0.0, wo.z);
      wheel.contactPoint.copy(localP).applyQuaternion(carQuat).add(carPos);
      wheel.contactPoint.y = 0.0;
      wheel.isGrounded = true;
      wheel.normal.copy(upVec);
    }

    if (vehicleStateRef) {
      vehicleStateRef.current = {
        wheelContacts: wheelsState,
        slip: normalisedSlip,
        throttle: fwdInput,
        isHandbrake: handbrakeInput,
        speed: speedKmh,
        forward: forwardVec.clone(),
        quaternion: carQuat.clone(),
        position: carPos.clone(),
        isBoosting: isNitroOn,
        smokeColor,
        isTireSpinning,
        isWheelLocked,
      };
    }

    setCarVisualState({
      steeringAngle: currentSteerAngle.current,
      speed: speedKmh,
      isBraking,
      isBoosting: isNitroOn,
    });

    // =========================================================================
    // 13. CITY TRACK PROGRESS & HUD TELEMETRY
    // =========================================================================
    const distToNorthEnd = carPos.distanceTo(new THREE.Vector3(2.5, 0.0, 35));
    if (distToNorthEnd < 25) {
      hasPassedMidpoint.current = true;
    }

    const distToStartLine = carPos.distanceTo(CITY_SPAWN_POINT);
    if (distToStartLine < 16 && hasPassedMidpoint.current) {
      hasPassedMidpoint.current = false;
      const lapTime = (Date.now() - lapStartTime.current) / 1000;
      lapStartTime.current = Date.now();
      currentLap.current += 1;
      if (onLapComplete) {
        onLapComplete(lapTime, currentLap.current);
      }
    }

    if (onTelemetryUpdate) {
      onTelemetryUpdate({
        speed: Math.round(speedKmh),
        preciseSpeed: speedKmh,
        rpm: Math.min(8500, Math.round(gearRpm)),
        preciseRpm: Math.min(8500, gearRpm),
        gear,
        isDrifting,
        driftAngle: driftAngleDeg,
        driftScore: driftScore.current,
        totalDriftBank: totalDriftBank.current,
        driftMultiplier: driftMultiplier.current,
        lap: currentLap.current,
        lapCurrentTime: (Date.now() - lapStartTime.current) / 1000,
        position: [carPos.x, carPos.z],
        posY: carPos.y,
        nitroFuel: Math.round(nitroFuel.current),
        isBoosting: isNitroOn,
        isWheelLocked,
        isTireSpinning,
        drivingMode,
        damageLevel,
      });
    }
  });

  // Collision impact handler
  const handleCollisionEnter = (e) => {
    const currentSpeed = Math.abs(currentForwardSpeed.current) * 3.6;
    if (currentSpeed > 18) {
      const severity = Math.min(1.0, currentSpeed / 140);
      audioSynthesizer.playCrash(severity);
      if (onCollisionImpact) {
        onCollisionImpact({
          severity,
          speed: currentSpeed,
          damageDelta: Math.round(severity * 25),
        });
      }
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[CITY_SPAWN_POINT.x, CITY_SPAWN_POINT.y, CITY_SPAWN_POINT.z]}
      rotation={[0, CITY_SPAWN_YAW, 0]}
      colliders={false}
      mass={VEHICLE_MASS}
      linearDamping={0.05}
      angularDamping={2.0}
      gravityScale={0}
      enabledRotations={[false, true, false]}
      onCollisionEnter={handleCollisionEnter}
    >
      {/*
        Chassis Collision Box — handles solid impact with buildings, obstacles & barriers.
        Bottom sits 10cm above asphalt so it never clips with the road surface at Y = 0.00.
        Low wall friction (0.02) allows smooth sliding along barriers without halting.
      */}
      <CuboidCollider
        args={[0.92, 0.35, 2.05]}
        position={[0, 0.45, 0]}
        friction={0.02}
        restitution={0.0}
      />

      {/* Dynamic Visual Mesh with pitch & roll body motion */}
      <group ref={visualGroupRef}>
        <CarModel
          steeringAngle={carVisualState.steeringAngle}
          speed={carVisualState.speed}
          isBraking={carVisualState.isBraking}
          isHeadlightsOn={isHeadlightsOn}
          carColor={carColor}
          isBoosting={carVisualState.isBoosting}
          underglowColor={underglowColor}
          rimColor={rimColor}
          windowTint={windowTint}
          damageLevel={damageLevel}
        />
      </group>
    </RigidBody>
  );
}
