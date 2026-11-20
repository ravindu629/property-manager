// Small UI building blocks used across the Template Studio tabs.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { ToastState } from '@/pdfme-demo/components/useToast';

export function DemoButton({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary: 'bg-sky-600 text-white hover:bg-sky-500 border border-sky-600',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300',
    danger: 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
  }[variant];
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** A horizontal bar of labelled control groups, like the toolbar in the official playground. */
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      {children}
    </div>
  );
}

export function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

/** Coloured label for a version, for example "Draft v2" or "Published v1". */
export function VersionBadge({ status, versionNo }: { status: 'DRAFT' | 'PUBLISHED' | 'RETIRED'; versionNo: number }) {
  const styles = {
    DRAFT: 'bg-amber-50 text-amber-700 ring-amber-200',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    RETIRED: 'bg-slate-100 text-slate-500 ring-slate-200',
  }[status];
  const label = { DRAFT: 'Draft', PUBLISHED: 'Published', RETIRED: 'Retired' }[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles}`}>
      {label} v{versionNo}
    </span>
  );
}

// ---------- Toast messages (the hook lives in useToast.ts) ----------

export function ToastView({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info;
  const color =
    toast.kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : toast.kind === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-800'
        : 'border-sky-200 bg-sky-50 text-sky-800';
  return (
    <div
      key={toast.id}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${color}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{toast.text}</span>
    </div>
  );
}
