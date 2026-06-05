import { parseBulkCatalogFromPrompt } from './ai-catalog.util.js';
import { extractGiftCardCodeFromPrompt as extractGiftCardCodeSprint30 } from './ai-payments.util.js';
import {
  SHARED_ENTITY_CROSS_STEP_KEYS,
  SHARED_ENTITY_SESSION_INHERIT_KEYS,
  getSharedParamsForIntent,
  intentAcceptsSharedParam,
} from './ai-command-entity-params.registry.js';
import type {
  CategoryDraftEntry,
  SharedEntityParamId,
  SharedEntityParamValue,
  SharedPaymentMethod,
} from './ai-command-entity-params.types.js';
import { SHARED_ENTITY_PARAM_IDS } from './ai-command-entity-params.types.js';

const ENTITY_ID_CAPTURE = '([a-z0-9][a-z0-9-]{5,})';

function extractEntityId(prompt: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const explicitId = new RegExp(
      `\\b${label}\\s+(?:id|#)\\s*:?\\s*${ENTITY_ID_CAPTURE}`,
      'i',
    );
    const idMatch = prompt.match(explicitId);
    if (idMatch?.[1]) return idMatch[1];

    const colonForm = new RegExp(
      `\\b${label}\\s*:\\s*${ENTITY_ID_CAPTURE}`,
      'i',
    );
    const colonMatch = prompt.match(colonForm);
    if (colonMatch?.[1]) return colonMatch[1];

    if (label.includes('\\s')) {
      const compoundValue = new RegExp(
        `\\b${label}\\s+${ENTITY_ID_CAPTURE}`,
        'i',
      );
      const compoundMatch = prompt.match(compoundValue);
      if (compoundMatch?.[1]) return compoundMatch[1];
    }
  }
  return undefined;
}

export function extractPaymentMethodFromPrompt(
  prompt: string,
): SharedPaymentMethod | undefined {
  if (
    /\b(pay\s+at\s+venue|cash\s+at\s+visit|pay\s+cash|walk[\s-]?in\s+cash)\b/i.test(
      prompt,
    )
  ) {
    return 'cash';
  }
  if (/\b(gift\s+card|with\s+gift\s+card)\b/i.test(prompt)) return 'gift_card';
  if (
    /\b(subscription\s+credit|use\s+(?:my\s+)?subscription)\b/i.test(prompt)
  ) {
    return 'subscription_credit';
  }
  if (/\b(pay\s+online|stripe|card\s+payment)\b/i.test(prompt)) return 'online';
  return undefined;
}

