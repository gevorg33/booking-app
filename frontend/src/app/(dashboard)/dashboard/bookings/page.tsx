'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { formatDateDisplay, formatTimeDisplay, formatTimeRangeDisplay } from '@/lib/date-format';
import { isValidTime24, isTimeInRange, normalizeTime24, timeToMinutes } from '@/lib/time-format';
import { TimeInput } from '@/components/time-input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Calendar constants ───────────────────────────────────────────────────────

const HOUR_START = 7;
const HOUR_END   = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 64;
const TOTAL_MINUTES = TOTAL_HOURS * 60;

const STATUS_BADGE: Record<string, string> = {
  confirmed:   'bg-green-600/15 text-green-400',
  completed:   'bg-blue-600/15 text-blue-400',
  cancelled:   'bg-red-600/15 text-red-400',
  pending:     'bg-yellow-600/15 text-yellow-400',
  no_show:     'bg-orange-600/15 text-orange-400',
  in_progress: 'bg-purple-600/15 text-purple-400',
};

const SVC_COLORS = [
  { bg: 'bg-blue-600/30',    border: 'border-blue-500/60',    text: 'text-blue-200'   },
  { bg: 'bg-violet-600/30',  border: 'border-violet-500/60',  text: 'text-violet-200' },
  { bg: 'bg-pink-600/30',    border: 'border-pink-500/60',    text: 'text-pink-200'   },
  { bg: 'bg-cyan-600/30',    border: 'border-cyan-500/60',    text: 'text-cyan-200'   },
  { bg: 'bg-teal-600/30',    border: 'border-teal-500/60',    text: 'text-teal-200'   },
  { bg: 'bg-lime-600/30',    border: 'border-lime-500/60',    text: 'text-lime-200'   },
  { bg: 'bg-yellow-600/30',  border: 'border-yellow-500/60',  text: 'text-yellow-200' },
  { bg: 'bg-rose-600/30',    border: 'border-rose-500/60',    text: 'text-rose-200'   },
  { bg: 'bg-indigo-600/30',  border: 'border-indigo-500/60',  text: 'text-indigo-200' },
  { bg: 'bg-fuchsia-600/30', border: 'border-fuchsia-500/60', text: 'text-fuchsia-200'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toUTCMinutes(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
function fmtUTC(date: Date) {
  return formatTimeDisplay(date);
}
function fmtDate(d: Date) {
  return formatDateDisplay(d);
}
function parsePickerDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateKey(d: Date) {
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number) {
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  const r = new Date(base);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** Convert a UTC time (HH:mm) on a given date ISO string into an ISO timestamp. */
function toISO(dayISO: string, timeHHmm: string): string {
  return `${dayISO}T${timeHHmm}:00.000Z`;
}

/** Latest HH:mm start so a service of `durationMin` ends by `periodEndISO`. */
function latestStartTime(periodEndISO: string, durationMin: number): string {
  const latest = new Date(new Date(periodEndISO).getTime() - durationMin * 60000);
  return formatTimeDisplay(latest);
}

function bookingEndTime(startHHmm: string, durationMin: number): string {
  const [h, m] = normalizeTime24(startHHmm).split(':').map(Number);
  const total = h * 60 + m + durationMin;
  return formatTimeDisplay(new Date(Date.UTC(1970, 0, 1, Math.floor(total / 60) % 24, total % 60)));
}

/** Snap HH:mm string down to the nearest 10-minute boundary. */
function snapTo10min(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalPeriod {
  id: string;
  startTime: string;          // ISO
  endTime: string;            // ISO
  type: 'service_block' | 'blocked_time' | 'unavailable_block';
  serviceIds: string[];
  placeholderLabel: string | null;
  maxAppointmentCount: number;
  employeeId: string;
}

interface BookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  description?: string;
  service?: { id: string; name: string; durationMinutes: number };
  employee?: { id: string; name: string };
  customer?: { id: string; name: string };
}

/** Calendar block label — includes time range so overlapping blocks stay readable. */
function bookingBlockLabel(b: Pick<BookingItem, 'status' | 'service' | 'startTime' | 'endTime'>) {
  const range = formatTimeRangeDisplay(b.startTime, b.endTime);
  const name = b.service?.name || 'Booking';
  return b.status === 'cancelled' ? `${range} · Cancelled — ${name}` : `${range} · ${name}`;
}

function formatStatusLabel(status: string) {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'no_show') return 'No show';
  if (status === 'in_progress') return 'In progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ─── Overlap layout helper ────────────────────────────────────────────────────

interface LayoutBlock {
  id: string;
  startMin: number; // minutes from midnight UTC
  endMin: number;
  col: number;
  totalCols: number;
}

/**
 * Groups items by overlap and assigns columns so overlapping blocks
 * render side-by-side (Google-Calendar style) instead of on top of each other.
 */
function computeLayout(items: Array<{ id: string; startISO: string; endISO: string }>): Map<string, LayoutBlock> {
  const toMin = (iso: string) => {
    const d = new Date(iso);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  };

  const parsed = items.map((item) => ({
    id: item.id,
    start: toMin(item.startISO),
    end: toMin(item.endISO),
  })).sort((a, b) => a.start - b.start);

  const result = new Map<string, LayoutBlock>();

  // Group overlapping items into clusters
  let i = 0;
  while (i < parsed.length) {
    // Build a cluster: keep adding while any overlap exists
    const cluster = [parsed[i]];
    let maxEnd = parsed[i].end;
    let j = i + 1;
    while (j < parsed.length && parsed[j].start < maxEnd) {
      cluster.push(parsed[j]);
      maxEnd = Math.max(maxEnd, parsed[j].end);
      j++;
    }

    // Assign columns within the cluster (greedy)
    const colEnds: number[] = [];
    for (const item of cluster) {
      let col = colEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(item.end);
      } else {
        colEnds[col] = item.end;
      }
      result.set(item.id, {
        id: item.id,
        startMin: item.start,
        endMin: item.end,
        col,
        totalCols: 0, // fill below
      });
    }

    // Set totalCols = max columns in this cluster
    const totalCols = colEnds.length;
    for (const item of cluster) {
      const b = result.get(item.id)!;
      result.set(item.id, { ...b, totalCols });
    }

    i = j;
  }

  return result;
}

// ─── CalendarBlock ────────────────────────────────────────────────────────────

function getBlockPosition(
  startISO: string,
  endISO: string,
  col = 0,
  totalCols = 1,
) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startMin = toUTCMinutes(start) - HOUR_START * 60;
  const endMin = toUTCMinutes(end) - HOUR_START * 60;
  const topPct = (startMin / TOTAL_MINUTES) * 100;
  const heightPct = Math.max(((endMin - startMin) / TOTAL_MINUTES) * 100, 0.5);
  const colWidthPct = 100 / totalCols;
  const leftPct = col * colWidthPct;
  const GAP = totalCols > 1 ? 2 : 4;

  return {
    top: `${topPct}%`,
    height: `${heightPct}%`,
    minHeight: 14,
    left: `calc(${leftPct}% + ${GAP}px)`,
    width: `calc(${colWidthPct}% - ${GAP * 2}px)`,
    durationMin: endMin - startMin,
  };
}

function PeriodLabelOverlay({
  startISO,
  endISO,
  label,
  sublabel,
  textClass,
  col = 0,
  totalCols = 1,
}: {
  startISO: string;
  endISO: string;
  label: string;
  sublabel?: string;
  textClass: string;
  col?: number;
  totalCols?: number;
}) {
  const pos = getBlockPosition(startISO, endISO, col, totalCols);
  if (pos.durationMin < 15) return null;

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none px-1"
      style={{
        top: pos.top,
        height: pos.height,
        minHeight: pos.minHeight,
        left: pos.left,
        width: pos.width,
        zIndex: 25,
      }}
    >
      <div className={`text-center leading-tight max-w-full ${textClass}`}>
        <p className="text-[11px] font-semibold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{label}</p>
        {sublabel && pos.durationMin >= 30 && (
          <p className="text-[10px] opacity-90 truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

function CalendarBlock({
  startISO, endISO, color, label, sublabel, onClick, faded, selected,
  col = 0, totalCols = 1, showLabel = true, zIndex = 1, pointerEventsNone = false,
  compact = false,
}: {
  startISO: string;
  endISO: string;
  color: { bg: string; border: string; text: string };
  label: string;
  sublabel?: string;
  onClick?: () => void;
  faded?: boolean;
  selected?: boolean;
  col?: number;
  totalCols?: number;
  showLabel?: boolean;
  zIndex?: number;
  pointerEventsNone?: boolean;
  compact?: boolean;
}) {
  const pos = getBlockPosition(startISO, endISO, col, totalCols);
  const isCompact = compact || totalCols > 1;
  const minDurationForLabel = isCompact ? 8 : 15;
  const showText = showLabel && pos.durationMin >= minDurationForLabel;

  return (
    <div
      className={`absolute rounded border overflow-hidden select-none transition-all
        ${color.bg} ${color.border} ${color.text}
        ${onClick && !pointerEventsNone ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
        ${faded ? 'opacity-80' : ''}
        ${selected ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-900' : ''}
        ${pointerEventsNone ? 'pointer-events-none' : ''}`}
      style={{
        top: pos.top,
        height: pos.height,
        minHeight: pos.minHeight,
        left: pos.left,
        width: pos.width,
        zIndex,
      }}
      onClick={onClick}
      title={label}
    >
      {showText && (
        <div className={`${isCompact ? 'px-1 py-0.5' : 'px-2 py-1'} leading-tight min-w-0 h-full`}>
          <p className={`${isCompact ? 'text-[9px] leading-[1.15]' : 'text-[11px]'} font-semibold ${isCompact ? 'line-clamp-4 whitespace-normal break-words' : 'truncate'}`}>
            {label}
          </p>
          {sublabel && pos.durationMin >= (isCompact ? 20 : 30) && (
            <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} opacity-70 truncate`}>{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { business } = useAuthStore();
  const queryClient  = useQueryClient();

  const [day, setDay]                       = useState(new Date());
  const [employeeId, setEmployeeId]         = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<CalPeriod | null>(null);
  const [showCancel, setShowCancel]         = useState<string | null>(null);
  const [cancelReason, setCancelReason]     = useState('');

  const [form, setForm] = useState({
    startTime: '',  // HH:mm within the period
    serviceId: '',
    customerId: '',
    notes: '',
    description: '',
  });

  const dayStr  = dateKey(day);
  const isToday = dayStr === dateKey(new Date());

  const prevDay = useCallback(() => setDay((d) => addDays(d, -1)), []);
  const nextDay = useCallback(() => setDay((d) => addDays(d, 1)),  []);
  const goToday = useCallback(() => setDay(new Date()),            []);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/customers`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  // Provider-calendar: returns whole applied period blocks (not micro-slots)
  const { data: calData, isLoading: calLoading } = useQuery({
    queryKey: ['provider-calendar', business?.id, employeeId, dayStr],
    queryFn: async () => {
      if (!business?.id || !employeeId) return { periods: [] };
      const { data } = await api.get(
        `/businesses/${business.id}/schedules/provider-calendar`,
        { params: { employeeId, startDate: dayStr, endDate: dayStr } },
      );
      return data.data || data;
    },
    enabled: !!business?.id && !!employeeId,
  });

  const { data: bookingsRaw = [] } = useQuery({
    queryKey: ['bookings', business?.id, dayStr, employeeId],
    queryFn: async () => {
      if (!business?.id) return [];
      const params: any = { date: dayStr };
      if (employeeId) params.employeeId = employeeId;
      const { data } = await api.get(`/businesses/${business.id}/bookings`, { params });
      const list = data.data || data || [];
      return employeeId
        ? list.filter((b: any) => b.employee?.id === employeeId || b.employeeId === employeeId)
        : list;
    },
    enabled: !!business?.id,
  });

  const calPeriods: CalPeriod[] = calData?.periods || [];
  const bookings: BookingItem[] = bookingsRaw;

  // ── Derived UI state ───────────────────────────────────────────────────────

  // serviceId → color index (stable, built from all periods' serviceIds)
  const serviceColorMap = useMemo(() => {
    const ids = [...new Set(calPeriods.flatMap((p) => p.serviceIds ?? []))];
    const map: Record<string, number> = {};
    ids.forEach((id, i) => { map[id] = i % SVC_COLORS.length; });
    return map;
  }, [calPeriods]);

  // Services offered by the selected period
  const periodServices = useMemo(() => {
    if (!selectedPeriod) return [];
    const ids = selectedPeriod.serviceIds;
    if (!ids || ids.length === 0) return allServices;
    return (allServices as any[]).filter((s: any) => ids.includes(s.id));
  }, [selectedPeriod, allServices]);

  // Legend: unique services across all service_block periods
  const legendServices = useMemo(() => {
    const map = new Map<string, string>();
    const svcById: Record<string, string> = {};
    (allServices as any[]).forEach((s: any) => { svcById[s.id] = s.name; });
    calPeriods
      .filter((p) => p.type === 'service_block')
      .forEach((p) => {
        (p.serviceIds ?? []).forEach((id) => {
          if (!map.has(id)) map.set(id, svcById[id] || id);
        });
      });
    return [...map.entries()];
  }, [calPeriods, allServices]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const periodMinTime = selectedPeriod ? fmtUTC(new Date(selectedPeriod.startTime)) : undefined;
  const periodMaxTime = selectedPeriod ? fmtUTC(new Date(selectedPeriod.endTime)) : undefined;

  const selectedService = form.serviceId
    ? (allServices as any[]).find((s: any) => s.id === form.serviceId)
    : null;
  const serviceDurationMin = selectedService
    ? (selectedService.durationMinutes || 0) + (selectedService.bufferMinutes || 0)
    : 0;
  const latestStart = selectedPeriod && serviceDurationMin > 0
    ? latestStartTime(selectedPeriod.endTime, serviceDurationMin)
    : periodMaxTime;

  const startTimeValid = form.startTime
    && isValidTime24(form.startTime)
    && isTimeInRange(form.startTime, periodMinTime, latestStart);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPeriod || !form.startTime || !selectedService) throw new Error('No time selected');
      const snapped = snapTo10min(normalizeTime24(form.startTime));
      if (!isTimeInRange(snapped, periodMinTime, latestStart)) {
        throw new Error(
          `Start time must be between ${periodMinTime} and ${latestStart} so the ${serviceDurationMin}-minute service fits in the period`,
        );
      }
      const startISO = toISO(dayStr, snapped);
      const payload: any = {
        employeeId,
        serviceId: form.serviceId,
        startTime: startISO,
      };
      if (form.customerId) payload.customerId = form.customerId;
      if (form.notes)       payload.notes       = form.notes;
      if (form.description) payload.description = form.description;
      const { data } = await api.post(`/businesses/${business!.id}/bookings`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
      setSelectedPeriod(null);
      setForm({ startTime: '', serviceId: '', customerId: '', notes: '', description: '' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return api.put(`/businesses/${business!.id}/bookings/${bookingId}/cancel`, { reason: cancelReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
      setShowCancel(null);
      setCancelReason('');
    },
  });

  // ── Period click handler ───────────────────────────────────────────────────

  const handlePeriodClick = useCallback((period: CalPeriod) => {
    if (period.type !== 'service_block') return;
    setSelectedPeriod(period);
    createMutation.reset();
    // Default start time = period start (HH:mm in UTC)
    const periodStartUTC = fmtUTC(new Date(period.startTime));
    const ids = period.serviceIds;
    setForm({
      startTime: periodStartUTC,
      serviceId: ids?.length === 1 ? ids[0] : '',
      customerId: '',
      notes: '',
      description: '',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-4">

      {/* ── Top toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-gray-400 text-sm">Select a provider and day to manage their schedule</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              className="input max-w-[200px]"
              value={employeeId}
              onChange={(e) => { setEmployeeId(e.target.value); setSelectedPeriod(null); }}
            >
              <option value="">Select provider...</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevDay} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${isToday ? 'bg-blue-600/20 text-blue-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-200'}`}>
              Today
            </button>
            <button onClick={nextDay} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <input
              type="date"
              className="input text-sm ml-1"
              value={dayStr}
              onChange={(e) => {
                const parsed = parsePickerDate(e.target.value);
                if (parsed) setDay(parsed);
              }}
            />
          </div>
        </div>
      </div>

      <p className="text-gray-300 font-medium -mt-2">{fmtDate(day)}</p>

      {/* ── Main area ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Calendar column ── */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Legend */}
          {(legendServices.length > 0 || calPeriods.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {legendServices.map(([id, name]) => {
                const c = SVC_COLORS[serviceColorMap[id] ?? 0];
                return (
                  <span key={id} className={`px-2 py-0.5 text-xs rounded-full border ${c.bg} ${c.border} ${c.text}`}>
                    {name}
                  </span>
                );
              })}
              {legendServices.length === 0 && calPeriods.some((p) => p.type === 'service_block') && (
                <span className="px-2 py-0.5 text-xs rounded-full border bg-blue-600/20 border-blue-500/40 text-blue-300">
                  Available (any service)
                </span>
              )}
              <span className="px-2 py-0.5 text-xs rounded-full border bg-orange-600/20 border-orange-500/50 text-orange-300">Booked</span>
              <span className="px-2 py-0.5 text-xs rounded-full border bg-gray-700/60 border-gray-500/70 text-gray-300">Blocked</span>
              <span className="px-2 py-0.5 text-xs rounded-full border bg-red-900/50 border-red-700/70 text-red-300">Unavailable</span>
            </div>
          )}

          {/* Calendar grid */}
          {!employeeId ? (
            <div className="card flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <Calendar className="w-14 h-14 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Select a service provider to view their schedule</p>
              </div>
            </div>
          ) : calLoading ? (
            <div className="card flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="card flex-1 overflow-y-auto p-0">
              <div className="flex min-h-full">
                {/* Time gutter */}
                <div className="w-14 shrink-0 relative" style={{ height: `${TOTAL_HOURS * PX_PER_HOUR}px` }}>
                  {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                    <div key={i} className="absolute w-full text-right pr-2" style={{ top: i * PX_PER_HOUR - 8 }}>
                      <span className="text-[10px] text-gray-500">
                        {String(HOUR_START + i).padStart(2, '0')}:00
                      </span>
                    </div>
                  ))}
                </div>

                {/* Events area */}
                <div
                  className="flex-1 relative border-l border-gray-800"
                  style={{ height: `${TOTAL_HOURS * PX_PER_HOUR}px` }}
                >
                  {/* Hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={i} className="absolute w-full border-t border-gray-800/60" style={{ top: i * PX_PER_HOUR }} />
                  ))}
                  {/* Half-hour lines */}
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={`h-${i}`} className="absolute w-full border-t border-gray-800/30 border-dashed" style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                  ))}

                  {/* Applied period blocks — background layer; labels rendered separately above bookings */}
                  {(() => {
                    const layout = computeLayout(calPeriods.map((p) => ({
                      id: p.id, startISO: p.startTime as string, endISO: p.endTime as string,
                    })));

                    const periodNodes = calPeriods.map((period) => {
                      const isServiceBlock = period.type === 'service_block';
                      const isBlocked      = period.type === 'blocked_time' || period.type === 'unavailable_block';
                      const isSelected     = selectedPeriod?.id === period.id;
                      const lay            = layout.get(period.id) ?? { col: 0, totalCols: 1 };

                      let color: typeof SVC_COLORS[0];
                      if (isBlocked) {
                        color = period.type === 'unavailable_block'
                          ? { bg: 'bg-red-900/60',  border: 'border-red-600/80',  text: 'text-red-200'  }
                          : { bg: 'bg-gray-700/70', border: 'border-gray-500/80', text: 'text-gray-200' };
                      } else if (period.serviceIds?.length) {
                        color = SVC_COLORS[serviceColorMap[period.serviceIds[0]] ?? 0];
                      } else {
                        color = { bg: 'bg-emerald-600/25', border: 'border-emerald-500/50', text: 'text-emerald-300' };
                      }

                      return (
                        <CalendarBlock
                          key={period.id}
                          startISO={period.startTime as string}
                          endISO={period.endTime as string}
                          color={color}
                          label=""
                          onClick={isServiceBlock ? () => handlePeriodClick(period) : undefined}
                          faded={isBlocked}
                          selected={isSelected}
                          col={lay.col}
                          totalCols={lay.totalCols}
                          showLabel={false}
                          zIndex={isBlocked ? 2 : 1}
                        />
                      );
                    });

                    const labelNodes = calPeriods.map((period) => {
                      const isBlocked = period.type === 'blocked_time' || period.type === 'unavailable_block';
                      const lay = layout.get(period.id) ?? { col: 0, totalCols: 1 };

                      let textClass: string;
                      if (isBlocked) {
                        textClass = period.type === 'unavailable_block' ? 'text-red-100' : 'text-gray-100';
                      } else if (period.serviceIds?.length) {
                        textClass = SVC_COLORS[serviceColorMap[period.serviceIds[0]] ?? 0].text;
                      } else {
                        textClass = 'text-emerald-200';
                      }

                      const svcNames = (period.serviceIds ?? [])
                        .map((id) => (allServices as any[]).find((s: any) => s.id === id)?.name)
                        .filter(Boolean);

                      const typeLabel = period.type === 'unavailable_block' ? 'Unavailable' : 'Blocked';
                      const label = isBlocked
                        ? (period.placeholderLabel || typeLabel)
                        : svcNames.length > 0
                          ? svcNames.join(' · ')
                          : period.placeholderLabel || 'Available';
                      const sublabel = `${fmtUTC(new Date(period.startTime))} – ${fmtUTC(new Date(period.endTime))}`;

                      return (
                        <PeriodLabelOverlay
                          key={`label-${period.id}`}
                          startISO={period.startTime as string}
                          endISO={period.endTime as string}
                          label={label}
                          sublabel={sublabel}
                          textClass={textClass}
                          col={lay.col}
                          totalCols={lay.totalCols}
                        />
                      );
                    });

                    return (
                      <>
                        {periodNodes}
                        {labelNodes}
                      </>
                    );
                  })()}

                  {/* Booking overlays — side-by-side when overlapping; cancelled blocks are click-through */}
                  {(() => {
                    const layout = computeLayout(bookings.map((b) => ({
                      id: b.id, startISO: b.startTime, endISO: b.endTime,
                    })));

                    const cancelledNodes = bookings
                      .filter((b) => b.status === 'cancelled')
                      .map((b) => {
                        const lay = layout.get(b.id) ?? { col: 0, totalCols: 1 };
                        return (
                          <CalendarBlock
                            key={b.id}
                            startISO={b.startTime}
                            endISO={b.endTime}
                            color={{ bg: 'bg-red-900/35', border: 'border-red-600/60', text: 'text-red-200' }}
                            label={bookingBlockLabel(b)}
                            sublabel={b.customer?.name || b.employee?.name || ''}
                            faded
                            pointerEventsNone
                            col={lay.col}
                            totalCols={lay.totalCols}
                            zIndex={5}
                          />
                        );
                      });

                    const activeNodes = bookings
                      .filter((b) => b.status !== 'cancelled')
                      .map((b) => {
                        const lay = layout.get(b.id) ?? { col: 0, totalCols: 1 };
                        return (
                          <CalendarBlock
                            key={b.id}
                            startISO={b.startTime}
                            endISO={b.endTime}
                            color={{ bg: 'bg-orange-600/30', border: 'border-orange-500/60', text: 'text-orange-200' }}
                            label={bookingBlockLabel(b)}
                            sublabel={b.customer?.name || b.employee?.name || ''}
                            col={lay.col}
                            totalCols={lay.totalCols}
                            zIndex={10}
                          />
                        );
                      });

                    return (
                      <>
                        {cancelledNodes}
                        {activeNodes}
                      </>
                    );
                  })()}

                  {calPeriods.length === 0 && bookings.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-600 text-sm">No schedule applied for this day</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: booking form ── */}
        <div className={`shrink-0 transition-all duration-300 ${selectedPeriod ? 'w-80' : 'w-0 overflow-hidden'}`}>
          {selectedPeriod && (
            <div className="card h-full flex flex-col border border-blue-500/30 w-80">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-base">New Booking</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Period: {fmtUTC(new Date(selectedPeriod.startTime))} – {fmtUTC(new Date(selectedPeriod.endTime))}
                  </p>
                </div>
                <button onClick={() => setSelectedPeriod(null)} className="text-gray-400 hover:text-white mt-0.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Period info */}
              {(() => {
                const repId = selectedPeriod.serviceIds?.[0] ?? null;
                const panelColor = repId
                  ? `${SVC_COLORS[serviceColorMap[repId] ?? 0].bg} ${SVC_COLORS[serviceColorMap[repId] ?? 0].border} ${SVC_COLORS[serviceColorMap[repId] ?? 0].text}`
                  : 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300';
                const svcNames = (selectedPeriod.serviceIds ?? [])
                  .map((id) => (allServices as any[]).find((s: any) => s.id === id)?.name)
                  .filter(Boolean);
                const label = svcNames.length > 0 ? svcNames.join(', ') : 'Any service';
                return (
                  <div className={`px-3 py-2 rounded-lg text-xs mb-4 border ${panelColor}`}>
                    <p className="font-medium">{label}</p>
                    <p className="opacity-70 mt-0.5">Slot available</p>
                    {selectedPeriod.placeholderLabel && (
                      <p className="opacity-60 mt-0.5">{selectedPeriod.placeholderLabel}</p>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3 flex-1">

                {/* Start time within the period */}
                <div>
                  <label className="label">
                    Start Time <span className="text-gray-500 text-[10px]">(within the period, 24h)</span>
                  </label>
                  <TimeInput
                    value={form.startTime}
                    min={periodMinTime}
                    max={latestStart}
                    onChange={(v) => setForm({ ...form, startTime: v })}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Snapped to 10-min intervals. Period: {periodMinTime} – {periodMaxTime}
                    {selectedService && serviceDurationMin > 0 && (
                      <>
                        {' · '}
                        {selectedService.name} ({serviceDurationMin} min) must end by {periodMaxTime}
                        {' · '}latest start: <span className="text-gray-400">{latestStart}</span>
                        {form.startTime && isValidTime24(form.startTime) && (
                          <> · ends at {bookingEndTime(snapTo10min(normalizeTime24(form.startTime)), serviceDurationMin)}</>
                        )}
                      </>
                    )}
                  </p>
                  {form.startTime && isValidTime24(form.startTime) && latestStart
                    && timeToMinutes(normalizeTime24(form.startTime)) > timeToMinutes(latestStart) && (
                    <p className="text-[10px] text-red-400 mt-1">
                      This start time is too late — the service would run past the period end ({periodMaxTime}).
                    </p>
                  )}
                </div>

                {/* Service */}
                <div>
                  <label className="label">Service</label>
                  {periodServices.length === 0 ? (
                    <p className="text-xs text-red-400 mt-1">No matching services found</p>
                  ) : (
                    <select
                      className="input"
                      value={form.serviceId}
                      onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    >
                      <option value="">Select service...</option>
                      {periodServices.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.durationMinutes}min)
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedPeriod.serviceIds?.length > 0 && periodServices.length < (allServices as any[]).length && (
                    <p className="text-[10px] text-gray-500 mt-1">Only services offered in this period are shown</p>
                  )}
                </div>

                {/* Customer */}
                <div>
                  <label className="label">Customer</label>
                  <select
                    className="input"
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  >
                    <option value="">Walk-in</option>
                    {customers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Notes</label>
                  <input
                    className="input text-sm"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Internal notes..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  <input
                    className="input text-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Booking description..."
                  />
                </div>
              </div>

              {createMutation.isError && (
                <div className="mt-3 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{(createMutation.error as any)?.response?.data?.message || 'Failed to create booking'}</span>
                </div>
              )}
              {createMutation.isSuccess && (
                <div className="mt-3 p-2.5 bg-green-600/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Booking created
                </div>
              )}

              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.serviceId || !startTimeValid || createMutation.isPending}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {createMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                  : 'Confirm Booking'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bookings list ── */}
      <div className="card mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            {employeeId
              ? `${employees.find((e: any) => e.id === employeeId)?.name ?? 'Provider'}'s Bookings`
              : 'All Bookings'} — {fmtDate(day)}
          </h2>
          <span className="text-xs text-gray-500">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
        </div>

        {showCancel && (
          <div className="mb-4 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
            <p className="text-sm font-medium text-red-400 mb-2">Cancel this booking?</p>
            <input
              className="input mb-2 text-sm"
              placeholder="Cancellation reason (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => cancelMutation.mutate(showCancel)}
                disabled={cancelMutation.isPending}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
              <button onClick={() => setShowCancel(null)} className="btn-secondary text-sm">Keep</button>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">No bookings for this day</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {bookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm truncate ${b.status === 'cancelled' ? 'text-red-300' : ''}`}>
                      {bookingBlockLabel(b)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.customer && <>{b.customer.name}</>}
                      {b.customer && b.employee && <> · </>}
                      {b.employee?.name}
                    </p>
                    {b.description && <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-300">{b.employee?.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] || 'bg-gray-600/10 text-gray-400'}`}>
                      {formatStatusLabel(b.status)}
                    </span>
                  </div>
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={() => setShowCancel(b.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
