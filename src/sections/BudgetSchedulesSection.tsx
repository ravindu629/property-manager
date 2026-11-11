import { useEffect, useState, useRef } from 'react';
import { Plus, GripVertical, Trash2, ListTree, Save, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { BudgetSchedule } from '@/lib/types';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20';

const ORDINALS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth',
  'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
];

function ordinalLabel(index: number): string {
  if (index < ORDINALS.length) return `${ORDINALS[index]} Schedule`;
  return `Schedule ${index + 1}`;
}

interface BudgetSchedulesSectionProps {
  onSchedulesChange?: () => void;
}

export function BudgetSchedulesSection({ onSchedulesChange }: BudgetSchedulesSectionProps = {}) {
  const [schedules, setSchedules] = useState<BudgetSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('budget_schedules')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) setSchedules(data as BudgetSchedule[]);
      setLoading(false);
    })();
  }, []);

  const handleAdd = async () => {
    const nextOrder = schedules.length > 0 ? Math.max(...schedules.map((s) => s.sort_order)) + 1 : 0;
    const { data } = await supabase
      .from('budget_schedules')
      .insert({ description: '', sort_order: nextOrder })
      .select('*')
      .single<BudgetSchedule>();
    if (data) {
      setSchedules((prev) => [...prev, data]);
      setEditingId(data.id);
      setEditValue('');
      onSchedulesChange?.();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('budget_schedules').delete().eq('id', id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    onSchedulesChange?.();
  };

  const handleDescriptionSave = async (id: string) => {
    await supabase.from('budget_schedules').update({ description: editValue }).eq('id', id);
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, description: editValue } : s)));
    setEditingId(null);
    setEditValue('');
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (index: number) => {
    const from = dragIndex.current;
    if (from === null || from === index) {
      dragIndex.current = null;
      setDragOverIndex(null);
      return;
    }

    const reordered = [...schedules];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(index, 0, moved);

    const withNewOrder = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSchedules(withNewOrder);
    dragIndex.current = null;
    setDragOverIndex(null);

    await Promise.all(
      withNewOrder.map((s) =>
        supabase.from('budget_schedules').update({ sort_order: s.sort_order }).eq('id', s.id),
      ),
    );
    onSchedulesChange?.();
  };

  const handleLockButton = () => {
    if (isLocked) {
      setIsLocked(false);
      setReorderMode(false);
    } else {
      setEditingId(null);
      setReorderMode(false);
      setIsLocked(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Budget Schedules</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add the schedules that will be used on the budget. Drag to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLocked && (
            <>
              <button
                onClick={() => setReorderMode((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  reorderMode
                    ? 'border-sky-200 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GripVertical className="h-4 w-4" />
                {reorderMode ? 'Done Reordering' : 'Reorder'}
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </button>
            </>
          )}
          <button
            onClick={handleLockButton}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors ${
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
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 text-center">
          <ListTree className="h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-400">
            {isLocked
              ? 'No schedules yet. Click "Edit" to add your first one.'
              : 'No schedules yet. Click "Add Schedule" to create your first one.'}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.id}
              draggable={!isLocked && reorderMode}
              onDragStart={() => !isLocked && handleDragStart(index)}
              onDragOver={(e) => !isLocked && reorderMode && handleDragOver(e, index)}
              onDrop={() => !isLocked && reorderMode && handleDrop(index)}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragOverIndex(null);
              }}
              className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition-all ${
                !isLocked && reorderMode
                  ? `cursor-grab active:cursor-grabbing ${
                      dragOverIndex === index ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200'
                    }`
                  : 'border-slate-200'
              }`}
            >
              {!isLocked && reorderMode && (
                <GripVertical className="h-5 w-5 shrink-0 text-slate-400" />
              )}

              <div className="flex w-36 shrink-0 items-center">
                <span className="text-sm font-medium text-slate-700">
                  {ordinalLabel(index)}
                </span>
              </div>

              <div className="flex-1">
                {!isLocked && editingId === schedule.id ? (
                  <input
                    type="text"
                    autoFocus
                    className={inputClass}
                    placeholder="e.g. Grounds Maintenance"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleDescriptionSave(schedule.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDescriptionSave(schedule.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditValue('');
                      }
                    }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (!isLocked) {
                        setEditingId(schedule.id);
                        setEditValue(schedule.description);
                      }
                    }}
                    className={`w-full truncate rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      !isLocked ? 'cursor-text hover:bg-slate-50' : 'cursor-default'
                    } ${
                      schedule.description ? 'text-slate-900' : 'text-slate-400 italic'
                    }`}
                  >
                    {schedule.description || (isLocked ? '—' : 'Click to add description...')}
                  </div>
                )}
              </div>

              {!isLocked && !reorderMode && (
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
