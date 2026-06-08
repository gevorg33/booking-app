import type { ExecutionTimelineStep } from '@/components/ai-execution-timeline';
import type { ClarifyIssue } from '@/components/ai-clarify-form';

const SELECT_FIELD_IDS = new Set(['employeeName', 'serviceName']);

export type ClarifyEmployee = { id: string; name: string; isActive?: boolean };
export type ClarifyService = { id: string; name: string; isActive?: boolean };

export function activeClarifyEmployees(
  employees: ClarifyEmployee[],
  availableProviderNames?: string[],
): ClarifyEmployee[] {
  const active = employees.filter((e) => e.isActive !== false && e.name?.trim());
  if (!availableProviderNames?.length) return active;
  const allowed = new Set(availableProviderNames.map((n) => n.trim().toLowerCase()));
  const filtered = active.filter((e) => allowed.has(e.name.trim().toLowerCase()));
  return filtered.length > 0 ? filtered : active;
}

export function activeClarifyServices(services: ClarifyService[]): ClarifyService[] {
  return services.filter((s) => s.isActive !== false && s.name?.trim());
}

export type ClarifyFieldKind =
  | 'entityCatalogChips'
  | 'employeeChips'
  | 'serviceChips'
  | 'customerChips'
  | 'date'
  | 'time'
  | 'timeSlotList'
  | 'text';

export interface EntityCatalogOption {
  id: string;
  field: string;
  label: string;
  value: string;
}

const ENTITY_CATALOG_FIELDS = new Set(['employeeName', 'serviceName', 'customerName']);

export function isEntityCatalogField(field: string): boolean {
  return ENTITY_CATALOG_FIELDS.has(field);
}

export function hasPreResolvedEntityCatalog(
  entityOptions: EntityCatalogOption[] | undefined,
): boolean {
  return (entityOptions?.length ?? 0) >= 2;
}

export function entityCatalogOptionsForField(
  entityOptions: EntityCatalogOption[] | undefined,
  field: string,
): EntityCatalogOption[] {
  if (!entityOptions?.length) return [];
  return entityOptions.filter((option) => option.field === field);
}

export function primaryEntityCatalogField(
  entityOptions: EntityCatalogOption[] | undefined,
): string | undefined {
  if (!hasPreResolvedEntityCatalog(entityOptions)) return undefined;
  return entityOptions![0]?.field;
}

export function resolveClarifyChipOptions(input: {
  field: string;
  entityOptions?: EntityCatalogOption[];
  employees: ClarifyEmployee[];
  services: ClarifyService[];
}): Array<{ id: string; label: string; value: string }> {
  const catalog = entityCatalogOptionsForField(input.entityOptions, input.field);
  if (catalog.length >= 2) {
    return catalog.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
    }));
  }
  if (input.field === 'employeeName') {
    return input.employees.map((employee) => ({
      id: employee.id,
      label: employee.name,
      value: employee.name,
    }));
  }
  if (input.field === 'serviceName') {
    return input.services.map((service) => ({
      id: service.id,
      label: service.name,
      value: service.name,
    }));
  }
  return [];
}

export interface ClarifyTimeSlotOption {
  id: string;
  label: string;
  value: string;
  providerName?: string;
}

export function buildClarifyTimeSlotOptions(
  providers: Array<{
    name: string;
    previewTimes?: string[];
    openSlots?: Array<{ start: string; end: string }>;
    earliestStartTime?: string;
  }>,
  max = 12,
): ClarifyTimeSlotOption[] {
  const options: ClarifyTimeSlotOption[] = [];
  const seen = new Set<string>();

  for (const provider of providers) {
    const push = (value: string, suffix?: string) => {
      const key = `${provider.name}:${value}`;
      if (seen.has(key)) return;
      seen.add(key);
      options.push({
        id: key,
        label: suffix ?? value,
        value,
        providerName: provider.name,
      });
    };

    for (const time of provider.previewTimes ?? []) {
      push(time, `${time} · ${provider.name}`);
    }
    for (const slot of provider.openSlots ?? []) {
      push(slot.start, `${slot.start} · ${provider.name}`);
    }
    if (provider.earliestStartTime) {
      push(provider.earliestStartTime, `${provider.earliestStartTime} · ${provider.name}`);
    }
  }

  return options.slice(0, max);
}

export function clarifyFieldKind(
  field: string,
  chipOptionCount: number,
  timeSlotCount = 0,
  entityCatalogCount = 0,
): ClarifyFieldKind {
  if (entityCatalogCount >= 2) return 'entityCatalogChips';
  if (field === 'employeeName' && chipOptionCount > 0) return 'employeeChips';
  if (field === 'serviceName' && chipOptionCount > 0) return 'serviceChips';
  if (field === 'customerName' && chipOptionCount > 0) return 'customerChips';
  if (
    (field === 'timeSlot' || field === 'timeFrom' || field === 'timeTo') &&
    timeSlotCount > 0
  ) {
    return 'timeSlotList';
  }
  if (field === 'date' || field === 'dateFrom' || field === 'dateTo') return 'date';
  if (field === 'timeSlot' || field === 'timeFrom' || field === 'timeTo') return 'time';
  if (isEntityCatalogField(field)) return 'text';
  return 'text';
}

