import React, { useState, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';

import { Scene } from './components/Scene';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExtremeHUD } from './components/UI/ExtremeHUD';
import { SettingsModal } from './components/UI/SettingsModal';
import { GTAPhoneModal } from './components/UI/GTAPhoneModal';
import { GTA_MISSIONS, GTA_CASH_PICKUPS, GTA_RADIO_STATIONS } from './utils/gtaMissions';
import { audioSynthesizer } from './utils/audioSynthesizer';

export default function App() {
  const [timeOfDay, setTimeOfDay] = useState('sunset');
  const [cameraMode, setCameraMode] = useState('chase');
  // Extreme Car Driving Simulator signature Royal Purple from user's reference image
  const [carColor, setCarColor] = useState('#6b17d9');
  const [isHeadlightsOn, setIsHeadlightsOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Driving Dynamics & Assists (ABS, TC, ESP)
  const [drivingAssists, setDrivingAssists] = useState({
    abs: true,
    tc: true,
    esp: true,
  });
  const [drivingMode, setDrivingMode] = useState('simulator'); // 'simulator' | 'drift' | 'arcade'
  const [steeringMode, setSteeringMode] = useState('buttons'); // 'buttons' | 'wheel'

  // Nitro Boost & Vehicle Health
  const [nitroFuel, setNitroFuel] = useState(100);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [damageLevel, setDamageLevel] = useState(0);

  // GTA 5 Open World & Mission States
  const [wantedLevel, setWantedLevel] = useState(0);
  const [isEvading, setIsEvading] = useState(false);
  const [playerCash, setPlayerCash] = useState(250000);
  const [playerRP, setPlayerRP] = useState(1500);
  const [recentCashEarned, setRecentCashEarned] = useState(0);
  const [activeMission, setActiveMission] = useState(null);
  const [missionStep, setMissionStep] = useState(0);
  const [missionTimeRemaining, setMissionTimeRemaining] = useState(0);
  const [missionOutcome, setMissionOutcome] = useState(null);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);
  const [activeRadioStation, setActiveRadioStation] = useState(1);
  const [cashPickups, setCashPickups] = useState(GTA_CASH_PICKUPS);
  const [policeDist, setPoliceDist] = useState(999);

  // Customization: Underglow, Rims, Window Tint, Smoke
  const [underglowColor, setUnderglowColor] = useState('#6b17d9');
  const [smokeColor, setSmokeColor] = useState('#ffffff');
  const [rimColor, setRimColor] = useState('#111317');
  const [windowTint, setWindowTint] = useState(0.92);

  // Virtual Touch / Pedals Inputs
  const [virtualInputs, setVirtualInputs] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
  });

  // Radar Speed Trap Notification
  const [speedTrapAlert, setSpeedTrapAlert] = useState({ visible: false, speed: 0 });

  const [telemetry, setTelemetry] = useState({
    speed: 0,
    rpm: 1000,
    gear: 1,
    lap: 1,
    lapCurrentTime: 0,
    position: [0, 0],
    posY: 0.8,
  });

  const [bestLap, setBestLap] = useState(null);
  const [lapAlert, setLapAlert] = useState(null);

  const [graphicsTier, setGraphicsTier] = useState('1k');
  const [trackLoading, setTrackLoading] = useState({
    isLoading: false,
    progress: 100,
    activeTier: '1k',
    targetTier: '1k',
  });
  const [hasUserSwitchedTier, setHasUserSwitchedTier] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  const [postProcessingSettings, setPostProcessingSettings] = useState({
    enablePostProcessing: true,
    enableBloom: true,
    enableMotionFX: true,
    enableVignette: true,
  });

  const handleTrackLoadingStateChange = useCallback((state) => {
    setTrackLoading(state);
    if (!state.isLoading && state.isReady) {
      requestAnimationFrame(() => {
        setTimeout(() => setIsSceneReady(true), 80);
      });
    }
  }, []);

  const handleSetGraphicsTier = useCallback((tier) => {
    setHasUserSwitchedTier(true);
    setGraphicsTier(tier);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsSceneReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleTelemetryUpdate = useCallback((data) => {
    setTelemetry(data);
    if (data.damageLevel !== undefined) {
      setDamageLevel(data.damageLevel);
    }
  }, []);

  const handleNitroFuelUpdate = useCallback((fuel) => {
    setNitroFuel(fuel);
  }, []);

  const handleCollisionImpact = useCallback((impact) => {
    setDamageLevel((prev) => {
      const nextDamage = Math.min(100, prev + (impact.damageDelta || 20));
      if (nextDamage >= 100) {
        // Vehicle Wasted!
        setTimeout(() => {
          setMissionOutcome('wasted');
          audioSynthesizer.playMissionFailed();
        }, 100);
      }
      return nextDamage;
    });

    // Reckless driving triggers wanted attention if severe
    if ((impact.damageDelta || 0) > 30) {
      setWantedLevel((prev) => (prev === 0 ? 1 : prev));
    }
  }, []);

  const handleRepairCar = useCallback(() => {
    setDamageLevel(0);
  }, []);

  const handleTriggerSpeedTrap = useCallback((speedVal) => {
    setSpeedTrapAlert({ visible: true, speed: speedVal });
    // Speeding through camera > 100 km/h triggers 1-Star wanted level!
    if (speedVal > 100) {
      setWantedLevel((prev) => Math.min(5, Math.max(1, prev + 1)));
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3 },
      });
    } catch (_) {}
    setTimeout(() => {
      setSpeedTrapAlert((prev) => ({ ...prev, visible: false }));
    }, 3800);
  }, []);

  const handleLapComplete = useCallback((lapTime, nextLap) => {
    setBestLap((prev) => {
      const isNewRecord = !prev || lapTime < prev;
      if (isNewRecord) {
        setLapAlert(`NEW LAP RECORD! ${lapTime.toFixed(3)}s`);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (_) {}
      } else {
        setLapAlert(`LAP ${nextLap - 1} COMPLETED: ${lapTime.toFixed(3)}s`);
      }

      setTimeout(() => setLapAlert(null), 4000);
      return isNewRecord ? lapTime : prev;
    });
  }, []);

  // ── GTA Mission Lifecycle Handlers ─────────────────────────
  const handleStartMission = useCallback((mission) => {
    setActiveMission(mission);
    setMissionStep(0);
    setMissionTimeRemaining(mission.timeLimit || 90);
    setMissionOutcome(null);
    if (mission.wantedOnStart > 0) {
      setWantedLevel(mission.wantedOnStart);
      setIsEvading(false);
    }
  }, []);

  const handleMissionStepReached = useCallback(
    (stepIdx) => {
      if (!activeMission) return;
      const totalSteps = activeMission.steps.length;
      if (stepIdx < totalSteps - 1) {
        setMissionStep(stepIdx + 1);
        audioSynthesizer.playCashChime();
      } else {
        // MISSION PASSED!
        const cashWon = activeMission.cashReward || 20000;
        const rpWon = activeMission.rpReward || 1500;
        setPlayerCash((prev) => prev + cashWon);
        setPlayerRP((prev) => prev + rpWon);
        setRecentCashEarned(cashWon);
        setWantedLevel(0);
        setIsEvading(false);
        setMissionOutcome('passed');
        audioSynthesizer.playMissionPassed();

        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch (_) {}
      }
    },
    [activeMission]
  );

  const handleFailMission = useCallback(() => {
    setActiveMission(null);
    setMissionOutcome('failed');
    audioSynthesizer.playMissionFailed();
  }, []);

  const handleBusted = useCallback(() => {
    setWantedLevel(0);
    setIsEvading(false);
    setActiveMission(null);
    setPlayerCash((prev) => Math.max(0, prev - 5000)); // $5,000 bail fee
    setMissionOutcome('busted');
    audioSynthesizer.playMissionFailed();
    handleResetCar();
  }, []);

  const handleWasted = useCallback(() => {
    setActiveMission(null);
    setMissionOutcome('wasted');
    audioSynthesizer.playMissionFailed();
  }, []);

  const handleEvaded = useCallback(() => {
    setIsEvading(true);
    setTimeout(() => {
      setWantedLevel(0);
      setIsEvading(false);
      audioSynthesizer.playPoliceRadio();
    }, 4500);
  }, []);

  const handleCollectCash = useCallback((pickupId, amount) => {
    setCashPickups((prev) =>
      prev.map((p) => (p.id === pickupId ? { ...p, collected: true } : p))
    );
    setPlayerCash((prev) => prev + amount);
    setRecentCashEarned(amount);
  }, []);

  const handleCycleRadio = useCallback(() => {
    setActiveRadioStation((prev) => {
      const next = (prev + 1) % 4;
      audioSynthesizer.playRadioStation(next);
      return next;
    });
  }, []);

  const handleClearWantedLevel = useCallback(() => {
    setPlayerCash((prev) => Math.max(0, prev - 2500));
    setWantedLevel(0);
    setIsEvading(false);
  }, []);

  const handleDismissOutcome = useCallback(() => {
    if (missionOutcome === 'passed' || missionOutcome === 'failed') {
      setActiveMission(null);
    }
    if (missionOutcome === 'wasted' || missionOutcome === 'busted') {
      setDamageLevel(0);
      handleResetCar();
    }
    setMissionOutcome(null);
  }, [missionOutcome]);

  // Mission Countdown Timer
  useEffect(() => {
    if (!activeMission || missionOutcome) return;
    const interval = setInterval(() => {
      setMissionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFailMission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMission, missionOutcome, handleFailMission]);

  // Global Keyboard Shortcuts (C for Camera, P for Phone, Q for Radio, Enter for Dismiss)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'KeyC') {
        setCameraMode((prev) => {
          if (prev === 'chase')   return 'hood';
          if (prev === 'hood')    return 'cockpit';
          return 'chase';
        });
      } else if (e.code === 'KeyP') {
        setIsPhoneOpen((prev) => !prev);
        audioSynthesizer.playPoliceRadio();
      } else if (e.code === 'KeyQ') {
        handleCycleRadio();
      } else if (e.code === 'Enter') {
        if (missionOutcome) {
          handleDismissOutcome();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleCycleRadio, missionOutcome, handleDismissOutcome]);

  const handleResetCar = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
    }, 50);
  };

  return (
    <div className="canvas-container">
      {/* 3D WebGL Canvas Scene with Error Boundary */}
      <ErrorBoundary>
        <Scene
          timeOfDay={timeOfDay}
          cameraMode={cameraMode}
          carColor={carColor}
          postProcessingSettings={postProcessingSettings}
          graphicsTier={graphicsTier}
          onTrackLoadingStateChange={handleTrackLoadingStateChange}
          onTelemetryUpdate={handleTelemetryUpdate}
          onLapComplete={handleLapComplete}
          telemetrySpeed={telemetry.speed}
          drivingAssists={drivingAssists}
          drivingMode={drivingMode}
          virtualInputs={virtualInputs}
          isNitroActive={isNitroActive}
          onNitroFuelUpdate={handleNitroFuelUpdate}
          damageLevel={damageLevel}
          onCollisionImpact={handleCollisionImpact}
          underglowColor={underglowColor}
          smokeColor={smokeColor}
          rimColor={rimColor}
          windowTint={windowTint}
          isHeadlightsOn={isHeadlightsOn}
          onTriggerSpeedTrap={handleTriggerSpeedTrap}
          wantedLevel={wantedLevel}
          onBusted={handleBusted}
          onEvaded={handleEvaded}
          onPoliceDistanceUpdate={(d) => setPoliceDist(d)}
          activeMission={activeMission}
          missionStep={missionStep}
          onMissionStepReached={handleMissionStepReached}
          cashPickups={cashPickups}
          onCollectCash={handleCollectCash}
        />
      </ErrorBoundary>

      {/* Extreme Car Driving Simulator Replica HUD */}
      <div className={`hud-layer transition-opacity duration-300 ${isSceneReady ? 'opacity-100' : 'opacity-0'}`}>
        <ExtremeHUD
          telemetry={telemetry}
          bestLap={bestLap}
          drivingAssists={drivingAssists}
          setDrivingAssists={setDrivingAssists}
          drivingMode={drivingMode}
          setDrivingMode={setDrivingMode}
          steeringMode={steeringMode}
          setSteeringMode={setSteeringMode}
          nitroFuel={nitroFuel}
          isNitroActive={isNitroActive}
          setIsNitroActive={setIsNitroActive}
          damageLevel={damageLevel}
          onRepairCar={handleRepairCar}
          onResetCar={handleResetCar}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          isHeadlightsOn={isHeadlightsOn}
          setIsHeadlightsOn={setIsHeadlightsOn}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onOpenSettings={() => setIsSettingsOpen(true)}
          virtualInputs={virtualInputs}
          setVirtualInputs={setVirtualInputs}
          speedTrapAlert={speedTrapAlert}
          wantedLevel={wantedLevel}
          isEvading={isEvading}
          playerCash={playerCash}
          recentCashEarned={recentCashEarned}
          activeMission={activeMission}
          missionStep={missionStep}
          missionTimeRemaining={missionTimeRemaining}
          activeRadioStation={activeRadioStation}
          onCycleRadio={handleCycleRadio}
          onOpenPhone={() => setIsPhoneOpen(true)}
          missionOutcome={missionOutcome}
          onDismissOutcome={handleDismissOutcome}
        />

        {/* On-The-Fly Tier Switching Loading Indicator */}
        {hasUserSwitchedTier && trackLoading.isLoading && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-slate-950/90 px-5 py-2.5 shadow-[0_0_25px_rgba(0,153,218,0.4)] backdrop-blur-2xl pointer-events-none animate-bounce-short">
            <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-slate-400">
                SWITCHING GRAPHICS TIER
              </span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black tracking-wide text-white">
                  {trackLoading.targetTier.toUpperCase()} ASSET ({trackLoading.progress}%)
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0099da] to-[#00f2fe] transition-all duration-150"
                    style={{ width: `${trackLoading.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lap Record Notification Banner */}
        {lapAlert && (
          <div className="hud-center-alert">
            <div className="record-badge">{lapAlert}</div>
          </div>
        )}
      </div>

      {/* Seamless instant unveil overlay */}
      <div
        className={`fixed inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-out pointer-events-none ${
          isSceneReady ? 'opacity-0 scale-102' : 'opacity-100 scale-100'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 45%, #0e1526 0%, #06080d 100%)',
          zIndex: 9999,
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-widest text-purple-500">EXTREME</span>
            <span className="text-2xl font-black tracking-[4px] text-white uppercase drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              VELOCITY SIMULATOR
            </span>
          </div>
          <div className="text-[11px] font-mono tracking-[3px] text-slate-400 uppercase">
            GTA 5 MISSIONS • LSPD PURSUIT • RADAR • NITRO READY
          </div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
            <div className="h-full w-full bg-gradient-to-r from-[#6b17d9] via-[#00f2fe] to-[#eab308] animate-pulse" />
          </div>
        </div>
      </div>

      {/* GTA 5 iFruit Smartphone Modal */}
      <GTAPhoneModal
        isOpen={isPhoneOpen}
        onClose={() => setIsPhoneOpen(false)}
        onStartMission={handleStartMission}
        activeMission={activeMission}
        wantedLevel={wantedLevel}
        onClearWantedLevel={handleClearWantedLevel}
        playerCash={playerCash}
      />

      {/* Extreme Garage & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        carColor={carColor}
        setCarColor={setCarColor}
        postProcessingSettings={postProcessingSettings}
        setPostProcessingSettings={setPostProcessingSettings}
        graphicsTier={graphicsTier}
        setGraphicsTier={handleSetGraphicsTier}
        trackLoading={trackLoading}
        underglowColor={underglowColor}
        setUnderglowColor={setUnderglowColor}
        smokeColor={smokeColor}
        setSmokeColor={setSmokeColor}
        rimColor={rimColor}
        setRimColor={setRimColor}
        windowTint={windowTint}
        setWindowTint={setWindowTint}
        drivingAssists={drivingAssists}
        setDrivingAssists={setDrivingAssists}
        drivingMode={drivingMode}
        setDrivingMode={setDrivingMode}
        steeringMode={steeringMode}
        setSteeringMode={setSteeringMode}
      />
    </div>
  );
}
