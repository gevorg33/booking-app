import type { CommandResult } from './command-completion.types.js';
import type { MarketingGrowthLogicDeps } from './ai-marketing-growth.logic.js';
import { getEarnPercentCashback } from '../loyalty/loyalty-settings.util.js';
import { BONUS_DOLLAR_VALUE } from '../loyalty/loyalty.constants.js';
import {
  buildLoyaltyPointsExplainCopy,
  parseExplainLoyaltyPointsFromPrompt,
} from './ai-explain-loyalty-points.util.js';

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

function isLoyaltyProgramEnabled(
  settings?: Record<string, unknown> | null,
): boolean {
  const loyalty = settings?.loyalty;
  if (!loyalty || typeof loyalty !== 'object') return true;
  return (loyalty as Record<string, unknown>).enabled !== false;
}

export async function handleExplainLoyaltyPointsLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainLoyaltyPointsFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_loyalty_points',
      'Ask how loyalty points are earned or what they are worth.',
      { clarify: true },
    );
  }

  try {
    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    if (!business) {
      return failure('explain_loyalty_points', 'Business not found.');
    }

    const enabled = isLoyaltyProgramEnabled(business.settings);
    let pointsBalance: number | undefined;
    let pointsValue: number | undefined;
    let lifetimeEarned: number | undefined;

    const customerId = resolveSessionCustomerId(params);
    if (customerId) {
      const { account } = await deps.loyaltyService.getBalance(
        businessId,
        customerId,
      );
      const summary = deps.loyaltyService.getPublicSummary(
        account,
        business.settings,
      );
      pointsBalance = summary.pointsBalance;
      pointsValue = summary.pointsValue;
      lifetimeEarned = summary.lifetimeEarned;
    }

    const copy = buildLoyaltyPointsExplainCopy({
      enabled,
      earnPercentCashback: getEarnPercentCashback(business.settings),
      bonusDollarValue: BONUS_DOLLAR_VALUE,
      pointsBalance,
      pointsValue,
      lifetimeEarned,
      focus: parsed.focus,
    });

    return success('explain_loyalty_points', copy.summary, {
      focus: copy.focus,
      earnPercentCashback: copy.earnPercentCashback,
      bonusDollarValue: copy.bonusDollarValue,
      enabled,
      ...(copy.pointsBalance != null
        ? {
            pointsBalance: copy.pointsBalance,
            pointsValue: copy.pointsValue,
            lifetimeEarned,
          }
        : {}),
      navigate: { path: 'account', query: { section: 'loyalty' } },
    });
  } catch (err: any) {
    return failure(
      'explain_loyalty_points',
      err?.message ?? 'Could not explain loyalty points.',
    );
  }
}
