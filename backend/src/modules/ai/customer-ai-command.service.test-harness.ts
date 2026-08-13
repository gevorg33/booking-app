/**
 * F3 / e2e-bug.415 — a construction path for `CustomerAiCommandService`.
 *
 * The second of the two services the ticket names. Same problem, smaller
 * number: **43** injected dependencies rather than 73, but equally
 * unconstructible in a unit test before this.
 *
 * See `ai-command.service.test-harness.ts` for why this is an auto-stub rather
 * than a `TestingModule`: the goal is asserting *method bodies*, and listing 43
 * providers to reach one is ceremony that rots. `customer-ai-command.integration.harness.ts`
 * remains the right tool when the behaviour under test genuinely spans real
 * collaborators — these two harnesses answer different questions and both
 * should exist.
 */
import { CustomerAiCommandService } from './customer-ai-command.service.js';

/** Constructor parameter names, in declaration order. */
export const CUSTOMER_AI_COMMAND_SERVICE_DEPS = [
  'llm',
  'promptSecurity',
  'aiSettings',
  'promptNormalization',
  'customerUnderstanding',
  'platform',
  'aiEvents',
  'customerCrm',
  'scheduleResources',
  'payments',
  'giftFulfillment',
  'integrations',
  'marketingGrowth',
  'pushNotifications',
  'selfServiceBooking',
  'businessCurrency',
  'businessLanguages',
  'businessDateFormat',
  'businessHoursLocation',
  'providerSpecialty',
  'businessTax',
  'businessCompliance',
  'tourService',
  'recommendationProduct',
  'consumerClinicTestResults',
  'clinicLabBooking',
  'clinicBooking',
  'guestCheckoutFields',
  'resumePendingPayment',
  'diagnoseStripeCheckoutFailure',
  'payAtVenueFallback',
  'resumeBookingDraft',
  'explainSlotNoLongerAvailable',
  'explainMultiServicePaymentReturn',
  'retryFailedNetworkAction',
  'explainVoiceInput',
  'speakAssistantReply',
  'giveAiFeedback',
  'explainRtlLayout',
  'consumerAdoption',
  'publicAssistant',
  'productGuide',
  'emptyStateGuide',
] as const;

export type CustomerAiCommandServiceDep =
  (typeof CUSTOMER_AI_COMMAND_SERVICE_DEPS)[number];

/** A dependency whose every accessed member is a fresh `jest.fn()`. */
function autoStub(name: string): Record<string, unknown> {
  const cache: Record<string | symbol, unknown> = {};
  return new Proxy(cache, {
    get(target, prop) {
      // Keep it non-thenable: an accidental `await dep` must not hang.
      if (prop === 'then') return undefined;
      if (!(prop in target)) {
        target[prop] = jest.fn(() => undefined);
        (target[prop] as jest.Mock).mockName(`${name}.${String(prop)}`);
      }
      return target[prop];
    },
  }) as Record<string, unknown>;
}

/**
 * Build a `CustomerAiCommandService` with all 43 dependencies stubbed.
 *
 * `overrides` replaces named dependencies wholesale — pass real or partial
 * objects for the collaborators the test actually exercises.
 */
export function createCustomerAiCommandServiceForTest(
  overrides: Partial<Record<CustomerAiCommandServiceDep, unknown>> = {},
): CustomerAiCommandService {
  const svc: any = Object.create(CustomerAiCommandService.prototype);
  for (const dep of CUSTOMER_AI_COMMAND_SERVICE_DEPS) svc[dep] = autoStub(dep);
  for (const [name, value] of Object.entries(overrides)) svc[name] = value;
  return svc as CustomerAiCommandService;
}
