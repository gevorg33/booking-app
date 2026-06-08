import { createHash } from 'crypto';
import type {
  EntityMemory,
  EntityMemoryEntry,
  PendingAliasSuggestion,
} from './ai-settings.types.js';
import {
  ALIAS_SUGGESTION_MIN_CORRECTIONS,
  ALIAS_SUGGESTION_SCENARIOS,
  type AliasCorrectionEvent,
} from './ai-alias-suggestion.fixtures.js';
import { extractDeterministicPhrasingAliases } from './ai-classification-phrasing.util.js';
import { RETRY_WINDOW_MS } from './ai-command-trace.util.js';
import type {
  AiCommandFailureSignal,
  AiCommandFeedbackReason,
  AiCommandTraceOutcome,
} from './entities/ai-command-trace.entity.js';

export {
  ALIAS_SUGGESTION_MIN_CORRECTIONS,
  ALIAS_SUGGESTION_SCENARIOS,
} from './ai-alias-suggestion.fixtures.js';

export function normalizeAliasKey(alias: string): string {
  return alias.trim().toLowerCase();
}

export interface AiTraceAliasHarvestRow {
  traceId: string;
  rawPrompt: string;
  action: string;
  outcome: AiCommandTraceOutcome;
  params: Record<string, unknown> | null;
  feedbackReason: AiCommandFeedbackReason | null;
  feedbackRating: 'up' | 'down' | null;
  failureSignal: AiCommandFailureSignal | null;
  correctedAction: string | null;
  createdAt: Date;
  userId: string | null;
}

