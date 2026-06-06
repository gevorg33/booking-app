import {
  isHipaaModeActive,
  objectContainsPhiFields,
  PHI_FIELD_NAMES,
  type PhiFieldName,
} from './business-compliance.util.js';

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
    pattern:
      /\bpatient\s+test\s+results?\s*[:=]\s*["']?[^\s"',\n}]+/i,
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
    if (key === 'patient_test_results' && Array.isArray(nested)) {
      next[key] = nested.map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const row = { ...(entry as Record<string, unknown>) };
        if ('notes' in row) row.notes = '[REDACTED_PHI]';
        return row;
      });
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
