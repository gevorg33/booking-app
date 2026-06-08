import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  HABITUAL_SERVICE_PHRASES,
  PHRASING_BOOK_VERBS,
  PHRASING_NEAREST_VERBS,
} from './ai-classification-phrasing.fixtures.js';
import {
  applyEntityMemoryToParams,
  findAliasMentionsInPrompt,
  normalizeEntityAlias,
} from './ai-entity-memory.util.js';
import type { EntityMemory, EntityMemoryEntry } from './ai-settings.types.js';
import type { ClassifiedIntent } from './ai-command-routing.util.js';

export interface PhrasingMemoryHit {
  alias: string;
  entry: EntityMemoryEntry;
  matchKind: 'alias' | 'habitual_phrase';
  suggestedAction?: string;
  suggestedParams: Record<string, unknown>;
}

export interface PhrasingIntentBias {
  boostIntents: string[];
  suggestedAction?: string;
  suggestedParams: Record<string, unknown>;
}

const BOOKING_ACTION_BY_SURFACE: Record<
  ClassificationSurface,
  { default: string; nearest: string }
> = {
  dashboard: { default: 'create_booking', nearest: 'create_booking' },
  provider: { default: 'create_booking', nearest: 'create_booking' },
  customer: { default: 'book_nearest_slot', nearest: 'book_nearest_slot' },
  public: { default: 'book_appointment', nearest: 'book_appointment' },
};

function buildParamsFromEntry(entry: EntityMemoryEntry): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (entry.employeeName) params.employeeName = entry.employeeName;
  if (entry.serviceName) params.serviceName = entry.serviceName;
  if (entry.customerName) params.customerName = entry.customerName;
  if (entry.templateName) params.templateName = entry.templateName;
  return params;
}

export function inferBookingActionFromPhrasing(
  prompt: string,
  surface: ClassificationSurface,
  entry?: EntityMemoryEntry,
): string | undefined {
  const hasEntities = Boolean(entry?.employeeName || entry?.serviceName);
  if (!hasEntities && !PHRASING_BOOK_VERBS.test(prompt)) return undefined;

  const actions = BOOKING_ACTION_BY_SURFACE[surface];
  if (PHRASING_NEAREST_VERBS.test(prompt)) return actions.nearest;
  if (PHRASING_BOOK_VERBS.test(prompt)) return actions.default;
  if (HABITUAL_SERVICE_PHRASES.some(({ pattern }) => pattern.test(prompt))) {
    return actions.default;
  }
  if (hasEntities && /\b(tomorrow|today|monday|at \d|:\d{2})\b/i.test(prompt)) {
    return actions.default;
  }
  return undefined;
}

function resolveHabitualAliasEntry(
  aliases: Record<string, EntityMemoryEntry>,
  aliasKeys: readonly string[],
): { alias: string; entry: EntityMemoryEntry } | null {
  for (const key of aliasKeys) {
    const entry = aliases[normalizeEntityAlias(key)];
    if (entry) return { alias: normalizeEntityAlias(key), entry };
  }
  return null;
}

/** acc-3.2 — match prompt against learned aliases and habitual business phrasing. */
export function findPhrasingMemoryHits(
  prompt: string,
  entityMemory: EntityMemory | undefined,
  surface: ClassificationSurface,
): PhrasingMemoryHit[] {
  const aliases = entityMemory?.aliases ?? {};
  const lower = prompt.toLowerCase();
  const hits: PhrasingMemoryHit[] = [];
  const seen = new Set<string>();

  for (const alias of findAliasMentionsInPrompt(prompt, aliases)) {
    const key = normalizeEntityAlias(alias);
    const entry = aliases[key];
    if (!entry || seen.has(key)) continue;
    seen.add(key);
    hits.push({
      alias: key,
      entry,
      matchKind: 'alias',
      suggestedAction: inferBookingActionFromPhrasing(prompt, surface, entry),
      suggestedParams: buildParamsFromEntry(entry),
    });
  }

  for (const phrase of HABITUAL_SERVICE_PHRASES) {
    if (!phrase.pattern.test(lower)) continue;
    const resolved = resolveHabitualAliasEntry(aliases, phrase.aliasKeys);
    if (!resolved || seen.has(resolved.alias)) continue;
    seen.add(resolved.alias);
    hits.push({
      alias: resolved.alias,
      entry: resolved.entry,
      matchKind: 'habitual_phrase',
      suggestedAction: inferBookingActionFromPhrasing(
        prompt,
        surface,
        resolved.entry,
      ),
      suggestedParams: buildParamsFromEntry(resolved.entry),
    });
  }

  return hits.slice(0, 8);
}

export function inferIntentBiasFromPhrasing(
  hits: PhrasingMemoryHit[],
  prompt: string,
  surface: ClassificationSurface,
): PhrasingIntentBias {
  const boostIntents = new Set<string>();
  const suggestedParams: Record<string, unknown> = {};

  for (const hit of hits) {
    Object.assign(suggestedParams, hit.suggestedParams);
    if (hit.suggestedAction) boostIntents.add(hit.suggestedAction);
    if (hit.entry.serviceName && PHRASING_BOOK_VERBS.test(prompt)) {
      boostIntents.add(
        BOOKING_ACTION_BY_SURFACE[surface].default,
      );
    }
  }

  const primary = hits.find((hit) => hit.suggestedAction);
  return {
    boostIntents: [...boostIntents],
    suggestedAction: primary?.suggestedAction,
    suggestedParams,
  };
}

