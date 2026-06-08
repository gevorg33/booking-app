import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  applyClarifyMemoryToParams,
  CLARIFY_MEMORY_FIELD_IDS,
  readClarifyMemory,
} from './ai-clarify-answer-reuse.util.js';
import { readSelectedIntentAction } from './ai-intent-disambiguation-clarify.util.js';

export interface ClarifyCrossTurnContext {
  originalPrompt: string;
  originalAction: string;
  partialParams: Record<string, unknown>;
  clarifyRound: number;
  clarifyKind: string;
}

const RESTORE_WHEN_ACTIONS = new Set(['unknown', 'clarify', 'error']);

export const DASHBOARD_CROSS_TURN_SESSION_KEYS = [
  'employeeName',
  'employeeNames',
  'date',
  'dateFrom',
  'dateTo',
  'serviceName',
  'timeSlot',
  'customerName',
  'templateName',
  'packageName',
  'packageId',
  'packageLines',
  'serviceNames',
  'giftCardCode',
  'paymentMethod',
  'giftCardOrderId',
  'deliveryMethod',
  'amount',
  'timeFrom',
  'timeTo',
  'allProviders',
  'serviceCategory',
] as const;

export const PUBLIC_CROSS_TURN_SESSION_KEYS = [
  'employeeName',
  'date',
  'serviceName',
  'serviceCategory',
  'timeSlot',
  'customerName',
  'customerEmail',
  'customerPhone',
] as const;

export const PROVIDER_CROSS_TURN_SESSION_KEYS = [
  'customerName',
  'date',
  'timeSlot',
  'serviceName',
  'allAppointments',
  'bookingId',
] as const;

function paramIsEmpty(params: Record<string, unknown>, field: string): boolean {
  const value = params[field];
  if (value == null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function readClarifyCrossTurnContext(
  sessionContext?: Record<string, unknown>,
): ClarifyCrossTurnContext | undefined {
  const ctx = sessionContext?._clarifyContext;
  if (!ctx || typeof ctx !== 'object') return undefined;
  return ctx as ClarifyCrossTurnContext;
}

export function readClarifyPartialParams(
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  const partial: Record<string, unknown> = {
    ...(ctx?.partialParams ?? {}),
  };

  for (const field of CLARIFY_MEMORY_FIELD_IDS) {
    const memoryValue = readClarifyMemory(sessionContext)[field];
    if (memoryValue && paramIsEmpty(partial, field)) {
      partial[field] = memoryValue;
    }
  }

  return partial;
}

/** Fill only empty target slots — never overwrite classifier/rescue values. */
export function mergeParamsWithoutLoss(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (paramIsEmpty(merged, key) && value != null && value !== '') {
      merged[key] = value;
    }
  }
  return merged;
}

export function mergeSessionKeysIntoParams(
  params: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
  keys: readonly string[] = DASHBOARD_CROSS_TURN_SESSION_KEYS,
): Record<string, unknown> {
  if (!sessionContext) return params;
  const merged = { ...params };
  for (const key of keys) {
    if (paramIsEmpty(merged, key) && sessionContext[key] != null && sessionContext[key] !== '') {
      merged[key] = sessionContext[key];
    }
  }
  return merged;
}

export function sessionKeysForSurface(
  surface: ClassificationSurface,
): readonly string[] {
  if (surface === 'public') return PUBLIC_CROSS_TURN_SESSION_KEYS;
  if (surface === 'provider') return PROVIDER_CROSS_TURN_SESSION_KEYS;
  return DASHBOARD_CROSS_TURN_SESSION_KEYS;
}

/** acc-4.5 — merge clarify partials + memory + session into current params. */
export function mergeCrossTurnClarifyParams(
  params: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
  options?: {
    surface?: ClassificationSurface;
    sessionKeys?: readonly string[];
  },
): Record<string, unknown> {
  let merged = mergeParamsWithoutLoss(params, readClarifyPartialParams(sessionContext));
  merged = applyClarifyMemoryToParams(merged, sessionContext);
  merged = mergeSessionKeysIntoParams(
    merged,
    sessionContext,
    options?.sessionKeys ??
      (options?.surface ? sessionKeysForSurface(options.surface) : DASHBOARD_CROSS_TURN_SESSION_KEYS),
  );
  return merged;
}

/** acc-4.5 — slot follow-ups keep the original intent action when classifier drifts. */
export function restoreOriginalIntentFromClarifySession<
  T extends {
    action: string;
    params?: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
  },
>(intent: T, sessionContext?: Record<string, unknown>): T {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  if (!ctx?.originalAction || ctx.clarifyRound < 1) return intent;
  if (ctx.clarifyKind === 'intent_disambiguation') return intent;
  if (readSelectedIntentAction(sessionContext)) return intent;

  const shouldRestore =
    RESTORE_WHEN_ACTIONS.has(intent.action) ||
    (intent.action !== ctx.originalAction && ctx.clarifyKind !== 'high_risk_confirm');

  if (!shouldRestore) return intent;

  intent.action = ctx.originalAction;
  intent.confidence = Math.max(intent.confidence ?? 0, 0.9);
  intent.params = intent.params ?? {};
  intent.params._crossTurnRestoredAction = ctx.originalAction;
  intent.reasoning = `Cross-turn slot merge → ${ctx.originalAction}`;
  return intent;
}

/** acc-4.5 — preserve original prompt context across clarify turns. */
export function mergeCrossTurnClarifyPrompt(
  prompt: string,
  sessionContext?: Record<string, unknown>,
): string {
  const ctx = readClarifyCrossTurnContext(sessionContext);
  if (!ctx?.originalPrompt) return prompt;
  const original = ctx.originalPrompt.trim();
  const next = prompt.trim();
  if (!next) return original;
  if (next.toLowerCase().startsWith(original.toLowerCase())) return next;
  return `${original}. ${next}`;
}

export function accumulateCrossTurnPartialParams(
  currentParams: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  return mergeParamsWithoutLoss(readClarifyPartialParams(sessionContext), currentParams);
}
