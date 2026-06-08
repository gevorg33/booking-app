/** adopt-5.1 — crash-free session release-health SLO (≥ 99.5%). */

export const CRASH_FREE_SESSION_SLO = 0.995;

export function meetsCrashFreeSessionSlo(rate: number | null): boolean | null {
  if (rate == null) return null;
  return rate >= CRASH_FREE_SESSION_SLO;
}

export function isCrashFreeBelowSlo(rate: number | null): boolean {
  return meetsCrashFreeSessionSlo(rate) === false;
}
