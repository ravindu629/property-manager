// A basic visual positioning editor for React PDF.
// It draws an A4 page on screen (1 mm = `scale` pixels). You can drag boxes to move them,
// drag the bottom-right handle to resize them, or type exact mm values in the side panel.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ImagePlus, Trash2, Type, ZoomIn, ZoomOut } from 'lucide-react';
import {
  A4,
  fillPlaceholders,
  readFileAsDataUrl,
  type LetterData,
  type LetterElement,
  type TextAlign,
} from '@/templates/letterTemplate';

const PT_TO_MM = 0.3528; // 1 point = 0.3528 mm

type DragState = {
  id: string;
  mode: 'move' | 'resize';
  startX: number; // mouse position when the drag started (px)
  startY: number;
  original: LetterElement; // element values when the drag started
};

export function PositionEditor({
  elements,
  onChange,
  data,
}: {
  elements: LetterElement[];
  onChange: (next: LetterElement[]) => void;
  data: LetterData;
}) {
  const [scale, setScale] = useState(2.6); // pixels per mm on screen
  const [snap, setSnap] = useState(0.5); // round positions to this many mm
  const [selectedId, setSelectedId] = useState<string | null>(elements[0]?.id ?? null);
  const drag = useRef<DragState | null>(null);

  // Keep the latest values in refs so the window listeners below always see them.
  const latest = useRef({ elements, onChange, scale, snap });
  latest.current = { elements, onChange, scale, snap };

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const round = (value: number, step: number) => Number((Math.round(value / step) * step).toFixed(2));
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  function update(id: string, patch: Partial<LetterElement>) {
    onChange(elements.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  }

  // Mouse move / mouse up are listened to on the whole window, so dragging still
  // works when the pointer leaves the box.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      const { elements: els, onChange: change, scale: s, snap: step } = latest.current;
      const dxMm = (e.clientX - d.startX) / s; // convert pixels moved into mm
      const dyMm = (e.clientY - d.startY) / s;
      const o = d.original;
      const patch =
        d.mode === 'move'
          ? {
              x: clamp(round(o.x + dxMm, step), 0, A4.width - o.width),
              y: clamp(round(o.y + dyMm, step), 0, A4.height - o.height),
            }
          : {
              width: clamp(round(o.width + dxMm, step), 5, A4.width - o.x),
              height: clamp(round(o.height + dyMm, step), 5, A4.height - o.y),
            };
      change(els.map((el) => (el.id === d.id ? { ...el, ...patch } : el)));
    }
    function onUp() {
      drag.current = null;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  function startDrag(e: ReactPointerEvent, el: LetterElement, mode: DragState['mode']) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(el.id);
    drag.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, original: { ...el } };
  }

  function addElement(type: 'text' | 'image') {
    const id = `${type}_${Date.now().toString(36)}`;
    const el: LetterElement = {
      id,
      label: type === 'text' ? 'New text' : 'New image',
      type,
      x: 20,
      y: 20,
      width: type === 'text' ? 80 : 40,
      height: type === 'text' ? 15 : 20,
      content: type === 'text' ? 'New text with {companyName}' : '',
      fontSize: 10,
      lineHeight: 1.4,
      align: 'left',
      bold: false,
      color: '#0f172a',
      border: false,
    };
    onChange([...elements, el]);
    setSelectedId(id);
  }

  function removeSelected() {
    if (!selected) return;
    onChange(elements.filter((el) => el.id !== selected.id));
    setSelectedId(null);
  }

  async function uploadImage(file: File | undefined) {
    if (!file || !selected) return;
    update(selected.id, { content: await readFileAsDataUrl(file) });
  }

  const px = (mmValue: number) => mmValue * scale;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      {/* ---------- Left: the A4 canvas ---------- */}
      <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <button onClick={() => addElement('text')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
            <Type className="h-4 w-4" /> Add text
          </button>
          <button onClick={() => addElement('image')} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" /> Add image
          </button>
          <span className="mx-2 h-5 w-px bg-slate-300" />
          <button onClick={() => setScale((s) => Math.max(1.5, +(s - 0.2).toFixed(1)))} className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setScale((s) => Math.min(4, +(s + 0.2).toFixed(1)))} className="rounded-lg border border-slate-200 bg-white p-1.5 hover:bg-slate-50" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </button>
          <label className="ml-2 flex items-center gap-1.5 text-slate-600">
            Snap
            <select value={snap} onChange={(e) => setSnap(Number(e.target.value))} className="rounded-md border border-slate-200 bg-white px-2 py-1">
              <option value={0.1}>0.1 mm</option>
              <option value={0.5}>0.5 mm</option>
              <option value={1}>1 mm</option>
              <option value={5}>5 mm</option>
            </select>
          </label>
        </div>

        <div className="overflow-auto">
          {/* The page. Grid lines every 10 mm help to check positions by eye. */}
          <div
            onPointerDown={() => setSelectedId(null)}
            className="relative mx-auto bg-white shadow-lg"
            style={{
              width: px(A4.width),
              height: px(A4.height),
              backgroundImage:
                'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
              backgroundSize: `${px(10)}px ${px(10)}px`,
            }}
          >
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => startDrag(e, el, 'move')}
                  className={`absolute cursor-move select-none overflow-hidden ${
                    isSelected ? 'outline outline-2 outline-sky-500' : 'outline outline-1 outline-dashed outline-slate-300 hover:outline-sky-300'
                  }`}
                  style={{
                    left: px(el.x),
                    top: px(el.y),
                    width: px(el.width),
                    height: px(el.height),
                    ...(el.border ? { border: `${px(0.3)}px solid #94a3b8`, padding: px(3) } : {}),
                  }}
                >
                  {el.type === 'image' ? (
                    el.content ? (
                      <img src={el.content} alt={el.label} draggable={false} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-50 text-[10px] text-slate-400">No image</div>
                    )
                  ) : (
                    <div
                      style={{
                        fontFamily: 'Helvetica, Arial, sans-serif',
                        fontWeight: el.bold ? 700 : 400,
                        fontSize: px(el.fontSize * PT_TO_MM), // pt -> mm -> px
                        lineHeight: el.lineHeight,
                        textAlign: el.align,
                        color: el.color,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {fillPlaceholders(el.content, data)}
                    </div>
                  )}

                  {isSelected && (
                    <>
                      <span className="pointer-events-none absolute left-0 top-0 rounded-br bg-sky-500 px-1 text-[9px] font-medium text-white">
                        {el.x.toFixed(1)}, {el.y.toFixed(1)} mm
                      </span>
                      <span
                        onPointerDown={(e) => startDrag(e, el, 'resize')}
                        className="absolute bottom-0 right-0 h-3 w-3 cursor-nwse-resize bg-sky-500"
                        title="Drag to resize"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Right: properties of the selected element ---------- */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Elements</h3>
          <ul className="space-y-1">
            {elements.map((el) => (
              <li key={el.id}>
                <button
                  onClick={() => setSelectedId(el.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs ${
                    el.id === selectedId ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{el.label}</span>
                  <span className="text-slate-400">{el.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selected ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Properties</h3>
              <button onClick={removeSelected} className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>

            <Field label="Label">
              <input value={selected.label} onChange={(e) => update(selected.id, { label: e.target.value })} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y', 'width', 'height'] as const).map((key) => (
                <Field key={key} label={`${key === 'x' || key === 'y' ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1)} (mm)`}>
                  <input
                    type="number"
                    step={0.1}
                    value={selected[key]}
                    onChange={(e) => update(selected.id, { [key]: Number(e.target.value) || 0 })}
                    className={inputCls}
                  />
                </Field>
              ))}
            </div>

            {selected.type === 'text' ? (
              <>
                <Field label="Text (use {placeholders} from the JSON data)">
                  <textarea
                    value={selected.content}
                    onChange={(e) => update(selected.id, { content: e.target.value })}
                    rows={4}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Font size (pt)">
                    <input type="number" step={0.5} value={selected.fontSize} onChange={(e) => update(selected.id, { fontSize: Number(e.target.value) || 1 })} className={inputCls} />
                  </Field>
                  <Field label="Line height">
                    <input type="number" step={0.1} value={selected.lineHeight} onChange={(e) => update(selected.id, { lineHeight: Number(e.target.value) || 1 })} className={inputCls} />
                  </Field>
                  <Field label="Align">
                    <select value={selected.align} onChange={(e) => update(selected.id, { align: e.target.value as TextAlign })} className={inputCls}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </Field>
                  <Field label="Colour">
                    <input type="color" value={selected.color} onChange={(e) => update(selected.id, { color: e.target.value })} className="h-9 w-full rounded-md border border-slate-200" />
                  </Field>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" checked={selected.bold} onChange={(e) => update(selected.id, { bold: e.target.checked })} /> Bold
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" checked={selected.border} onChange={(e) => update(selected.id, { border: e.target.checked })} /> Border box
                  </label>
                </div>
              </>
            ) : (
              <Field label="Image (PNG or JPG)">
                <input type="file" accept="image/png,image/jpeg" onChange={(e) => uploadImage(e.target.files?.[0])} className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-2 file:py-1 file:text-sky-700" />
              </Field>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
            Click an element on the page to edit it.
          </p>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
