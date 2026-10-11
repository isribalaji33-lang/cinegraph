import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

interface NetflixIntroProps {
  onFinish: () => void;
}

/**
 * Synthesizes the iconic cinematic Netflix "Ta-dum" sound
 * using the Web Audio API (deep dual-impact sub-bass + orchestral harmonic decay).
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

    // Master Dynamics & Compression
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-20, now);
    compressor.knee.setValueAtTime(30, now);
    compressor.ratio.setValueAtTime(12, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.3, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.9, now);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // ── HIT 1 ("TA" - Punchy mid-low transient) ─────────
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(42, now + 0.16);

    gain1.gain.setValueAtTime(0.85, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.17);

    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.19);

    // ── HIT 2 ("DUM" - Heavy sub impact at t = +0.18s) ───
    const hit2Time = now + 0.18;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(140, hit2Time);
    osc2.frequency.exponentialRampToValueAtTime(48, hit2Time + 0.45);

    gain2.gain.setValueAtTime(1.0, hit2Time);
    gain2.gain.exponentialRampToValueAtTime(0.001, hit2Time + 1.9);

    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(hit2Time);
    osc2.stop(hit2Time + 2.0);

    // Sub-bass heavy rumble
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, hit2Time);
    subOsc.frequency.exponentialRampToValueAtTime(30, hit2Time + 0.9);

    subGain.gain.setValueAtTime(0.95, hit2Time);
    subGain.gain.exponentialRampToValueAtTime(0.001, hit2Time + 2.2);

    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(hit2Time);
    subOsc.stop(hit2Time + 2.3);

    // ── Cinematic Shimmer Harmonics (D minor chord spectrum) ──
    const harmonicFreqs = [146.83, 220.0, 349.23, 440.0, 587.33, 880.0];
    harmonicFreqs.forEach((freq, idx) => {
      const hOsc = ctx.createOscillator();
      const hGain = ctx.createGain();

      hOsc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      hOsc.frequency.setValueAtTime(freq, hit2Time);
      hOsc.detune.setValueAtTime((idx - 2.5) * 5, hit2Time);

      const amp = 0.22 / (idx + 1);
      hGain.gain.setValueAtTime(0.0001, hit2Time);
      hGain.gain.linearRampToValueAtTime(amp, hit2Time + 0.08);
      hGain.gain.exponentialRampToValueAtTime(0.0001, hit2Time + 2.4);

      hOsc.connect(hGain);
      hGain.connect(masterGain);
      hOsc.start(hit2Time);
      hOsc.stop(hit2Time + 2.5);
    });

    return true;
  } catch (err) {
    console.warn('Audio playback error:', err);
    return false;
  }
}

export const NetflixIntro: React.FC<NetflixIntroProps> = ({ onFinish }) => {
  const [stage, setStage] = useState<'ribbon' | 'zoom' | 'fadeout'>('ribbon');
  const [soundPlayed, setSoundPlayed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Attempt immediate audio play
    const played = playTaDumSound();
    if (played) setSoundPlayed(true);

    // Animation timeline:
    // 0.0s - 1.2s: Initial ribbon and glow growth
    // 1.2s - 2.5s: Dynamic scale zoom & light ray explosion
    // 2.5s - 3.1s: Cinematic fadeout into profile selection
    const zoomTimer = setTimeout(() => {
      setStage('zoom');
    }, 1200);

    const fadeTimer = setTimeout(() => {
      setStage('fadeout');
    }, 2500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3100);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        onFinish();
      }
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onFinish]);

  const handleUserClick = () => {
    if (!soundPlayed) {
      playTaDumSound();
      setSoundPlayed(true);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleUserClick}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none cursor-pointer transition-opacity duration-700 ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ perspective: 1200 }}
    >
      {/* ── Background Red Ambient Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background:
            stage === 'zoom'
              ? 'radial-gradient(circle at center, rgba(229,9,20,0.35) 0%, rgba(20,0,5,0.85) 60%, #000 100%)'
              : 'radial-gradient(circle at center, rgba(229,9,20,0.18) 0%, rgba(10,0,0,0.9) 65%, #000 100%)',
        }}
      />

      {/* ── Netflix Prism Spectrum Light Rays ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => {
          const deg = i * 20;
          const colors = ['#e50914', '#b81d24', '#ff3344', '#ff8000', '#018bff', '#b8006b'];
          const color = colors[i % colors.length];
          return (
            <div
              key={i}
              className="absolute origin-center transition-all duration-1000"
              style={{
                width: stage === 'zoom' ? '280vw' : '0vw',
                height: stage === 'zoom' ? '4px' : '0px',
                transform: `rotate(${deg}deg)`,
                background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                opacity: stage === 'zoom' ? 0.35 : 0,
                filter: 'blur(2px)',
                transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          );
        })}
      </div>

      {/* ── Center CineGraph "C" Ribbon Logo Animation ── */}
      <div
        className="relative z-10 flex flex-col items-center justify-center"
        style={{
          transform:
            stage === 'zoom'
              ? 'scale(1.35) translateZ(80px)'
              : stage === 'fadeout'
              ? 'scale(2.2) translateZ(200px)'
              : 'scale(1)',
          transition: 'transform 1.3s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        {/* Glow Behind Logo */}
        <div
          className="absolute w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #e50914 0%, transparent 70%)',
            filter: 'blur(45px)',
            opacity: stage === 'zoom' ? 0.8 : 0.5,
            transition: 'opacity 0.8s ease',
          }}
        />

        {/* Cinematic Netflix-styled Ribbon Icon */}
        <div className="relative flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="w-32 h-32 sm:w-44 sm:h-44 drop-shadow-[0_0_40px_rgba(229,9,20,0.95)]"
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

            {/* Main Bold CineGraph "C" Shape with Arch */}
            <path
              d="M 68 24 C 60 16 46 16 34 24 C 20 34 18 66 34 76 C 46 84 60 84 68 76"
              fill="none"
              stroke="url(#nfRed1)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#cinematicGlow)"
              style={{
                strokeDasharray: 220,
                strokeDashoffset: stage === 'ribbon' ? 0 : 0,
                animation: 'dash 1.2s ease-out forwards',
              }}
            />

            {/* Inner Accent Ribbon Line */}
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

        {/* ── Cinematic Lettering "C I N E G R A P H" ── */}
        <div className="mt-6 flex items-center justify-center overflow-hidden">
          <h1
            className="text-2xl sm:text-4xl font-black font-heading tracking-[0.35em] sm:tracking-[0.5em] text-white uppercase"
            style={{
              textShadow:
                '0 0 20px rgba(229,9,20,0.9), 0 0 45px rgba(229,9,20,0.6), 0 2px 10px rgba(0,0,0,0.9)',
              letterSpacing: stage === 'zoom' ? '0.55em' : '0.35em',
              transition: 'letter-spacing 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            Cine<span style={{ color: '#e50914' }}>Graph</span>
          </h1>
        </div>

        <p className="text-[11px] font-mono tracking-[0.3em] uppercase text-red-400/80 mt-2">
          Neo4j Graph Cinema Engine
        </p>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFinish();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs font-mono text-white/80 hover:text-white hover:border-white/50 transition-colors backdrop-blur-sm"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span>Skip</span>
        </button>
      </div>

      {/* ── Audio Indicator / Hint ── */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 text-[11px] font-mono text-white/50">
        <Volume2 className="w-3.5 h-3.5 text-red-500 animate-pulse" />
        <span>Ta-dum Sound On</span>
      </div>
    </div>
  );
};
