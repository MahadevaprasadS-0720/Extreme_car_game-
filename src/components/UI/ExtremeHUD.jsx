import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  Wrench,
  Zap,
  Volume2,
  VolumeX,
  Settings,
  Sliders,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Sun,
  Star,
  DollarSign,
  Radio,
  Phone,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { audioSynthesizer } from '../../utils/audioSynthesizer';
import { GTA_RADIO_STATIONS } from '../../utils/gtaMissions';

/**
 * UnifiedMasterHUD
 * Responsive, zero-overlap, multi-device HUD:
 * - Fits automatically on Mobile (portrait & landscape), Tablet, Laptop, and Desktop
 * - Guaranteed zero-overlap layout using single-row header and compact responsive dock
 * - Touch-friendly hit targets for all controls
 */
export function ExtremeHUD({
  // Driving Dynamics & Telemetry
  telemetry = {},
  bestLap,
  drivingAssists = { abs: true, tc: true, esp: true },
  setDrivingAssists,
  drivingMode = 'simulator',
  setDrivingMode,
  steeringMode = 'buttons',
  setSteeringMode,
  nitroFuel = 100,
  isNitroActive = false,
  setIsNitroActive,
  damageLevel = 0,
  onRepairCar,
  onResetCar,
  cameraMode = 'chase',
  setCameraMode,
  timeOfDay,
  setTimeOfDay,
  isHeadlightsOn = true,
  setIsHeadlightsOn,
  isMuted = false,
  setIsMuted,
  onOpenSettings,
  virtualInputs = {},
  setVirtualInputs,
  speedTrapAlert,

  // GTA 5 Features
  wantedLevel = 0,
  isEvading = false,
  playerCash = 250000,
  recentCashEarned = 0,
  activeMission = null,
  missionStep = 0,
  missionTimeRemaining = 0,
  activeRadioStation = 1,
  onCycleRadio,
  onOpenPhone,
  missionOutcome = null,
  onDismissOutcome,
}) {
  const {
    speed = 0,
    rpm = 1000,
    gear = '1',
    position = [0, 0],
    isDrifting = false,
  } = telemetry;

  const [repairSparkle, setRepairSparkle] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showRadioBanner, setShowRadioBanner] = useState(false);
  const radioBannerTimer = useRef(null);

  const steeringWheelRef = useRef(null);
  const isDraggingWheel = useRef(false);
  const startDragX = useRef(0);

  // Cash popup trigger
  useEffect(() => {
    if (recentCashEarned > 0) {
      setShowCashPopup(true);
      const timer = setTimeout(() => setShowCashPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [recentCashEarned]);

  // Radio banner trigger
  useEffect(() => {
    setShowRadioBanner(true);
    if (radioBannerTimer.current) clearTimeout(radioBannerTimer.current);
    radioBannerTimer.current = setTimeout(() => setShowRadioBanner(false), 2600);
    return () => clearTimeout(radioBannerTimer.current);
  }, [activeRadioStation]);

  const activeStationData =
    GTA_RADIO_STATIONS.find((s) => s.id === activeRadioStation) || GTA_RADIO_STATIONS[0];

  // Repair tool
  const handleRepair = () => {
    setRepairSparkle(true);
    audioSynthesizer.playRepair();
    if (onRepairCar) onRepairCar();
    setTimeout(() => setRepairSparkle(false), 1400);
  };

  // Assists
  const toggleAssist = (type) => {
    if (setDrivingAssists) {
      setDrivingAssists((prev) => ({
        ...prev,
        [type]: !prev[type],
      }));
    }
  };

  // Camera
  const cycleCamera = () => {
    if (setCameraMode) {
      if (cameraMode === 'chase') setCameraMode('hood');
      else if (cameraMode === 'hood') setCameraMode('cockpit');
      else setCameraMode('chase');
    }
  };

  // Mute
  const toggleAudio = () => {
    const muted = audioSynthesizer.toggleMute();
    if (setIsMuted) setIsMuted(muted);
  };

  // Inputs
  const handleInputStart = (key) => {
    audioSynthesizer.resume();
    if (setVirtualInputs) {
      setVirtualInputs((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleInputEnd = (key) => {
    if (setVirtualInputs) {
      setVirtualInputs((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Steering Wheel drag interaction
  const handleWheelPointerDown = (e) => {
    isDraggingWheel.current = true;
    startDragX.current = e.clientX;
    window.addEventListener('pointermove', handleWheelPointerMove);
    window.addEventListener('pointerup', handleWheelPointerUp);
  };

  const handleWheelPointerMove = useCallback(
    (e) => {
      if (!isDraggingWheel.current) return;
      const deltaX = e.clientX - startDragX.current;
      const clampedAngle = Math.max(-120, Math.min(120, deltaX * 1.5));
      setWheelAngle(clampedAngle);

      const steerRatio = clampedAngle / 120;
      if (setVirtualInputs) {
        setVirtualInputs((prev) => ({
          ...prev,
          left: steerRatio < -0.2,
          right: steerRatio > 0.2,
        }));
      }
    },
    [setVirtualInputs]
  );

  const handleWheelPointerUp = useCallback(() => {
    isDraggingWheel.current = false;
    setWheelAngle(0);
    if (setVirtualInputs) {
      setVirtualInputs((prev) => ({ ...prev, left: false, right: false }));
    }
    window.removeEventListener('pointermove', handleWheelPointerMove);
    window.removeEventListener('pointerup', handleWheelPointerUp);
  }, [handleWheelPointerMove, setVirtualInputs]);

  // Sync wheel with keyboard steer
  useEffect(() => {
    if (isDraggingWheel.current) return;
    const steer = (telemetry.steeringAngle || 0) * (180 / Math.PI) * 2.8;
    setWheelAngle(steer);
  }, [telemetry.steeringAngle]);

  const normRpm = Math.min(1.0, (rpm - 800) / 7700);
  const currentStep = activeMission?.steps?.[missionStep];
  const healthPercent = Math.max(0, 100 - damageLevel);

  function THREE_clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-30 overflow-hidden font-sans">
      {/* ── 1. Full-screen Alerts (Speed Trap Flash & Repair Wave) ── */}
      {speedTrapAlert?.visible && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-flash-burst">
          <div className="flex flex-col items-center gap-1 rounded-2xl border-2 border-amber-400 bg-slate-950/95 px-6 py-3.5 shadow-[0_0_50px_rgba(251,191,36,0.8)] backdrop-blur-2xl">
            <span className="text-[10px] font-mono font-black tracking-[3px] text-amber-400 uppercase">
              📸 SPEED TRAP RADAR
            </span>
            <div className="text-3xl sm:text-5xl font-black italic tracking-tight text-white">
              {speedTrapAlert.speed} <span className="text-xl font-bold text-amber-400">KM/H</span>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/40">
              SPEED LOGGED!
            </span>
          </div>
        </div>
      )}

      {repairSparkle && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-repair-wave">
          <div className="flex flex-col items-center gap-2">
            <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-cyan-400/80 bg-cyan-400/10 shadow-[0_0_60px_rgba(0,242,254,0.9)] animate-ping" />
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-cyan-300 bg-slate-950/95 px-4 py-2 shadow-2xl backdrop-blur-xl">
              <Sparkles className="text-cyan-300 animate-spin" size={16} />
              <span className="text-xs sm:text-sm font-black tracking-widest text-cyan-200 uppercase">
                CHASSIS RESTORED • 100% HEALTH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. TOP UNIFIED SINGLE-ROW HEADER BAR ── */}
      <header className="absolute top-1.5 sm:top-2.5 left-0 right-0 px-2 sm:px-4 md:px-6 flex items-center justify-between z-40">
        {/* Left Toolbar (Never wraps - uses compact icon pills on mobile, text on desktop) */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto flex-nowrap">
          {/* Radio Button */}
          <button
            onClick={onCycleRadio}
            title="Cycle Radio Stations [Q]"
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/75 hover:bg-black/90 border border-white/15 backdrop-blur-xl shadow-md active:scale-95 transition-all text-white"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse flex-shrink-0" />
            <span className="hidden md:inline text-[10px] font-black tracking-tight text-white truncate max-w-[100px]">
              {activeStationData.name}
            </span>
          </button>

          {/* iFruit Smartphone Button */}
          <button
            onClick={onOpenPhone}
            title="Open iFruit Phone [P]"
            className="relative flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-900/80 to-slate-900/90 hover:from-purple-800 hover:to-slate-800 border border-purple-500/40 backdrop-blur-xl shadow-md active:scale-95 transition-all text-white"
          >
            <Phone className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="hidden sm:inline text-[10px] font-black tracking-wider uppercase">iFruit [P]</span>
            {activeMission && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={cycleCamera}
            title="Switch Camera [C]"
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/15 backdrop-blur-xl shadow-md active:scale-95 transition-all text-white"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="hidden lg:inline text-[9px] font-bold uppercase">{cameraMode}</span>
          </button>

          {/* Light Toggle */}
          <button
            onClick={() => setIsHeadlightsOn(!isHeadlightsOn)}
            title="Toggle Headlights"
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border backdrop-blur-xl shadow-md active:scale-95 transition-all text-white ${
              isHeadlightsOn
                ? 'border-cyan-400/60 bg-cyan-950/60 text-cyan-300'
                : 'border-white/15 bg-slate-950/80 text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden xl:inline text-[9px] font-bold">{isHeadlightsOn ? 'LIGHT AUTO' : 'LIGHT OFF'}</span>
          </button>

          {/* Settings / Garage Button */}
          <button
            onClick={onOpenSettings}
            title="Extreme Garage & Tuning"
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-white shadow-md backdrop-blur-xl hover:border-cyan-400 transition-all active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300 hover:text-cyan-400" />
          </button>
        </div>

        {/* Center: Top-Center Speedometer + Yellow Gear Badge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">
                {Math.round(speed)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-400">KM/H</span>
            </div>

            {/* Yellow Gear Badge */}
            <div className="flex items-center justify-center rounded-lg bg-[#eab308] px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-300">
              <span className="font-mono text-lg sm:text-2xl font-black text-slate-950 leading-none">
                {gear}
              </span>
            </div>
          </div>

          {/* Curved RPM Arc */}
          <div className="w-28 sm:w-36 md:w-44 h-1 sm:h-1.5 bg-slate-950/80 rounded-full border border-white/20 overflow-hidden mt-0.5 backdrop-blur-md shadow">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                normRpm > 0.85
                  ? 'bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(4, normRpm * 100)}%` }}
            />
          </div>
        </div>

        {/* Right Toolbar: Repair, Reset, Mute, Wanted Stars & Cash */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto flex-nowrap">
          {/* Repair Tool */}
          <button
            onClick={handleRepair}
            title="Chassis Repair Tool"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-white shadow-md backdrop-blur-xl transition-all active:scale-95 ${
              damageLevel > 0
                ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'border-white/15 bg-slate-950/80 text-slate-300'
            }`}
          >
            <Wrench size={13} className={damageLevel > 0 ? 'text-amber-300 animate-spin-slow' : 'text-slate-400'} />
            <span className="hidden sm:inline text-[9px] font-mono text-slate-300">
              {damageLevel > 0 ? `${100 - damageLevel}%` : '100%'}
            </span>
          </button>

          {/* Reset Car */}
          <button
            onClick={onResetCar}
            title="Reset Car [Key R]"
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-amber-400 shadow-md backdrop-blur-xl hover:border-amber-400 transition-all active:scale-95"
          >
            <RotateCcw size={14} />
          </button>

          {/* Mute Button */}
          <button
            onClick={toggleAudio}
            title="Audio Toggle"
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl border border-white/15 bg-slate-950/80 text-white shadow-md backdrop-blur-xl transition-all active:scale-95"
          >
            {isMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-emerald-400" />}
          </button>

          {/* Wanted Stars */}
          <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-xl border border-white/10 shadow-md">
            {[1, 2, 3, 4, 5].map((starNum) => {
              const isWanted = starNum <= wantedLevel;
              return (
                <Star
                  key={starNum}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all ${
                    isWanted
                      ? isEvading
                        ? 'animate-pulse text-red-500 fill-red-500'
                        : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]'
                      : 'text-slate-700 fill-slate-900 opacity-40'
                  }`}
                />
              );
            })}
          </div>

          {/* Cash Balance */}
          <div className="flex flex-col items-end">
            <div className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_1px_8px_rgba(16,185,129,0.5)]">
              ${playerCash.toLocaleString()}
            </div>
            {showCashPopup && (
              <div className="text-[10px] font-black text-green-300 font-mono animate-bounce drop-shadow-[0_0_8px_rgba(74,222,128,0.9)]">
                +${recentCashEarned.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3. MID-LEFT FLOATING DOCK: COMPACT ASSISTS (ABS, TC, ESP) & MODES ── */}
      {/* Positioned safely below the single-row header, guaranteed zero overlap! */}
      <aside className="absolute top-12 sm:top-14 md:top-16 left-2 sm:left-4 z-30 flex flex-col gap-1 pointer-events-auto">
        <div className="flex flex-row sm:flex-col gap-1 p-1 sm:p-1.5 rounded-xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl shadow-xl">
          {/* ABS Toggle */}
          <button
            className={`flex items-center justify-between gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg border text-[9px] sm:text-[10px] font-black tracking-wider transition-all active:scale-95 ${
              drivingAssists.abs
                ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'border-rose-500/50 bg-rose-950/50 text-rose-300 line-through'
            }`}
            onClick={() => toggleAssist('abs')}
            title="Toggle Anti-lock Braking System (ABS)"
          >
            <span>ABS</span>
            <span className={`h-1.5 w-1.5 rounded-full ${drivingAssists.abs ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          </button>

          {/* TC Toggle */}
          <button
            className={`flex items-center justify-between gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg border text-[9px] sm:text-[10px] font-black tracking-wider transition-all active:scale-95 ${
              drivingAssists.tc
                ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'border-amber-500/50 bg-amber-950/50 text-amber-300'
            }`}
            onClick={() => toggleAssist('tc')}
            title="Toggle Traction Control (TC)"
          >
            <span>TC</span>
            <span className={`h-1.5 w-1.5 rounded-full ${drivingAssists.tc ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* ESP Toggle */}
          <button
            className={`flex items-center justify-between gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg border text-[9px] sm:text-[10px] font-black tracking-wider transition-all active:scale-95 ${
              drivingAssists.esp
                ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'border-amber-500/50 bg-amber-950/50 text-amber-300'
            }`}
            onClick={() => toggleAssist('esp')}
            title="Toggle Electronic Stability Program (ESP)"
          >
            <span>ESP</span>
            <span className={`h-1.5 w-1.5 rounded-full ${drivingAssists.esp ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>
        </div>

        {/* Driving Mode Selector (SIM / DRIFT / FUN) */}
        <div className="flex rounded-lg border border-white/15 bg-slate-950/80 p-0.5 backdrop-blur-xl">
          {['simulator', 'drift', 'arcade'].map((m) => (
            <button
              key={m}
              className={`flex-1 rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider transition-all ${
                drivingMode === m
                  ? 'bg-gradient-to-r from-[#0099da] to-[#00f2fe] text-slate-950 font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setDrivingMode(m)}
            >
              {m === 'simulator' ? 'SIM' : m === 'drift' ? 'DRIFT' : 'FUN'}
            </button>
          ))}
        </div>
      </aside>

      {/* ── 4. RADIO STATION POPUP NOTIFICATION (Top-Center) ── */}
      {showRadioBanner && (
        <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
          <div className="px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-black/85 border border-white/20 backdrop-blur-2xl shadow-xl flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-black"
              style={{ backgroundColor: activeStationData.color }}
            >
              📻
            </div>
            <div>
              <div className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">NOW PLAYING</div>
              <div className="text-[11px] font-black text-white">{activeStationData.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. BOTTOM-CENTER: GTA 5 MISSION OBJECTIVE BANNER ── */}
      {activeMission && (
        <div className="absolute bottom-20 sm:bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-[90vw] sm:max-w-[460px] w-full pointer-events-auto">
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-black/90 border border-amber-500/40 backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.9)] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-sm bg-amber-400 animate-pulse flex-shrink-0" />
              <div className="truncate">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-amber-400 font-black mr-1.5">
                  {activeMission.title}
                </span>
                <span className="text-[11px] sm:text-xs font-black text-white tracking-wide">
                  {wantedLevel >= 1 && currentStep?.type === 'evade_cops'
                    ? 'LOSE THE COPS'
                    : currentStep?.instruction || 'Complete objective'}
                </span>
              </div>
            </div>

            {missionTimeRemaining > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px] font-black text-amber-300 flex-shrink-0">
                <span>{missionTimeRemaining}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6. BOTTOM-LEFT HUB: GTA 5 RADAR MINIMAP + STEERING CONTROLS (Side-by-side, no overlap!) ── */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-30 flex items-end gap-2 sm:gap-2.5 pointer-events-auto">
        {/* Circular GTA 5 GPS Radar */}
        <div className="flex flex-col gap-0.5">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 bg-[#0c121e]/90 backdrop-blur-xl relative overflow-hidden shadow-2xl transition-colors duration-200 ${
              wantedLevel >= 1
                ? isEvading
                  ? 'border-blue-500 animate-pulse'
                  : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'border-slate-700'
            }`}
          >
            {/* Street Grid Graphic */}
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -translate-x-1/2 bg-cyan-400" />
              <div className="absolute top-1/2 left-0 right-0 h-[4px] -translate-y-1/2 bg-cyan-400" />
              <div className="absolute left-[30%] top-0 bottom-0 w-[2px] bg-slate-400" />
              <div className="absolute left-[70%] top-0 bottom-0 w-[2px] bg-slate-400" />
            </div>

            {/* Mission Target Blip */}
            {currentStep?.targetPos && (
              <div
                className="absolute w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border border-black shadow-[0_0_8px_#f59e0b] animate-ping"
                style={{
                  left: `${THREE_clamp(((currentStep.targetPos[0] + 35) / 80) * 100, 12, 88)}%`,
                  top: `${THREE_clamp(((currentStep.targetPos[2] + 75) / 110) * 100, 12, 88)}%`,
                }}
              />
            )}

            {/* Police Blip */}
            {wantedLevel >= 1 && (
              <div
                className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow animate-bounce"
                style={{
                  backgroundColor: isEvading ? '#3b82f6' : '#ef4444',
                  left: '62%',
                  top: '38%',
                }}
              />
            )}

            {/* Player Chevron in Center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400 drop-shadow-[0_0_5px_#22d3ee]" />
            </div>

            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[6px] font-black text-cyan-400 font-mono">N</div>
          </div>

          {/* Health (Green) & Armor/Nitro (Blue) Bars */}
          <div className="w-20 sm:w-24 md:w-28 flex flex-col gap-0.5">
            <div className="h-1 sm:h-1.5 w-full rounded-sm bg-black/80 border border-white/10 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-150"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
            <div className="h-1 sm:h-1.5 w-full rounded-sm bg-black/80 border border-white/10 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-150"
                style={{ width: `${nitroFuel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steering Controls (Sitting gracefully beside the radar!) */}
        <div className="flex flex-col items-center gap-1">
          {/* Steer Mode Switch Pill */}
          <button
            className="flex items-center gap-1 rounded-lg border border-white/15 bg-slate-950/80 px-1.5 py-0.5 text-[8px] font-bold text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
            onClick={() => setSteeringMode(steeringMode === 'wheel' ? 'buttons' : 'wheel')}
            title="Toggle Steering (Buttons vs Wheel)"
          >
            <Sliders size={10} className="text-cyan-400" />
            <span>{steeringMode === 'wheel' ? 'ARROWS' : 'WHEEL'}</span>
          </button>

          {steeringMode === 'wheel' ? (
            /* Interactive Steering Wheel */
            <div
              ref={steeringWheelRef}
              className="relative flex h-18 w-18 sm:h-22 sm:w-22 md:h-24 md:w-24 items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform"
              style={{ transform: `rotate(${wheelAngle}deg)` }}
              onPointerDown={handleWheelPointerDown}
            >
              <div className="h-full w-full rounded-full border-[5px] sm:border-[6px] border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_6px_25px_rgba(0,0,0,0.8)] relative flex items-center justify-center">
                <div className="absolute top-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f2fe]" />
                <div className="absolute left-1.5 right-1.5 h-2 sm:h-2.5 bg-slate-800 rounded-sm" />
                <div className="absolute top-1.5 bottom-1.5 w-2 sm:w-2.5 bg-slate-800 rounded-sm" />
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-inner z-10">
                  <span className="text-[7px] sm:text-[8px] font-black text-cyan-400 tracking-wider">M4</span>
                </div>
              </div>
            </div>
          ) : (
            /* Left & Right Steer Buttons */
            <div className="flex items-center gap-1.5">
              <button
                className={`h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-xl border-2 border-white/20 bg-slate-950/85 text-white shadow-xl backdrop-blur-2xl flex items-center justify-center transition-all active:scale-90 active:border-cyan-400 ${
                  virtualInputs?.left ? 'border-cyan-400 bg-cyan-950/80 scale-95 shadow-[0_0_15px_rgba(0,242,254,0.5)]' : ''
                }`}
                onPointerDown={() => handleInputStart('left')}
                onPointerUp={() => handleInputEnd('left')}
                onPointerLeave={() => handleInputEnd('left')}
                title="Steer Left [A / Left Arrow]"
              >
                <span className="text-lg sm:text-xl font-black">◀</span>
              </button>

              <button
                className={`h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13 rounded-xl border-2 border-white/20 bg-slate-950/85 text-white shadow-xl backdrop-blur-2xl flex items-center justify-center transition-all active:scale-90 active:border-cyan-400 ${
                  virtualInputs?.right ? 'border-cyan-400 bg-cyan-950/80 scale-95 shadow-[0_0_15px_rgba(0,242,254,0.5)]' : ''
                }`}
                onPointerDown={() => handleInputStart('right')}
                onPointerUp={() => handleInputEnd('right')}
                onPointerLeave={() => handleInputEnd('right')}
                title="Steer Right [D / Right Arrow]"
              >
                <span className="text-lg sm:text-xl font-black">▶</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 7. BOTTOM-RIGHT HUB: NITRO BOOST + 3D PEDALS (GAS, BRAKE, DRIFT) ── */}
      <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 z-30 flex items-end gap-1.5 sm:gap-2.5 pointer-events-auto">
        {/* Nitro NOS Button */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            className={`relative flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl border-2 text-white shadow-xl backdrop-blur-2xl transition-all active:scale-95 ${
              isNitroActive || virtualInputs?.nitro
                ? 'border-cyan-400 bg-cyan-600/90 shadow-[0_0_25px_rgba(0,242,254,0.8)] scale-105'
                : nitroFuel > 15
                ? 'border-cyan-400/70 bg-slate-950/85 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.4)]'
                : 'border-slate-700 bg-slate-950/60 opacity-50'
            }`}
            onPointerDown={() => handleInputStart('nitro')}
            onPointerUp={() => handleInputEnd('nitro')}
            onPointerLeave={() => handleInputEnd('nitro')}
            title="NITRO BOOST [Hold Shift / N]"
          >
            <div className="flex flex-col items-center">
              <Flame size={16} className={isNitroActive || virtualInputs?.nitro ? 'text-amber-300 animate-bounce' : 'text-cyan-400'} />
              <span className="text-[7px] sm:text-[8px] font-mono font-black tracking-wider text-white">NOS</span>
            </div>
          </button>
          <div className="w-10 sm:w-12 md:w-14 h-1 rounded-full bg-slate-950/80 border border-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-[#00f2fe] transition-all duration-75"
              style={{ width: `${nitroFuel}%` }}
            />
          </div>
        </div>

        {/* Handbrake Drift Button */}
        <button
          className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl border-2 border-rose-500/50 bg-slate-950/85 text-rose-400 shadow-xl backdrop-blur-2xl flex flex-col items-center justify-center transition-all active:scale-90 ${
            virtualInputs?.handbrake ? 'border-rose-400 bg-rose-950/80 scale-95 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''
          }`}
          onPointerDown={() => handleInputStart('handbrake')}
          onPointerUp={() => handleInputEnd('handbrake')}
          onPointerLeave={() => handleInputEnd('handbrake')}
          title="Handbrake Drift [Space]"
        >
          <span className="text-sm sm:text-base font-black font-mono leading-none">(P)</span>
          <span className="text-[6px] sm:text-[7px] font-bold tracking-widest uppercase">DRIFT</span>
        </button>

        {/* Brake Pedal */}
        <button
          className={`h-14 w-10 sm:h-16 sm:w-12 md:h-20 md:w-14 rounded-xl border-2 border-white/25 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl backdrop-blur-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            virtualInputs?.backward ? 'border-rose-400 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : ''
          }`}
          onPointerDown={() => handleInputStart('backward')}
          onPointerUp={() => handleInputEnd('backward')}
          onPointerLeave={() => handleInputEnd('backward')}
          title="Brake / Reverse [S / Down Arrow]"
        >
          <div className="flex flex-col gap-0.5 w-5 sm:w-6">
            <div className="h-0.5 bg-white/20 rounded-full" />
            <div className="h-0.5 bg-white/20 rounded-full" />
            <div className="h-0.5 bg-white/20 rounded-full" />
          </div>
          <span className="text-[7px] sm:text-[8px] font-black tracking-widest uppercase mt-0.5">BRAKE</span>
        </button>

        {/* Gas Accelerator Pedal */}
        <button
          className={`h-18 w-10 sm:h-20 sm:w-12 md:h-24 md:w-14 rounded-xl border-2 border-white/25 bg-gradient-to-b from-slate-800 to-slate-950 text-white shadow-xl backdrop-blur-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            virtualInputs?.forward ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_20px_rgba(0,242,254,0.7)]' : ''
          }`}
          onPointerDown={() => handleInputStart('forward')}
          onPointerUp={() => handleInputEnd('forward')}
          onPointerLeave={() => handleInputEnd('forward')}
          title="Accelerate Gas [W / Up Arrow]"
        >
          <div className="flex flex-col gap-0.5 w-5 sm:w-6">
            <div className="h-0.5 bg-cyan-400/40 rounded-full" />
            <div className="h-0.5 bg-cyan-400/40 rounded-full" />
            <div className="h-0.5 bg-cyan-400/40 rounded-full" />
          </div>
          <span className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-cyan-300 mt-0.5">GAS</span>
        </button>
      </div>

      {/* ── 8. CINEMATIC OVERLAYS (MISSION PASSED, BUSTED, WASTED) ── */}
      {missionOutcome === 'passed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-black/90 border-y-4 border-amber-500 py-6 sm:py-8 px-4 flex flex-col items-center gap-3 sm:gap-4 shadow-[0_0_80px_rgba(245,158,11,0.5)]">
            <div className="flex items-center gap-2">
              <Award className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400" />
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_0_25px_rgba(251,191,36,0.8)]">
                MISSION PASSED
              </h1>
            </div>

            <div className="text-sm sm:text-base font-black text-white tracking-wide">
              {activeMission?.title || 'Contract Completed'}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-xs sm:max-w-sm w-full">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center">
                <div className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                  CASH EARNED
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono">
                  +${(activeMission?.cashReward || 20000).toLocaleString()}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-center">
                <div className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  RP GAINED
                </div>
                <div className="text-lg sm:text-xl font-black text-blue-300 font-mono">
                  +{activeMission?.rpReward || 1500} RP
                </div>
              </div>
            </div>

            <button
              onClick={onDismissOutcome}
              className="mt-1 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition-all"
            >
              CONTINUE [ENTER]
            </button>
          </div>
        </div>
      )}

      {missionOutcome === 'busted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-slate-900/90 border-y-4 border-blue-500 py-6 sm:py-8 px-4 flex flex-col items-center gap-2.5 sm:gap-3 shadow-[0_0_80px_rgba(59,130,246,0.5)]">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-blue-400 uppercase drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]">
              BUSTED
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-300 max-w-xs text-center">
              The Los Santos Police apprehended you. Vehicle impounded and medical release granted.
            </p>
            <button
              onClick={onDismissOutcome}
              className="mt-1 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all"
            >
              RESPAWN AT SHOWROOM
            </button>
          </div>
        </div>
      )}

      {missionOutcome === 'wasted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-black/95 border-y-4 border-red-600 py-6 sm:py-8 px-4 flex flex-col items-center gap-2.5 sm:gap-3 shadow-[0_0_80px_rgba(239,68,68,0.6)]">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-widest text-red-600 uppercase drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]">
              WASTED
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 max-w-xs text-center">
              Vehicle totaled. Emergency repairs dispatched.
            </p>
            <button
              onClick={onDismissOutcome}
              className="mt-1 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all"
            >
              RESPAWN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
