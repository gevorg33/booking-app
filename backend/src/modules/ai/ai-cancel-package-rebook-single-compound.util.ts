import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { enrichCancelPackageVisitSelfParamsFromPrompt } from './ai-cancel-package-visit-self.util.js';
import {
  extractBookSingleServiceFromPrompt,
  hasCancelPackageRebookSingleBookCue,
  hasCancelPackageRebookSinglePackageCue,
  isCancelPackageRebookSingleCompoundCandidate,
} from './ai-cancel-package-rebook-single-cue.util.js';
import {
  CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS,
  type CancelPackageRebookSingleCompoundFixture,
} from './ai-cancel-package-rebook-single-compound.fixtures.js';
import { CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-rebook-single-compound-multilingual.fixtures.js';

export const CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID =
  'cancel_package_rebook_single';

export type CancelPackageRebookSingleCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment: string;
};

function matchCancelPackageRebookSingleScenario(
  prompt: string,
): CancelPackageRebookSingleCompoundFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of CANCEL_PACKAGE_REBOOK_SINGLE_COMPOUND_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractCancelPackageSegmentFromCompoundPrompt(
  prompt: string,
): string {
  const split = prompt.match(
    /^(.*?)(?:\s*[;]\s*|\s+\band\b\s+|\s+\bthen\b\s+|\s*[—–]\s*)(?=\b(?:book|schedule|reserve|get)\b)/i,
  );
  if (split?.[1]?.trim()) {
    return split[1].trim();
  }
  return prompt;
}

export function isCancelPackageRebookSingleCompoundPrompt(
  prompt: string,
): boolean {
  if (matchCancelPackageRebookSingleScenario(prompt)) return true;
  return isCancelPackageRebookSingleCompoundCandidate(prompt.trim());
}

export function buildCancelPackageRebookSingleCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const scenario = matchCancelPackageRebookSingleScenario(prompt);
  const cancelSegment = extractCancelPackageSegmentFromCompoundPrompt(prompt);
  const params = enrichCancelPackageVisitSelfParamsFromPrompt(
    {
      ...buildSharedBookingContextFromPrompt(prompt),
      cancelPackageRebookSingle: true,
    },
    cancelSegment,
  );

  const serviceName =
    (scenario?.expectedParams?.serviceName as string | undefined) ??
    extractBookSingleServiceFromPrompt(prompt);
  if (serviceName) params.serviceName = serviceName;

  enrichBookingTimeHintsFromPrompt('book_nearest_slot', params, prompt);

  if (scenario?.expectedParams) {
    Object.assign(params, scenario.expectedParams);
  }

  return params;
}

export function decomposeCancelPackageRebookSingleCompoundPrompt(
  prompt: string,
): CancelPackageRebookSingleCompoundStep[] {
  if (!isCancelPackageRebookSingleCompoundPrompt(prompt)) return [];

  const base = buildCancelPackageRebookSingleCompoundParams(prompt);

  return propagateSharedBookingContextAcrossSteps([
    {
      action: 'cancel_package_visit_self',
      params: { ...base },
      segment: prompt,
    },
    {
      action: 'book_nearest_slot',
      params: {
        ...base,
        continueAfterPackageCancel: true,
        singleServiceBooking: true,
      },
      segment: prompt,
    },
  ]);
}

export function rescueCancelPackageRebookSingleCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isCancelPackageRebookSingleCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'cancel_package_rebook_single_compound',
  };
}
