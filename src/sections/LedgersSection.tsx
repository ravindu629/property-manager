import { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  Clock,
  CheckCircle2,
  Landmark,
  ArrowUpCircle,
  ArrowDownCircle,
  Paperclip,
  Filter,
  Search,
  Plus,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { Modal, FormField, inputClass, selectClass, Button } from '@/components/Modal';

type LedgerType = 'general' | 'income' | 'expenditure';

interface LedgerOption {
  key: LedgerType;
  label: string;
  description: string;
  icon: LucideIcon;
}

const ledgerOptions: LedgerOption[] = [
  {
    key: 'general',
    label: 'General Ledger',
    description: 'All transactions across every account — income, expenditure, and adjustments.',
    icon: Wallet,
  },
  {
    key: 'income',
    label: 'Income Ledger',
    description: 'Service charge demands, reserve fund contributions, and other income received.',
    icon: TrendingUp,
  },
  {
    key: 'expenditure',
    label: 'Expenditure Ledger',
    description: 'Costs incurred against budget categories — repairs, utilities, management, and more.',
    icon: TrendingDown,
  },
];

export function LedgersSection() {
  const [selected, setSelected] = useState<LedgerType | null>(null);

  if (selected) {
    const option = ledgerOptions.find((o) => o.key === selected)!;
    return (
      <LedgerDetail type={selected} label={option.label} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ledgers</h1>
      <p className="mt-1 text-sm text-slate-500">
        Select a ledger to view its transactions and postings.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ledgerOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                  <Icon className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{opt.label}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LedgerDetail({
  type,
  label,
  onBack,
}: {
  type: LedgerType;
  label: string;
  onBack: () => void;
}) {
  if (type === 'general') {
    return <GeneralLedger label={label} onBack={onBack} />;
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Ledgers
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{label}</h1>
          <p className="text-sm text-slate-500">
            {type === 'income' && 'Income transactions and demand postings.'}
            {type === 'expenditure' && 'Expenditure transactions against budget categories.'}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
          <FileText className="h-7 w-7" />
        </div>
        <p className="text-sm font-medium text-slate-400">
          This ledger view is ready to be built out.
        </p>
      </div>
    </div>
  );
}

type StatusFilter = 'all' | 'cleared' | 'pending';
type TypeFilter = 'all' | 'income' | 'expenditure';

function GeneralLedger({ label, onBack }: { label: string; onBack: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*, unit:units(unit_ref, owner_name), account:chart_of_accounts(*)')
      .order('transaction_date', { ascending: true })
      .order('created_at', { ascending: true });
    setTransactions((data as Transaction[]) ?? []);
    setLoading(false);
  }

  const filtered = transactions.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const haystack = [
        t.party,
        t.reference,
        t.description,
        t.category,
        t.unit?.unit_ref,
        t.unit?.owner_name,
        t.account?.name,
        t.account?.code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const clearedTxns = filtered.filter((t) => t.status === 'cleared');
  const totalIncome = clearedTxns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenditure = clearedTxns
    .filter((t) => t.type === 'expenditure')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const bankBalance = totalIncome - totalExpenditure;

  let runningBalance = 0;
  const sortedCleared = [...clearedTxns].sort((a, b) => {
    const dateCmp = a.transaction_date.localeCompare(b.transaction_date);
    if (dateCmp !== 0) return dateCmp;
    return a.created_at.localeCompare(b.created_at);
  });
  const rowsWithBalance = sortedCleared.map((t) => {
    runningBalance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    return { ...t, runningBalance };
  });

  const pendingRows = filtered.filter((t) => t.status === 'pending');

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Ledgers
      </button>

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{label}</h1>
            <p className="truncate text-sm text-slate-500">
              All income and expenditure in chronological order with running balances.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Add Transaction
        </button>
      </div>

      {/* Summary bar */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Total Income (Cleared)
          </div>
          <p className="mt-1.5 text-xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <ArrowDownCircle className="h-3.5 w-3.5" />
            Total Expenditure (Cleared)
          </div>
          <p className="mt-1.5 text-xl font-bold text-rose-700">{formatCurrency(totalExpenditure)}</p>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
            <Landmark className="h-3.5 w-3.5" />
            Bank Balance
          </div>
          <p className="mt-1.5 text-xl font-bold text-sky-700">{formatCurrency(bankBalance)}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by party, reference, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <Filter className="ml-1 h-3.5 w-3.5 text-slate-400" />
          {(['all', 'income', 'expenditure'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {(['all', 'cleared', 'pending'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {rowsWithBalance.length === 0 && pendingRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <FileText className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-400">No transactions found.</p>
            <p className="mt-1 text-xs text-slate-300">
              Transactions will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Party</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 text-right font-semibold">Income</th>
                  <th className="px-4 py-3 text-right font-semibold">Expenditure</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Doc</th>
                </tr>
              </thead>
              <tbody>
                {rowsWithBalance.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {t.party ?? t.unit?.owner_name ?? '—'}
                      </div>
                      {(t.account || t.description) && (
                        <div className="text-xs text-slate-400">
                          {t.account ? `${t.account.code} — ${t.account.name}` : t.description}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {t.reference ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">
                      {t.type === 'income' ? formatCurrency(Number(t.amount)) : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                      {t.type === 'expenditure' ? formatCurrency(Number(t.amount)) : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(t.runningBalance)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.doc_url ? (
                        <a
                          href={t.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1 text-sky-600 transition-colors hover:bg-sky-50"
                          title="View document"
                        >
                          <Paperclip className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {pendingRows.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 bg-amber-50/20 transition-colors hover:bg-amber-50/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {t.party ?? t.unit?.owner_name ?? '—'}
                      </div>
                      {(t.account || t.description) && (
                        <div className="text-xs text-slate-400">
                          {t.account ? `${t.account.code} — ${t.account.name}` : t.description}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {t.reference ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-600">
                      {t.type === 'income' ? formatCurrency(Number(t.amount)) : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                      {t.type === 'expenditure' ? formatCurrency(Number(t.amount)) : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-slate-400">
                      —
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.doc_url ? (
                        <a
                          href={t.doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1 text-sky-600 transition-colors hover:bg-sky-50"
                          title="View document"
                        >
                          <Paperclip className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {rowsWithBalance.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Current Balance
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(totalIncome)}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">{formatCurrency(totalExpenditure)}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(bankBalance)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <CheckCircle2 className="h-4 w-4 text-slate-400" />
        Balance reflects only cleared transactions. Pending transactions are shown but excluded from the running balance.
      </div>

      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {
          setShowAddModal(false);
          loadTransactions();
        }}
      />
    </div>
  );
}

function AddTransactionModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [txType, setTxType] = useState<'income' | 'expenditure'>('income');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [party, setParty] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTxType('income');
      setDate(new Date().toISOString().slice(0, 10));
      setAmount('');
      setParty('');
      setReference('');
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!date) {
      setError('Please select a date.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!party.trim()) {
      setError('Please enter a party name.');
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from('transactions').insert({
      type: txType,
      transaction_date: date,
      amount: parsedAmount,
      party: party.trim(),
      reference: reference.trim() || null,
      status: 'pending',
      category: txType === 'income' ? 'service_charge' : 'general',
    });
    setSaving(false);

    if (insertError) {
      setError('Could not save the transaction. Please try again.');
      return;
    }

    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Transaction" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                txType === 'income'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <ArrowUpCircle className="h-5 w-5" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setTxType('expenditure')}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                txType === 'expenditure'
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <ArrowDownCircle className="h-5 w-5" />
              Expenditure
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
          </FormField>

          <FormField label="Amount">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                £
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} pl-7`}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Party">
          <input
            type="text"
            required
            placeholder="e.g. supplier name, unit owner, bank"
            value={party}
            onChange={(e) => setParty(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Reference">
          <input
            type="text"
            placeholder="e.g. invoice number, receipt number"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className={inputClass}
          />
        </FormField>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'cleared') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Cleared
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {status}
    </span>
  );
}
