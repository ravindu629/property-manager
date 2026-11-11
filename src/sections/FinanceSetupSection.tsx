import { useEffect, useState } from 'react';
import { Calendar, CalendarRange, Save, Clock, Layers, Scale, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SiteSettings } from '@/lib/types';
import { useCallback } from 'react';
import { BudgetSchedulesSection } from '@/sections/BudgetSchedulesSection';
import { ApportionmentsSection } from '@/sections/ApportionmentsSection';
import { AccountsFundsSection } from '@/sections/AccountsFundsSection';
import { AccountingRulesSection } from '@/sections/AccountingRulesSection';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20';

const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: '1 — Annual' },
  { value: '2', label: '2 — Semi-Annual' },
  { value: '4', label: '4 — Quarterly' },
];

const DEMAND_LABELS = ['First Demand Date', 'Second Demand Date', 'Third Demand Date', 'Fourth Demand Date'];

const TREATMENT_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'in_advance', label: 'In Advance', description: 'Demands are issued in advance based on the budgeted expenditure.' },
  { value: 'in_arrears', label: 'In Arrears', description: 'Funds are spent first, then the demand is calculated based on actual expenditure.' },
];

const ACCOUNTING_TREATMENT_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'balancing', label: 'Balancing (Deficit/Surplus)', description: 'At year-end, any surplus is credited back to each unit owner and any deficit is charged to them, based on their contribution percentage per schedule.' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDayMonth(iso: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
  });
}

function addOneYearMinusDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function FinanceSetupSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [scStart, setScStart] = useState('');
  const [scEnd, setScEnd] = useState('');
  const [endTouched, setEndTouched] = useState(false);
  const [demandFrequency, setDemandFrequency] = useState('');
  const [demandDates, setDemandDates] = useState<string[]>(['', '', '', '']);
  const [demandTreatment, setDemandTreatment] = useState('');
  const [accountingTreatment, setAccountingTreatment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [schedulesRefreshKey, setSchedulesRefreshKey] = useState(0);
  const onSchedulesChange = useCallback(() => setSchedulesRefreshKey((k) => k + 1), []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle<SiteSettings>();
      if (data) {
        setSettings(data);
        setScStart(data.service_charge_year_start ?? '');
        setScEnd(data.service_charge_year_end ?? '');
        setDemandFrequency(data.demand_frequency ? String(data.demand_frequency) : '');
        setDemandDates([
          data.demand_date_1 ?? '',
          data.demand_date_2 ?? '',
          data.demand_date_3 ?? '',
          data.demand_date_4 ?? '',
        ]);
        setDemandTreatment(data.demand_treatment ?? '');
        setAccountingTreatment(data.accounting_treatment ?? '');
        setIsLocked(true);
      }
      setLoading(false);
    })();
  }, []);

  const handleStartChange = (value: string) => {
    setScStart(value);
    if (value && !endTouched) {
      setScEnd(addOneYearMinusDay(value));
    }
  };

  const handleEndChange = (value: string) => {
    setScEnd(value);
    setEndTouched(true);
  };

  const handleDemandDateChange = (index: number, value: string) => {
    setDemandDates((prev) => prev.map((d, i) => (i === index ? value : d)));
  };

  const freqNum = demandFrequency ? Number(demandFrequency) : 0;

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from('site_settings')
      .update({
        service_charge_year_start: scStart || null,
        service_charge_year_end: scEnd || null,
        demand_frequency: demandFrequency ? Number(demandFrequency) : null,
        demand_date_1: demandDates[0] || null,
        demand_date_2: demandDates[1] || null,
        demand_date_3: demandDates[2] || null,
        demand_date_4: demandDates[3] || null,
        demand_treatment: demandTreatment || null,
        accounting_treatment: accountingTreatment || null,
      })
      .eq('id', 1);
    setSaving(false);
    setSaved(true);
    setIsLocked(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleEdit = () => {
    setIsLocked(false);
    setSaved(false);
  };

  const lockedInputClass = isLocked
    ? 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm cursor-not-allowed'
    : inputClass;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AccountsFundsSection />

      <div className="border-t border-slate-200" />

      <AccountingRulesSection />

      <div className="border-t border-slate-200" />

      <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Service Charge Year</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define the service charge year period. The end date auto-fills from the start date but can be adjusted.
          </p>
        </div>
        <button
          onClick={isLocked ? handleEdit : handleSave}
          disabled={saving}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50 ${
            isLocked
              ? 'bg-slate-600 hover:bg-slate-700'
              : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          {isLocked ? (
            <>
              <Pencil className="h-4 w-4" />
              Edit
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </>
          )}
        </button>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Changes saved successfully.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Start Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Service Charge Year — Start Date
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                disabled={isLocked}
                className={`${lockedInputClass} pl-9`}
                value={scStart}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </div>
            {scStart && (
              <p className="mt-1.5 text-xs text-slate-400">
                {formatDate(scStart)}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Service Charge Year — End Date
            </label>
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                disabled={isLocked}
                className={`${lockedInputClass} pl-9`}
                value={scEnd}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </div>
            {scEnd && (
              <p className="mt-1.5 text-xs text-slate-400">
                {formatDate(scEnd)}
                {endTouched && (
                  <span className="ml-1 text-amber-500">— manually adjusted</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Demand Frequency */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="max-w-xs">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Demand Frequency
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                disabled={isLocked}
                className={`${lockedInputClass} appearance-none pl-9`}
                value={demandFrequency}
                onChange={(e) => setDemandFrequency(e.target.value)}
              >
                <option value="">Select frequency...</option>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              How many times per year service charge demands are issued.
            </p>
          </div>

          {/* Demand Date Boxes */}
          {freqNum > 0 && (
            <div className="mt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: freqNum }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {DEMAND_LABELS[i]}
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="date"
                        disabled={isLocked}
                        className={`${lockedInputClass} pl-9`}
                        value={demandDates[i]}
                        onChange={(e) => handleDemandDateChange(i, e.target.value)}
                      />
                    </div>
                    {demandDates[i] && (
                      <p className="mt-1.5 text-xs font-medium text-slate-500">
                        {formatDayMonth(demandDates[i])}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Demand Treatment */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="max-w-md">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Demand Treatment
            </label>
            <div className="relative">
              <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                disabled={isLocked}
                className={`${lockedInputClass} appearance-none pl-9`}
                value={demandTreatment}
                onChange={(e) => setDemandTreatment(e.target.value)}
              >
                <option value="">Select treatment...</option>
                {TREATMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {demandTreatment && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {TREATMENT_OPTIONS.find((o) => o.value === demandTreatment)?.description}
              </p>
            )}
          </div>
        </div>

        {/* Accounting Treatment */}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="max-w-md">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Accounting Treatment
            </label>
            <div className="relative">
              <Scale className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                disabled={isLocked}
                className={`${lockedInputClass} appearance-none pl-9`}
                value={accountingTreatment}
                onChange={(e) => setAccountingTreatment(e.target.value)}
              >
                <option value="">Select treatment...</option>
                {ACCOUNTING_TREATMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {accountingTreatment && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                {ACCOUNTING_TREATMENT_OPTIONS.find((o) => o.value === accountingTreatment)?.description}
              </p>
            )}
          </div>
        </div>

        {scStart && scEnd && (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <CalendarRange className="h-5 w-5 text-sky-600" />
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{formatDate(scStart)}</span>
              {' — '}
              <span className="font-medium text-slate-900">{formatDate(scEnd)}</span>
            </p>
          </div>
        )}
      </div>
      </div>

      <div className="border-t border-slate-200" />

      <div className="space-y-6">
      <BudgetSchedulesSection onSchedulesChange={onSchedulesChange} />

      <ApportionmentsSection refreshKey={schedulesRefreshKey} />
      </div>
    </div>
  );
}