export function extractServiceIdsFromPrompt(
  prompt: string,
): string[] | undefined {
  const listMatch = prompt.match(/\bservice\s+ids?\s*:?\s*([a-z0-9,-\s]{6,})/i);
  if (listMatch?.[1]) {
    const ids = listMatch[1]
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length >= 4);
    return ids.length ? [...new Set(ids)] : undefined;
  }
  const bracketMatch = prompt.match(/\bservices?\s*\[([^\]]+)\]/i);
  if (bracketMatch?.[1]) {
    const ids = bracketMatch[1]
      .split(/[,\s]+/)
      .map((id) => id.replace(/['"]/g, '').trim())
      .filter((id) => id.length >= 4);
    return ids.length ? [...new Set(ids)] : undefined;
  }
  return undefined;
}

export function parseCategoryDraftFromPrompt(
  prompt: string,
): CategoryDraftEntry[] | undefined {
  const draft = parseBulkCatalogFromPrompt(prompt);
  return draft ? [draft] : undefined;
}

/** Extract shared entity params from natural language (compound segments + single commands). */
export function extractSharedEntityParamsFromPrompt(
  prompt: string,
): SharedEntityParamValue {
  const trimmed = prompt.trim();
  if (!trimmed) return {};

  const extracted: SharedEntityParamValue = {};

  const packageId = extractEntityId(trimmed, ['package']);
  if (packageId) extracted.packageId = packageId;

  const packagePurchaseId = extractEntityId(trimmed, [
    'package\\s+purchase',
    'purchase',
  ]);
  if (packagePurchaseId && packagePurchaseId !== extracted.packageId) {
    extracted.packagePurchaseId = packagePurchaseId;
  }

  const multiServiceGroupId = extractEntityId(trimmed, [
    'multi[\\s-]?service\\s+group',
    'multi[\\s-]?service',
    'group',
  ]);
  if (multiServiceGroupId) extracted.multiServiceGroupId = multiServiceGroupId;

  const subscriptionPlanId = extractEntityId(trimmed, [
    'subscription\\s+plan',
    'plan',
  ]);
  if (subscriptionPlanId) extracted.subscriptionPlanId = subscriptionPlanId;

  const customerSubscriptionId = extractEntityId(trimmed, [
    'customer\\s+subscription',
    'subscription\\s+enrollment',
    'subscription',
  ]);
  if (
    customerSubscriptionId &&
    customerSubscriptionId !== extracted.subscriptionPlanId
  ) {
    extracted.customerSubscriptionId = customerSubscriptionId;
  }

  const giftCardCode = extractGiftCardCodeSprint30(trimmed) ?? undefined;
  if (giftCardCode) extracted.giftCardCode = giftCardCode;

  const giftCardOrderId = extractEntityId(trimmed, [
    'gift\\s+card\\s+order',
    'order',
    'gc\\s+order',
  ]);
  if (giftCardOrderId) extracted.giftCardOrderId = giftCardOrderId;

  const resourceId = extractEntityId(trimmed, ['resource', 'room']);
  if (resourceId) extracted.resourceId = resourceId;

  const locationId = extractEntityId(trimmed, ['location', 'branch']);
  if (locationId) extracted.locationId = locationId;

  const paymentMethod = extractPaymentMethodFromPrompt(trimmed);
  if (paymentMethod) extracted.paymentMethod = paymentMethod;

  const serviceIds = extractServiceIdsFromPrompt(trimmed);
  if (serviceIds?.length) extracted.serviceIds = serviceIds;

  const categoryDraft = parseCategoryDraftFromPrompt(trimmed);
  if (categoryDraft?.length) extracted.categoryDraft = categoryDraft;

  return extracted;
}

function normalizePaymentMethod(raw: unknown): SharedPaymentMethod | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (value === 'cash' || value === 'pay_at_venue' || value === 'pay_cash')
    return 'cash';
  if (value === 'gift_card' || value === 'giftcard') return 'gift_card';
  if (value === 'subscription_credit' || value === 'subscription')
    return 'subscription_credit';
  if (value === 'card') return 'card';
  if (value === 'online' || value === 'stripe') return 'online';
  return undefined;
}

function normalizeStringId(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length >= 4 ? trimmed : undefined;
}

function normalizeServiceIds(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    const ids = raw
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter((id) => id.length >= 4);
    return ids.length ? [...new Set(ids)] : undefined;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const ids = raw
      .split(/[,\s]+/)
      .map((id) => id.trim())
      .filter((id) => id.length >= 4);
    return ids.length ? [...new Set(ids)] : undefined;
  }
  return undefined;
}

function normalizeCategoryDraft(
  raw: unknown,
): CategoryDraftEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const drafts: CategoryDraftEntry[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const categoryName =
      typeof record.categoryName === 'string' ? record.categoryName.trim() : '';
    const services = Array.isArray(record.services) ? record.services : [];
    if (!categoryName || !services.length) continue;
    const normalizedServices = services
      .filter(
        (s): s is Record<string, unknown> =>
          Boolean(s) && typeof s === 'object',
      )
      .map((s) => ({
        serviceName: String(s.serviceName ?? '').trim(),
        durationMinutes: Number(s.durationMinutes ?? 0),
        price: Number(s.price ?? 0),
        description:
          typeof s.description === 'string' ? s.description : undefined,
        bufferMinutes:
          typeof s.bufferMinutes === 'number' ? s.bufferMinutes : undefined,
        currency: typeof s.currency === 'string' ? s.currency : undefined,
      }))
      .filter((s) => s.serviceName && s.durationMinutes >= 10 && s.price >= 0);
    if (!normalizedServices.length) continue;
    drafts.push({
      categoryName,
      description:
        typeof record.description === 'string' ? record.description : undefined,
      services: normalizedServices,
    });
  }
  return drafts.length ? drafts : undefined;
}

/** Coerce classifier / heuristic params into canonical shared entity shapes. */
export function normalizeSharedEntityParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = { ...params };

  for (const key of [
    'packageId',
    'packagePurchaseId',
    'multiServiceGroupId',
    'subscriptionPlanId',
    'customerSubscriptionId',
    'giftCardOrderId',
    'resourceId',
    'locationId',
  ] as const) {
    const value = normalizeStringId(params[key]);
    if (value) normalized[key] = value;
    else delete normalized[key];
  }

  if (typeof params.giftCardCode === 'string') {
    const giftCardCode = params.giftCardCode.trim().toUpperCase();
    if (giftCardCode.length >= 2) normalized.giftCardCode = giftCardCode;
    else delete normalized.giftCardCode;
  } else {
    delete normalized.giftCardCode;
  }

  const paymentMethod = normalizePaymentMethod(params.paymentMethod);
  if (paymentMethod) normalized.paymentMethod = paymentMethod;
  else delete normalized.paymentMethod;

  const serviceIds = normalizeServiceIds(params.serviceIds);
  if (serviceIds?.length) normalized.serviceIds = serviceIds;
  else delete normalized.serviceIds;

  const categoryDraft = normalizeCategoryDraft(params.categoryDraft);
  if (categoryDraft?.length) normalized.categoryDraft = categoryDraft;
  else delete normalized.categoryDraft;

  return normalized;
}

