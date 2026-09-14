import React, { useRef, useEffect } from 'react';
import { CITY_STREETS, toCityMinimapCoords } from '../../utils/cityMinimap';

export function SpeedometerHUD({ telemetry, bestLap }) {
  const {
    speed = 0,
    rpm = 1000,
    gear = 1,
    lap = 1,
    lapCurrentTime = 0,
    position = [0, 0],
  } = telemetry || {};

  const minimapCanvasRef = useRef();

  // Format seconds to mm:ss.ms
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00.000';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Draw 2D Minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // City streets
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    CITY_STREETS.forEach(([x1, z1, x2, z2]) => {
      const p1 = toCityMinimapCoords(x1, z1, width, height);
      const p2 = toCityMinimapCoords(x2, z2, width, height);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    });
    ctx.stroke();

    // Start line indicator
    const p0 = toCityMinimapCoords(2.5, -15, width, height);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(p0.x, p0.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Car position dot
    const carMinimap = toCityMinimapCoords(position[0], position[1], width, height);
    ctx.fillStyle = '#ff3366';
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(carMinimap.x, carMinimap.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [position]);

  // Calculate RPM percentage (1000 to 8500)
  const rpmPercent = Math.min(Math.max(((rpm - 1000) / 7500) * 100, 0), 100);

  return (
    <>
      {/* Top Bar: Lap Time & Mini-map */}
      <div className="hud-top">
        {/* Brand & Circuit Name */}
        <div className="glass-panel brand-badge">
          <div>
            <div className="brand-title">APEX VELOCITY</div>
            <div className="brand-sub">METROPOLITAN CITY CIRCUIT</div>
          </div>
        </div>

        {/* Lap Timing */}
        <div className="glass-panel lap-card">
          <div className="lap-label">LAP {lap}</div>
          <div className="lap-time">{formatTime(lapCurrentTime)}</div>
          <div className="lap-best">
            BEST: {bestLap ? formatTime(bestLap) : '--:--.---'}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Telemetry, Speedometer, Minimap */}
      <div className="hud-bottom">
        {/* Speedometer Cluster */}
        <div className="telemetry-cluster">
          <div className="glass-panel speed-gauge">
            <div className="speed-digital-row">
              <span className="speed-value">{speed}</span>
              <span className="speed-unit">KM/H</span>
            </div>

            {/* Gear Indicator */}
            <div className="gear-indicator">
              <span className="gear-label">GEAR</span>
              <span className="gear-digit">{gear}</span>
            </div>

            {/* RPM Progress Bar */}
            <div className="rpm-container">
              <div className="rpm-track">
                <div
                  className="rpm-fill"
                  style={{ width: `${rpmPercent}%` }}
                />
              </div>
              <div className="rpm-text-row">
                <span>1</span>
                <span>3</span>
                <span>5</span>
                <span>7</span>
                <span style={{ color: '#ff3366' }}>8.5k</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimap Panel */}
        <div className="glass-panel minimap-panel">
          <div className="minimap-title">TRACK RADAR</div>
          <canvas
            ref={minimapCanvasRef}
            width={140}
            height={140}
            className="minimap-canvas"
          />
        </div>
      </div>
    </>
  );
}
