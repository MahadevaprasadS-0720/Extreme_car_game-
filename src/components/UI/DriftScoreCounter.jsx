import React, { useState, useEffect, useRef } from 'react';

/**
 * DriftScoreCounter
 * Real-time Drift Score counter with:
 * - Dynamic multiplier based on drift angle and continuous duration (x1.0 -> x5.0)
 * - Drift slip angle gauge in degrees (e.g. 35° DRIFT)
 * - Animated points counter with bank animation when drift concludes cleanly
 */
export function DriftScoreCounter({ telemetry }) {
  const {
    isDrifting = false,
    driftAngle = 0,
    driftScore = 0,
    totalDriftBank = 0,
    driftMultiplier = 1.0,
  } = telemetry || {};

  const [lastBankedScore, setLastBankedScore] = useState(0);
  const [showBankAlert, setShowBankAlert] = useState(false);
  const prevBankRef = useRef(totalDriftBank);
  const hideTimerRef = useRef();

  useEffect(() => {
    if (totalDriftBank > prevBankRef.current) {
      const bankedDiff = totalDriftBank - prevBankRef.current;
      setLastBankedScore(bankedDiff);
      setShowBankAlert(true);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowBankAlert(false);
      }, 2200);
    }
    prevBankRef.current = totalDriftBank;
  }, [totalDriftBank]);

  // If not drifting and no bank banner active, hide to keep HUD minimal
  if (!isDrifting && !showBankAlert && totalDriftBank === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      {/* Active Drift Scoring Banner */}
      {isDrifting && (
        <div className="flex flex-col items-center animate-drift">
          {/* Glassmorphic Container with BMW M Tri-Color Border */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/80 px-7 py-3 shadow-[0_0_35px_rgba(0,153,218,0.35)] backdrop-blur-2xl">
            {/* Top Tri-Color Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="w-1/3 bg-[#0099da]" />
              <div className="w-1/3 bg-[#00205b]" />
              <div className="w-1/3 bg-[#e0001f]" />
            </div>

            <div className="flex items-center gap-4">
              {/* Drift Badge & Angle */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-black tracking-widest text-amber-400">
                    DRIFT
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {driftAngle}° ANGLE
                </span>
              </div>

              {/* Multiplier Badge */}
              <div className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#0099da]/30 to-[#e0001f]/30 border border-white/20 px-3 py-1">
                <span className="font-mono text-lg font-black tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  {driftMultiplier.toFixed(1)}x
                </span>
              </div>

              {/* Real-time Accumulated Points */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold tracking-wider text-slate-400">
                  SCORE
                </span>
                <span className="font-mono text-2xl font-black tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,170,0,0.8)]">
                  +{driftScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Angle Progress Indicator */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0099da] via-[#ffaa00] to-[#e0001f] transition-all duration-75"
                style={{ width: `${Math.min((driftAngle / 65) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drift Banked Notification (when drift completes cleanly) */}
      {!isDrifting && showBankAlert && (
        <div className="animate-bounce flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-slate-950/85 px-5 py-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-2xl">
          <span className="text-emerald-400 text-sm font-black">✓ BANKED</span>
          <span className="font-mono text-lg font-bold text-white">
            +{lastBankedScore.toLocaleString()} PTS
          </span>
        </div>
      )}

      {/* Total Career Drift Bank Counter */}
      {totalDriftBank > 0 && !isDrifting && !showBankAlert && (
        <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          <span className="text-[#0099da] font-bold">DRIFT TOTAL:</span>
          <span className="font-bold text-white">{totalDriftBank.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
