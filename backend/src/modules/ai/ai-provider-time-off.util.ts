/** prov-exp-7.2 — AI intent lists for provider time-off. */

export const DASHBOARD_TIME_OFF_READ_INTENTS = [
  'list_time_off_requests',
] as const;

export const DASHBOARD_TIME_OFF_MUTATE_INTENTS = [
  'approve_time_off_request',
  'deny_time_off_request',
] as const;

export const PROVIDER_TIME_OFF_READ_INTENTS = [
  'list_my_time_off_requests',
] as const;

export const PROVIDER_TIME_OFF_MUTATE_INTENTS = [
  'request_time_off',
] as const;

export const DASHBOARD_TIME_OFF_INTENTS = [
  ...DASHBOARD_TIME_OFF_READ_INTENTS,
  ...DASHBOARD_TIME_OFF_MUTATE_INTENTS,
] as const;

export const PROVIDER_TIME_OFF_INTENTS = [
  ...PROVIDER_TIME_OFF_READ_INTENTS,
  ...PROVIDER_TIME_OFF_MUTATE_INTENTS,
] as const;

export function rescueDashboardTimeOffIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (action !== 'unknown' && DASHBOARD_TIME_OFF_INTENTS.includes(action as any)) {
    return null;
  }
  const normalized = prompt.toLowerCase();
  if (/approve.*(?:time\s*off|vacation|pto)|grant.*(?:vacation|time\s*off)/.test(normalized)) {
    return {
      action: 'approve_time_off_request',
      rescueReason: 'time_off_approve',
    };
  }
  if (/deny.*(?:time\s*off|vacation|pto)|reject.*(?:vacation|time\s*off)/.test(normalized)) {
    return {
      action: 'deny_time_off_request',
      rescueReason: 'time_off_deny',
    };
  }
  if (
    /time\s*off\s+request|pending\s+(?:pto|time\s*off|vacation)|vacation\s+request|show.*time\s*off/.test(
      normalized,
    )
  ) {
    return { action: 'list_time_off_requests', rescueReason: 'time_off_list' };
  }
  return null;
}

export function rescueProviderTimeOffIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (action !== 'unknown' && PROVIDER_TIME_OFF_INTENTS.includes(action as any)) {
    return null;
  }
  const normalized = prompt.toLowerCase();
  if (
    /my\s+time\s*off|did\s+my\s+(?:vacation|pto)|time\s*off\s+status|vacation\s+get\s+approved/.test(
      normalized,
    )
  ) {
    return {
      action: 'list_my_time_off_requests',
      rescueReason: 'my_time_off_list',
    };
  }
  if (
    /request\s+(?:time\s*off|pto|vacation)|need\s+(?:friday|monday|tomorrow|next)\s+off|take\s+(?:friday|monday)\s+off|next\s+\w+\s+off/.test(
      normalized,
    )
  ) {
    return { action: 'request_time_off', rescueReason: 'request_time_off' };
  }
  return null;
}
