import type { CommandResult } from './command-completion.types.js';
import type { MisrouteTelemetryPayload } from './ai-misroute-telemetry.util.js';

/** pipe-1.10.3 — persist trace on clarify, execute, misroute (acc-1). */
export const COMMAND_TRACE_RECORDER_PIPE_MARKER = 'pipe-1.10.3';

export const COMMAND_TRACE_ID_CONTEXT_KEY = '_commandTraceId';

export type CommandTraceRecorderScenario = {
  id: string;
  result: Pick<CommandResult, 'success' | 'action' | 'details'>;
  expectedOutcome: 'executed' | 'clarified' | 'approval' | 'failed' | 'security_blocked';
};

export const COMMAND_TRACE_RECORDER_SCENARIOS: CommandTraceRecorderScenario[] = [
  {
    id: 'execute-success',
    result: { success: true, action: 'create_booking', details: {} },
    expectedOutcome: 'executed',
  },
  {
    id: 'clarify-needs-fields',
    result: {
      success: false,
      action: 'create_booking',
      details: { needsClarification: true, pipelineStage: 'clarify' },
    },
    expectedOutcome: 'clarified',
  },
  {
    id: 'unknown-clarify',
    result: {
      success: false,
      action: 'unknown',
      details: { needsClarification: true, pipelineStage: 'unknown_intent_clarify' },
    },
    expectedOutcome: 'clarified',
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
    result: { success: false, action: 'security_blocked', details: {} },
    expectedOutcome: 'security_blocked',
  },
];

export const MISROUTE_TRACE_PAYLOAD_FIXTURE: MisrouteTelemetryPayload = {
  surface: 'dashboard',
  prompt: 'who is free tomorrow evening for permanent lashes',
  classifierAction: 'create_booking',
  rescuedAction: 'check_providers_for_service',
  rescueReason: 'create_booking_to_check_providers',
  classifierConfidence: 0.66,
  compoundStepCount: 1,
  scenarioId: 'dashboard-create-to-check-providers',
  misrouted: true,
  timestamp: '2026-06-12T12:00:00.000Z',
  semanticAction: 'check_providers_for_service',
  semanticConfidence: 0.79,
  pipelineStage: 'semantic_match',
  pipeMarker: 'pipe-1.10.2',
};
