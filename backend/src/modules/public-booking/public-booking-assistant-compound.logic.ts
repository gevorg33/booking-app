import { mergeCheckProvidersHandoffIntoContext } from '../ai/ai-check-book-handoff.util.js';
import { mergeSharedBookingStepParams } from '../ai/ai-compound-booking-context.util.js';
import type { DecomposedIntentStep } from '../ai/intent-decomposition.types.js';
import type { PublicAssistantResult } from './public-booking-assistant.service.js';

export type PublicAssistantCompoundHandlers = {
  runStep: (
    action: string,
    params: Record<string, unknown>,
    segment: string,
  ) => Promise<PublicAssistantResult>;
};

function mergePublicCompoundContext(
  context: Record<string, unknown>,
  result: PublicAssistantResult,
  stepParams: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...context };
  if (result.sessionContext && typeof result.sessionContext === 'object') {
    Object.assign(next, result.sessionContext);
  }
  if (stepParams.serviceId != null && stepParams.serviceId !== '') {
    next.serviceId = stepParams.serviceId;
  }
  if (stepParams.maxPrice != null && stepParams.maxPrice !== '') {
    next.maxPrice = stepParams.maxPrice;
  }
  if (stepParams.serviceRank != null && stepParams.serviceRank !== '') {
    next.serviceRank = stepParams.serviceRank;
  }
  if (Array.isArray(stepParams.availabilityWindows)) {
    next.availabilityWindows = stepParams.availabilityWindows;
  }
  if (result.sessionContext && typeof result.sessionContext === 'object') {
    const session = result.sessionContext as Record<string, unknown>;
    if (session.chosenAvailabilityWindow) {
      next.chosenAvailabilityWindow = session.chosenAvailabilityWindow;
    }
    if (session.timeOfDay) {
      next.timeOfDay = session.timeOfDay;
    }
  }
  if (stepParams.chosenAvailabilityWindow) {
    next.chosenAvailabilityWindow = stepParams.chosenAvailabilityWindow;
  }
  if (stepParams.chosenAvailabilityWindowIndex != null) {
    next.chosenAvailabilityWindowIndex = stepParams.chosenAvailabilityWindowIndex;
  }
  const details = (result.details ?? {}) as Record<string, unknown>;
  if (details.serviceId != null) {
    next.serviceId = details.serviceId;
  }
  return mergeCheckProvidersHandoffIntoContext(next, {
    success: result.success,
    action: result.action,
    summary: result.summary,
    details: result.details,
  });
}

export async function executePublicAssistantCompoundFromSteps(
  prompt: string,
  steps: DecomposedIntentStep[],
  initialSession: Record<string, unknown>,
  handlers: PublicAssistantCompoundHandlers,
): Promise<PublicAssistantResult> {
  if (steps.length < 2) {
    return {
      success: false,
      action: 'compound_intent',
      summary:
        'Could not split this into multiple booking steps. Try separating with "and" or semicolons.',
    };
  }

  const results: PublicAssistantResult[] = [];
  let compoundContext: Record<string, unknown> = { ...initialSession };

  for (const step of steps.slice(0, 4)) {
    const stepParams = mergeSharedBookingStepParams(compoundContext, {
      ...step.params,
      _prompt: step.segment,
    });
    const result = await handlers.runStep(
      step.action,
      stepParams,
      step.segment,
    );
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((entry) => entry.action),
          failedStep: step.action,
          publicCompound: true,
          decomposed: true,
        },
      };
    }
    compoundContext = mergePublicCompoundContext(
      compoundContext,
      result,
      stepParams,
    );
  }

  const last = results[results.length - 1]!;
  return {
    ...last,
    action: 'compound_intent',
    summary: `Completed ${results.length} step(s): ${results
      .map((entry) => entry.action.replace(/_/g, ' '))
      .join(', ')}. ${last.summary}`,
    details: {
      ...(last.details ?? {}),
      steps: results.map((entry) => ({
        action: entry.action,
        summary: entry.summary,
      })),
      publicCompound: true,
      decomposed: true,
    },
  };
}
