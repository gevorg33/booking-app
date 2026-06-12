/** pipe-1.11.3 — CI gate for confidence escalation + implication corpus/eval. */
export const PIPE_CONFIDENCE_PIPE_MARKER = 'pipe-1.11.3';

export const PIPE_CONFIDENCE_SCRIPT_NAME = 'test:pipe-confidence';

/** Ordered npm steps executed by the umbrella script (acc-3.4 / pipe-1.11). */
export const PIPE_CONFIDENCE_SCRIPT_STEPS = [
  'test:pipe-confidence-gate',
  'test:pipe-implication-corpus',
  'test:pipe-self-verify',
] as const;
