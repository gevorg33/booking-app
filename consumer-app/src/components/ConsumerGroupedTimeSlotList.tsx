import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import {
  groupSlotsByTimeOfDay,
  type BookingTimeOfDayGroup,
} from '../lib/booking-slot-groups.util.js';

type Slot = { startTime: string };

type Props = {
  slots: Slot[];
  selectedStartTime: string | null;
  onSelect: (startTime: string) => void;
  copy: Pick<ConsumerCopy, 'timeSlotMorning' | 'timeSlotAfternoon' | 'timeSlotEvening' | 'noSlotsThisDay'>;
  formatSlotLabel: (startTime: string) => string;
  dayLevelTourHint?: string | null;
  primaryColor?: string;
};

function groupLabel(group: BookingTimeOfDayGroup, copy: Props['copy']): string {
  if (group === 'morning') return copy.timeSlotMorning;
  if (group === 'afternoon') return copy.timeSlotAfternoon;
  return copy.timeSlotEvening;
}

export function ConsumerGroupedTimeSlotList({
  slots,
  selectedStartTime,
  onSelect,
  copy,
  formatSlotLabel,
  dayLevelTourHint,
  primaryColor = '#3880ff',
}: Props) {
  if (slots.length === 0) {
    return <p className="ion-padding">{copy.noSlotsThisDay}</p>;
  }

  const groupedSlots = groupSlotsByTimeOfDay(slots);

  return (
    <div className="ion-margin-top">
      {dayLevelTourHint ? (
        <p style={{ padding: '0 16px', color: '#6b7280', fontSize: '0.875rem' }}>{dayLevelTourHint}</p>
      ) : null}
      {groupedSlots.map(({ group, slots: groupSlots }) => (
        <section key={group} style={{ marginBottom: 16 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#6b7280',
              margin: '0 16px 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {groupLabel(group, copy)}
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              padding: '0 16px',
            }}
          >
            {groupSlots.map((entry) => {
              const active = selectedStartTime === entry.startTime;
              return (
                <button
                  key={entry.startTime}
                  type="button"
                  onClick={() => onSelect(entry.startTime)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9999,
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    border: active ? '1px solid transparent' : '1px solid #e5e7eb',
                    background: active ? primaryColor : '#fff',
                    color: active ? '#fff' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  {formatSlotLabel(entry.startTime)}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
