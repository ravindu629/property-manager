import { Suspense, lazy, useEffect, useState } from 'react';
import { Sidebar, type SectionKey } from '@/components/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MapPin } from 'lucide-react';
import { SiteDashboard } from '@/sections/SiteDashboard';
import { FinanceSection } from '@/sections/FinanceSection';
import { AssetsSection } from '@/sections/AssetsSection';
import { RepairsSection } from '@/sections/RepairsSection';
import { InsuranceSection } from '@/sections/InsuranceSection';
import { TransfersSection } from '@/sections/TransfersSection';
import { S20Section } from '@/sections/S20Section';
import { LibrarySection } from '@/sections/LibrarySection';
import type { DemoTab } from '@/pdfme-demo/types';
// pdfme is large, so Template Studio is only downloaded when opened.
const PdfmeDemoSection = lazy(() =>
  import('@/pdfme-demo/PdfmeDemoSection').then((m) => ({ default: m.PdfmeDemoSection }))
);
import { AdminSection } from '@/sections/AdminSection';
import { SiteUnitsSection } from '@/sections/SiteUnitsSection';
import { UnitDetail } from '@/sections/UnitDetail';
import { supabase } from '@/lib/supabase';
import type { SiteSettings } from '@/lib/types';

// Sidebar items under "Templates" and the Template Studio tab each one opens.
const templateTabByKey: Partial<Record<SectionKey, DemoTab>> = {
  'templates-gallery': 'templates',
  'templates-workspace': 'workspace',
  'templates-designer': 'designer',
  'templates-form-viewer': 'form-viewer',
};
const templateKeyByTab: Record<DemoTab, SectionKey> = {
  templates: 'templates-gallery',
  workspace: 'templates-workspace',
  designer: 'templates-designer',
  'form-viewer': 'templates-form-viewer',
};

function App() {
  const [active, setActive] = useState<SectionKey>('site');
  const [siteName, setSiteName] = useState('Loading...');
  const [siteAddress, setSiteAddress] = useState('');
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const [showSitePopup, setShowSitePopup] = useState(false);
  const [templatesDirty, setTemplatesDirty] = useState(false);
  const templateTab = templateTabByKey[active];

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('site_name, site_address')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const s = data as Pick<SiteSettings, 'site_name' | 'site_address'>;
          setSiteName(s.site_name);
          setSiteAddress(s.site_address ?? '');
        }
      });
  }, []);

  function handleSelect(key: SectionKey) {
    setOpenUnitId(null);
    // Clicking "Templates" opens Template Studio on its Templates tab.
    setActive(key === 'templates' ? 'templates-gallery' : key);
  }

  function handleSiteIconClick() {
    setShowSitePopup(true);
  }

  const renderSection = () => {
    if (active === 'site-units' && openUnitId) {
      return <UnitDetail unitId={openUnitId} onBack={() => setOpenUnitId(null)} />;
    }

    // All four Template Studio tabs use the same page, so the open template stays loaded.
    if (templateTab) {
      return (
        <PdfmeDemoSection
          tab={templateTab}
          onTabChange={(tab) => setActive(templateKeyByTab[tab])}
          onDirtyChange={setTemplatesDirty}
        />
      );
    }

    switch (active) {
      case 'site': return <SiteDashboard />;
      case 'site-units': return <SiteUnitsSection onOpenUnit={setOpenUnitId} />;
      case 'finance': return <FinanceSection />;
      case 'finance-setup': return <FinanceSection initialTab="setup" />;
      case 'finance-budget': return <FinanceSection initialTab="budget" />;
      case 'finance-ledgers': return <FinanceSection initialTab="ledgers" />;
      case 'finance-credit-control': return <FinanceSection initialTab="credit-control" />;
      case 'finance-reports': return <FinanceSection initialTab="reports" />;
      case 'finance-accounts': return <FinanceSection initialTab="accounts" />;
      case 'assets': return <AssetsSection />;
      case 'repairs': return <RepairsSection />;
      case 'insurance': return <InsuranceSection />;
      case 'transfers': return <TransfersSection />;
      case 's20': return <S20Section />;
      case 'library': return <LibrarySection />;
      case 'admin': return <AdminSection />;
      default: return <SiteDashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        active={active}
        onSelect={handleSelect}
        siteName={siteName}
        onSiteIconClick={handleSiteIconClick}
        templatesDirty={templatesDirty}
      />
      {showSitePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setShowSitePopup(false)}>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Site Address</h3>
                <p className="mt-1 text-sm text-slate-600">{siteAddress}</p>
                <button
                  onClick={() => setShowSitePopup(false)}
                  className="mt-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* key resets the error message when the user opens another page.
              Template Studio tabs share one key so switching tabs keeps the open template. */}
          <ErrorBoundary key={templateTab ? 'templates' : active}>
            <Suspense fallback={<p className="text-sm text-slate-400">Loading...</p>}>
              {renderSection()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default App;
