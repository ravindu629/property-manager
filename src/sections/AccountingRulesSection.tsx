import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  Wallet,
  Check,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal, FormField, inputClass, Button } from '@/components/Modal';
import type { AccountingRule, ChartAccount, Fund, BankAccount } from '@/lib/types';

interface RuleFormState {
  account_id: string;
  postTo: 'fund' | 'bank';
  fund_id: string;
  bank_account_id: string;
  treatment: string;
  notes: string;
}

const TREATMENT_OPTIONS = [
  { value: 'credit', label: 'Credit (Income)', icon: ArrowDownCircle },
  { value: 'debit', label: 'Debit (Expenditure)', icon: ArrowUpCircle },
];

function getTreatmentLabel(value: string) {
  return TREATMENT_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

function getTreatmentIcon(value: string) {
  return TREATMENT_OPTIONS.find((t) => t.value === value)?.icon ?? ArrowDownCircle;
}

export function AccountingRulesSection() {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [rules, setRules] = useState<AccountingRule[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<RuleFormState>({
    account_id: '',
    postTo: 'fund',
    fund_id: '',
    bank_account_id: '',
    treatment: 'credit',
    notes: '',
  });

  const loadData = useCallback(async () => {
    const [accountsRes, rulesRes, fundsRes, banksRes] = await Promise.all([
      supabase.from('chart_of_accounts').select('*').order('sort_order', { ascending: true }),
      supabase
        .from('accounting_rules')
        .select('*, account:chart_of_accounts(*), fund:funds(id, name), bank_account:bank_accounts(id, account_name)')
        .order('created_at', { ascending: true }),
      supabase.from('funds').select('id, name, fund_type, scope, building_name, unit_id').order('name', { ascending: true }),
      supabase.from('bank_accounts').select('id, account_name, bank_name').order('account_name', { ascending: true }),
    ]);
    setAccounts((accountsRes.data as ChartAccount[]) ?? []);
    setRules((rulesRes.data as AccountingRule[]) ?? []);
    setFunds((fundsRes.data as Fund[]) ?? []);
    setBankAccounts((banksRes.data as BankAccount[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function resetForm() {
    setRuleForm({ account_id: '', postTo: 'fund', fund_id: '', bank_account_id: '', treatment: 'credit', notes: '' });
    setEditingRuleId(null);
    setShowModal(false);
  }

  function ruleForAccount(accountId: string): AccountingRule | undefined {
    return rules.find((r) => r.account_id === accountId);
  }

  function groupedAccounts(): Record<string, ChartAccount[]> {
    return accounts.reduce<Record<string, ChartAccount[]>>((acc, account) => {
      if (!acc[account.group]) acc[account.group] = [];
      acc[account.group].push(account);
      return acc;
    }, {});
  }

  const grouped = groupedAccounts();
  const accountsWithRules = accounts.filter((a) => ruleForAccount(a.id));
  const accountsWithoutRules = accounts.filter((a) => !ruleForAccount(a.id));

  async function handleSave() {
    if (!ruleForm.account_id) return;

    const payload = {
      account_id: ruleForm.account_id,
      fund_id: ruleForm.postTo === 'fund' ? (ruleForm.fund_id || null) : null,
      bank_account_id: ruleForm.postTo === 'bank' ? (ruleForm.bank_account_id || null) : null,
      treatment: ruleForm.treatment,
      notes: ruleForm.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingRuleId) {
      await supabase.from('accounting_rules').update(payload).eq('id', editingRuleId);
    } else {
      await supabase.from('accounting_rules').insert(payload);
    }
    resetForm();
    loadData();
  }

  function startEdit(rule: AccountingRule) {
    const account = accounts.find((a) => a.id === rule.account_id);
    setRuleForm({
      account_id: rule.account_id,
      postTo: rule.fund_id ? 'fund' : 'bank',
      fund_id: rule.fund_id ?? '',
      bank_account_id: rule.bank_account_id ?? '',
      treatment: rule.treatment,
      notes: rule.notes ?? '',
    });
    setEditingRuleId(rule.id);
    setShowModal(true);
    void account;
  }

  function startNew(account: ChartAccount) {
    setRuleForm({
      account_id: account.id,
      postTo: 'fund',
      fund_id: '',
      bank_account_id: '',
      treatment: account.type === 'income' ? 'credit' : 'debit',
      notes: '',
    });
    setEditingRuleId(null);
    setShowModal(true);
  }

  async function handleDelete(rule: AccountingRule) {
    await supabase.from('accounting_rules').delete().eq('id', rule.id);
    loadData();
  }

  function fundDisplayName(fund: { id: string; name: string }): string {
    const full = funds.find((f) => f.id === fund.id);
    if (!full) return fund.name;
    if (full.scope === 'building') return `${fund.name} — ${full.building_name ?? 'Building'}`;
    if (full.scope === 'unit') return `${fund.name} — Unit`;
    return fund.name;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  const selectedAccount = accounts.find((a) => a.id === ruleForm.account_id);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Accounting Rules</h2>
          <p className="mt-1 text-sm text-slate-500">
            Define how each chart of accounts line posts to a fund or bank account — crediting income or debiting expenditure.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          {accountsWithRules.length} of {accounts.length} mapped
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Chart of Accounts</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{accounts.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Rules Configured</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{accountsWithRules.length}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-amber-700">Awaiting Rules</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{accountsWithoutRules.length}</p>
        </div>
      </div>

      {/* Accounts grouped */}
      <div className="mt-6 space-y-4">
        {Object.entries(grouped).map(([groupName, groupAccounts]) => (
          <div key={groupName} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">{groupName}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {groupAccounts.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {groupAccounts.map((account) => {
                const rule = ruleForAccount(account.id);
                const TreatmentIcon = getTreatmentIcon(rule?.treatment ?? (account.type === 'income' ? 'credit' : 'debit'));
                const hasRule = !!rule;

                return (
                  <div key={account.id} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/30">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      account.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      <TreatmentIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-slate-400">{account.code}</span>
                        <span className="text-sm font-medium text-slate-900 truncate">{account.name}</span>
                      </div>
                      {hasRule ? (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                            <Wallet className="h-3 w-3" />
                            {rule?.fund ? fundDisplayName(rule.fund) : rule?.bank_account?.account_name ?? 'Bank account'}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span>{getTreatmentLabel(rule?.treatment ?? 'credit')}</span>
                          {rule?.notes && (
                            <>
                              <span className="text-slate-400">·</span>
                              <span className="truncate">{rule.notes}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-amber-600">No rule assigned</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {hasRule ? (
                        <>
                          <button
                            onClick={() => rule && startEdit(rule)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Edit rule"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => rule && handleDelete(rule)}
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                            title="Remove rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startNew(account)}
                          className="flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-100"
                        >
                          <Plus className="h-3 w-3" /> Assign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rule Modal */}
      <Modal
        open={showModal}
        onClose={resetForm}
        title={editingRuleId ? 'Edit Accounting Rule' : 'Assign Accounting Rule'}
        size="sm"
      >
        <div className="space-y-4">
          {selectedAccount && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-400">{selectedAccount.code}</span>
                <span className="text-sm font-semibold text-slate-900">{selectedAccount.name}</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedAccount.group} · {selectedAccount.type === 'income' ? 'Income' : 'Expenditure'}
              </p>
            </div>
          )}

          <FormField label="Post To">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRuleForm((f) => ({ ...f, postTo: 'bank' }))}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  ruleForm.postTo === 'bank'
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" /> Bank Account
              </button>
              <button
                type="button"
                onClick={() => setRuleForm((f) => ({ ...f, postTo: 'fund' }))}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  ruleForm.postTo === 'fund'
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Virtual Fund
              </button>
            </div>
          </FormField>

          {ruleForm.postTo === 'fund' ? (
            <FormField label="Virtual Fund">
              <select
                className={inputClass}
                value={ruleForm.fund_id}
                onChange={(e) => setRuleForm((f) => ({ ...f, fund_id: e.target.value }))}
              >
                <option value="">Select a fund...</option>
                {funds.map((fund) => {
                  const scopeLabel = fund.scope === 'building' ? ` — ${fund.building_name ?? 'Building'}` : fund.scope === 'unit' ? ' — Unit' : '';
                  return (
                    <option key={fund.id} value={fund.id}>{fund.name}{scopeLabel}</option>
                  );
                })}
              </select>
            </FormField>
          ) : (
            <FormField label="Bank Account">
              <select
                className={inputClass}
                value={ruleForm.bank_account_id}
                onChange={(e) => setRuleForm((f) => ({ ...f, bank_account_id: e.target.value }))}
              >
                <option value="">Select a bank account...</option>
                {bankAccounts.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.account_name} ({bank.bank_name})</option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Treatment">
            <div className="grid grid-cols-2 gap-2">
              {TREATMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = ruleForm.treatment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRuleForm((f) => ({ ...f, treatment: opt.value }))}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                      active
                        ? opt.value === 'credit'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {opt.label}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField label="Notes (optional)">
            <textarea
              className={`${inputClass} min-h-[60px] resize-y`}
              value={ruleForm.notes}
              onChange={(e) => setRuleForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes about this rule..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={ruleForm.postTo === 'fund' ? !ruleForm.fund_id : !ruleForm.bank_account_id}
            >
              {editingRuleId ? 'Save Changes' : 'Assign Rule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
