// PDF helpers for the pdfme demo: generate a PDF, make template thumbnails,
// and fill missing input values.

import { getInputFromTemplate, type Template } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { demoPlugins } from '@/pdfme-demo/plugins';
import type { Inputs } from '@/pdfme-demo/types';

/** Default inputs taken from the template itself (each editable field's sample content). */
export function defaultInputs(template: Template): Inputs {
  return getInputFromTemplate(template);
}

/** Generates the PDF. Missing values fall back to the template's sample content. */
export async function generatePdf(template: Template, inputs?: Inputs): Promise<Blob> {
  const defaults = defaultInputs(template)[0] ?? {};
  const rows = inputs && inputs.length > 0 ? inputs : [{}];
  const merged = rows.map((row) => ({ ...defaults, ...row }));
  // Note: values for editable fields are used exactly as given. (Number formatting only
  // changes inside {placeholder} text, which the demo templates do not use.)
  const bytes = await generate({ template, inputs: merged, plugins: demoPlugins });
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

// Thumbnails are slow to make, so each one is cached by a key (for example id + version).
const thumbnailCache = new Map<string, Promise<string>>();

/** PNG data URL of the first page, used for the cards on Templates and My Workspace. */
export function getThumbnail(cacheKey: string, template: Template, inputs?: Inputs): Promise<string> {
  const cached = thumbnailCache.get(cacheKey);
  if (cached) return cached;
  const job = (async () => {
    const { pdf2img } = await import('@pdfme/converter');
    const pdf = await generatePdf(template, inputs);
    const [png] = await pdf2img(await pdf.arrayBuffer(), { scale: 0.5, range: { end: 1 } });
    if (!png) throw new Error('No page to preview');
    return blobToDataUrl(new Blob([png], { type: 'image/png' }));
  })();
  thumbnailCache.set(cacheKey, job);
  job.catch(() => thumbnailCache.delete(cacheKey)); // allow a retry after a failure
  return job;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
