'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  Info,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatWeekdayShortByDayIndex,
  getTodayDateKey,
  toDateKey,
  todayDateAnchor,
} from '@/lib/date-format';
import { useI18n } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AiContextualSuggestions } from '@/components/ai-proactive-suggestions';
import { AiSuggestionsStack } from '@/components/ai-suggestion-collapsible';
import { DashboardPageShell, DashboardPageToolbar } from '@/components/dashboard/dashboard-page-shell';
import { AI_PAGE_SUGGESTIONS } from '@/lib/ai-orchestration';
import { AiCalendarSelectionBar, type CalendarSelection } from '@/components/ai-calendar-selection-bar';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 7;   // 07:00
const HOUR_END = 22;    // 22:00
const HOUR_HEIGHT = 60; // px per hour

type StatusStyle = { bg: string; border: string; text: string; label: string };

function getStatusStyles(t: (key: string) => string): Record<string, StatusStyle> {
  return {
    available: { bg: 'bg-emerald-600/25', border: 'border-emerald-500/60', text: 'text-emerald-300', label: t('calendarPage.statusAvailable') },
    booked: { bg: 'bg-orange-600/25', border: 'border-orange-500/60', text: 'text-orange-300', label: t('calendarPage.statusBooked') },
    blocked: { bg: 'bg-gray-700/50', border: 'border-gray-600/60', text: 'text-gray-400', label: t('calendarPage.statusBlocked') },
    unavailable: { bg: 'bg-gray-800/60', border: 'border-gray-700/60', text: 'text-gray-500', label: t('calendarPage.statusUnavailable') },
  };
}

