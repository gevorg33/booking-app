import { ProviderAiCommandService } from './provider-ai-command.service.js';

export type ProviderAiCommandHarnessOverrides = {
  llm?: {
    isAvailableForBusiness: jest.Mock;
    completeJson: jest.Mock;
  };
  providerMobile?: Record<string, unknown>;
  providerClientContext?: Record<string, unknown>;
  providerExp2?: Record<string, unknown>;
  providerTimeOff?: Record<string, unknown>;
  providerOpenShifts?: Record<string, unknown>;
  providerExp3?: Record<string, unknown>;
  pushActions?: Record<string, unknown>;
  pushNotifications?: Record<string, unknown>;
  providerBooking?: Record<string, unknown>;
  scheduleHandlers?: Record<string, unknown>;
  bookingRepo?: Record<string, unknown>;
  employeeRepo?: Record<string, unknown>;
  customerRepo?: Record<string, unknown>;
  bookingService?: Record<string, unknown>;
  schedulingEngine?: Record<string, unknown>;
  orchestration?: Record<string, unknown>;
  planBuilder?: Record<string, unknown>;
  completionPipeline?: Record<string, unknown>;
  periodRepo?: Record<string, unknown>;
};

const noopAsync = async () => ({
  success: true,
  action: 'unknown',
  summary: 'ok',
  details: {},
});

/** Minimal ProviderAiCommandService wiring for integration specs (prov-exp-11 gate). */
export function createProviderAiCommandHarness(
  overrides: ProviderAiCommandHarnessOverrides = {},
): ProviderAiCommandService {
  const llm = overrides.llm ?? {
    isAvailableForBusiness: jest.fn(async () => true),
    completeJson: jest.fn(async () => ({
      action: 'unknown',
      params: {},
      reasoning: 'test',
    })),
  };

  return new ProviderAiCommandService(
    (overrides.bookingRepo ?? { find: jest.fn(async () => []) }) as any,
    (overrides.employeeRepo ?? { find: jest.fn(async () => []) }) as any,
    { find: jest.fn() } as any,
    (overrides.customerRepo ?? { find: jest.fn() }) as any,
    (overrides.periodRepo ?? { find: jest.fn(async () => []) }) as any,
    (overrides.bookingService ?? {}) as any,
    (overrides.schedulingEngine ?? {}) as any,
    llm as any,
    {
      resolveMobileAccess: jest.fn(),
      getScopedEmployeeId: jest.fn(),
      ...overrides.providerMobile,
    } as any,
    {
      mergeProviderSessionContext: jest.fn((params) => params),
      normalizeDateParams: jest.fn(),
      buildProviderSessionContext: jest.fn((params) => params),
      toProviderClarifyResult: jest.fn((action, params, reasoning) => ({
        success: false,
        action,
        summary: reasoning ?? 'Need more details.',
        details: { clarify: true, params },
      })),
      ...overrides.completionPipeline,
    } as any,
    { emitClarify: jest.fn(), emitTaskCompleted: jest.fn() } as any,
    {
      handleBlockSchedule: jest.fn(),
      ...overrides.scheduleHandlers,
    } as any,
    (overrides.orchestration ?? {}) as any,
    (overrides.planBuilder ?? {}) as any,
    {
      preflightBlock: jest.fn(() => null),
      enforceAction: jest.fn(() => null),
      stripParams: jest.fn((params) => params),
      applyStaffScope: jest.fn((_tier, _action, params) => params),
    } as any,
    {
      isPushNotificationsCompound: jest.fn(() => false),
      handlePushNotificationsCompound: jest.fn(),
      rescuePushNotificationsIntent: jest.fn(() => null),
      handleOpenBookingFromPush: jest.fn(),
      handleExplainLastPush: jest.fn(),
      ...overrides.pushNotifications,
    } as any,
    {
      handleMarkPaid: jest.fn(),
      handleListPackageAppointmentsToday: jest.fn(),
      isProviderBookingCompound: jest.fn(() => false),
      handleProviderBookingCompound: jest.fn(),
      rescueProviderBookingIntent: jest.fn(() => null),
      ...overrides.providerBooking,
    } as any,
    {} as any,
    {} as any,
    { handleExplainProviderPaymentCurrency: jest.fn() } as any,
    {
      handleExplainProviderDateDisplay: jest.fn(),
      handleConfigureProviderPushDateFormat: jest.fn(),
    } as any,
    { handleExplainAppointmentTax: jest.fn() } as any,
    { handleExplainProviderSessionTimeout: jest.fn() } as any,
    {
      handleIntent: jest.fn(noopAsync),
    } as any,
    {
      handleIntent: jest.fn(),
      rescueProviderEarningsIntent: jest.fn(() => null),
    } as any,
    {
      handleIntent: jest.fn(noopAsync),
      rescueProviderClientContextIntent: jest.fn(() => null),
      ...overrides.providerClientContext,
    } as any,
    {
      handleIntent: jest.fn(noopAsync),
      rescueProviderExp2Intent: jest.fn(() => null),
      ...overrides.providerExp2,
    } as any,
    {
      handleIntent: jest.fn(noopAsync),
      rescueProviderTimeOffIntent: jest.fn(() => null),
      ...overrides.providerTimeOff,
    } as any,
    {
      handleIntent: jest.fn(noopAsync),
      rescueProviderOpenShiftsIntent: jest.fn(() => null),
      ...overrides.providerOpenShifts,
    } as any,
    {
      handleAction: jest.fn(noopAsync),
      rescueProviderExp3Intent: jest.fn(() => null),
      handleIntent: jest.fn(noopAsync),
      ...overrides.providerExp3,
    } as any,
    {
      handleAction: jest.fn(),
      ...overrides.pushActions,
    } as any,
  );
}
