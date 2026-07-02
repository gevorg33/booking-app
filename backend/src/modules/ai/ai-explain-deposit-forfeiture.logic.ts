import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import { handleExplainCancelPolicyLogic } from './ai-explain-cancel-policy.logic.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';

export async function handleExplainDepositForfeitureLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return {
      success: false,
      action: 'explain_deposit_forfeiture',
      summary: 'Business not found.',
      details: {},
    };
  }

  const payment = resolvePublicPaymentSettings(business.settings);
  const result = await handleExplainCancelPolicyLogic(
    deps,
    businessId,
    params,
    prompt,
  );

  return {
    ...result,
    action: 'explain_deposit_forfeiture',
    details: {
      ...(result.details ?? {}),
      focusDepositForfeiture: true,
      prepaymentMode: payment.defaultServicePrepaymentMode ?? 'none',
      defaultDepositPercent: payment.defaultServiceDepositPercent ?? null,
    },
  };
}
