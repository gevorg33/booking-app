import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import {
  PARITY_24_EVAL_SCENARIOS,
  type Parity24EvalScenario,
} from '../ai-parity-2.4-eval.fixtures.js';

export function parity24ScenarioToEvalCase(
  scenario: Parity24EvalScenario,
): AiCommandEvalCase {
  return {
    id: scenario.id,
    prompt: scenario.prompt,
    locale: scenario.locale,
    surface: scenario.surface,
    accessTier: scenario.accessTier,
    domain: scenario.domain,
    corpus: 'golden',
    difficulty: scenario.locale === 'en' ? 'easy' : 'medium',
    expect: {
      rescuedAction: scenario.expectedAction,
      rescueReason: scenario.rescueReason,
      needsMultilingual: scenario.locale !== 'en',
    },
  };
}

/** parity-2.4 — EN/HY/RU eval golden cases for gap-closure intents (parity-2.1–2.3). */
export const AI_COMMAND_EVAL_PARITY_24_CASES: AiCommandEvalCase[] =
  PARITY_24_EVAL_SCENARIOS.map(parity24ScenarioToEvalCase);
