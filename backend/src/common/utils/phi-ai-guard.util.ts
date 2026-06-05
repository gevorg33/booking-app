import {
  isHipaaModeActive,
  objectContainsPhiFields,
  PHI_FIELD_NAMES,
  type PhiFieldName,
} from './business-compliance.util.js';

export const PHI_AI_BLOCK_REASON = 'phi_in_context' as const;

export interface PhiAiGuardAssessment {
  blocked: boolean;
  reason?: typeof PHI_AI_BLOCK_REASON;
  matchedFields?: PhiFieldName[];
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
  },
): PhiAiGuardAssessment {
  if (!isHipaaModeActive(settings, businessType)) {
    return { blocked: false };
  }
  if (!payload.context || !objectContainsPhiFields(payload.context)) {
    return { blocked: false };
  }
  return {
    blocked: true,
    reason: PHI_AI_BLOCK_REASON,
    matchedFields: listPhiFieldsInValue(payload.context),
  };
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

export function phiAiBlockMessage(): string {
  return 'HIPAA mode is on — protected health fields cannot be sent to the AI assistant. Remove symptoms, referral notes, or clinical notes from the request.';
}
