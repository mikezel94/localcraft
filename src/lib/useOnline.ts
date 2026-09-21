import { useEffect, useState } from 'react';

function readOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/** Live online/offline state. SSR-safe (defaults to online for prerender). */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(readOnline);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return online;
}
