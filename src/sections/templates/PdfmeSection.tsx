import { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileDown,
  FileUp,
  FolderOpen,
  LayoutTemplate,
  Play,
  RotateCcw,
  Save,
  FileCog,
} from 'lucide-react';
import { Designer } from '@pdfme/ui';
import { generate } from '@pdfme/generator';
import { checkTemplate, type Template } from '@pdfme/common';
import {
  SAMPLE_DATA,
  SAMPLE_ELEMENTS,
  downloadBlob,
  downloadJson,
  loadFromStorage,
  pickJsonFile,
  saveToStorage,
  type LetterData,
} from '@/templates/letterTemplate';
import {
  buildPdfmeInputs,
  pdfmePlugins,
  toPdfmeTemplate,
  withLayoutBoxes,
} from '@/templates/pdfmeTemplate';
import { DataJsonEditor, Notice, PdfPreview, TabSwitch, ToolButton } from '@/templates/TemplateUi';

const STORAGE_KEY = 'procuratio.pdfme.template';
type Tab = 'designer' | 'generate';

export function PdfmeSection() {
  const [tab, setTab] = useState<Tab>('designer');

  // The latest template is kept in a ref so the designer and generator always share it.
  const templateRef = useRef<Template>(
    loadFromStorage<Template>(STORAGE_KEY) ?? toPdfmeTemplate(SAMPLE_ELEMENTS)
  );
  const designerBox = useRef<HTMLDivElement>(null);
  const designer = useRef<Designer | null>(null);

  const [data, setData] = useState<LetterData>(SAMPLE_DATA);
  const [showBoxes, setShowBoxes] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1: create the pdfme Designer inside our <div> when the Designer tab is open.
  useEffect(() => {
    if (tab !== 'designer' || !designerBox.current) return;
    const d = new Designer({
      domContainer: designerBox.current,
      template: templateRef.current,
      plugins: pdfmePlugins,
    });
    // Every drag, resize or text edit updates our copy of the template.
    d.onChangeTemplate((t) => {
      templateRef.current = t;
    });
    // The designer has its own "Save" button. We store the template when it is clicked.
    d.onSaveTemplate((t) => {
      templateRef.current = t;
      saveToStorage(STORAGE_KEY, t);
      flash('Template saved in this browser.');
    });
    designer.current = d;
    return () => {
      d.destroy();
      designer.current = null;
    };
  }, [tab]);

  // Free the old PDF from memory when a new one replaces it.
  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  }

  function currentTemplate(): Template {
    return designer.current ? designer.current.getTemplate() : templateRef.current;
  }

  function applyTemplate(t: Template) {
    templateRef.current = t;
    designer.current?.updateTemplate(t);
  }

  function handleSave() {
    const t = currentTemplate();
    templateRef.current = t;
    saveToStorage(STORAGE_KEY, t);
    flash('Template saved in this browser.');
  }

  function handleLoad() {
    const saved = loadFromStorage<Template>(STORAGE_KEY);
    if (!saved) return flash('No saved template yet.');
    applyTemplate(saved);
    flash('Saved template loaded.');
  }

  function handleReset() {
    applyTemplate(toPdfmeTemplate(SAMPLE_ELEMENTS));
    flash('Sample A4 letter template restored.');
  }

  async function handleImport() {
    const json = await pickJsonFile();
    if (!json) return;
    try {
      checkTemplate(json as Template); // throws if it is not a valid pdfme template
      applyTemplate(json as Template);
      flash('Template imported.');
    } catch (e) {
      alert(`Not a valid pdfme template.\n\n${e instanceof Error ? e.message : ''}`);
    }
  }

  // Step 2: turn template + JSON data into real PDF bytes.
  async function buildPdf(): Promise<Blob> {
    let template = currentTemplate();
    templateRef.current = template;
    if (showBoxes) template = withLayoutBoxes(template);
    const pdfBytes = await generate({
      template,
      inputs: buildPdfmeInputs(template, data),
      plugins: pdfmePlugins,
    });
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  }

  async function handleGenerate() {
    setBusy(true);
    try {
      const blob = await buildPdf();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (e) {
      alert(`PDF generation failed.\n\n${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    try {
      downloadBlob(await buildPdf(), 'letter-pdfme.pdf');
    } catch (e) {
      alert(`PDF generation failed.\n\n${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Templates</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">pdfme</h1>
          <p className="mt-1 text-sm text-slate-500">
            Built-in drag-and-drop designer. Positions and sizes are stored in millimetres.
          </p>
        </div>
        <TabSwitch
          tabs={[
            { key: 'designer', label: 'Designer', icon: LayoutTemplate },
            { key: 'generate', label: 'Generate & Preview', icon: Play },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'designer' ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <ToolButton icon={Save} onClick={handleSave} variant="primary">Save</ToolButton>
            <ToolButton icon={FolderOpen} onClick={handleLoad}>Load saved</ToolButton>
            <ToolButton icon={RotateCcw} onClick={handleReset}>Reset to sample</ToolButton>
            <ToolButton icon={FileDown} onClick={() => downloadJson(currentTemplate(), 'pdfme-template.json')}>
              Export JSON
            </ToolButton>
            <ToolButton icon={FileUp} onClick={handleImport}>Import JSON</ToolButton>
            {message && <span className="text-sm text-emerald-600">{message}</span>}
          </div>
          <Notice>
            Drag fields to move them, drag the corners to resize. Click a field to see its exact
            X, Y, Width and Height in mm in the right-hand panel. Text uses {'{placeholders}'} such
            as {'{recipientName}'} that are filled from the JSON data.
          </Notice>
          <div
            ref={designerBox}
            className="h-[calc(100vh-260px)] min-h-[640px] overflow-hidden rounded-xl border border-slate-200 bg-white"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Dynamic JSON data</h2>
              <DataJsonEditor value={data} onValidChange={setData} />
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={showBoxes}
                  onChange={(e) => setShowBoxes(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Show layout boxes (red outlines to check mm positions)
              </label>
              <div className="mt-4 flex gap-2">
                <ToolButton icon={busy ? FileCog : Play} onClick={handleGenerate} variant="primary" disabled={busy}>
                  Generate PDF
                </ToolButton>
                <ToolButton icon={Download} onClick={handleDownload} disabled={busy}>
                  Download
                </ToolButton>
              </div>
            </div>
          </div>
          <PdfPreview url={pdfUrl} busy={busy} />
        </div>
      )}
    </div>
  );
}
