import type { CommandResult } from './command-completion.types.js';
import { fuzzyMatchServiceByName } from './ai-orchestration.helpers.js';
import {
  applyClarifyMemoryToParams,
  readClarifyMemory,
} from './ai-clarify-answer-reuse.util.js';
import {
  buildClarifyFieldContext,
  fieldSatisfiedForClarify,
} from './ai-targeted-clarify.util.js';
import type { ValidationIssue } from './command-completion.types.js';

export type EntityClarifyField = 'employeeName' | 'serviceName' | 'customerName';

export interface EntityClarifyOption {
  id: string;
  field: EntityClarifyField;
  label: string;
  value: string;
}

export interface EntityDisambiguationInput {
  prompt: string;
  params: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  employees?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
}

const NAME_STOP_WORDS = new Set([
  'with',
  'for',
  'book',
  'the',
  'a',
  'an',
  'my',
  'me',
  'tomorrow',
  'today',
  'next',
  'week',
  'appointment',
  'booking',
]);

const SERVICE_STOP_WORDS = new Set([
  'book',
  'booking',
  'schedule',
  'appointment',
  'tomorrow',
  'today',
  'next',
  'week',
  'at',
  'on',
  'the',
  'a',
  'an',
  'my',
  'for',
  'with',
  'check',
  'availability',
  'who',
  'is',
  'free',
  'available',
  'want',
  'need',
  'get',
]);

