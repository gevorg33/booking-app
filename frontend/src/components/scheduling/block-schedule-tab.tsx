'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, CheckCircle2, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatWeekdayShortByDayIndex,
  getTodayDateKey,
} from '@/lib/date-format';
import type { AppLocale } from '@/i18n/types';
import { normalizeTime24 } from '@/lib/time-format';
import { TimeInput } from '@/components/time-input';
import { DatePicker } from '@/components/ui/date-picker';
import { TablePagination } from '@/components/table/table-pagination';
import { useI18n } from '@/i18n';

const WEEKDAY_CONFIG = [
  { key: 'isActiveOnMonday' as const, dayIndex: 1 },
  { key: 'isActiveOnTuesday' as const, dayIndex: 2 },
  { key: 'isActiveOnWednesday' as const, dayIndex: 3 },
  { key: 'isActiveOnThursday' as const, dayIndex: 4 },
  { key: 'isActiveOnFriday' as const, dayIndex: 5 },
  { key: 'isActiveOnSaturday' as const, dayIndex: 6 },
  { key: 'isActiveOnSunday' as const, dayIndex: 0 },
];

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

function formatBlockSummary(item: BlockScheduleItem, locale?: AppLocale): string {
  if (item.isRepetitive && item.startDay && item.endDay && item.blockStartTime && item.blockEndTime) {
    return `${formatDateDisplay(item.startDay, locale)} – ${formatDateDisplay(item.endDay, locale)} · ${item.blockStartTime}–${item.blockEndTime} daily`;
  }
  if (item.singleStartTime && item.singleEndTime) {
    return `${formatDateDisplay(item.singleStartTime, locale)} ${formatTimeDisplay(item.singleStartTime)}–${formatTimeDisplay(item.singleEndTime)}`;
  }
  return item.placeholderLabel;
}

const BLOCK_LIST_PAGE_SIZE = 10;

type BlockViewTab = 'create' | 'active';

export function BlockScheduleTab({
  business,
  employees,
}: {
  business: { id: string };
  employees: Array<{ id: string; name: string }>;
}) {
  const { t, locale } = useI18n();
  const weekdayButtons = useMemo(
    () =>
      WEEKDAY_CONFIG.map(({ key, dayIndex }) => ({
        key,
        label: formatWeekdayShortByDayIndex(dayIndex, locale),
      })),
    [locale],
  );
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [placeholder, setPlaceholder] = useState('Blocked');
  const [isRepetitive, setIsRepetitive] = useState(true);
  const [startDay, setStartDay] = useState(getTodayDateKey());
  const [endDay, setEndDay] = useState(getTodayDateKey());
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
  const [singleDay, setSingleDay] = useState(getTodayDateKey());
  const [singleStartTime, setSingleStartTime] = useState('15:00');
  const [singleEndTime, setSingleEndTime] = useState('16:00');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [viewTab, setViewTab] = useState<BlockViewTab>('create');
  const [listProviderSearch, setListProviderSearch] = useState('');
  const [listPage, setListPage] = useState(1);

  const { data: blockSchedules = [], isLoading } = useQuery({
    queryKey: ['block-schedules', business.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business.id}/schedules/block-schedules`);
      return (data.data || data || []) as BlockScheduleItem[];
    },
    enabled: !!business.id,
  });

  const filteredBlockSchedules = useMemo(() => {
    const q = listProviderSearch.trim().toLowerCase();
    if (!q) return blockSchedules;
    return blockSchedules.filter((item) =>
      (item.employee?.name ?? '').toLowerCase().includes(q),
    );
  }, [blockSchedules, listProviderSearch]);

  const paginatedBlockSchedules = useMemo(() => {
    const start = (listPage - 1) * BLOCK_LIST_PAGE_SIZE;
    return filteredBlockSchedules.slice(start, start + BLOCK_LIST_PAGE_SIZE);
  }, [filteredBlockSchedules, listPage]);

  useEffect(() => {
    setListPage(1);
  }, [listProviderSearch]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredBlockSchedules.length / BLOCK_LIST_PAGE_SIZE));
    if (listPage > totalPages) setListPage(totalPages);
  }, [filteredBlockSchedules.length, listPage]);

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
      setViewTab('active');
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

  const tabButtonClass = (active: boolean) =>
    `flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-400'
        : 'border-transparent text-gray-400 hover:text-gray-200'
    }`;

  return (
    <div>
      <div className="flex border-b border-gray-800 mb-6">
        <button type="button" onClick={() => setViewTab('create')} className={tabButtonClass(viewTab === 'create')}>
          <Plus className="w-4 h-4" />
          {t('schedule.blockTabCreate')}
        </button>
        <button type="button" onClick={() => setViewTab('active')} className={tabButtonClass(viewTab === 'active')}>
          <Ban className="w-4 h-4" />
          {t('schedule.blockTabActive')}
        </button>
      </div>

      {viewTab === 'create' ? (
      <div className="card space-y-4 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            {t('schedule.createBlockSchedule')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t('schedule.createBlockScheduleHint')}</p>
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
                <DatePicker value={startDay} onChange={setStartDay} />
              </div>
              <div>
                <label className="label">To date</label>
                <DatePicker value={endDay} onChange={setEndDay} />
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
                {weekdayButtons.map(({ key, label }) => (
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
              <DatePicker value={singleDay} onChange={setSingleDay} />
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
      ) : (
      <div className="card flex flex-col max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">{t('schedule.activeBlockSchedules')}</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="search"
            className="input pl-9"
            value={listProviderSearch}
            onChange={(e) => setListProviderSearch(e.target.value)}
            placeholder={t('schedule.searchBlockByProvider')}
            aria-label={t('schedule.searchBlockByProvider')}
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : blockSchedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">{t('schedule.noBlockSchedules')}</p>
        ) : filteredBlockSchedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">{t('schedule.noBlockSchedulesMatch')}</p>
        ) : (
          <>
            <ul className="divide-y divide-gray-800 flex-1">
              {paginatedBlockSchedules.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{item.placeholderLabel}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.employee?.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatBlockSummary(item, locale)}</p>
                  </div>
                  <button
                    type="button"
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
            <TablePagination
              page={listPage}
              pageSize={BLOCK_LIST_PAGE_SIZE}
              totalItems={filteredBlockSchedules.length}
              onPageChange={setListPage}
            />
          </>
        )}
      </div>
      )}
    </div>
  );
}
