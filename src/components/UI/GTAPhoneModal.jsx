import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  ShieldAlert,
  Award,
  DollarSign,
  Clock,
  ChevronRight,
  Wifi,
  Battery,
  Radio,
  Zap,
} from 'lucide-react';
import { GTA_MISSIONS } from '../../utils/gtaMissions';
import { audioSynthesizer } from '../../utils/audioSynthesizer';

/**
 * GTAPhoneModal
 * Authentic iFruit Smartphone sliding up from bottom right:
 * - Contact List & Story Mission contracts
 * - Lester "Lose Heat" emergency service
 * - Job details, rewards, and one-click launch
 */
export function GTAPhoneModal({
  isOpen,
  onClose,
  onStartMission,
  activeMission,
  wantedLevel = 0,
  onClearWantedLevel,
  playerCash = 250000,
}) {
  const [selectedMission, setSelectedMission] = useState(null);
  const [lesterCalling, setLesterCalling] = useState(false);

  if (!isOpen) return null;

  const handleSelectMission = (mission) => {
    setSelectedMission(mission);
  };

  const handleLaunch = () => {
    if (!selectedMission) return;
    audioSynthesizer.playPoliceRadio();
    onStartMission(selectedMission);
    setSelectedMission(null);
    onClose();
  };

  const handleCallLester = () => {
    if (wantedLevel <= 0) return;
    setLesterCalling(true);
    audioSynthesizer.playPoliceRadio();
    setTimeout(() => {
      onClearWantedLevel();
      setLesterCalling(false);
      audioSynthesizer.playCashChime();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end p-4 sm:p-6 md:p-8">
      {/* Smartphone Container */}
      <div className="pointer-events-auto w-full max-w-[340px] sm:max-w-[360px] h-[580px] rounded-[42px] border-[6px] border-[#222834] bg-[#0c1018] shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(0,242,254,0.15)] flex flex-col overflow-hidden relative transform transition-all duration-300 animate-in slide-in-from-bottom-12">
        {/* Phone Speaker Notch & Camera */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <div className="w-12 h-1.5 rounded-full bg-[#1e2530]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#111827] border border-white/10" />
        </div>

        {/* Top Status Bar */}
        <div className="pt-5 px-6 pb-2 flex items-center justify-between text-[11px] font-bold text-slate-300 z-10 select-none">
          <span className="font-mono">10:45 AM</span>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[9px] tracking-wider text-cyan-400">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-green-400" />
            <button
              onClick={onClose}
              className="ml-1 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Wallpaper Header */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-purple-900/60 via-blue-900/40 to-slate-900/80 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">iFruit 9X OS</div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>LOS SANTOS JOBS</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">BALANCE</div>
            <div className="text-sm font-black text-emerald-400 font-mono">
              ${playerCash.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Phone Content Screen */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
          {selectedMission ? (
            /* Selected Mission Briefing Card */
            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedMission(null)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                ← Back to Contracts
              </button>

              <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 space-y-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-2xl shadow-inner">
                    {selectedMission.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{selectedMission.title}</div>
                    <div className="text-xs font-semibold text-purple-400">{selectedMission.contact}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 italic">
                  "{selectedMission.dialogue}"
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Cash Payout</div>
                    <div className="text-base font-black text-emerald-300 font-mono">
                      +${selectedMission.cashReward.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <div className="text-[9px] uppercase tracking-wider text-blue-400 font-bold">Reputation</div>
                    <div className="text-base font-black text-blue-300 font-mono">
                      +{selectedMission.rpReward} RP
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Time: {selectedMission.timeLimit}s
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Heat: {selectedMission.wantedOnStart > 0 ? `${selectedMission.wantedOnStart} Stars` : 'None'}
                  </span>
                </div>

                <button
                  onClick={handleLaunch}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(34,197,94,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  ACCEPT & START MISSION
                </button>
              </div>
            </div>
          ) : (
            /* Contact List & Mission Cards */
            <div className="space-y-2.5">
              {/* Lester "Lose Cops" Quick Action */}
              {wantedLevel >= 1 && (
                <div className="p-3 rounded-2xl border border-red-500/40 bg-red-950/40 backdrop-blur-md flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-lg">
                      🕶️
                    </div>
                    <div>
                      <div className="text-xs font-black text-red-300">CALL LESTER</div>
                      <div className="text-[10px] text-red-400">Remove Wanted Level ($2,500)</div>
                    </div>
                  </div>
                  <button
                    onClick={handleCallLester}
                    disabled={lesterCalling}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-black tracking-wide shadow-md active:scale-95 transition-all"
                  >
                    {lesterCalling ? 'CONNECTING...' : 'CALL'}
                  </button>
                </div>
              )}

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
                AVAILABLE CONTRACTS ({GTA_MISSIONS.length})
              </div>

              {GTA_MISSIONS.map((mission) => {
                const isActive = activeMission?.id === mission.id;
                return (
                  <div
                    key={mission.id}
                    onClick={() => handleSelectMission(mission)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? 'border-cyan-400/60 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,242,254,0.2)]'
                        : 'border-white/10 bg-slate-900/70 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {mission.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">{mission.title}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-cyan-500 text-black uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-purple-400">{mission.contact}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          +${(mission.cashReward / 1000).toFixed(0)}K
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">{mission.timeLimit}s</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Phone Bottom Home Bar */}
        <div className="p-3 bg-[#080b10] border-t border-white/5 flex items-center justify-around">
          <div
            onClick={onClose}
            className="w-24 h-1 rounded-full bg-slate-600 hover:bg-slate-400 cursor-pointer transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
