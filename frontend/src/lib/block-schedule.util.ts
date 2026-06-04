import { formatDateDisplay, formatTimeDisplay } from '@/lib/date-format';
import type { AppLocale } from '@/i18n/types';

export interface BlockScheduleListItem {
  placeholderLabel: string;
  isRepetitive: boolean;
  startDay: string | null;
  endDay: string | null;
  blockStartTime: string | null;
  blockEndTime: string | null;
  singleStartTime: string | null;
  singleEndTime: string | null;
}

export const BLOCK_SCHEDULE_I18N_KEYS = [
  'schedule.blockTabCreate',
  'schedule.blockTabActive',
  'schedule.createBlockSchedule',
  'schedule.createBlockScheduleHint',
  'schedule.blockRepetitive',
  'schedule.blockOneTime',
  'schedule.blockFromDate',
  'schedule.blockToDate',
  'schedule.blockStartTime',
  'schedule.blockEndTime',
  'schedule.applyBlockSchedule',
  'schedule.blockApplying',
  'schedule.blockCreateFailed',
  'schedule.blockSaveFailed',
  'schedule.blockAppliedSuccess',
  'schedule.removeBlockSchedule',
  'schedule.blockSummaryDaily',
  'schedule.activeBlockSchedules',
  'schedule.searchBlockByProvider',
  'schedule.noBlockSchedules',
  'schedule.noBlockSchedulesMatch',
  'schedule.activeDays',
  'common.provider',
  'common.selectProvider',
  'common.label',
  'schedule.blocked',
  'common.date',
  'common.repeatWeeks',
  'common.timeFormat24h',
] as const;

export function formatBlockScheduleSummary(
  item: BlockScheduleListItem,
  locale: AppLocale | undefined,
  dailyLabel: string,
): string {
  if (item.isRepetitive && item.startDay && item.endDay && item.blockStartTime && item.blockEndTime) {
    return `${formatDateDisplay(item.startDay, locale)} – ${formatDateDisplay(item.endDay, locale)} · ${item.blockStartTime}–${item.blockEndTime} ${dailyLabel}`;
  }
  if (item.singleStartTime && item.singleEndTime) {
    return `${formatDateDisplay(item.singleStartTime, locale)} ${formatTimeDisplay(item.singleStartTime)}–${formatTimeDisplay(item.singleEndTime)}`;
  }
  return item.placeholderLabel;
}

export function blockScheduleTimeLabel(t: (key: string) => string, field: 'blockStartTime' | 'blockEndTime'): string {
  return `${t(`schedule.${field}`)} ${t('common.timeFormat24h')}`;
}

export function allBlockScheduleI18nKeys(): string[] {
  return [...BLOCK_SCHEDULE_I18N_KEYS];
}
