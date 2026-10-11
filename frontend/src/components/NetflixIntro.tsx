import React, { useEffect, useState, useRef } from 'react';
import { Volume2, Play, SkipForward } from 'lucide-react';

interface NetflixIntroProps {
  onFinish: () => void;
}

/**
 * Synthesizes the iconic cinematic Netflix "Ta-dum" sound
 * using the Web Audio API with dual-impact sub-bass and D-minor harmonic resonance.
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

    // Master Dynamics & Compression (adds punch and theater presence)
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

    // ── Cinematic Shimmer Harmonics (D minor chord spectrum) ──
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

export const NetflixIntro: React.FC<NetflixIntroProps> = ({ onFinish }) => {
  // 'prompt' -> waiting for user gesture to start with 100% audio guarantee
  // 'playing' -> animation running with audio
  // 'zoom' -> lens flare & prism rays exploding
  // 'fadeout' -> dissolving into profile screen
  const [stage, setStage] = useState<'prompt' | 'playing' | 'zoom' | 'fadeout'>('prompt');
  const timerRefs = useRef<number[]>([]);

  const startIntro = () => {
    if (stage !== 'prompt') return;

    // Trigger audio immediately on the user's gesture (100% allowed by browser autoplay policy)
    playTaDumSound();
    setStage('playing');

    // Run cinematic animation sequence
    const t1 = window.setTimeout(() => setStage('zoom'), 1200);
    const t2 = window.setTimeout(() => setStage('fadeout'), 2600);
    const t3 = window.setTimeout(() => onFinish(), 3200);
    timerRefs.current.push(t1, t2, t3);
  };

  useEffect(() => {
    // Also listen for keydown (Space, Enter, Escape)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFinish();
      } else if (stage === 'prompt' && (e.key === ' ' || e.key === 'Enter')) {
        startIntro();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKey);
    };
  }, [stage, onFinish]);

  return (
    <div
      onClick={stage === 'prompt' ? startIntro : undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none cursor-pointer transition-opacity duration-700 ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ perspective: 1200 }}
    >
      {/* ── Background Ambient Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background:
            stage === 'zoom'
              ? 'radial-gradient(circle at center, rgba(229,9,20,0.4) 0%, rgba(25,0,5,0.9) 60%, #000 100%)'
              : 'radial-gradient(circle at center, rgba(229,9,20,0.2) 0%, rgba(10,0,0,0.95) 65%, #000 100%)',
        }}
      />

      {/* ── Netflix Prism Light Rays (visible once playing) ── */}
      {stage !== 'prompt' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => {
            const deg = i * 18;
            const colors = ['#e50914', '#b81d24', '#ff3344', '#ff8000', '#018bff', '#b8006b'];
            const color = colors[i % colors.length];
            return (
              <div
                key={i}
                className="absolute origin-center"
                style={{
                  width: stage === 'zoom' ? '300vw' : '10vw',
                  height: stage === 'zoom' ? '4px' : '2px',
                  transform: `rotate(${deg}deg)`,
                  background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                  opacity: stage === 'zoom' ? 0.45 : 0.1,
                  filter: 'blur(2px)',
                  transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Center CineGraph Ribbon Logo Animation ── */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{
          transform:
            stage === 'zoom'
              ? 'scale(1.4) translateZ(90px)'
              : stage === 'fadeout'
              ? 'scale(2.4) translateZ(220px)'
              : 'scale(1)',
          transition: 'transform 1.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        {/* Glow Behind Logo */}
        <div
          className="absolute w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #e50914 0%, transparent 70%)',
            filter: 'blur(50px)',
            opacity: stage === 'zoom' ? 0.9 : 0.5,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Netflix-style CineGraph "C" Ribbon */}
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-36 h-36 sm:w-48 sm:h-48 drop-shadow-[0_0_45px_rgba(229,9,20,0.95)]"
          >
            <defs>
              <linearGradient id="nfRed1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff2233" />
                <stop offset="60%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#99000a" />
              </linearGradient>
              <linearGradient id="nfRed2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#800008" />
                <stop offset="50%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#ff4455" />
              </linearGradient>
              <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Main Ribbon Arch */}
            <path
              d="M 68 24 C 60 16 46 16 34 24 C 20 34 18 66 34 76 C 46 84 60 84 68 76"
              fill="none"
              stroke="url(#nfRed1)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cinematicGlow)"
            />

            {/* Inner Accent Ribbon */}
            <path
              d="M 63 32 C 57 26 47 26 39 32 C 28 40 28 60 39 68 C 47 74 57 74 63 68"
              fill="none"
              stroke="url(#nfRed2)"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Cinematic Lettering "C I N E G R A P H" */}
        <div className="mt-6 flex items-center justify-center">
          <h1
            className="text-3xl sm:text-5xl font-black font-heading tracking-[0.35em] sm:tracking-[0.55em] text-white uppercase"
            style={{
              textShadow:
                '0 0 25px rgba(229,9,20,0.95), 0 0 50px rgba(229,9,20,0.65), 0 2px 10px rgba(0,0,0,0.9)',
              letterSpacing: stage === 'zoom' ? '0.65em' : '0.4em',
              transition: 'letter-spacing 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            Cine<span style={{ color: '#e50914' }}>Graph</span>
          </h1>
        </div>

        <p className="text-[11px] font-mono tracking-[0.35em] uppercase text-red-400/90 mt-2">
          Neo4j Graph Recommendation System
        </p>

        {/* ── Interactive Play / Enter Prompt (Guarantees Audio Playback) ── */}
        {stage === 'prompt' && (
          <div className="mt-10 flex flex-col items-center gap-3 animate-bounce">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startIntro();
              }}
              className="px-7 py-3 rounded-full bg-[#e50914] hover:bg-[#f40612] text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_35px_rgba(229,9,20,0.8)] hover:shadow-[0_0_55px_rgba(229,9,20,1)] hover:scale-105 flex items-center gap-3 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>Click to Enter [Ta-dum Sound]</span>
            </button>
            <span className="text-xs text-[#a3a3b3] font-mono">
              or click anywhere to begin
            </span>
          </div>
        )}
      </div>

      {/* ── Skip Control ── */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFinish();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs font-mono text-white/80 hover:text-white hover:border-white/50 transition-colors backdrop-blur-sm cursor-pointer"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip [Esc]</span>
        </button>
      </div>
    </div>
  );
};
