'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseClinicLabUploadSearchParams } from '@/lib/clinic-lab-upload-nav';
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
import { formatDateDisplay, formatTimeDisplay, formatTimeRangeDisplay, getTodayDateKey, toDateKey, parseDateKey, todayDateAnchor, addCalendarDays } from '@/lib/date-format';
import { DatePicker } from '@/components/ui/date-picker';
import { isValidTime24, isTimeInRange, normalizeTime24, timeToMinutes } from '@/lib/time-format';
import { TimeInput } from '@/components/time-input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOperationalEvents } from '@/lib/use-operational-events';
import { BookingDetailPanel } from '@/components/bookings/booking-detail-panel';
import { StaffBookingTaxPreview } from '@/components/bookings/staff-booking-tax-preview';
import { CustomerSelect } from '@/components/customers/customer-select';
import { formatStatusLabel, STATUS_BADGE, formatBookingBlockHeadline, formatBookingBlockSublabel } from '@/lib/booking-types';
import { unwrapBusinessApiPayload } from '@/lib/business-query';
import { useI18n } from '@/i18n';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AiContextualSuggestions } from '@/components/ai-proactive-suggestions';
import { AiSuggestionsStack } from '@/components/ai-suggestion-collapsible';
import { DashboardPageShell, DashboardPageToolbar } from '@/components/dashboard/dashboard-page-shell';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
import { StylishChoice } from '@/components/ui/radio-choice';
import type { EmployeeRecord } from '@/lib/employee-types';
import { getErrorMessage } from '@/lib/error-message';

interface ServiceCatalogItem {
  id: string;
  name: string;
  durationMinutes?: number;
  bufferMinutes?: number;
}

interface CreateBookingPayload {
  employeeId: string;
  serviceId: string;
  customerId: string;
  startTime: string;
  notes?: string;
  description?: string;
  useSubscriptionId?: string;
}

// ─── Calendar constants ───────────────────────────────────────────────────────

const HOUR_START = 7;
const HOUR_END   = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 64;
const TOTAL_MINUTES = TOTAL_HOURS * 60;

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
  /** ISO timestamp from API — used as optimistic-concurrency token on cancel. */
  updatedAt?: string;
  notes?: string;
  description?: string;
  cancellationReason?: string;
  packagePurchaseId?: string | null;
  multiServiceGroupId?: string | null;
  metadata?: {
    packageName?: string;
    packageId?: string;
    packagePurchaseId?: string;
    groupLabel?: string;
    multiServiceGroupId?: string;
    payAtVenue?: boolean;
    paymentMethod?: string;
    pricing?: { amountDue?: number; taxAmount?: number };
    amountPaid?: number;
  };
  service?: { id: string; name: string; durationMinutes?: number; price?: number; currency?: string };
  employee?: { id: string; name: string };
  customer?: { id: string; name: string; email?: string; phone?: string };
}

function bookingBlockLabel(b: BookingItem) {
  return formatBookingBlockHeadline(b);
}

function bookingBlockSublabel(b: BookingItem) {
  return formatBookingBlockSublabel(b);
}

