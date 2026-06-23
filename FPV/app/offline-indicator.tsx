'use client';

import { useEffect, useState } from 'react';

// Явний офлайн-стан: технік має знати, що зовнішні посилання не відкриються,
// а працює він з кешу. SSR-safe: стартує false (як на сервері), оновлюється по подіях.
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-bar" role="status">
      ● офлайн — працюю з кешу (зовнішні посилання недоступні)
    </div>
  );
}
