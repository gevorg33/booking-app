import {
  CRASH_FREE_SESSION_SLO,
  isCrashFreeBelowSlo,
  meetsCrashFreeSessionSlo,
} from './crash-free-slo.util.js';

describe('crash-free-slo.util (adopt-5.1)', () => {
  it('defines the 99.5% crash-free session target', () => {
    expect(CRASH_FREE_SESSION_SLO).toBe(0.995);
  });

  it('evaluates SLO compliance', () => {
    expect(meetsCrashFreeSessionSlo(null)).toBeNull();
    expect(meetsCrashFreeSessionSlo(0.996)).toBe(true);
    expect(meetsCrashFreeSessionSlo(0.995)).toBe(true);
    expect(meetsCrashFreeSessionSlo(0.994)).toBe(false);
    expect(isCrashFreeBelowSlo(0.994)).toBe(true);
    expect(isCrashFreeBelowSlo(0.996)).toBe(false);
  });
});
