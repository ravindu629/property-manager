// First-page preview image of a template, made in the browser and cached.

import { useEffect, useState } from 'react';
import { FileWarning } from 'lucide-react';
import type { Template } from '@pdfme/common';
import { getThumbnail } from '@/pdfme-demo/lib/pdf';
import type { Inputs } from '@/pdfme-demo/types';
import { Spinner } from '@/pdfme-demo/components/ui';

export function Thumbnail({
  cacheKey,
  load,
}: {
  /** Must change whenever the template changes (for example id + version). */
  cacheKey: string;
  /** Returns the template to draw. Called only when the preview is first needed. */
  load: () => Promise<{ template: Template; inputs?: Inputs }>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    load()
      .then(({ template, inputs }) => getThumbnail(cacheKey, template, inputs))
      .then((url) => !cancelled && setSrc(url))
      .catch((e) => {
        console.warn('Template preview failed:', e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // `load` is a new function on each render; the cache key is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return (
    <div className="flex aspect-[210/297] w-full items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-contain" draggable={false} />
      ) : failed ? (
        <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
          <FileWarning className="h-6 w-6" /> Preview unavailable
        </div>
      ) : (
        <Spinner className="h-5 w-5 text-slate-300" />
      )}
    </div>
  );
}
