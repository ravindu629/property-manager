// "Designer" tab: pdfme's drag-and-drop template designer with a playground-style toolbar.

import { useEffect, useRef, useState } from 'react';
import { Braces, Copy, Download, Eye, FileText, FileUp, RotateCcw, Save } from 'lucide-react';
import { Designer } from '@pdfme/ui';
import { checkTemplate, type Template } from '@pdfme/common';
import { demoPlugins, UI_LANGUAGES, type UiLanguage } from '@/pdfme-demo/plugins';
import type { OpenDocument } from '@/pdfme-demo/types';
import { DemoButton, Spinner, Toolbar, ToolbarGroup } from '@/pdfme-demo/components/ui';
import type { ToastKind } from '@/pdfme-demo/components/useToast';
import { JsonDialog, PdfDialog } from '@/pdfme-demo/components/dialogs';
import { downloadJson, pickFile, readAsDataUrl, toFileName } from '@/pdfme-demo/lib/files';
import { generatePdf } from '@/pdfme-demo/lib/pdf';

const BLANK_A4 = { width: 210, height: 297, padding: [0, 0, 0, 0] as [number, number, number, number] };

const validateTemplate = (value: unknown): string | null => {
  try {
    checkTemplate(value as Template);
    return null;
  } catch (e) {
    return `Not a valid template file: ${e instanceof Error ? e.message : String(e)}`;
  }
};

