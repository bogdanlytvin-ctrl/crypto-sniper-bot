'use client';

import { useEffect } from 'react';

// Реєструє service worker для офлайн-режиму. Тільки у проді — у dev заважає HMR.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* офлайн — не критично, ігноруємо */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}
