import React from 'react';
import { SpeedometerCluster } from './SpeedometerCluster';
import { DriftScoreCounter } from './DriftScoreCounter';
import { TrackMinimap } from './TrackMinimap';

/**
 * BMWMStyleHUD
 * Sleek, minimalist BMW M-Style glassmorphism HUD:
 * 1. Digital Speedometer (km/h) with smooth numerical interpolation
 * 2. Curved LED Tachometer / RPM Gauge with redline warning flash at 7000+ RPM
 * 3. Current Gear Indicator (P, R, N, 1-6 shift simulation)
 * 4. Real-time Drift Score counter (multiplier based on drift angle and continuous duration)
 * 5. Mini-map showing track layout and real-time player position dot
 */
export function BMWMStyleHUD({ telemetry, bestLap, controlsOverlay }) {
  const {
    lap = 1,
    lapCurrentTime = 0,
    position = [0, 0],
  } = telemetry || {};

  // Format seconds to mm:ss.ms
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00.000';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <>
      {/* ── Top HUD Layer: Brand & Lap Timing ──────────────────────────────── */}
      <div className="flex w-full items-start justify-between">
        {/* Brand & Circuit Banner */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3.5 shadow-2xl backdrop-blur-2xl transition-all hover:border-white/25">
          {/* M Tri-Color Top Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="w-1/3 bg-[#0099da]" />
            <div className="w-1/3 bg-[#00205b]" />
            <div className="w-1/3 bg-[#e0001f]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0099da] font-black text-sm">///</span>
                <span className="font-racing font-black text-base tracking-wider text-white">
                  APEX VELOCITY
                </span>
                <span className="rounded bg-[#e0001f] px-1.5 py-0.2 text-[9px] font-black tracking-widest text-white">
                  CSL
                </span>
              </div>
              <span className="text-[10px] font-semibold tracking-widest text-slate-400">
                METROPOLITAN CITY TRACK
              </span>
            </div>
          </div>
        </div>

        {/* Lap Timing Glass Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3.5 shadow-2xl backdrop-blur-2xl transition-all hover:border-white/25">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold tracking-widest text-slate-400">
                LAP {lap}
              </span>
            </div>

            {/* Current Running Lap Time */}
            <div className="mt-0.5 font-mono text-2xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              {formatTime(lapCurrentTime)}
            </div>

            {/* Best Lap Record */}
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span>BEST:</span>
              <span className="font-bold text-emerald-400">
                {bestLap ? formatTime(bestLap) : '--:--.---'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center HUD Layer: Real-time Drift Score Counter ───────────────── */}
      <DriftScoreCounter telemetry={telemetry} />

      {/* ── Bottom HUD Layer: Cockpit Telemetry, Controls & Minimap ───────── */}
      <div className="flex w-full items-end justify-between gap-4 pb-1">
        {/* Speedometer, Curved LED Tachometer & Gear Indicator Cluster */}
        <div className="w-[340px] pointer-events-auto">
          <SpeedometerCluster telemetry={telemetry} />
        </div>

        {/* Center Quick Actions / Settings / Camera Controls */}
        {controlsOverlay && (
          <div className="pointer-events-auto pb-1">
            {controlsOverlay}
          </div>
        )}

        {/* Track Minimap Radar */}
        <div className="w-[160px] pointer-events-auto">
          <TrackMinimap position={position} />
        </div>
      </div>
    </>
  );
}
