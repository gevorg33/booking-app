/** Golden PHI guard scenarios (ai-cmd-compliance-15 / compliance-1.15). */
export const PHI_AI_GUARD_CLASSIFIER_RULES = `- HIPAA PHI guard (compliance-1.15): when HIPAA mode is on, NEVER include symptoms, referral notes, patient notes, or patient test results in the user prompt or request context — even as JSON or key:value payloads. Use booking IDs or non-clinical summaries instead. The gateway blocks phi_in_prompt and phi_in_context before classification.`;

export const PHI_GUARD_BLOCK_PROMPTS = [
  {
    id: 'json-symptoms-payload',
    prompt: 'Summarize visit {"symptoms": "severe headache"}',
    matchedFields: ['symptoms'],
    reason: 'phi_in_prompt' as const,
  },
  {
    id: 'kv-referral-notes',
    prompt: 'Add referral notes: referred by Dr Smith for MRI',
    matchedFields: ['referralNotes'],
    reason: 'phi_in_prompt' as const,
  },
  {
    id: 'kv-patient-notes',
    prompt: 'Update patient notes: chronic back pain',
    matchedFields: ['notes'],
    reason: 'phi_in_prompt' as const,
  },
  {
    id: 'json-referral-notes',
    prompt: 'Log chart {referralNotes: "cardiology referral"}',
    matchedFields: ['referralNotes'],
    reason: 'phi_in_prompt' as const,
  },
] as const;

export const PHI_GUARD_ALLOW_PROMPTS = [
  {
    id: 'list-appointments',
    prompt: 'List tomorrow appointments',
  },
  {
    id: 'who-can-see-notes',
    prompt: 'Who can see patient notes?',
  },
  {
    id: 'hipaa-timeout',
    prompt: 'What is our HIPAA session timeout?',
  },
  {
    id: 'symptoms-word-only',
    prompt: 'Summarize symptoms field policy',
  },
] as const;

export const PHI_GUARD_REDACT_PROMPTS = [
  {
    id: 'redact-symptoms-kv',
    prompt: 'Chart symptoms: fever and cough',
    redactedSubstring: 'symptoms: [REDACTED_PHI]',
  },
  {
    id: 'redact-json-notes',
    prompt: 'Save {"notes": "follow up in 2 weeks"}',
    redactedSubstring: '[REDACTED_PHI]',
  },
] as const;
