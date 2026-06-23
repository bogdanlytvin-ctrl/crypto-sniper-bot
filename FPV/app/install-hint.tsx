'use client';

import { useEffect, useState } from 'react';

const KEY = 'ftos:install-hint-dismissed';

// Одноразова ненав'язлива підказка: працює офлайн + можна встановити.
// Не показується, якщо вже закрито або застосунок запущено як standalone (встановлений).
export function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(KEY);
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!dismissed && !standalone) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="install-hint" role="note">
      <span>
        📡 Працює <b>без мережі</b>. Встанови як застосунок: меню браузера → «На головний екран».
      </span>
      <button onClick={dismiss} aria-label="Сховати підказку">
        ✕
      </button>
    </div>
  );
}
