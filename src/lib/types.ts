export interface Unit {
  id: string;
  unit_ref: string;
  unit_name: string | null;
  type: string;
  address: string | null;
  owner_name: string | null;
  lease_start: string | null;
  lease_expiry: string | null;
  ground_rent_annual: number;
  service_charge_annual: number;
  floor_area_sqm: number | null;
  bedrooms: number | null;
  tenure: string;
  use: string;
  site_name: string | null;
  building_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  place: string | null;
  area: string | null;
  county: string | null;
  postcode: string | null;
  title_reference: string | null;
  title_register_path: string | null;
  title_plan_path: string | null;
  lease_path: string | null;
  lease_term_years: number | null;
  ownership_ref: string | null;
  assignment_type: string | null;
  demised_garage: boolean | null;
  garage_number: number | null;
  notes: string | null;
  created_at: string;
}

export interface UnitOwner {
  id: string;
  unit_id: string;
  owner_type: 'person' | 'company';
  first_name: string;
  last_name: string;
  telephone: string | null;
  email: string | null;
  company_number: string | null;
  registered_office_address: string | null;
  correspondence_address: string | null;
  telephones: string[] | null;
  emails: string[] | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  unit_id: string | null;
  category: string;
  type: 'income' | 'expenditure';
  amount: number;
  transaction_date: string;
  description: string | null;
  status: string;
  party: string | null;
  reference: string | null;
  doc_url: string | null;
  created_at: string;
  unit?: Pick<Unit, 'unit_ref' | 'owner_name'> | null;
  account?: ChartAccount | null;
}

export interface Asset {
  id: string;
  name: string;
  location: string | null;
  category: string;
  installed_date: string | null;
  expected_life_years: number | null;
  condition: string;
  last_inspected: string | null;
  next_inspection_due: string | null;
  replacement_cost: number;
  notes: string | null;
  created_at: string;
}

export interface Repair {
  id: string;
  unit_id: string | null;
  asset_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  contractor: string | null;
  estimated_cost: number;
  actual_cost: number;
  reported_date: string;
  completed_date: string | null;
  notes: string | null;
  created_at: string;
  unit?: Pick<Unit, 'unit_ref'> | null;
  asset?: Pick<Asset, 'name'> | null;
}

export interface InsurancePolicy {
  id: string;
  policy_type: string;
  provider: string | null;
  policy_number: string | null;
  start_date: string | null;
  end_date: string | null;
  premium_annual: number;
  excess: number;
  sum_insured: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  transfer_date: string;
  reference: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface S20Project {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  estimated_cost: number;
  actual_cost: number;
  start_date: string | null;
  end_date: string | null;
  consultation_start: string | null;
  consultation_end: string | null;
  contractor: string | null;
  notes: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
  file_type: string | null;
  date_added: string;
  description: string | null;
  tags: string[] | null;
  unit_id: string | null;
  doc_type: string | null;
  created_at: string;
}

export interface CommunicationEntry {
  id: string;
  unit_id: string;
  mode: 'email' | 'letter' | 'text';
  document_name: string;
  content: string;
  sent_by: string;
  sent_at: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  content: string | null;
  last_updated: string;
  created_at: string;
}

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: 'income' | 'expenditure';
  group: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  financial_year: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  id: string;
  budget_template_id: string;
  account_id: string;
  amount: number;
  notes: string | null;
  sort_order: number;
  created_at: string;
  account?: ChartAccount;
}

export interface BudgetSchedule {
  id: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface UnitScheduleApportionment {
  id: string;
  unit_id: string;
  schedule_id: string;
  contribution: number;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  sort_code: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fund {
  id: string;
  name: string;
  building_name: string | null;
  fund_type: string;
  scope: string;
  unit_id: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  notes: string | null;
  bank_account_id: string | null;
  created_at: string;
  updated_at: string;
  unit?: { unit_ref: string } | null;
}

export interface AccountingRule {
  id: string;
  account_id: string;
  fund_id: string | null;
  bank_account_id: string | null;
  treatment: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account?: ChartAccount | null;
  fund?: { id: string; name: string } | null;
  bank_account?: { id: string; account_name: string } | null;
}

export interface SiteSettings {
  id: number;
  site_name: string;
  site_address: string | null;
  management_company: string | null;
  management_agent: string | null;
  total_units: number;
  financial_year_start: string;
  service_charge_year_start: string | null;
  service_charge_year_end: string | null;
  demand_frequency: number | null;
  demand_date_1: string | null;
  demand_date_2: string | null;
  demand_date_3: string | null;
  demand_date_4: string | null;
  demand_treatment: string | null;
  accounting_treatment: string | null;
  reserve_fund_balance: number;
  sinking_fund_balance: number;
  created_at: string;
}
