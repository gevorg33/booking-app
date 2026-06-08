import { beforeEach, describe, expect, it } from 'vitest';
import {
  APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS,
  APP_STARTUP_TTI_BUDGET_MS,
  hideNativeSplashWhenInteractive,
  isLikelyLowEndAndroid,
  isWithinStartupTtiBudget,
  readMsSinceStartupBoot,
  resetAppStartupForTests,
  resolveStartupTtiBudgetMs,
} from './app-startup.util.js';

describe('app-startup.util (adopt-5.2)', () => {
  beforeEach(() => {
    resetAppStartupForTests();
  });

  it('measures ms since boot mark', () => {
    (globalThis as { __appStartupBootMs?: number }).__appStartupBootMs = 0;
    expect(readMsSinceStartupBoot(120)).toBe(120);
  });

  it('uses a higher TTI budget on low-end Android', () => {
    expect(
      resolveStartupTtiBudgetMs({ platform: 'android', lowEndAndroid: true }),
    ).toBe(APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS);
    expect(resolveStartupTtiBudgetMs({ platform: 'android', lowEndAndroid: false })).toBe(
      APP_STARTUP_TTI_BUDGET_MS,
    );
    expect(resolveStartupTtiBudgetMs({ platform: 'ios', lowEndAndroid: false })).toBe(
      APP_STARTUP_TTI_BUDGET_MS,
    );
  });

  it('detects likely low-end Android devices', () => {
    expect(
      isLikelyLowEndAndroid({ platform: 'android', hardwareConcurrency: 4, deviceMemoryGb: 8 }),
    ).toBe(true);
    expect(
      isLikelyLowEndAndroid({ platform: 'android', hardwareConcurrency: 8, deviceMemoryGb: 8 }),
    ).toBe(false);
    expect(isLikelyLowEndAndroid({ platform: 'ios', hardwareConcurrency: 2 })).toBe(false);
  });

  it('enforces TTI budget threshold', () => {
    expect(isWithinStartupTtiBudget(APP_STARTUP_TTI_BUDGET_MS)).toBe(true);
    expect(isWithinStartupTtiBudget(APP_STARTUP_TTI_BUDGET_MS + 1)).toBe(false);
    expect(isWithinStartupTtiBudget(null)).toBe(true);
    expect(
      isWithinStartupTtiBudget(
        APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS,
        APP_STARTUP_TTI_BUDGET_ANDROID_LOW_END_MS,
      ),
    ).toBe(true);
  });

  it('hideNativeSplashWhenInteractive is safe on web', async () => {
    await expect(hideNativeSplashWhenInteractive()).resolves.toBeUndefined();
  });
});