export function buildPhrasingMemoryBlock(
  hits: PhrasingMemoryHit[],
  surface: ClassificationSurface,
): string {
  if (hits.length === 0) return '';

  const lines = hits.map((hit) => {
    const parts = [
      hit.entry.employeeName ? `provider=${hit.entry.employeeName}` : null,
      hit.entry.serviceName ? `service=${hit.entry.serviceName}` : null,
      hit.entry.customerName ? `customer=${hit.entry.customerName}` : null,
      hit.suggestedAction ? `likely_action=${hit.suggestedAction}` : null,
    ].filter(Boolean);
    const kind =
      hit.matchKind === 'habitual_phrase' ? 'habitual phrase' : 'nickname/shorthand';
    return `- "${hit.alias}" (${kind}) → ${parts.join(', ') || 'business shorthand'}`;
  });

  return [
    `Business phrasing memory (acc-3.2, surface=${surface}):`,
    ...lines,
    'When these aliases appear, map them to the learned entities and prefer the likely_action when the user is booking.',
  ].join('\n');
}

export function applyPhrasingBiasToShortlist(
  shortlist: string[],
  boostIntents: string[],
  limit: number,
): string[] {
  if (boostIntents.length === 0) return shortlist;
  const merged = ['unknown', ...boostIntents, ...shortlist.filter((i) => i !== 'unknown')];
  return [...new Set(merged)].slice(0, limit);
}

/** acc-3.2 — apply learned phrasing to classified intent (params + unknown rescue). */
export function applyPhrasingMemoryToClassifiedIntent(
  intent: ClassifiedIntent,
  prompt: string,
  surface: ClassificationSurface,
  entityMemory?: EntityMemory,
): ClassifiedIntent {
  const hits = findPhrasingMemoryHits(prompt, entityMemory, surface);
  if (hits.length === 0) return intent;

  const bias = inferIntentBiasFromPhrasing(hits, prompt, surface);
  const next: ClassifiedIntent = {
    ...intent,
    params: applyEntityMemoryToParams(
      { ...(intent.params ?? {}), ...bias.suggestedParams },
      entityMemory ?? { aliases: {} },
      prompt,
    ),
  };

  const shouldRescueAction =
    next.action === 'unknown' ||
    (typeof next.confidence === 'number' && next.confidence < 0.55);

  if (shouldRescueAction && bias.suggestedAction) {
    next.action = bias.suggestedAction;
    next.reasoning = `Business phrasing memory (${hits[0]?.alias})`;
    next.confidence = Math.max(next.confidence ?? 0, 0.78);
    next.params = next.params ?? {};
    next.params._classificationSource = 'phrasing_memory';
    next.params._phrasingMemoryAlias = hits[0]?.alias;
  } else if (Object.keys(bias.suggestedParams).length > 0) {
    next.params = next.params ?? {};
    next.params._phrasingMemoryAlias = hits[0]?.alias;
  }

  return next;
}

function readResolvedString(
  resolved: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = resolved[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/** acc-3.2 — deterministic alias learning from successful commands (ai-i2). */
export function extractDeterministicPhrasingAliases(
  prompt: string,
  resolved: Record<string, unknown>,
): Record<string, EntityMemoryEntry> {
  const aliases: Record<string, EntityMemoryEntry> = {};
  const employeeName = readResolvedString(resolved, [
    'employee',
    'employeeName',
  ]);
  const serviceName = readResolvedString(resolved, ['service', 'serviceName']);
  const customerName = readResolvedString(resolved, [
    'customer',
    'customerName',
  ]);
  const lower = prompt.toLowerCase();

  const baseEntry: EntityMemoryEntry = {
    employeeName: employeeName || null,
    serviceName: serviceName || null,
    customerName: customerName || null,
  };

  if (serviceName || employeeName) {
    for (const phrase of HABITUAL_SERVICE_PHRASES) {
      if (!phrase.pattern.test(lower)) continue;
      for (const aliasKey of phrase.aliasKeys) {
        aliases[normalizeEntityAlias(aliasKey)] = { ...baseEntry };
      }
    }
  }

  if (employeeName) {
    const nickname = normalizeEntityAlias(employeeName.split(/\s+/)[0] ?? '');
    if (nickname.length > 2 && lower.includes(nickname)) {
      aliases[nickname] = {
        employeeName,
        serviceName: serviceName || null,
        customerName: customerName || null,
      };
    }
  }

  if (serviceName) {
    const compact = normalizeEntityAlias(serviceName.replace(/[^\p{L}\p{N}]+/gu, ''));
    if (compact.length > 3 && lower.includes(compact)) {
      aliases[compact] = {
        serviceName,
        employeeName: employeeName || null,
        customerName: customerName || null,
      };
    }
    const firstWord = normalizeEntityAlias(serviceName.split(/\s+/)[0] ?? '');
    if (firstWord.length > 3 && lower.includes(firstWord)) {
      aliases[firstWord] = {
        serviceName,
        employeeName: employeeName || null,
      };
    }
  }

  return aliases;
}

export function matchBusinessAliasIntent(
  prompt: string,
  surface: ClassificationSurface,
  entityMemory?: EntityMemory,
): {
  action: string;
  confidence: number;
  matchedPhraseId: string;
  source: 'business_alias';
} | null {
  const hits = findPhrasingMemoryHits(prompt, entityMemory, surface);
  const hit = hits.find((entry) => entry.suggestedAction);
  if (!hit?.suggestedAction) return null;

  return {
    action: hit.suggestedAction,
    confidence: hit.matchKind === 'habitual_phrase' ? 0.8 : 0.75,
    matchedPhraseId: `alias:${hit.alias}`,
    source: 'business_alias',
  };
}
