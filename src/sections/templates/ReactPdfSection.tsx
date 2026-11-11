import { useEffect, useState } from 'react';
import {
  Download,
  FileCog,
  FileDown,
  FileUp,
  FolderOpen,
  LayoutTemplate,
  Play,
  RotateCcw,
  Save,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import {
  SAMPLE_DATA,
  SAMPLE_ELEMENTS,
  cloneElements,
  downloadBlob,
  downloadJson,
  loadFromStorage,
  pickJsonFile,
  saveToStorage,
  type LetterData,
  type LetterElement,
} from '@/templates/letterTemplate';
import { ReactPdfLetter } from '@/templates/ReactPdfLetter';
import { PositionEditor } from '@/templates/PositionEditor';
import { DataJsonEditor, Notice, PdfPreview, TabSwitch, ToolButton } from '@/templates/TemplateUi';

const STORAGE_KEY = 'procuratio.reactpdf.template';
type Tab = 'designer' | 'generate';

// Format we use when saving a React PDF template (React PDF has no template format of its own).
type SavedTemplate = { library: 'react-pdf'; version: 1; elements: LetterElement[] };

function isSavedTemplate(value: unknown): value is SavedTemplate {
  const v = value as SavedTemplate;
  return !!v && v.library === 'react-pdf' && Array.isArray(v.elements);
}

export function ReactPdfSection() {
  const [tab, setTab] = useState<Tab>('designer');
  const [elements, setElements] = useState<LetterElement[]>(() => {
    const saved = loadFromStorage<SavedTemplate>(STORAGE_KEY);
    return isSavedTemplate(saved) ? saved.elements : cloneElements(SAMPLE_ELEMENTS);
  });
  const [data, setData] = useState<LetterData>(SAMPLE_DATA);
  const [showBoxes, setShowBoxes] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  function flash(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  }

  function toSaved(): SavedTemplate {
    return { library: 'react-pdf', version: 1, elements };
  }

  function handleSave() {
    saveToStorage(STORAGE_KEY, toSaved());
    flash('Template saved in this browser.');
  }

  function handleLoad() {
    const saved = loadFromStorage<SavedTemplate>(STORAGE_KEY);
    if (!isSavedTemplate(saved)) return flash('No saved template yet.');
    setElements(saved.elements);
    flash('Saved template loaded.');
  }

  function handleReset() {
    setElements(cloneElements(SAMPLE_ELEMENTS));
    flash('Sample A4 letter template restored.');
  }

  async function handleImport() {
    const json = await pickJsonFile();
    if (!json) return;
    if (!isSavedTemplate(json)) return alert('This is not a React PDF template exported from this page.');
    setElements(json.elements);
    flash('Template imported.');
  }

  // Render the <ReactPdfLetter> component into a real PDF file (Blob).
  async function buildPdf(): Promise<Blob> {
    return pdf(<ReactPdfLetter elements={elements} data={data} showBoxes={showBoxes} />).toBlob();
  }

  async function handleGenerate() {
    setBusy(true);
    try {
      setPdfUrl(URL.createObjectURL(await buildPdf()));
    } catch (e) {
      alert(`PDF generation failed.\n\n${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    try {
      downloadBlob(await buildPdf(), 'letter-react-pdf.pdf');
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">React PDF</h1>
          <p className="mt-1 text-sm text-slate-500">
            @react-pdf/renderer with a custom mm positioning editor (the library has no visual designer).
          </p>
        </div>
        <TabSwitch
          tabs={[
            { key: 'designer', label: 'Position Editor', icon: LayoutTemplate },
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
            <ToolButton icon={FileDown} onClick={() => downloadJson(toSaved(), 'react-pdf-template.json')}>
              Export JSON
            </ToolButton>
            <ToolButton icon={FileUp} onClick={handleImport}>Import JSON</ToolButton>
            {message && <span className="text-sm text-emerald-600">{message}</span>}
          </div>
          <Notice>
            Drag a box to move it, drag its blue corner to resize, or type exact mm values on the
            right. The grid lines are 10 mm apart. The on-screen page is an HTML preview; the real
            PDF is made in the Generate &amp; Preview tab.
          </Notice>
          <PositionEditor elements={elements} onChange={setElements} data={data} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
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
          <PdfPreview url={pdfUrl} busy={busy} />
        </div>
      )}
    </div>
  );
}
