import type { CommandResult } from './command-completion.types.js';
import type { ResolvedCommand } from './command-completion.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  normalizeEmployeeNameToken,
  normalizeServiceLookup,
  fuzzyMatchByName,
  resolveDateRange,
} from './ai-orchestration.helpers.js';
import type { EntityClarifyOption } from './ai-entity-disambiguation-clarify.util.js';
import { RESOLUTION_CONFIDENCE_THRESHOLD } from './ai-resolution-accuracy-guard.fixtures.js';

export { RESOLUTION_CONFIDENCE_THRESHOLD } from './ai-resolution-accuracy-guard.fixtures.js';

export interface ResolutionVerificationIssue {
  field: string;
  message: string;
  score: number;
  ambiguousCandidates?: Array<{ id: string; name: string }>;
}

export interface ResolutionVerificationResult {
  ok: boolean;
  issues: ResolutionVerificationIssue[];
}

type NamedItem = { id: string; name: string };

export interface ScoredMatch<T extends NamedItem> {
  item: T;
  score: number;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}/;

export function scoreEmployeeNameMatch(query: string, candidateName: string): number {
  const q = normalizeEmployeeNameToken(query).toLowerCase();
  const c = candidateName.toLowerCase();
  if (!q || !c) return 0;
  if (c === q) return 1;
  const cParts = c.split(/\s+/).filter(Boolean);
  if (q.length <= 2) {
    return cParts.some((part) => part === q) ? 0.92 : 0.35;
  }
  if (cParts.some((part) => part === q)) return 0.92;
  if (c.includes(q) && q.length >= 3) return 0.88;
  if (q.includes(c) && c.length >= 3) return 0.85;
  if (cParts[0] === q) return 0.9;
  if (cParts.some((part) => part.startsWith(q) && q.length >= 3)) return 0.78;
  return 0;
}

export function scoreServiceNameMatch(query: string, candidateName: string): number {
  const lower = query.trim().toLowerCase();
  const cLower = candidateName.toLowerCase();
  if (!lower || !cLower) return 0;
  if (cLower === lower) return 1;
  const qNorm = normalizeServiceLookup(lower);
  const cNorm = normalizeServiceLookup(candidateName);
  if (qNorm === cNorm) return 0.98;
  if (lower.length < 4) return 0.38;
  if (qNorm.length >= 4 && (cNorm.includes(qNorm) || qNorm.includes(cNorm))) {
    return Math.min(0.9, 0.65 + Math.min(qNorm.length, cNorm.length) / 100);
  }
  if (cLower.includes(lower) && lower.length >= 3) return 0.82;
  if (lower.includes(cLower) && cLower.length >= 4) return 0.8;
  return 0;
}

export function scoreCatalogMatches<T extends NamedItem>(
  catalog: T[],
  query: string,
  scoreFn: (query: string, name: string) => number,
  minScore = 0.35,
): ScoredMatch<T>[] {
  return catalog
    .map((item) => ({ item, score: scoreFn(query, item.name) }))
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

export function detectSilentEmployeePick(resolved: ResolvedCommand): boolean {
  const employees = resolved.entities.employees ?? [];
  if (employees.length <= 1) return false;
  const boundId =
    resolved.enrichedParams.employeeId ?? resolved.entities.employeeId ?? undefined;
  return typeof boundId === 'string' && boundId.length > 0;
}

export function detectSilentServicePick(resolved: ResolvedCommand): boolean {
  const services = resolved.entities.services ?? [];
  if (services.length <= 1) return false;
  return typeof resolved.enrichedParams.serviceId === 'string';
}

function hasRelativeDatePhrase(prompt: string, params: Record<string, unknown>): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(tomorrow|today|yesterday|tonight|next week|next month|this week)\b/.test(lower)) {
    return true;
  }
  return typeof params.date === 'string' && params.date.trim().length > 0;
}

function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && ISO_DAY.test(value);
}

function pushEmployeeIssue(
  issues: ResolutionVerificationIssue[],
  query: string,
  matches: ScoredMatch<NamedItem>[],
  threshold: number,
  reason: 'ambiguous' | 'weak' | 'missing' | 'silent',
): void {
  const strong = matches.filter((row) => row.score >= threshold);
  if (reason === 'silent' || reason === 'ambiguous') {
    issues.push({
      field: 'employeeName',
      message: `Which provider did you mean for "${query}"?`,
      score: reason === 'silent' ? 0.4 : Math.min(strong[0]?.score ?? 0.5, 0.55),
      ambiguousCandidates: (strong.length >= 2 ? strong : matches)
        .slice(0, 6)
        .map((row) => row.item),
    });
    return;
  }
  if (reason === 'missing') {
    issues.push({
      field: 'employeeName',
      message: `I couldn't confidently match provider "${query}".`,
      score: 0,
    });
    return;
  }
  issues.push({
    field: 'employeeName',
    message: `I couldn't confidently match provider "${query}".`,
    score: matches[0]?.score ?? 0.35,
  });
}