function paramHasValue(params: Record<string, unknown>, field: string): boolean {
  const value = params[field];
  if (value == null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function fieldResolvedForEntity(
  field: EntityClarifyField,
  input: EntityDisambiguationInput,
): boolean {
  const memory = readClarifyMemory(input.sessionContext);
  if (memory[field]?.trim()) return true;
  if (paramHasValue(input.params, field)) return true;

  const fieldContext = buildClarifyFieldContext({
    params: input.params,
    prompt: input.prompt,
    sessionContext: input.sessionContext,
  });
  return fieldSatisfiedForClarify(field, fieldContext);
}

/** Extract person-name hints from natural booking phrasing. */
export function extractNameMentions(prompt: string): string[] {
  const mentions: string[] = [];
  const patterns = [
    /\bwith\s+([A-Za-z][\w.'-]{1,30})\b/gi,
    /\bfor\s+([A-Za-z][\w.'-]{1,30})\b/gi,
    /\bbook\s+([A-Za-z][\w.'-]{1,30})\b/gi,
  ];
  for (const pattern of patterns) {
    const matches = prompt.match(pattern) ?? [];
    for (const chunk of matches) {
      const name = chunk.replace(/^(with|for|book)\s+/i, '').trim();
      if (name.length > 1 && !NAME_STOP_WORDS.has(name.toLowerCase())) {
        mentions.push(name);
      }
    }
  }
  return [...new Set(mentions)];
}

function employeeMatchesMention(
  employee: { id: string; name: string },
  mention: string,
): boolean {
  const token = mention.toLowerCase();
  const lower = employee.name.toLowerCase();
  const first = lower.split(/\s+/)[0] ?? '';
  return lower.includes(token) || token.includes(first) || first === token;
}

export function findAmbiguousEmployees(
  input: EntityDisambiguationInput,
): EntityClarifyOption[] {
  if (fieldResolvedForEntity('employeeName', input) || !input.employees?.length) {
    return [];
  }

  for (const mention of extractNameMentions(input.prompt)) {
    const matches = input.employees.filter((employee) =>
      employeeMatchesMention(employee, mention),
    );
    const unique = [...new Map(matches.map((row) => [row.id, row])).values()];
    if (unique.length >= 2) {
      return unique.slice(0, 6).map((employee) => ({
        id: `employee-${employee.id}`,
        field: 'employeeName',
        label: employee.name,
        value: employee.name,
      }));
    }
  }
  return [];
}

function serviceMatchesPhrase(
  services: Array<{ id: string; name: string }>,
  service: { id: string; name: string },
  phrase: string,
): boolean {
  const trimmed = phrase.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  const nameLower = service.name.toLowerCase();
  if (nameLower === lower) return true;
  if (nameLower.includes(lower) || lower.includes(nameLower)) return true;
  const fuzzy = fuzzyMatchServiceByName(services, trimmed);
  return fuzzy?.id === service.id;
}

function extractServiceQueryPhrases(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): string[] {
  const phrases = new Set<string>();
  const lowerPrompt = prompt.toLowerCase();

  for (const service of services) {
    for (const token of service.name.split(/\s+/)) {
      const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.length >= 4 && lowerPrompt.includes(normalized)) {
        phrases.add(normalized);
      }
    }
  }

  for (const token of lowerPrompt.split(/[^a-z0-9]+/)) {
    if (token.length < 4 || SERVICE_STOP_WORDS.has(token)) continue;
    if (services.some((service) => serviceMatchesPhrase(services, service, token))) {
      phrases.add(token);
    }
  }

  return [...phrases];
}

export function findAmbiguousServices(
  input: EntityDisambiguationInput,
): EntityClarifyOption[] {
  if (fieldResolvedForEntity('serviceName', input) || !input.services?.length) {
    return [];
  }

  const services = input.services;
  const queries = new Set<string>();

  if (typeof input.params.serviceName === 'string' && input.params.serviceName.trim()) {
    queries.add(input.params.serviceName.trim().toLowerCase());
  }

  for (const phrase of extractServiceQueryPhrases(input.prompt, services)) {
    queries.add(phrase.toLowerCase());
  }

  for (const query of queries) {
    const matches = services.filter((service) =>
      serviceMatchesPhrase(services, service, query),
    );
    const unique = [...new Map(matches.map((row) => [row.id, row])).values()];
    if (unique.length >= 2) {
      return unique.slice(0, 6).map((service) => ({
        id: `service-${service.id}`,
        field: 'serviceName',
        label: service.name,
        value: service.name,
      }));
    }
  }

  return [];
}

export function findAmbiguousCustomers(
  input: EntityDisambiguationInput,
): EntityClarifyOption[] {
  if (fieldResolvedForEntity('customerName', input) || !input.customers?.length) {
    return [];
  }

  for (const mention of extractNameMentions(input.prompt)) {
    const matches = input.customers.filter((customer) =>
      customer.name.toLowerCase().includes(mention.toLowerCase()),
    );
    const unique = [...new Map(matches.map((row) => [row.id, row])).values()];
    if (unique.length >= 2) {
      return unique.slice(0, 6).map((customer) => ({
        id: `customer-${customer.id}`,
        field: 'customerName',
        label: customer.name,
        value: customer.name,
      }));
    }
  }
  return [];
}

/** acc-4.3 — disambiguate one catalog field per turn (provider OR service OR customer). */
export function pickPrimaryEntityAmbiguity(
  input: EntityDisambiguationInput,
): EntityClarifyOption[] {
  const employees = findAmbiguousEmployees(input);
  const services = findAmbiguousServices(input);
  const customers = findAmbiguousCustomers(input);
  const hasNameMention = extractNameMentions(input.prompt).length > 0;

  if (employees.length >= 2 && (hasNameMention || services.length < 2)) {
    return employees;
  }
  if (services.length >= 2) return services;
  if (customers.length >= 2) return customers;
  if (employees.length >= 2) return employees;
  return [];
}

export function detectEntityAmbiguity(
  input: EntityDisambiguationInput,
): EntityClarifyOption[] {
  return pickPrimaryEntityAmbiguity(input);
}

export function entityDisambiguationSummary(field: EntityClarifyField): string {
  if (field === 'serviceName') return 'Which service did you mean?';
  if (field === 'customerName') return 'Which customer did you mean?';
  return 'Which provider did you mean?';
}

export function buildEntityDisambiguationClarifyResult(
  input: EntityDisambiguationInput & {
    action: string;
    reasoning?: string;
  },
): CommandResult | null {
  const entityOptions = detectEntityAmbiguity(input);
  if (entityOptions.length < 2) return null;

  const field = entityOptions[0]?.field ?? 'employeeName';

  return {
    success: false,
    action: input.action,
    summary: entityDisambiguationSummary(field),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'entity_disambiguation',
      clarifyKind: 'entity_disambiguation',
      entityOptions,
      entityDisambiguationField: field,
      partialParams: input.params,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };
}

export function filterMissingFieldsForEntityDisambiguation(
  issues: ValidationIssue[],
  entityOptions: EntityClarifyOption[] | undefined,
): ValidationIssue[] {
  if (!entityOptions?.length) return issues;
  const field = entityOptions[0]?.field;
  if (!field) return issues;
  return issues.filter((issue) => issue.field !== field);
}

export function composeEntityDisambiguationFollowUp(input: {
  field: EntityClarifyField;
  label: string;
  originalPrompt?: string;
}): string {
  if (input.originalPrompt?.trim()) {
    return `${input.originalPrompt.trim()}. I meant ${input.label}.`;
  }
  return `${entityDisambiguationSummary(input.field).replace('?', '')}: ${input.label}`;
}

export function applyEntityDisambiguationFromSession(
  params: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  return applyClarifyMemoryToParams(params, sessionContext);
}
