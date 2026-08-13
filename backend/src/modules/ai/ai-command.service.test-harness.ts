/**
 * F3 / e2e-bug.415 — a construction path for `AiCommandService` in tests.
 *
 * The service takes **73 injected dependencies**, so it has never been
 * constructible in a unit test. The cost is recorded in the ticket: §129 had to
 * extract `shouldConfirmBeforeExecute` into a free function to assert it at all,
 * and §137 could not assert its property ("every one of ~40 exits is stamped")
 * because that is a property of the method's shape — so it holds by
 * construction rather than by test. Both are load-bearing: the execute-time
 * confirmation gate, and trace attribution for most traffic.
 *
 * Why an auto-stub rather than `Test.createTestingModule`: the harness that
 * exists for the understanding adapter wires real collaborators because the
 * behaviour under test spans them. What F3 needs is the opposite — assertions
 * on the *method bodies* of one service. Listing 73 providers to reach a method
 * body is ceremony that will rot; a proxy that yields a `jest.fn()` for any
 * property touched keeps the harness honest (a test that needs a real
 * collaborator must say so, by name, in `overrides`).
 *
 * Every stub is a `jest.fn()` returning `undefined`. That is deliberate: a
 * dependency a test did not think about fails loudly at the point of use rather
 * than quietly returning a plausible value.
 */
import { AiCommandService } from './ai-command.service.js';

/** Constructor parameter names, in declaration order. */
export const AI_COMMAND_SERVICE_DEPS = [
  'agentOps',
  'aiEvents',
  'aiSettings',
  'bookingCommandGraph',
  'bookingCore',
  'bookingDepth',
  'bookingRepo',
  'businessCompliance',
  'businessCurrency',
  'businessDateFormat',
  'businessHoursLocation',
  'businessLanguages',
  'businessProfile',
  'businessRepo',
  'businessTax',
  'catalog',
  'clinicLabBooking',
  'clinicPatientChart',
  'clinicPreVisitIntake',
  'clinicQuestionnaire',
  'clinicService',
  'clinicTestCatalog',
  'clinicTestOrder',
  'clinicTestResult',
  'completionPipeline',
  'complexityRouter',
  'customerCrm',
  'customerRepo',
  'customerService',
  'dashboardCore',
  'dashboardUnderstanding',
  'decomposition',
  'employeeRepo',
  'emptyStateGuide',
  'externalDoctors',
  'giftFulfillment',
  'integrations',
  'intelligence',
  'locations',
  'marketingGrowth',
  'metaOps',
  'notificationSettings',
  'onboarding',
  'openAi',
  'openaiIntegration',
  'operations',
  'orchestration',
  'packageLocalizedNames',
  'patientClinicalMutations',
  'payments',
  'periodRepo',
  'planBuilder',
  'platform',
  'productGuide',
  'promptNormalization',
  'promptSecurity',
  'providerClinicTasksAndResults',
  'providerTimeOff',
  'pushNotifications',
  'recommendationProduct',
  'referralStaffTemplates',
  'retailFinance',
  'scheduleHandlers',
  'scheduleResources',
  'scheduling',
  'schedulingEngine',
  'selfServiceBooking',
  'serviceRepo',
  'slotRepo',
  'slotResolver',
  'templateRepo',
  'tourService',
  'whatsappIntegration',
] as const;

export type AiCommandServiceDep = (typeof AI_COMMAND_SERVICE_DEPS)[number];

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
 * Build an `AiCommandService` with all 73 dependencies stubbed.
 *
 * `overrides` replaces named dependencies wholesale — pass real or partial
 * objects for the collaborators the test actually exercises.
 */
export function createAiCommandServiceForTest(
  overrides: Partial<Record<AiCommandServiceDep, unknown>> = {},
): AiCommandService {
  const svc: any = Object.create(AiCommandService.prototype);
  for (const dep of AI_COMMAND_SERVICE_DEPS) svc[dep] = autoStub(dep);
  for (const [name, value] of Object.entries(overrides)) svc[name] = value;
  return svc as AiCommandService;
}
