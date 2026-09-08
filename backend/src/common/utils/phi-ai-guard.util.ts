import {
  isHipaaModeActive,
  objectContainsPhiFields,
  PHI_FIELD_NAMES,
  type PhiFieldName,
} from './business-compliance.util.js';
import { redactLegacyPatientTestResultRows } from './legacy-booking-patient-test-results-phi.util.js';
import { LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY } from './legacy-booking-patient-test-results-phi.util.js';

export const PHI_AI_BLOCK_REASON = 'phi_in_context' as const;
export const PHI_AI_PROMPT_BLOCK_REASON = 'phi_in_prompt' as const;

export type PhiAiBlockReason =
  | typeof PHI_AI_BLOCK_REASON
  | typeof PHI_AI_PROMPT_BLOCK_REASON;

export interface PhiAiGuardAssessment {
  blocked: boolean;
  reason?: PhiAiBlockReason;
  matchedFields?: PhiFieldName[];
}

const PHI_PROMPT_KV_PATTERNS: Array<{
  fields: PhiFieldName[];
  pattern: RegExp;
}> = [
  {
    fields: ['symptoms'],
    pattern: /\bsymptoms\s*[:=]\s*["']?[^\s"',\n}]+/i,
  },
  {
    fields: ['referralNotes'],
    pattern: /\breferral\s+notes?\s*[:=]\s*["']?[^\s"',\n}]+/i,
  },
  {
    fields: ['notes'],
    pattern: /\bpatient\s+notes?\s*[:=]\s*["']?[^\s"',\n}]+/i,
  },
  {
    fields: ['patient_test_results'],
    pattern: /\bpatient\s+test\s+results?\s*[:=]\s*["']?[^\s"',\n}]+/i,
  },
];

const PHI_JSON_FIELD_PATTERN = new RegExp(
  `["']?(?:${PHI_FIELD_NAMES.join('|')})["']?\\s*[:=]`,
  'i',
);

function tryParseLooseJsonObject(chunk: string): unknown | null {
  const trimmed = chunk.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    try {
      const normalized = trimmed.replace(
        /([{,]\s*)([A-Za-z_][\w]*)(\s*:)/g,
        '$1"$2"$3',
      );
      return JSON.parse(normalized) as unknown;
    } catch {
      return null;
    }
  }
}

function extractJsonObjectsFromPrompt(prompt: string): unknown[] {
  const objects: unknown[] = [];
  const chunks = prompt.match(/\{[^{}]*\}/g) ?? [];
  for (const chunk of chunks) {
    if (!PHI_JSON_FIELD_PATTERN.test(chunk)) continue;
    const parsed = tryParseLooseJsonObject(chunk);
    if (parsed != null) objects.push(parsed);
  }
  return objects;
}

export function detectPhiPayloadInPrompt(prompt: string): PhiFieldName[] {
  const found = new Set<PhiFieldName>();

  for (const obj of extractJsonObjectsFromPrompt(prompt)) {
    for (const field of listPhiFieldsInValue(obj)) {
      found.add(field);
    }
  }

  for (const { fields, pattern } of PHI_PROMPT_KV_PATTERNS) {
    if (pattern.test(prompt)) {
      for (const field of fields) found.add(field);
    }
  }

  return [...found];
}

export function listPhiFieldsInValue(
  value: unknown,
  depth = 0,
  found = new Set<PhiFieldName>(),
): PhiFieldName[] {
  if (depth > 4 || value == null) return [...found];
  if (typeof value !== 'object') return [...found];
  if (Array.isArray(value)) {
    for (const item of value) {
      listPhiFieldsInValue(item, depth + 1, found);
    }
    return [...found];
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if ((PHI_FIELD_NAMES as readonly string[]).includes(key)) {
      found.add(key as PhiFieldName);
    }
    listPhiFieldsInValue(nested, depth + 1, found);
  }
  return [...found];
}

export function assessPhiInAiContext(
  settings: Record<string, unknown> | undefined,
  businessType: string | null | undefined,
  payload: {
    context?: Record<string, unknown> | null;
    prompt?: string | null;
  },
): PhiAiGuardAssessment {
  if (!isHipaaModeActive(settings, businessType)) {
    return { blocked: false };
  }

  if (payload.context && objectContainsPhiFields(payload.context)) {
    return {
      blocked: true,
      reason: PHI_AI_BLOCK_REASON,
      matchedFields: listPhiFieldsInValue(payload.context),
    };
  }

  const prompt = payload.prompt?.trim();
  if (prompt) {
    const matchedFields = detectPhiPayloadInPrompt(prompt);
    if (matchedFields.length > 0) {
      return {
        blocked: true,
        reason: PHI_AI_PROMPT_BLOCK_REASON,
        matchedFields,
      };
    }
  }

  return { blocked: false };
}

export function redactPhiFromValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactPhiFromValue(item, depth + 1));
  }
  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      key === LEGACY_BOOKING_PATIENT_TEST_RESULTS_METADATA_KEY &&
      Array.isArray(nested)
    ) {
      next[key] = redactLegacyPatientTestResultRows(nested);
      continue;
    }
    if ((PHI_FIELD_NAMES as readonly string[]).includes(key)) {
      next[key] = '[REDACTED_PHI]';
      continue;
    }
    next[key] = redactPhiFromValue(nested, depth + 1);
  }
  return next;
}

