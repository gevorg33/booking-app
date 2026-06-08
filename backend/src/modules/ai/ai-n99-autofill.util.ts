import type { FieldLevelConfidence } from './ai-classification-engine.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { EntityMemory } from './ai-settings.types.js';
import type { ResolvedCommand } from './command-completion.types.js';
import {
  deriveFieldLevelConfidence,
  listLowConfidenceFields,
} from './ai-classification-field-confidence.util.js';
import type { FieldConfidenceParamKey } from './ai-classification-field-confidence.fixtures.js';
import { DEFAULT_FIELD_CONFIDENCE_THRESHOLD } from './ai-classification-field-confidence.fixtures.js';
import { applyEntityMemoryToParams } from './ai-entity-memory.util.js';
import { isHighRiskConfirmAction } from './ai-high-risk-confirm-clarify.util.js';
import { isFirstAvailableBookingPrompt } from './ai-intent-heuristics.js';
import { validateCommand } from './command-completion.validator.js';
import {
  N99_AUTOFILL_RISK_TIER_THRESHOLDS,
  N99_AUTOFILL_SOURCE_TRUST,
  type N99AutofillSource,
} from './ai-n99-autofill.fixtures.js';

export {
  N99_AUTOFILL_RISK_TIER_THRESHOLDS,
  N99_AUTOFILL_SCENARIOS,
  N99_AUTOFILL_PROCEED_SCENARIOS,
  N99_AUTOFILL_SOURCE_TRUST,
} from './ai-n99-autofill.fixtures.js';
export type { N99AutofillSource } from './ai-n99-autofill.fixtures.js';

export type AutofillRiskTier = 'low' | 'medium' | 'high';

export interface AutofillCatalogService {
  name: string;
  durationMinutes?: number;
}

export interface ConfidenceGatedAutofillInput {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  surface?: ClassificationSurface;
  sessionContext?: Record<string, unknown>;
  screenContext?: Record<string, unknown>;
  entityMemory?: EntityMemory;
  businessDefaults?: { defaultServiceDurationMinutes?: number };
  catalogServices?: AutofillCatalogService[];
  actionConfidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  fieldThreshold?: number;
}

export interface AutofillAppliedEntry {
  paramKey: string;
  field: FieldConfidenceParamKey | 'durationMinutes';
  value: unknown;
  source: N99AutofillSource;
  sourceTrust: number;
}

export interface ConfidenceGatedAutofillResult {
  params: Record<string, unknown>;
  filledFields: string[];
  applied: AutofillAppliedEntry[];
  blocked: boolean;
  blockReason?: string;
  fieldThreshold: number;
  riskTier: AutofillRiskTier;
}

const ANY_PROVIDER =
  /\b(any provider|any stylist|whoever|whichever|first available|anyone available)\b/i;

const PARAM_TO_FIELD: Partial<Record<string, FieldConfidenceParamKey | 'durationMinutes'>> = {
  employeeName: 'employeeName',
  serviceName: 'serviceName',
  customerName: 'employeeName',
  date: 'date',
  timeSlot: 'timeSlot',
  bookingId: 'action',
  durationMinutes: 'durationMinutes',
};

function setIfEmpty(
  params: Record<string, unknown>,
  key: string,
  value: unknown,
): boolean {
  if (value == null || value === '') return false;
  if (params[key] != null && params[key] !== '') return false;
  params[key] = value;
  return true;
}

function readMergedContext(
  sessionContext?: Record<string, unknown>,
  screenContext?: Record<string, unknown>,
): Record<string, unknown> {
  const nested =
    screenContext?.context && typeof screenContext.context === 'object'
      ? (screenContext.context as Record<string, unknown>)
      : {};
  return { ...sessionContext, ...nested, ...screenContext };
}

/** n99-2.1 — map intent action to autofill risk tier. */
export function resolveAutofillRiskTier(action: string): AutofillRiskTier {
  if (isHighRiskConfirmAction(action)) return 'high';
  if (
    action === 'create_booking' ||
    action === 'book_nearest_slot' ||
    action === 'reschedule_booking' ||
    action === 'send_reminder' ||
    action === 'create_service'
  ) {
    return 'medium';
  }
  return 'low';
}

