/**
 * AI-ROADMAP §3.3 — honest partial success.
 *
 * > "Partial-success honesty is a hard requirement. […] The response must be
 * > built from execution *results*, never from restating the request."
 *
 * Three separate false-success bugs were found on this programme — e2e-bug.136
 * (`clear_schedule`), e2e-bug.348 ("category created" when it wasn't) and
 * e2e-bug.256 (clinic compounds) — and every one of them had the same shape: a
 * response assembled from what the user *asked for* rather than from what
 * happened.
 *
 * The defence here is structural, not diligence. `buildPlanResponse` takes
 * `StepResult[]` and nothing else. The prompt, the plan and the user's wording
 * are not parameters, so no future edit can accidentally reintroduce "I've
 * cancelled your bookings" for a run that cancelled nothing — the text is not
 * reachable from this function.
 */
import type {
  PlanExecutionResult,
  StepResult,
} from './ai-plan-executor.util.js';

export interface PlanResponse {
  /**
   * True only when every step executed. A partial run is not a success, no
   * matter how much of it worked.
   */
  success: boolean;
  /** User-facing text, derived entirely from step outcomes. */
  summary: string;
  /** Machine-readable breakdown for the client and for telemetry. */
  details: {
    executed: string[];
    failed: { command: string; error: string | null }[];
    skipped: { command: string; blockedBy: string | null }[];
  };
}

/**
 * Human label for a command id. Falls back to the id itself rather than
 * inventing prose — an unrecognised command should read as slightly technical,
 * never as a confident description of something that may not have happened.
 */
export type CommandLabeller = (command: string) => string;

const defaultLabeller: CommandLabeller = (command) =>
  command.includes('.') ? command.split('.').slice(1).join('.') : command;

function list(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Build the response from results.
 *
 * Note the signature: there is no `prompt` and no `plan`. That is the whole
 * mechanism — the request is not in scope, so the response cannot be a
 * restatement of it.
 */
export function buildPlanResponse(
  steps: readonly StepResult[],
  labeller: CommandLabeller = defaultLabeller,
): PlanResponse {
  const executed = steps.filter((s) => s.status === 'executed');
  const failed = steps.filter((s) => s.status === 'failed');
  const skipped = steps.filter((s) => s.status === 'skipped');

  const details = {
    executed: executed.map((s) => s.command),
    failed: failed.map((s) => ({ command: s.command, error: s.error })),
    skipped: skipped.map((s) => ({
      command: s.command,
      blockedBy: s.blockedBy,
    })),
  };

  if (steps.length === 0) {
    return { success: false, summary: 'Nothing ran.', details };
  }

  const success = failed.length === 0 && skipped.length === 0;
  const label = (s: StepResult): string => labeller(s.command);

  if (success) {
    return {
      success: true,
      summary: `Done: ${list(executed.map(label))}.`,
      details,
    };
  }

  const parts: string[] = [];

  // What actually happened comes first, and only if something did. Leading
  // with the failure would be honest but unhelpful; claiming work that did not
  // happen would be helpful but dishonest.
  if (executed.length) {
    parts.push(`Done: ${list(executed.map(label))}.`);
  }

  for (const step of failed) {
    parts.push(
      step.error
        ? `Couldn't ${label(step)}: ${step.error}.`
        : `Couldn't ${label(step)}.`,
    );
  }

  // Skipped steps are reported as not-attempted, which is what they are.
  // Calling them failures would triple-count one failure as three.
  if (skipped.length) {
    parts.push(
      `Didn't attempt ${list(skipped.map(label))}, because an earlier step didn't succeed.`,
    );
  }

  if (executed.length === 0 && failed.length === 0) {
    // Everything was skipped — possible when the first step is a dependency of
    // all the others and was itself skipped upstream.
    return {
      success: false,
      summary: 'Nothing ran, because an earlier step did not succeed.',
      details,
    };
  }

  return { success: false, summary: parts.join(' '), details };
}

/**
 * Response for a whole execution, including the refusal case.
 *
 * A refused plan wrote nothing, so it reports the refusal rather than a list of
 * outcomes — there are none.
 */
export function buildExecutionResponse(
  execution: PlanExecutionResult,
  labeller: CommandLabeller = defaultLabeller,
): PlanResponse {
  if (execution.status === 'refused') {
    return {
      success: false,
      summary: execution.refusedBecause ?? 'That plan cannot run.',
      details: { executed: [], failed: [], skipped: [] },
    };
  }
  return buildPlanResponse(execution.steps, labeller);
}
