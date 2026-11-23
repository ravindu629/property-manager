// Version history of one template: every version with its status, date, who and change note.
// Old versions can be viewed (as a read-only copy) or downloaded as JSON.

import { useEffect, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { templateApi, userLabel } from '@/pdfme-demo/api/templateApi';
import { DemoButton, Spinner, VersionBadge } from '@/pdfme-demo/components/ui';
import type { ToastKind } from '@/pdfme-demo/components/useToast';
import { downloadJson, toFileName } from '@/pdfme-demo/lib/files';
import type { VersionSummary } from '@/pdfme-demo/types';

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB') : '');

/** One line describing when and by whom a version was saved or published. */
function versionInfo(v: VersionSummary): string {
  if (v.status === 'DRAFT') return `Last saved ${formatDate(v.updatedAt)} by ${userLabel(v.updatedBy)}`;
  return `Published ${formatDate(v.publishedAt)} by ${userLabel(v.publishedBy)}`;
}

export function HistoryDialog({
  template,
  onView,
  onClose,
  notify,
}: {
  /** The template to show, or null when the dialog is closed. */
  template: { id: string; name: string } | null;
  /** Opens a version as a read-only copy in Form/Viewer. */
  onView: (templateId: string, versionNo: number) => void;
  onClose: () => void;
  notify: (text: string, kind?: ToastKind) => void;
}) {
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyNo, setBusyNo] = useState<number | null>(null);

  const id = template?.id;
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setVersions(null);
    setError(null);
    templateApi
      .versions(id)
      .then((list) => !cancelled && setVersions(list))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function download(v: VersionSummary) {
    if (!template) return;
    setBusyNo(v.versionNo);
    try {
      const record = await templateApi.version(template.id, v.versionNo);
      downloadJson(record.template, toFileName(`${template.name} v${v.versionNo}`, 'json'));
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setBusyNo(null);
    }
  }

  return (
    <Modal open={template !== null} onClose={onClose} title={`History: ${template?.name ?? ''}`} size="lg">
      <p className="mb-3 text-sm text-slate-500">
        Every version is kept. Published and retired versions can't be changed.
      </p>
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!versions && !error && (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5 text-slate-400" />
        </div>
      )}
      {versions && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <VersionBadge status={v.status} versionNo={v.versionNo} />
                  {v.status === 'PUBLISHED' && <span className="text-xs font-medium text-emerald-700">In use</span>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{versionInfo(v)}</p>
                {v.changeNote && <p className="mt-1 text-sm text-slate-700">"{v.changeNote}"</p>}
              </div>
              <div className="flex gap-1">
                <DemoButton onClick={() => template && onView(template.id, v.versionNo)} title="View this version">
                  <Eye className="h-3.5 w-3.5" /> View
                </DemoButton>
                <DemoButton disabled={busyNo === v.versionNo} onClick={() => download(v)} title="Download JSON">
                  {busyNo === v.versionNo ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}{' '}
                  JSON
                </DemoButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end">
        <DemoButton onClick={onClose}>Close</DemoButton>
      </div>
    </Modal>
  );
}
