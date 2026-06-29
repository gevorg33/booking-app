'use client';

import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { formatScheduleTime } from '@/lib/date-format';
import {
  groupSlotsByTimeOfDay,
  type BookingTimeOfDayGroup,
} from '@/lib/booking-slot-groups.util';

interface BookingTimeSlotGridProps {
  slots: Array<{ startTime: string }>;
  selectedStartTime: string | null;
  onSelectStartTime: (startTime: string) => void;
  primaryColor: string;
  loading?: boolean;
  error?: string | null;
  emptyLabel: string;
  heading: string;
}

function groupLabel(group: BookingTimeOfDayGroup, t: (key: string) => string): string {
  if (group === 'morning') return t('public.timeSlotMorning');
  if (group === 'afternoon') return t('public.timeSlotAfternoon');
  return t('public.timeSlotEvening');
}

export function BookingTimeSlotGrid({
  slots,
  selectedStartTime,
  onSelectStartTime,
  primaryColor,
  loading = false,
  error = null,
  emptyLabel,
  heading,
}: BookingTimeSlotGridProps) {
  const { t } = useI18n();
  const groupedSlots = groupSlotsByTimeOfDay(slots);

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium text-gray-500 mb-3">{heading}</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 py-4">{error}</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">{emptyLabel}</p>
      ) : (
        <div className="space-y-5">
          {groupedSlots.map(({ group, slots: groupSlots }) => (
            <div key={group}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {groupLabel(group, t)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {groupSlots.map((slot) => {
                  const active = selectedStartTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => onSelectStartTime(slot.startTime)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        active
                          ? 'text-white border-transparent'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                      }`}
                      style={active ? { backgroundColor: primaryColor } : undefined}
                    >
                      {formatScheduleTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
