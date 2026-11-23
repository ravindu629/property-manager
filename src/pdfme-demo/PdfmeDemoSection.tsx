// Template Studio section: Library, My Workspace, Designer and Form/Viewer tabs,
// modelled on the official pdfme playground (https://playground.pdfme.com/).
//
// The current tab is controlled by App (props `tab` and `onTabChange`), so the sidebar
// and the tab bar on this page always show the same tab.
// This component owns the "open document" (the template being edited) and all saving.
// Saving goes through `templateApi` (Spring Boot REST API). Save writes the draft;
// Publish makes the draft the version in use.

import { useEffect, useState } from 'react';
import { Eye, FolderOpen, LayoutGrid, Pencil, Plus } from 'lucide-react';
import type { Template } from '@pdfme/common';
import { openVersion, templateApi } from '@/pdfme-demo/api/templateApi';
import { EMPTY_DETAILS, type DemoTab, type DocSource, type GalleryItem, type Inputs, type OpenDocument, type TemplateDetail } from '@/pdfme-demo/types';
import { TemplatesPage } from '@/pdfme-demo/pages/TemplatesPage';
import { WorkspacePage } from '@/pdfme-demo/pages/WorkspacePage';
import { DesignerPage } from '@/pdfme-demo/pages/DesignerPage';
import { FormViewerPage } from '@/pdfme-demo/pages/FormViewerPage';
import {
  ConfirmDialog,
  DetailsDialog,
  PublishDialog,
  type SubmittedDetails,
  type TemplateDetails,
} from '@/pdfme-demo/components/dialogs';
import { DemoButton, ToastView } from '@/pdfme-demo/components/ui';
import { useToast } from '@/pdfme-demo/components/useToast';

const TABS: { key: DemoTab; label: string; icon: typeof Eye }[] = [
  { key: 'templates', label: 'Library', icon: LayoutGrid },
  { key: 'workspace', label: 'My Workspace', icon: FolderOpen },
  { key: 'designer', label: 'Designer', icon: Pencil },
  { key: 'form-viewer', label: 'Form/Viewer', icon: Eye },
];

const BLANK_TEMPLATE: Template = { basePdf: { width: 210, height: 297, padding: [0, 0, 0, 0] }, schemas: [[]] };

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Name, description, tags and type of a saved template. */
const detailsOf = (t: TemplateDetail): TemplateDetails => ({
  name: t.name,
  description: t.description,
  tags: t.tags,
  documentTypeCode: t.documentType.code,
});

/** Where a saved template came from, and which version is open (the draft if there is one). */
function workspaceSource(t: TemplateDetail): DocSource {
  const open = openVersion(t);
  if (!open) throw new Error('This template has no versions.');
  return {
    kind: 'workspace',
    id: t.id,
    rowVersion: t.rowVersion,
    draftRowVersion: t.draftVersion?.rowVersion ?? null,
    versionNo: open.versionNo,
    versionStatus: open.status,
    publishedVersionNo: t.currentVersion?.versionNo ?? null,
    documentTypeId: t.documentType.id,
  };
}

/** Finds the id of a document type from its code, for example GENERAL_LETTER. */
async function documentTypeId(code: string): Promise<string> {
  const type = (await templateApi.documentTypes()).find((t) => t.code === code);
  if (!type) throw new Error(`Unknown document type "${code}".`);
  return type.id;
}

function makeDocument(
  details: TemplateDetails,
  source: DocSource,
  template: Template,
  inputs: Inputs,
  dirty = false
): OpenDocument {
  const copy = structuredClone({ template, inputs });
  return {
    key: crypto.randomUUID(),
    revision: 0,
    ...details,
    source,
    template: copy.template,
    inputs: copy.inputs,
    baseline: structuredClone(copy),
    dirty,
  };
}

type DetailsMode = { mode: 'save' | 'saveAs'; template: Template } | null;

