import { beforeEach, describe, expect, it } from 'vitest';
import {
  APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS,
  APP_STARTUP_TTI_BUDGET_MS,
  isLikelyLowEndAndroid,
  isWithinStartupTtiBudget,
  readMsSinceStartupBoot,
  resetAppStartupForTests,
  resolveStartupTtiBudgetMs,
} from './app-startup.util';

describe('app-startup.util (adopt-5.2)', () => {
  beforeEach(() => {
    resetAppStartupForTests();
  });

  it('measures ms since boot mark', () => {
    (globalThis as { __appStartupBootMs?: number }).__appStartupBootMs = 0;
    expect(readMsSinceStartupBoot(100)).toBeGreaterThanOrEqual(0);
    expect(readMsSinceStartupBoot(3500)).toBe(3500);
  });

  it('uses a higher TTI budget on low-end Android', () => {
    expect(
      resolveStartupTtiBudgetMs({ platform: 'android', lowEndAndroid: true }),
    ).toBe(APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS);
    expect(resolveStartupTtiBudgetMs({ platform: 'web', lowEndAndroid: false })).toBe(
      APP_STARTUP_TTI_BUDGET_MS,
    );
  });

  it('detects likely low-end Android devices', () => {
    expect(isLikelyLowEndAndroid({ platform: 'android', deviceMemoryGb: 3 })).toBe(true);
    expect(isLikelyLowEndAndroid({ platform: 'android', deviceMemoryGb: 8 })).toBe(false);
  });

  it('enforces TTI budget threshold', () => {
    expect(isWithinStartupTtiBudget(APP_STARTUP_TTI_BUDGET_MS - 1)).toBe(true);
    expect(isWithinStartupTtiBudget(APP_STARTUP_TTI_BUDGET_MS + 1)).toBe(false);
  });
});
