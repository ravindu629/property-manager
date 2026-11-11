import { type ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  neutral: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

export function statusBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    completed: 'success',
    cleared: 'success',
    reconciled: 'success',
    pending: 'warning',
    pending_renewal: 'warning',
    reported: 'info',
    approved: 'info',
    in_progress: 'warning',
    proposed: 'neutral',
    consultation: 'info',
    notice_served: 'warning',
    tendering: 'warning',
    expired: 'danger',
    cancelled: 'danger',
    rejected: 'danger',
    emergency: 'danger',
    high: 'danger',
    medium: 'warning',
    low: 'neutral',
    excellent: 'success',
    good: 'success',
    fair: 'warning',
    poor: 'danger',
  };
  return map[status] ?? 'default';
}