function pushServiceIssue(
  issues: ResolutionVerificationIssue[],
  query: string,
  matches: ScoredMatch<NamedItem>[],
  threshold: number,
  reason: 'ambiguous' | 'weak' | 'missing' | 'silent',
): void {
  const strong = matches.filter((row) => row.score >= threshold);
  if (reason === 'silent' || reason === 'ambiguous') {
    issues.push({
      field: 'serviceName',
      message: `Which service did you mean for "${query}"?`,
      score: reason === 'silent' ? 0.4 : Math.min(strong[0]?.score ?? 0.5, 0.55),
      ambiguousCandidates: (strong.length >= 2 ? strong : matches)
        .slice(0, 6)
        .map((row) => row.item),
    });
    return;
  }
  if (reason === 'missing') {
    issues.push({
      field: 'serviceName',
      message: `I couldn't confidently match service "${query}".`,
      score: 0,
    });
    return;
  }
  issues.push({
    field: 'serviceName',
    message: `I couldn't confidently match service "${query}".`,
    score: matches[0]?.score ?? 0.35,
  });
}

function verifyEmployeeResolution(
  resolved: ResolvedCommand,
  threshold: number,
  issues: ResolutionVerificationIssue[],
): void {
  const query = resolved.params.employeeName;
  if (typeof query !== 'string' || !query.trim()) return;

  const catalog = (resolved.entities.employees ?? []) as NamedItem[];
  if (catalog.length === 0 && !resolved.enrichedParams.employeeId) return;
  const matches = scoreCatalogMatches(catalog, query, scoreEmployeeNameMatch);
  const strong = matches.filter((row) => row.score >= threshold);

  if (detectSilentEmployeePick(resolved)) {
    pushEmployeeIssue(issues, query, matches, threshold, 'silent');
    return;
  }

  if (resolved.enrichedParams.employeeId) {
    const chosenName =
      (resolved.enrichedParams.employeeName as string | undefined) ??
      catalog.find((row) => row.id === resolved.enrichedParams.employeeId)?.name ??
      query;
    const chosenScore = scoreEmployeeNameMatch(query, chosenName);
    if (strong.length > 1) {
      pushEmployeeIssue(issues, query, matches, threshold, 'ambiguous');
    } else if (chosenScore < threshold) {
      pushEmployeeIssue(issues, query, matches, threshold, 'weak');
    }
    return;
  }

  if (matches.length === 0) {
    pushEmployeeIssue(issues, query, matches, threshold, 'missing');
  } else if (strong.length > 1) {
    pushEmployeeIssue(issues, query, matches, threshold, 'ambiguous');
  } else if (strong.length === 0) {
    pushEmployeeIssue(issues, query, matches, threshold, 'weak');
  }
}

function verifyServiceResolution(
  resolved: ResolvedCommand,
  threshold: number,
  issues: ResolutionVerificationIssue[],
): void {
  const query = resolved.params.serviceName;
  if (typeof query !== 'string' || !query.trim()) return;

  const catalog = (resolved.entities.services ?? []) as NamedItem[];
  if (catalog.length === 0 && !resolved.enrichedParams.serviceId) return;
  const matches = scoreCatalogMatches(catalog, query, scoreServiceNameMatch);
  const strong = matches.filter((row) => row.score >= threshold);

  if (detectSilentServicePick(resolved)) {
    pushServiceIssue(issues, query, matches, threshold, 'silent');
    return;
  }

  if (resolved.enrichedParams.serviceId) {
    const chosenName =
      (resolved.enrichedParams.serviceName as string | undefined) ??
      catalog.find((row) => row.id === resolved.enrichedParams.serviceId)?.name ??
      query;
    const chosenScore = scoreServiceNameMatch(query, chosenName);
    if (strong.length > 1) {
      pushServiceIssue(issues, query, matches, threshold, 'ambiguous');
    } else if (chosenScore < threshold) {
      pushServiceIssue(issues, query, matches, threshold, 'weak');
    }
    return;
  }

  if (matches.length === 0) {
    pushServiceIssue(issues, query, matches, threshold, 'missing');
  } else if (strong.length > 1) {
    pushServiceIssue(issues, query, matches, threshold, 'ambiguous');
  } else if (strong.length === 0) {
    pushServiceIssue(issues, query, matches, threshold, 'weak');
  }
}

