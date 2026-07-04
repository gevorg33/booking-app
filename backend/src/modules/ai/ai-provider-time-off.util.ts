/** prov-exp-7.2 — AI intent helpers for provider time-off. */

import {
  SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS,
  SIMILAR_PROVIDER_TIME_OFF_PROMPTS,
} from '../provider-mobile/provider-time-off.fixtures.js';
import { PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS } from './ai-provider-time-off-list-multilingual.fixtures.js';

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
  'cancel_time_off_request',
] as const;

export const DASHBOARD_TIME_OFF_INTENTS = [
  ...DASHBOARD_TIME_OFF_READ_INTENTS,
  ...DASHBOARD_TIME_OFF_MUTATE_INTENTS,
] as const;

export const PROVIDER_TIME_OFF_INTENTS = [
  ...PROVIDER_TIME_OFF_READ_INTENTS,
  ...PROVIDER_TIME_OFF_MUTATE_INTENTS,
] as const;

export type ProviderTimeOffListIntent =
  (typeof PROVIDER_TIME_OFF_READ_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function matchProviderTimeOffListScenario(
  prompt: string,
): { action: ProviderTimeOffListIntent; rescueReason: string } | null {
  for (const scenario of [
    ...SIMILAR_PROVIDER_TIME_OFF_LIST_PROMPTS,
    ...PROVIDER_TIME_OFF_LIST_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: 'list_my_time_off_requests',
        rescueReason: 'my_time_off_list',
      };
    }
  }
  return null;
}

export function isCancelTimeOffRequestPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (
    /\b(cancel|withdraw|revoke|remove)\b.*\b(time\s*off|pto|vacation)\b/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (
    containsArmenianScript(prompt) &&
    /(չեղարկ).*(time\s*off|pto|vacation|արձակուրդ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(отмен).*(time\s*off|pto|отпуск)/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return false;
}

export function isListMyTimeOffRequestsPrompt(prompt: string): boolean {
  if (isCancelTimeOffRequestPrompt(prompt)) return false;
  const normalized = prompt.toLowerCase();
  if (
    /my\s+time\s*off|did\s+my\s+(?:vacation|pto)|time\s*off\s+status|vacation\s+get\s+approved|pending\s+(?:pto|time\s*off)|my\s+(?:pending\s+)?(?:pto|time\s*off)\s+requests?/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հաստատ|vacation|pto|time\s*off).*(request|status)|pending.*pto|time\s*off.*request/i.test(
      prompt,
    );
  }
  if (containsCyrillicScript(prompt)) {
    return /(одобр|отпуск|pto|time\s*off).*(запрос|статус|request)|pending.*pto|статус.*time\s*off/i.test(
      prompt,
    );
  }
  return false;
}

export function isRequestTimeOffPrompt(prompt: string): boolean {
  const normalized = prompt.toLowerCase();
  if (isListMyTimeOffRequestsPrompt(prompt)) return false;
  if (isCancelTimeOffRequestPrompt(prompt)) return false;

  if (
    containsArmenianScript(prompt) &&
    /(\u0570\u0561\u0580\u0581\u0578\u0582\u0574|\u0561\u0566\u0561\u057f\s+\u0580)/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(\u0437\u0430\u043f\u0440\u043e\u0441|\u043d\u0443\u0436\u0435\u043d)/i.test(
      prompt,
    ) &&
    /\boff\b/i.test(prompt)
  ) {
    return true;
  }

  return /request\s+(?:time\s*off|pto|vacation)|need\s+(?:friday|monday|tomorrow|next)\s+off|take\s+(?:friday|monday)\s+off|next\s+\w+\s+off/.test(
    normalized,
  );
}

export function rescueDashboardTimeOffIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    action !== 'unknown' &&
    DASHBOARD_TIME_OFF_INTENTS.includes(
      action as (typeof DASHBOARD_TIME_OFF_INTENTS)[number],
    )
  ) {
    return null;
  }
  const normalized = prompt.toLowerCase();
  if (
    /approve.*(?:time\s*off|vacation|pto)|grant.*(?:vacation|time\s*off)/.test(
      normalized,
    )
  ) {
    return {
      action: 'approve_time_off_request',
      rescueReason: 'time_off_approve',
    };
  }
  if (
    /deny.*(?:time\s*off|vacation|pto)|reject.*(?:vacation|time\s*off)/.test(
      normalized,
    )
  ) {
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

export function matchProviderTimeOffScenario(
  prompt: string,
): { action: string; rescueReason: string } | null {
  for (const scenario of SIMILAR_PROVIDER_TIME_OFF_PROMPTS) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason:
          scenario.expectedAction === 'list_my_time_off_requests'
            ? 'my_time_off_list'
            : 'request_time_off',
      };
    }
  }
  return matchProviderTimeOffListScenario(prompt);
}

export function rescueProviderTimeOffIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    action !== 'unknown' &&
    PROVIDER_TIME_OFF_INTENTS.includes(
      action as (typeof PROVIDER_TIME_OFF_INTENTS)[number],
    )
  ) {
    return null;
  }

  const exact = matchProviderTimeOffScenario(prompt);
  if (exact) return exact;

  if (isCancelTimeOffRequestPrompt(prompt)) {
    return {
      action: 'cancel_time_off_request',
      rescueReason: 'cancel_time_off_request',
    };
  }
  if (isListMyTimeOffRequestsPrompt(prompt)) {
    return {
      action: 'list_my_time_off_requests',
      rescueReason: 'my_time_off_list',
    };
  }
  if (isRequestTimeOffPrompt(prompt)) {
    return { action: 'request_time_off', rescueReason: 'request_time_off' };
  }
  return null;
}
