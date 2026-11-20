// "My Workspace" tab: templates saved through the template API (Spring Boot + PostgreSQL).
// Each card shows the template's type, the version in use and any draft.

import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, Eye, FileUp, Pencil, Plus, RefreshCw, Trash2, Type } from 'lucide-react';
import { checkTemplate, type Template } from '@pdfme/common';
import { openVersion, templateApi, userLabel } from '@/pdfme-demo/api/templateApi';
import { EMPTY_DETAILS, type TemplateDetail, type TemplateSummary } from '@/pdfme-demo/types';
import { Thumbnail } from '@/pdfme-demo/components/Thumbnail';
import {
  ConfirmDialog,
  DetailsDialog,
  type SubmittedDetails,
  type TemplateDetails,
} from '@/pdfme-demo/components/dialogs';
import { DemoButton, Spinner, Tag, VersionBadge } from '@/pdfme-demo/components/ui';
import type { ToastKind } from '@/pdfme-demo/components/useToast';
import { downloadJson, pickFile, toFileName } from '@/pdfme-demo/lib/files';
import { defaultInputs } from '@/pdfme-demo/lib/pdf';

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

const detailsOf = (t: TemplateSummary): TemplateDetails => ({
  name: t.name,
  description: t.description,
  tags: t.tags,
  documentTypeCode: t.documentType.code,
});

/** Loads a template and returns the design to use: the draft if there is one, otherwise the version in use. */
async function loadDesign(id: string) {
  const full = await templateApi.get(id);
  const version = openVersion(full);
  if (!version) throw new Error('This template has no versions.');
  return { full, version };
}

type Dialog =
  | { type: 'rename'; item: TemplateSummary }
  | { type: 'delete'; item: TemplateSummary }
  | { type: 'import'; template: Template; fileName: string }
  | null;

