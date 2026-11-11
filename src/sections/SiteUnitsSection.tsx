import { useEffect, useState } from 'react';
import { Trash2, Plus, Search, Building2, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit } from '@/lib/types';
import { formatDate, titleCase } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/Badge';
import { Modal, FormField, inputClass, selectClass, Button } from '@/components/Modal';

const BUILDING_OPTIONS = [
  'F4-11 Esplanade',
  'West Point',
  'F14-17 & F19-21 & F2-3 Old Shipyard Centre East Wing',
  'F1-4 The Parade',
  'F6-13 Old Shipyard Centre',
  'F1-5 & F24-31 Old Shipyard Centre West Wing',
  'F1-3 Esplanade',
  'F1-17 Kingfisher Court',
  'F1-24 Heron Court',
  'F1-2 The Lodge',
];

export function SiteUnitsSection({
  onOpenUnit,
}: {
  onOpenUnit: (unitId: string) => void;
}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const [form, setForm] = useState({
    unit_ref: '',
    unit_name: '',
    type: 'flat',
    address_line_1: '',
    place: '',
    county: '',
    postcode: '',
    owner_name: '',
    lease_start: '',
    lease_expiry: '',
    tenure: 'leasehold',
    use: 'residential',
    assignment_type: 'standalone' as 'building' | 'standalone',
    building_name: '',
    ground_rent_annual: '',
    service_charge_annual: '',
    floor_area_sqm: '',
    bedrooms: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase.from('units').select('*').order('unit_ref');
    setUnits(data ?? []);
    setLoading(false);
  }

  async function handleAdd() {
    const payload = {
      unit_ref: form.unit_ref,
      unit_name: form.unit_name || null,
      type: form.type,
      address_line_1: form.address_line_1 || null,
      place: form.place || null,
      county: form.county || null,
      postcode: form.postcode || null,
      owner_name: form.owner_name || null,
      lease_start: form.lease_start || null,
      lease_expiry: form.lease_expiry || null,
      tenure: form.tenure,
      use: form.use,
      assignment_type: form.assignment_type,
      building_name: form.assignment_type === 'building' ? (form.building_name || null) : null,
      ground_rent_annual: parseFloat(form.ground_rent_annual) || 0,
      service_charge_annual: parseFloat(form.service_charge_annual) || 0,
      floor_area_sqm: form.floor_area_sqm ? parseFloat(form.floor_area_sqm) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      notes: form.notes || null,
    };
    const { error } = await supabase.from('units').insert(payload);
    if (!error) {
      setShowAdd(false);
      setForm({ unit_ref: '', unit_name: '', type: 'flat', address_line_1: '', place: '', county: '', postcode: '', owner_name: '', lease_start: '', lease_expiry: '', tenure: 'leasehold', use: 'residential', assignment_type: 'standalone', building_name: '', ground_rent_annual: '', service_charge_annual: '', floor_area_sqm: '', bedrooms: '', notes: '' });
      loadData();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('units').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    loadData();
  }

  const filtered = units.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.unit_ref.toLowerCase().includes(q) ||
      (u.unit_name ?? '').toLowerCase().includes(q) ||
      (u.owner_name ?? '').toLowerCase().includes(q) ||
      (u.address_line_1 ?? '').toLowerCase().includes(q) ||
      u.tenure.toLowerCase().includes(q) ||
      u.use.toLowerCase().includes(q)
    );
  });

  const columns: Column<Unit>[] = [
    {
      key: 'unit',
      header: 'Unit',
      colWidth: 'w-[16%]',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${['retail', 'office', 'industrial', 'storage'].includes(row.type) ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
            {row.type === 'house' ? 'H' : row.type === 'maisonette' ? 'M' : row.type === 'retail' ? 'R' : row.type === 'office' ? 'O' : row.type === 'industrial' ? 'I' : row.type === 'storage' ? 'S' : 'F'}
          </div>
          <span className="truncate font-medium text-slate-900">{row.unit_name || row.unit_ref}</span>
        </div>
      ),
    },
    {
      key: 'assignment',
      header: 'Assignment',
      colWidth: 'w-[16%]',
      render: (row) =>
        row.assignment_type === 'building' ? (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-sky-500" />
            <span className="truncate text-slate-700">{row.building_name ?? '—'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-500">Standalone</span>
          </div>
        ),
    },
    {
      key: 'ownership',
      header: 'Ownership',
      colWidth: 'w-[15%]',
      render: (row) => <span className="truncate text-slate-700">{row.owner_name ?? '—'}</span>,
    },
    {
      key: 'ownership_start',
      header: 'Ownership Start',
      colWidth: 'w-[13%]',
      render: (row) => <span className="text-slate-600">{formatDate(row.lease_start)}</span>,
    },
    {
      key: 'tenure',
      header: 'Tenure',
      colWidth: 'w-[10%]',
      render: (row) => <Badge variant="info">{titleCase(row.tenure)}</Badge>,
    },
    {
      key: 'use',
      header: 'Use',
      colWidth: 'w-[10%]',
      render: (row) => <Badge variant={row.use === 'residential' ? 'success' : 'warning'}>{titleCase(row.use)}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      colWidth: 'w-[18%]',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenUnit(row.id);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
            title="Open"
          >
            <span>Open</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Units"
        description={`${units.length} units on site`}
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Unit
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="All Units"
          subtitle={`${filtered.length} ${filtered.length === 1 ? 'unit' : 'units'}`}
          action={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          }
        />
        <DataTable
          columns={columns}
          rows={filtered}
          loading={loading}
          emptyMessage="No units found. Try adding one."
        />
      </Card>

      {/* Add Unit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Unit" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Unit Reference">
              <input
                type="text"
                className={inputClass}
                value={form.unit_ref}
                onChange={(e) => setForm({ ...form, unit_ref: e.target.value })}
                placeholder="System-generated unique reference"
              />
            </FormField>
            <FormField label="Unit Name">
              <input
                type="text"
                className={inputClass}
                value={form.unit_name}
                onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                placeholder="e.g. Flat 1"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assignment">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, assignment_type: 'building', building_name: '' })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    form.assignment_type === 'building'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Building
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, assignment_type: 'standalone', building_name: '' })}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    form.assignment_type === 'standalone'
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Standalone
                </button>
              </div>
            </FormField>
            <FormField label="Building">
              <select
                className={selectClass}
                disabled={form.assignment_type !== 'building'}
                value={form.building_name}
                onChange={(e) => setForm({ ...form, building_name: e.target.value })}
              >
                <option value="">Select building...</option>
                {BUILDING_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <select
                className={selectClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as string })}
              >
                {form.use === 'residential' ? (
                  <>
                    <option value="flat">Flat</option>
                    <option value="house">House</option>
                    <option value="maisonette">Maisonette</option>
                  </>
                ) : (
                  <>
                    <option value="retail">Retail</option>
                    <option value="office">Office</option>
                    <option value="industrial">Industrial</option>
                    <option value="storage">Storage</option>
                  </>
                )}
              </select>
            </FormField>
            <FormField label="Owner / Occupier">
              <input
                type="text"
                className={inputClass}
                value={form.owner_name}
                onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Address Line 1">
              <input
                type="text"
                className={inputClass}
                value={form.address_line_1}
                onChange={(e) => setForm({ ...form, address_line_1: e.target.value })}
              />
            </FormField>
            <FormField label="Place">
              <input
                type="text"
                className={inputClass}
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="County">
              <input
                type="text"
                className={inputClass}
                value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
              />
            </FormField>
            <FormField label="Postcode">
              <input
                type="text"
                className={inputClass}
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ownership Start">
              <input
                type="date"
                className={inputClass}
                value={form.lease_start}
                onChange={(e) => setForm({ ...form, lease_start: e.target.value })}
              />
            </FormField>
            <FormField label="Lease Expiry">
              <input
                type="date"
                className={inputClass}
                value={form.lease_expiry}
                onChange={(e) => setForm({ ...form, lease_expiry: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tenure">
              <select
                className={selectClass}
                value={form.tenure}
                onChange={(e) => setForm({ ...form, tenure: e.target.value })}
              >
                {['leasehold', 'freehold', 'share_of_freehold', 'commonhold'].map((t) => (
                  <option key={t} value={t}>{titleCase(t)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Use">
              <select
                className={selectClass}
                value={form.use}
                onChange={(e) => setForm({ ...form, use: e.target.value })}
              >
                {['residential', 'commercial'].map((u) => (
                  <option key={u} value={u}>{titleCase(u)}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ground Rent (£/yr)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.ground_rent_annual}
                onChange={(e) => setForm({ ...form, ground_rent_annual: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Service Charge (£/yr)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.service_charge_annual}
                onChange={(e) => setForm({ ...form, service_charge_annual: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Floor Area (sqm)">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.floor_area_sqm}
                onChange={(e) => setForm({ ...form, floor_area_sqm: e.target.value })}
              />
            </FormField>
            <FormField label="Bedrooms">
              <input
                type="number"
                className={inputClass}
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Unit</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Unit" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-700">
                Are you sure you want to delete <span className="font-semibold">{deleteTarget?.unit_name || deleteTarget?.unit_ref}</span>?
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