export function filterSharedParamsForIntent(
  intentId: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const allowed = getSharedParamsForIntent(intentId);
  const filtered: Record<string, unknown> = {};
  for (const key of SHARED_ENTITY_PARAM_IDS) {
    if (!allowed.has(key)) continue;
    const value = params[key];
    if (value == null || value === '') continue;
    filtered[key] = value;
  }
  return filtered;
}

export function inheritSharedEntityParams(
  params: Record<string, unknown>,
  session: Record<string, unknown> | undefined,
  intentId?: string,
): Record<string, unknown> {
  if (!session) return { ...params };
  const merged = { ...params };
  const allowed = intentId ? getSharedParamsForIntent(intentId) : null;

  for (const key of SHARED_ENTITY_SESSION_INHERIT_KEYS) {
    if (allowed && !allowed.has(key)) continue;
    const current = merged[key];
    if (
      (current == null || current === '') &&
      session[key] != null &&
      session[key] !== ''
    ) {
      merged[key] = session[key];
    }
  }

  return merged;
}

export function pickSharedEntitySessionSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of SHARED_ENTITY_SESSION_INHERIT_KEYS) {
    const value = params[key];
    if (value == null || value === '') continue;
    slice[key] = value;
  }
  return slice;
}

export function mergeCompoundStepParams(
  context: Record<string, unknown>,
  stepParams: Record<string, unknown>,
  intentId: string,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...inheritSharedEntityParams(stepParams, context, intentId),
  };

  for (const [key, value] of Object.entries(stepParams)) {
    if (!SHARED_ENTITY_PARAM_IDS.includes(key as SharedEntityParamId)) {
      merged[key] = value;
      continue;
    }
    if (
      intentAcceptsSharedParam(intentId, key as SharedEntityParamId) &&
      value != null &&
      value !== ''
    ) {
      merged[key] = value;
    }
  }

  for (const key of SHARED_ENTITY_CROSS_STEP_KEYS) {
    if (
      (merged[key] == null || merged[key] === '') &&
      context[key] != null &&
      context[key] !== ''
    ) {
      merged[key] = context[key];
    }
  }

  return normalizeSharedEntityParams(merged);
}

export interface CompoundStepWithParams {
  action: string;
  params: Record<string, unknown>;
}

/** Forward-fill shared entity ids across ordered compound steps. */
export function propagateSharedEntityParamsAcrossSteps<
  T extends CompoundStepWithParams,
>(steps: T[]): T[] {
  const context: Record<string, unknown> = {};
  return steps.map((step) => {
    const mergedParams = mergeCompoundStepParams(
      context,
      step.params,
      step.action,
    );
    for (const key of SHARED_ENTITY_CROSS_STEP_KEYS) {
      const value = mergedParams[key];
      if (value != null && value !== '') context[key] = value;
    }
    return { ...step, params: mergedParams };
  });
}

export function enrichParamsWithSharedEntities(
  params: Record<string, unknown>,
  prompt?: string,
): Record<string, unknown> {
  const fromPrompt = prompt ? extractSharedEntityParamsFromPrompt(prompt) : {};
  return normalizeSharedEntityParams({ ...fromPrompt, ...params });
}

export function buildSharedEntityParamsPromptBlock(): string {
  return [
    'Shared entity params (inherit across compound steps when implied):',
    '- packageId, packagePurchaseId — package booking / visit flows',
    '- multiServiceGroupId — same-visit multi-service group',
    '- subscriptionPlanId, customerSubscriptionId — membership enrollment and credit booking',
    '- giftCardCode, giftCardOrderId — redemption and physical order tracking',
    '- resourceId — room/chair assignment',
    '- locationId — branch-scoped lists and exports',
    '- paymentMethod — cash | online | gift_card | subscription_credit',
    '- serviceIds[] — multi-service cart and availability',
    '- categoryDraft[] — bulk_create_catalog only (category + service lines)',
    'Compound rules: preserve entity ids from earlier steps; book package + pay cash → share packageId and paymentMethod=cash.',
  ].join('\n');
}

export function summarizeSharedParamsForIntent(intentId: string): string {
  const params = [...getSharedParamsForIntent(intentId)];
  if (!params.length) return `${intentId}: no shared entity params`;
  return `${intentId}: ${params.join(', ')}`;
}