export function DesignerPage({
  doc,
  saving,
  onTemplateChange,
  onReplaceTemplate,
  onSave,
  onSaveAs,
  onReset,
  onOpenFormViewer,
  notify,
}: {
  doc: OpenDocument;
  saving: boolean;
  /** Called on every edit made inside the designer. */
  onTemplateChange: (template: Template) => void;
  /** Called when the template is replaced from the toolbar (JSON edit, base PDF). */
  onReplaceTemplate: (template: Template) => void;
  onSave: (template: Template) => void;
  onSaveAs: (template: Template) => void;
  onReset: () => void;
  onOpenFormViewer: (template: Template) => void;
  notify: (text: string, kind?: ToastKind) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const designer = useRef<Designer | null>(null);
  const [lang, setLang] = useState<UiLanguage>('en');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [pdf, setPdf] = useState<{ blob: Blob; info: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Keep the newest callbacks in a ref, so the designer (created once) always calls them.
  const callbacks = useRef({ onTemplateChange, onSave });
  callbacks.current = { onTemplateChange, onSave };
  // True while we load a template into the designer ourselves (Reset, JSON, base PDF).
  // pdfme reports that load as a change, but it is not a user edit, so we ignore it.
  const loadingTemplate = useRef(false);

  // Create the designer when a different document is opened.
  useEffect(() => {
    if (!box.current) return;
    const d = new Designer({
      domContainer: box.current,
      template: doc.template,
      plugins: demoPlugins,
      options: { lang },
    });
    d.onChangeTemplate((t) => {
      if (!loadingTemplate.current) callbacks.current.onTemplateChange(t);
    });
    d.onSaveTemplate((t) => callbacks.current.onSave(t)); // Ctrl+S inside the designer
    designer.current = d;
    return () => {
      d.destroy();
      designer.current = null;
    };
    // Rebuild only for a different document; edits are handled by the designer itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.key]);

  // When the template is replaced from outside (Reset, JSON, base PDF), show it in the designer.
  const shownRevision = useRef(doc.revision);
  useEffect(() => {
    if (doc.revision === shownRevision.current) return;
    shownRevision.current = doc.revision;
    loadingTemplate.current = true;
    try {
      designer.current?.updateTemplate(doc.template);
    } finally {
      loadingTemplate.current = false;
    }
  }, [doc.revision, doc.template]);

  const current = (): Template => designer.current?.getTemplate() ?? doc.template;

  function changeLang(value: UiLanguage) {
    setLang(value);
    designer.current?.updateOptions({ lang: value });
  }

  async function changeBasePdf() {
    const file = await pickFile('application/pdf');
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return notify('Please choose a PDF smaller than 10 MB.', 'error');
    try {
      const basePdf = await readAsDataUrl(file);
      onReplaceTemplate({ ...current(), basePdf });
      notify(`Using "${file.name}" as the page background.`);
    } catch (e) {
      notify(`Could not read the PDF: ${e instanceof Error ? e.message : String(e)}`, 'error');
    }
  }

  async function generate() {
    setGenerating(true);
    const started = performance.now();
    try {
      // Like the official playground, the Designer previews each field's sample content.
      const blob = await generatePdf(current());
      setPdf({ blob, info: `Generated in ${Math.round(performance.now() - started)} ms` });
    } catch (e) {
      notify(`PDF generation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setGenerating(false);
    }
  }

  const sourceLabel =
    doc.source.kind === 'workspace' ? 'My Workspace' : doc.source.kind === 'gallery' ? 'Example template (not saved yet)' : 'New template (not saved yet)';

  return (
    <div className="space-y-3">
      <Toolbar>
        <ToolbarGroup label="Lang">
          <select
            value={lang}
            onChange={(e) => changeLang(e.target.value as UiLanguage)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            {UI_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </ToolbarGroup>
        <ToolbarGroup label="Base PDF">
          <DemoButton onClick={changeBasePdf}>
            <FileUp className="h-3.5 w-3.5" /> Change PDF
          </DemoButton>
          <DemoButton onClick={() => onReplaceTemplate({ ...current(), basePdf: BLANK_A4 })}>
            <FileText className="h-3.5 w-3.5" /> Blank A4
          </DemoButton>
        </ToolbarGroup>
        <ToolbarGroup label="Edit">
          <DemoButton onClick={() => setJsonOpen(true)}>
            <Braces className="h-3.5 w-3.5" /> JSON
          </DemoButton>
        </ToolbarGroup>
        <ToolbarGroup label="Workspace">
          <DemoButton
            variant="primary"
            className="relative"
            disabled={saving}
            title={doc.dirty ? 'You have unsaved changes' : undefined}
            onClick={() => onSave(current())}
          >
            {doc.dirty && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
              />
            )}
            {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {doc.source.kind === 'workspace' ? 'Save' : 'Save to Workspace'}
          </DemoButton>
          <DemoButton disabled={saving} onClick={() => onSaveAs(current())}>
            <Copy className="h-3.5 w-3.5" /> Save As
          </DemoButton>
          <DemoButton disabled={saving} onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </DemoButton>
        </ToolbarGroup>
        <ToolbarGroup label="Preview">
          <DemoButton onClick={() => onOpenFormViewer(current())}>
            <Eye className="h-3.5 w-3.5" /> Form/Viewer
          </DemoButton>
        </ToolbarGroup>
        <ToolbarGroup label="Output">
          <DemoButton onClick={() => downloadJson(current(), toFileName(doc.name, 'json'))}>
            <Download className="h-3.5 w-3.5" /> Template JSON
          </DemoButton>
          <DemoButton variant="primary" disabled={generating} onClick={generate}>
            {generating ? <Spinner className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />} Generate PDF
          </DemoButton>
        </ToolbarGroup>
      </Toolbar>

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{doc.name}</span> · {sourceLabel}
        {doc.dirty && <span className="text-rose-600"> · unsaved changes</span>}
      </p>

      <div
        ref={box}
        className="h-[calc(100vh-290px)] min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white"
      />

      <JsonDialog
        open={jsonOpen}
        title="Template JSON"
        description="Edit the template directly. Positions and sizes are in millimetres."
        value={jsonOpen ? current() : null}
        validate={validateTemplate}
        onApply={(parsed) => {
          onReplaceTemplate(parsed as Template);
          setJsonOpen(false);
          notify('Template updated from JSON.');
        }}
        onClose={() => setJsonOpen(false)}
      />
      <PdfDialog
        pdf={pdf?.blob ?? null}
        info={pdf?.info}
        fileName={toFileName(doc.name, 'pdf')}
        onClose={() => setPdf(null)}
      />
    </div>
  );
}
