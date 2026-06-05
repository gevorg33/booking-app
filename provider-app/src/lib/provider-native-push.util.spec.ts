import { describe, expect, it } from 'vitest';
import {
  buildSuggestReschedulePushPayload,
  shouldExecutePushAction,
  shouldShowForegroundPush,
} from './provider-native-push.util';

describe('provider-native-push.util', () => {
  it('detects foreground banner pushes', () => {
    expect(shouldShowForegroundPush({ pushType: 'booking_created' })).toBe(true);
    expect(shouldShowForegroundPush({ foregroundHint: 'New booking' })).toBe(true);
    expect(shouldShowForegroundPush({ aiPrompt: 'Add buffer' })).toBe(true);
    expect(shouldShowForegroundPush({ pushType: 'end_of_day' })).toBe(false);
  });

  it('gates server push action execution', () => {
    expect(shouldExecutePushAction('confirm', 'b1', 'biz-1')).toBe(true);
    expect(shouldExecutePushAction('tap', 'b1', 'biz-1')).toBe(false);
    expect(shouldExecutePushAction('confirm', undefined, 'biz-1')).toBe(false);
    expect(shouldExecutePushAction(undefined, 'b1', null)).toBe(false);
  });

  it('builds suggest reschedule deep link payload', () => {
    expect(buildSuggestReschedulePushPayload('b1', 'biz-1')).toMatchObject({
      bookingId: 'b1',
      businessId: 'biz-1',
      aiPrompt: expect.stringContaining('b1'),
      url: '/provider/today?bookingId=b1',
    });
  });
});
