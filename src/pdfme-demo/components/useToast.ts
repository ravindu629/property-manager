// Short status messages ("Saved", errors) shown in the corner of the screen.

import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastState = { id: number; kind: ToastKind; text: string } | null;

/** Returns [toast, showToast]. Render <ToastView toast={toast} /> once in the page. */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), kind, text });
    // Errors stay longer so they can be read.
    timer.current = window.setTimeout(() => setToast(null), kind === 'error' ? 8000 : 3500);
  }, []);

  return [toast, show] as const;
}
