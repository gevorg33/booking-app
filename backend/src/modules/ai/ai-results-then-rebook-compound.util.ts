import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import {
  extractResultStatusFromPrompt,
  extractTestNameFromResultsPrompt,
  parseExplainResultStatusFromPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { parseRebookLastAppointmentFromPrompt } from './ai-rebook-last-appointment.util.js';
import { hasRebookAndPayPaymentCue } from './ai-rebook-and-pay-compound.util.js';
import {
  hasResultsThenRebookFollowUpCue,
  hasResultsThenRebookResultsCue,
} from './ai-results-then-rebook-cue.util.js';
import {
  RESULTS_THEN_REBOOK_COMPOUND_PROMPTS,
  type ResultsThenRebookCompoundFixture,
} from './ai-results-then-rebook-compound.fixtures.js';
import { RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-results-then-rebook-compound-multilingual.fixtures.js';

export const RESULTS_THEN_REBOOK_RECIPE_ID = 'results_then_rebook';

export type ResultsThenRebookCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchResultsThenRebookScenario(
  prompt: string,
): ResultsThenRebookCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of RESULTS_THEN_REBOOK_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isResultsThenRebookCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (text.length < 20) return false;
  if (hasRebookAndPayPaymentCue(text)) return false;
  if (matchResultsThenRebookScenario(text)) return true;
  if (!hasResultsThenRebookResultsCue(text)) return false;
  if (!hasResultsThenRebookFollowUpCue(text)) return false;
  return true;
}

export function buildResultsThenRebookCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchResultsThenRebookScenario(prompt);
  const explainParsed =
    parseExplainResultStatusFromPrompt(prompt, {
      resultsThenRebook: true,
    }) ?? {};
  const rebookParsed = parseRebookLastAppointmentFromPrompt(prompt) ?? {};

  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    resultsThenRebook: true,
  };

  const status =
    scenario?.status ??
    explainParsed.status ??
    extractResultStatusFromPrompt(prompt);
  if (status) params.status = status;

  const testName =
    scenario?.testName ??
    explainParsed.testName ??
    extractTestNameFromResultsPrompt(prompt);
  if (testName) params.testName = testName;

  const serviceName = scenario?.serviceName ?? rebookParsed.serviceName;
  if (serviceName) params.serviceName = serviceName;

  return params;
}

export function decomposeResultsThenRebookCompoundPrompt(
  prompt: string,
): ResultsThenRebookCompoundStep[] {
  if (!isResultsThenRebookCompoundPrompt(prompt)) return [];

  const base = buildResultsThenRebookCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'explain_result_status',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'rebook_last_appointment',
      params: { ...base, continueAfterResultExplain: true },
      segment: prompt,
    },
  ]);
}

export function rescueResultsThenRebookCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isResultsThenRebookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'results_then_rebook_compound',
  };
}
