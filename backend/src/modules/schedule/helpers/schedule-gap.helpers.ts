import { formatTimeDisplay } from '../../../common/utils/date-format.util.js';
import {
  normalizeTime24,
  timeToMinutes,
} from '../../../common/utils/time-format.util.js';

export interface TimeInterval {
  startTime: Date;
  endTime: Date;
}

/** Merge overlapping/adjacent intervals. */
export function mergeTimeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.startTime.getTime() <= last.endTime.getTime()) {
      if (current.endTime > last.endTime) {
        last.endTime = current.endTime;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/** Find empty windows inside [windowStart, windowEnd] not covered by occupied intervals. */
export function findScheduleGapsInWindow(
  targetDate: Date,
  windowStart: string,
  windowEnd: string,
  occupied: TimeInterval[],
  minGapMinutes = 10,
): Array<{ startTime: string; endTime: string }> {
  const toDate = (hhmm: string) => {
    const normalized = normalizeTime24(hhmm);
    const [h, m] = normalized.split(':').map(Number);
    const d = new Date(targetDate);
    d.setUTCHours(h, m, 0, 0);
    return d;
  };

  const windowStartDate = toDate(windowStart);
  const windowEndDate = toDate(windowEnd);
  if (windowEndDate <= windowStartDate) return [];

  const clipped = mergeTimeIntervals(
    occupied
      .filter((o) => o.endTime > windowStartDate && o.startTime < windowEndDate)
      .map((o) => ({
        startTime: new Date(
          Math.max(o.startTime.getTime(), windowStartDate.getTime()),
        ),
        endTime: new Date(
          Math.min(o.endTime.getTime(), windowEndDate.getTime()),
        ),
      })),
  );

  const gaps: Array<{ startTime: string; endTime: string }> = [];
  let cursor = windowStartDate;

  for (const block of clipped) {
    if (
      block.startTime.getTime() - cursor.getTime() >=
      minGapMinutes * 60_000
    ) {
      gaps.push({
        startTime: formatTimeDisplay(cursor),
        endTime: formatTimeDisplay(block.startTime),
      });
    }
    if (block.endTime > cursor) {
      cursor = block.endTime;
    }
  }

  if (windowEndDate.getTime() - cursor.getTime() >= minGapMinutes * 60_000) {
    gaps.push({
      startTime: formatTimeDisplay(cursor),
      endTime: formatTimeDisplay(windowEndDate),
    });
  }

  return gaps;
}

/** Parse "between 9-19:00" style ranges from natural language. */
export function parseTimeWindowFromText(
  text: string,
  defaults: { timeFrom: string; timeTo: string } = {
    timeFrom: '09:00',
    timeTo: '19:00',
  },
): { timeFrom: string; timeTo: string } {
  const match = text.match(
    /(?:between\s+)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?/i,
  );
  if (!match) return defaults;

  const fromMinutes = match[2] ?? '00';
  const toMinutes = match[4] ?? '00';
  const timeFrom = normalizeTime24(`${match[1]}:${fromMinutes}`);
  const timeTo = normalizeTime24(`${match[3]}:${toMinutes}`);

  if (timeToMinutes(timeTo) <= timeToMinutes(timeFrom)) {
    return defaults;
  }

  return { timeFrom, timeTo };
}
