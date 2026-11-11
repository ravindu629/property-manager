import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Building2,
  Wallet,
  Landmark,
  PiggyBank,
  Shield,
  CreditCard,
  Home,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { Modal, FormField, inputClass, Button } from '@/components/Modal';
import type { Fund, BankAccount } from '@/lib/types';

interface UnitOption {
  id: string;
  unit_ref: string;
  building_name: string | null;
}

const FUND_TYPES: { value: string; label: string; icon: typeof Wallet }[] = [
  { value: 'service_charge', label: 'Service Charge', icon: Wallet },
  { value: 'reserve', label: 'Reserve Fund', icon: PiggyBank },
  { value: 'sinking', label: 'Sinking Fund', icon: Landmark },
  { value: 'client', label: 'Client Account', icon: Shield },
  { value: 'other', label: 'Other', icon: Wallet },
];

const SCOPE_OPTIONS: { value: 'site' | 'building' | 'unit'; label: string; icon: typeof MapPin }[] = [
  { value: 'site', label: 'Whole Site', icon: MapPin },
  { value: 'building', label: 'Building', icon: Building2 },
  { value: 'unit', label: 'Unit', icon: Home },
];

function getFundIcon(type: string) {
  return FUND_TYPES.find((f) => f.value === type)?.icon ?? Wallet;
}

function getFundLabel(type: string) {
  return FUND_TYPES.find((f) => f.value === type)?.label ?? type;
}

function getScopeLabel(scope: string) {
  return SCOPE_OPTIONS.find((s) => s.value === scope)?.label ?? scope;
}

function getScopeIcon(scope: string) {
  return SCOPE_OPTIONS.find((s) => s.value === scope)?.icon ?? MapPin;
}

