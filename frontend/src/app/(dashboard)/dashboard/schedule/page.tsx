'use client';

import { useState, useCallback } from 'react';
import {
  Clock,
  Plus,
  Copy,
  Trash2,
  Play,
  X,
  CheckCircle2,
  CalendarDays,
  LayoutTemplate,
  AlertCircle,
  Pencil,
  Ban,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useSchedulingStore, type TimePeriod } from '@/lib/scheduling-store';
import api from '@/lib/api';
import { formatDateDisplay } from '@/lib/date-format';
import { normalizeTime24 } from '@/lib/time-format';
import { useI18n } from '@/i18n';
import { TimeInput } from '@/components/time-input';
import { BlockScheduleTab } from '@/components/scheduling/block-schedule-tab';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Overlap detection ────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return h * 60 + m;
}

/**
 * Returns a Set of period indexes that overlap with at least one other period.
 * For template periods, only flags overlaps on days where both periods are active.
 */
function getOverlappingIndexes(
  periods: Array<{ startTime: string; endTime: string; [key: string]: any }>,
  dayKey?: string, // if provided, only check periods active on that day
): Set<number> {
  const overlapping = new Set<number>();
  for (let i = 0; i < periods.length; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      if (dayKey && (!periods[i][dayKey] || !periods[j][dayKey])) continue;
      const aStart = toMinutes(periods[i].startTime);
      const aEnd   = toMinutes(periods[i].endTime);
      const bStart = toMinutes(periods[j].startTime);
      const bEnd   = toMinutes(periods[j].endTime);
      if (aStart < bEnd && aEnd > bStart) {
        overlapping.add(i);
        overlapping.add(j);
      }
    }
  }
  return overlapping;
}

function getDirectOverlappingIndexes(
  periods: Array<{ startTime: string; endTime: string }>,
): Set<number> {
  return getOverlappingIndexes(periods);
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0, key: 'isActiveOnSunday' },
  { label: 'Mon', value: 1, key: 'isActiveOnMonday' },
  { label: 'Tue', value: 2, key: 'isActiveOnTuesday' },
  { label: 'Wed', value: 3, key: 'isActiveOnWednesday' },
  { label: 'Thu', value: 4, key: 'isActiveOnThursday' },
  { label: 'Fri', value: 5, key: 'isActiveOnFriday' },
  { label: 'Sat', value: 6, key: 'isActiveOnSaturday' },
];

const PERIOD_TYPES = [
  { value: 'service_block', label: 'Available' },
  { value: 'unavailable_block', label: 'Unavailable' },
];

function mapPeriodsForSave(
  periods: (TimePeriod & { serviceIds?: string[] })[],
) {
  return periods.map((p) => ({
    startTime: normalizeTime24(p.startTime),
    endTime: normalizeTime24(p.endTime),
    type: p.type,
    placeholderLabel: p.placeholderLabel || p.type,
    serviceIds: p.serviceIds || [],
    maxAppointmentCount: p.maxAppointmentCount || 1,
    isActiveOnMonday: p.isActiveOnMonday,
    isActiveOnTuesday: p.isActiveOnTuesday,
    isActiveOnWednesday: p.isActiveOnWednesday,
    isActiveOnThursday: p.isActiveOnThursday,
    isActiveOnFriday: p.isActiveOnFriday,
    isActiveOnSaturday: p.isActiveOnSaturday,
    isActiveOnSunday: p.isActiveOnSunday,
  }));
}

function mapDirectPeriodsForSave(
  periods: (TimePeriod & { serviceIds?: string[] })[],
) {
  return mapPeriodsForSave(periods).map(
    ({ startTime, endTime, type, placeholderLabel, serviceIds, maxAppointmentCount }) => ({
      startTime,
      endTime,
      type,
      placeholderLabel,
      serviceIds,
      maxAppointmentCount,
    }),
  );
}

const emptyPeriod = (): TimePeriod => ({
  startTime: '09:00',
  endTime: '17:00',
  type: 'service_block',
  placeholderLabel: '',
  isActiveOnMonday: true,
  isActiveOnTuesday: true,
  isActiveOnWednesday: true,
  isActiveOnThursday: true,
  isActiveOnFriday: true,
  isActiveOnSaturday: false,
  isActiveOnSunday: false,
  maxAppointmentCount: 1,
});

