'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Gift, CheckCircle2, RotateCcw, Zap } from 'lucide-react';

interface ScratchCardProps {
  originalPrice: number;
  discountedPrice: number;
  onReveal?: () => void;
  isRevealed?: boolean;
}

// Sparkle particle type
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

// Confetti piece type
interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  size: number;
  color: string;
  alpha: number;
}

export default function ScratchCard({
  originalPrice,
  discountedPrice,
  onReveal,
  isRevealed = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [revealed, setRevealed] = useState(isRevealed);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isAutoScratching, setIsAutoScratching] = useState(false);

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const discountAmount = originalPrice - discountedPrice;

  // Sound synthesis via Web Audio API (no external files needed)
  const playScratchSound = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate brief white noise burst with bandpass for realistic paper scratch
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400 + Math.random() * 600;
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const playSuccessChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Dual note chord chime (G5 -> C6)
      const now = ctx.currentTime;
      [784, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.06, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch {
      // Audio fallback
    }
  }, []);

  // Confetti celebration animation
  const launchConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#F43F5E', '#FCD34D'];
    const count = 45;
    const confettiList: Confetti[] = [];

    for (let i = 0; i < count; i++) {
      confettiList.push({
        x: rect.width / 2 + (Math.random() * 60 - 30),
        y: rect.height / 2 + (Math.random() * 30 - 15),
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }

    confettiRef.current = confettiList;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      confettiRef.current.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.22; // gravity
        c.rotation += c.vRot;
        c.alpha -= 0.012;

        if (c.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate((c.rotation * Math.PI) / 180);
          ctx.fillStyle = c.color;
          ctx.globalAlpha = Math.max(0, c.alpha);
          ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
          ctx.restore();
        }
      });

      if (alive) {
        confettiAnimRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    confettiAnimRef.current = requestAnimationFrame(animate);
  }, []);

  const handleComplete = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
      setScratchPercent(100);
      playSuccessChime();
      launchConfetti();

      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([30, 40, 50]);
        } catch {
          // ignore
        }
      }
      onReveal?.();
    }
  }, [revealed, onReveal, playSuccessChime, launchConfetti]);

  // Draw the high-end scratch foil surface
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Rich holographic silver & brushed gold gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#94A3B8');
    gradient.addColorStop(0.2, '#CBD5E1');
    gradient.addColorStop(0.35, '#F1F5F9');
    gradient.addColorStop(0.5, '#E2E8F0');
    gradient.addColorStop(0.75, '#CBD5E1');
    gradient.addColorStop(1, '#94A3B8');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative embossed guilloche dashed border
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.setLineDash([]);

    // Corner decorative stars
    ctx.fillStyle = '#64748B';
    ctx.font = '13px sans-serif';
    ctx.fillText('✦', 12, 20);
    ctx.fillText('✦', width - 20, 20);
    ctx.fillText('✦', 12, height - 12);
    ctx.fillText('✦', width - 20, height - 12);

    // Gold coin circle emblem
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2 - 14, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', width / 2, height / 2 - 13);
    ctx.restore();

    // Center badge & prompt text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL OFFER', width / 2, height / 2 + 13);

    ctx.fillStyle = '#475569';
    ctx.font = '500 10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Swipe finger / cursor here', width / 2, height / 2 + 28);
  }, [revealed]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // Scratch drawing mechanics with smooth line interpolation
  const scratchLine = (fromX: number, fromY: number, toX: number, toY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    const startX = (fromX - rect.left) * dpr;
    const startY = (fromY - rect.top) * dpr;
    const endX = (toX - rect.left) * dpr;
    const endY = (toY - rect.top) * dpr;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 26 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    playScratchSound();

    if (Math.random() > 0.4) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // ignore
        }
      }
    }
  };

  const checkScratchPercent = () => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    try {
      const step = 8;
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let transparentCount = 0;
      let totalSampled = 0;

      for (let i = 3; i < data.length; i += 4 * step) {
        totalSampled++;
        if (data[i] === 0) {
          transparentCount++;
        }
      }

      const percent = Math.round((transparentCount / totalSampled) * 100);
      setScratchPercent(percent);

      if (percent >= 30) {
        handleComplete();
      }
    } catch {
      // Fallback
    }
  };

  // Automated scratch simulation
  const handleAutoScratch = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (revealed || isAutoScratching) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      handleComplete();
      return;
    }

    setIsAutoScratching(true);
    const rect = canvas.getBoundingClientRect();
    const points: [number, number][] = [
      [rect.left + 20, rect.top + 20],
      [rect.right - 20, rect.top + 30],
      [rect.left + 30, rect.top + rect.height / 2],
      [rect.right - 30, rect.top + rect.height / 2],
      [rect.left + 20, rect.bottom - 20],
      [rect.right - 20, rect.bottom - 20],
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < points.length - 1) {
        const from = points[current];
        const to = points[current + 1];
        scratchLine(from[0], from[1], to[0], to[1]);
        current++;
      } else {
        clearInterval(interval);
        setIsAutoScratching(false);
        handleComplete();
      }
    }, 70);
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    scratchLine(e.clientX, e.clientY, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.stopPropagation();
    scratchLine(lastPointRef.current.x, lastPointRef.current.y, e.clientX, e.clientY);
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    checkScratchPercent();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Touch handlers (prevent page scroll while scratching)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    if (e.touches[0]) {
      const touch = e.touches[0];
      lastPointRef.current = { x: touch.clientX, y: touch.clientY };
      scratchLine(touch.clientX, touch.clientY, touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.stopPropagation();
    if (e.touches[0]) {
      const touch = e.touches[0];
      scratchLine(lastPointRef.current.x, lastPointRef.current.y, touch.clientX, touch.clientY);
      lastPointRef.current = { x: touch.clientX, y: touch.clientY };
      checkScratchPercent();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Reset scratch card so user can replay the delightful experience
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealed(false);
    setScratchPercent(0);
    setTimeout(() => {
      initCanvas();
    }, 50);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        revealed
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 shadow-md shadow-emerald-500/10'
          : 'border-amber-300/80 bg-gradient-to-br from-stone-100 to-amber-50 shadow-sm'
      } p-4`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Confetti canvas on top */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
      />

      {/* Revealed content underneath */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform ${
              revealed
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white scale-105 animate-pulse'
                : 'bg-stone-300 text-stone-600'
            }`}
          >
            <Gift size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-500" />
                <span>Special Offer Unlocked!</span>
              </span>
              <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 shadow-2xs">
                Save ₹{discountAmount}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-semibold text-stone-400 line-through decoration-rose-500 decoration-2">
                ₹{originalPrice}
              </span>
              <span className="text-2xl font-black text-stone-900 tracking-tight">
                ₹{discountedPrice}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                Offer Applied
              </span>
            </div>
          </div>
        </div>

        {revealed && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-emerald-800 text-[11px] font-bold bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Activated</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-0.5 font-semibold transition-colors mt-0.5"
              title="Scratch again"
            >
              <RotateCcw size={10} />
              <span>Replay</span>
            </button>
          </div>
        )}
      </div>

      {/* Canvas scratch surface overlay with Shimmer Sheen */}
      {!revealed && (
        <div className="absolute inset-0 cursor-crosshair touch-none select-none z-10 group overflow-hidden">
          {/* Animated Holographic Light Sheen */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />

          {/* Canvas for scratch removal */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Top Progress Badge */}
          {scratchPercent > 0 && scratchPercent < 30 && (
            <div className="pointer-events-none absolute top-2 left-2 text-[10px] font-extrabold bg-stone-900/85 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
              <span>🔥 {scratchPercent}%</span>
              <span className="text-[9px] text-stone-300">Scratch a bit more!</span>
            </div>
          )}

          {/* Quick Instant Reveal / Auto-Scratch Button */}
          <button
            type="button"
            onClick={handleAutoScratch}
            className="absolute bottom-2 right-2 text-[10px] font-extrabold text-stone-800 bg-white/95 hover:bg-white px-2.5 py-1 rounded-xl shadow-md transition-all flex items-center gap-1.5 border border-stone-300 active:scale-95 hover:shadow-lg cursor-pointer"
          >
            <Zap size={11} className="text-amber-500 fill-amber-500" />
            <span>Tap to Scratch</span>
          </button>
        </div>
      )}
    </div>
  );
}