export function WorkspacePage({
  refreshKey,
  onOpen,
  onNew,
  onDeleted,
  onRenamed,
  notify,
}: {
  /** Changes when the template list should be reloaded (for example after a save). */
  refreshKey: number;
  onOpen: (id: string, target: 'designer' | 'form-viewer') => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
  /** Called after the name, description, tags or type changed. */
  onRenamed: (record: TemplateDetail) => void;
  notify: (text: string, kind?: ToastKind) => void;
}) {
  const [items, setItems] = useState<TemplateSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setItems(await templateApi.list());
    } catch (e) {
      setLoadError(errorText(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function runAction(id: string, action: () => Promise<void>) {
    setBusyId(id);
    try {
      await action();
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const duplicate = (item: TemplateSummary) =>
    runAction(item.id, async () => {
      const { full, version } = await loadDesign(item.id);
      await templateApi.create({
        documentTypeId: full.documentType.id,
        name: `${full.name} (copy)`,
        description: full.description,
        tags: full.tags,
        template: version.template,
        sampleInputs: version.sampleInputs,
      });
      notify(`Duplicated "${full.name}".`);
      await load();
    });

  const download = (item: TemplateSummary) =>
    runAction(item.id, async () => {
      const { full, version } = await loadDesign(item.id);
      downloadJson(version.template, toFileName(full.name, 'json'));
    });

  async function rename(item: TemplateSummary, details: SubmittedDetails) {
    await runAction(item.id, async () => {
      const saved = await templateApi.update(item.id, {
        rowVersion: item.rowVersion,
        name: details.name,
        description: details.description,
        tags: details.tags,
        documentTypeId: details.documentTypeId,
      });
      onRenamed(saved);
      notify('Details updated.');
      setDialog(null);
      await load();
    });
  }

  async function remove(item: TemplateSummary) {
    await runAction(item.id, async () => {
      await templateApi.remove(item.id, item.rowVersion);
      onDeleted(item.id);
      notify(`Deleted "${item.name}".`);
      setDialog(null);
      await load();
    });
  }

  async function startImport() {
    const file = await pickFile('application/json,.json');
    if (!file) return;
    try {
      const template = JSON.parse(await file.text()) as Template;
      checkTemplate(template); // throws if it is not a valid pdfme template
      setDialog({ type: 'import', template, fileName: file.name.replace(/\.json$/i, '') });
    } catch (e) {
      notify(`Not a valid template file: ${errorText(e)}`, 'error');
    }
  }

  async function finishImport(template: Template, details: SubmittedDetails) {
    await runAction('import', async () => {
      await templateApi.create({
        documentTypeId: details.documentTypeId,
        name: details.name,
        description: details.description,
        tags: details.tags,
        template,
        sampleInputs: defaultInputs(template),
      });
      notify(`Imported "${details.name}".`);
      setDialog(null);
      await load();
    });
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-1">
          <DemoButton onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </DemoButton>
          <DemoButton onClick={startImport}>
            <FileUp className="h-3.5 w-3.5" /> Import JSON
          </DemoButton>
          <DemoButton variant="primary" onClick={onNew}>
            <Plus className="h-3.5 w-3.5" /> New template
          </DemoButton>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <p className="font-medium">Could not load your templates.</p>
          <p className="mt-1">{loadError}</p>
          <DemoButton className="mt-3" onClick={load}>
            Try again
          </DemoButton>
        </div>
      ) : items === null ? (
        <div className="flex items-center gap-2 p-10 text-sm text-slate-400">
          <Spinner /> Loading templates...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">Your workspace is empty.</p>
          <p className="mt-1 text-sm text-slate-500">
            Save a template from the Designer, use "Save to My Workspace" on the Library tab, or import a JSON file.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <article key={item.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-3">
                <button onClick={() => onOpen(item.id, 'designer')} title="Open in Designer" className="block">
                  <Thumbnail
                    cacheKey={`workspace:${item.id}:${(item.draftVersion ?? item.currentVersion)?.contentHash ?? ''}`}
                    load={async () => {
                      const { version } = await loadDesign(item.id);
                      return { template: version.template, inputs: version.sampleInputs };
                    }}
                  />
                </button>
                <h3 className="mt-3 truncate text-sm font-semibold text-slate-900" title={item.name}>
                  {item.name}
                </h3>
                {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    {item.documentType.name}
                  </span>
                  {item.currentVersion && <VersionBadge status="PUBLISHED" versionNo={item.currentVersion.versionNo} />}
                  {item.draftVersion && <VersionBadge status="DRAFT" versionNo={item.draftVersion.versionNo} />}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Updated {new Date(item.updatedAt).toLocaleString('en-GB')} · Owner: {userLabel(item.ownerUserId)}
                </p>
                {item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-1">
                  <DemoButton variant="primary" disabled={busy} onClick={() => onOpen(item.id, 'designer')}>
                    <Pencil className="h-3.5 w-3.5" /> Designer
                  </DemoButton>
                  <DemoButton disabled={busy} onClick={() => onOpen(item.id, 'form-viewer')}>
                    <Eye className="h-3.5 w-3.5" /> Form/Viewer
                  </DemoButton>
                </div>
                <div className="mt-1 flex justify-between gap-1">
                  <DemoButton variant="ghost" disabled={busy} onClick={() => setDialog({ type: 'rename', item })} title="Edit details">
                    <Type className="h-3.5 w-3.5" />
                  </DemoButton>
                  <DemoButton variant="ghost" disabled={busy} onClick={() => duplicate(item)} title="Duplicate">
                    <Copy className="h-3.5 w-3.5" />
                  </DemoButton>
                  <DemoButton variant="ghost" disabled={busy} onClick={() => download(item)} title="Download JSON">
                    <Download className="h-3.5 w-3.5" />
                  </DemoButton>
                  <DemoButton
                    variant="ghost"
                    className="text-rose-600 hover:bg-rose-50"
                    disabled={busy}
                    onClick={() => setDialog({ type: 'delete', item })}
                    title="Delete"
                  >
                    {busy ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </DemoButton>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DetailsDialog
        open={dialog?.type === 'rename'}
        title="Edit details"
        submitLabel="Save"
        initial={dialog?.type === 'rename' ? detailsOf(dialog.item) : EMPTY_DETAILS}
        busy={!!busyId}
        onSubmit={(details) => dialog?.type === 'rename' && rename(dialog.item, details)}
        onClose={() => setDialog(null)}
      />
      <DetailsDialog
        open={dialog?.type === 'import'}
        title="Import template"
        submitLabel="Import"
        initial={{ ...EMPTY_DETAILS, name: dialog?.type === 'import' ? dialog.fileName : '' }}
        busy={!!busyId}
        onSubmit={(details) => dialog?.type === 'import' && finishImport(dialog.template, details)}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog?.type === 'delete'}
        title="Delete template?"
        message={
          dialog?.type === 'delete'
            ? `"${dialog.item.name}" and all its versions will be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={!!busyId}
        onConfirm={() => dialog?.type === 'delete' && remove(dialog.item)}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
