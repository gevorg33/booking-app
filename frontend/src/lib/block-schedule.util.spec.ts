import { describe, expect, it } from 'vitest';
import {
  allBlockScheduleI18nKeys,
  blockScheduleTimeLabel,
  formatBlockScheduleSummary,
} from './block-schedule.util';

const t = (key: string) => key;

describe('block-schedule.util', () => {
  it('formats repetitive block summaries', () => {
    const summary = formatBlockScheduleSummary(
      {
        placeholderLabel: 'Blocked',
        isRepetitive: true,
        startDay: '2026-06-01',
        endDay: '2026-06-30',
        blockStartTime: '15:00',
        blockEndTime: '16:00',
        singleStartTime: null,
        singleEndTime: null,
      },
      'en',
      'daily',
    );
    expect(summary).toContain('2026');
    expect(summary).toContain('15:00–16:00');
    expect(summary).toContain('daily');
  });

  it('formats one-time block summaries', () => {
    const summary = formatBlockScheduleSummary(
      {
        placeholderLabel: 'Blocked',
        isRepetitive: false,
        startDay: null,
        endDay: null,
        blockStartTime: null,
        blockEndTime: null,
        singleStartTime: '2026-06-04T15:00:00.000Z',
        singleEndTime: '2026-06-04T16:00:00.000Z',
      },
      'en',
      'daily',
    );
    expect(summary).toContain('2026');
    expect(summary).toMatch(/15:00|3:00/);
  });

  it('falls back to placeholder label', () => {
    expect(
      formatBlockScheduleSummary(
        {
          placeholderLabel: 'Lunch break',
          isRepetitive: false,
          startDay: null,
          endDay: null,
          blockStartTime: null,
          blockEndTime: null,
          singleStartTime: null,
          singleEndTime: null,
        },
        'en',
        'daily',
      ),
    ).toBe('Lunch break');
  });

  it('builds block time labels and exports i18n keys', () => {
    expect(blockScheduleTimeLabel(t, 'blockStartTime')).toBe(
      'schedule.blockStartTime common.timeFormat24h',
    );
    expect(allBlockScheduleI18nKeys().length).toBeGreaterThan(20);
  });
});