/** Builds NL follow-up from structured clarify field values (ai-d4 / n99-1.1). */
export function composeClarifyPrompt(
  issues: ClarifyIssue[],
  values: Record<string, string>,
): string | null {
  const parts = issues
    .map((issue) => composeClarifyFieldAnswer(issue.field, values[issue.field], issue.label))
    .filter(Boolean) as string[];
  if (parts.length === issues.length && parts.length > 0) {
    return parts.join('. ');
  }
  return null;
}

export function composeClarifyFieldAnswer(
  field: string,
  rawValue: string | undefined,
  label: string,
): string | null {
  const value = rawValue?.trim();
  if (!value) return null;
  if (field === 'employeeName' || field === 'serviceName' || field === 'customerName') {
    return `${label}: ${value}`;
  }
  if (field === 'timeSlot' || field === 'timeFrom' || field === 'timeTo') {
    return `${label}: ${value}`;
  }
  if (field === 'date' || field === 'dateFrom' || field === 'dateTo') {
    return `${label}: ${value}`;
  }
  return `${label}: ${value}`;
}

export function isClarifyFormComplete(
  issues: ClarifyIssue[],
  values: Record<string, string>,
  requiredFields?: string[],
): boolean {
  const fields = requiredFields ?? issues.map((issue) => issue.field);
  return fields.every((field) => Boolean(values[field]?.trim()));
}

export function buildClarifyRequiredFields(
  issues: ClarifyIssue[],
  entityField?: string,
  entityOptionCount = 0,
): string[] {
  const fields = issues.map((issue) => issue.field);
  if (entityField && entityOptionCount >= 2 && !fields.includes(entityField)) {
    fields.unshift(entityField);
  }
  return fields;
}

/** n99-1.3 — one follow-up carrying every answered clarify field. */
export function composeMultiFieldClarifyPrompt(input: {
  issues: ClarifyIssue[];
  values: Record<string, string>;
  entityField?: string;
  entityOptionCount?: number;
  originalPrompt?: string;
}): string | null {
  const required = buildClarifyRequiredFields(
    input.issues,
    input.entityField,
    input.entityOptionCount ?? 0,
  );
  if (!isClarifyFormComplete(input.issues, input.values, required)) {
    return null;
  }

  const parts: string[] = [];
  if (
    input.entityField &&
    (input.entityOptionCount ?? 0) >= 2 &&
    input.values[input.entityField]?.trim()
  ) {
    parts.push(`I meant ${input.values[input.entityField]!.trim()}`);
  }

  for (const issue of input.issues) {
    const part = composeClarifyFieldAnswer(
      issue.field,
      input.values[issue.field],
      issue.label,
    );
    if (part) parts.push(part);
  }

  if (parts.length === 0) return null;
  if (input.originalPrompt?.trim()) {
    return `${input.originalPrompt.trim()}. ${parts.join('. ')}`;
  }
  return parts.join('. ');
}

/** acc-4.2 — NL follow-up after user picks an intent chip. */
export function composeIntentDisambiguationFollowUp(input: {
  selectedAction: string;
  label: string;
  originalPrompt?: string;
}): string {
  const human = input.label.toLowerCase();
  if (input.originalPrompt?.trim()) {
    return `${input.originalPrompt.trim()}. I meant ${human}.`;
  }
  return `I meant ${human}.`;
}

/** acc-4.3 — NL follow-up after user picks an entity catalog chip. */
export function composeEntityDisambiguationFollowUp(input: {
  field: string;
  label: string;
  originalPrompt?: string;
}): string {
  if (input.originalPrompt?.trim()) {
    return `${input.originalPrompt.trim()}. I meant ${input.label}.`;
  }
  return `${input.label}`;
}

export function filterClarifyIssuesForEntityOptions(
  issues: ClarifyIssue[],
  entityOptions?: Array<{ field: string }>,
): ClarifyIssue[] {
  if (!entityOptions?.length) return issues;
  const covered = new Set(entityOptions.map((option) => option.field));
  return issues.filter((issue) => !covered.has(issue.field));
}

export function filterClarifyIssuesForDisplay(
  issues: ClarifyIssue[],
  known?: Record<string, unknown>,
): ClarifyIssue[] {
  if (!known) return issues;
  return issues.filter((issue) => {
    const value = known[issue.field];
    if (value == null || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  });
}

export function isClarifySelectField(field: string): boolean {
  return SELECT_FIELD_IDS.has(field);
}

export function normalizeExecutionTimeline(raw: unknown): ExecutionTimelineStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((step, index) => {
    const row = step as Record<string, unknown>;
    const stepId = String(row.stepId ?? row.id ?? `step-${index}`);
    const status = String(row.status ?? 'pending');
    return {
      stepId,
      description: String(row.description ?? row.label ?? row.name ?? stepId),
      status,
      error: row.error != null ? String(row.error) : undefined,
      canRetry: Boolean(row.canRetry ?? status === 'failed'),
    };
  });
}
