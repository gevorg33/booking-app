import type { PublicBookingService } from '../public-booking/public-booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  assembleShareRewardSummary,
  buildExplainShareRewardNavigate,
  parseExplainShareRewardFromPrompt,
  type ShareRewardExplainContext,
} from './ai-explain-share-reward.util.js';

export interface ExplainShareRewardLogicDeps {
  publicBookingService: Pick<PublicBookingService, 'getCustomerShareRewards'>;
}

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

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleExplainShareRewardLogic(
  deps: ExplainShareRewardLogicDeps,
  _businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainShareRewardFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_share_reward',
      'Ask how share rewards work (e.g. "Do I get points for sharing?").',
      { clarify: true },
    );
  }

  let view: ShareRewardExplainContext | null = null;
  const customerId = resolveSessionCustomerId(params);
  const slug = typeof params.slug === 'string' ? params.slug : undefined;
  if (customerId && slug) {
    const rewards = await deps.publicBookingService.getCustomerShareRewards(
      slug,
      customerId,
    );
    view = {
      enabled: rewards.enabled,
      bookingShareEnabled: rewards.bookingShareEnabled,
      salonShareEnabled: rewards.salonShareEnabled,
      bookingRewardSummary: rewards.bookingRewardSummary,
      salonRewardSummary: rewards.salonRewardSummary,
      cooldownHours: rewards.cooldownHours,
      bookingNextEligibleAt: rewards.bookingNextEligibleAt,
      salonNextEligibleAt: rewards.salonNextEligibleAt,
    };
  }

  const summary = assembleShareRewardSummary(parsed.aspect, view);

  return success('explain_share_reward', summary, {
    aspect: parsed.aspect,
    navigate: buildExplainShareRewardNavigate(parsed.aspect),
    shareRewardsEnabled: view?.enabled ?? null,
    bookingShareEnabled: view?.bookingShareEnabled ?? null,
    salonShareEnabled: view?.salonShareEnabled ?? null,
  });
}