function mapPeriodsFromTemplate(
  template: { periods?: any[] },
): (TimePeriod & { serviceIds?: string[] })[] {
  const periodsArr = template.periods || [];
  if (periodsArr.length === 0) {
    return [{ ...emptyPeriod(), serviceIds: [] }];
  }
  return periodsArr.map((p) => ({
    startTime: p.startTime,
    endTime: p.endTime,
    type: p.type || 'service_block',
    placeholderLabel: p.placeholderLabel || '',
    serviceIds: p.serviceIds || [],
    maxAppointmentCount: p.maxAppointmentCount || 1,
    isActiveOnMonday: p.isActiveOnMonday ?? false,
    isActiveOnTuesday: p.isActiveOnTuesday ?? false,
    isActiveOnWednesday: p.isActiveOnWednesday ?? false,
    isActiveOnThursday: p.isActiveOnThursday ?? false,
    isActiveOnFriday: p.isActiveOnFriday ?? false,
    isActiveOnSaturday: p.isActiveOnSaturday ?? false,
    isActiveOnSunday: p.isActiveOnSunday ?? false,
  }));
}

// ─── Shared sub-components ────────────────────────────────────────────────────

interface PeriodEditorProps {
  periods: (TimePeriod & { serviceIds?: string[] })[];
  services: any[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: string, value: any) => void;
  /** When true, show active-days selector (for templates). Hide for direct (single-date) schedule. */
  showActiveDays?: boolean;
  /** Set of period indexes that have an overlap error */
  overlapIndexes?: Set<number>;
}