export function resolveAutofillFieldThreshold(
  riskTier: AutofillRiskTier,
  baseThreshold = DEFAULT_FIELD_CONFIDENCE_THRESHOLD,
): number {
  return Math.max(baseThreshold, N99_AUTOFILL_RISK_TIER_THRESHOLDS[riskTier]);
}

export function shouldApplyAutofillCandidate(input: {
  source: N99AutofillSource;
  riskTier: AutofillRiskTier;
  fieldThreshold: number;
  actionConfidence?: number;
}): boolean {
  if (input.riskTier === 'high') return false;
  if ((input.actionConfidence ?? 0.85) < 0.65) return false;
  return N99_AUTOFILL_SOURCE_TRUST[input.source] + 1e-9 >= input.fieldThreshold;
}

function applyEntityMemoryAutofill(
  params: Record<string, unknown>,
  entityMemory: EntityMemory | undefined,
  prompt: string,
): AutofillAppliedEntry[] {
  if (!entityMemory) return [];
  const before = { ...params };
  const next = applyEntityMemoryToParams(before, entityMemory, prompt);
  const applied: AutofillAppliedEntry[] = [];
  for (const key of ['employeeName', 'serviceName', 'customerName', 'templateName']) {
    if (before[key] == null && next[key] != null) {
      applied.push({
        paramKey: key,
        field: (PARAM_TO_FIELD[key] ?? 'action') as FieldConfidenceParamKey | 'durationMinutes',
        value: next[key],
        source: 'entity_memory',
        sourceTrust: N99_AUTOFILL_SOURCE_TRUST.entity_memory,
      });
      params[key] = next[key];
    }
  }
  return applied;
}

function applyBusinessDefaultDuration(
  params: Record<string, unknown>,
  businessDefaults?: { defaultServiceDurationMinutes?: number },
  catalogServices?: AutofillCatalogService[],
): AutofillAppliedEntry[] {
  if (params.durationMinutes != null) return [];
  const serviceName =
    typeof params.serviceName === 'string' ? params.serviceName.trim().toLowerCase() : '';
  const catalogMatch = catalogServices?.find(
    (service) => service.name.trim().toLowerCase() === serviceName,
  );
  if (catalogMatch?.durationMinutes) {
    params.durationMinutes = catalogMatch.durationMinutes;
    return [
      {
        paramKey: 'durationMinutes',
        field: 'durationMinutes',
        value: catalogMatch.durationMinutes,
        source: 'service_catalog_duration',
        sourceTrust: N99_AUTOFILL_SOURCE_TRUST.service_catalog_duration,
      },
    ];
  }
  const defaultMinutes = businessDefaults?.defaultServiceDurationMinutes;
  if (!defaultMinutes || !serviceName) return [];
  params.durationMinutes = defaultMinutes;
  return [
    {
      paramKey: 'durationMinutes',
      field: 'durationMinutes',
      value: defaultMinutes,
      source: 'business_default_duration',
      sourceTrust: N99_AUTOFILL_SOURCE_TRUST.business_default_duration,
    },
  ];
}

function buildSessionAutofillCandidates(
  session: Record<string, unknown>,
): Array<{ paramKey: string; value: unknown; source: N99AutofillSource; field: FieldConfidenceParamKey }> {
  return [
    {
      paramKey: 'employeeName',
      value: session.lastEmployeeName ?? session.employeeName,
      source: 'last_provider',
      field: 'employeeName',
    },
    {
      paramKey: 'serviceName',
      value: session.lastServiceName ?? session.serviceName,
      source: 'last_service',
      field: 'serviceName',
    },
    {
      paramKey: 'customerName',
      value: session.lastCustomerName ?? session.customerName,
      source: 'last_customer',
      field: 'employeeName',
    },
  ].filter((entry) => entry.value != null && entry.value !== '') as Array<{
    paramKey: string;
    value: unknown;
    source: N99AutofillSource;
    field: FieldConfidenceParamKey;
  }>;
}

