import type { CommandResult } from './command-completion.types.js';
import {
  decomposePaymentsCompoundPrompt,
  type PaymentsCompoundStep,
} from './ai-payments.util.js';
import { dispatchPaymentsLogicIntent } from './ai-payments-dispatch.util.js';
import {
  mergeCheckProvidersHandoffIntoContext,
} from './ai-check-book-handoff.util.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function mergeCompoundContext(
  context: Record<string, unknown>,
  step: PaymentsCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = {
    ...context,
    ...pickSharedBookingContextSlice(step.params),
  };

  if (step.action === 'book_nearest_slot') {
    next.serviceId = details.serviceId;
    next.employeeId = details.employeeId;
    next.startTime = details.startTime;
    next.serviceName = details.serviceName;
    if (details.date) next.date = details.date;
    if (details.timeOfDay) next.timeOfDay = details.timeOfDay;
    if (details.chosenAvailabilityWindow) {
      next.chosenAvailabilityWindow = details.chosenAvailabilityWindow;
    }
  }
  if (step.action === 'check_providers_for_service') {
    next.serviceId = details.serviceId;
    next.serviceName = details.serviceName;
    const providers = details.providers as Array<{ id: string }> | undefined;
    if (providers?.length && !next.employeeId)
      next.employeeId = providers[0].id;
    Object.assign(next, mergeCheckProvidersHandoffIntoContext({}, result));
  }
  if (
    step.action === 'apply_gift_card_code' ||
    step.action === 'check_gift_card_balance'
  ) {
    const balance = details.balance as { code?: string } | undefined;
    if (balance?.code) next.giftCardCode = balance.code;
  }
  if (step.action === 'pay_online') {
    const navigate = details.navigate as
      | { query?: Record<string, string> }
      | undefined;
    if (navigate?.query?.serviceId) next.serviceId = navigate.query.serviceId;
    if (navigate?.query?.employeeId) next.employeeId = navigate.query.employeeId;
    if (navigate?.query?.startTime) next.startTime = navigate.query.startTime;
    if (details.sessionContext && typeof details.sessionContext === 'object') {
      Object.assign(next, details.sessionContext);
    }
  } else {
    Object.assign(next, pickSharedBookingContextSlice(details));
  }
  return next;
}

export async function handlePaymentsCompoundLogic(
  deps: PaymentsLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userId?: string,
): Promise<CommandResult> {
  const safeParams = params ?? {};
  const steps: PaymentsCompoundStep[] =
    (safeParams.compoundSteps as PaymentsCompoundStep[] | undefined) ??
    decomposePaymentsCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple payment/checkout commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = {
    ...safeParams,
    _prompt: prompt,
  };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    const dispatched = await dispatchPaymentsLogicIntent(deps, {
      businessId,
      action: step.action,
      params: stepParams,
      prompt: step.segment,
      userId,
      catalogServices: [],
    });
    const result =
      dispatched ??
      failure(
        step.action,
        `Unsupported payments compound step: ${step.action}.`,
      );
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
          userId,
        },
      };
    }
    compoundContext = mergeCompoundContext(compoundContext, step, result);
  }

  const providerStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'check_providers_for_service');
  const providerDetails = providerStep?.details as
    | Record<string, unknown>
    | undefined;
  const bookStep = [...results]
    .reverse()
    .find((entry) => entry.action === 'book_nearest_slot');
  const bookDetails = bookStep?.details as Record<string, unknown> | undefined;

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} payment/checkout step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      paymentsCompound: true,
      userId,
      finalContext: compoundContext,
      providers: providerDetails?.providers,
      availableProviders: providerDetails?.availableProviders,
      availability: providerDetails?.availability,
      serviceName: providerDetails?.serviceName,
      date: providerDetails?.date,
      checkProvidersHandoff:
        bookDetails?.checkProvidersHandoff ??
        compoundContext.checkProvidersHandoff,
    },
  };
}
