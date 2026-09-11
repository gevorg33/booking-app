import type { Repository } from 'typeorm';
import type {
  EntityReader,
} from './ai-logic-repo.types.js';
import type { Business } from '../business/entities/business.entity.js';
import { resolvePublicPaymentSettings } from '../../common/utils/customer-self-service.util.js';
import { getBusinessStripeIntegration } from '../billing/stripe-integration.types.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildConsumerDiagnoseStripeCheckoutFailureNavigate,
  parseConsumerDiagnoseStripeCheckoutFailureFromPrompt,
  type ConsumerCheckoutFailureAspect,
} from './ai-diagnose-stripe-checkout-failure.util.js';

export interface DiagnoseStripeCheckoutFailureLogicDeps {
  businessRepo: EntityReader<Business>;
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

function isOnlinePaymentsEnabled(
  settings: Record<string, unknown> | null | undefined,
): boolean {
  return Boolean(getBusinessStripeIntegration(settings ?? {}).connectAccountId);
}

function buildConsumerFailureSteps(input: {
  aspect: ConsumerCheckoutFailureAspect;
  onlineEnabled: boolean;
  acceptCashPayments: boolean;
}): { likelyCauses: string[]; nextSteps: string[] } {
  const likelyCauses: string[] = [];
  const nextSteps: string[] = [];

  switch (input.aspect) {
    case 'card_declined':
      likelyCauses.push(
        'Your bank may have declined the charge — insufficient funds, fraud protection, or an international card limit.',
      );
      nextSteps.push(
        'Try another card or contact your bank, then retry checkout.',
      );
      break;
    case 'not_charged':
      likelyCauses.push(
        'If you were not charged, the booking may not be confirmed yet.',
      );
      nextSteps.push('Retry payment to hold your appointment.');
      break;
    case 'session_error':
      likelyCauses.push(
        'The secure checkout session may have expired or failed to start.',
      );
      nextSteps.push('Go back to checkout and pick your time again.');
      break;
    default:
      likelyCauses.push(
        'Online payment did not complete — this is usually a card decline or a timed-out checkout session.',
      );
      nextSteps.push('Retry checkout with a different card.');
      break;
  }

  if (!input.onlineEnabled) {
    likelyCauses.push(
      'This salon does not have online card payments enabled right now.',
    );
    if (input.acceptCashPayments) {
      nextSteps.push('Confirm your booking and pay at the salon instead.');
    } else {
      nextSteps.push('Contact the salon to finish booking and payment.');
    }
  } else if (input.acceptCashPayments) {
    nextSteps.push(
      'You can also confirm and pay at the salon if online payment keeps failing.',
    );
  }

  return { likelyCauses, nextSteps };
}

export async function handleConsumerDiagnoseStripeCheckoutFailureLogic(
  deps: DiagnoseStripeCheckoutFailureLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseConsumerDiagnoseStripeCheckoutFailureFromPrompt(
    textPrompt,
    params,
  );
  if (!parsed) {
    return failure(
      'diagnose_stripe_checkout_failure',
      'Describe what happened at checkout (e.g. "Payment failed — what now?" or "Card declined at checkout").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('diagnose_stripe_checkout_failure', 'Business not found.');
  }

  const settings = business.settings as Record<string, unknown> | undefined;
  const payment = resolvePublicPaymentSettings(settings);
  const onlineEnabled = isOnlinePaymentsEnabled(settings);
  const { likelyCauses, nextSteps } = buildConsumerFailureSteps({
    aspect: parsed.aspect,
    onlineEnabled,
    acceptCashPayments: payment.acceptCashPayments,
  });

  const navigate = buildConsumerDiagnoseStripeCheckoutFailureNavigate(params, {
    acceptCashPayments: payment.acceptCashPayments,
    aspect: parsed.aspect,
  });

  const summary = [
    'Here is what you can try after a failed checkout payment:',
    ...nextSteps.map((step, index) => `${index + 1}. ${step}`),
  ].join(' ');

  return success('diagnose_stripe_checkout_failure', summary, {
    aspect: parsed.aspect,
    likelyCauses,
    nextSteps,
    onlinePaymentsEnabled: onlineEnabled,
    acceptCashPayments: payment.acceptCashPayments,
    ...(navigate ? { navigate } : {}),
  });
}
