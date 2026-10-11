/**
 * Synthesizes the iconic cinematic Netflix "Ta-dum" sound
 * using the Web Audio API with dual-impact sub-bass and D-minor harmonic shimmer.
 */
export function playTaDumSound(): boolean {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return false;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Master Dynamics Compressor (theater punch & saturation)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(24, now);
    compressor.ratio.setValueAtTime(14, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.25, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // ── HIT 1 ("TA" - Punchy mid-low transient) ─────────
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(115, now);
    osc1.frequency.exponentialRampToValueAtTime(38, now + 0.15);

    gain1.gain.setValueAtTime(0.9, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // ── HIT 2 ("DUM" - Heavy sub-bass impact at t = +0.17s) ───
    const hit2Time = now + 0.17;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(145, hit2Time);
    osc2.frequency.exponentialRampToValueAtTime(45, hit2Time + 0.42);

    gain2.gain.setValueAtTime(1.0, hit2Time);
    gain2.gain.exponentialRampToValueAtTime(0.001, hit2Time + 2.0);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(hit2Time);
    osc2.stop(hit2Time + 2.1);

    // Sub-bass heavy rumble for Hit 2
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, hit2Time);
    subOsc.frequency.exponentialRampToValueAtTime(26, hit2Time + 0.9);

    subGain.gain.setValueAtTime(1.0, hit2Time);
    subGain.gain.exponentialRampToValueAtTime(0.001, hit2Time + 2.3);

    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(hit2Time);
    subOsc.stop(hit2Time + 2.4);

    // ── Cinematic Shimmer Harmonics (D-minor chord spectrum) ──
    const harmonicFreqs = [146.83, 220.0, 293.66, 349.23, 440.0, 587.33, 880.0];
    harmonicFreqs.forEach((freq, idx) => {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();

      hOsc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      hOsc.frequency.setValueAtTime(freq, hit2Time);
      hOsc.detune.setValueAtTime((idx - 3) * 6, hit2Time);

      const amp = 0.25 / (idx + 1);
      hGain.gain.setValueAtTime(0.0001, hit2Time);
      hGain.gain.linearRampToValueAtTime(amp, hit2Time + 0.08);
      hGain.gain.exponentialRampToValueAtTime(0.0001, hit2Time + 2.5);

      hOsc.connect(hGain);
      hGain.connect(masterGain);
      hOsc.start(hit2Time);
      hOsc.stop(hit2Time + 2.6);
    });

    return true;
  } catch (err) {
    console.warn('Audio playback error:', err);
    return false;
  }
}
