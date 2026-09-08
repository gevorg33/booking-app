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
  // e2e-bug.442 — `patch` is the parsed mutation echoed back, and for the
  // integration commands it carries **plaintext credentials**:
  // `configure_openai_integration` puts `apiKey` ("sk-…", encrypted only once
  // it reaches storage) in it, and `configure_whatsapp_integration` puts
  // `accessToken`. Neither key is `_`-prefixed and `patch` was not listed here,
  // so `sanitizeCommandDetailsForClient` passed both through to the client
  // verbatim.
  //
  // Stripped as a **category** rather than by redacting those two field names:
  // `patch` is an echo of what the caller already sent, so no client needs it
  // back, and the user-facing result is in `settings`. Blacklisting `apiKey`
  // and `accessToken` instead would leave the next credential-bearing patch to
  // leak — the same blacklist-chases-an-open-set problem as e2e-bug.446.
  'patch',
  'reasoning',
  'pipelineStage',
  '_availableEmployees',
  '_availableServices',
] as const;

/** Param-bag detail fields that mix real business params with internal `_`-prefixed hints. */
const PARAM_BAG_DETAIL_KEYS = new Set([
  'params',
  'partialParams',
  'enrichedParams',
]);

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