function openBookingDetail(
  bookingId: string,
  setSelectedBookingId: (id: string) => void,
  setSelectedPeriod: (period: CalPeriod | null) => void,
) {
  setSelectedPeriod(null);
  setSelectedBookingId(bookingId);
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
  const minDurationForLabel = isCompact ? 6 : 12;
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
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient  = useQueryClient();

  const refreshScheduleData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
    queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
  }, [queryClient]);

  const onOperationalEvent = useCallback(
    (type: string) => {
      if (
        type === 'appointment.created' ||
        type === 'availability.updated' ||
        type === 'booking.created' ||
        type === 'booking.updated' ||
        type === 'booking.rescheduled' ||
        type === 'booking.cancelled' ||
        type === 'booking.completed'
      ) {
        refreshScheduleData();
        if (
          type === 'booking.updated' ||
          type === 'booking.rescheduled' ||
          type === 'booking.cancelled' ||
          type === 'booking.completed'
        ) {
          queryClient.invalidateQueries({ queryKey: ['booking'] });
        }
      }
    },
    [refreshScheduleData, queryClient],
  );

  useOperationalEvents(business?.id, onOperationalEvent);

  const [day, setDay]                       = useState(() => todayDateAnchor());
  const [employeeId, setEmployeeId]         = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<CalPeriod | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlBookingId = searchParams.get('bookingId');
  const labUploadParams = parseClinicLabUploadSearchParams(searchParams);
  const activeBookingId = urlBookingId ?? selectedBookingId;

  const [showCancel, setShowCancel]         = useState<string | null>(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [form, setForm] = useState({
    startTime: '',  // HH:mm within the period
    serviceId: '',
    customerId: '',
    notes: '',
    description: '',
  });
  const [useSubscriptionId, setUseSubscriptionId] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: businessProfile } = useQuery({
    queryKey: ['business-settings', business?.id],
    queryFn: async () => {
      if (!business?.id) return { settings: {}, timezone: undefined as string | undefined };
      const { data } = await api.get(`/businesses/${business.id}`);
      const record = unwrapBusinessApiPayload<{
        settings?: Record<string, unknown>;
        timezone?: string;
      }>(data);
      return {
        settings: record.settings ?? {},
        timezone: record.timezone ?? (business as { timezone?: string }).timezone,
      };
    },
    enabled: !!business?.id,
  });

  const scheduleTimeZone = businessProfile?.timezone;

  const dayStr = toDateKey(day, scheduleTimeZone);
  const isToday = dayStr === getTodayDateKey(scheduleTimeZone);

  const prevDay = useCallback(
    () => setDay((d) => addCalendarDays(d, -1, scheduleTimeZone)),
    [scheduleTimeZone],
  );
  const nextDay = useCallback(
    () => setDay((d) => addCalendarDays(d, 1, scheduleTimeZone)),
    [scheduleTimeZone],
  );
  const goToday = useCallback(
    () => setDay(todayDateAnchor(scheduleTimeZone)),
    [scheduleTimeZone],
  );

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

  useEffect(() => {
    if (employeeId || employees.length === 0) return;
    const first = employees[0] as EmployeeRecord;
    if (first?.id) queueMicrotask(() => setEmployeeId(first.id));
  }, [employees, employeeId]);

  // Provider-calendar: returns whole applied period blocks (not micro-slots)
  const { data: calData, isPending: calPending } = useQuery({
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
  const calInitialLoading = calPending && calData === undefined;

  const { data: bookingsRaw = [] } = useQuery({
    queryKey: ['bookings', business?.id, dayStr, employeeId],
    queryFn: async () => {
      if (!business?.id) return [];
      const params: { date: string; employeeId?: string } = { date: dayStr };
      if (employeeId) params.employeeId = employeeId;
      const { data } = await api.get(`/businesses/${business.id}/bookings`, { params });
      return (data.data || data || []) as BookingItem[];
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
  const periodServices = useMemo((): ServiceCatalogItem[] => {
    if (!selectedPeriod) return [];
    const ids = selectedPeriod.serviceIds;
    const catalog = allServices as ServiceCatalogItem[];
    if (!ids || ids.length === 0) return catalog;
    return catalog.filter((s) => ids.includes(s.id));
  }, [selectedPeriod, allServices]);

  // Legend: unique services across all service_block periods
  const legendServices = useMemo(() => {
    const map = new Map<string, string>();
    const svcById: Record<string, string> = {};
    (allServices as ServiceCatalogItem[]).forEach((s) => { svcById[s.id] = s.name; });
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
    ? (allServices as ServiceCatalogItem[]).find((s) => s.id === form.serviceId)
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

  const { data: activeSubscription } = useQuery({
    queryKey: ['active-subscription', business?.id, form.customerId, form.serviceId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${business!.id}/subscriptions/customer/${form.customerId}/active`,
        { params: { serviceId: form.serviceId } },
      );
      const res = (data as { data?: { subscription?: { id: string; appointmentsRemaining: number } } })?.data ?? data;
      return (res as { subscription?: { id: string; appointmentsRemaining: number } }).subscription ?? null;
    },
    enabled: !!business?.id && !!form.customerId && !!form.serviceId,
  });

  useEffect(() => {
    queueMicrotask(() => {
      if (activeSubscription?.id) {
        setUseSubscriptionId(activeSubscription.id);
      } else {
        setUseSubscriptionId(null);
      }
    });
  }, [activeSubscription?.id]);

  const [formResetKey, setFormResetKey] = useState(0);

  const { data: staffBookingQuote } = useQuery({
    queryKey: ['staff-booking-quote', business?.id, form.serviceId],
    queryFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/bookings/quote`, {
        serviceId: form.serviceId,
      });
      return unwrapBusinessApiPayload(data) as {
        subtotal: number;
        amountDue: number;
        taxEnabled?: boolean;
        taxName?: string | null;
        taxRate?: number | null;
        taxModel?: 'inclusive' | 'exclusive' | null;
        taxAmount?: number;
        taxRules?: Array<{ id: string; name: string; rate: number; amount: number }>;
        currency: string;
      };
    },
    enabled: !!business?.id && !!form.serviceId && !useSubscriptionId,
  });

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
      if (!form.customerId) throw new Error('Select a customer');
      const payload: CreateBookingPayload = {
        employeeId,
        serviceId: form.serviceId,
        customerId: form.customerId,
        startTime: startISO,
      };
      if (form.notes)       payload.notes       = form.notes;
      if (form.description) payload.description = form.description;
      if (useSubscriptionId) payload.useSubscriptionId = useSubscriptionId;
      const { data } = await api.post(`/businesses/${business!.id}/bookings`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
      setSelectedPeriod(null);
      setForm({ startTime: '', serviceId: '', customerId: '', notes: '', description: '' });
      setUseSubscriptionId(null);
      setFormResetKey((k) => k + 1);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // e2e-bug.165 — always send last-fetched updatedAt so concurrent edits
      // surface BOOKING_VERSION_CONFLICT instead of silently clobbering.
      const booking = bookings.find((b) => b.id === bookingId);
      return api.put(`/businesses/${business!.id}/bookings/${bookingId}/cancel`, {
        reason: cancelReason,
        ...(booking?.updatedAt ? { expectedUpdatedAt: booking.updatedAt } : {}),
      });
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
    setSelectedBookingId(null);
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
    setFormResetKey((k) => k + 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-4">
      <DashboardPageShell
        ai={
          <AiSuggestionsStack>
            <AiContextualSuggestions
              context={{
                route: '/dashboard/bookings',
                employeeName: employees.find((e: EmployeeRecord) => e.id === employeeId)?.name,
                date: dayStr,
              }}
              title={t('bookings.aiInsightsTitle')}
            />
            <AiPagePanel
              suggestions={AI_PAGE_SUGGESTIONS['/dashboard/bookings']}
              context={{
                route: '/dashboard/bookings',
                employeeName: employees.find((e: EmployeeRecord) => e.id === employeeId)?.name,
                date: dayStr,
              }}
            />
          </AiSuggestionsStack>
        }
      >
        <DashboardPageToolbar
          title={t('bookings.title')}
          subtitle={t('bookings.subtitle')}
          meta={<p className="font-medium text-gray-300">{fmtDate(day)}</p>}
          actions={
            <>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 shrink-0 text-gray-400" />
                <select
                  className="input max-w-[200px]"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setSelectedPeriod(null);
                  }}
                >
                  <option value="">{t('bookings.selectProvider')}</option>
                  {employees.map((emp: EmployeeRecord) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevDay}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToday}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isToday ? 'bg-blue-600/20 text-blue-300' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {t('common.today')}
                </button>
                <button
                  onClick={nextDay}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <DatePicker
                  variant="compact"
                  className="ml-1"
                  value={dayStr}
                  onChange={(next) => {
                    const parsed = parseDateKey(next);
                    if (parsed) setDay(parsed);
                  }}
                />
              </div>
            </>
          }
        />
      </DashboardPageShell>

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
                  {t('common.available')} ({t('bookings.anyService')})
                </span>
              )}
              <span className="px-2 py-0.5 text-xs rounded-full border bg-orange-600/20 border-orange-500/50 text-orange-300">{t('bookings.legendBooked')}</span>
              <span className="px-2 py-0.5 text-xs rounded-full border bg-gray-700/60 border-gray-500/70 text-gray-300">{t('bookings.legendBlocked')}</span>
              <span className="px-2 py-0.5 text-xs rounded-full border bg-red-900/50 border-red-700/70 text-red-300">{t('bookings.legendUnavailable')}</span>
            </div>
          )}

          {/* Calendar grid */}
          {!employeeId ? (
            <div className="card flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <Calendar className="w-14 h-14 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">{t('bookings.selectProviderEmpty')}</p>
              </div>
            </div>
          ) : calInitialLoading ? (
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
                        .map((id) => (allServices as ServiceCatalogItem[]).find((s) => s.id === id)?.name)
                        .filter(Boolean);

                      const typeLabel = period.type === 'unavailable_block' ? t('common.unavailable') : t('common.blocked');
                      const label = isBlocked
                        ? (period.placeholderLabel || typeLabel)
                        : svcNames.length > 0
                          ? svcNames.join(' · ')
                          : period.placeholderLabel || t('common.available');
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
                            sublabel={bookingBlockSublabel(b)}
                            onClick={() => openBookingDetail(b.id, setSelectedBookingId, setSelectedPeriod)}
                            faded
                            selected={activeBookingId === b.id}
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
                            sublabel={bookingBlockSublabel(b)}
                            onClick={() => openBookingDetail(b.id, setSelectedBookingId, setSelectedPeriod)}
                            selected={activeBookingId === b.id}
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
                      <p className="text-gray-600 text-sm">{t('bookings.noScheduleDay')}</p>
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
                  <h3 className="font-semibold text-base">{t('bookings.newBookingTitle')}</h3>
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
                  .map((id) => (allServices as ServiceCatalogItem[]).find((s) => s.id === id)?.name)
                  .filter(Boolean);
                const label = svcNames.length > 0 ? svcNames.join(', ') : t('bookings.anyService');
                return (
                  <div className={`px-3 py-2 rounded-lg text-xs mb-4 border ${panelColor}`}>
                    <p className="font-medium">{label}</p>
                    <p className="opacity-70 mt-0.5">{t('bookings.slotAvailable')}</p>
                    {selectedPeriod.placeholderLabel && (
                      <p className="opacity-60 mt-0.5">{selectedPeriod.placeholderLabel}</p>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-3 flex-1">

                {/* Service provider */}
                <div>
                  <label className="label">{t('bookings.provider')}</label>
                  <div className="input bg-gray-900/60 text-gray-200 cursor-default">
                    {employees.find((emp: EmployeeRecord) => emp.id === employeeId)?.name ?? t('bookings.unknownProvider')}
                  </div>
                </div>

                {/* Service */}
                <div>
                  <label className="label">{t('bookings.service')}</label>
                  {periodServices.length === 0 ? (
                    <p className="text-xs text-red-400 mt-1">{t('bookings.noMatchingServices')}</p>
                  ) : (
                    <select
                      className="input"
                      value={form.serviceId}
                      onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    >
                      <option value="">{t('bookings.selectService')}</option>
                      {periodServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.durationMinutes}min)
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedPeriod.serviceIds?.length > 0 && periodServices.length < (allServices as ServiceCatalogItem[]).length && (
                    <p className="text-[10px] text-gray-500 mt-1">{t('bookings.servicesInPeriodHint')}</p>
                  )}
                </div>

                {/* Customer */}
                <div>
                  <label className="label">{t('bookings.customer')}</label>
                  {business?.id ? (
                    <CustomerSelect
                      key={`${selectedPeriod.id}-${formResetKey}`}
                      businessId={business.id}
                      value={form.customerId}
                      onChange={(customerId) => setForm({ ...form, customerId })}
                      required
                      searchPlaceholder={t('customers.searchPlaceholder')}
                    />
                  ) : null}
                </div>

                {activeSubscription && activeSubscription.appointmentsRemaining > 0 && (
                  <div className="rounded-lg border border-emerald-800/40 bg-emerald-900/10 p-3">
                    <StylishChoice
                      type="checkbox"
                      checked={useSubscriptionId === activeSubscription.id}
                      onChange={(checked) =>
                        setUseSubscriptionId(checked ? activeSubscription.id : null)
                      }
                      label={
                        <>
                          Use subscription credit ({activeSubscription.appointmentsRemaining} visits
                          remaining) — no service charge
                        </>
                      }
                      labelClassName="text-sm"
                    />
                  </div>
                )}

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

                {/* Notes */}
                <div>
                  <label className="label">{t('common.notes')}</label>
                  <input
                    className="input text-sm"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={t('bookings.internalNotesPlaceholder')}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">{t('common.description')}</label>
                  <input
                    className="input text-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={t('bookings.bookingDescriptionPlaceholder')}
                  />
                </div>
              </div>

              {staffBookingQuote && !useSubscriptionId && (
                <div className="mt-4">
                  <StaffBookingTaxPreview
                    quote={staffBookingQuote}
                    labels={{
                      subtotal: t('appointments.paymentChargedAmount'),
                      totalDue: t('public.totalDue'),
                      taxIncluded: t('public.taxIncluded'),
                    }}
                  />
                </div>
              )}

              {createMutation.isError && (
                <div className="mt-3 p-2.5 bg-red-600/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{getErrorMessage(createMutation.error, t('bookings.createFailed'))}</span>
                </div>
              )}
              {createMutation.isSuccess && (
                <div className="mt-3 p-2.5 bg-green-600/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('bookings.bookingCreated')}
                </div>
              )}

              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.serviceId || !form.customerId || !startTimeValid || createMutation.isPending}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {createMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('bookings.bookingCreating')}</>
                  : t('bookings.confirmBookingAction')}
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
              ? t('bookings.providerBookings').replace(
                  '{name}',
                  employees.find((e: EmployeeRecord) => e.id === employeeId)?.name ?? t('common.provider'),
                )
              : t('bookings.allBookings')}{' '}
            — {fmtDate(day)}
          </h2>
          <span className="text-xs text-gray-500">
            {t('bookings.bookingsCount').replace('{count}', String(bookings.length))}
          </span>
        </div>

        {showCancel && (
          <div className="mb-4 p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
            <p className="text-sm font-medium text-red-400 mb-2">{t('bookings.cancelDialogTitle')}</p>
            <input
              className="input mb-2 text-sm"
              placeholder={t('bookings.cancellationReasonPlaceholder')}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => cancelMutation.mutate(showCancel)}
                disabled={cancelMutation.isPending}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
              >
                {cancelMutation.isPending ? t('common.confirmingCancel') : t('common.confirmCancel')}
              </button>
              <button onClick={() => setShowCancel(null)} className="btn-secondary text-sm">{t('common.keep')}</button>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-6">{t('bookings.emptyDay')}</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {bookings.map((b) => (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => openBookingDetail(b.id, setSelectedBookingId, setSelectedPeriod)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookingDetail(b.id, setSelectedBookingId, setSelectedPeriod);
                  }
                }}
                className={`py-3 flex items-center justify-between gap-3 cursor-pointer rounded-lg px-2 -mx-2 transition-colors hover:bg-gray-800/50 ${
                  activeBookingId === b.id ? 'bg-gray-800/70 ring-1 ring-blue-500/40' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium text-sm truncate ${b.status === 'cancelled' ? 'text-red-300' : ''}`}>
                      {bookingBlockLabel(b)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {bookingBlockSublabel(b)}
                    </p>
                    {b.description && <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCancel(b.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                      title={t('bookings.cancelBooking')}
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

      {business?.id && (
        <BookingDetailPanel
          businessId={business.id}
          bookingId={activeBookingId}
          onClose={() => setSelectedBookingId(null)}
          labInitialTab={labUploadParams.labTab ?? undefined}
          labHighlightOrderId={labUploadParams.orderId}
          labUploadResultRequested={labUploadParams.uploadResult}
        />
      )}
    </div>
  );
}
