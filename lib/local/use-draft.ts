'use client';

import { useEffect, useRef, useState } from 'react';
import { loadDraft, saveDraft } from './store';

/**
 * Persist a piece of state to IndexedDB (debounced) and restore it on mount.
 * Behaves exactly like useState when storage is unavailable. `restored` is true once the saved value (if any) was loaded.
 */
export function useLocalDraft<T>(key: string, initial: T, delayMs = 600): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadDraft<T>(key).then((saved) => {
      // Do not clobber what the user already typed while the draft was loading.
      if (!cancelled && saved !== undefined && !touched.current) setValue(saved);
      if (!cancelled) setRestored(true);
    });
    return () => { cancelled = true; };
  }, [key]);

  useEffect(() => {
    if (!restored) return;
    touched.current = true;
    const t = setTimeout(() => { saveDraft(key, value); }, delayMs);
    return () => clearTimeout(t);
  }, [key, value, restored, delayMs]);

  return [value, setValue, restored];
}
