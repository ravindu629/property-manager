// "Templates" tab: gallery of built-in example templates, with search and tag filter.

import { useMemo, useState } from 'react';
import { Eye, FolderPlus, Pencil, Search } from 'lucide-react';
import { GALLERY_TAGS, GALLERY_TEMPLATES } from '@/pdfme-demo/gallery/galleryTemplates';
import type { GalleryItem } from '@/pdfme-demo/types';
import { Thumbnail } from '@/pdfme-demo/components/Thumbnail';
import { DemoButton, Tag } from '@/pdfme-demo/components/ui';

export function TemplatesPage({
  onOpen,
  onCopyToWorkspace,
  copyingId,
}: {
  onOpen: (item: GalleryItem, target: 'designer' | 'form-viewer') => void;
  onCopyToWorkspace: (item: GalleryItem) => void;
  copyingId: string | null;
}) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY_TEMPLATES.filter(
      (t) =>
        (!tag || t.tags.includes(tag)) &&
        (!q || `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase().includes(q))
    );
  }, [query, tag]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {[null, ...GALLERY_TAGS].map((t) => (
            <button
              key={t ?? 'all'}
              onClick={() => setTag(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tag === t ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {t ?? 'All'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          No templates match your search.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <article key={item.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-3">
              <button onClick={() => onOpen(item, 'designer')} title="Open in Designer" className="block">
                <Thumbnail
                  cacheKey={`gallery:${item.id}`}
                  load={async () => ({ template: item.template, inputs: item.sampleInputs })}
                />
              </button>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.name}</h3>
              <p className="mt-1 flex-1 text-xs text-slate-500">{item.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1">
                <DemoButton variant="primary" onClick={() => onOpen(item, 'designer')}>
                  <Pencil className="h-3.5 w-3.5" /> Designer
                </DemoButton>
                <DemoButton onClick={() => onOpen(item, 'form-viewer')}>
                  <Eye className="h-3.5 w-3.5" /> Form/Viewer
                </DemoButton>
                <DemoButton
                  className="col-span-2"
                  disabled={copyingId === item.id}
                  onClick={() => onCopyToWorkspace(item)}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  {copyingId === item.id ? 'Saving...' : 'Save to My Workspace'}
                </DemoButton>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
