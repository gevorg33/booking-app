import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  BOOKING_CHECKOUT_DRAFT_TTL_MINUTES,
  buildAvailabilityRefreshParams,
  buildExplainSlotNoLongerAvailableNavigate,
  buildSlotNoLongerAvailableExplanation,
  parseExplainSlotNoLongerAvailableFromPrompt,
} from './ai-explain-slot-no-longer-available.util.js';

export interface ExplainSlotNoLongerAvailableLogicDeps {
  businessRepo: EntityReader<Business>;
}

export type RefreshAvailabilityRunner = (
  params: Record<string, unknown>,
) => Promise<CommandResult | null>;

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleExplainSlotNoLongerAvailableLogic(
  deps: ExplainSlotNoLongerAvailableLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
  refreshAvailability?: RefreshAvailabilityRunner,
): Promise<CommandResult> {
  const parsed = parseExplainSlotNoLongerAvailableFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_slot_no_longer_available',
      'Describe the slot that disappeared (e.g. "That time disappeared" or "Someone took my slot").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_slot_no_longer_available', 'Business not found.');
  }

  const { likelyCauses, nextSteps } = buildSlotNoLongerAvailableExplanation(
    parsed.aspect,
  );
  const navigate = buildExplainSlotNoLongerAvailableNavigate(params);
  const refreshParams = buildAvailabilityRefreshParams(params);

  let availabilityResult: CommandResult | null = null;
  if (refreshParams && refreshAvailability) {
    availabilityResult = await refreshAvailability(refreshParams);
  }

  const summaryParts = [
    'That time is no longer available for you.',
    likelyCauses[0],
    `Checkout holds last about ${BOOKING_CHECKOUT_DRAFT_TTL_MINUTES} minutes while you pay online.`,
    ...(availabilityResult?.success
      ? [availabilityResult.summary]
      : refreshParams
        ? ['Pick another open time to continue booking.']
        : nextSteps),
  ];

  return success(
    'explain_slot_no_longer_available',
    summaryParts.filter(Boolean).join(' '),
    {
      aspect: parsed.aspect,
      likelyCauses,
      nextSteps,
      checkoutHoldTtlMinutes: BOOKING_CHECKOUT_DRAFT_TTL_MINUTES,
      ...(refreshParams ? { refreshAvailabilityParams: refreshParams } : {}),
      ...(availabilityResult
        ? {
            refreshedAvailability: availabilityResult.details ?? {},
            wrappedFrom: 'check_availability',
          }
        : {}),
      ...(navigate ? { navigate } : {}),
    },
  );
}
