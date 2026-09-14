import React, { useState, useEffect, useRef } from 'react';

/**
 * SpeedometerCluster
 * BMW M-Performance Glassmorphism Cluster:
 * - Smooth digital speedometer with interpolated numbers (km/h)
 * - Curved LED Tachometer / RPM Gauge with progressive color segments
 * - Redline warning flash at 7000+ RPM
 * - BMW M-Style Gear Indicator (P, R, N, 1-6)
 */
export function SpeedometerCluster({ telemetry }) {
  const {
    speed = 0,
    preciseSpeed = 0,
    rpm = 1000,
    preciseRpm = 1000,
    gear = 'P',
  } = telemetry || {};

  // Smooth numerical interpolation for speedometer display
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const [displayRpm, setDisplayRpm] = useState(1000);
  const speedLerpRef = useRef(0);
  const rpmLerpRef = useRef(1000);
  const animFrameRef = useRef();

  useEffect(() => {
    const updateInterpolation = () => {
      // Exponential moving average for smooth jitter-free 60fps interpolation
      speedLerpRef.current += (preciseSpeed - speedLerpRef.current) * 0.22;
      rpmLerpRef.current += (preciseRpm - rpmLerpRef.current) * 0.25;

      setDisplaySpeed(Math.round(speedLerpRef.current));
      setDisplayRpm(Math.round(rpmLerpRef.current));

      animFrameRef.current = requestAnimationFrame(updateInterpolation);
    };

    animFrameRef.current = requestAnimationFrame(updateInterpolation);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [preciseSpeed, preciseRpm]);

  // RPM percentage from 1000 to 8500
  const rpmPercent = Math.min(Math.max((displayRpm - 1000) / 7500, 0), 1);
  const isRedline = displayRpm >= 7000;
  const isShiftWarning = displayRpm >= 7500;

  // Generate 28 LED tachometer segments along an arc
  const totalSegments = 28;
  const activeSegments = Math.round(rpmPercent * totalSegments);

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-white/25">
      {/* BMW M Tri-Color Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 flex">
        <div className="w-1/3 bg-[#0099da]" />   {/* M Light Blue */}
        <div className="w-1/3 bg-[#00205b]" />   {/* M Dark Blue */}
        <div className="w-1/3 bg-[#e0001f]" />   {/* M Red */}
      </div>

      {/* Redline Warning Strobe Background Glow */}
      {isRedline && (
        <div className="pointer-events-none absolute inset-0 animate-redline bg-red-600/15 rounded-2xl" />
      )}

      {/* Cluster Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {/* M Power Logo Badge */}
          <div className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-white">
            <span className="text-[#0099da] font-black">///</span>
            <span>M POWER</span>
          </div>
          <span className="text-[11px] font-medium tracking-wider text-slate-400">TELEMETRY</span>
        </div>

        {/* Shift Prompt when at high RPM */}
        {isShiftWarning && (
          <div className="flex items-center gap-1 animate-pulse px-2 py-0.5 rounded bg-red-600/30 border border-red-500 text-[11px] font-bold text-red-400">
            <span>▲ SHIFT</span>
          </div>
        )}
      </div>

      {/* Main Cluster Body */}
      <div className="mt-4 flex items-center justify-between gap-6">
        {/* Digital Speedometer */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-5xl font-black tracking-tighter text-white tabular-nums drop-shadow-[0_0_16px_rgba(255,255,255,0.25)]">
              {displaySpeed}
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-400">
              KM/H
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span>SPEED</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span className="font-mono text-slate-300">{Math.round(displaySpeed * 0.621371)} MPH</span>
          </div>
        </div>

        {/* Gear Indicator Badge */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-xl border font-mono text-3xl font-black transition-all duration-200 ${
              isRedline
                ? 'border-red-500 bg-red-600/25 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : gear === 'R'
                ? 'border-amber-500 bg-amber-600/20 text-amber-400'
                : gear === 'P'
                ? 'border-slate-600 bg-slate-800/40 text-slate-400'
                : 'border-[#0099da]/40 bg-[#0099da]/10 text-white shadow-[0_0_14px_rgba(0,153,218,0.2)]'
            }`}
          >
            {gear}
          </div>
          <span className="mt-1.5 text-[10px] font-bold tracking-widest text-slate-400">
            GEAR
          </span>
        </div>
      </div>

      {/* Curved / Segmented LED Tachometer / RPM Gauge */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full transition-colors duration-150 ${isRedline ? 'bg-red-500 animate-ping' : 'bg-[#0099da]'}`} />
            TACHOMETER
          </span>
          <span className="font-mono text-white">
            <span className={isRedline ? 'text-red-400 font-bold' : 'text-slate-200'}>
              {displayRpm.toLocaleString()}
            </span>{' '}
            <span className="text-[10px] text-slate-500">RPM</span>
          </span>
        </div>

        {/* 28-Segment Curved LED Bar Display */}
        <div className="mt-2.5 flex items-center gap-1 p-1.5 rounded-lg bg-black/40 border border-white/5">
          {Array.from({ length: totalSegments }).map((_, i) => {
            const isActive = i < activeSegments;
            const segmentRpm = 1000 + (i / totalSegments) * 7500;
            const isRedZone = segmentRpm >= 7000;
            const isOrangeZone = segmentRpm >= 5500 && segmentRpm < 7000;

            let activeColor = 'bg-[#0099da] shadow-[0_0_8px_rgba(0,153,218,0.8)]'; // M Light Blue
            if (isOrangeZone) activeColor = 'bg-[#ffaa00] shadow-[0_0_8px_rgba(255,170,0,0.8)]'; // Amber
            if (isRedZone) {
              activeColor = isRedline
                ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,1)]'
                : 'bg-red-600/90 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
            }

            return (
              <div
                key={i}
                style={{
                  height: `${14 + (i / totalSegments) * 8}px`, // Progressive height sweep (BMW M style)
                }}
                className={`flex-1 rounded-[2px] transition-all duration-100 ${
                  isActive
                    ? activeColor
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Tachometer Tick Labels */}
        <div className="mt-1.5 flex justify-between px-1 text-[10px] font-mono text-slate-500">
          <span>1</span>
          <span>3</span>
          <span>5</span>
          <span className="text-amber-500/80">6.5</span>
          <span className="font-bold text-red-500">8.5k</span>
        </div>
      </div>
    </div>
  );
}