function readResolvedString(
  params: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function buildStableSuggestionId(
  alias: string,
  field: keyof EntityMemoryEntry,
  value: string,
): string {
  const digest = createHash('sha256')
    .update(`${normalizeAliasKey(alias)}:${field}:${value.toLowerCase()}`)
    .digest('hex')
    .slice(0, 12);
  return `alias-suggest-${digest}`;
}

/** acc-6.3 — map feedback thumbs-down reasons to entity correction events. */
export function extractAliasCorrectionsFromFeedback(
  row: AiTraceAliasHarvestRow,
): AliasCorrectionEvent[] {
  const params = row.params ?? {};
  const seenAt = row.createdAt.toISOString();
  const events: AliasCorrectionEvent[] = [];

  if (row.feedbackReason === 'wrong_person') {
    const employeeName = readResolvedString(params, 'employeeName', 'employee');
    const customerName = readResolvedString(params, 'customerName', 'customer');
    if (employeeName) {
      events.push(
        ...aliasTokensFromPrompt(row.rawPrompt, 'employeeName', employeeName, seenAt),
      );
    }
    if (customerName) {
      events.push(
        ...aliasTokensFromPrompt(row.rawPrompt, 'customerName', customerName, seenAt),
      );
    }
  }

  if (row.feedbackReason === 'wrong_service') {
    const serviceName = readResolvedString(params, 'serviceName', 'service');
    if (serviceName) {
      events.push(
        ...aliasTokensFromPrompt(row.rawPrompt, 'serviceName', serviceName, seenAt),
      );
    }
  }

  return events;
}

/** acc-6.3 — infer alias→entity from a retry after suspected misclassification. */
export function extractAliasCorrectionsFromRetryPair(
  prior: AiTraceAliasHarvestRow,
  followUp: AiTraceAliasHarvestRow,
): AliasCorrectionEvent[] {
  if (followUp.outcome !== 'executed') return [];
  const params = followUp.params ?? {};
  if (!params || Object.keys(params).length === 0) return [];

  const seenAt = followUp.createdAt.toISOString();
  const events: AliasCorrectionEvent[] = [];

  const aliases = extractDeterministicPhrasingAliases(prior.rawPrompt, params);
  for (const [alias, entry] of Object.entries(aliases)) {
    for (const field of [
      'employeeName',
      'serviceName',
      'customerName',
      'templateName',
    ] as const) {
      const value = entry[field];
      if (typeof value === 'string' && value.trim()) {
        events.push({
          alias,
          field,
          value: value.trim(),
          seenAt,
          source: 'correction',
        });
      }
    }
  }

  const employeeName = readResolvedString(params, 'employeeName', 'employee');
  const serviceName = readResolvedString(params, 'serviceName', 'service');
  const customerName = readResolvedString(params, 'customerName', 'customer');
  const templateName = readResolvedString(params, 'templateName', 'template');
  if (employeeName) {
    events.push(
      ...aliasTokensFromPrompt(
        prior.rawPrompt,
        'employeeName',
        employeeName,
        seenAt,
        'correction',
      ),
    );
  }
  if (serviceName) {
    events.push(
      ...aliasTokensFromPrompt(
        prior.rawPrompt,
        'serviceName',
        serviceName,
        seenAt,
        'correction',
      ),
    );
  }
  if (customerName) {
    events.push(
      ...aliasTokensFromPrompt(
        prior.rawPrompt,
        'customerName',
        customerName,
        seenAt,
        'correction',
      ),
    );
  }
  if (templateName) {
    events.push(
      ...aliasTokensFromPrompt(
        prior.rawPrompt,
        'templateName',
        templateName,
        seenAt,
        'correction',
      ),
    );
  }

  return events;
}

function aliasTokensFromPrompt(
  prompt: string,
  field: keyof EntityMemoryEntry,
  canonicalValue: string,
  seenAt: string,
  source: AliasCorrectionEvent['source'] = 'entity_disambiguation',
): AliasCorrectionEvent[] {
  const lowerPrompt = prompt.toLowerCase();
  const tokens = new Set<string>();
  const firstName = normalizeAliasKey(canonicalValue.split(/\s+/)[0] ?? '');
  if (firstName.length > 2 && lowerPrompt.includes(firstName)) {
    tokens.add(firstName);
  }
  const compact = normalizeAliasKey(canonicalValue.replace(/[^\p{L}\p{N}]+/gu, ''));
  if (compact.length > 2 && compact !== firstName && lowerPrompt.includes(compact)) {
    tokens.add(compact);
  }

  const words = lowerPrompt.match(/[\p{L}\p{N}]{2,20}/gu) ?? [];
  for (const word of words) {
    if (word === firstName || word === compact) continue;
    if (firstName.startsWith(word) && word.length >= 2) {
      tokens.add(word);
    }
  }

  return [...tokens].map((alias) => ({
    alias,
    field,
    value: canonicalValue,
    seenAt,
    source,
  }));
}

/** acc-6.3 — scan trace window for recurring entity corrections. */
export function harvestAliasCorrectionsFromTraces(
  rows: AiTraceAliasHarvestRow[],
): AliasCorrectionEvent[] {
  const events: AliasCorrectionEvent[] = [];
  const sorted = [...rows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const row of sorted) {
    events.push(...extractAliasCorrectionsFromFeedback(row));
  }

  for (let i = 0; i < sorted.length; i += 1) {
    const prior = sorted[i]!;
    if (
      prior.failureSignal !== 'suspected_miss' &&
      !prior.correctedAction
    ) {
      continue;
    }
    for (let j = i + 1; j < sorted.length; j += 1) {
      const next = sorted[j]!;
      if (prior.userId && next.userId && prior.userId !== next.userId) continue;
      const deltaMs = next.createdAt.getTime() - prior.createdAt.getTime();
      if (deltaMs > RETRY_WINDOW_MS) break;
      events.push(...extractAliasCorrectionsFromRetryPair(prior, next));
      break;
    }
  }

  return events;
}

export function filterSuggestionsAgainstExistingAliases(
  suggestions: PendingAliasSuggestion[],
  aliases: Record<string, EntityMemoryEntry>,
): PendingAliasSuggestion[] {
  return suggestions.filter((suggestion) => {
    const existing = aliases[suggestion.alias];
    if (!existing) return true;
    for (const [field, value] of Object.entries(suggestion.entry)) {
      if (!value) continue;
      if (existing[field as keyof EntityMemoryEntry] === value) return false;
    }
    return true;
  });
}

export function aggregateAliasSuggestionsFromCorrections(
  corrections: AliasCorrectionEvent[],
  minCount = ALIAS_SUGGESTION_MIN_CORRECTIONS,
): PendingAliasSuggestion[] {
  const buckets = new Map<
    string,
    {
      alias: string;
      field: keyof EntityMemoryEntry;
      value: string;
      count: number;
      lastSeenAt: string;
      source: 'entity_disambiguation' | 'correction';
    }
  >();

  for (const correction of corrections) {
    const key = `${normalizeAliasKey(correction.alias)}:${correction.field}:${correction.value.toLowerCase()}`;
    const existing = buckets.get(key);
    const seenAt = correction.seenAt ?? new Date().toISOString();
    if (existing) {
      existing.count += 1;
      existing.lastSeenAt = seenAt;
      if (correction.source === 'correction') existing.source = 'correction';
    } else {
      buckets.set(key, {
        alias: correction.alias,
        field: correction.field,
        value: correction.value,
        count: 1,
        lastSeenAt: seenAt,
        source: correction.source ?? 'entity_disambiguation',
      });
    }
  }

  return [...buckets.values()]
    .filter((bucket) => bucket.count >= minCount)
    .map((bucket) => ({
      id: buildStableSuggestionId(bucket.alias, bucket.field, bucket.value),
      alias: normalizeAliasKey(bucket.alias),
      entry: { [bucket.field]: bucket.value } as EntityMemoryEntry,
      correctionCount: bucket.count,
      lastSeenAt: bucket.lastSeenAt,
      source: bucket.source ?? ('entity_disambiguation' as const),
    }));
}

export function mergePendingAliasSuggestions(
  memory: EntityMemory,
  suggestions: PendingAliasSuggestion[],
): EntityMemory {
  const existing = memory.pendingAliasSuggestions ?? [];
  const index = new Map(existing.map((row) => [`${row.alias}:${JSON.stringify(row.entry)}`, row]));
  for (const suggestion of suggestions) {
    const key = `${suggestion.alias}:${JSON.stringify(suggestion.entry)}`;
    const prior = index.get(key);
    index.set(key, prior
      ? {
          ...prior,
          correctionCount: Math.max(prior.correctionCount, suggestion.correctionCount),
          lastSeenAt: suggestion.lastSeenAt,
        }
      : suggestion);
  }
  return {
    ...memory,
    pendingAliasSuggestions: [...index.values()],
  };
}

export function approveAliasSuggestion(
  memory: EntityMemory,
  suggestionId: string,
): EntityMemory {
  const pending = memory.pendingAliasSuggestions ?? [];
  const match = pending.find((row) => row.id === suggestionId);
  if (!match) return memory;

  return {
    ...memory,
    aliases: {
      ...memory.aliases,
      [match.alias]: {
        ...(memory.aliases[match.alias] ?? {}),
        ...match.entry,
      },
    },
    pendingAliasSuggestions: pending.filter((row) => row.id !== suggestionId),
  };
}