export function AccountsFundsSection() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    sort_code: '',
    notes: '',
  });

  const [showFundModal, setShowFundModal] = useState(false);
  const [fundModalBankId, setFundModalBankId] = useState<string | null>(null);
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [fundForm, setFundForm] = useState({
    name: '',
    scope: 'building' as 'site' | 'building' | 'unit',
    building_name: '',
    unit_id: '',
    fund_type: 'reserve',
    opening_balance: '',
    notes: '',
  });

  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    const [banksRes, fundsRes, unitsRes] = await Promise.all([
      supabase.from('bank_accounts').select('*').order('created_at', { ascending: true }),
      supabase
        .from('funds')
        .select('*, unit:units(unit_ref)')
        .order('created_at', { ascending: true }),
      supabase.from('units').select('id, unit_ref, building_name').order('unit_ref', { ascending: true }),
    ]);
    setBankAccounts((banksRes.data as BankAccount[]) ?? []);
    setFunds((fundsRes.data as Fund[]) ?? []);
    setUnits((unitsRes.data as UnitOption[]) ?? []);
    const uniqueBuildings = [...new Set(
      (unitsRes.data ?? [])
        .map((u: UnitOption) => u.building_name)
        .filter((b: string | null): b is string => b !== null)
    )].sort();
    setBuildings(uniqueBuildings);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function resetBankForm() {
    setBankForm({ bank_name: '', account_name: '', account_number: '', sort_code: '', notes: '' });
    setEditingBankId(null);
    setShowBankModal(false);
  }

  async function handleSaveBank() {
    const payload = {
      bank_name: bankForm.bank_name.trim(),
      account_name: bankForm.account_name.trim(),
      account_number: bankForm.account_number.trim(),
      sort_code: bankForm.sort_code.trim(),
      notes: bankForm.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (!payload.bank_name || !payload.account_name || !payload.account_number || !payload.sort_code) return;

    if (editingBankId) {
      await supabase.from('bank_accounts').update(payload).eq('id', editingBankId);
    } else {
      await supabase.from('bank_accounts').insert(payload);
    }
    resetBankForm();
    loadData();
  }

  function startEditBank(acct: BankAccount) {
    setBankForm({
      bank_name: acct.bank_name,
      account_name: acct.account_name,
      account_number: acct.account_number,
      sort_code: acct.sort_code,
      notes: acct.notes ?? '',
    });
    setEditingBankId(acct.id);
    setShowBankModal(true);
  }

  async function handleDeleteBank(acct: BankAccount) {
    await supabase.from('bank_accounts').delete().eq('id', acct.id);
    loadData();
  }

  function resetFundForm() {
    setFundForm({ name: '', scope: 'building', building_name: '', unit_id: '', fund_type: 'reserve', opening_balance: '', notes: '' });
    setEditingFundId(null);
    setFundModalBankId(null);
    setShowFundModal(false);
  }

  async function handleSaveFund(bankAccountId: string) {
    const payload = {
      name: fundForm.name.trim(),
      scope: fundForm.scope,
      building_name: fundForm.scope === 'building' ? (fundForm.building_name || null) : null,
      unit_id: fundForm.scope === 'unit' ? (fundForm.unit_id || null) : null,
      fund_type: fundForm.fund_type,
      opening_balance: fundForm.opening_balance ? Number(fundForm.opening_balance) : 0,
      current_balance: fundForm.opening_balance ? Number(fundForm.opening_balance) : 0,
      notes: fundForm.notes.trim() || null,
      bank_account_id: bankAccountId,
      updated_at: new Date().toISOString(),
    };
    if (!payload.name) return;
    if (fundForm.scope === 'building' && !fundForm.building_name) return;
    if (fundForm.scope === 'unit' && !fundForm.unit_id) return;

    if (editingFundId) {
      await supabase.from('funds').update(payload).eq('id', editingFundId);
    } else {
      await supabase.from('funds').insert(payload);
    }
    resetFundForm();
    loadData();
  }

  function startEditFund(fund: Fund, bankAccountId: string) {
    setFundForm({
      name: fund.name,
      scope: (fund.scope as 'site' | 'building' | 'unit') ?? 'site',
      building_name: fund.building_name ?? '',
      unit_id: fund.unit_id ?? '',
      fund_type: fund.fund_type,
      opening_balance: String(fund.opening_balance),
      notes: fund.notes ?? '',
    });
    setEditingFundId(fund.id);
    setFundModalBankId(bankAccountId);
    setShowFundModal(true);
  }

  async function handleDeleteFund(fund: Fund) {
    await supabase.from('funds').delete().eq('id', fund.id);
    loadData();
  }

  function toggleBank(id: string) {
    setExpandedBanks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function fundsForBank(bankId: string) {
    return funds.filter((f) => f.bank_account_id === bankId);
  }

  function fundScopeDisplay(fund: Fund): string {
    if (fund.scope === 'unit') return fund.unit?.unit_ref ?? 'Unit';
    if (fund.scope === 'building') return fund.building_name ?? 'Building';
    return 'Whole Site';
  }

  function groupedFundsByScope(bankId: string) {
    const bankFunds = fundsForBank(bankId);
    const groups: Record<string, Fund[]> = {};
    for (const fund of bankFunds) {
      const key = fundScopeDisplay(fund);
      if (!groups[key]) groups[key] = [];
      groups[key].push(fund);
    }
    return groups;
  }

  function scopeGroupIcon(key: string, bankFunds: Fund[]) {
    const fund = bankFunds.find((f) => fundScopeDisplay(f) === key);
    if (!fund) return MapPin;
    return getScopeIcon(fund.scope);
  }

  const totalFundsBalance = funds.reduce((sum, f) => sum + Number(f.current_balance), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  const unitsForBuilding = fundForm.building_name
    ? units.filter((u) => u.building_name === fundForm.building_name)
    : units;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Accounts & Funds</h2>
          <p className="mt-1 text-sm text-slate-500">
            Bank accounts hold the actual funds. Virtual funds underneath track how income is allocated — scoped to a unit, building, or the whole site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetFundForm();
              setShowFundModal(true);
            }}
            disabled={bankAccounts.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            title={bankAccounts.length === 0 ? 'Add a bank account first' : 'Add a virtual fund'}
          >
            <Plus className="h-3.5 w-3.5" /> Add Fund
          </button>
          <button
            onClick={() => { resetBankForm(); setShowBankModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add Bank Account
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Bank Accounts</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{bankAccounts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Virtual Funds</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{funds.length}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-sky-700">Total Fund Balances</p>
          <p className="mt-1 text-xl font-bold text-sky-700">{formatCurrency(totalFundsBalance)}</p>
        </div>
      </div>

      {/* Bank Accounts */}
      {bankAccounts.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <Landmark className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-400">No bank accounts yet.</p>
          <p className="mt-1 text-xs text-slate-300">
            Click "Add Bank Account" to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bankAccounts.map((acct) => {
            const isExpanded = expandedBanks.has(acct.id);
            const bankFunds = fundsForBank(acct.id);
            const bankBalance = bankFunds.reduce((sum, f) => sum + Number(f.current_balance), 0);
            const grouped = groupedFundsByScope(acct.id);

            return (
              <div key={acct.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Bank Account Header */}
                <div className="flex items-center gap-4 p-5">
                  <button
                    onClick={() => toggleBank(acct.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{acct.account_name}</h3>
                      <p className="text-xs text-slate-500">
                        {acct.bank_name} · {acct.sort_code} · {acct.account_number}
                      </p>
                    </div>
                  </button>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Fund Balance</p>
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(bankBalance)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        resetFundForm();
                        setFundModalBankId(acct.id);
                        setShowFundModal(true);
                      }}
                      className="flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
                      title="Add fund to this account"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Fund
                    </button>
                    <button
                      onClick={() => startEditBank(acct)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="Edit bank account"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBank(acct)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      title="Delete bank account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleBank(acct.id)}
                      className="ml-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  </div>
                </div>

                {/* Expanded: Virtual Funds */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-700">Virtual Funds</h4>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          {bankFunds.length}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          resetFundForm();
                          setFundModalBankId(acct.id);
                          setShowFundModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                      >
                        <Plus className="h-4 w-4" /> Add Fund
                      </button>
                    </div>

                    {/* Funds grouped by scope target */}
                    {bankFunds.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white py-10">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No virtual funds yet.</p>
                        <p className="mt-1 text-xs text-slate-300">
                          Add a virtual fund to track allocated income for this account.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(grouped).map(([scopeLabel, scopeFunds]) => {
                          const ScopeIcon = scopeGroupIcon(scopeLabel, bankFunds);
                          return (
                            <div key={scopeLabel}>
                              <div className="mb-2 flex items-center gap-2">
                                <ScopeIcon className="h-4 w-4 text-sky-600" />
                                <span className="text-xs font-semibold text-slate-700">{scopeLabel}</span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                  {scopeFunds.length}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {scopeFunds.map((fund) => {
                                  const Icon = getFundIcon(fund.fund_type);
                                  return (
                                    <div
                                      key={fund.id}
                                      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                          <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                          <button
                                            onClick={() => startEditFund(fund, acct.id)}
                                            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                            title="Edit"
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteFund(fund)}
                                            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                                            title="Delete"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                      <h4 className="mt-2.5 text-sm font-semibold text-slate-900">{fund.name}</h4>
                                      <p className="text-xs text-slate-400">{getFundLabel(fund.fund_type)}</p>
                                      <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-slate-500">Current</span>
                                          <span className="text-sm font-bold text-slate-900">
                                            {formatCurrency(Number(fund.current_balance))}
                                          </span>
                                        </div>
                                        <div className="mt-0.5 flex items-center justify-between">
                                          <span className="text-xs text-slate-500">Opening</span>
                                          <span className="text-xs text-slate-400">
                                            {formatCurrency(Number(fund.opening_balance))}
                                          </span>
                                        </div>
                                      </div>
                                      {fund.notes && (
                                        <p className="mt-2 text-xs text-slate-400">{fund.notes}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bank Account Modal */}
      <Modal
        open={showBankModal}
        onClose={resetBankForm}
        title={editingBankId ? 'Edit Bank Account' : 'Add Bank Account'}
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Bank Name">
            <input
              type="text"
              className={inputClass}
              value={bankForm.bank_name}
              onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
              placeholder="e.g. Barclays"
              autoFocus
            />
          </FormField>
          <FormField label="Account Name">
            <input
              type="text"
              className={inputClass}
              value={bankForm.account_name}
              onChange={(e) => setBankForm((f) => ({ ...f, account_name: e.target.value }))}
              placeholder="e.g. Kingfisher Court Client Account"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Account Number">
              <input
                type="text"
                className={inputClass}
                value={bankForm.account_number}
                onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))}
                placeholder="e.g. 12345678"
              />
            </FormField>
            <FormField label="Sort Code">
              <input
                type="text"
                className={inputClass}
                value={bankForm.sort_code}
                onChange={(e) => setBankForm((f) => ({ ...f, sort_code: e.target.value }))}
                placeholder="e.g. 20-32-29"
              />
            </FormField>
          </div>
          <FormField label="Notes (optional)">
            <textarea
              className={`${inputClass} min-h-[60px] resize-y`}
              value={bankForm.notes}
              onChange={(e) => setBankForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes about this account..."
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetBankForm}>Cancel</Button>
            <Button
              onClick={handleSaveBank}
              disabled={!bankForm.bank_name.trim() || !bankForm.account_name.trim() || !bankForm.account_number.trim() || !bankForm.sort_code.trim()}
            >
              {editingBankId ? 'Save Changes' : 'Add Bank Account'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Virtual Fund Modal */}
      <Modal
        open={showFundModal}
        onClose={resetFundForm}
        title={editingFundId ? 'Edit Virtual Fund' : 'Add Virtual Fund'}
        size="sm"
      >
        <div className="space-y-4">
          {!fundModalBankId && (
            <FormField label="Bank Account">
              <select
                className={inputClass}
                value={fundModalBankId ?? ''}
                onChange={(e) => setFundModalBankId(e.target.value || null)}
              >
                <option value="">Select a bank account...</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.account_name} ({b.bank_name})</option>
                ))}
              </select>
            </FormField>
          )}
          <FormField label="Fund Name">
            <input
              type="text"
              className={inputClass}
              value={fundForm.name}
              onChange={(e) => setFundForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. General Reserve"
              autoFocus
            />
          </FormField>
          <FormField label="Assign To">
            <div className="grid grid-cols-3 gap-2">
              {SCOPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = fundForm.scope === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFundForm((f) => ({
                      ...f,
                      scope: opt.value,
                      building_name: '',
                      unit_id: '',
                    }))}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                      active
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FormField>

          {fundForm.scope === 'building' && (
            <FormField label="Building">
              <select
                className={inputClass}
                value={fundForm.building_name}
                onChange={(e) => setFundForm((f) => ({ ...f, building_name: e.target.value, unit_id: '' }))}
              >
                <option value="">Select a building...</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </FormField>
          )}

          {fundForm.scope === 'unit' && (
            <FormField label="Unit">
              <select
                className={inputClass}
                value={fundForm.unit_id}
                onChange={(e) => setFundForm((f) => ({ ...f, unit_id: e.target.value }))}
              >
                <option value="">Select a unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_ref}{u.building_name ? ` (${u.building_name})` : ''}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Fund Type">
            <select
              className={inputClass}
              value={fundForm.fund_type}
              onChange={(e) => setFundForm((f) => ({ ...f, fund_type: e.target.value }))}
            >
              {FUND_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Opening Balance">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} pl-7`}
                value={fundForm.opening_balance}
                onChange={(e) => setFundForm((f) => ({ ...f, opening_balance: e.target.value }))}
                placeholder="0.00"
                disabled={!!editingFundId}
              />
            </div>
            {editingFundId && (
              <p className="mt-1 text-xs text-slate-400">
                Opening balance cannot be changed after creation.
              </p>
            )}
          </FormField>
          <FormField label="Notes (optional)">
            <textarea
              className={`${inputClass} min-h-[60px] resize-y`}
              value={fundForm.notes}
              onChange={(e) => setFundForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes about this fund..."
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetFundForm}>Cancel</Button>
            <Button
              onClick={() => fundModalBankId && handleSaveFund(fundModalBankId)}
              disabled={!fundForm.name.trim() || !fundModalBankId || (fundForm.scope === 'building' && !fundForm.building_name) || (fundForm.scope === 'unit' && !fundForm.unit_id)}
            >
              {editingFundId ? 'Save Changes' : 'Add Fund'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
