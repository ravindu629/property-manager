import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Save, Pencil, Upload, FileText, ExternalLink, Trash2, UserPlus, Mail, Phone, User, Building2, Plus, X, MapPin, Hash, MessageSquare, Send, FileSpreadsheet, Eye, Clock, UserCircle, ChevronDown, ChevronRight, Calendar, Clock3, FileCheck, Link2, Home, Search, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit, UnitOwner, CommunicationEntry, Template, Document } from '@/lib/types';
import { titleCase } from '@/lib/format';
import { Button, FormField, inputClass, selectClass, Modal } from '@/components/Modal';

const BUILDING_OPTIONS = [
  'F4-11 Esplanade',
  'West Point',
  'F14-17 & F19-21 & F2-3 Old Shipyard Centre East Wing',
  'F1-4 The Parade Old Shipyard Centre East Wing',
  'F6-13 Old Shipyard Centre',
  'F1-5 & F24-31 Old Shipyard Centre West Wing',
  'F1-3 Esplanade',
  'F1-17 Kingfisher Court',
  'F1-24 Heron Court',
  'F1-2 The Lodge',
];

type OwnerFormState = {
  owner_type: 'person' | 'company';
  first_name: string;
  last_name: string;
  telephone: string;
  email: string;
  company_number: string;
  registered_office_address: string;
  correspondence_address: string;
  telephones: string[];
  emails: string[];
};

type FormState = {
  unit_name: string;
  type: 'flat' | 'house' | 'maisonette' | 'commercial',
  use: string;
  site_name: string;
  assignment_type: 'building' | 'standalone';
  building_name: string;
  place: string;
  county: string;
  postcode: string;
  title_reference: string;
  title_register_path: string;
  title_plan_path: string;
  lease_path: string;
  lease_term_years: string;
  lease_start: string;
  lease_expiry: string;
  demised_garage: boolean;
  garage_number: string;
};

function emptyForm(): FormState {
  return {
    unit_name: '', type: 'flat', use: 'residential', site_name: '', assignment_type: 'standalone', building_name: '',
    place: '', county: '', postcode: '',
    title_reference: '', title_register_path: '', title_plan_path: '', lease_path: '', lease_term_years: '', lease_start: '', lease_expiry: '',
    demised_garage: false, garage_number: '',
  };
}

function unitToForm(u: Unit): FormState {
  return {
    unit_name: u.unit_name ?? '',
    type: u.type,
    use: u.use,
    site_name: u.site_name ?? '',
    assignment_type: (u.assignment_type === 'building' ? 'building' : 'standalone') as 'building' | 'standalone',
    building_name: u.building_name ?? '',
    place: u.place ?? '',
    county: u.county ?? '',
    postcode: u.postcode ?? '',
    title_reference: u.title_reference ?? '',
    title_register_path: u.title_register_path ?? '',
    title_plan_path: u.title_plan_path ?? '',
    lease_path: u.lease_path ?? '',
    lease_term_years: u.lease_term_years?.toString() ?? '',
    lease_start: u.lease_start ?? '',
    lease_expiry: u.lease_expiry ?? '',
    demised_garage: u.demised_garage ?? false,
    garage_number: u.garage_number?.toString() ?? '',
  };
}

