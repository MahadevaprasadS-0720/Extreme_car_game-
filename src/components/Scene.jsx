import React, { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';

import { EnvironmentSky } from './EnvironmentSky';
import { CityTrack } from './Track/CityTrack';
import { SpeedTrapGate } from './Track/SpeedTrapGate';
import { Car } from './Vehicle/Car';
import { TireSmoke, SkidMarks } from './Vehicle/VehicleFX';
import { CameraController } from './Camera/CameraController';
import { PostProcessing } from './PostProcessing';
import { PoliceCar } from './Missions/PoliceCar';
import { MissionMarkers } from './Missions/MissionMarkers';

export function Scene({
  timeOfDay = 'sunset',
  cameraMode = 'chase',
  carColor = '#6b17d9',
  postProcessingSettings,
  graphicsTier = 'auto',
  onTrackLoadingStateChange,
  onTelemetryUpdate,
  onLapComplete,
  telemetrySpeed = 0,
  drivingAssists,
  drivingMode,
  virtualInputs,
  isNitroActive,
  onNitroFuelUpdate,
  damageLevel = 0,
  onCollisionImpact,
  underglowColor = '#6b17d9',
  smokeColor = '#ffffff',
  rimColor = '#111317',
  windowTint = 0.92,
  isHeadlightsOn = true,
  onTriggerSpeedTrap,
  wantedLevel = 0,
  onBusted,
  onEvaded,
  onPoliceDistanceUpdate,
  activeMission,
  missionStep = 0,
  onMissionStepReached,
  cashPickups = [],
  onCollectCash,
}) {
  const cameraTargetRef  = useRef(null);
  const vehicleStateRef  = useRef(null);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const defaultBg = isNight ? '#050811' : (isSunset ? '#6e4450' : '#87bdf5');

  return (
    <Canvas
      shadows
      camera={{ position: [2.5, 4, -25], fov: 62 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: isNight ? 1.4 : 1.15,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
    >
      {/* Explicit scene background fallback so viewport is never blank */}
      <color attach="background" args={[defaultBg]} />

      <Suspense fallback={null}>
        {/* Skybox & Dynamic Directional Sun with Cascading Soft Shadows */}
        <EnvironmentSky timeOfDay={timeOfDay} />

        {/* Rapier Physics World */}
        <Physics gravity={[0, -9.81, 0]}>
          {/* Dynamic Multi-Tier City Track Environment (1K / 4K with Physics) */}
          <CityTrack
            graphicsTier={graphicsTier}
            onLoadingStateChange={onTrackLoadingStateChange}
          />

          {/* Speed Trap Radar Gates (Extreme Car Driving Simulator Feature) */}
          <SpeedTrapGate
            position={[6.0, 0, 32]}
            rotation={[0, 0, 0]}
            onTriggerSpeedTrap={onTriggerSpeedTrap}
            vehicleStateRef={vehicleStateRef}
          />
          <SpeedTrapGate
            position={[6.0, 0, -85]}
            rotation={[0, 0, 0]}
            onTriggerSpeedTrap={onTriggerSpeedTrap}
            vehicleStateRef={vehicleStateRef}
          />

          {/* High-Performance GT Supercar */}
          <Car
            cameraTargetRef={cameraTargetRef}
            vehicleStateRef={vehicleStateRef}
            onTelemetryUpdate={onTelemetryUpdate}
            onLapComplete={onLapComplete}
            isHeadlightsOn={isHeadlightsOn}
            carColor={carColor}
            drivingAssists={drivingAssists}
            drivingMode={drivingMode}
            virtualInputs={virtualInputs}
            isNitroActive={isNitroActive}
            onNitroFuelUpdate={onNitroFuelUpdate}
            damageLevel={damageLevel}
            onCollisionImpact={onCollisionImpact}
            underglowColor={underglowColor}
            smokeColor={smokeColor}
            rimColor={rimColor}
            windowTint={windowTint}
          />

          {/* Los Santos Police Department Interceptor Cruiser & Siren Pursuit */}
          <PoliceCar
            wantedLevel={wantedLevel}
            vehicleStateRef={vehicleStateRef}
            onBusted={onBusted}
            onEvaded={onEvaded}
            onPoliceDistanceUpdate={onPoliceDistanceUpdate}
          />

          {/* GTA 5 Mission Beacons, Waypoints, and Hidden Cash Pickups */}
          <MissionMarkers
            activeMission={activeMission}
            missionStep={missionStep}
            vehicleStateRef={vehicleStateRef}
            onMissionStepReached={onMissionStepReached}
            cashPickups={cashPickups}
            onCollectCash={onCollectCash}
          />

          {/* Tire smoke particles — emits from rear wheels on burnout / drift */}
          <TireSmoke vehicleStateRef={vehicleStateRef} customSmokeColor={smokeColor} />

          {/* Dynamic skid marks projected onto track surface */}
          <SkidMarks vehicleStateRef={vehicleStateRef} />
        </Physics>

        {/* Dynamic Camera Controller (Chase / Hood / Cockpit) */}
        <CameraController
          cameraTargetRef={cameraTargetRef}
          mode={cameraMode}
        />

        {/* Post-Processing Pipeline (Bloom, Dynamic Chromatic Aberration, Vignette) */}
        {postProcessingSettings.enablePostProcessing && (
          <PostProcessing
            speed={telemetrySpeed}
            enableBloom={postProcessingSettings.enableBloom}
            enableMotionFX={postProcessingSettings.enableMotionFX}
            enableVignette={postProcessingSettings.enableVignette}
          />
        )}
      </Suspense>
    </Canvas>
  );
}
