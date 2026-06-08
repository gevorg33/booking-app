/** acc-5.6 — reject auto-execute plans older than this. */
export const PLAN_STALE_TTL_MS = 5 * 60 * 1000;

/** acc-5.3 — medium-risk mutations that need plan diff preview (not just high-risk). */
export { MEDIUM_RISK_PREVIEW_ACTIONS } from './ai-mutation-preview-diff.fixtures.js';

export {
  RESOLUTION_CONFIDENCE_THRESHOLD,
  RESOLUTION_VERIFY_SCENARIOS,
} from './ai-resolution-accuracy-guard.fixtures.js';

export type { ResolutionVerifyScenario } from './ai-resolution-accuracy-guard.fixtures.js';

export {
  BLAST_RADIUS_CAPS,
  BLAST_RADIUS_PARAM_SCENARIOS,
  BLAST_RADIUS_PLAN_SCENARIOS,
} from './ai-blast-radius-cap.fixtures.js';

export type { BlastRadiusScenario } from './ai-blast-radius-cap.fixtures.js';

/** @deprecated use BLAST_RADIUS_PARAM_SCENARIOS */
export { BLAST_RADIUS_PARAM_SCENARIOS as BLAST_RADIUS_SCENARIOS } from './ai-blast-radius-cap.fixtures.js';

export {
  INTENT_GRADUATION_ACCURACY,
  INTENT_GRADUATION_MIN_SAMPLES,
  INTENT_GRADUATION_SCENARIOS,
  PROPOSE_ONLY_UNTIL_GRADUATED,
} from './ai-intent-graduation.fixtures.js';

export {
  PLAN_VERIFY_SCENARIOS,
  PLAN_VS_PROMPT_SCENARIOS,
} from './ai-plan-vs-prompt-check.fixtures.js';

export type { PlanVerifyScenario } from './ai-plan-vs-prompt-check.fixtures.js';
