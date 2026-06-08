import { IonButton, IonIcon } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '../lib/date-picker-calendar.util';
import { getTodayDateKey } from '../lib/date-format';
import { useI18n } from '../i18n';
import './provider-calendar-month.css';

export function ProviderCalendarMonth({
  selectedDate,
  onSelectDate,
  monthKey,
  onMonthKeyChange,
  appointmentCountsByDate,
}: {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  monthKey: string;
  onMonthKeyChange: (monthKey: string) => void;
  appointmentCountsByDate: Record<string, number>;
}) {
  const { t } = useI18n();
  const todayKey = getTodayDateKey();
  const weekdays = [
    t('datePicker.weekdays.mon'),
    t('datePicker.weekdays.tue'),
    t('datePicker.weekdays.wed'),
    t('datePicker.weekdays.thu'),
    t('datePicker.weekdays.fri'),
    t('datePicker.weekdays.sat'),
    t('datePicker.weekdays.sun'),
  ];
  const cells = buildCalendarMonth(monthKey);

  return (
    <div>
      <div className="provider-calendar-month__header">
        <IonButton
          fill="clear"
          size="small"
          aria-label={t('provider.calendarPreviousMonth')}
          onClick={() => onMonthKeyChange(shiftMonthKey(monthKey, -1))}
        >
          <IonIcon icon={chevronBackOutline} />
        </IonButton>
        <h3 className="provider-calendar-month__title">{formatMonthYearLabel(monthKey)}</h3>
        <IonButton
          fill="clear"
          size="small"
          aria-label={t('provider.calendarNextMonth')}
          onClick={() => onMonthKeyChange(shiftMonthKey(monthKey, 1))}
        >
          <IonIcon icon={chevronForwardOutline} />
        </IonButton>
      </div>
      <div className="provider-calendar-month">
        {weekdays.map((label) => (
          <div key={label} className="provider-calendar-month__weekday">
            {label}
          </div>
        ))}
        {cells.map((cell) => {
          const selected = cell.dateKey === selectedDate;
          const hasAppointments = (appointmentCountsByDate[cell.dateKey] ?? 0) > 0;
          const className = [
            'provider-calendar-month__day',
            !cell.inMonth ? 'provider-calendar-month__day--muted' : '',
            selected ? 'provider-calendar-month__day--selected' : '',
            cell.dateKey === todayKey ? 'provider-calendar-month__day--today' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={cell.dateKey}
              type="button"
              className={className}
              onClick={() => {
                onSelectDate(cell.dateKey);
                if (!cell.inMonth) {
                  onMonthKeyChange(monthKeyFromDateKey(cell.dateKey));
                }
              }}
            >
              {Number(cell.dateKey.slice(8, 10))}
              {hasAppointments ? <span className="provider-calendar-month__badge" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
