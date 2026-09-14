import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  DollarSign,
  Radio,
  Phone,
  Shield,
  Heart,
  Flame,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { GTA_RADIO_STATIONS } from '../../utils/gtaMissions';

/**
 * GTAHUDOverlay
 * Authentic GTA 5 UI Suite:
 * - Top-Right 5-Star Wanted Level with flashing evasion strobe
 * - GTA Cash Counter with animated floating reward popups
 * - Bottom-Center Mission Objective banner with live countdown
 * - Bottom-Left GPS Radar Minimap with Health & Armor/Nitro bars
 * - Full-screen cinematic "MISSION PASSED", "BUSTED", and "WASTED" screens
 * - In-Car GTA Radio Station banner
 */
export function GTAHUDOverlay({
  wantedLevel = 0,
  isEvading = false,
  playerCash = 250000,
  recentCashEarned = 0,
  activeMission,
  missionStep = 0,
  missionTimeRemaining = 0,
  damageLevel = 0,
  nitroFuel = 100,
  activeRadioStation = 1,
  onCycleRadio,
  onOpenPhone,
  missionOutcome = null, // 'passed' | 'failed' | 'busted' | 'wasted' | null
  onDismissOutcome,
  telemetry = {},
  policeDist = 999,
}) {
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showRadioBanner, setShowRadioBanner] = useState(false);
  const radioBannerTimer = useRef(null);

  // Trigger cash popup animation whenever cash is earned
  useEffect(() => {
    if (recentCashEarned > 0) {
      setShowCashPopup(true);
      const timer = setTimeout(() => setShowCashPopup(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [recentCashEarned]);

  // Flash radio banner on station cycle
  useEffect(() => {
    setShowRadioBanner(true);
    if (radioBannerTimer.current) clearTimeout(radioBannerTimer.current);
    radioBannerTimer.current = setTimeout(() => setShowRadioBanner(false), 3000);
    return () => clearTimeout(radioBannerTimer.current);
  }, [activeRadioStation]);

  const activeStationData = GTA_RADIO_STATIONS.find((s) => s.id === activeRadioStation) || GTA_RADIO_STATIONS[0];

  const currentStep = activeMission?.steps?.[missionStep];
  const healthPercent = Math.max(0, 100 - damageLevel);

  // Minimap player position coordinates
  const posX = telemetry.position?.[0] || 6.0;
  const posZ = telemetry.position?.[1] || -28.0;

  // Normalize map coordinate to radar view (-35 to 45 -> 0 to 100%)
  const radarNormX = THREE_clamp(((posX + 35) / 80) * 100, 5, 95);
  const radarNormY = THREE_clamp(((posZ + 75) / 110) * 100, 5, 95);

  function THREE_clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none font-sans">
      {/* ── TOP RIGHT: GTA 5 Wanted Stars & Cash Counter ── */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex flex-col items-end gap-1.5 z-40">
        {/* 5-Star Wanted Level Rating */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
          {[1, 2, 3, 4, 5].map((starNum) => {
            const isWanted = starNum <= wantedLevel;
            return (
              <div
                key={starNum}
                className={`transition-all duration-150 ${
                  isWanted
                    ? isEvading
                      ? 'animate-pulse text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                      : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'text-slate-600 fill-slate-800 opacity-40'
                }`}
              >
                <Star
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    isWanted ? 'fill-current' : 'fill-none'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Cash Balance Display */}
        <div className="flex flex-col items-end">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_2px_10px_rgba(16,185,129,0.5)]">
            ${playerCash.toLocaleString()}
          </div>
          {/* Animated Cash Earned Fly-Up Popup */}
          {showCashPopup && (
            <div className="text-sm sm:text-base font-black text-green-300 font-mono animate-bounce drop-shadow-[0_0_12px_rgba(74,222,128,0.9)]">
              +${recentCashEarned.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* ── TOP LEFT: Radio Station Quick Banner ── */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6 flex items-center gap-2 pointer-events-auto z-40">
        <button
          onClick={onCycleRadio}
          title="Cycle Radio Stations (or press 'Q')"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/70 hover:bg-black/90 border border-white/15 backdrop-blur-xl shadow-lg active:scale-95 transition-all text-white"
        >
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <div className="text-left">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <span>RADIO [Q]</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-xs font-black tracking-tight text-white">
              {activeStationData.name}
            </div>
          </div>
        </button>

        {/* iFruit Phone Trigger Button */}
        <button
          onClick={onOpenPhone}
          title="Open iFruit Phone (or press 'P')"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-900/80 to-slate-900/90 hover:from-purple-800 hover:to-slate-800 border border-purple-500/40 backdrop-blur-xl shadow-lg active:scale-95 transition-all text-white"
        >
          <Phone className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-black tracking-wider uppercase">
            iFruit [P]
          </span>
          {activeMission && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>

      {/* ── TOP CENTER: Active Radio Station Pop-Out Banner ── */}
      {showRadioBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300">
          <div className="px-5 py-2 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-black"
              style={{ backgroundColor: activeStationData.color }}
            >
              📻
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                NOW PLAYING
              </div>
              <div className="text-sm font-black text-white">
                {activeStationData.name}
              </div>
              <div className="text-[10px] text-cyan-300 font-medium">
                {activeStationData.genre}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM CENTER: GTA 5 Mission Objective Bar ── */}
      {activeMission && (
        <div className="absolute bottom-28 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 max-w-[92vw] sm:max-w-[560px] w-full">
          <div className="px-4 py-2.5 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-2xl shadow-[0_4px_25px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 animate-pulse flex-shrink-0" />
              <div className="truncate">
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-black mr-2">
                  {activeMission.title}
                </span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  {wantedLevel >= 1 && currentStep?.type === 'evade_cops'
                    ? 'LOSE THE COPS'
                    : currentStep?.instruction || 'Complete objective'}
                </span>
              </div>
            </div>

            {/* Live Countdown Timer */}
            {missionTimeRemaining > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-mono text-xs font-black text-amber-300 flex-shrink-0">
                <span>{missionTimeRemaining}s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM LEFT: Authentic GTA 5 GPS Radar Minimap & Vital Bars ── */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex flex-col gap-1.5">
        {/* Circular Radar Screen */}
        <div
          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[3px] bg-[#0c121e]/90 backdrop-blur-xl relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.9)] transition-colors duration-200 ${
            wantedLevel >= 1
              ? isEvading
                ? 'border-blue-500 animate-pulse'
                : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'border-slate-700'
          }`}
        >
          {/* Street Grid Graphic Lines */}
          <div className="absolute inset-0 opacity-25">
            <div className="absolute left-1/2 top-0 bottom-0 w-[6px] -translate-x-1/2 bg-cyan-400" />
            <div className="absolute top-1/2 left-0 right-0 h-[6px] -translate-y-1/2 bg-cyan-400" />
            <div className="absolute left-[30%] top-0 bottom-0 w-[4px] bg-slate-400" />
            <div className="absolute left-[70%] top-0 bottom-0 w-[4px] bg-slate-400" />
          </div>

          {/* Mission Target Blip */}
          {currentStep?.targetPos && (
            <div
              className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border border-black shadow-[0_0_10px_#f59e0b] animate-ping"
              style={{
                left: `${THREE_clamp(((currentStep.targetPos[0] + 35) / 80) * 100, 10, 90)}%`,
                top: `${THREE_clamp(((currentStep.targetPos[2] + 75) / 110) * 100, 10, 90)}%`,
              }}
            />
          )}

          {/* Police Cruiser Radar Blip (Flashing Red/Blue) */}
          {wantedLevel >= 1 && (
            <div
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-lg animate-bounce"
              style={{
                backgroundColor: isEvading ? '#3b82f6' : '#ef4444',
                left: '60%',
                top: '40%',
              }}
            />
          )}

          {/* Player Directional Chevron Marker (Always in Center) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-cyan-400 drop-shadow-[0_0_6px_#22d3ee]" />
          </div>

          {/* Outer Compass Cardinal Marks */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-cyan-400 font-mono">
            N
          </div>
        </div>

        {/* Dual Health (Green) & Armor/Nitro (Blue) Gauge Bars directly below radar */}
        <div className="w-32 sm:w-36 flex flex-col gap-1">
          {/* Health (Green) */}
          <div className="h-2 w-full rounded-sm bg-black/80 border border-white/10 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-200"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          {/* Armor / Nitro Fuel (Blue) */}
          <div className="h-2 w-full rounded-sm bg-black/80 border border-white/10 overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 transition-all duration-200"
              style={{ width: `${nitroFuel}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CINEMATIC FULLSCREEN BANNERS ── */}

      {/* 1. MISSION PASSED */}
      {missionOutcome === 'passed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-black/90 border-y-4 border-amber-500 py-10 px-6 flex flex-col items-center gap-5 shadow-[0_0_80px_rgba(245,158,11,0.5)]">
            <div className="flex items-center gap-3">
              <Award className="w-10 h-10 text-amber-400" />
              <h1 className="text-4xl sm:text-6xl font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]">
                MISSION PASSED
              </h1>
            </div>

            <div className="text-lg sm:text-xl font-black text-white tracking-wide">
              {activeMission?.title || 'Contract Completed'}
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-center">
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  CASH EARNED
                </div>
                <div className="text-2xl font-black text-emerald-300 font-mono">
                  +${(activeMission?.cashReward || 20000).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-center">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  RP GAINED
                </div>
                <div className="text-2xl font-black text-blue-300 font-mono">
                  +{activeMission?.rpReward || 1500} RP
                </div>
              </div>
            </div>

            <button
              onClick={onDismissOutcome}
              className="mt-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(251,191,36,0.6)] active:scale-95 transition-all"
            >
              CONTINUE [ENTER]
            </button>
          </div>
        </div>
      )}

      {/* 2. BUSTED */}
      {missionOutcome === 'busted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-slate-900/90 border-y-4 border-blue-500 py-10 px-6 flex flex-col items-center gap-4 shadow-[0_0_80px_rgba(59,130,246,0.5)]">
            <h1 className="text-5xl sm:text-7xl font-black tracking-widest text-blue-400 uppercase drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]">
              BUSTED
            </h1>
            <p className="text-sm font-semibold text-slate-300 max-w-xs text-center">
              The Los Santos Police apprehended you. Vehicle impounded and medical release granted.
            </p>
            <button
              onClick={onDismissOutcome}
              className="mt-3 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all"
            >
              RESPAWN AT SHOWROOM
            </button>
          </div>
        </div>
      )}

      {/* 3. WASTED */}
      {missionOutcome === 'wasted' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="w-full bg-black/95 border-y-4 border-red-600 py-10 px-6 flex flex-col items-center gap-4 shadow-[0_0_80px_rgba(239,68,68,0.6)]">
            <h1 className="text-5xl sm:text-7xl font-black tracking-widest text-red-600 uppercase drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]">
              WASTED
            </h1>
            <p className="text-sm font-semibold text-slate-400 max-w-xs text-center">
              Vehicle totaled. Emergency repairs dispatched.
            </p>
            <button
              onClick={onDismissOutcome}
              className="mt-3 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase shadow-lg active:scale-95 transition-all"
            >
              RESPAWN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
