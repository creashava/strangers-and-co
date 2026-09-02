'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Gift, CheckCircle2 } from 'lucide-react';

interface ScratchCardProps {
  originalPrice: number;
  discountedPrice: number;
  onReveal?: () => void;
  isRevealed?: boolean;
}

export default function ScratchCard({
  originalPrice,
  discountedPrice,
  onReveal,
  isRevealed = false,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(isRevealed);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);

  const discountAmount = originalPrice - discountedPrice;

  const handleComplete = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }
      onReveal?.();
    }
  }, [revealed, onReveal]);

  // Draw the scratch foil surface
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

    // Metallic silver / brushed gold foil gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#94A3B8');
    gradient.addColorStop(0.3, '#CBD5E1');
    gradient.addColorStop(0.5, '#E2E8F0');
    gradient.addColorStop(0.7, '#CBD5E1');
    gradient.addColorStop(1, '#94A3B8');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative dashed border
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.setLineDash([]);

    // Sparkle star accents
    ctx.fillStyle = '#64748B';
    ctx.font = '14px sans-serif';
    ctx.fillText('✦', 16, 24);
    ctx.fillText('✦', width - 26, height - 16);

    // Center icon & prompt text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙 SCRATCH FOR OFFER', width / 2, height / 2 - 10);

    ctx.fillStyle = '#475569';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText('Swipe finger / cursor to reveal', width / 2, height / 2 + 12);
  }, [revealed]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // Scratch drawing mechanics
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const x = (clientX - rect.left) * dpr;
    const y = (clientY - rect.top) * dpr;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Check scratch progress every few scratches
    checkScratchPercent();
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
      // Sample 1/4th resolution for performance
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

      if (percent >= 28) {
        handleComplete();
      }
    } catch {
      // Fallback
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDrawing(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDrawing(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.stopPropagation();
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDrawing(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-amber-50 p-4 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Revealed content underneath */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-bounce">
            <Gift size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                🎉 Offer Unlocked!
              </span>
              <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Save ₹{discountAmount}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-semibold text-stone-400 line-through decoration-rose-500 decoration-2">
                ₹{originalPrice}
              </span>
              <span className="text-xl font-black text-stone-900 tracking-tight">
                ₹{discountedPrice}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Applied to pass
              </span>
            </div>
          </div>
        </div>

        {revealed && (
          <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Canvas scratch surface overlay */}
      {!revealed && (
        <div className="absolute inset-0 cursor-crosshair touch-none select-none">
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
          {/* Instant reveal helper button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleComplete();
            }}
            className="absolute bottom-1.5 right-2 text-[10px] font-bold text-stone-600 bg-white/90 hover:bg-white px-2 py-0.5 rounded-full shadow-2xs transition-all flex items-center gap-1 border border-stone-300/80 active:scale-95"
          >
            <Sparkles size={10} className="text-amber-500" />
            <span>Tap to reveal</span>
          </button>
        </div>
      )}
    </div>
  );
}
