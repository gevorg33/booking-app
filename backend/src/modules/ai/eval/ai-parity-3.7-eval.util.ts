import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { PARITY_37_EVAL_SCENARIOS } from '../ai-role-capability-listing.fixtures.js';

/** parity-3.7 — eval golden cases for role-aware capability listing. */
export const AI_COMMAND_EVAL_PARITY_37_CASES: AiCommandEvalCase[] =
  PARITY_37_EVAL_SCENARIOS.map((scenario) => ({
    id: scenario.id,
    prompt: scenario.prompt,
    locale: 'en',
    surface: scenario.surface,
    accessTier: scenario.accessTier,
    domain: 'parity-3.7',
    corpus: 'golden',
    difficulty: 'easy',
    expect: {
      rescuedAction: 'list_capabilities',
      rescueReason: 'role_capability_discovery',
    },
  }));
