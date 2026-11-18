import { ArrowRight, Wand2 } from 'lucide-react';

// Landing page for Templates. It links to Template Studio.
export function TemplatesSection({
  onOpen,
}: {
  onOpen: (key: 'templates-pdfme-demo') => void;
}) {
  const cards = [
    {
      key: 'templates-pdfme-demo' as const,
      title: 'Template Studio',
      icon: Wand2,
      text: 'Design, fill and preview PDF templates for letters and documents.',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Templates</h1>
      <p className="mt-1 text-sm text-slate-500">
        Create and manage PDF templates for letters and documents.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => onOpen(c.key)}
              className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.text}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