function verifyCustomerResolution(
  resolved: ResolvedCommand,
  threshold: number,
  issues: ResolutionVerificationIssue[],
): void {
  const query = resolved.params.customerName;
  if (typeof query !== 'string' || !query.trim()) return;
  if (resolved.enrichedParams.customerId) {
    const chosenName =
      (resolved.enrichedParams.customerName as string | undefined) ?? query;
    const score = scoreEmployeeNameMatch(query, chosenName);
    if (score < threshold) {
      issues.push({
        field: 'customerName',
        message: `I couldn't confidently match customer "${query}".`,
        score,
      });
    }
    return;
  }
  issues.push({
    field: 'customerName',
    message: `I couldn't confidently match customer "${query}".`,
    score: 0.4,
  });
}

function verifyDateResolution(
  resolved: ResolvedCommand,
  issues: ResolutionVerificationIssue[],
): void {
  if (resolved.action === 'reschedule_booking') return;
  const params = resolved.params;
  const enriched = resolved.enrichedParams;
  const needsDate =
    hasRelativeDatePhrase(resolved.prompt, params) ||
    typeof params.date === 'string' ||
    typeof params.dateFrom === 'string';

  if (!needsDate) return;

  const resolvedDate = enriched.date ?? enriched.dateFrom;
  if (!resolvedDate) {
    issues.push({
      field: 'date',
      message: 'I could not resolve the date confidently — please specify the day.',
      score: 0.35,
    });
    return;
  }
  if (!isIsoDate(resolvedDate)) {
    issues.push({
      field: 'date',
      message: 'I could not resolve the date confidently — please specify the day.',
      score: 0.4,
    });
  }
}

/** acc-5.1 — block silent or weak fuzzy resolution before execution. */
export function verifyResolutionAccuracy(
  resolved: ResolvedCommand,
  threshold = RESOLUTION_CONFIDENCE_THRESHOLD,
): ResolutionVerificationResult {
  const issues: ResolutionVerificationIssue[] = [];
  verifyEmployeeResolution(resolved, threshold, issues);
  verifyServiceResolution(resolved, threshold, issues);
  verifyCustomerResolution(resolved, threshold, issues);
  verifyDateResolution(resolved, issues);
  return { ok: issues.length === 0, issues };
}

function resolveGuardEmployees(
  catalog: NamedItem[],
  params: Record<string, unknown>,
  threshold: number,
): NamedItem[] {
  const names: string[] = [];
  if (typeof params.employeeName === 'string' && params.employeeName.trim()) {
    names.push(params.employeeName.trim());
  }
  if (Array.isArray(params.employeeNames)) {
    names.push(...params.employeeNames.map(String).filter(Boolean));
  }
  if (names.length === 0) return [];

  const collected: NamedItem[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const matches = scoreCatalogMatches(catalog, name, scoreEmployeeNameMatch);
    const strong = matches.filter((row) => row.score >= threshold);
    const picks =
      strong.length >= 2 ? strong : strong.length === 1 ? strong : matches.slice(0, 1);
    for (const row of picks) {
      if (!seen.has(row.item.id)) {
        seen.add(row.item.id);
        collected.push(row.item);
      }
    }
  }
  return collected;
}

function resolveGuardServices(
  catalog: NamedItem[],
  params: Record<string, unknown>,
  threshold: number,
): NamedItem[] {
  const names: string[] = [];
  if (typeof params.serviceName === 'string' && params.serviceName.trim()) {
    names.push(
      ...params.serviceName
        .split(/[/,]|(?:\s+and\s+)|(?:\s+or\s+)/i)
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }
  if (Array.isArray(params.serviceNames)) {
    names.push(...params.serviceNames.map(String).filter(Boolean));
  }
  if (names.length === 0) return [];

  const collected: NamedItem[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const matches = scoreCatalogMatches(catalog, name, scoreServiceNameMatch);
    const strong = matches.filter((row) => row.score >= threshold);
    const picks =
      strong.length >= 2 ? strong : strong.length === 1 ? strong : matches.slice(0, 1);
    for (const row of picks) {
      if (!seen.has(row.item.id)) {
        seen.add(row.item.id);
        collected.push(row.item);
      }
    }
  }
  return collected;
}

export function buildSyntheticResolved(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  employees?: NamedItem[];
  services?: NamedItem[];
  customers?: NamedItem[];
  timeZone?: string;
}): ResolvedCommand {
  const threshold = RESOLUTION_CONFIDENCE_THRESHOLD;
  const employees = resolveGuardEmployees(input.employees ?? [], input.params, threshold);
  const services = resolveGuardServices(input.services ?? [], input.params, threshold);
  const customer = input.params.customerName
    ? fuzzyMatchByName((input.customers ?? []) as any, String(input.params.customerName))
    : undefined;
  const timeZone = (input.params._timeZone as string | undefined) ?? input.timeZone ?? 'UTC';
  const dateRange = resolveDateRange(input.params as Record<string, any>, input.prompt, timeZone);

  const employee = employees.length === 1 ? employees[0] : undefined;
  const enrichedParams: Record<string, unknown> = { ...input.params };

  if (employee) {
    enrichedParams.employeeId = employee.id;
    enrichedParams.employeeName = employee.name;
  } else if (employees.length > 1) {
    enrichedParams.employeeIds = employees.map((row) => row.id);
    enrichedParams.employeeNames = employees.map((row) => row.name);
  }

  if (services.length === 1) {
    enrichedParams.serviceId = services[0]!.id;
    enrichedParams.serviceName = services[0]!.name;
  }

  if (customer) {
    enrichedParams.customerId = (customer as NamedItem).id;
    enrichedParams.customerName = (customer as NamedItem).name;
  }

  if (dateRange && input.action !== 'reschedule_booking') {
    if (!enrichedParams.date) enrichedParams.date = dateRange.start;
    if (!enrichedParams.dateFrom) enrichedParams.dateFrom = dateRange.start;
    if (!enrichedParams.dateTo) enrichedParams.dateTo = dateRange.end;
  }

  return {
    action: input.action,
    prompt: input.prompt,
    businessId: 'synthetic',
    reasoning: 'synthetic',
    params: input.params,
    enrichedParams,
    entities: {
      employee: employee as any,
      employees: employees as any,
      service: services.length === 1 ? (services[0] as any) : undefined,
      services: services as any,
      customer: customer as any,
      dateRange,
      employeeId: employee?.id,
    },
  };
}

