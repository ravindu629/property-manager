// Small UI pieces shared by the pdfme and React PDF sections.

import { useState, type ComponentType, type ReactNode } from 'react';
import { FileText } from 'lucide-react';
import type { LetterData } from '@/templates/letterTemplate';

export function TabSwitch<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; icon: ComponentType<{ className?: string }> }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function ToolButton({
  icon: Icon,
  children,
  onClick,
  variant = 'default',
  disabled,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === 'primary'
          ? 'bg-sky-600 text-white hover:bg-sky-500'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

// Text area where the user edits the dynamic JSON data.
// Calls onValidChange only when the text is valid JSON with string values.
export function DataJsonEditor({
  value,
  onValidChange,
}: {
  value: LetterData;
  onValidChange: (data: LetterData) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    setText(next);
    try {
      const parsed = JSON.parse(next);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Data must be a JSON object, for example { "name": "value" }');
      }
      const clean: LetterData = {};
      for (const [k, v] of Object.entries(parsed)) clean[k] = String(v);
      setError(null);
      onValidChange(clean);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
        className="h-[460px] w-full resize-y rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-emerald-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">
          Valid JSON. Use these keys as {'{placeholders}'} in the template text.
        </p>
      )}
    </div>
  );
}

// Shows a generated PDF inside the page using the browser's built-in PDF viewer.
export function PdfPreview({ url, busy }: { url: string | null; busy: boolean }) {
  if (!url) {
    return (
      <div className="flex h-[760px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
        <FileText className="mb-3 h-10 w-10" />
        <p className="text-sm">{busy ? 'Generating PDF...' : 'Click "Generate PDF" to see a preview here.'}</p>
      </div>
    );
  }
  return (
    <iframe
      title="PDF preview"
      src={url}
      className="h-[760px] w-full rounded-xl border border-slate-200 bg-white"
    />
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      {children}
    </div>
  );
}
