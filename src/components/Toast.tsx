'use client';

import { useEffect, useState } from 'react';
import { useRegistrationStore } from '@/store/useRegistration';

export default function Toast() {
  const { toastMessage, toastType, hideToast } = useRegistrationStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(hideToast, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  const bgMap = {
    success: 'bg-emerald-500/90 border-emerald-400',
    error: 'bg-red-500/90 border-red-400',
    info: 'bg-indigo-500/90 border-indigo-400',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        bgMap[toastType]
      } ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
    >
      <span className="text-white text-lg font-bold">{iconMap[toastType]}</span>
      <p className="text-white text-sm font-medium">{toastMessage}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(hideToast, 300);
        }}
        className="ml-2 text-white/70 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
