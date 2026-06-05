import {
  getHipaaSessionTimeoutMs,
  isHipaaModeActive,
  readBusinessHipaaSettings,
} from '@/lib/business-compliance';

export const HIPAA_INACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
] as const;

export function shouldEnforceHipaaSessionTimeout(
  settings: Record<string, unknown> | null | undefined,
  hasToken: boolean,
): boolean {
  return Boolean(hasToken && settings && isHipaaModeActive(settings));
}

export function resolveHipaaSessionTimeoutMs(
  settings: Record<string, unknown> | null | undefined,
): number {
  return getHipaaSessionTimeoutMs(readBusinessHipaaSettings(settings));
}