function buildScreenAutofillCandidates(
  context: Record<string, unknown>,
): Array<{ paramKey: string; value: unknown; source: N99AutofillSource; field: FieldConfidenceParamKey }> {
  const entries: Array<{
    paramKey: string;
    value: unknown;
    source: N99AutofillSource;
    field: FieldConfidenceParamKey;
  }> = [];
  const pairs: Array<[string, FieldConfidenceParamKey]> = [
    ['serviceName', 'serviceName'],
    ['employeeName', 'employeeName'],
    ['customerName', 'employeeName'],
    ['date', 'date'],
    ['timeSlot', 'timeSlot'],
    ['bookingId', 'action'],
  ];
  for (const [key, field] of pairs) {
    const value = context[key] ?? context[`selection${key.charAt(0).toUpperCase()}${key.slice(1)}`];
    if (value != null && value !== '') {
      entries.push({
        paramKey: key,
        value,
        source: 'screen_context',
        field,
      });
    }
  }
  return entries;
}

/** n99-2.1 — confidence-gated auto-fill for strongly inferable missing params. */
export function applyConfidenceGatedAutofill(
  input: ConfidenceGatedAutofillInput,
): ConfidenceGatedAutofillResult {
  const params = { ...input.params };
  const riskTier = resolveAutofillRiskTier(input.action);
  const fieldThreshold = resolveAutofillFieldThreshold(
    riskTier,
    input.fieldThreshold ?? 0.72,
  );
  const actionConfidence = input.actionConfidence ?? 0.85;

  if (input.action === 'unknown') {
    return {
      params,
      filledFields: [],
      applied: [],
      blocked: true,
      blockReason: 'ambiguous_or_unknown',
      fieldThreshold,
      riskTier,
    };
  }
  if (actionConfidence < 0.65) {
    return {
      params,
      filledFields: [],
      applied: [],
      blocked: true,
      blockReason: 'low_action_confidence',
      fieldThreshold,
      riskTier,
    };
  }

  const context = readMergedContext(input.sessionContext, input.screenContext);
  const applied: AutofillAppliedEntry[] = [];

  const applyScreenCandidates = (allowedKeys?: Set<string>) => {
    for (const candidate of buildScreenAutofillCandidates(context)) {
      if (allowedKeys && !allowedKeys.has(candidate.paramKey)) continue;
      if (
        !shouldApplyAutofillCandidate({
          source: candidate.source,
          riskTier: riskTier === 'high' ? 'medium' : riskTier,
          fieldThreshold,
          actionConfidence,
        })
      ) {
        continue;
      }
      if (setIfEmpty(params, candidate.paramKey, candidate.value)) {
        applied.push({
          paramKey: candidate.paramKey,
          field: candidate.field,
          value: candidate.value,
          source: candidate.source,
          sourceTrust: N99_AUTOFILL_SOURCE_TRUST.screen_context,
        });
      }
    }
  };

  if (riskTier === 'high') {
    applyScreenCandidates(new Set(['bookingId', 'customerName']));
    const filledFields = [...new Set(applied.map((entry) => entry.paramKey))];
    const isBulk = input.params.allAppointments === true;
    const hasTarget = Boolean(
      params.bookingId ||
        params.customerName ||
        (Array.isArray(params.bookingIds) && params.bookingIds.length > 0),
    );
    const confirmed = input.sessionContext?.confirmed === true;
    if (!confirmed && (isBulk || !hasTarget)) {
      return {
        params: { ...input.params },
        filledFields: [],
        applied: [],
        blocked: true,
        blockReason: 'high_risk_action',
        fieldThreshold,
        riskTier,
      };
    }
    return {
      params,
      filledFields,
      applied,
      blocked: false,
      fieldThreshold,
      riskTier,
    };
  }

  applyScreenCandidates();

  for (const entry of applyEntityMemoryAutofill(params, input.entityMemory, input.prompt)) {
    if (
      shouldApplyAutofillCandidate({
        source: entry.source,
        riskTier,
        fieldThreshold,
        actionConfidence,
      })
    ) {
      applied.push(entry);
    } else {
      delete params[entry.paramKey];
    }
  }

  for (const candidate of buildSessionAutofillCandidates(context)) {
    if (
      !shouldApplyAutofillCandidate({
        source: candidate.source,
        riskTier,
        fieldThreshold,
        actionConfidence,
      })
    ) {
      continue;
    }
    if (setIfEmpty(params, candidate.paramKey, candidate.value)) {
      applied.push({
        paramKey: candidate.paramKey,
        field: candidate.field,
        value: candidate.value,
        source: candidate.source,
        sourceTrust: N99_AUTOFILL_SOURCE_TRUST[candidate.source],
      });
    }
  }

  for (const entry of applyBusinessDefaultDuration(
    params,
    input.businessDefaults,
    input.catalogServices,
  )) {
    if (
      shouldApplyAutofillCandidate({
        source: entry.source,
        riskTier,
        fieldThreshold,
        actionConfidence,
      })
    ) {
      applied.push(entry);
    } else {
      delete params.durationMinutes;
    }
  }

  if (ANY_PROVIDER.test(input.prompt) || isFirstAvailableBookingPrompt(input.prompt)) {
    const source: N99AutofillSource = isFirstAvailableBookingPrompt(input.prompt)
      ? 'first_available'
      : 'any_provider';
    if (
      shouldApplyAutofillCandidate({ source, riskTier, fieldThreshold, actionConfidence }) &&
      !params.employeeName &&
      !params.allProviders
    ) {
      if (source === 'first_available') {
        params.bookingFirstAvailable = true;
        applied.push({
          paramKey: 'bookingFirstAvailable',
          field: 'employeeName',
          value: true,
          source,
          sourceTrust: N99_AUTOFILL_SOURCE_TRUST[source],
        });
      } else {
        params.allProviders = true;
        applied.push({
          paramKey: 'allProviders',
          field: 'employeeName',
          value: true,
          source,
          sourceTrust: N99_AUTOFILL_SOURCE_TRUST[source],
        });
      }
    }
  }

  const filledFields = [...new Set(applied.map((entry) => entry.paramKey))];
  return {
    params,
    filledFields,
    applied,
    blocked: false,
    fieldThreshold,
    riskTier,
  };
}

