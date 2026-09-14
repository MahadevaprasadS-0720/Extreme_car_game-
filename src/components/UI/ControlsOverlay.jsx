import React from 'react';
import { Camera, Volume2, VolumeX, RotateCcw, Settings, Sun, Moon, Sunset } from 'lucide-react';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

export function ControlsOverlay({
  cameraMode,
  setCameraMode,
  timeOfDay,
  setTimeOfDay,
  isMuted,
  setIsMuted,
  onOpenSettings,
  onResetCar,
}) {
  const toggleCamera = () => {
    // Mirrors App.jsx C-key cycle: Chase → Hood → Cockpit → Chase
    if (cameraMode === 'chase')   setCameraMode('hood');
    else if (cameraMode === 'hood')    setCameraMode('cockpit');
    else setCameraMode('chase');
  };

  const toggleSound = () => {
    const muted = audioSynthesizer.toggleMute();
    setIsMuted(muted);
  };

  const cycleTimeOfDay = () => {
    if (timeOfDay === 'sunset') setTimeOfDay('daylight');
    else if (timeOfDay === 'daylight') setTimeOfDay('night');
    else setTimeOfDay('sunset');
  };

  const getTimeIcon = () => {
    if (timeOfDay === 'sunset') return <Sunset size={16} />;
    if (timeOfDay === 'daylight') return <Sun size={16} />;
    return <Moon size={16} />;
  };

  return (
    <div className="actions-cluster interactive">
      {/* Time of Day Cycle */}
      <button
        className="btn-icon-pill"
        onClick={cycleTimeOfDay}
        title="Cycle Time of Day"
      >
        {getTimeIcon()}
        <span>{timeOfDay.toUpperCase()}</span>
      </button>

      {/* Camera Mode Toggle */}
      <button
        className="btn-icon-pill"
        onClick={toggleCamera}
        title="Switch Camera [C] — Chase / Hood / Cockpit"
      >
        <Camera size={16} />
        <span>{cameraMode.toUpperCase()}</span>
      </button>

      {/* Audio Mute / Unmute */}
      <button
        className={`btn-icon-pill ${isMuted ? '' : 'active'}`}
        onClick={toggleSound}
        title="Toggle Engine & Skid Audio"
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        <span>{isMuted ? 'MUTED' : 'AUDIO'}</span>
      </button>

      {/* Reset Car Position */}
      <button
        className="btn-icon-pill"
        onClick={onResetCar}
        title="Reset Car (Key R)"
      >
        <RotateCcw size={16} />
        <span>RESET [R]</span>
      </button>

      {/* Settings Modal */}
      <button
        className="btn-icon-pill"
        onClick={onOpenSettings}
        title="Graphics & Physics Settings"
      >
        <Settings size={16} />
        <span>SETTINGS</span>
      </button>
    </div>
  );
}
