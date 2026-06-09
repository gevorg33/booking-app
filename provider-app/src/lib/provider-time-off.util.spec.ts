import { describe, expect, it } from 'vitest';
import {
  buildProviderTimeOffPayload,
  isProviderTimeOffFormValid,
} from './provider-time-off.util';

describe('provider-time-off.util (prov-exp-7.2)', () => {
  it('validates date range and daily window', () => {
    expect(
      isProviderTimeOffFormValid({
        startDate: '2026-06-10',
        endDate: '2026-06-12',
        dailyStartTime: '00:00',
        dailyEndTime: '23:59',
      }),
    ).toBe(true);
    expect(
      isProviderTimeOffFormValid({
        startDate: '2026-06-12',
        endDate: '2026-06-10',
        dailyStartTime: '00:00',
        dailyEndTime: '23:59',
      }),
    ).toBe(false);
  });

  it('builds payload when valid', () => {
    expect(
      buildProviderTimeOffPayload({
        startDate: '2026-06-10',
        endDate: '2026-06-10',
        dailyStartTime: '09:00',
        dailyEndTime: '17:00',
        reason: ' Vacation ',
      }),
    ).toEqual({
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: 'Vacation',
    });
  });
});
