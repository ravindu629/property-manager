import { useEffect, useState, useCallback } from 'react';
import { TableProperties, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BudgetSchedule, UnitScheduleApportionment } from '@/lib/types';

const ORDINALS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth',
  'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
];

function scheduleLabel(index: number): string {
  if (index < ORDINALS.length) return `${ORDINALS[index]} Schedule`;
  return `Schedule ${index + 1}`;
}

interface UnitRow {
  unit_ref: string;
  unit_name: string | null;
}

interface ApportionmentsSectionProps {
  refreshKey: number;
}

export function ApportionmentsSection({ refreshKey }: ApportionmentsSectionProps) {
  const [schedules, setSchedules] = useState<BudgetSchedule[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [apportionments, setApportionments] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [savedCell, setSavedCell] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: schedData }, { data: unitData }, { data: apportData }] = await Promise.all([
        supabase.from('budget_schedules').select('*').order('sort_order', { ascending: true }),
        supabase.from('units').select('unit_ref, unit_name').order('unit_name', { ascending: true, nullsFirst: false }),
        supabase.from('unit_schedule_apportionments').select('*'),
      ]);

      const scheds = (schedData ?? []) as BudgetSchedule[];
      const urows = (unitData ?? []) as UnitRow[];
      const apports = (apportData ?? []) as UnitScheduleApportionment[];

      setSchedules(scheds);
      setUnits(urows);

      const grid: Record<string, Record<string, string>> = {};
      for (const u of urows) {
        grid[u.unit_ref] = {};
        for (const s of scheds) {
          const existing = apports.find((a) => a.unit_id === u.unit_ref && a.schedule_id === s.id);
          grid[u.unit_ref][s.id] = existing ? String(existing.contribution) : '';
        }
      }
      setApportionments(grid);
      setLoading(false);
    })();
  }, [refreshKey]);

  const handleCellChange = (unitRef: string, scheduleId: string, value: string) => {
    setApportionments((prev) => ({
      ...prev,
      [unitRef]: { ...prev[unitRef], [scheduleId]: value },
    }));
  };

  const handleCellSave = useCallback(async (unitRef: string, scheduleId: string) => {
    const value = apportionments[unitRef]?.[scheduleId];
    const numericValue = value ? parseFloat(value) : 0;

    const { data: existing } = await supabase
      .from('unit_schedule_apportionments')
      .select('id')
      .eq('unit_id', unitRef)
      .eq('schedule_id', scheduleId)
      .maybeSingle<UnitScheduleApportionment>();

    if (existing) {
      await supabase
        .from('unit_schedule_apportionments')
        .update({ contribution: numericValue })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('unit_schedule_apportionments')
        .insert({ unit_id: unitRef, schedule_id: scheduleId, contribution: numericValue });
    }

    const cellKey = `${unitRef}-${scheduleId}`;
    setSavedCell(cellKey);
    setTimeout(() => setSavedCell((prev) => (prev === cellKey ? null : prev)), 1500);
  }, [apportionments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Apportionments</h3>
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">
            Add at least one budget schedule above before setting apportionments.
          </p>
        </div>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900">Apportionments</h3>
        </div>
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 py-10 text-center">
          <p className="text-sm text-slate-400">
            No units found. Add units in the Site section before setting apportionments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <TableProperties className="h-5 w-5 text-sky-600" />
        <div>
          <h3 className="text-base font-semibold text-slate-900">Apportionments</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Enter each unit's contribution (%) toward each schedule.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left font-semibold text-slate-700">
                Units
              </th>
              {schedules.map((sched, i) => (
                <th
                  key={sched.id}
                  className="whitespace-nowrap px-3 py-2.5 text-center font-semibold text-slate-700"
                >
                  {scheduleLabel(i)}
                  {sched.description && (
                    <span className="block text-xs font-normal text-slate-400">
                      {sched.description}
                    </span>
                  )}
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-white px-3 py-2.5 text-right font-semibold text-slate-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const rowTotal = schedules.reduce((sum, s) => {
                const val = parseFloat(apportionments[unit.unit_ref]?.[s.id] ?? '');
                return sum + (isNaN(val) ? 0 : val);
              }, 0);

              return (
                <tr key={unit.unit_ref} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-900">
                    {unit.unit_name ?? unit.unit_ref}
                    {unit.unit_name && (
                      <span className="ml-1.5 text-xs text-slate-400">({unit.unit_ref})</span>
                    )}
                  </td>
                  {schedules.map((sched) => {
                    const cellKey = `${unit.unit_ref}-${sched.id}`;
                    const isSaved = savedCell === cellKey;
                    return (
                      <td key={sched.id} className="px-3 py-2 text-center">
                        <div className="relative inline-flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right text-sm text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            value={apportionments[unit.unit_ref]?.[sched.id] ?? ''}
                            onChange={(e) => handleCellChange(unit.unit_ref, sched.id, e.target.value)}
                            onBlur={() => handleCellSave(unit.unit_ref, sched.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                          />
                          {isSaved && (
                            <Check className="ml-1 h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 bg-white px-3 py-2 text-right">
                    <span className={`font-semibold ${rowTotal === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {rowTotal.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200">
              <td className="sticky left-0 z-10 bg-white px-3 py-2.5 font-semibold text-slate-700">
                Column Total
              </td>
              {schedules.map((sched) => {
                const colTotal = units.reduce((sum, u) => {
                  const val = parseFloat(apportionments[u.unit_ref]?.[sched.id] ?? '');
                  return sum + (isNaN(val) ? 0 : val);
                }, 0);
                return (
                  <td key={sched.id} className="px-3 py-2.5 text-center">
                    <span className={`font-semibold ${colTotal === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>
                      {colTotal.toFixed(2)}%
                    </span>
                  </td>
                );
              })}
              <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-right">
                <span className="text-xs text-slate-400">per schedule</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