export function buildEntityOptionsFromIssue(
  issue: ResolutionVerificationIssue,
): EntityClarifyOption[] {
  if (!issue.ambiguousCandidates?.length) return [];
  const field =
    issue.field === 'serviceName'
      ? 'serviceName'
      : issue.field === 'customerName'
        ? 'customerName'
        : 'employeeName';
  return issue.ambiguousCandidates.map((row) => ({
    id: `${field}-${row.id}`,
    field,
    label: row.name,
    value: row.name,
  }));
}

export function resolutionAccuracySummary(issue: ResolutionVerificationIssue): string {
  return issue.message;
}

export function buildResolutionAccuracyClarifyResult(
  resolved: ResolvedCommand,
  verification: ResolutionVerificationResult,
  surface: ClassificationSurface = 'dashboard',
): CommandResult {
  const first = verification.issues[0];
  const entityOptions = first ? buildEntityOptionsFromIssue(first) : [];

  return {
    success: false,
    action: resolved.action,
    summary: first?.message ?? 'Please clarify the highlighted details before I proceed.',
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'resolution_accuracy',
      clarifyKind: 'resolution_accuracy',
      surface,
      missing: verification.issues.map((issue) => ({
        field: issue.field,
        label: issue.field,
        message: issue.message,
      })),
      entityOptions: entityOptions.length >= 2 ? entityOptions : undefined,
      entityDisambiguationField: entityOptions[0]?.field,
      resolutionConfidence: verification.issues,
      partialParams: resolved.params,
      enrichedParams: resolved.enrichedParams,
      pipelineStage: 'clarify',
      reasoning: resolved.reasoning,
    },
  };
}

export interface ResolutionAccuracyClarifyInput {
  prompt: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  resolved?: ResolvedCommand;
  employees?: NamedItem[];
  services?: NamedItem[];
  customers?: NamedItem[];
}

export function shouldCheckResolutionAccuracy(input: ResolutionAccuracyClarifyInput): boolean {
  if (input.resolved) return true;
  const params = input.params;
  return (
    typeof params.employeeName === 'string' ||
    typeof params.serviceName === 'string' ||
    typeof params.customerName === 'string' ||
    typeof params.date === 'string' ||
    typeof params.dateFrom === 'string' ||
    hasRelativeDatePhrase(input.prompt, params)
  );
}

export function buildResolutionAccuracyClarify(
  input: ResolutionAccuracyClarifyInput,
): CommandResult | null {
  if (!shouldCheckResolutionAccuracy(input)) return null;

  const resolved =
    input.resolved ??
    buildSyntheticResolved({
      prompt: input.prompt,
      action: input.action,
      params: input.params,
      employees: input.employees,
      services: input.services,
      customers: input.customers,
      timeZone: input.params._timeZone as string | undefined,
    });

  const verification = verifyResolutionAccuracy(resolved);
  if (verification.ok) return null;

  return buildResolutionAccuracyClarifyResult(resolved, verification, input.surface);
}

/** Back-compat aliases used by execution verification gate. */
export const verifyResolutionConfidence = verifyResolutionAccuracy;

export function buildResolutionClarifyResult(
  resolved: ResolvedCommand,
  verification: ResolutionVerificationResult,
): CommandResult {
  return buildResolutionAccuracyClarifyResult(resolved, verification);
}
