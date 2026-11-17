// "Form/Viewer" tab: fill in the template's editable fields (Form) or see the result read-only (Viewer).

import { useEffect, useRef, useState } from 'react';
import { FileText, Pencil, RotateCcw } from 'lucide-react';
import { Form, Viewer } from '@pdfme/ui';
import { demoPlugins, UI_LANGUAGES, type UiLanguage } from '@/pdfme-demo/plugins';
import type { Inputs, OpenDocument } from '@/pdfme-demo/types';
import { DemoButton, Spinner, Toolbar, ToolbarGroup } from '@/pdfme-demo/components/ui';
import type { ToastKind } from '@/pdfme-demo/components/useToast';
import { JsonDialog, PdfDialog } from '@/pdfme-demo/components/dialogs';
import { toFileName } from '@/pdfme-demo/lib/files';
import { defaultInputs, generatePdf } from '@/pdfme-demo/lib/pdf';

type Mode = 'form' | 'viewer';

/** Checks that inputs are a list of objects whose values are all text. */
const validateInputs = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) return 'Inputs must be a list with at least one object: [ { ... } ]';
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return 'Each item in the list must be an object.';
    for (const [key, v] of Object.entries(row)) {
      if (typeof v !== 'string') return `"${key}" must be text (wrap numbers and JSON in quotes).`;
    }
  }
  return null;
};

export function FormViewerPage({
  doc,
  onInputsChange,
  onOpenDesigner,
  notify,
}: {
  doc: OpenDocument;
  onInputsChange: (inputs: Inputs) => void;
  onOpenDesigner: () => void;
  notify: (text: string, kind?: ToastKind) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const ui = useRef<Form | Viewer | null>(null);
  const [mode, setMode] = useState<Mode>('form');
  const [lang, setLang] = useState<UiLanguage>('en');
  const [jsonDialog, setJsonDialog] = useState<'get' | 'set' | null>(null);
  const [pdf, setPdf] = useState<{ blob: Blob; info: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const onInputsChangeRef = useRef(onInputsChange);
  onInputsChangeRef.current = onInputsChange;

  // Every editable field gets a value: saved inputs first, template sample content for the rest.
  const startInputs = (): Inputs => {
    const defaults = defaultInputs(doc.template)[0] ?? {};
    const rows = doc.inputs.length > 0 ? doc.inputs : [{}];
    return rows.map((row) => ({ ...defaults, ...row }));
  };

  // Create the Form or Viewer for this document and mode.
  useEffect(() => {
    if (!box.current) return;
    const props = { domContainer: box.current, template: doc.template, inputs: startInputs(), plugins: demoPlugins, options: { lang } };
    const instance = mode === 'form' ? new Form(props) : new Viewer(props);
    if (instance instanceof Form) {
      // Remember what the user types, so it survives switching tabs and is saved with the template.
      instance.onChangeInput(() => onInputsChangeRef.current(instance.getInputs()));
    }
    ui.current = instance;
    return () => {
      instance.destroy();
      ui.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.key, doc.revision, mode]);

  function changeLang(value: UiLanguage) {
    setLang(value);
    ui.current?.updateOptions({ lang: value });
  }

  function setInputs(inputs: Inputs) {
    ui.current?.setInputs(inputs);
    onInputsChange(inputs);
  }

  async function generate() {
    setGenerating(true);
    const started = performance.now();
    try {
      const blob = await generatePdf(doc.template, ui.current?.getInputs() ?? startInputs());
      setPdf({ blob, info: `Generated in ${Math.round(performance.now() - started)} ms` });
    } catch (e) {
      notify(`PDF generation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <Toolbar>
        <ToolbarGroup label="Design">
          <DemoButton onClick={onOpenDesigner}>
            <Pencil className="h-3.5 w-3.5" /> Designer
          </DemoButton>
        </ToolbarGroup>
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
        <ToolbarGroup label="Mode">
          {(['form', 'viewer'] as const).map((m) => (
            <DemoButton key={m} variant={mode === m ? 'primary' : 'secondary'} onClick={() => setMode(m)}>
              {m === 'form' ? 'Form' : 'Viewer'}
            </DemoButton>
          ))}
        </ToolbarGroup>
        <ToolbarGroup label="Inputs">
          <DemoButton onClick={() => setJsonDialog('get')}>Get</DemoButton>
          <DemoButton onClick={() => setJsonDialog('set')}>Set</DemoButton>
          <DemoButton
            onClick={() => {
              setInputs(defaultInputs(doc.template));
              notify('Inputs reset to the template sample values.', 'info');
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </DemoButton>
        </ToolbarGroup>
        <ToolbarGroup label="Output">
          <DemoButton variant="primary" disabled={generating} onClick={generate}>
            {generating ? <Spinner className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />} Generate PDF
          </DemoButton>
        </ToolbarGroup>
      </Toolbar>

      <p className="text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{doc.name}</span> ·{' '}
        {mode === 'form'
          ? 'Click the highlighted fields to fill them in. Fixed parts of the design cannot be changed here.'
          : 'Read-only preview of the filled-in document.'}
      </p>

      <div
        ref={box}
        className="h-[calc(100vh-290px)] min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white"
      />

      <JsonDialog
        open={jsonDialog !== null}
        title={jsonDialog === 'set' ? 'Set inputs' : 'Current inputs'}
        description={
          jsonDialog === 'set'
            ? 'Paste or edit the data for each field (field name: value), then Apply.'
            : 'The data currently in the form. This is what is sent to the PDF generator.'
        }
        value={jsonDialog ? (ui.current?.getInputs() ?? startInputs()) : null}
        validate={jsonDialog === 'set' ? validateInputs : undefined}
        onApply={
          jsonDialog === 'set'
            ? (parsed) => {
                setInputs(parsed as Inputs);
                setJsonDialog(null);
                notify('Inputs updated.');
              }
            : undefined
        }
        onClose={() => setJsonDialog(null)}
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
