import React, { useMemo } from 'react';
import { X, Sparkles, Sun, Palette, Keyboard, Cpu, Monitor } from 'lucide-react';
import { getHardwareInfo } from '../../utils/hardwareDetector';

export function SettingsModal({
  isOpen,
  onClose,
  timeOfDay,
  setTimeOfDay,
  carColor,
  setCarColor,
  postProcessingSettings,
  setPostProcessingSettings,
  graphicsTier = 'auto',
  setGraphicsTier,
  trackLoading,
  underglowColor = '#6b17d9',
  setUnderglowColor,
  smokeColor = '#ffffff',
  setSmokeColor,
  rimColor = '#111317',
  setRimColor,
  windowTint = 0.92,
  setWindowTint,
  drivingAssists = { abs: true, tc: true, esp: true },
  setDrivingAssists,
  drivingMode = 'simulator',
  setDrivingMode,
  steeringMode = 'buttons',
  setSteeringMode,
}) {
  if (!isOpen) return null;

  const hardwareInfo = useMemo(() => getHardwareInfo(), []);

  const carColors = [
    { name: '★ Extreme Royal Purple (Signature)', color: '#6b17d9' },
    { name: 'Isle of Man Green', color: '#004f38' },
    { name: 'Tanzanite Blue II', color: '#0f284e' },
    { name: 'Sao Paulo Yellow', color: '#d4ff00' },
    { name: 'Toronto Red', color: '#b31b1b' },
    { name: 'Frozen Portimao Blue', color: '#1c4e80' },
    { name: 'Black Sapphire', color: '#111317' },
    { name: 'Alpine White', color: '#f0f2f5' },
    { name: 'Viper Sunset Orange', color: '#ea580c' },
  ];

  const underglowOptions = [
    { name: 'Royal Purple', color: '#6b17d9' },
    { name: 'Electric Cyan', color: '#00f2fe' },
    { name: 'Acid Lime', color: '#22c55e' },
    { name: 'Crimson Red', color: '#ef4444' },
    { name: 'Amber Gold', color: '#f59e0b' },
    { name: 'Underglow Off', color: 'none' },
  ];

  const smokeOptions = [
    { name: 'White Mist', color: '#e8ecf2' },
    { name: 'Royal Violet', color: '#8b5cf6' },
    { name: 'Electric Cyan', color: '#06b6d4' },
    { name: 'Hot Orange', color: '#f97316' },
  ];

  const rimOptions = [
    { name: 'Stealth Black', color: '#111317' },
    { name: 'Chrome Silver', color: '#d1d5db' },
    { name: 'Bronze Gold', color: '#b48c36' },
    { name: 'Racing Red', color: '#b91c1c' },
  ];

  const handleToggle = (key) => {
    setPostProcessingSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content interactive max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyan-400" size={20} />
            <div className="modal-title">Extreme Garage & Tuning</div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {/* 1. Car Paint Livery */}
        <div className="settings-section">
          <div className="settings-section-title">Car Body Paint (PBR Clearcoat)</div>
          <div className="settings-grid">
            {carColors.map((c) => (
              <button
                key={c.color}
                className={`settings-btn-option ${carColor === c.color ? 'selected' : ''}`}
                onClick={() => setCarColor(c.color)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: c.color,
                    boxShadow: `0 0 8px ${c.color}88, inset 0 0 3px rgba(255,255,255,0.6)`,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <span className={c.name.includes('★') ? 'text-amber-300 font-bold' : ''}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Neon Underglow Chassis Lighting */}
        {setUnderglowColor && (
          <div className="settings-section">
            <div className="settings-section-title">Neon Underglow LED Tubes</div>
            <div className="settings-grid">
              {underglowOptions.map((u) => (
                <button
                  key={u.color}
                  className={`settings-btn-option ${underglowColor === u.color ? 'selected' : ''}`}
                  onClick={() => setUnderglowColor(u.color)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: u.color === 'none' ? '#334155' : u.color,
                      boxShadow: u.color === 'none' ? 'none' : `0 0 10px ${u.color}`,
                    }}
                  />
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Custom Tire Smoke Color */}
        {setSmokeColor && (
          <div className="settings-section">
            <div className="settings-section-title">Custom Drift & Burnout Tire Smoke</div>
            <div className="settings-grid">
              {smokeOptions.map((s) => (
                <button
                  key={s.color}
                  className={`settings-btn-option ${smokeColor === s.color ? 'selected' : ''}`}
                  onClick={() => setSmokeColor(s.color)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      boxShadow: `0 0 8px ${s.color}`,
                    }}
                  />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Wheel Rims & Window Tint */}
        <div className="settings-section">
          <div className="settings-section-title">Alloy Wheel Rims Finish</div>
          <div className="settings-grid">
            {rimOptions.map((r) => (
              <button
                key={r.color}
                className={`settings-btn-option ${rimColor === r.color ? 'selected' : ''}`}
                onClick={() => setRimColor && setRimColor(r.color)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: r.color,
                  }}
                />
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Lighting & Environment */}
        <div className="settings-section">
          <div className="settings-section-title">Lighting & Environment</div>
          <div className="settings-grid">
            {['sunset', 'daylight', 'night'].map((t) => (
              <button
                key={t}
                className={`settings-btn-option ${timeOfDay === t ? 'selected' : ''}`}
                onClick={() => setTimeOfDay(t)}
              >
                {t === 'sunset' && '🌅 Sunset'}
                {t === 'daylight' && '☀️ Daylight'}
                {t === 'night' && '🌙 Night GP'}
              </button>
            ))}
          </div>
        </div>

        {/* 6. City Track Graphics Quality */}
        <div className="settings-section">
          <div className="flex items-center justify-between mb-2">
            <div className="settings-section-title" style={{ marginBottom: 0 }}>
              City Track Graphics Quality
            </div>
            {trackLoading?.isLoading && (
              <span className="text-[11px] font-mono font-bold text-amber-400 animate-pulse">
                SWITCHING {trackLoading.progress}%...
              </span>
            )}
          </div>

          <div className="settings-grid">
            <button
              className={`settings-btn-option ${graphicsTier === 'auto' ? 'selected' : ''}`}
              onClick={() => setGraphicsTier && setGraphicsTier('auto')}
            >
              ⚡ Auto ({hardwareInfo.recommendedTier.toUpperCase()})
            </button>
            <button
              className={`settings-btn-option ${graphicsTier === '1k' ? 'selected' : ''}`}
              onClick={() => setGraphicsTier && setGraphicsTier('1k')}
            >
              🚀 Performance 1K
            </button>
            <button
              className={`settings-btn-option ${graphicsTier === '4k' ? 'selected' : ''}`}
              onClick={() => setGraphicsTier && setGraphicsTier('4k')}
            >
              💎 Ultra 4K
            </button>
          </div>
        </div>

        {/* 7. Controls Guide */}
        <div className="settings-section" style={{ marginBottom: 0 }}>
          <div className="settings-section-title">Extreme Controls Guide</div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <div><strong>W / Up Arrow / Gas Pedal:</strong> Supercar Acceleration</div>
            <div><strong>S / Down Arrow / Brake Pedal:</strong> Brake & Instant Reverse</div>
            <div><strong>A / D / Steer Arrows / Steering Wheel:</strong> Steering</div>
            <div><strong>Space / (P) Button:</strong> Handbrake / Power Drift</div>
            <div><strong>Shift / N / NOS Button:</strong> Nitro Boost (Surges to 330+ km/h!)</div>
            <div><strong>Wrench Button:</strong> Instant 100% Chassis Repair</div>
            <div><strong>R / Reset Button:</strong> Car Reset</div>
            <div><strong>C / Camera Button:</strong> Cycle Chase / Hood / Cockpit Views</div>
          </div>
        </div>
      </div>
    </div>
  );
}
