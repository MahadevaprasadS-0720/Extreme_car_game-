import React, { useRef, useEffect } from 'react';
import { CITY_STREETS, toCityMinimapCoords } from '../../utils/cityMinimap';

/**
 * TrackMinimap
 * BMW M-Style City Radar:
 * - High-contrast city street network layout with glowing neon arterials
 * - Real-time player position dot with glowing radar beacon
 * - Start / spawn line indicator
 */
export function TrackMinimap({ position }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw outer ambient radar grid ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 2 - 6, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Crosshair grid lines
    ctx.strokeStyle = 'rgba(0, 153, 218, 0.15)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 8);
    ctx.lineTo(width / 2, height - 8);
    ctx.moveTo(8, height / 2);
    ctx.lineTo(width - 8, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw City Street Network (Glowing Neon Arterials)
    ctx.shadowColor = '#0099da';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(0, 153, 218, 0.70)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    CITY_STREETS.forEach(([x1, z1, x2, z2]) => {
      const p1 = toCityMinimapCoords(x1, z1, width, height);
      const p2 = toCityMinimapCoords(x2, z2, width, height);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // 4. Inner Sharp Core Lines
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.lineWidth = 1.2;
    CITY_STREETS.forEach(([x1, z1, x2, z2]) => {
      const p1 = toCityMinimapCoords(x1, z1, width, height);
      const p2 = toCityMinimapCoords(x2, z2, width, height);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // 5. Start / Spawn Marker (Green)
    const p0 = toCityMinimapCoords(6.0, -28.0, width, height);
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p0.x, p0.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Real-time Player Car Dot (Crimson beacon with pulsing outer ripple)
    if (position && position.length >= 2) {
      const carMinimap = toCityMinimapCoords(position[0], position[1], width, height);

      // Outer radar pulse
      ctx.fillStyle = 'rgba(224, 0, 31, 0.25)';
      ctx.beginPath();
      ctx.arc(carMinimap.x, carMinimap.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Core player dot
      ctx.fillStyle = '#e0001f';
      ctx.shadowColor = '#e0001f';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(carMinimap.x, carMinimap.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // White center point
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(carMinimap.x, carMinimap.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [position]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-white/25">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0099da]" />
          <span className="text-[11px] font-bold tracking-wider text-slate-300">
            CITY RADAR
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">LIVE</span>
      </div>

      {/* Radar Canvas */}
      <div className="mt-2 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={130}
          height={130}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}