function PeriodEditor({ periods, services, onAdd, onRemove, onUpdate, showActiveDays = true, overlapIndexes }: PeriodEditorProps) {
  const toggleService = (periodIdx: number, serviceId: string) => {
    const current: string[] = (periods[periodIdx] as any).serviceIds || [];
    const next = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    onUpdate(periodIdx, 'serviceIds', next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Time Periods</h4>
        <button onClick={onAdd} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Period
        </button>
      </div>

      {periods.map((period, i) => {
        const hasOverlap = overlapIndexes?.has(i);
        return (
        <div key={i} className={`border rounded-lg p-4 space-y-3 ${hasOverlap ? 'border-red-500/60 bg-red-950/10' : 'border-gray-700'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Period {i + 1}</span>
            {periods.length > 1 && (
              <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {hasOverlap && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 border border-red-700/40 rounded px-3 py-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              This period overlaps with another. Periods must be completely independent time blocks.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={period.type}
                onChange={(e) => onUpdate(i, 'type', e.target.value)}
              >
                {PERIOD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Start Time <span className="text-gray-500 text-[10px]">(24h)</span></label>
              <TimeInput
                value={period.startTime}
                onChange={(v) => onUpdate(i, 'startTime', v)}
              />
            </div>
            <div>
              <label className="label">End Time <span className="text-gray-500 text-[10px]">(24h)</span></label>
              <TimeInput
                value={period.endTime}
                onChange={(v) => onUpdate(i, 'endTime', v)}
              />
            </div>
            <div>
              <label className="label">Label</label>
              <input
                className="input"
                value={period.placeholderLabel || ''}
                onChange={(e) => onUpdate(i, 'placeholderLabel', e.target.value)}
                placeholder="e.g. Morning Shift"
              />
            </div>
          </div>

          {/* Service multi-select — only for service_block */}
          {period.type === 'service_block' && (
            <>
              <div>
                <label className="label mb-2">Services</label>
                {services.length === 0 ? (
                  <p className="text-xs text-gray-500">No services found. Add services first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {services.map((svc: any) => {
                      const ids: string[] = (period as any).serviceIds || [];
                      const active = ids.includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => toggleService(i, svc.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            active
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {svc.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Max Appointments per Slot</label>
                <input
                  type="number"
                  className="input max-w-[120px]"
                  value={period.maxAppointmentCount || 1}
                  min={1}
                  onChange={(e) => onUpdate(i, 'maxAppointmentCount', parseInt(e.target.value) || 1)}
                />
              </div>
            </>
          )}

          {/* Active days — only for templates */}
          {showActiveDays && (
            <div>
              <label className="label mb-2">Active Days</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => onUpdate(i, day.key, !period[day.key as keyof TimePeriod])}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                      period[day.key as keyof TimePeriod]
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'create' | 'templates' | 'blocks';

export default function SchedulePage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { setTemplates, setApplyResult } = useSchedulingStore();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('create');

  // ── Shared data queries ───
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('schedule.title')}</h1>
        <p className="text-gray-400 text-sm mt-1">
          Create day schedules, manage templates, or block time on existing schedules
        </p>
      </div>

      <AiPagePanel suggestions={AI_PAGE_SUGGESTIONS['/dashboard/schedule']} context={{ route: '/dashboard/schedule', scheduleTab: tab }} />

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setTab('create')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'create'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Create Schedule
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'templates'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Schedule Templates
        </button>
        <button
          onClick={() => setTab('blocks')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'blocks'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Ban className="w-4 h-4" />
          Block Schedule
        </button>
      </div>

      {tab === 'create' ? (
        <CreateScheduleTab
          business={business}
          employees={employees}
          services={services}
          queryClient={queryClient}
        />
      ) : tab === 'templates' ? (
        <TemplatesTab
          business={business}
          employees={employees}
          services={services}
          queryClient={queryClient}
          setTemplates={setTemplates}
          setApplyResult={setApplyResult}
        />
      ) : (
        <BlockScheduleTab business={business} employees={employees} />
      )}
    </div>
  );
}

// ─── Tab: Create Schedule ─────────────────────────────────────────────────────

function CreateScheduleTab({
  business,
  employees,
  services,
  queryClient,
}: {
  business: any;
  employees: any[];
  services: any[];
  queryClient: any;
}) {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [periods, setPeriods] = useState<(TimePeriod & { serviceIds?: string[] })[]>([
    { ...emptyPeriod(), serviceIds: [] },
  ]);
  const [successInfo, setSuccessInfo] = useState<{ slotsCreated: number; optimization?: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPeriod = useCallback(() => {
    setPeriods((prev) => [...prev, { ...emptyPeriod(), serviceIds: [] }]);
  }, []);
  const removePeriod = useCallback((i: number) => {
    setPeriods((prev) => prev.filter((_, idx) => idx !== i));
  }, []);
  const updatePeriod = useCallback((i: number, field: string, value: any) => {
    setPeriods((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const { data } = await api.post(`/businesses/${business.id}/schedules/direct`, {
        employeeId,
        date,
        periods: mapDirectPeriodsForSave(periods),
      });
      return data.data || data;
    },
    onSuccess: (data) => {
      setSuccessInfo(data);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create schedule');
    },
  });

  const handleReset = () => {
    setSuccessInfo(null);
    setError(null);
    setPeriods([{ ...emptyPeriod(), serviceIds: [] }]);
    setEmployeeId('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (successInfo) {
    return (
      <div className="card max-w-xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-300">Schedule Created</p>
            <p className="text-sm text-gray-400">
              {successInfo.slotsCreated} slot{successInfo.slotsCreated !== 1 ? 's' : ''} generated for {formatDateDisplay(date)}
            </p>
          </div>
        </div>
        {successInfo.optimization?.reasoning && (
          <p className="text-xs text-gray-400 bg-gray-800 rounded p-2 mb-4">
            AI: {successInfo.optimization.reasoning}
          </p>
        )}
        <button onClick={handleReset} className="btn-primary">Create Another</button>
      </div>
    );
  }

  return (
    <div className="card max-w-3xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-blue-400" />
        Create Schedule for a Day
      </h2>
      <p className="text-sm text-gray-400 mb-5">
        Define time periods directly for an employee on a specific date — no template needed.
        Each period can be assigned different services.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="label">Employee</label>
          <select
            className="input"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select employee...</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {(() => {
        const overlapIndexes = getDirectOverlappingIndexes(periods);
        const hasAnyOverlap = overlapIndexes.size > 0;
        return (
          <>
            <PeriodEditor
              periods={periods}
              services={services}
              onAdd={addPeriod}
              onRemove={removePeriod}
              onUpdate={updatePeriod}
              showActiveDays={false}
              overlapIndexes={overlapIndexes}
            />

            {error && (
              <div className="mt-4 flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => createMutation.mutate()}
                className="btn-primary"
                disabled={!employeeId || !date || periods.length === 0 || hasAnyOverlap || createMutation.isPending}
                title={hasAnyOverlap ? 'Fix overlapping periods before saving' : undefined}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </button>
              {hasAnyOverlap && (
                <p className="text-xs text-red-400 self-center">
                  Fix overlapping periods first
                </p>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ─── Tab: Templates ───────────────────────────────────────────────────────────

function TemplatesTab({
  business,
  employees,
  services,
  queryClient,
  setTemplates,
  setApplyResult,
}: {
  business: any;
  employees: any[];
  services: any[];
  queryClient: any;
  setTemplates: (templates: any[], total: number) => void;
  setApplyResult: (result: any) => void;
}) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApply, setShowApply] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [periods, setPeriods] = useState<(TimePeriod & { serviceIds?: string[] })[]>([
    { ...emptyPeriod(), serviceIds: [] },
  ]);

  const [applyForm, setApplyForm] = useState({
    employeeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    applyDays: [1, 2, 3, 4, 5] as number[],
    repeatWeeksCount: 1,
  });

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['schedules', business?.id, search],
    queryFn: async () => {
      if (!business?.id) return { templates: [], totalItems: 0 };
      const { data } = await api.get(`/businesses/${business.id}/schedules/templates`, {
        params: { searchString: search || undefined },
      });
      const result = data.data || data;
      const templates = result.templates || result || [];
      const totalItems = result.totalItems || templates.length;
      setTemplates(templates, totalItems);
      return { templates, totalItems };
    },
    enabled: !!business?.id,
  });

  const templates = templateData?.templates || [];

  // ── Period editors ───
  const addPeriod = useCallback(() =>
    setPeriods((prev) => [...prev, { ...emptyPeriod(), serviceIds: [] }]), []);
  const removePeriod = useCallback((i: number) =>
    setPeriods((prev) => prev.filter((_, idx) => idx !== i)), []);
  const updatePeriod = useCallback((i: number, field: string, value: any) =>
    setPeriods((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))), []);

  const resetTemplateForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
    setTemplateName('');
    setPeriods([{ ...emptyPeriod(), serviceIds: [] }]);
  }, []);

  const openCreateForm = useCallback(() => {
    setShowApply(null);
    setEditingId(null);
    setFormError(null);
    setTemplateName('');
    setPeriods([{ ...emptyPeriod(), serviceIds: [] }]);
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((template: any) => {
    setShowApply(null);
    setEditingId(template.id);
    setFormError(null);
    setTemplateName(template.name);
    setPeriods(mapPeriodsFromTemplate(template));
    setFormOpen(true);
  }, []);

  // ── Mutations ───
  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/businesses/${business!.id}/schedules/templates`, {
        name: templateName,
        timePeriods: mapPeriodsForSave(periods),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      resetTemplateForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || t('schedule.saveFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/businesses/${business!.id}/schedules/templates/${editingId}`, {
        name: templateName,
        timePeriods: mapPeriodsForSave(periods),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      resetTemplateForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || t('schedule.saveFailed'));
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/businesses/${business!.id}/schedules/templates/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.delete(`/businesses/${business!.id}/schedules/templates`, { data: { templateIds: ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setSelected([]);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data } = await api.post(`/businesses/${business!.id}/schedules/templates/apply`, {
        templateId,
        ...applyForm,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setApplyResult(data);
    },
  });

  const toggleDay = useCallback((day: number) => {
    setApplyForm((prev) => ({
      ...prev,
      applyDays: prev.applyDays.includes(day)
        ? prev.applyDays.filter((d) => d !== day)
        : [...prev.applyDays, day],
    }));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <input
            className="input"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button
              onClick={() => deleteMutation.mutate(selected)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-400 rounded-lg text-sm hover:bg-red-600/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete ({selected.length})
            </button>
          )}
          <button
            onClick={openCreateForm}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t('schedule.createTemplate')}
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {formOpen && (
        <div className="card mb-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-blue-400" />
              {editingId ? t('schedule.editTemplate') : t('schedule.createTemplate')}
            </h3>
            <button onClick={resetTemplateForm} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {editingId && (
            <p className="text-xs text-amber-600 dark:text-amber-400/90 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2 mb-4">
              {t('schedule.editTemplateNote')}
            </p>
          )}

          <div className="mb-5">
            <label className="label">Template Name</label>
            <input
              className="input max-w-md"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value.slice(0, 50))}
              placeholder="e.g. Morning Schedule"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">{templateName.length}/50</p>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Define time periods below. Each period specifies which days it is active and which services it covers.
            When you apply this template, slots are generated only on the matching weekdays.
          </p>

          {(() => {
            // For templates, check overlaps per day
            const templateOverlaps = new Set<number>();
            ['isActiveOnSunday','isActiveOnMonday','isActiveOnTuesday','isActiveOnWednesday',
             'isActiveOnThursday','isActiveOnFriday','isActiveOnSaturday'].forEach((dayKey) => {
              getOverlappingIndexes(periods, dayKey).forEach((i) => templateOverlaps.add(i));
            });
            const hasTemplateOverlap = templateOverlaps.size > 0;
            const isSaving = createMutation.isPending || updateMutation.isPending;
            return (
              <>
                <PeriodEditor
                  periods={periods}
                  services={services}
                  onAdd={addPeriod}
                  onRemove={removePeriod}
                  onUpdate={updatePeriod}
                  showActiveDays={true}
                  overlapIndexes={templateOverlaps}
                />

                {formError && (
                  <div className="mt-4 flex items-start gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {formError}
                  </div>
                )}

                <div className="flex gap-2 mt-5 items-center">
                  <button
                    onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
                    className="btn-primary"
                    disabled={!templateName || periods.length === 0 || hasTemplateOverlap || isSaving}
                    title={hasTemplateOverlap ? 'Fix overlapping periods before saving' : undefined}
                  >
                    {isSaving
                      ? t('schedule.saving')
                      : editingId
                        ? t('schedule.saveChanges')
                        : t('schedule.saveTemplate')}
                  </button>
                  <button onClick={resetTemplateForm} className="btn-secondary">
                    {t('common.cancel')}
                  </button>
                  {hasTemplateOverlap && (
                    <p className="text-xs text-red-400">Fix overlapping periods first</p>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Apply Modal */}
      {showApply && (
        <div className="card mb-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Play className="w-5 h-5 text-green-400" />
              Apply Template
            </h3>
            <button onClick={() => setShowApply(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Employee</label>
              <select
                className="input"
                value={applyForm.employeeId}
                onChange={(e) => setApplyForm({ ...applyForm, employeeId: e.target.value })}
              >
                <option value="">Select employee...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Repeat Weeks</label>
              <input
                type="number"
                className="input"
                value={applyForm.repeatWeeksCount}
                min={1}
                max={52}
                onChange={(e) => setApplyForm({ ...applyForm, repeatWeeksCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={applyForm.startDate}
                onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label mb-2">Apply on Days</label>
            <div className="flex gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`w-12 h-10 rounded-lg text-xs font-medium transition-colors ${
                    applyForm.applyDays.includes(day.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => applyMutation.mutate(showApply)}
              className="btn-primary flex items-center gap-2"
              disabled={!applyForm.employeeId || applyForm.applyDays.length === 0 || applyMutation.isPending}
            >
              <Play className="w-4 h-4" />
              {applyMutation.isPending ? 'Applying...' : 'Apply Template'}
            </button>
            <button onClick={() => setShowApply(null)} className="btn-secondary">Cancel</button>
          </div>

          {applyMutation.isSuccess && (
            <div className="mt-4 p-3 bg-green-600/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Template applied —{' '}
                  {(applyMutation.data as any)?.data?.slotsCreated ??
                    (applyMutation.data as any)?.slotsCreated ??
                    'N/A'}{' '}
                  slots created
                </span>
              </div>
              {((applyMutation.data as any)?.data?.optimization?.reasoning ||
                (applyMutation.data as any)?.optimization?.reasoning) && (
                <p className="text-xs text-gray-400 mt-2">
                  AI:{' '}
                  {(applyMutation.data as any)?.data?.optimization?.reasoning ||
                    (applyMutation.data as any)?.optimization?.reasoning}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Templates Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <LayoutTemplate className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {search ? `No templates matching "${search}"` : 'No schedule templates yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Create a template with time periods, then apply it to an employee over a date range
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {templates.map((template: any) => {
              const periodsArr: any[] = template.periods || [];
              const serviceNames = periodsArr
                .flatMap((p: any) =>
                  (p.serviceIds || []).map((id: string) => {
                    const svc = (services as any[]).find((s: any) => s.id === id);
                    return svc?.name || id;
                  })
                )
                .filter(Boolean);
              const uniqueServiceNames = [...new Set(serviceNames)];

              return (
                <div key={template.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(template.id)}
                      onChange={() => toggleSelect(template.id)}
                      className="w-4 h-4 mt-1 rounded border-gray-600 bg-gray-800"
                    />
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {periodsArr.length > 0 ? (
                          <span className="text-xs text-gray-400">
                            {periodsArr.length} period{periodsArr.length > 1 ? 's' : ''} &middot;{' '}
                            {periodsArr.map((p: any) => `${p.startTime}–${p.endTime}`).join(', ')}
                          </span>
                        ) : template.workingHours ? (
                          <span className="text-xs text-gray-400">
                            {template.workingHours.map((h: any) => `${h.startTime}–${h.endTime}`).join(', ')}
                          </span>
                        ) : null}
                        {uniqueServiceNames.map((name) => (
                          <span
                            key={name}
                            className="text-xs px-1.5 py-0.5 rounded bg-blue-600/15 text-blue-300"
                          >
                            {name}
                          </span>
                        ))}
                        {template.countDaysComplete > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-600/10 text-green-400">
                            {template.countDaysComplete} days
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setShowApply(template.id); resetTemplateForm(); }}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/10 rounded-lg transition-colors"
                      title={t('schedule.applyTemplate')}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditForm(template)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-colors"
                      title={t('schedule.editTemplate')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateMutation.mutate(template.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate([template.id])}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
