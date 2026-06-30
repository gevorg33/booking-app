import {
  getRepetitiveDirectScheduleDates,
  isRepetitiveDirectScheduleDto,
} from './schedule-direct-days.util.js';

describe('getRepetitiveDirectScheduleDates', () => {
  it('returns weekdays Mon–Fri within range', () => {
    const dates = getRepetitiveDirectScheduleDates(
      '2026-06-01',
      '2026-06-07',
      [1, 2, 3, 4, 5],
    );
    expect(dates).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
    ]);
  });

  it('returns empty when no weekdays match', () => {
    expect(
      getRepetitiveDirectScheduleDates('2026-06-07', '2026-06-07', [1]),
    ).toEqual([]);
  });

  it('returns single day when start equals end and day matches', () => {
    expect(
      getRepetitiveDirectScheduleDates('2026-06-01', '2026-06-01', [1]),
    ).toEqual(['2026-06-01']);
  });
});

describe('isRepetitiveDirectScheduleDto', () => {
  it('detects repetitive payload', () => {
    expect(
      isRepetitiveDirectScheduleDto({
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        applyDays: [1],
      }),
    ).toBe(true);
  });

  it('requires applyDays', () => {
    expect(
      isRepetitiveDirectScheduleDto({
        startDate: '2026-06-01',
        endDate: '2026-06-07',
        applyDays: [],
      }),
    ).toBe(false);
  });
});