/**
 * Credential patterns stripped from a prompt before it is persisted — e2e-bug.464.
 *
 * Separate from `PHI_PROMPT_KV_PATTERNS` because it answers a different
 * question: PHI is data the user legitimately supplies that we must not retain,
 * whereas a secret is something that should never have been in a prompt at all.
 *
 * The first pattern is deliberately the same shape as the one
 * `parseApiKey` (`ai-openai-integration.util.ts`) uses to *extract* an OpenAI
 * key from prompt text, so anything that scraper can find, this can redact —
 * they cannot drift apart silently.
 *
 * The second is a key/value form for provider tokens that carry no distinctive
 * prefix (Zendesk's `apiToken` is an opaque string), matching only when a
 * credential-ish label precedes the value, so ordinary prose is untouched.
 */
const SECRET_PROMPT_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{8,}/g,
  /\b(api[\s_-]?(?:token|key)|secret|password)\s*[:=]\s*["']?[^\s"',\n}]+/gi,
];

/**
 * Strip credentials from a prompt. Applied at the trace boundary alongside the
 * PHI redaction — see `redactCommandTracePrompt`.
 */
export function redactSecretsFromPrompt(prompt: string): string {
  let next = prompt;
  for (const pattern of SECRET_PROMPT_PATTERNS) {
    next = next.replace(pattern, (match) => {
      const separator = match.includes('=')
        ? '='
        : match.includes(':')
          ? ':'
          : null;
      if (!separator) return '[REDACTED_SECRET]';
      const [prefix] = match.split(separator);
      return `${prefix}${separator} [REDACTED_SECRET]`;
    });
  }
  return next;
}

/**
 * Credential-bearing field names on command *details*.
 *
 * `redactSecretsFromPrompt` covers the trace's prompt text; this covers the
 * structured half. `configure_openai_integration` and
 * `configure_whatsapp_integration` both echo their parsed patch back to the
 * client as `patch: parsed`, and that patch carries a plaintext `apiKey`
 * (`sk-…`) / `accessToken` — the value the user was asked for, handed straight
 * back in the response and stored with the trace.
 */
const SECRET_DETAIL_KEYS = new Set([
  'apiKey',
  'accessToken',
  'apiToken',
  'secret',
  'clientSecret',
  'password',
  'refreshToken',
]);

/**
 * Mask credential fields on a detail object, keeping the key.
 *
 * Masked rather than dropped on purpose: "the API key was changed" is real
 * information a client may render, and removing the key entirely changes the
 * shape for anything iterating it. Only present fields are masked, so an
 * absent credential stays absent rather than becoming a redaction marker that
 * implies one was sent.
 */
export function redactSecretDetailFields<T extends Record<string, unknown>>(
  detail: T,
): T {
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    if (SECRET_DETAIL_KEYS.has(key) && value !== undefined && value !== null) {
      next[key] = '[REDACTED_SECRET]';
      changed = true;
    } else {
      next[key] = value;
    }
  }
  return (changed ? next : detail) as T;
}

export function redactEmbeddedPhiFromPrompt(prompt: string): string {
  let next = prompt;

  for (const { pattern } of PHI_PROMPT_KV_PATTERNS) {
    next = next.replace(pattern, (match) => {
      const separator = match.includes('=') ? '=' : ':';
      const [prefix] = match.split(separator);
      return `${prefix}${separator} [REDACTED_PHI]`;
    });
  }

  next = next.replace(/\{[^{}]*\}/g, (chunk) => {
    if (!PHI_JSON_FIELD_PATTERN.test(chunk)) return chunk;
    const parsed = tryParseLooseJsonObject(chunk);
    if (parsed == null || typeof parsed !== 'object') return chunk;
    const redacted = redactPhiFromValue(parsed);
    try {
      return JSON.stringify(redacted);
    } catch {
      return chunk;
    }
  });

  return next;
}

export function phiAiBlockMessage(reason?: PhiAiBlockReason): string {
  if (reason === PHI_AI_PROMPT_BLOCK_REASON) {
    return 'HIPAA mode is on — remove symptoms, referral notes, patient notes, or clinical test results from your message before using the AI assistant.';
  }
  return 'HIPAA mode is on — protected health fields cannot be sent to the AI assistant. Remove symptoms, referral notes, or clinical notes from the request.';
}
