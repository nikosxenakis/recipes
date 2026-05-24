import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wakeLockEnabled';

function readInitial(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === 'true';
}

export function useWakeLockPreference(): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(readInitial);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  }, [enabled]);

  return [enabled, setEnabled];
}