export function UnitDetail({
  unitId,
  onBack,
}: {
  unitId: string;
  onBack: () => void;
}) {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [owners, setOwners] = useState<UnitOwner[]>([]);
  const [ownerModal, setOwnerModal] = useState<{ open: boolean; editing: UnitOwner | null }>({ open: false, editing: null });
  const [ownerForm, setOwnerForm] = useState<OwnerFormState>({
    owner_type: 'person', first_name: '', last_name: '', telephone: '', email: '',
    company_number: '', registered_office_address: '', correspondence_address: '',
    telephones: [''], emails: [''],
  });
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ledger, setLedger] = useState<CommunicationEntry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [commModal, setCommModal] = useState(false);
  const [commStep, setCommStep] = useState<'mode' | 'compose'>('mode');
  const [commModes, setCommModes] = useState<Set<'email' | 'letter' | 'text'>>(new Set());
  const [commTemplate, setCommTemplate] = useState<string>('');
  const [commContent, setCommContent] = useState('');
  const [commDocName, setCommDocName] = useState('');
  const [commSending, setCommSending] = useState(false);
  const [viewEntry, setViewEntry] = useState<CommunicationEntry | null>(null);
  const [titleDocs, setTitleDocs] = useState<Document[]>([]);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [refRevealed, setRefRevealed] = useState(false);
  const [ownershipRefRevealed, setOwnershipRefRevealed] = useState(false);
  const [addDocModal, setAddDocModal] = useState(false);
  const [addDocType, setAddDocType] = useState('');
  const [docUploading, setDocUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [unitId]);

  async function loadData() {
    const { data } = await supabase.from('units').select('*').eq('id', unitId).maybeSingle();
    if (data) {
      const u = data as Unit;
      setUnit(u);
      setForm(unitToForm(u));
      const { data: ownerData } = await supabase
        .from('unit_owners')
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: true });
      setOwners((ownerData as UnitOwner[]) ?? []);
      const { data: ledgerData } = await supabase
        .from('communication_ledger')
        .select('*')
        .eq('unit_id', unitId)
        .order('sent_at', { ascending: false });
      setLedger((ledgerData as CommunicationEntry[]) ?? []);
      const { data: tmplData } = await supabase
        .from('templates')
        .select('*')
        .order('name', { ascending: true });
      setTemplates((tmplData as Template[]) ?? []);
      const { data: titleDocData } = await supabase
        .from('documents')
        .select('*')
        .eq('unit_id', unitId)
        .not('doc_type', 'is', null)
        .order('created_at', { ascending: true });
      setTitleDocs((titleDocData as Document[]) ?? []);
    }
    setLoading(false);
  }

  function openAddOwner() {
    setOwnerForm({
      owner_type: 'person', first_name: '', last_name: '', telephone: '', email: '',
      company_number: '', registered_office_address: '', correspondence_address: '',
      telephones: [''], emails: [''],
    });
    setOwnerModal({ open: true, editing: null });
  }

  function openEditOwner(o: UnitOwner) {
    setOwnerForm({
      owner_type: o.owner_type,
      first_name: o.first_name,
      last_name: o.last_name ?? '',
      telephone: o.telephone ?? '',
      email: o.email ?? '',
      company_number: o.company_number ?? '',
      registered_office_address: o.registered_office_address ?? '',
      correspondence_address: o.correspondence_address ?? '',
      telephones: o.telephones?.length ? [...o.telephones] : [''],
      emails: o.emails?.length ? [...o.emails] : [''],
    });
    setOwnerModal({ open: true, editing: o });
  }

  async function handleSaveOwner() {
    const isCompany = ownerForm.owner_type === 'company';
    if (isCompany) {
      if (!ownerForm.first_name.trim()) return;
    } else {
      if (!ownerForm.first_name.trim() || !ownerForm.last_name.trim()) return;
    }
    setOwnerSaving(true);
    const dbPayload = isCompany
      ? {
          owner_type: 'company' as const,
          first_name: ownerForm.first_name.trim(),
          last_name: '',
          telephone: null,
          email: null,
          company_number: ownerForm.company_number.trim() || null,
          registered_office_address: ownerForm.registered_office_address.trim() || null,
          correspondence_address: ownerForm.correspondence_address.trim() || null,
          telephones: ownerForm.telephones.map((t) => t.trim()).filter(Boolean),
          emails: ownerForm.emails.map((e) => e.trim()).filter(Boolean),
        }
      : {
          owner_type: 'person' as const,
          first_name: ownerForm.first_name.trim(),
          last_name: ownerForm.last_name.trim(),
          telephone: ownerForm.telephone || null,
          email: ownerForm.email || null,
          company_number: null,
          registered_office_address: null,
          correspondence_address: null,
          telephones: null,
          emails: null,
        };
    if (ownerModal.editing) {
      const { error } = await supabase.from('unit_owners').update(dbPayload).eq('id', ownerModal.editing.id);
      if (!error) {
        setOwners((prev) => prev.map((o) => o.id === ownerModal.editing!.id ? { ...o, ...dbPayload } : o));
      }
    } else {
      const { data, error } = await supabase.from('unit_owners').insert({
        unit_id: unitId,
        ...dbPayload,
      }).select().single();
      if (!error && data) {
        setOwners((prev) => [...prev, data as UnitOwner]);
      }
    }
    setOwnerSaving(false);
    setOwnerModal({ open: false, editing: null });
  }

  async function handleDeleteOwner(o: UnitOwner) {
    const { error } = await supabase.from('unit_owners').delete().eq('id', o.id);
    if (!error) {
      setOwners((prev) => prev.filter((x) => x.id !== o.id));
    }
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      unit_name: form.unit_name || null,
      type: form.type,
      use: form.use,
      site_name: form.site_name || null,
      assignment_type: form.assignment_type,
      building_name: form.assignment_type === 'building' ? (form.building_name || null) : null,
      place: form.place || null,
      county: form.county || null,
      postcode: form.postcode || null,
      title_reference: form.title_reference || null,
      title_register_path: form.title_register_path || null,
      title_plan_path: form.title_plan_path || null,
      lease_path: form.lease_path || null,
      lease_term_years: form.lease_term_years ? parseInt(form.lease_term_years, 10) : null,
      lease_start: form.lease_start || null,
      lease_expiry: form.lease_expiry || null,
      demised_garage: form.demised_garage,
      garage_number: form.demised_garage && form.garage_number ? parseInt(form.garage_number, 10) : null,
    };
    const { error } = await supabase.from('units').update(payload).eq('id', unitId);
    setSaving(false);
    if (!error) {
      setEditing(false);
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Unit not found.
      </div>
    );
  }

  const v = editing ? form : unitToForm(unit);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const fullUnitName = [unit.unit_name, unit.building_name].filter(Boolean).join(' ') || unit.unit_ref;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Units
      </button>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {fullUnitName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <Button onClick={handleSave} variant={saving ? 'secondary' : 'primary'}>
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button onClick={() => { setForm(unitToForm(unit)); setEditing(true); }}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Unit Information */}
        <Section title="Unit Information">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Unit Name" view={fullUnitName} editing={editing}>
              <input type="text" className={inputClass} value={form.unit_name}
                onChange={(e) => set('unit_name', e.target.value)} placeholder="e.g. Flat 1" />
            </Field>
            <Field label="Type" view={titleCase(v.type)} editing={editing}>
              <select className={selectClass} value={form.type}
                onChange={(e) => set('type', e.target.value as string)}>
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
            </Field>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <label className="block text-sm font-medium text-slate-700">Unit Reference</label>
                <button
                  onClick={() => setRefRevealed(!refRevealed)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title={refRevealed ? 'Hide reference' : 'Reveal reference'}
                >
                  <Plus className={`h-3.5 w-3.5 transition-transform ${refRevealed ? 'rotate-45' : ''}`} />
                </button>
              </div>
              {editing ? (
                <input type="text" className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-400`} value={unit.unit_ref ?? ''}
                  disabled placeholder="Auto-generated" />
              ) : refRevealed ? (
                <p className="mt-0.5 font-mono text-sm text-slate-700">{unit.unit_ref ?? '—'}</p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400">Hidden</p>
              )}
            </div>
            <Field label="Use" view={titleCase(v.use)} editing={editing}>
              <select className={selectClass} value={form.use}
                onChange={(e) => set('use', e.target.value)}>
                {['residential', 'commercial'].map((u) => (
                  <option key={u} value={u}>{titleCase(u)}</option>
                ))}
              </select>
            </Field>
            <Field label="Assignment" view={v.assignment_type === 'building' ? (v.building_name || '—') : 'Standalone'} editing={editing}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set('assignment_type', 'building')}
                  className={form.assignment_type === 'building' ? 'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-500 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors' : 'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50'}
                >
                  <Building2 className="h-4 w-4" /> Building
                </button>
                <button
                  type="button"
                  onClick={() => { set('assignment_type', 'standalone'); set('building_name', ''); }}
                  className={form.assignment_type === 'standalone' ? 'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-500 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition-colors' : 'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50'}
                >
                  <Home className="h-4 w-4" /> Standalone
                </button>
              </div>
            </Field>
            {editing && form.assignment_type === 'building' && (
              <FormField label="Building Name">
                <select
                  className={selectClass}
                  value={form.building_name}
                  onChange={(e) => set('building_name', e.target.value)}
                >
                  <option value="">Select building...</option>
                  {BUILDING_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </FormField>
            )}
          </div>

          {/* Demised Garage */}
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Demised Garage</h4>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { set('demised_garage', true); }}
                    className={`flex items-center justify-center rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${form.demised_garage ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => { set('demised_garage', false); set('garage_number', ''); }}
                    className={`flex items-center justify-center rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${!form.demised_garage ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    No
                  </button>
                </div>
              ) : (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${unit.demised_garage ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {unit.demised_garage ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            {(editing ? form.demised_garage : unit.demised_garage) && (
              <div className="mt-3">
                {editing ? (
                  <SearchableGarageSelect
                    value={form.garage_number}
                    onChange={(v) => set('garage_number', v)}
                  />
                ) : (
                  <p className="text-sm text-slate-700">
                    Garage {unit.garage_number}
                  </p>
                )}
                {(editing ? form.garage_number : unit.garage_number) && (() => {
                  const garageNum = editing ? parseInt(form.garage_number, 10) : unit.garage_number;
                  const blockName = garageBlockLabel(garageNum);
                  if (!blockName) return null;
                  return (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                      <span className="text-xs font-medium text-sky-700">Garage Block</span>
                      <span className="text-sm font-semibold text-slate-800">{blockName}</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Section>

        {/* Address */}
        <Section title="Address">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Site Name (optional)" view={v.site_name || '—'} editing={editing}>
              <input type="text" className={inputClass} value={form.site_name}
                onChange={(e) => set('site_name', e.target.value)} placeholder="e.g. Old Shipyard" />
            </Field>
            <Field label="Unit" view={fullUnitName} editing={editing}>
              <input type="text" className={inputClass} value={form.unit_name}
                onChange={(e) => set('unit_name', e.target.value)} placeholder="e.g. Flat 1" />
            </Field>
            <Field label="Place (required)" view={v.place || '—'} editing={editing}>
              <input type="text" className={inputClass} value={form.place}
                onChange={(e) => set('place', e.target.value)} placeholder="e.g. West Bay" />
            </Field>
            <Field label="County (required)" view={v.county || '—'} editing={editing}>
              <input type="text" className={inputClass} value={form.county}
                onChange={(e) => set('county', e.target.value)} placeholder="e.g. Dorset" />
            </Field>
            <Field label="Postcode (required)" view={v.postcode || '—'} editing={editing}>
              <input type="text" className={inputClass} value={form.postcode}
                onChange={(e) => set('postcode', e.target.value)} placeholder="e.g. DT6 4HQ" />
            </Field>
          </div>
        </Section>

        {/* Ownership */}
        <Section title="Ownership">
          {/* Ownership reference */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <label className="block text-sm font-medium text-slate-700">Ownership Reference</label>
              <button
                onClick={() => setOwnershipRefRevealed(!ownershipRefRevealed)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title={ownershipRefRevealed ? 'Hide reference' : 'Reveal reference'}
              >
                <Plus className={`h-3.5 w-3.5 transition-transform ${ownershipRefRevealed ? 'rotate-45' : ''}`} />
              </button>
            </div>
            {ownershipRefRevealed ? (
              <p className="mt-0.5 font-mono text-sm text-slate-700">{unit.ownership_ref ?? '—'}</p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-400">Hidden</p>
            )}
          </div>

          {/* Owners list */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">Owners</h4>
              <button
                onClick={openAddOwner}
                className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
              >
                <UserPlus className="h-4 w-4" /> Add Owner
              </button>
            </div>
            {owners.length === 0 ? (
              <p className="text-sm text-slate-400">No owners added yet.</p>
            ) : (
              <div className="space-y-2">
                {owners.map((o) => {
                  const isCompany = o.owner_type === 'company';
                  const displayName = isCompany ? o.first_name : `${o.first_name} ${o.last_name}`.trim();
                  const phoneList = isCompany ? (o.telephones ?? []) : (o.telephone ? [o.telephone] : []);
                  const emailList = isCompany ? (o.emails ?? []) : (o.email ? [o.email] : []);
                  return (
                  <div key={o.id} className="flex items-start justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCompany ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        {isCompany ? <Building2 className="h-4 w-4" /> : <span className="text-sm font-semibold">{o.first_name.charAt(0)}{(o.last_name ?? '').charAt(0)}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{displayName}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isCompany ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                            {isCompany ? 'Company' : 'Person'}
                          </span>
                        </div>
                        {isCompany && o.company_number && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Hash className="h-3 w-3" /> {o.company_number}
                          </p>
                        )}
                        {isCompany && o.registered_office_address && (
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> <span>Registered: {o.registered_office_address}</span>
                          </p>
                        )}
                        {isCompany && o.correspondence_address && (
                          <p className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> <span>Correspondence: {o.correspondence_address}</span>
                          </p>
                        )}
                        {phoneList.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                            {phoneList.map((p, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3" /> {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {emailList.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                            {emailList.map((em, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="h-3 w-3" /> {em}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEditOwner(o)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOwner(o)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

        {/* Title */}
        <Section title="Title">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title Number" view={v.title_reference || '—'} editing={editing}>
              <input type="text" className={inputClass} value={form.title_reference}
                onChange={(e) => set('title_reference', e.target.value)}
                placeholder="Auto-extracted from Title Register" />
            </Field>
            <Field label="Lease Commencement Date" view={unit.lease_start ? new Date(unit.lease_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} editing={editing}>
              <input type="date" className={inputClass} value={form.lease_start ?? ''}
                onChange={(e) => set('lease_start', e.target.value)} />
            </Field>
            <Field label="Lease Term" view={v.lease_term_years ? `${v.lease_term_years} years` : '—'} editing={editing}>
              <input type="number" className={inputClass} value={form.lease_term_years}
                onChange={(e) => set('lease_term_years', e.target.value)}
                placeholder="e.g. 125" min="1" />
            </Field>
            <Field label="Lease Expiry Date" view={unit.lease_expiry ? new Date(unit.lease_expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} editing={editing}>
              <input type="date" className={inputClass} value={form.lease_expiry ?? ''}
                onChange={(e) => set('lease_expiry', e.target.value)} />
            </Field>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Unexpired Lease Term</label>
              {unit.lease_expiry ? (
                <p className="mt-0.5 text-sm font-medium text-slate-700">
                  {calcUnexpired(unit.lease_expiry)}
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Documents row */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <button
              onClick={() => setDocsExpanded(!docsExpanded)}
              className="flex w-full items-center justify-between text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
            >
              <span className="flex items-center gap-2">
                {docsExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                Documents
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">{titleDocs.length}</span>
              </span>
              <span
                onClick={(e) => { e.stopPropagation(); setAddDocType(''); setAddDocModal(true); }}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition-colors hover:bg-sky-100"
                title="Add document"
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>

            {docsExpanded && (
              <div className="mt-3 space-y-2">
                {titleDocs.length === 0 ? (
                  <p className="text-sm text-slate-400">No documents linked yet. Click + to add one.</p>
                ) : (
                  titleDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{doc.doc_type}</p>
                          <p className="text-xs text-slate-400">{doc.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-600"
                            title="Open document"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={async () => {
                            await supabase.from('documents').delete().eq('id', doc.id);
                            setTitleDocs((prev) => prev.filter((d) => d.id !== doc.id));
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          title="Unlink document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Communication Ledger */}
        <Section title="Communication Ledger">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Audit trail of all communications sent to the unit owners.</p>
            <button
              onClick={() => {
                setCommModes(new Set());
                setCommTemplate('');
                setCommContent('');
                setCommDocName('');
                setCommStep('mode');
                setCommModal(true);
              }}
              title="Create a new communication record"
              className="flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
            >
              <Plus className="h-4 w-4" /> New Communication
            </button>
          </div>
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm text-slate-400">No communications recorded yet.</p>
              <p className="text-xs text-slate-300">Click "New Communication" to create the first record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Document Name</th>
                    <th className="pb-2 pr-4">Date &amp; Time</th>
                    <th className="pb-2 pr-4">Sent By</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50">
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          entry.mode === 'email' ? 'bg-sky-50 text-sky-600' : entry.mode === 'letter' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {entry.mode === 'email' ? <Mail className="h-3 w-3" /> : entry.mode === 'letter' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                          {entry.mode === 'email' ? 'Email' : entry.mode === 'letter' ? 'Letter' : 'SMS'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-700">{entry.document_name}</td>
                      <td className="py-3 pr-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-300" />
                          {new Date(entry.sent_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <UserCircle className="h-3 w-3 text-slate-300" />
                          {entry.sent_by}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setViewEntry(entry)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          title="View content"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {/* Communication Modal */}
      <Modal open={commModal} onClose={() => setCommModal(false)} title="New Communication" size="lg">
        {commStep === 'mode' ? (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select communication mode</label>
              <p className="mb-3 text-xs text-slate-400">Letter and Email can be combined. SMS must be sent on its own due to format and delivery requirements.</p>
              <div className="grid grid-cols-3 gap-3">
                {(['email', 'letter', 'text'] as const).map((mode) => {
                  const Icon = mode === 'email' ? Mail : mode === 'letter' ? FileText : MessageSquare;
                  const selected = commModes.has(mode);
                  const isSmsLocked = mode === 'text' && (commModes.has('email') || commModes.has('letter'));
                  const isOtherLocked = mode !== 'text' && commModes.has('text');
                  const disabled = isSmsLocked || isOtherLocked;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const next = new Set(commModes);
                        if (next.has(mode)) next.delete(mode); else next.add(mode);
                        setCommModes(next);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-lg border px-4 py-4 text-sm font-medium transition-colors ${
                        selected
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : disabled
                            ? 'cursor-not-allowed border-slate-200 text-slate-300'
                            : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      {mode === 'email' ? 'Email' : mode === 'letter' ? 'Letter' : 'SMS'}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Select a template</label>
              <select
                className={selectClass}
                value={commTemplate}
                onChange={(e) => setCommTemplate(e.target.value)}
              >
                <option value="">— Blank (write your own) —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCommModal(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (commModes.size === 0) return;
                  const selectedTmpl = templates.find((t) => t.id === commTemplate);
                  if (selectedTmpl) {
                    setCommDocName(selectedTmpl.name);
                    setCommContent(applyTemplate(selectedTmpl.content ?? '', unit, owners));
                  } else {
                    setCommDocName('');
                    setCommContent('');
                  }
                  setCommStep('compose');
                }}
                disabled={commModes.size === 0}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[...commModes].map((mode) => (
                <span key={mode} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  mode === 'email' ? 'bg-sky-50 text-sky-600' : mode === 'letter' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {mode === 'email' ? <Mail className="h-3 w-3" /> : mode === 'letter' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  {mode === 'email' ? 'Email' : mode === 'letter' ? 'Letter' : 'SMS'}
                </span>
              ))}
            </div>
            <FormField label="Document Name">
              <input
                type="text"
                className={inputClass}
                value={commDocName}
                onChange={(e) => setCommDocName(e.target.value)}
                placeholder="e.g. First Credit Control Letter"
              />
            </FormField>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Content</label>
                {commTemplate && (
                  <span className="text-xs text-slate-400">Auto-populated from template — edit freely without affecting the master</span>
                )}
              </div>
              <textarea
                className={`${inputClass} min-h-[280px] resize-y font-mono text-xs leading-relaxed`}
                value={commContent}
                onChange={(e) => setCommContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCommStep('mode')}>Back</Button>
              <Button
                onClick={async () => {
                  if (!commDocName.trim() || !commContent.trim()) return;
                  setCommSending(true);
                  const modesToInsert = [...commModes];
                  const inserts = modesToInsert.map((mode) => ({
                    unit_id: unitId,
                    mode,
                    document_name: commDocName.trim(),
                    content: commContent,
                    sent_by: 'Property Manager',
                  }));
                  const { data, error } = await supabase
                    .from('communication_ledger')
                    .insert(inserts)
                    .select('*');
                  setCommSending(false);
                  if (!error && data) {
                    setLedger((prev) => [...(data as CommunicationEntry[]), ...prev]);
                  }
                  setCommModal(false);
                }}
                disabled={commSending || !commDocName.trim() || !commContent.trim()}
              >
                <Send className="h-4 w-4" /> {commSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Content Viewer Modal */}
      <Modal open={!!viewEntry} onClose={() => setViewEntry(null)} title={viewEntry?.document_name ?? 'Communication'} size="lg">
        {viewEntry && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                viewEntry.mode === 'email' ? 'bg-sky-50 text-sky-600' : viewEntry.mode === 'letter' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {viewEntry.mode === 'email' ? <Mail className="h-3 w-3" /> : viewEntry.mode === 'letter' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                {viewEntry.mode === 'email' ? 'Email' : viewEntry.mode === 'letter' ? 'Letter' : 'SMS'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {new Date(viewEntry.sent_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <UserCircle className="h-3 w-3" />
                {viewEntry.sent_by}
              </span>
            </div>
            <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm leading-relaxed text-slate-700">
              {viewEntry.content}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Document Modal */}
      <Modal open={addDocModal} onClose={() => setAddDocModal(false)} title="Add Legal Document" size="md">
        <div className="space-y-4">
          <FormField label="Document Type">
            <select
              className={selectClass}
              value={addDocType}
              onChange={(e) => setAddDocType(e.target.value)}
            >
              <option value="">— Select a document type —</option>
              {LEGAL_DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </FormField>
          {addDocType && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Document</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600">
                <Upload className="h-4 w-4" />
                <span>{docUploading ? 'Uploading...' : 'Click to upload file'}</span>
                <input type="file" className="hidden" disabled={docUploading} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !addDocType) return;
                  setDocUploading(true);
                  const ext = file.name.split('.').pop() ?? 'pdf';
                  const safeType = addDocType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const filePath = `${unitId}/${safeType}.${ext}`;
                  const { error: upErr } = await supabase.storage.from('unit-documents').upload(filePath, file, { upsert: true });
                  if (upErr) { setDocUploading(false); return; }
                  const { data: publicUrlData } = supabase.storage.from('unit-documents').getPublicUrl(filePath);
                  const { data: docData, error: dbErr } = await supabase.from('documents').insert({
                    title: addDocType,
                    category: 'legal',
                    file_url: publicUrlData.data.publicUrl,
                    file_type: ext,
                    unit_id: unitId,
                    doc_type: addDocType,
                  }).select('*').single();
                  setDocUploading(false);
                  if (!dbErr && docData) {
                    setTitleDocs((prev) => [...prev, docData as Document]);
                  }
                  setAddDocModal(false);
                }} />
              </label>
              <p className="mt-1.5 text-xs text-slate-400">The document will be stored in the Library and linked to this unit.</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddDocModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Owner Add/Edit Modal */}
      <Modal open={ownerModal.open} onClose={() => setOwnerModal({ open: false, editing: null })} title={ownerModal.editing ? 'Edit Owner' : 'Add Owner'} size="lg">
        <div className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Owner Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOwnerForm({ ...ownerForm, owner_type: 'person' })}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  ownerForm.owner_type === 'person'
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <User className="h-4 w-4" /> Person
              </button>
              <button
                type="button"
                onClick={() => setOwnerForm({ ...ownerForm, owner_type: 'company' })}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  ownerForm.owner_type === 'company'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-4 w-4" /> Company
              </button>
            </div>
          </div>

          {ownerForm.owner_type === 'company' ? (
            <>
              <FormField label="Company Name">
                <input type="text" className={inputClass} value={ownerForm.first_name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, first_name: e.target.value })} placeholder="e.g. Acme Retail Ltd" />
              </FormField>
              <FormField label="Company Number">
                <input type="text" className={inputClass} value={ownerForm.company_number}
                  onChange={(e) => setOwnerForm({ ...ownerForm, company_number: e.target.value })} placeholder="e.g. 12345678" />
              </FormField>
              <FormField label="Registered Office Address">
                <textarea className={`${inputClass} min-h-[80px] resize-y`} value={ownerForm.registered_office_address}
                  onChange={(e) => setOwnerForm({ ...ownerForm, registered_office_address: e.target.value })} placeholder="e.g. 123 High Street, London, SW1 1AA" />
              </FormField>
              <FormField label="Correspondence Address">
                <textarea className={`${inputClass} min-h-[80px] resize-y`} value={ownerForm.correspondence_address}
                  onChange={(e) => setOwnerForm({ ...ownerForm, correspondence_address: e.target.value })} placeholder="e.g. PO Box 456, London, SW1 1AA" />
              </FormField>

              {/* Multiple telephone numbers */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Telephone Numbers</label>
                <div className="space-y-2">
                  {ownerForm.telephones.map((tel, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="tel" className={inputClass} value={tel}
                        onChange={(e) => {
                          const next = [...ownerForm.telephones];
                          next[i] = e.target.value;
                          setOwnerForm({ ...ownerForm, telephones: next });
                        }}
                        placeholder="e.g. 020 7123 4567" />
                      {ownerForm.telephones.length > 1 && (
                        <button type="button" onClick={() => setOwnerForm({ ...ownerForm, telephones: ownerForm.telephones.filter((_, idx) => idx !== i) })}
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setOwnerForm({ ...ownerForm, telephones: [...ownerForm.telephones, ''] })}
                    className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700">
                    <Plus className="h-4 w-4" /> Add another telephone
                  </button>
                </div>
              </div>

              {/* Multiple email addresses */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Addresses</label>
                <div className="space-y-2">
                  {ownerForm.emails.map((em, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="email" className={inputClass} value={em}
                        onChange={(e) => {
                          const next = [...ownerForm.emails];
                          next[i] = e.target.value;
                          setOwnerForm({ ...ownerForm, emails: next });
                        }}
                        placeholder="e.g. accounts@acme.co.uk" />
                      {ownerForm.emails.length > 1 && (
                        <button type="button" onClick={() => setOwnerForm({ ...ownerForm, emails: ownerForm.emails.filter((_, idx) => idx !== i) })}
                          className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setOwnerForm({ ...ownerForm, emails: [...ownerForm.emails, ''] })}
                    className="flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700">
                    <Plus className="h-4 w-4" /> Add another email
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name">
                  <input type="text" className={inputClass} value={ownerForm.first_name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, first_name: e.target.value })} placeholder="e.g. John" />
                </FormField>
                <FormField label="Last Name">
                  <input type="text" className={inputClass} value={ownerForm.last_name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, last_name: e.target.value })} placeholder="e.g. Smith" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Telephone">
                  <input type="tel" className={inputClass} value={ownerForm.telephone}
                    onChange={(e) => setOwnerForm({ ...ownerForm, telephone: e.target.value })} placeholder="e.g. 07123 456789" />
                </FormField>
                <FormField label="Email">
                  <input type="email" className={inputClass} value={ownerForm.email}
                    onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })} placeholder="e.g. john@example.com" />
                </FormField>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOwnerModal({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={handleSaveOwner} variant={ownerSaving ? 'secondary' : 'primary'}>
              {ownerSaving ? 'Saving...' : ownerModal.editing ? 'Save Changes' : 'Add Owner'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const LEGAL_DOC_TYPES = [
  'Title Register',
  'Title Plan',
  'Lease',
  'Deed of Variation',
  'Licence to Alter',
  'Deed of Covenant',
  'Licence to Assign',
  'Transfer Deed (TR1 / TP1)',
  'Lease Extension',
  'Easements or Rights Granted',
  'Restrictive Covenant Documents',
  'Supplemental Lease Documents',
];

function SearchableGarageSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const GARAGES = Array.from({ length: 80 }, (_, i) => i + 1);
  const filtered = GARAGES.filter((n) => {
    if (!query.trim()) return true;
    return n.toString().startsWith(query.trim());
  });

  const selectedNum = value ? parseInt(value, 10) : null;

  function selectGarage(n: number) {
    onChange(n.toString());
    setOpen(false);
    setQuery('');
    setHighlight(0);
  }

  return (
    <FormField label="Garage Number">
      <div className="relative">
        <button
          type="button"
          onClick={() => { setOpen(!open); setQuery(''); }}
          className={`${inputClass} flex items-center justify-between text-left`}
        >
          <span className={selectedNum ? 'text-slate-800' : 'text-slate-400'}>
            {selectedNum ? `Garage ${selectedNum}` : 'Select garage...'}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filtered.length > 0) {
                      e.preventDefault();
                      selectGarage(filtered[highlight]);
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === 'Escape') {
                      setOpen(false);
                    }
                  }}
                  placeholder="Type garage number..."
                  className="w-full border-0 p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-slate-400">No garages match "{query}"</p>
                ) : (
                  filtered.map((n, i) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => selectGarage(n)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors ${
                        i === highlight ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{`Garage ${n}`}</span>
                      {selectedNum === n && <Check className="h-3.5 w-3.5 text-sky-600" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </FormField>
  );
}

function garageBlockLabel(garageNumber: number | null | undefined): string | null {
  if (!garageNumber || garageNumber < 1) return null;
  if (garageNumber <= 9) return '1-9';
  if (garageNumber <= 16) return '10-16';
  if (garageNumber <= 34) return '17-34';
  if (garageNumber <= 50) return '35-50';
  if (garageNumber <= 66) return '51-66';
  if (garageNumber <= 73) return '67-73';
  if (garageNumber <= 80) return '74-80';
  return null;
}

function calcUnexpired(expiry: string): string {
  const exp = new Date(expiry);
  const now = new Date();
  const ms = exp.getTime() - now.getTime();
  if (ms <= 0) return 'Expired';
  const days = Math.floor(ms / 86400000);
  const years = Math.floor(days / 365);
  const remDays = days % 365;
  if (years > 0 && remDays > 0) return `${years} years, ${remDays} days`;
  if (years > 0) return `${years} years`;
  return `${days} days`;
}

function applyTemplate(content: string, unit: Unit, owners: UnitOwner[]): string {
  const ownerNames = owners
    .map((o) => (o.owner_type === 'company' ? o.first_name : `${o.first_name} ${o.last_name}`.trim()))
    .join(', ') || 'The Owner(s)';
  const ownerEmails = owners
    .flatMap((o) => o.owner_type === 'company' ? (o.emails ?? []) : (o.email ? [o.email] : []))
    .join(', ') || '';
  const ownerPhones = owners
    .flatMap((o) => o.owner_type === 'company' ? (o.telephones ?? []) : (o.telephone ? [o.telephone] : []))
    .join(', ') || '';
  const addressParts = [
    unit.unit_name,
    unit.building_name,
    unit.site_name,
    unit.place,
    unit.county,
    unit.postcode,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ') || unit.address || '';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return content
    .replace(/\[Owner Name\]/g, ownerNames)
    .replace(/\[Owner Email\]/g, ownerEmails)
    .replace(/\[Owner Phone\]/g, ownerPhones)
    .replace(/\[Unit Ref\]/g, unit.unit_ref)
    .replace(/\[Unit Name\]/g, unit.unit_name ?? unit.unit_ref)
    .replace(/\[Unit Address\]/g, fullAddress)
    .replace(/\[Building Name\]/g, unit.building_name ?? '')
    .replace(/\[Site Name\]/g, unit.site_name ?? '')
    .replace(/\[Postcode\]/g, unit.postcode ?? '')
    .replace(/\[Date\]/g, today)
    .replace(/\[Today\]/g, today);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  view,
  editing,
  children,
}: {
  label: string;
  view: string;
  editing: boolean;
  children: ReactNode;
}) {
  return (
    <FormField label={label}>
      {editing ? children : <p className="mt-0.5 text-sm text-slate-700">{view}</p>}
    </FormField>
  );
}
