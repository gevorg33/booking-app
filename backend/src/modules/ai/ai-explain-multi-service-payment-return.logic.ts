import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  MULTI_SERVICE_PAYMENT_RETURN_HINT,
  buildExplainMultiServicePaymentReturnNavigate,
  buildMultiServicePaymentReturnExplanation,
  parseExplainMultiServicePaymentReturnFromPrompt,
  parsePendingMultiCheckoutPaymentFromParams,
} from './ai-explain-multi-service-payment-return.util.js';

export interface ExplainMultiServicePaymentReturnLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
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

export async function handleExplainMultiServicePaymentReturnLogic(
  deps: ExplainMultiServicePaymentReturnLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainMultiServicePaymentReturnFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_multi_service_payment_return',
      'Ask about confirming a multi-service visit after Stripe checkout (e.g. "I paid but booking not confirmed" or "Return from Stripe for spa day").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure(
      'explain_multi_service_payment_return',
      'Business not found.',
    );
  }

  const { summaryParts, nextSteps } = buildMultiServicePaymentReturnExplanation(
    parsed.aspect,
  );
  const navigate = buildExplainMultiServicePaymentReturnNavigate(params);
  const pending = parsePendingMultiCheckoutPaymentFromParams(params);

  return success(
    'explain_multi_service_payment_return',
    summaryParts.filter(Boolean).join(' '),
    {
      aspect: parsed.aspect,
      hint: MULTI_SERVICE_PAYMENT_RETURN_HINT,
      nextSteps,
      ...(pending ? { pendingMultiCheckoutPayment: pending } : {}),
      ...(navigate ? { navigate } : {}),
    },
  );
}
