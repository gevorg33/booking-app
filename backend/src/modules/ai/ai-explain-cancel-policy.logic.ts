import type { CommandResult } from './command-completion.types.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';
import {
  assembleCancelPolicySummary,
  buildCancelPolicyDepositContext,
  buildCancelPolicySettingsLines,
  buildDepositForfeitureLines,
  buildGeneralDepositForfeitureLine,
  parseExplainCancelPolicyFromPrompt,
} from './ai-explain-cancel-policy.util.js';
import {
  evaluateCustomerBookingPolicy,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';

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

export async function handleExplainCancelPolicyLogic(
  deps: SelfServiceBookingLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt = '',
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) return failure('explain_cancel_policy', 'Business not found.');

  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainCancelPolicyFromPrompt(textPrompt, params);
  const settings = resolveCustomerSelfServiceSettings(business.settings);
  const payment = resolvePublicPaymentSettings(business.settings);
  const settingsLines = buildCancelPolicySettingsLines(settings);

  let bookingPolicy: Record<string, unknown> | undefined;
  let depositContext = buildCancelPolicyDepositContext({
    businessSettings: business.settings,
    focusDepositForfeiture: parsed?.focusDepositForfeiture,
  });

  const customerId = resolveSessionCustomerId(params);
  const bookingId =
    parsed?.bookingId ?? (params.bookingId as string | undefined);
  if (customerId && bookingId) {
    const booking = await deps.bookingRepo.findOne({
      where: { id: bookingId, businessId, customerId },
      relations: { service: true },
    });
    if (booking) {
      depositContext = buildCancelPolicyDepositContext({
        businessSettings: business.settings,
        booking,
        focusDepositForfeiture: parsed?.focusDepositForfeiture,
      });
      bookingPolicy = {
        cancel: evaluateCustomerBookingPolicy(booking, settings, 'cancel'),
        reschedule: evaluateCustomerBookingPolicy(
          booking,
          settings,
          'reschedule',
        ),
        deposit: {
          prepaymentMode: depositContext.prepaymentMode,
          prepaymentDueAmount: depositContext.prepaymentDueAmount,
          paymentStatus: depositContext.paymentStatus,
          cancelAllowedNow: depositContext.cancelAllowedNow,
        },
      };
    }
  }

  const depositLines = buildDepositForfeitureLines(depositContext);
  const generalDepositLine =
    depositLines.length === 0
      ? buildGeneralDepositForfeitureLine(settings, payment)
      : null;
  const summary = assembleCancelPolicySummary(
    settingsLines,
    depositLines,
    generalDepositLine,
    parsed?.focusDepositForfeiture === true,
  );

  return success('explain_cancel_policy', summary, {
    settings,
    paymentSettings: payment,
    bookingPolicy,
    policyLines: settingsLines,
    depositLines,
    depositContext,
    focusDepositForfeiture: parsed?.focusDepositForfeiture === true,
  });
}
