import type { CommandResult } from './command-completion.types.js';
import type { AiCommandTraceOutcome } from './entities/ai-command-trace.entity.js';

/** pipe-1.10.1 — persisted command trace row (acc-1.1). */
export const AI_COMMAND_TRACE_PIPE_MARKER = 'pipe-1.10.1';

export type CommandTraceOutcomeScenario = {
  id: string;
  result: Pick<CommandResult, 'success' | 'action' | 'details'>;
  expectedOutcome: AiCommandTraceOutcome;
};

export const COMMAND_TRACE_OUTCOME_SCENARIOS: CommandTraceOutcomeScenario[] = [
  {
    id: 'executed-success',
    result: { success: true, action: 'create_booking', details: {} },
    expectedOutcome: 'executed',
  },
  {
    id: 'clarified-needs-fields',
    result: {
      success: false,
      action: 'create_booking',
      details: { needsClarification: true },
    },
    expectedOutcome: 'clarified',
  },
  {
    // e2e-bug.411 — the shape 646 call sites across 178 files actually use.
    // Only `needsClarification` (19 sites) was recognised, so every handler
    // asking the user a question was recorded as a failure.
    id: 'clarified-clarify-key',
    result: {
      success: false,
      action: 'claim_referral_code',
      details: { clarify: true, missing: ['referralCode'] },
    },
    expectedOutcome: 'clarified',
  },
  {
    id: 'clarified-structured-request',
    result: {
      success: false,
      action: 'find_soonest_appointment',
      details: { clarifyRequest: { field: 'serviceName' } },
    },
    expectedOutcome: 'clarified',
  },
  {
    // The boundary: a real failure must stay a failure. Reclassifying these
    // would hide defects behind a friendlier label, which is the opposite of
    // what this change is for.
    id: 'failed-not-a-question',
    result: {
      success: false,
      action: 'pay_online',
      details: { reason: 'card_declined' },
    },
    expectedOutcome: 'failed',
  },
  {
    id: 'approval-preview',
    result: {
      success: true,
      action: 'cancel_bookings',
      details: { requiresExecutionConfirmation: true },
    },
    expectedOutcome: 'approval',
  },
  {
    id: 'security-blocked',
    result: {
      success: false,
      action: 'security_blocked',
      details: {},
    },
    expectedOutcome: 'security_blocked',
  },
  {
    id: 'failed-error',
    result: {
      success: false,
      action: 'error',
      details: {},
    },
    expectedOutcome: 'failed',
  },
  {
    id: 'unknown-clarify',
    result: {
      success: false,
      action: 'unknown',
      details: { needsClarification: true },
    },
    expectedOutcome: 'clarified',
  },
];

export const COMMAND_TRACE_REDACT_SCENARIOS = [
  {
    id: 'phi-field-redacted',
    params: {
      customerName: 'Anna',
      symptoms: 'headache',
      notes: 'private',
    },
    expectKeys: ['customerName', 'symptoms', 'notes'],
    forbiddenKeys: [] as string[],
    redactedPhiKeys: ['symptoms', 'notes'],
  },
  {
    id: 'internal-catalog-stripped',
    params: {
      serviceName: 'Haircut',
      _availableEmployees: 'Gevorg, Mary',
      _availableServices: 'Haircut, Massage',
    },
    expectKeys: ['serviceName'],
    forbiddenKeys: ['_availableEmployees', '_availableServices'],
  },
] as const;