// Distinct palette for services (cycles if >10 services)
const SERVICE_COLORS = [
  'bg-blue-600/25 border-blue-500/60 text-blue-300',
  'bg-violet-600/25 border-violet-500/60 text-violet-300',
  'bg-pink-600/25 border-pink-500/60 text-pink-300',
  'bg-cyan-600/25 border-cyan-500/60 text-cyan-300',
  'bg-yellow-600/25 border-yellow-500/60 text-yellow-300',
  'bg-teal-600/25 border-teal-500/60 text-teal-300',
  'bg-rose-600/25 border-rose-500/60 text-rose-300',
  'bg-indigo-600/25 border-indigo-500/60 text-indigo-300',
  'bg-lime-600/25 border-lime-500/60 text-lime-300',
  'bg-fuchsia-600/25 border-fuchsia-500/60 text-fuchsia-300',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(anchor: Date): Date[] {
  const monday = new Date(anchor);
  const day = monday.getDay();
  // shift to Monday
  monday.setDate(monday.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function dateKey(d: Date) {
  return toDateKey(d);
}

function toMinutes(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function formatTime(date: Date) {
  return formatTimeDisplay(date);
}

const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;

// ─── Slot Block component ─────────────────────────────────────────────────────

interface SlotInfo {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceId: string | null;
  serviceName: string | null;
  employeeName: string | null;
  appointmentCount: number;
  maxAppointmentCount: number;
  placeholderLabel: string | null;
}

function SlotBlock({
  slot,
  serviceColorMap,
  statusStyles,
  onClick,
}: {
  slot: SlotInfo;
  serviceColorMap: Record<string, string>;
  statusStyles: Record<string, StatusStyle>;
  onClick: (s: SlotInfo) => void;
}) {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);

  const startMin = toMinutes(start) - HOUR_START * 60;
  const endMin = toMinutes(end) - HOUR_START * 60;
  const topPct = (startMin / TOTAL_MINUTES) * 100;
  const heightPct = Math.max(((endMin - startMin) / TOTAL_MINUTES) * 100, 0.5);

  // Available slots colored by service; others use status colors
  let colorClass: string;
  if (slot.status === 'available' && slot.serviceId) {
    colorClass = serviceColorMap[slot.serviceId] || SERVICE_COLORS[0];
  } else {
    const s = statusStyles[slot.status] || statusStyles.unavailable;
    colorClass = `${s.bg} ${s.border} ${s.text}`;
  }

  const durationMin = endMin - startMin;

  return (
    <div
      data-slot-block
      className={`absolute left-0.5 right-0.5 rounded border ${colorClass} cursor-pointer hover:brightness-110 transition-all overflow-hidden`}
      style={{ top: `${topPct}%`, height: `${heightPct}%`, minHeight: '10px' }}
      onClick={() => onClick(slot)}
    >
      {durationMin >= 8 && (
        <div className="px-1 py-0.5 leading-tight">
          <p className="text-[10px] font-semibold truncate">
            {slot.serviceName || slot.placeholderLabel || slot.status}
          </p>
          {durationMin >= 16 && (
            <p className="text-[9px] opacity-70 truncate">{formatTime(start)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function yToMinutes(clientY: number, rectTop: number): number {
  const y = clientY - rectTop;
  const raw = HOUR_START * 60 + (y / HOUR_HEIGHT) * 60;
  const snapped = Math.round(raw / 15) * 15;
  return Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, snapped));
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const statusStyles = useMemo(() => getStatusStyles(t), [t]);
  const { business } = useAuthStore();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [employeeId, setEmployeeId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [dragSelection, setDragSelection] = useState<CalendarSelection | null>(null);
  const dragRef = useRef<{ dayKey: string; startMin: number; endMin: number } | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate]);
  const startDate = dateKey(weekDates[0]);
  const endDate = dateKey(weekDates[6]);

  // ── Queries ───
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/employees`);
      return data.data || data || [];
    },
    enabled: !!business?.id,
  });

  const selectedEmployee = employees.find((e: { id: string; name: string }) => e.id === employeeId);

  const finalizeDragSelection = useCallback(
    (dayKey: string, startMin: number, endMin: number) => {
      if (!employeeId || !selectedEmployee) return;
      const lo = Math.min(startMin, endMin);
      const hi = Math.max(startMin, endMin);
      if (hi - lo < 15) return;
      setDragSelection({
        date: dayKey,
        timeFrom: minutesToTime(lo),
        timeTo: minutesToTime(hi),
        employeeName: selectedEmployee.name,
        employeeId,
      });
    },
    [employeeId, selectedEmployee],
  );

  const handleDayMouseDown = (dayKey: string, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-slot-block]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startMin = yToMinutes(e.clientY, rect.top);
    dragRef.current = { dayKey, startMin, endMin: startMin };
  };

  const handleDayMouseMove = (dayKey: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.dayKey !== dayKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current.endMin = yToMinutes(e.clientY, rect.top);
    const { startMin, endMin } = dragRef.current;
    finalizeDragSelection(dayKey, startMin, endMin);
  };

  const handleDayMouseUp = (dayKey: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.dayKey !== dayKey) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const endMin = yToMinutes(e.clientY, rect.top);
    finalizeDragSelection(dayKey, dragRef.current.startMin, endMin);
    dragRef.current = null;
  };

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['provider-calendar', business?.id, employeeId, startDate, endDate],
    queryFn: async () => {
      if (!business?.id || !employeeId) return { slots: [] };
      const { data } = await api.get(`/businesses/${business.id}/schedules/provider-calendar`, {
        params: { employeeId, startDate, endDate },
      });
      return data.data || data;
    },
    enabled: !!business?.id && !!employeeId,
  });

  const slots: SlotInfo[] = calendarData?.slots || [];

  // Group slots by date key
  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotInfo[]> = {};
    for (const s of slots) {
      const k = new Date(s.startTime).toISOString().split('T')[0];
      if (!map[k]) map[k] = [];
      map[k].push(s);
    }
    return map;
  }, [slots]);

  // Build service → color mapping (stable across renders)
  const serviceColorMap = useMemo(() => {
    const serviceIds = [...new Set(slots.map((s) => s.serviceId).filter(Boolean))] as string[];
    const map: Record<string, string> = {};
    serviceIds.forEach((id, i) => { map[id] = SERVICE_COLORS[i % SERVICE_COLORS.length]; });
    return map;
  }, [slots]);

  // Legend: unique services in view
  const servicesInView = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of slots) {
      if (s.serviceId && s.serviceName && !seen.has(s.serviceId)) {
        seen.set(s.serviceId, s.serviceName);
      }
    }
    return [...seen.entries()];
  }, [slots]);

  const prevWeek = () => { const d = new Date(anchorDate); d.setDate(d.getDate() - 7); setAnchorDate(d); };
  const nextWeek = () => { const d = new Date(anchorDate); d.setDate(d.getDate() + 7); setAnchorDate(d); };
  const goToday = () => setAnchorDate(todayDateAnchor());

  const today = getTodayDateKey();
  const totalHours = HOUR_END - HOUR_START;

  return (
    <div className="flex h-full flex-col gap-4">
      <DashboardPageShell
        className="shrink-0"
        ai={
          <AiSuggestionsStack>
            <AiContextualSuggestions
              context={{
                route: '/dashboard/calendar',
                employeeName: employees.find((e: { id: string; name: string }) => e.id === employeeId)?.name ?? null,
                viewMode: 'week',
              }}
              title={t('calendarPage.aiInsightsTitle')}
            />
            <AiPagePanel
              suggestions={AI_PAGE_SUGGESTIONS['/dashboard/calendar']}
              context={{
                route: '/dashboard/calendar',
                employeeName: selectedEmployee?.name ?? null,
                dateFrom: formatDateDisplay(weekDates[0], locale),
                dateTo: formatDateDisplay(weekDates[6], locale),
                viewMode: 'week',
                ...(dragSelection
                  ? {
                      selectionDate: dragSelection.date,
                      selectionTimeFrom: dragSelection.timeFrom,
                      selectionTimeTo: dragSelection.timeTo,
                      selectionEmployeeId: dragSelection.employeeId,
                      date: dragSelection.date,
                      timeFrom: dragSelection.timeFrom,
                      timeTo: dragSelection.timeTo,
                    }
                  : {}),
              }}
            />
          </AiSuggestionsStack>
        }
      >
        <DashboardPageToolbar
          helpTopicId="calendar"
          title={
            <>
              <CalendarDays className="h-6 w-6 text-blue-400" />
              {t('calendarPage.title')}
            </>
          }
          subtitle={t('calendarPage.subtitle')}
          actions={
            <>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevWeek}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToday}
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-gray-700"
                >
                  {t('common.today')}
                </button>
                <button
                  onClick={nextWeek}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="ml-2 text-sm font-medium text-gray-300">
                  {formatDateDisplay(weekDates[0], locale)}
                  {' – '}
                  {formatDateDisplay(weekDates[6], locale)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <select
                  className="input max-w-xs"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  <option value="">{t('calendarPage.selectProvider')}</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          }
        />
      </DashboardPageShell>

      {/* Legend */}
      {servicesInView.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {servicesInView.map(([id, name]) => (
            <span key={id} className={`px-2 py-1 rounded-full text-xs border ${serviceColorMap[id]}`}>
              {name}
            </span>
          ))}
          {Object.entries(statusStyles).slice(1).map(([key, s]) => (
            <span key={key} className={`px-2 py-1 rounded-full text-xs border ${s.bg} ${s.border} ${s.text}`}>
              {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!employeeId && (
        <div className="flex-1 flex items-center justify-center card">
          <div className="text-center py-16">
            <CalendarDays className="w-14 h-14 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">{t('calendarPage.selectProviderEmpty')}</p>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      {employeeId && (
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex min-w-[700px]" ref={gridRef}>
              {/* Time gutter */}
              <div className="w-14 shrink-0 relative" style={{ height: `${totalHours * HOUR_HEIGHT}px` }}>
                {Array.from({ length: totalHours + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full text-right pr-2"
                    style={{ top: `${i * HOUR_HEIGHT - 8}px` }}
                  >
                    <span className="text-[10px] text-gray-500">
                      {String(HOUR_START + i).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((day) => {
                const key = dateKey(day);
                const daySlots = slotsByDate[key] || [];
                const isToday = key === today;

                return (
                  <div key={key} className="flex-1 min-w-0 border-l border-gray-800 first:border-l-0">
                    {/* Day header */}
                    <div
                      className={`sticky top-0 z-10 py-2 text-center border-b border-gray-800 ${
                        isToday ? 'bg-blue-600/10' : 'bg-gray-950'
                      }`}
                    >
                      <p className={`text-xs font-medium ${isToday ? 'text-blue-400' : 'text-gray-400'}`}>
                        {formatWeekdayShortByDayIndex(day.getUTCDay(), locale)}
                      </p>
                      <p className={`text-sm font-bold ${isToday ? 'text-blue-300' : 'text-gray-200'}`}>
                        {formatDateDisplay(day, locale)}
                      </p>
                    </div>

                    {/* Hour grid */}
                    <div
                      className="relative select-none cursor-crosshair"
                      style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
                      onMouseDown={(e) => handleDayMouseDown(key, e)}
                      onMouseMove={(e) => handleDayMouseMove(key, e)}
                      onMouseUp={(e) => handleDayMouseUp(key, e)}
                      onMouseLeave={() => {
                        if (dragRef.current?.dayKey === key) dragRef.current = null;
                      }}
                    >
                      {/* Hour lines */}
                      {Array.from({ length: totalHours }, (_, i) => (
                        <div
                          key={i}
                          className="absolute w-full border-t border-gray-800/50 pointer-events-none"
                          style={{ top: `${i * HOUR_HEIGHT}px` }}
                        />
                      ))}

                      {dragSelection?.date === key && (
                        <div
                          className="absolute left-0.5 right-0.5 rounded border border-violet-400/60 bg-violet-500/15 pointer-events-none z-10"
                          style={{
                            top: `${((parseInt(dragSelection.timeFrom.split(':')[0], 10) * 60 + parseInt(dragSelection.timeFrom.split(':')[1], 10) - HOUR_START * 60) / TOTAL_MINUTES) * 100}%`,
                            height: `${((parseInt(dragSelection.timeTo.split(':')[0], 10) * 60 + parseInt(dragSelection.timeTo.split(':')[1], 10) - parseInt(dragSelection.timeFrom.split(':')[0], 10) * 60 - parseInt(dragSelection.timeFrom.split(':')[1], 10)) / TOTAL_MINUTES) * 100}%`,
                            minHeight: '8px',
                          }}
                        />
                      )}

                      {/* Slots */}
                      {daySlots.map((slot) => (
                        <SlotBlock
                          key={slot.id}
                          slot={slot}
                          serviceColorMap={serviceColorMap}
                          statusStyles={statusStyles}
                          onClick={setSelectedSlot}
                        />
                      ))}

                      {/* "No slots" indicator */}
                      {daySlots.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] text-gray-700">{t('calendarPage.noSchedule')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {dragSelection && employeeId && (
        <AiCalendarSelectionBar
          selection={dragSelection}
          onClear={() => setDragSelection(null)}
        />
      )}

      {/* Slot detail panel */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60" onClick={() => setSelectedSlot(null)}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                {t('calendarPage.slotDetails')}
              </h3>
              <button onClick={() => setSelectedSlot(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              <Row label={t('calendarPage.slotDate')}>
                {formatDateDisplay(new Date(selectedSlot.startTime), locale)}
              </Row>
              <Row label={t('calendarPage.slotTime')}>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(new Date(selectedSlot.startTime))} – {formatTime(new Date(selectedSlot.endTime))}
                </span>
              </Row>
              <Row label={t('calendarPage.slotStatus')}>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                  statusStyles[selectedSlot.status]
                    ? `${statusStyles[selectedSlot.status].bg} ${statusStyles[selectedSlot.status].border} ${statusStyles[selectedSlot.status].text}`
                    : ''
                }`}>
                  {statusStyles[selectedSlot.status]?.label || selectedSlot.status}
                </span>
              </Row>
              {selectedSlot.serviceName && (
                <Row label={t('calendarPage.slotService')}>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${
                    selectedSlot.serviceId ? serviceColorMap[selectedSlot.serviceId] || '' : ''
                  }`}>
                    {selectedSlot.serviceName}
                  </span>
                </Row>
              )}
              {selectedSlot.placeholderLabel && (
                <Row label={t('calendarPage.slotLabel')}>{selectedSlot.placeholderLabel}</Row>
              )}
              {selectedSlot.status === 'available' && (
                <Row label={t('calendarPage.slotCapacity')}>
                  {selectedSlot.appointmentCount} / {selectedSlot.maxAppointmentCount}{' '}
                  {t('common.booked').toLowerCase()}
                </Row>
              )}
              {selectedSlot.employeeName && (
                <Row label={t('calendarPage.slotProvider')}>{selectedSlot.employeeName}</Row>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <dt className="text-gray-500 w-20 shrink-0">{label}</dt>
      <dd className="text-gray-200">{children}</dd>
    </div>
  );
}
