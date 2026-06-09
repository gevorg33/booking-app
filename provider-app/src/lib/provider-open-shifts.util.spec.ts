import { describe, expect, it } from 'vitest';
import {
  buildFillGapAiPrompt,
  formatGapDurationLabel,
} from './provider-open-shifts.util';

describe('provider-open-shifts.util (provider-app)', () => {
  it('builds fill-gap AI prompt', () => {
    expect(
      buildFillGapAiPrompt('2026-06-09', { startTime: '14:00', endTime: '15:30' }),
    ).toContain('waitlist');
  });

  it('formats gap duration label', () => {
    expect(formatGapDurationLabel(45)).toBe('45m');
    expect(formatGapDurationLabel(90)).toBe('1h 30m');
    expect(formatGapDurationLabel(120)).toBe('2h');
  });
});