export function PdfmeDemoSection({
  tab,
  onTabChange: setTab,
  onDirtyChange,
}: {
  tab: DemoTab;
  onTabChange: (tab: DemoTab) => void;
  /** Tells App when there are unsaved changes, so the sidebar can show a red dot. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [doc, setDoc] = useState<OpenDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<DetailsMode>(null);
  const [publishDialog, setPublishDialog] = useState<{ template: Template } | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState<(() => void) | null>(null);
  const [workspaceRefresh, setWorkspaceRefresh] = useState(0);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [toast, notify] = useToast();

  // Keep the sidebar's unsaved-changes dot up to date, and clear it when this page closes.
  const dirty = !!doc?.dirty;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  // Warn before closing the browser tab with unsaved changes.
  useEffect(() => {
    if (!doc?.dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [doc?.dirty]);

  /** Runs `open` now, or after the user agrees to discard unsaved changes. */
  function guardUnsaved(open: () => void) {
    if (doc?.dirty) setPendingOpen(() => open);
    else open();
  }

  // ---------- Opening documents ----------

  function openGallery(item: GalleryItem, target: 'designer' | 'form-viewer') {
    guardUnsaved(() => {
      const details: TemplateDetails = {
        name: item.name,
        description: item.description,
        tags: item.tags,
        documentTypeCode: item.documentTypeCode,
      };
      setDoc(makeDocument(details, { kind: 'gallery', galleryId: item.id }, item.template, item.sampleInputs));
      setTab(target);
    });
  }

  function openWorkspace(id: string, target: 'designer' | 'form-viewer') {
    guardUnsaved(async () => {
      try {
        const record = await templateApi.get(id);
        const version = openVersion(record);
        if (!version) throw new Error('This template has no versions.');
        setDoc(makeDocument(detailsOf(record), workspaceSource(record), version.template, version.sampleInputs));
        setTab(target);
      } catch (e) {
        notify(errorText(e), 'error');
      }
    });
  }

  function newTemplate() {
    guardUnsaved(() => {
      setDoc(
        makeDocument(
          { name: 'Untitled template', description: '', tags: [], documentTypeCode: 'OTHER' },
          { kind: 'new' },
          BLANK_TEMPLATE,
          [{}]
        )
      );
      setTab('designer');
    });
  }

  async function copyToWorkspace(item: GalleryItem) {
    setCopyingId(item.id);
    try {
      await templateApi.create({
        documentTypeId: await documentTypeId(item.documentTypeCode),
        name: item.name,
        description: item.description,
        tags: item.tags,
        template: item.template,
        sampleInputs: item.sampleInputs,
      });
      setWorkspaceRefresh((n) => n + 1);
      notify(`"${item.name}" saved to My Workspace.`);
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setCopyingId(null);
    }
  }

  // ---------- Edits ----------

  const onTemplateChange = (template: Template) =>
    setDoc((d) => (d ? { ...d, template, dirty: true } : d));

  // pdfme adjusted the template by itself (not a user edit): keep it, but stay clean.
  const onTemplateSync = (template: Template) => setDoc((d) => (d ? { ...d, template } : d));

  const onReplaceTemplate = (template: Template) =>
    setDoc((d) => (d ? { ...d, template, revision: d.revision + 1, dirty: true } : d));

  const onInputsChange = (inputs: Inputs) => setDoc((d) => (d ? { ...d, inputs, dirty: true } : d));

  function resetDocument() {
    setDoc((d) =>
      d
        ? {
            ...d,
            ...structuredClone(d.baseline),
            revision: d.revision + 1,
            dirty: false,
          }
        : d
    );
    notify('Changes discarded.', 'info');
  }

  // ---------- Saving ----------

  /** Opens one version from the History dialog as a read-only copy. */
  function openOldVersion(id: string, versionNo: number, target: 'designer' | 'form-viewer' = 'form-viewer') {
    guardUnsaved(async () => {
      try {
        const [record, version] = await Promise.all([templateApi.get(id), templateApi.version(id, versionNo)]);
        setDoc(
          makeDocument(
            detailsOf(record),
            { kind: 'version', id, versionNo, versionStatus: version.status },
            version.template,
            version.sampleInputs
          )
        );
        setTab(target);
      } catch (e) {
        notify(errorText(e), 'error');
      }
    });
  }

  /** Throws the draft away and opens the version in use again. */
  async function discardDraft() {
    if (!doc || doc.source.kind !== 'workspace' || doc.source.draftRowVersion === null) return;
    const { id, draftRowVersion } = doc.source;
    setSaving(true);
    try {
      await templateApi.discardDraft(id, draftRowVersion);
      const record = await templateApi.get(id);
      const version = openVersion(record);
      if (!version) throw new Error('This template has no versions.');
      setDoc(makeDocument(detailsOf(record), workspaceSource(record), version.template, version.sampleInputs));
      setWorkspaceRefresh((n) => n + 1);
      setDiscardOpen(false);
      notify(`Draft discarded. Back to version ${version.versionNo}.`, 'info');
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  /** Updates the open document after the backend saved it. */
  function markSaved(template: Template, record: TemplateDetail) {
    setDoc((d) =>
      d
        ? {
            ...d,
            ...detailsOf(record),
            template,
            source: workspaceSource(record),
            baseline: structuredClone({ template, inputs: d.inputs }),
            dirty: false,
          }
        : d
    );
    setWorkspaceRefresh((n) => n + 1);
  }

  /** Saves the design to the template's draft. Returns the saved template. */
  async function saveDraft(template: Template): Promise<TemplateDetail> {
    if (!doc || doc.source.kind !== 'workspace') throw new Error('Save the template first.');
    const record = await templateApi.saveDraft(doc.source.id, {
      template,
      sampleInputs: doc.inputs,
      draftRowVersion: doc.source.draftRowVersion,
    });
    markSaved(template, record);
    return record;
  }

  async function save(template: Template) {
    if (!doc) return;
    if (doc.source.kind !== 'workspace') {
      // Not saved before (or an old version): ask for a name and type first.
      setDetailsDialog({ mode: 'save', template });
      return;
    }
    setSaving(true);
    try {
      const record = await saveDraft(template);
      notify(`Saved "${record.name}" as draft version ${record.draftVersion?.versionNo ?? ''}.`);
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function createFromDialog(details: SubmittedDetails) {
    if (!doc || !detailsDialog) return;
    setSaving(true);
    try {
      const record = await templateApi.create({
        documentTypeId: details.documentTypeId,
        name: details.name,
        description: details.description,
        tags: details.tags,
        template: detailsDialog.template,
        sampleInputs: doc.inputs,
      });
      markSaved(detailsDialog.template, record);
      setDetailsDialog(null);
      notify(`Saved "${record.name}" to My Workspace as a draft.`);
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  /** Saves unsaved changes (if any), then publishes the draft. */
  async function publish(changeNote: string) {
    if (!doc || doc.source.kind !== 'workspace' || !publishDialog) return;
    const { template } = publishDialog;
    setSaving(true);
    try {
      let draftRowVersion = doc.source.draftRowVersion;
      if (doc.dirty) {
        const saved = await saveDraft(template);
        draftRowVersion = saved.draftVersion?.rowVersion ?? null;
      }
      if (draftRowVersion === null) throw new Error('There is no draft to publish.');
      const record = await templateApi.publish(doc.source.id, draftRowVersion, changeNote);
      markSaved(template, record);
      setPublishDialog(null);
      notify(`Published version ${record.currentVersion?.versionNo ?? ''} of "${record.name}".`);
    } catch (e) {
      notify(errorText(e), 'error');
    } finally {
      setSaving(false);
    }
  }

  // ---------- Render ----------

  const noDocument = (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-sm font-medium text-slate-700">No template is open.</p>
      <p className="mt-1 text-sm text-slate-500">Choose an example, open one from your workspace, or start from a blank page.</p>
      <div className="mt-4 flex gap-2">
        <DemoButton onClick={() => setTab('templates')}>
          <LayoutGrid className="h-3.5 w-3.5" /> Library
        </DemoButton>
        <DemoButton onClick={() => setTab('workspace')}>
          <FolderOpen className="h-3.5 w-3.5" /> My Workspace
        </DemoButton>
        <DemoButton variant="primary" onClick={newTemplate}>
          <Plus className="h-3.5 w-3.5" /> New template
        </DemoButton>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Templates</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Template Studio</h1>
          <p className="mt-1 text-sm text-slate-500">
            Design, save and fill PDF templates for letters and documents.
          </p>
        </div>
      </div>

      <nav className="mt-5 flex gap-1 border-b border-slate-200" aria-label="Template Studio sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active ? 'border-sky-600 text-sky-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {(t.key === 'designer' || t.key === 'form-viewer') && doc?.dirty && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden="true" title="Unsaved changes" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-5">
        {tab === 'templates' && (
          <TemplatesPage onOpen={openGallery} onCopyToWorkspace={copyToWorkspace} copyingId={copyingId} />
        )}
        {tab === 'workspace' && (
          <WorkspacePage
            refreshKey={workspaceRefresh}
            onOpen={openWorkspace}
            onOpenVersion={openOldVersion}
            onNew={newTemplate}
            notify={notify}
            onDeleted={(id) =>
              setDoc((d) =>
                d && d.source.kind === 'workspace' && d.source.id === id ? { ...d, source: { kind: 'new' }, dirty: true } : d
              )
            }
            onRenamed={(record) =>
              setDoc((d) =>
                d && d.source.kind === 'workspace' && d.source.id === record.id
                  ? {
                      ...d,
                      ...detailsOf(record),
                      source: { ...d.source, rowVersion: record.rowVersion, documentTypeId: record.documentType.id },
                    }
                  : d
              )
            }
          />
        )}
        {tab === 'designer' &&
          (doc ? (
            <DesignerPage
              doc={doc}
              saving={saving}
              onTemplateChange={onTemplateChange}
              onTemplateSync={onTemplateSync}
              onReplaceTemplate={onReplaceTemplate}
              onSave={save}
              onSaveAs={(template) => setDetailsDialog({ mode: 'saveAs', template })}
              onReset={resetDocument}
              onPublish={(template) => setPublishDialog({ template })}
              onDiscardDraft={() => setDiscardOpen(true)}
              onOpenFormViewer={(template) => {
                setDoc((d) => (d ? { ...d, template } : d));
                setTab('form-viewer');
              }}
              notify={notify}
            />
          ) : (
            noDocument
          ))}
        {tab === 'form-viewer' &&
          (doc ? (
            <FormViewerPage doc={doc} onInputsChange={onInputsChange} onOpenDesigner={() => setTab('designer')} notify={notify} />
          ) : (
            noDocument
          ))}
      </div>

      <DetailsDialog
        open={detailsDialog !== null}
        title={
          detailsDialog?.mode === 'saveAs' || doc?.source.kind === 'version'
            ? 'Save as a new template'
            : 'Save to My Workspace'
        }
        submitLabel="Save"
        initial={
          doc
            ? {
                name:
                  doc.source.kind === 'version'
                    ? `${doc.name} (v${doc.source.versionNo} copy)`
                    : detailsDialog?.mode === 'saveAs' && doc.source.kind === 'workspace'
                      ? `${doc.name} (copy)`
                      : doc.name,
                description: doc.description,
                tags: doc.tags,
                documentTypeCode: doc.documentTypeCode,
              }
            : EMPTY_DETAILS
        }
        busy={saving}
        onSubmit={createFromDialog}
        onClose={() => setDetailsDialog(null)}
      />
      <PublishDialog
        open={publishDialog !== null}
        name={doc?.name ?? ''}
        versionNo={
          doc?.source.kind === 'workspace'
            ? doc.source.versionStatus === 'DRAFT'
              ? doc.source.versionNo
              : doc.source.versionNo + 1
            : 1
        }
        replacesVersionNo={doc?.source.kind === 'workspace' ? doc.source.publishedVersionNo : null}
        willSaveFirst={!!doc?.dirty}
        busy={saving}
        onPublish={publish}
        onClose={() => setPublishDialog(null)}
      />
      <ConfirmDialog
        open={discardOpen}
        title="Discard draft?"
        message={
          doc?.source.kind === 'workspace'
            ? `Draft version ${doc.source.versionNo} of "${doc.name}" will be deleted, with any unsaved changes. ` +
              `The template goes back to version ${doc.source.publishedVersionNo ?? ''}. This cannot be undone.`
            : ''
        }
        confirmLabel="Discard draft"
        busy={saving}
        onConfirm={discardDraft}
        onClose={() => setDiscardOpen(false)}
      />
      <ConfirmDialog
        open={pendingOpen !== null}
        title="Discard unsaved changes?"
        message={`"${doc?.name ?? ''}" has changes that are not saved. Open the other template anyway?`}
        confirmLabel="Discard changes"
        onConfirm={() => {
          const open = pendingOpen;
          setPendingOpen(null);
          open?.();
        }}
        onClose={() => setPendingOpen(null)}
      />
      <ToastView toast={toast} />
    </div>
  );
}
