import type { CommandResult } from './command-completion.types.js';
import {
  INTELLIGENCE_CONTEXT_KEYS,
  stripIntelligenceKeysFromSessionContext,
} from './ai-intelligence-context.util.js';

/**
 * e2e-bug.135 — observability / pipeline fields that must never leave the
 * server on staff (dashboard/provider) or customer HTTP responses.
 * Telemetry/trace persistence runs on the unsanitized result first.
 */
export const INTERNAL_COMMAND_DETAIL_KEYS = [
  'pipelineTrace',
  'langGraphReasoning',
  'langGraphPath',
  'confidence',
  'candidateSource',
  'routingTier',
  'traceId',
  'traceRecorder',
  'pipeMarker',
  'gateway',
  'reactFallback',
  'understandTrace',
  'parsed',
  'reasoning',
  'pipelineStage',
  '_availableEmployees',
  '_availableServices',
] as const;

/** Param-bag detail fields that mix real business params with internal `_`-prefixed hints. */
const PARAM_BAG_DETAIL_KEYS = new Set(['params', 'partialParams', 'enrichedParams']);

const INTERNAL_DETAIL_KEY_SET = new Set<string>(INTERNAL_COMMAND_DETAIL_KEYS);

function stripUnderscoreKeys(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    out[key] = value;
  }
  return out;
}

export function sanitizeSessionContextForClient(
  sessionContext: unknown,
): Record<string, unknown> | undefined {
  if (!sessionContext || typeof sessionContext !== 'object') return undefined;
  const stripped = stripIntelligenceKeysFromSessionContext(
    sessionContext as Record<string, unknown>,
  );
  if (!stripped) return undefined;
  const withoutInternals = stripUnderscoreKeys(stripped);
  for (const key of INTELLIGENCE_CONTEXT_KEYS) {
    delete withoutInternals[key];
  }
  return Object.keys(withoutInternals).length > 0
    ? withoutInternals
    : undefined;
}

export function sanitizeCommandDetailsForClient(
  details: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!details || typeof details !== 'object') return {};

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (INTERNAL_DETAIL_KEY_SET.has(key)) continue;
    if (key.startsWith('_')) continue;
    if (key === 'sessionContext') {
      const session = sanitizeSessionContextForClient(value);
      if (session) next.sessionContext = session;
      continue;
    }
    if (
      PARAM_BAG_DETAIL_KEYS.has(key) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      next[key] = stripUnderscoreKeys(value as Record<string, unknown>);
      continue;
    }
    next[key] = value;
  }
  return next;
}

/** Strip pipeline/trace internals before Nest serializes the HTTP body. */
export function sanitizeCommandResultForClient(
  result: CommandResult,
): CommandResult {
  const details = sanitizeCommandDetailsForClient(
    (result.details ?? {}) as Record<string, unknown>,
  );
  const sanitized: CommandResult = {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details,
  };
  if (result.guide) sanitized.guide = result.guide;
  return sanitized;
}
