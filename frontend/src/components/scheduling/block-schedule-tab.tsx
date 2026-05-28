'use client';

import { useState } from 'react';
import { AlertCircle, Ban, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateDisplay, formatTimeDisplay } from '@/lib/date-format';
import { normalizeTime24 } from '@/lib/time-format';
import { TimeInput } from '@/components/time-input';

const WEEKDAYS = [
  { key: 'isActiveOnMonday', label: 'Mon' },
  { key: 'isActiveOnTuesday', label: 'Tue' },
  { key: 'isActiveOnWednesday', label: 'Wed' },
  { key: 'isActiveOnThursday', label: 'Thu' },
  { key: 'isActiveOnFriday', label: 'Fri' },
  { key: 'isActiveOnSaturday', label: 'Sat' },
  { key: 'isActiveOnSunday', label: 'Sun' },
] as const;

interface BlockScheduleItem {
  id: string;
  placeholderLabel: string;
  isRepetitive: boolean;
  startDay: string | null;
  endDay: string | null;
  blockStartTime: string | null;
  blockEndTime: string | null;
  repeatWeeksCount: number;
  singleStartTime: string | null;
  singleEndTime: string | null;
  updatedAt: string;
  employee: { id: string; name: string } | null;
  weekdays: Record<string, boolean>;
}

function toIso(day: string, time: string): string {
  return `${day}T${normalizeTime24(time)}:00.000Z`;
}

function formatBlockSummary(item: BlockScheduleItem): string {
  if (item.isRepetitive && item.startDay && item.endDay && item.blockStartTime && item.blockEndTime) {
    return `${formatDateDisplay(item.startDay)} – ${formatDateDisplay(item.endDay)} · ${item.blockStartTime}–${item.blockEndTime} daily`;
  }
  if (item.singleStartTime && item.singleEndTime) {
    return `${formatDateDisplay(item.singleStartTime)} ${formatTimeDisplay(item.singleStartTime)}–${formatTimeDisplay(item.singleEndTime)}`;
  }
  return item.placeholderLabel;
}

export function BlockScheduleTab({
  business,
  employees,
}: {
  business: { id: string };
  employees: Array<{ id: string; name: string }>;
}) {
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [placeholder, setPlaceholder] = useState('Blocked');
  const [isRepetitive, setIsRepetitive] = useState(true);
  const [startDay, setStartDay] = useState(new Date().toISOString().split('T')[0]);
  const [endDay, setEndDay] = useState(new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('15:00');
  const [blockEndTime, setBlockEndTime] = useState('16:00');
  const [weeksCount, setWeeksCount] = useState(1);
  const [weekdays, setWeekdays] = useState<Record<string, boolean>>({
    isActiveOnMonday: true,
    isActiveOnTuesday: true,
    isActiveOnWednesday: true,
    isActiveOnThursday: true,
    isActiveOnFriday: true,
    isActiveOnSaturday: false,
    isActiveOnSunday: false,
  });
  const [singleDay, setSingleDay] = useState(new Date().toISOString().split('T')[0]);
  const [singleStartTime, setSingleStartTime] = useState('15:00');
  const [singleEndTime, setSingleEndTime] = useState('16:00');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: blockSchedules = [], isLoading } = useQuery({
    queryKey: ['block-schedules', business.id, employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const { data } = await api.get(`/businesses/${business.id}/schedules/block-schedules`, { params });
      return (data.data || data || []) as BlockScheduleItem[];
    },
    enabled: !!business.id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['block-schedules'] });
    queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      const payload = isRepetitive
        ? {
            employeeId,
            placeholder,
            isRepetitive: true,
            repetitiveBlock: {
              startDay,
              endDay,
              startTime: normalizeTime24(blockStartTime),
              endTime: normalizeTime24(blockEndTime),
              weeksCount,
              ...weekdays,
            },
          }
        : {
            employeeId,
            placeholder,
            isRepetitive: false,
            singleBlock: {
              startTime: toIso(singleDay, singleStartTime),
              endTime: toIso(singleDay, singleEndTime),
            },
          };
      const { data } = await api.post(`/businesses/${business.id}/schedules/block-schedules`, payload);
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      refresh();
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Failed to create block schedule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/businesses/${business.id}/schedules/block-schedules/${id}`);
    },
    onSuccess: refresh,
  });

  const toggleWeekday = (key: string) => {
    setWeekdays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSubmit = !!employeeId && !createMutation.isPending;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            Create Block Schedule
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Block time on top of existing schedules. Service periods are split automatically
            (e.g. 14:00–18:00 with a 15:00–16:00 block becomes 14:00–15:00 and 16:00–18:00).
          </p>
        </div>

        <div>
          <label className="label">Provider</label>
          <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select provider...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Label</label>
          <input className="input" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Blocked" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRepetitive(true)}
            className={`px-3 py-1.5 rounded-lg text-sm ${isRepetitive ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            Repetitive
          </button>
          <button
            type="button"
            onClick={() => setIsRepetitive(false)}
            className={`px-3 py-1.5 rounded-lg text-sm ${!isRepetitive ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
          >
            One-time
          </button>
        </div>

        {isRepetitive ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From date</label>
                <input type="date" className="input" value={startDay} onChange={(e) => setStartDay(e.target.value)} />
              </div>
              <div>
                <label className="label">To date</label>
                <input type="date" className="input" value={endDay} onChange={(e) => setEndDay(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Block start (24h)</label>
                <TimeInput value={blockStartTime} onChange={setBlockStartTime} />
              </div>
              <div>
                <label className="label">Block end (24h)</label>
                <TimeInput value={blockEndTime} onChange={setBlockEndTime} />
              </div>
            </div>
            <div>
              <label className="label">Repeat weeks</label>
              <input
                type="number"
                min={1}
                max={52}
                className="input"
                value={weeksCount}
                onChange={(e) => setWeeksCount(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="label">Active days</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleWeekday(key)}
                    className={`px-2.5 py-1 rounded text-xs font-medium ${
                      weekdays[key] ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={singleDay} onChange={(e) => setSingleDay(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Block start (24h)</label>
                <TimeInput value={singleStartTime} onChange={setSingleStartTime} />
              </div>
              <div>
                <label className="label">Block end (24h)</label>
                <TimeInput value={singleEndTime} onChange={setSingleEndTime} />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {typeof error === 'string' ? error : 'Failed to save block schedule'}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-600/10 border border-green-500/30 text-green-400 text-sm flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Block schedule applied
          </div>
        )}

        <button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying block...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Apply Block Schedule
            </>
          )}
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Active Block Schedules</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : blockSchedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No block schedules yet.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {blockSchedules.map((item) => (
              <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{item.placeholderLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.employee?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatBlockSummary(item)}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="p-2 text-red-400 hover:bg-red-600/10 rounded-lg shrink-0"
                  title="Remove block schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
