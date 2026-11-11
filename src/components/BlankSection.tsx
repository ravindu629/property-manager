import { type ReactNode } from 'react';
import { type ComponentType } from 'react';

export function BlankSection({
  title,
  icon: Icon,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          <Icon className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium text-slate-400">
          This section is ready to be built out.
        </p>
      </div>
    </div>
  );
}

export function SectionWrapper({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>;
}
