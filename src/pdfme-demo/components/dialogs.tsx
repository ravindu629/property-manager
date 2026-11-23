// Dialogs used by Template Studio: template details, publish, JSON editor, PDF preview and confirm.

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { templateApi } from '@/pdfme-demo/api/templateApi';
import { DemoButton } from '@/pdfme-demo/components/ui';
import type { DocumentType } from '@/pdfme-demo/types';

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

export interface TemplateDetails {
  name: string;
  description: string;
  tags: string[];
  /** Code of the document type, for example GENERAL_LETTER. */
  documentTypeCode: string;
}

/** What the details dialog returns: the details plus the chosen document type's id. */
export interface SubmittedDetails extends TemplateDetails {
  documentTypeId: string;
}

/** Asks for a template's name, document type, description and tags (used by Save, Save As, Rename, Import). */
export function DetailsDialog({
  open,
  title,
  submitLabel,
  initial,
  busy,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: TemplateDetails;
  busy?: boolean;
  onSubmit: (details: SubmittedDetails) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [tags, setTags] = useState(initial.tags.join(', '));
  const [typeCode, setTypeCode] = useState(initial.documentTypeCode);
  const [types, setTypes] = useState<DocumentType[] | null>(null);
  const [typesError, setTypesError] = useState<string | null>(null);

  // Reset the fields every time the dialog opens, and load the document types.
  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setDescription(initial.description);
    setTags(initial.tags.join(', '));
    setTypeCode(initial.documentTypeCode);
    setTypesError(null);
    templateApi
      .documentTypes()
      .then(setTypes)
      .catch((e) => setTypesError(e instanceof Error ? e.message : String(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeTypes = (types ?? []).filter((t) => t.active || t.code === typeCode);
  const chosenType = activeTypes.find((t) => t.code === typeCode);
  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= 200 && !!chosenType;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid || busy || !chosenType) return;
          onSubmit({
            name: trimmed,
            description: description.trim(),
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            documentTypeCode: chosenType.code,
            documentTypeId: chosenType.id,
          });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
          <input autoFocus value={name} maxLength={200} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Document type</span>
          <select
            value={chosenType ? typeCode : ''}
            onChange={(e) => setTypeCode(e.target.value)}
            disabled={!types}
            className={inputCls}
          >
            {!chosenType && <option value="">{types ? 'Choose a type' : 'Loading...'}</option>}
            {activeTypes.map((t) => (
              <option key={t.id} value={t.code}>
                {t.name}
              </option>
            ))}
          </select>
          {typesError && <span className="mt-1 block text-xs text-rose-600">{typesError}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Tags (comma separated)</span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Letter, Finance" className={inputCls} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <DemoButton onClick={onClose}>Cancel</DemoButton>
          <DemoButton type="submit" variant="primary" disabled={!valid || busy}>
            {busy ? 'Saving...' : submitLabel}
          </DemoButton>
        </div>
      </form>
    </Modal>
  );
}

/** Confirms publishing the draft, with an optional note about what changed. */
export function PublishDialog({
  open,
  name,
  versionNo,
  replacesVersionNo,
  willSaveFirst,
  busy,
  onPublish,
  onClose,
}: {
  open: boolean;
  name: string;
  /** Number of the draft that will be published. */
  versionNo: number;
  /** Number of the version in use now, which becomes retired. Null if never published. */
  replacesVersionNo: number | null;
  /** True when there are unsaved changes that will be saved before publishing. */
  willSaveFirst: boolean;
  busy?: boolean;
  onPublish: (changeNote: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Publish template?" size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onPublish(note.trim());
        }}
      >
        <p className="text-sm text-slate-600">
          Version {versionNo} of "{name}" will become the version in use.
          {replacesVersionNo !== null && ` Version ${replacesVersionNo} will be retired but kept in the history.`}
          {' '}A published version can't be changed. Later edits go into a new draft.
        </p>
        {willSaveFirst && <p className="text-sm text-amber-700">Your unsaved changes will be saved first.</p>}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">What changed? (optional)</span>
          <input
            autoFocus
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: new bank details"
            className={inputCls}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <DemoButton onClick={onClose}>Cancel</DemoButton>
          <DemoButton type="submit" variant="primary" disabled={busy}>
            {busy ? 'Publishing...' : `Publish version ${versionNo}`}
          </DemoButton>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Shows JSON in an editable text box. `validate` returns an error message, or null if valid.
 * Without `onApply` the dialog is read-only.
 */
export function JsonDialog({
  open,
  title,
  value,
  description,
  validate,
  onApply,
  onClose,
}: {
  open: boolean;
  title: string;
  value: unknown;
  description?: string;
  validate?: (parsed: unknown) => string | null;
  onApply?: (parsed: unknown) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(JSON.stringify(value, null, 2));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function apply() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const problem = validate?.(parsed) ?? null;
    if (problem) {
      setError(problem);
      return;
    }
    onApply?.(parsed);
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {description && <p className="mb-3 text-sm text-slate-500">{description}</p>}
      <textarea
        value={text}
        readOnly={!onApply}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
        className="h-[55vh] w-full resize-y rounded-lg border border-slate-300 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-emerald-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <DemoButton onClick={() => navigator.clipboard?.writeText(text)}>Copy</DemoButton>
        <DemoButton onClick={onClose}>{onApply ? 'Cancel' : 'Close'}</DemoButton>
        {onApply && (
          <DemoButton variant="primary" onClick={apply}>
            Apply
          </DemoButton>
        )}
      </div>
    </Modal>
  );
}

/** Shows a generated PDF with a download button. */
export function PdfDialog({
  pdf,
  fileName,
  info,
  onClose,
}: {
  pdf: Blob | null;
  fileName: string;
  info?: string;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pdf) return;
    const objectUrl = URL.createObjectURL(pdf);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl); // free memory when closed
  }, [pdf]);

  return (
    <Modal open={!!pdf} onClose={onClose} title="Generated PDF" size="lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{info}</p>
        {url && (
          <a
            href={url}
            download={fileName}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        )}
      </div>
      {url && <iframe title="Generated PDF" src={url} className="h-[70vh] w-full rounded-lg border border-slate-200" />}
    </Modal>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <DemoButton onClick={onClose}>Cancel</DemoButton>
        <DemoButton variant="danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Please wait...' : confirmLabel}
        </DemoButton>
      </div>
    </Modal>
  );
}
