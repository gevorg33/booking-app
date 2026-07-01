import type { CommandResult } from './command-completion.types.js';
import type { PublicAssistantResult } from '../public-booking/public-booking-assistant.service.js';
import {
  enrichExplainProviderAvailabilityParamsFromPrompt,
  parseExplainProviderAvailabilityFromPrompt,
} from './ai-explain-provider-availability.util.js';
import type { ProviderAvailabilityAspect } from './ai-explain-provider-availability.fixtures.js';

type AvailabilityLikeResult = CommandResult | PublicAssistantResult;

export function wrapCheckAvailabilityAsExplainProviderAvailability<
  T extends AvailabilityLikeResult,
>(result: T, aspect: ProviderAvailabilityAspect): T {
  const details =
    'details' in result && result.details && typeof result.details === 'object'
      ? result.details
      : {};

  return {
    ...result,
    action: 'explain_provider_availability',
    details: {
      ...details,
      aspect,
      wrappedFrom: 'check_availability',
    },
  };
}

export function buildExplainProviderAvailabilityClarifySummary(
  aspect: ProviderAvailabilityAspect,
): string {
  if (aspect === 'named_schedule') {
    return 'Ask if a named stylist is working on a specific day, for example "Is Marco working Saturday?"';
  }
  return 'Ask which providers have openings on a day, for example "Who has openings tomorrow?"';
}

export function prepareExplainProviderAvailabilityParams(
  params: Record<string, unknown>,
  prompt: string,
  timeZone = 'UTC',
): Record<string, unknown> | null {
  const parsed = parseExplainProviderAvailabilityFromPrompt(prompt, params);
  if (!parsed) return null;
  return enrichExplainProviderAvailabilityParamsFromPrompt(
    params,
    prompt,
    timeZone,
  );
}

export function validateExplainProviderAvailabilityParams(
  params: Record<string, unknown>,
  prompt: string,
): CommandResult | null {
  const parsed = parseExplainProviderAvailabilityFromPrompt(prompt, params);
  if (!parsed) {
    return {
      success: false,
      action: 'explain_provider_availability',
      summary:
        'Ask if a stylist is working on a day or who has openings tomorrow.',
      details: { clarify: true, missing: ['aspect'] },
    };
  }

  if (parsed.aspect === 'named_schedule' && !parsed.employeeName) {
    return {
      success: false,
      action: 'explain_provider_availability',
      summary: buildExplainProviderAvailabilityClarifySummary(parsed.aspect),
      details: {
        clarify: true,
        aspect: parsed.aspect,
        missing: ['employeeName'],
      },
    };
  }

  return null;
}