/** n99-2.1 — after autofill, skip clarify when validator + field confidence are satisfied. */
export function canProceedWithoutClarifyAfterAutofill(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  actionConfidence?: number;
  fieldConfidence?: FieldLevelConfidence;
  fieldThreshold?: number;
  resolved?: ResolvedCommand;
}): boolean {
  const riskTier = resolveAutofillRiskTier(input.action);
  const fieldThreshold = resolveAutofillFieldThreshold(
    riskTier,
    input.fieldThreshold ?? 0.72,
  );
  const fieldConfidence =
    input.fieldConfidence ??
    deriveFieldLevelConfidence(
      input.prompt,
      input.action,
      input.params,
      input.actionConfidence ?? 0.85,
    );
  const lowFields = listLowConfidenceFields(
    fieldConfidence,
    input.action,
    input.params,
    fieldThreshold,
  );
  if (lowFields.length > 0) return false;

  if (input.resolved) {
    const merged: ResolvedCommand = {
      ...input.resolved,
      action: input.action,
      params: input.params,
      enrichedParams: { ...input.resolved.enrichedParams, ...input.params },
    };
    return validateCommand(merged).ok;
  }

  return true;
}

export function buildAutofillSessionPromotion(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  if (params.employeeName) next.lastEmployeeName = params.employeeName;
  if (params.serviceName) next.lastServiceName = params.serviceName;
  if (params.customerName) next.lastCustomerName = params.customerName;
  return next;
}
