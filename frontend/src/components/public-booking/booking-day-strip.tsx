'use client';

interface BookingDayOption {
  dateKey: string;
  weekday: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}

interface BookingDayStripProps {
  dayOptions: BookingDayOption[];
  selectedDateKey: string;
  onSelectDateKey: (dateKey: string) => void;
  primaryColor: string;
  todayLabel: string;
}

export function BookingDayStrip({
  dayOptions,
  selectedDateKey,
  onSelectDateKey,
  primaryColor,
  todayLabel,
}: BookingDayStripProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {dayOptions.map((day) => {
        const active = selectedDateKey === day.dateKey;
        return (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelectDateKey(day.dateKey)}
            className={`shrink-0 w-[4.5rem] py-3 rounded-2xl border text-center transition-colors ${
              active
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200'
            }`}
            style={active ? { backgroundColor: primaryColor } : undefined}
          >
            <span className="block text-xs font-medium opacity-90">
              {day.isToday ? todayLabel : day.weekday}
            </span>
            <span className="block text-lg font-bold leading-tight">{day.dayNum}</span>
            <span className="block text-xs opacity-80">{day.month}</span>
          </button>
        );
      })}
    </div>
  );
}

export type { BookingDayOption };
