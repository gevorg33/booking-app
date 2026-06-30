import { IonButton, IonIcon } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import {
  buildCalendarMonth,
  formatMonthYearLabel,
  monthKeyFromDateKey,
  shiftMonthKey,
} from '../lib/date-picker-calendar.util';
import { formatDateDisplay, getTodayDateKey } from '../lib/date-format';
import type { ProviderCalendarMonthDaySummary } from '../lib/provider-calendar-month';
import { useI18n } from '../i18n';
import './provider-calendar-month.css';

export function ProviderCalendarMonth({
  selectedDate,
  onSelectDate,
  monthKey,
  onMonthKeyChange,
  daySummariesByDate,
}: {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  monthKey: string;
  onMonthKeyChange: (monthKey: string) => void;
  daySummariesByDate: Record<string, ProviderCalendarMonthDaySummary>;
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
  const legendItems = [
    { band: 'empty', label: t('provider.calendarUtilizationEmpty') },
    { band: 'low', label: t('provider.calendarUtilizationLow') },
    { band: 'medium', label: t('provider.calendarUtilizationMedium') },
    { band: 'high', label: t('provider.calendarUtilizationHigh') },
  ] as const;

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
          const summary = daySummariesByDate[cell.dateKey];
          const bookingCount = summary?.bookingCount ?? 0;
          const utilizationBand = cell.inMonth
            ? (summary?.utilizationBand ?? 'empty')
            : null;
          const selected = cell.dateKey === selectedDate;
          const className = [
            'provider-calendar-month__day',
            !cell.inMonth ? 'provider-calendar-month__day--muted' : '',
            utilizationBand
              ? `provider-calendar-month__day--band-${utilizationBand}`
              : '',
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
              aria-label={formatDateDisplay(cell.dateKey)}
              aria-current={selected ? 'date' : undefined}
              onClick={() => {
                onSelectDate(cell.dateKey);
                if (!cell.inMonth) {
                  onMonthKeyChange(monthKeyFromDateKey(cell.dateKey));
                }
              }}
            >
              <span className="provider-calendar-month__day-number">
                {Number(cell.dateKey.slice(8, 10))}
              </span>
              {bookingCount > 0 ? (
                <span className="provider-calendar-month__count">{bookingCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="provider-calendar-month__legend" aria-label={t('provider.calendarUtilizationLegend')}>
        <span className="provider-calendar-month__legend-title">
          {t('provider.calendarUtilizationLegend')}
        </span>
        {legendItems.map((item) => (
          <span key={item.band} className="provider-calendar-month__legend-item">
            <span
              className={`provider-calendar-month__legend-swatch provider-calendar-month__legend-swatch--${item.band}`}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
