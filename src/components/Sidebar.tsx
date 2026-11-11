import {
  Building2,
  Wallet,
  Wrench,
  Shield,
  ArrowLeftRight,
  FileText,
  Library,
  FileSpreadsheet,
  Settings,
  HardHat,
  LayoutDashboard,
  ChevronDown,
  Building,
  Settings2,
  PiggyBank,
  BookOpen,
  CreditCard,
  BarChart3,
  Landmark,
  LayoutTemplate,
  FileCode2,
} from 'lucide-react';
import { type ComponentType } from 'react';

export type SectionKey =
  | 'site'
  | 'site-units'
  | 'finance'
  | 'finance-setup'
  | 'finance-budget'
  | 'finance-ledgers'
  | 'finance-credit-control'
  | 'finance-reports'
  | 'finance-accounts'
  | 'assets'
  | 'repairs'
  | 'insurance'
  | 'transfers'
  | 's20'
  | 'library'
  | 'templates'
  | 'templates-pdfme'
  | 'templates-reactpdf'
  | 'admin';

interface NavItem {
  key: SectionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
  parent?: SectionKey;
}

interface SubItem {
  key: SectionKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  parent: SectionKey;
}

const navItems: NavItem[] = [
  { key: 'site', label: 'Site', icon: LayoutDashboard, group: 'Overview' },
  { key: 'finance', label: 'Finance', icon: Wallet, group: 'Management' },
  { key: 'assets', label: 'Assets', icon: HardHat, group: 'Management' },
  { key: 'repairs', label: 'Repairs', icon: Wrench, group: 'Management' },
  { key: 'insurance', label: 'Insurance', icon: Shield, group: 'Management' },
  { key: 'transfers', label: 'Transfers', icon: ArrowLeftRight, group: 'Management' },
  { key: 's20', label: 'Section 20 Projects', icon: FileText, group: 'Management' },
  { key: 'library', label: 'Library', icon: Library, group: 'Reference' },
  { key: 'templates', label: 'Templates', icon: FileSpreadsheet, group: 'Reference' },
  { key: 'admin', label: 'Administration', icon: Settings, group: 'System' },
];

const subItems: SubItem[] = [
  { key: 'site-units', label: 'Units', icon: Building, parent: 'site' },
  { key: 'finance-setup', label: 'Set Up', icon: Settings2, parent: 'finance' },
  { key: 'finance-budget', label: 'Budget', icon: PiggyBank, parent: 'finance' },
  { key: 'finance-ledgers', label: 'Ledgers', icon: BookOpen, parent: 'finance' },
  { key: 'finance-credit-control', label: 'Credit Control', icon: CreditCard, parent: 'finance' },
  { key: 'finance-reports', label: 'Reports', icon: BarChart3, parent: 'finance' },
  { key: 'finance-accounts', label: 'Accounts', icon: Landmark, parent: 'finance' },
  { key: 'templates-pdfme', label: 'pdfme', icon: LayoutTemplate, parent: 'templates' },
  { key: 'templates-reactpdf', label: 'React PDF', icon: FileCode2, parent: 'templates' },
];

export function Sidebar({
  active,
  onSelect,
  siteName,
  onSiteIconClick,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
  siteName: string;
  onSiteIconClick?: () => void;
}) {
  const groups = [...new Set(navItems.map((item) => item.group))];
  const siteExpanded = active === 'site' || active === 'site-units';
  const financeExpanded =
    active === 'finance' ||
    active === 'finance-setup' ||
    active === 'finance-budget' ||
    active === 'finance-ledgers' ||
    active === 'finance-credit-control' ||
    active === 'finance-reports' ||
    active === 'finance-accounts';
  const templatesExpanded =
    active === 'templates' || active === 'templates-pdfme' || active === 'templates-reactpdf';

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-900">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <button
          onClick={() => onSiteIconClick?.()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-transform hover:scale-105 hover:bg-sky-400"
          title="View site address"
        >
          <Building2 className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {siteName}
          </p>
          <p className="text-xs text-slate-400">Property Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group} className="mb-4">
            <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group}
            </p>
            {navItems
              .filter((item) => item.group === group)
              .map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                const hasSubs = subItems.some((s) => s.parent === item.key);
                const isExpanded =
                  (item.key === 'site' && siteExpanded) ||
                  (item.key === 'finance' && financeExpanded) ||
                  (item.key === 'templates' && templatesExpanded);

                return (
                  <div key={item.key}>
                    <button
                      onClick={() => onSelect(item.key)}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                          : isExpanded
                            ? 'text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : isExpanded
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-white'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {hasSubs && (
                        <ChevronDown
                          className={`ml-auto h-4 w-4 shrink-0 transition-transform ${
                            isExpanded ? 'rotate-180 text-slate-400' : 'text-slate-500'
                          }`}
                        />
                      )}
                    </button>

                    {/* Sub-items */}
                    {hasSubs && isExpanded && (
                      <div className="mt-1 ml-4 space-y-0.5 border-l border-slate-700 pl-3">
                        {subItems
                          .filter((s) => s.parent === item.key)
                          .map((sub) => {
                            const SubIcon = sub.icon;
                            const subActive = active === sub.key;
                            return (
                              <button
                                key={sub.key}
                                onClick={() => onSelect(sub.key)}
                                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all ${
                                  subActive
                                    ? 'bg-sky-500/15 text-sky-300'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{sub.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-200">
            PM
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">
              Property Manager
            </p>
            <p className="text-[11px] text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
