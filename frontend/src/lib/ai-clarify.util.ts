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

export type ClarifyFieldKind = 'employeeSelect' | 'serviceSelect' | 'date' | 'time' | 'text';

export function clarifyFieldKind(
  field: string,
  employeeCount: number,
  serviceCount: number,
): ClarifyFieldKind {
  if (field === 'employeeName' && isClarifySelectField(field) && employeeCount > 0) {
    return 'employeeSelect';
  }
  if (field === 'serviceName' && isClarifySelectField(field) && serviceCount > 0) {
    return 'serviceSelect';
  }
  if (field === 'date' || field === 'dateFrom' || field === 'dateTo') return 'date';
  if (field === 'timeSlot' || field === 'timeFrom' || field === 'timeTo') return 'time';
  return 'text';
}

/** Builds NL follow-up from structured clarify field values (ai-d4). */
export function composeClarifyPrompt(
  issues: ClarifyIssue[],
  values: Record<string, string>,
): string | null {
  const parts = issues
    .map((issue) => {
      const v = values[issue.field]?.trim();
      if (!v) return null;
      return `${issue.label}: ${v}`;
    })
    .filter(Boolean) as string[];
  if (parts.length > 0) return parts.join('. ');
  const first = issues.find((i) => i.example);
  return first?.example?.trim() || null;
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
