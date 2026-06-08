import type { CommandResult } from './command-completion.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import {
  ESCALATION_HANDOFF_CLARIFY_ROUNDS,
  ESCALATION_HANDOFF_SCENARIOS,
} from './ai-escalation-handoff.fixtures.js';
import {
  isStillUncertainAfterClarify,
  readClarifyRound,
  type HonestFailureClarifyInput,
} from './ai-honest-failure-clarify.util.js';

export {
  ESCALATION_HANDOFF_CLARIFY_ROUNDS,
  ESCALATION_HANDOFF_SCENARIOS,
} from './ai-escalation-handoff.fixtures.js';

export type EscalationHandoffRoute =
  | 'staff_owner'
  | 'support_ticket'
  | 'ai_ops';

export interface EscalationHandoffDetails {
  humanHandoff: true;
  getHelp: true;
  escalate: true;
  clarifySource: 'human_handoff';
  clarifyKind: 'human_handoff';
  escalationRoute: EscalationHandoffRoute;
  escalationSurface: ClassificationSurface;
  clarifyRound: number;
  pipelineStage: 'clarify';
  failureSignal: 'human_escalation';
}

export function resolveEscalationHandoffRoute(
  surface: ClassificationSurface,
): EscalationHandoffRoute {
  if (surface === 'dashboard' || surface === 'provider') return 'staff_owner';
  if (surface === 'customer') return 'support_ticket';
  return 'ai_ops';
}

export function buildEscalationHandoffSummary(
  surface: ClassificationSurface,
): string {
  if (surface === 'customer' || surface === 'public') {
    return "I'm still not confident I understood. Tap Get help to open a support ticket and our team will finish this for you.";
  }
  return "I'm still not confident I understood after two tries. Tap Get help to notify your team in AI Ops.";
}

export function shouldOfferHumanHandoff(
  input: HonestFailureClarifyInput,
): boolean {
  const round = readClarifyRound(input.sessionContext);
  if (round < ESCALATION_HANDOFF_CLARIFY_ROUNDS) return false;
  return isStillUncertainAfterClarify(input);
}

export function buildEscalationHandoffResult(
  input: HonestFailureClarifyInput,
): CommandResult | null {
  if (!shouldOfferHumanHandoff(input)) return null;

  const route = resolveEscalationHandoffRoute(input.surface);
  const action =
    input.surface === 'customer' || input.surface === 'public'
      ? 'contact_support'
      : 'clarify';

  return {
    success: false,
    action,
    summary: buildEscalationHandoffSummary(input.surface),
    details: {
      needsClarification: true,
      clarify: true,
      humanHandoff: true,
      getHelp: true,
      escalate: true,
      clarifySource: 'human_handoff',
      clarifyKind: 'human_handoff',
      escalationRoute: route,
      escalationSurface: input.surface,
      clarifyRound: readClarifyRound(input.sessionContext),
      pipelineStage: 'clarify',
      failureSignal: 'human_escalation',
      reasoning: input.reasoning,
      originalPrompt:
        (input.sessionContext?._clarifyContext as { originalPrompt?: string } | undefined)
          ?.originalPrompt ?? input.prompt,
    } satisfies EscalationHandoffDetails & Record<string, unknown>,
  };
}
