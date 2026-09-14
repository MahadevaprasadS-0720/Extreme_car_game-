/**
 * Procedural Web Audio API Sound Engine — BMW M4 CSL
 *
 * Architecture:
 *  - Engine: 4 layered oscillators (fundamental saw, 2nd harmonic square,
 *    sub-octave triangle, 4th-harmonic distortion) through a resonant
 *    lowpass filter simulating intake/exhaust tract.
 *  - Waveshaper distortion: Adds valve-engine grit at mid-high RPM.
 *  - Turbo: Bandpass-filtered noise representing boost hiss + whistle.
 *  - Exhaust crackle + backfire: Short random bursts on throttle-off at high RPM.
 *  - Tire screech: Pink-noise filtered bandpass, triggered by slip angle.
 *  - Wind: High-pass noise rising quadratically with speed.
 */

// ── Waveshaper curve for engine harmonic distortion ────────────────────────
function makeDistortionCurve(amount = 40) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.isMuted = false;

    // Node refs
    this.masterGain  = null;

    // Engine layer nodes
    this.engGain      = null;
    this.engFilter    = null;
    this.engFilter2   = null;   // 2nd stage bandpass for cylinder character
    this.distortion   = null;   // WaveShaper for gritty harmonics
    this.distGain     = null;   // Wet/dry blend of distortion
    this.osc1 = null;   // Fundamental (sawtooth)
    this.osc2 = null;   // 2nd harmonic (square)
    this.osc3 = null;   // Sub-octave growl (triangle)
    this.osc4 = null;   // 4th harmonic (sawtooth, low gain) — adds top-end rasp

    // Turbo boost hiss
    this.turboGain    = null;
    this.turboFilter  = null;
    this.turboWhistle = null;   // Sine oscillator for spooling whistle tone
    this.turboWhistleGain = null;
    this.turboSource  = null;

    // Exhaust crackle
    this._lastCrackleTime = 0;
    this.crackleGain = null;

    // Tire screech
    this.skidGain    = null;
    this.skidFilter  = null;
    this.skidSource  = null;

    // Wind
    this.windGain    = null;
    this.windFilter  = null;
    this.windSource  = null;

    // Prev-frame state
    this._prevRpm      = 1000;
    this._prevThrottle = false;
    this._prevSlip     = 0;
  }

  // ────────────────────────────────────────────────────────
  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // ── Master bus ────────────────────────────────────
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.42;
      this.masterGain.connect(this.ctx.destination);

      // ── Engine Synthesizer ────────────────────────────
      this.engGain = this.ctx.createGain();
      this.engGain.gain.value = 0;

      // Stage 1: broad resonant lowpass — simulates exhaust tract resonance
      this.engFilter = this.ctx.createBiquadFilter();
      this.engFilter.type = 'lowpass';
      this.engFilter.frequency.value = 300;
      this.engFilter.Q.value = 5.0;

      // Stage 2: bandpass centered on cylinder-fire frequency
      this.engFilter2 = this.ctx.createBiquadFilter();
      this.engFilter2.type = 'bandpass';
      this.engFilter2.frequency.value = 180;
      this.engFilter2.Q.value = 0.8;

      // WaveShaper distortion (adds engine grit)
      this.distortion = this.ctx.createWaveShaper();
      this.distortion.curve = makeDistortionCurve(35);
      this.distortion.oversample = '4x';

      // Mix node: blend clean + distorted signal
      this.distGain = this.ctx.createGain();
      this.distGain.gain.value = 0.55;   // mix amount — increases with RPM

      // Fundamental: detuned sawtooth
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'sawtooth';
      this.osc1.frequency.value = 58;

      // 2nd harmonic: square for cylinder-fire "chug"
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'square';
      this.osc2.frequency.value = 116;

      // Sub-octave growl for inline-6 / V8 low-end thunder
      this.osc3 = this.ctx.createOscillator();
      this.osc3.type = 'triangle';
      this.osc3.frequency.value = 29;

      // 4th harmonic: high rasp (thin sawtooth, low gain)
      this.osc4 = this.ctx.createOscillator();
      this.osc4.type = 'sawtooth';
      this.osc4.frequency.value = 232;

      // Per-oscillator gain for harmonic balance
      const g1 = this.ctx.createGain(); g1.gain.value = 0.50;
      const g2 = this.ctx.createGain(); g2.gain.value = 0.26;
      const g3 = this.ctx.createGain(); g3.gain.value = 0.18;
      const g4 = this.ctx.createGain(); g4.gain.value = 0.06;

      // Signal path: oscs → engFilter → engFilter2 → (split: clean + distorted)
      this.osc1.connect(g1); g1.connect(this.engFilter);
      this.osc2.connect(g2); g2.connect(this.engFilter);
      this.osc3.connect(g3); g3.connect(this.engFilter);
      this.osc4.connect(g4); g4.connect(this.engFilter);

      this.engFilter.connect(this.engFilter2);

      // Distorted path
      this.engFilter2.connect(this.distortion);
      this.distortion.connect(this.distGain);
      this.distGain.connect(this.engGain);

      // Clean path in parallel
      this.engFilter2.connect(this.engGain);

      this.engGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.osc3.start();
      this.osc4.start();

      // ── Turbo Hiss + Spool Whistle ─────────────────────
      this.turboGain   = this.ctx.createGain();
      this.turboGain.gain.value = 0;
      this.turboFilter = this.ctx.createBiquadFilter();
      this.turboFilter.type = 'bandpass';
      this.turboFilter.frequency.value = 1800;
      this.turboFilter.Q.value = 1.4;
      this.turboSource = this._makeLoopNoise(this.ctx, 2.0);
      this.turboSource.connect(this.turboFilter);
      this.turboFilter.connect(this.turboGain);
      this.turboGain.connect(this.masterGain);
      this.turboSource.start();

      // Turbo whistle: rising sine tone on boost
      this.turboWhistle = this.ctx.createOscillator();
      this.turboWhistle.type = 'sine';
      this.turboWhistle.frequency.value = 1800;
      this.turboWhistleGain = this.ctx.createGain();
      this.turboWhistleGain.gain.value = 0;
      this.turboWhistle.connect(this.turboWhistleGain);
      this.turboWhistleGain.connect(this.masterGain);
      this.turboWhistle.start();

      // ── Exhaust crackle gain node ──────────────────────
      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.value = 0;
      this.crackleGain.connect(this.masterGain);

      // ── Tire Screech ───────────────────────────────────
      this.skidGain   = this.ctx.createGain();
      this.skidGain.gain.value = 0;
      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.value = 1400;
      this.skidFilter.Q.value = 2.8;
      this.skidSource = this._makeLoopNoise(this.ctx, 1.5);
      this.skidSource.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterGain);
      this.skidSource.start();

      // ── Wind Noise ─────────────────────────────────────
      this.windGain   = this.ctx.createGain();
      this.windGain.gain.value = 0;
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'highpass';
      this.windFilter.frequency.value = 900;
      this.windFilter.Q.value = 0.65;
      this.windSource = this._makeLoopNoise(this.ctx, 2.5);
      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.windSource.start();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio could not initialize:', e);
    }
  }

  // ── Helpers ────────────────────────────────────────────

  /** Create a looping pink-ish noise buffer source. */
  _makeLoopNoise(ctx, seconds = 1.5) {
    const rate = ctx.sampleRate;
    const buf  = ctx.createBuffer(1, Math.ceil(rate * seconds), rate);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      b3 = 0.18000 * b3 + white * 0.4800000;
      data[i] = (b0 + b1 + b2 + b3 + white * 0.1848) * 0.14;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop   = true;
    return src;
  }

  /** Fire a short exhaust-pop impulse (crackle / backfire). */
  _fireCrackle(intensity = 0.3) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this._lastCrackleTime < 0.06) return; // rate-limit
    this._lastCrackleTime = now;

    // Short sawtooth burst (exhaust pop)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 65 + Math.random() * 190;

    // Quick ADSR envelope
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(intensity, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.10 + Math.random() * 0.06);

    // Highpass to cut mud
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 120;

    osc.connect(hpf);
    hpf.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  resume() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ── Main per-frame update ──────────────────────────────
  /**
   * @param {object} p
   * @param {number}  p.speed    km/h
   * @param {number}  p.rpm      engine RPM (800–8500)
   * @param {boolean} p.throttle is throttle pressed
   * @param {number}  p.slip     normalised lateral slip 0–1
   */
  update({ speed = 0, rpm = 1000, throttle = false, slip = 0 }) {
    if (!this.initialized || this.isMuted) return;
    if (!this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const tau = 0.042; // global smoothing time constant (s)

    // ── Normalised RPM (0 at 800, 1 at 8500) ─────────────
    const normRpm     = Math.min(Math.max((rpm - 800) / 7700, 0), 1);
    const fundamental = 50 + normRpm * 430; // 50 Hz idle → 480 Hz redline

    // ── Engine oscillator pitch ───────────────────────────
    this.osc1.frequency.setTargetAtTime(fundamental,       now, tau * 0.75);
    this.osc2.frequency.setTargetAtTime(fundamental * 2,   now, tau * 0.75);
    this.osc3.frequency.setTargetAtTime(fundamental * 0.5, now, tau * 0.75);
    this.osc4.frequency.setTargetAtTime(fundamental * 4,   now, tau * 0.75);

    // ── Filter tuning — opens with throttle + RPM ─────────
    const throttleMult = throttle ? 1.0 : 0.5;
    const cutoff1 = 200 + normRpm * 2600 * throttleMult + (throttle ? 400 : 0);
    this.engFilter.frequency.setTargetAtTime(Math.min(cutoff1, 5000), now, tau);
    this.engFilter.Q.value = 5.0 - normRpm * 2.0;   // Q sharpens at idle, softens at redline

    const cutoff2 = 100 + normRpm * 350;
    this.engFilter2.frequency.setTargetAtTime(cutoff2, now, tau * 1.2);

    // ── Distortion amount — increases with RPM ────────────
    const distAmount = 20 + normRpm * 55;
    this.distortion.curve = makeDistortionCurve(distAmount);
    // Wet mix: more distortion at high RPM + throttle
    const distMix = 0.25 + normRpm * 0.45 + (throttle ? 0.15 : 0);
    this.distGain.gain.setTargetAtTime(Math.min(distMix, 0.85), now, tau);

    // ── Engine volume — idle murmur → full roar ───────────
    // Non-linear curve: soft at low RPM, exponential swell on throttle
    const rpmSwell  = 0.15 + normRpm * normRpm * 0.85;
    const baseVol   = 0.12 + rpmSwell * 0.26;
    const throttleBoost = throttle ? 0.38 * rpmSwell : 0.04 * rpmSwell;
    const vol = Math.min(baseVol + throttleBoost, 0.78);
    this.engGain.gain.setTargetAtTime(vol, now, tau * 0.9);

    // ── Turbo hiss + spool whistle ────────────────────────
    const boostOnset  = Math.max(normRpm - 0.30, 0) / 0.70;  // kicks in at 30% RPM
    const boostAmount = throttle ? Math.pow(boostOnset, 1.2) : 0;

    this.turboGain.gain.setTargetAtTime(boostAmount * 0.13, now, tau * 1.8);
    this.turboFilter.frequency.setTargetAtTime(1500 + boostAmount * 1400, now, tau);

    // Whistle pitch: 2.2k → 5k Hz as turbo spools
    const whistlePitch = 2200 + boostAmount * 2800;
    const whistleVol   = boostAmount * 0.018;
    this.turboWhistle.frequency.setTargetAtTime(whistlePitch, now, tau * 2);
    this.turboWhistleGain.gain.setTargetAtTime(whistleVol, now, tau * 2);

    // ── Exhaust crackle + backfire on throttle-lift ───────
    const throttleLift = this._prevThrottle && !throttle;
    if (throttleLift && normRpm > 0.40) {
      const count = 2 + Math.floor(normRpm * 4);
      const intensity = 0.18 + normRpm * 0.25;
      for (let i = 0; i < count; i++) {
        setTimeout(() => this._fireCrackle(intensity), i * (45 + Math.random() * 90));
      }
    }

    // ── Tire screech — pitch + volume from slip ────────────
    const skidIntensity = Math.min(Math.max(slip, 0), 1);
    // Ramp in quickly, ramp out smoothly
    const skidAttack = skidIntensity > this._prevSlip ? 0.018 : 0.055;
    const skidVol    = speed > 12 ? skidIntensity * 0.55 : 0;
    this.skidGain.gain.setTargetAtTime(skidVol, now, skidAttack);
    this.skidFilter.frequency.setTargetAtTime(1100 + skidIntensity * 1200, now, 0.035);
    this.skidFilter.Q.value = 2.0 + skidIntensity * 1.5;

    // ── Wind noise — quadratic with speed ─────────────────
    const windNorm = Math.min(speed / 260, 1);
    this.windGain.gain.setTargetAtTime(windNorm * windNorm * 0.16, now, tau * 2.5);
    this.windFilter.frequency.setTargetAtTime(700 + windNorm * 3500, now, tau);

    // ── Save state ────────────────────────────────────────
    this._prevRpm      = rpm;
    this._prevThrottle = throttle;
    this._prevSlip     = skidIntensity;
  }

  // ── Nitro NOS Roar & Flame Blast ──────────────────────────
  playNitro(active) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (!this._nitroGain) {
      this._nitroGain = this.ctx.createGain();
      this._nitroGain.gain.value = 0;

      // Bandpass noise for roaring flame combustion
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'bandpass';
      nitroFilter.frequency.value = 1800;
      nitroFilter.Q.value = 1.2;

      whiteNoise.connect(nitroFilter);
      nitroFilter.connect(this._nitroGain);
      this._nitroGain.connect(this.masterGain);
      whiteNoise.start();
    }

    this._nitroGain.gain.setTargetAtTime(active ? 0.38 : 0, now, active ? 0.05 : 0.15);
  }

  // ── Crash Collision Impact ────────────────────────────────
  playCrash(severity = 1.0) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const s = Math.min(1.0, Math.max(0.2, severity));

    // Low boom oscillator
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'triangle';
    boom.frequency.setValueAtTime(140, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    boomGain.gain.setValueAtTime(0.55 * s, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    boom.connect(boomGain);
    boomGain.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + 0.4);

    // Metal crunch noise burst
    const crunchBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.25), this.ctx.sampleRate);
    const crunchData = crunchBuffer.getChannelData(0);
    for (let i = 0; i < crunchData.length; i++) {
      crunchData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
    }
    const crunchSource = this.ctx.createBufferSource();
    crunchSource.buffer = crunchBuffer;

    const crunchFilter = this.ctx.createBiquadFilter();
    crunchFilter.type = 'lowpass';
    crunchFilter.frequency.setValueAtTime(1800, now);
    crunchFilter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

    const crunchGain = this.ctx.createGain();
    crunchGain.gain.setValueAtTime(0.48 * s, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    crunchSource.connect(crunchFilter);
    crunchFilter.connect(crunchGain);
    crunchGain.connect(this.masterGain);
    crunchSource.start(now);
  }

  // ── Wrench Instant Repair Shimmer & Chime ─────────────────
  playRepair() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 3-note ascending magic sparkle chord: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.5);
    });
  }

  // ── Speed Trap Radar Camera Shutter Click ─────────────────
  playSpeedTrap() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dual metallic clicks (shutter open + close)
    [0, 0.08].forEach((timeOffset) => {
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'square';
      click.frequency.setValueAtTime(2400, now + timeOffset);
      click.frequency.exponentialRampToValueAtTime(400, now + timeOffset + 0.035);

      clickGain.gain.setValueAtTime(0.4, now + timeOffset);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.04);

      click.connect(clickGain);
      clickGain.connect(this.masterGain);
      click.start(now + timeOffset);
      click.stop(now + timeOffset + 0.045);
    });
  }

  // ── Police Siren System (Dual-Tone Wail / Yelp) ─────────
  playPoliceSiren(active) {
    if (!this.ctx || this.isMuted) {
      if (this.sirenGain) {
        this.sirenGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
      }
      return;
    }

    const now = this.ctx.currentTime;
    if (active) {
      if (!this.sirenOsc) {
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc2 = this.ctx.createOscillator();
        this.sirenGain = this.ctx.createGain();
        this.sirenLfo = this.ctx.createOscillator();
        this.sirenLfoGain = this.ctx.createGain();

        this.sirenOsc.type = 'sawtooth';
        this.sirenOsc2.type = 'square';
        this.sirenOsc.frequency.value = 750;
        this.sirenOsc2.frequency.value = 754;

        // LFO modulating pitch for continuous wail siren
        this.sirenLfo.frequency.value = 0.45; // 0.45 Hz wail cycle
        this.sirenLfoGain.gain.value = 320;   // sweeps from 430Hz to 1070Hz

        this.sirenLfo.connect(this.sirenOsc.frequency);
        this.sirenLfo.connect(this.sirenOsc2.frequency);

        this.sirenFilter = this.ctx.createBiquadFilter();
        this.sirenFilter.type = 'bandpass';
        this.sirenFilter.frequency.value = 900;
        this.sirenFilter.Q.value = 2.5;

        this.sirenOsc.connect(this.sirenFilter);
        this.sirenOsc2.connect(this.sirenFilter);
        this.sirenFilter.connect(this.sirenGain);
        this.sirenGain.connect(this.masterGain);

        this.sirenOsc.start(now);
        this.sirenOsc2.start(now);
        this.sirenLfo.start(now);
      }
      this.sirenGain.gain.cancelScheduledValues(now);
      this.sirenGain.gain.setTargetAtTime(0.22, now, 0.08);
    } else if (this.sirenGain) {
      this.sirenGain.gain.cancelScheduledValues(now);
      this.sirenGain.gain.setTargetAtTime(0.0001, now, 0.15);
    }
  }

  // ── Police Dispatch Radio Squawk ────────────────────────
  playPoliceRadio() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Noise burst representing radio transmission key-in
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1600;
    bpf.Q.value = 4.0;

    const squawkGain = this.ctx.createGain();
    squawkGain.gain.setValueAtTime(0.18, now);
    squawkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(bpf);
    bpf.connect(squawkGain);
    squawkGain.connect(this.masterGain);
    noise.start(now);
  }

  // ── GTA 5 Iconic "MISSION PASSED" Fanfare ───────────────
  playMissionPassed() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Majestic brass chord progression: Eb4 -> G4 -> Bb4 -> Eb5 (Triumphant Major Arpeggio)
    const notes = [
      { freq: 311.13, start: 0.00, dur: 0.35, gain: 0.28 }, // Eb4
      { freq: 392.00, start: 0.16, dur: 0.35, gain: 0.28 }, // G4
      { freq: 466.16, start: 0.32, dur: 0.40, gain: 0.30 }, // Bb4
      { freq: 622.25, start: 0.50, dur: 1.20, gain: 0.38 }, // Eb5 (sustained chord root)
      { freq: 311.13, start: 0.50, dur: 1.20, gain: 0.32 }, // Eb4 underlay
      { freq: 783.99, start: 0.65, dur: 1.05, gain: 0.25 }, // G5 brass sheen
    ];

    notes.forEach(({ freq, start, dur, gain: vol }) => {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc2.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);
      osc2.frequency.setValueAtTime(freq * 1.002, now + start);

      f.type = 'lowpass';
      f.frequency.setValueAtTime(1400, now + start);
      f.frequency.exponentialRampToValueAtTime(4200, now + start + 0.15);
      f.frequency.exponentialRampToValueAtTime(1800, now + start + dur);

      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.linearRampToValueAtTime(vol, now + start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(f);
      osc2.connect(f);
      f.connect(g);
      g.connect(this.masterGain);

      osc.start(now + start);
      osc2.start(now + start);
      osc.stop(now + start + dur);
      osc2.stop(now + start + dur);
    });
  }

  // ── GTA Mission Failed Tones ───────────────────────────
  playMissionFailed() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Descending melancholy low brass: F3 -> Db3 -> C3
    [
      { freq: 174.61, start: 0.0, dur: 0.5 },
      { freq: 138.59, start: 0.4, dur: 0.6 },
      { freq: 130.81, start: 0.9, dur: 1.4 },
    ].forEach(({ freq, start, dur }) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + start);

      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.linearRampToValueAtTime(0.35, now + start + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  }

  // ── GTA Cash Register Ding ─────────────────────────────
  playCashChime() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Metallic chime high frequency ring
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6
    osc.frequency.setValueAtTime(2637, now + 0.07); // E7

    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // ── GTA In-Car Procedural Radio Stations ───────────────
  playRadioStation(stationId) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Clean up any currently running radio interval
    if (this._radioInterval) {
      clearInterval(this._radioInterval);
      this._radioInterval = null;
    }
    if (this._radioGain) {
      this._radioGain.gain.setTargetAtTime(0.0001, now, 0.1);
    }

    if (stationId === 0 || this.isMuted) {
      return; // Radio Off
    }

    if (!this._radioGain) {
      this._radioGain = this.ctx.createGain();
      this._radioGain.connect(this.masterGain);
    }
    this._radioGain.gain.cancelScheduledValues(now);
    this._radioGain.gain.setValueAtTime(0.18, now);

    let step = 0;
    // Station 1: Radio Los Santos (92 BPM hip hop funk groove)
    // Station 2: Non-Stop Pop FM (120 BPM upbeat synthpop)
    // Station 3: Soulwax FM (132 BPM electro techno)
    const bpm = stationId === 1 ? 92 : (stationId === 2 ? 120 : 132);
    const intervalMs = (60 / bpm / 2) * 1000; // 8th note steps

    this._radioInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      step = (step + 1) % 16;

      if (stationId === 1) {
        // Radio Los Santos: 808 kick on 0, 6, 10, snare clap on 4, 12, synth bassline
        if (step === 0 || step === 6 || step === 10) {
          const kick = this.ctx.createOscillator();
          const kg = this.ctx.createGain();
          kick.frequency.setValueAtTime(120, t);
          kick.frequency.exponentialRampToValueAtTime(36, t + 0.18);
          kg.gain.setValueAtTime(0.4, t);
          kg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          kick.connect(kg);
          kg.connect(this._radioGain);
          kick.start(t);
          kick.stop(t + 0.25);
        }
        if (step === 4 || step === 12) {
          const clap = this.ctx.createOscillator();
          const cg = this.ctx.createGain();
          clap.type = 'triangle';
          clap.frequency.setValueAtTime(450, t);
          cg.gain.setValueAtTime(0.2, t);
          cg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          clap.connect(cg);
          cg.connect(this._radioGain);
          clap.start(t);
          clap.stop(t + 0.15);
        }
      } else if (stationId === 2) {
        // Non-Stop Pop FM: 4-on-the-floor kick, cheerful synth chord stabs
        if (step % 4 === 0) {
          const kick = this.ctx.createOscillator();
          const kg = this.ctx.createGain();
          kick.frequency.setValueAtTime(140, t);
          kick.frequency.exponentialRampToValueAtTime(48, t + 0.12);
          kg.gain.setValueAtTime(0.35, t);
          kg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          kick.connect(kg);
          kg.connect(this._radioGain);
          kick.start(t);
          kick.stop(t + 0.18);
        }
        if (step % 2 === 1) {
          const chordNotes = [523.25, 659.25, 783.99]; // C major
          chordNotes.forEach((fn) => {
            const osc = this.ctx.createOscillator();
            const og = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(fn, t);
            og.gain.setValueAtTime(0.12, t);
            og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(og);
            og.connect(this._radioGain);
            osc.start(t);
            osc.stop(t + 0.12);
          });
        }
      } else if (stationId === 3) {
        // Soulwax FM: Driving 16th note synth arps & heavy electro kick
        if (step % 4 === 0) {
          const kick = this.ctx.createOscillator();
          const kg = this.ctx.createGain();
          kick.frequency.setValueAtTime(160, t);
          kick.frequency.exponentialRampToValueAtTime(42, t + 0.14);
          kg.gain.setValueAtTime(0.45, t);
          kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          kick.connect(kg);
          kg.connect(this._radioGain);
          kick.start(t);
          kick.stop(t + 0.2);
        }
        // Synth bass rolling notes
        const bassFreq = [55, 65.41, 73.42, 82.41][step % 4];
        const bass = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(bassFreq, t);
        bg.gain.setValueAtTime(0.15, t);
        bg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        bass.connect(bg);
        bg.connect(this._radioGain);
        bass.start(t);
        bass.stop(t + 0.1);
      }
    }, intervalMs);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.42,
        this.ctx.currentTime,
        0.06
      );
    }
    return this.isMuted;
  }
}

export const audioSynthesizer = new SoundEngine();
