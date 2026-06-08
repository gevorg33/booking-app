import type { ValidationIssue } from './command-completion.types.js';
import type { ResolvedCommand } from './command-completion.types.js';

function paramHasValue(params: Record<string, unknown>, field: string): boolean {
  const value = params[field];
  if (value == null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export interface ClarifyFieldContext {
  params?: Record<string, unknown>;
  enrichedParams?: Record<string, unknown>;
  entities?: Record<string, unknown>;
  prompt?: string;
  clarifyMemory?: Record<string, string>;
}

/** acc-4.1 — a slot is satisfied when params, entities, or prior clarify answers cover it. */
export function fieldSatisfiedForClarify(
  field: string,
  ctx: ClarifyFieldContext,
): boolean {
  if (ctx.clarifyMemory?.[field]?.trim()) return true;

  const params = {
    ...(ctx.params ?? {}),
    ...(ctx.enrichedParams ?? {}),
  };

  if (paramHasValue(params, field)) return true;

  if (field === 'employeeName') {
    return Boolean(
      params.employeeId ||
        params.allProviders === true ||
        params.bookingFirstAvailable === true ||
        params.fallbackAnyProvider === true ||
        (Array.isArray(params.providerFallbackNames) &&
          params.providerFallbackNames.length > 0) ||
        (Array.isArray(params.employeeNames) && params.employeeNames.length >= 2) ||
        ctx.entities?.employee ||
        ctx.enrichedParams?.employeeId,
    );
  }

  if (field === 'serviceName') {
    return Boolean(
      params.serviceId ||
        params.serviceCategory ||
        (Array.isArray(params.serviceNames) && params.serviceNames.length > 0) ||
        ctx.entities?.service ||
        ctx.enrichedParams?.serviceId,
    );
  }

  if (field === 'date') {
    return Boolean(
      params.date ||
        params.dateFrom ||
        params.dateTo ||
        (Array.isArray(params.weekdays) && params.weekdays.length > 0),
    );
  }

  if (field === 'timeSlot') {
    return Boolean(
      params.timeSlot ||
        params.timeFrom ||
        params.timeOfDay ||
        params.bookingFirstAvailable === true,
    );
  }

  return false;
}

export function filterTargetedClarifyIssues(
  issues: ValidationIssue[],
  ctx: ClarifyFieldContext,
): ValidationIssue[] {
  return issues.filter((issue) => !fieldSatisfiedForClarify(issue.field, ctx));
}

export function buildClarifyFieldContext(input: {
  params: Record<string, unknown>;
  prompt?: string;
  sessionContext?: Record<string, unknown>;
  resolved?: ResolvedCommand;
}): ClarifyFieldContext {
  return {
    params: input.params,
    enrichedParams: input.resolved?.enrichedParams,
    entities: input.resolved?.entities as Record<string, unknown> | undefined,
    prompt: input.prompt,
    clarifyMemory: (input.sessionContext?._clarifyMemory ?? {}) as Record<string, string>,
  };
}
