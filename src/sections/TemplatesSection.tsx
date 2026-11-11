import { ArrowRight, FileCode2, LayoutTemplate } from 'lucide-react';

// Landing page for Templates. It links to the two library test sections.
export function TemplatesSection({
  onOpen,
}: {
  onOpen: (key: 'templates-pdfme' | 'templates-reactpdf') => void;
}) {
  const cards = [
    {
      key: 'templates-pdfme' as const,
      title: 'pdfme',
      icon: LayoutTemplate,
      text: 'Ready-made drag-and-drop template designer. Templates are JSON with mm positions.',
    },
    {
      key: 'templates-reactpdf' as const,
      title: 'React PDF',
      icon: FileCode2,
      text: 'PDFs written as React components, with a custom mm positioning editor built for this test.',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Templates</h1>
      <p className="mt-1 text-sm text-slate-500">
        Proof of concept comparing two PDF libraries using the same A4 letter template and JSON data.
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
