import {
  Wallet,
  Settings2,
  PiggyBank,
  BookOpen,
  CreditCard,
  BarChart3,
  Landmark,
  type LucideIcon,
} from 'lucide-react';
import { BlankSection } from '@/components/BlankSection';
import { BudgetSection } from '@/sections/BudgetSection';
import { FinanceSetupSection } from '@/sections/FinanceSetupSection';
import { LedgersSection } from '@/sections/LedgersSection';

type FinanceTab = 'setup' | 'budget' | 'ledgers' | 'credit-control' | 'reports' | 'accounts';

const tabs: { key: FinanceTab; label: string; icon: LucideIcon }[] = [
  { key: 'setup', label: 'Set Up', icon: Settings2 },
  { key: 'budget', label: 'Budget', icon: PiggyBank },
  { key: 'ledgers', label: 'Ledgers', icon: BookOpen },
  { key: 'credit-control', label: 'Credit Control', icon: CreditCard },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'accounts', label: 'Accounts', icon: Landmark },
];

export function FinanceSection({ initialTab }: { initialTab?: FinanceTab }) {
  const tab = initialTab ?? 'setup';
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === current.key;
          return (
            <div
              key={t.key}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        {current.key === 'budget' ? (
          <BudgetSection />
        ) : current.key === 'setup' ? (
          <FinanceSetupSection />
        ) : current.key === 'ledgers' ? (
          <LedgersSection />
        ) : (
          <BlankSection title={current.label} icon={current.icon} />
        )}
      </div>
    </div>
  );
}
