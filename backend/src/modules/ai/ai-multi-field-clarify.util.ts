import type { CommandResult, ValidationIssue } from './command-completion.types.js';
import { buildClarifySummary } from './command-completion.validator.js';
import type { EntityClarifyOption } from './ai-entity-disambiguation-clarify.util.js';

/** Stable display order for single-form multi-field clarify (n99-1.3). */
export const CLARIFY_FIELD_DISPLAY_ORDER = [
  'serviceName',
  'employeeName',
  'customerName',
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
  'timeFrom',
  'timeTo',
] as const;

export function dedupeValidationIssuesByField(
  issues: ValidationIssue[],
): ValidationIssue[] {
  const seen = new Set<string>();
  const deduped: ValidationIssue[] = [];
  for (const issue of issues) {
    if (seen.has(issue.field)) continue;
    seen.add(issue.field);
    deduped.push(issue);
  }
  return deduped;
}

export function sortValidationIssuesForClarify(
  issues: ValidationIssue[],
): ValidationIssue[] {
  const order = new Map(
    CLARIFY_FIELD_DISPLAY_ORDER.map((field, index) => [field, index]),
  );
  return [...issues].sort((left, right) => {
    const leftIndex = order.get(left.field as (typeof CLARIFY_FIELD_DISPLAY_ORDER)[number]) ?? 99;
    const rightIndex = order.get(right.field as (typeof CLARIFY_FIELD_DISPLAY_ORDER)[number]) ?? 99;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.field.localeCompare(right.field);
  });
}

export function buildClarifyFieldsList(
  issues: ValidationIssue[],
  entityOptions?: EntityClarifyOption[],
): string[] {
  const fields = [
    ...(entityOptions?.length && entityOptions.length >= 2
      ? [entityOptions[0]!.field]
      : []),
    ...issues.map((issue) => issue.field),
  ];
  return [...new Set(fields)];
}

export function isMultiFieldClarify(
  issues: ValidationIssue[],
  entityOptions?: EntityClarifyOption[],
): boolean {
  const missingCount = issues.length;
  const entityCount = entityOptions?.length ?? 0;
  if (missingCount >= 2) return true;
  return entityCount >= 2 && missingCount >= 1;
}

export function buildMultiFieldClarifySummary(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return 'I need one more detail before I can continue.';
  }
  return buildClarifySummary(issues);
}

/** Entity-only chip clarify when ambiguity is the only blocker (n99-1.2). */
export function shouldPreferEntityOnlyClarify(
  targeted: CommandResult | null,
): boolean {
  if (!targeted) return true;
  const missing = Array.isArray(targeted.details.missing)
    ? (targeted.details.missing as ValidationIssue[])
    : [];
  const entityCount = Array.isArray(targeted.details.entityOptions)
    ? targeted.details.entityOptions.length
    : 0;
  if (missing.length >= 2) return false;
  if (entityCount >= 2 && missing.length >= 1) return false;
  return entityCount >= 2 && missing.length === 0;
}

export function attachMultiFieldClarifyMetadata(
  result: CommandResult,
  issues: ValidationIssue[],
  entityOptions?: EntityClarifyOption[],
): CommandResult {
  const clarifyFields = buildClarifyFieldsList(issues, entityOptions);
  return {
    ...result,
    details: {
      ...result.details,
      clarifyMultiField: isMultiFieldClarify(issues, entityOptions),
      clarifyFields,
    },
  };
}
