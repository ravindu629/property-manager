import { useEffect, useState } from 'react';
import {
  PiggyBank,
  Plus,
  Trash2,
  Save,
  Pencil,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Copy,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ChartAccount, BudgetTemplate, BudgetLine } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Modal, FormField, inputClass, selectClass, Button } from '@/components/Modal';

export function BudgetSection() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [yearDraft, setYearDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedId) loadLines(selectedId);
    else setLines([]);
  }, [selectedId]);

  async function loadData() {
    const [{ data: tmplData }, { data: acctData }] = await Promise.all([
      supabase.from('budget_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('chart_of_accounts').select('*').order('sort_order', { ascending: true }),
    ]);
    setTemplates((tmplData as BudgetTemplate[]) ?? []);
    setAccounts((acctData as ChartAccount[]) ?? []);
    if (tmplData && tmplData.length > 0) setSelectedId((tmplData[0] as BudgetTemplate).id);
    setLoading(false);
  }

  async function loadLines(templateId: string) {
    const { data } = await supabase
      .from('budget_lines')
      .select('*, account:chart_of_accounts(*)')
      .eq('budget_template_id', templateId)
      .order('sort_order', { ascending: true });
    setLines((data as BudgetLine[]) ?? []);
  }

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;
  const groupedAccounts = accounts.reduce<Record<string, ChartAccount[]>>((acc, acct) => {
    if (!acc[acct.group]) acc[acct.group] = [];
    acc[acct.group].push(acct);
    return acc;
  }, {});

  const filteredAccounts = accounts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.includes(q) || a.group.toLowerCase().includes(q);
  });

  const existingAccountIds = new Set(lines.map((l) => l.account_id));
  const availableAccounts = filteredAccounts.filter((a) => !existingAccountIds.has(a.id));

  const totalIncome = lines
    .filter((l) => l.account?.type === 'income')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalExpenditure = lines
    .filter((l) => l.account?.type === 'expenditure')
    .reduce((sum, l) => sum + (l.amount || 0), 0);
  const surplus = totalIncome - totalExpenditure;

  async function createTemplate(name: string, year: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('budget_templates')
      .insert({ name: name.trim(), financial_year: year.trim() })
      .select('*')
      .single();
    if (!error && data) {
      const newTmpl = data as BudgetTemplate;
      setTemplates((prev) => [newTmpl, ...prev]);
      setSelectedId(newTmpl.id);
      return newTmpl.id;
    }
    return null;
  }

  async function duplicateTemplate(tmpl: BudgetTemplate) {
    const { data, error } = await supabase
      .from('budget_templates')
      .insert({
        name: `${tmpl.name} (Copy)`,
        financial_year: tmpl.financial_year,
        status: 'draft',
        notes: tmpl.notes,
      })
      .select('*')
      .single();
    if (error || !data) return;
    const newTmpl = data as BudgetTemplate;
    const { data: existingLines } = await supabase
      .from('budget_lines')
      .select('*')
      .eq('budget_template_id', tmpl.id);
    if (existingLines && existingLines.length > 0) {
      const newLines = (existingLines as BudgetLine[]).map((l) => ({
        budget_template_id: newTmpl.id,
        account_id: l.account_id,
        amount: l.amount,
        notes: l.notes,
        sort_order: l.sort_order,
      }));
      await supabase.from('budget_lines').insert(newLines);
    }
    setTemplates((prev) => [newTmpl, ...prev]);
    setSelectedId(newTmpl.id);
  }

  async function deleteTemplate(tmpl: BudgetTemplate) {
    await supabase.from('budget_templates').delete().eq('id', tmpl.id);
    setTemplates((prev) => prev.filter((t) => t.id !== tmpl.id));
    if (selectedId === tmpl.id) setSelectedId(templates[0]?.id ?? null);
  }

  async function saveTemplateMeta() {
    if (!selectedTemplate) return;
    const { data } = await supabase
      .from('budget_templates')
      .update({
        name: nameDraft.trim(),
        financial_year: yearDraft.trim(),
        notes: notesDraft.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTemplate.id)
      .select('*')
      .single();
    if (data) {
      const updated = data as BudgetTemplate;
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
    setEditName(false);
  }

  async function addLine(accountId: string) {
    if (!selectedId) return;
    const sortOrder = lines.length;
    const { data, error } = await supabase
      .from('budget_lines')
      .insert({
        budget_template_id: selectedId,
        account_id: accountId,
        amount: 0,
        sort_order: sortOrder,
      })
      .select('*, account:chart_of_accounts(*)')
      .single();
    if (!error && data) {
      setLines((prev) => [...prev, data as BudgetLine]);
    }
  }

  async function updateLineAmount(lineId: string, amount: number) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, amount } : l)));
    await supabase.from('budget_lines').update({ amount }).eq('id', lineId);
  }

  async function updateLineNotes(lineId: string, notes: string) {
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, notes } : l)));
    await supabase.from('budget_lines').update({ notes }).eq('id', lineId);
  }

  async function removeLine(lineId: string) {
    await supabase.from('budget_lines').delete().eq('id', lineId);
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  }

  async function approveTemplate() {
    if (!selectedTemplate) return;
    const { data } = await supabase
      .from('budget_templates')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', selectedTemplate.id)
      .select('*')
      .single();
    if (data) {
      const updated = data as BudgetTemplate;
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budget</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create editable budget templates using cost categories from the Chart of Accounts.
          </p>
        </div>
        <Button onClick={() => { setAddModalOpen(true); setSelectedAccountIds(new Set()); setSearchQuery(''); }}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {/* Template selector */}
      {templates.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedId(tmpl.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                selectedId === tmpl.id
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {tmpl.name}
              {tmpl.status === 'approved' && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${
                  selectedId === tmpl.id ? 'bg-sky-400/30 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  Approved
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
            <PiggyBank className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-400">No budget templates yet.</p>
          <p className="mt-1 text-xs text-slate-300">Click "New Template" to create one.</p>
        </div>
      ) : selectedTemplate ? (
        <div className="space-y-4">
          {/* Template header */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editName ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <FormField label="Template Name">
                        <input
                          type="text"
                          className={inputClass}
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          placeholder="e.g. 2025 Annual Budget"
                        />
                      </FormField>
                      <FormField label="Financial Year">
                        <input
                          type="text"
                          className={inputClass}
                          value={yearDraft}
                          onChange={(e) => setYearDraft(e.target.value)}
                          placeholder="e.g. 2025/26"
                        />
                      </FormField>
                    </div>
                    <FormField label="Notes">
                      <textarea
                        className={`${inputClass} min-h-[60px] resize-y`}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Optional notes about this budget..."
                      />
                    </FormField>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-slate-900">{selectedTemplate.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      {selectedTemplate.financial_year && (
                        <span>FY {selectedTemplate.financial_year}</span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        selectedTemplate.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {selectedTemplate.status === 'approved' ? 'Approved' : 'Draft'}
                      </span>
                      {selectedTemplate.notes && (
                        <span className="text-slate-400">{selectedTemplate.notes}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editName ? (
                  <>
                    <Button variant="secondary" onClick={() => setEditName(false)}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={saveTemplateMeta}>
                      <Check className="h-4 w-4" /> Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setNameDraft(selectedTemplate.name);
                        setYearDraft(selectedTemplate.financial_year ?? '');
                        setNotesDraft(selectedTemplate.notes ?? '');
                        setEditName(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit Details
                    </Button>
                    <Button variant="secondary" onClick={() => duplicateTemplate(selectedTemplate)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                    {selectedTemplate.status !== 'approved' && (
                      <Button onClick={approveTemplate}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    <button
                      onClick={() => deleteTemplate(selectedTemplate)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Budget table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Cost Categories</h3>
              <button
                onClick={() => { setAddModalOpen(true); setSelectedAccountIds(new Set()); setSearchQuery(''); }}
                className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
              >
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm text-slate-400">No cost categories added yet.</p>
                <p className="text-xs text-slate-300">Click "Add Category" to select from the Chart of Accounts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-2.5">Code</th>
                      <th className="px-3 py-2.5">Cost Category</th>
                      <th className="px-3 py-2.5">Group</th>
                      <th className="px-3 py-2.5 text-right">Budgeted Amount</th>
                      <th className="px-3 py-2.5">Notes</th>
                      <th className="px-5 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{line.account?.code}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              line.account?.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {line.account?.type === 'income' ? 'Income' : 'Cost'}
                            </span>
                            <span className="font-medium text-slate-700">{line.account?.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-400">{line.account?.group}</td>
                        <td className="px-3 py-3 text-right">
                          <input
                            type="number"
                            className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm tabular-nums text-slate-700 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            value={line.amount || ''}
                            onChange={(e) => updateLineAmount(line.id, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            className="w-full max-w-[200px] rounded-lg border border-transparent px-2 py-1 text-sm text-slate-500 transition-colors hover:border-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            value={line.notes ?? ''}
                            onChange={(e) => updateLineNotes(line.id, e.target.value)}
                            placeholder="Add note..."
                          />
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                            title="Remove category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                        Total Income:
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600 tabular-nums">
                        {formatCurrency(totalIncome)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-slate-600">
                        Total Expenditure:
                      </td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-rose-600 tabular-nums">
                        {formatCurrency(totalExpenditure)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="bg-slate-100/70">
                      <td colSpan={3} className="px-5 py-3 text-right text-sm font-bold text-slate-700">
                        {surplus >= 0 ? 'Surplus' : 'Deficit'}:
                      </td>
                      <td className={`px-3 py-3 text-right text-sm font-bold tabular-nums ${
                        surplus >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {formatCurrency(surplus)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Add Categories Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={selectedTemplate ? 'Add Cost Categories' : 'New Budget Template'}
        size="lg"
      >
        {!selectedTemplate ? (
          <NewTemplateForm
            accounts={accounts}
            onCreate={async (name, year, selectedAccountIds) => {
              const templateId = await createTemplate(name, year);
              if (templateId && selectedAccountIds.size > 0) {
                const newLines = [...selectedAccountIds].map((accountId, i) => ({
                  budget_template_id: templateId,
                  account_id: accountId,
                  amount: 0,
                  sort_order: i,
                }));
                await supabase.from('budget_lines').insert(newLines);
                loadLines(templateId);
              }
              setAddModalOpen(false);
            }}
            onCancel={() => setAddModalOpen(false)}
          />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className={`${inputClass} pl-9`}
                  placeholder="Search categories by name, code, or group..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {availableAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {accounts.length === 0
                  ? 'No chart of accounts categories available.'
                  : 'All categories have been added to this template.'}
              </p>
            ) : (
              <div className="max-h-[400px] space-y-1 overflow-y-auto">
                {Object.entries(
                  availableAccounts.reduce<Record<string, ChartAccount[]>>((acc, acct) => {
                    if (!acc[acct.group]) acc[acct.group] = [];
                    acc[acct.group].push(acct);
                    return acc;
                  }, {})
                ).map(([group, accts]) => {
                  const isCollapsed = collapsedGroups.has(group);
                  return (
                    <div key={group}>
                      <button
                        onClick={() => toggleGroup(group)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                        {group}
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                          {accts.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="ml-6 space-y-0.5">
                          {accts.map((acct) => {
                            const isSelected = selectedAccountIds.has(acct.id);
                            return (
                              <label
                                key={acct.id}
                                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                                  isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    setSelectedAccountIds((prev) => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(acct.id);
                                      else next.delete(acct.id);
                                      return next;
                                    });
                                  }}
                                />
                                <span className="font-mono text-xs text-slate-400">{acct.code}</span>
                                <span className="text-sm text-slate-700">{acct.name}</span>
                                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                                  acct.type === 'income'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {acct.type === 'income' ? 'Income' : 'Cost'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">
                {selectedAccountIds.size} categor{selectedAccountIds.size === 1 ? 'y' : 'ies'} selected
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    for (const accountId of selectedAccountIds) {
                      await addLine(accountId);
                    }
                    setSelectedAccountIds(new Set());
                    setAddModalOpen(false);
                  }}
                  disabled={selectedAccountIds.size === 0}
                >
                  <Plus className="h-4 w-4" /> Add {selectedAccountIds.size > 0 ? `(${selectedAccountIds.size})` : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NewTemplateForm({
  accounts,
  onCreate,
  onCancel,
}: {
  accounts: ChartAccount[];
  onCreate: (name: string, year: string, selectedAccountIds: Set<string>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const expenditureAccounts = accounts.filter((a) => a.type === 'expenditure');
  const filtered = expenditureAccounts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.includes(q) || a.group.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, ChartAccount[]>>((acc, acct) => {
    if (!acc[acct.group]) acc[acct.group] = [];
    acc[acct.group].push(acct);
    return acc;
  }, {});

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Template Name">
          <input
            type="text"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2025 Annual Budget"
            autoFocus
          />
        </FormField>
        <FormField label="Financial Year">
          <input
            type="text"
            className={inputClass}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2025/26"
          />
        </FormField>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Select Expenditure Categories from the Chart of Accounts
        </label>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className={`${inputClass} pl-9`}
            placeholder="Search categories by name, code, or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-1">
          {Object.entries(grouped).map(([group, accts]) => {
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                  {group}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {accts.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="ml-6 space-y-0.5">
                    {accts.map((acct) => {
                      const isSelected = selectedIds.has(acct.id);
                      return (
                        <label
                          key={acct.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                            isSelected ? 'bg-sky-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            checked={isSelected}
                            onChange={(e) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(acct.id);
                                else next.delete(acct.id);
                                return next;
                              });
                            }}
                          />
                          <span className="font-mono text-xs text-slate-400">{acct.code}</span>
                          <span className="text-sm text-slate-700">{acct.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm text-slate-500">
          {selectedIds.size} expenditure categor{selectedIds.size === 1 ? 'y' : 'ies'} selected
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() => onCreate(name, year, selectedIds)}
            disabled={!name.trim() || !year.trim()}
          >
            <Save className="h-4 w-4" /> Create Template
          </Button>
        </div>
      </div>
    </div>
  );
}
