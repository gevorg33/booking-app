import { ProviderAiCommandService } from './provider-ai-command.service.js';
import type { ProviderUnderstandDeps } from '../ai/command-understanding-adapter.types.js';
import { AiProductGuideService } from '../ai/ai-product-guide.service.js';
import { createMockGuideTelemetryService } from '../ai/guide/guide-telemetry.mock.js';

export type ProviderAiCommandHarnessOverrides = {
  llm?: {
    isAvailableForBusiness: jest.Mock;
    completeJson: jest.Mock;
  };
  aiSettings?: Record<string, unknown>;
  promptNormalization?: Record<string, unknown>;
  providerUnderstanding?: Record<string, unknown>;
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
  productGuide?: AiProductGuideService;
  emptyStateGuide?: { runIntent: jest.Mock };
};

const noopAsync = async () => ({
  success: true,
  action: 'unknown',
  summary: 'ok',
  details: {},
});

function buildProviderUnderstandMock() {
  return {
    understand: jest.fn(async (deps: ProviderUnderstandDeps) => {
      const classified = await deps.classify(
        deps.effectivePrompt,
        'Harness provider classifier context',
      );
      if (!classified?.action) {
        return {
          status: 'blocked' as const,
          action: 'unknown',
          params: {},
          reasoning: 'blocked',
          confidence: 0,
          candidates: [],
          trace: [],
          gate: {
            action: 'unknown',
            confidence: 0,
            shouldEscalateToSemantic: true,
            decision: 'escalate_semantic' as const,
            lowThreshold: 0.65,
            highThreshold: 0.82,
            reason: 'harness blocked',
          },
          context: {
            originalPrompt: deps.effectivePrompt,
            normalizedPrompt: deps.effectivePrompt,
            classifierContext: null,
            method: 'passthrough' as const,
          },
          normalization: {
            original: deps.effectivePrompt,
            normalized: deps.effectivePrompt,
            method: 'passthrough' as const,
            classifierContext: null,
          },
          surface: 'provider' as const,
          blockReason: 'harness classify returned null',
        };
      }

      return {
        status: 'resolved' as const,
        action: classified.action,
        params: classified.params ?? {},
        reasoning: classified.reasoning ?? 'harness',
        confidence:
          typeof classified.confidence === 'number'
            ? classified.confidence
            : 0.9,
        candidates: [
          {
            action: classified.action,
            confidence:
              typeof classified.confidence === 'number'
                ? classified.confidence
                : 0.9,
            source: 'classifier' as const,
            params: classified.params ?? {},
            reasoning: classified.reasoning,
          },
        ],
        trace: [],
        gate: {
          action: classified.action,
          confidence: classified.confidence,
          shouldEscalateToSemantic: false,
          decision: 'skip_semantic' as const,
          lowThreshold: 0.65,
          highThreshold: 0.82,
          reason: 'harness high confidence',
        },
        context: {
          originalPrompt: deps.effectivePrompt,
          normalizedPrompt: deps.effectivePrompt,
          classifierContext: null,
          method: 'passthrough' as const,
        },
        normalization: {
          original: deps.effectivePrompt,
          normalized: deps.effectivePrompt,
          method: 'passthrough' as const,
          classifierContext: null,
        },
        surface: 'provider' as const,
      };
    }),
  };
}

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

  const productGuide =
    overrides.productGuide ??
    new AiProductGuideService(
      {
        completeJson: jest.fn(async () => ({})),
        isAvailableForBusiness: jest.fn(async () => false),
        isModelConfigured: () => false,
      } as any,
      {
        isAvailableForBusiness: async () => false,
        embedText: jest.fn(),
        isModelConfigured: () => false,
      } as any,
      createMockGuideTelemetryService(),
    );

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
      getSettings: jest.fn(async () => ({
        confidence: { low: 0.65, high: 0.82 },
      })),
      ...overrides.aiSettings,
    } as any,
    {
      normalizeForClassifier: jest.fn(async (_businessId, _userId, prompt) => ({
        original: prompt,
        normalized: prompt,
        method: 'passthrough',
        classifierContext: null,
      })),
      ...overrides.promptNormalization,
    } as any,
    {
      ...buildProviderUnderstandMock(),
      ...overrides.providerUnderstanding,
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
    productGuide,
    overrides.emptyStateGuide ??
      ({
        runIntent: jest.fn(async () => ({
          success: true,
          action: 'explain_empty_catalog',
          summary: 'ok',
          details: {},
        })),
      } as any),
  );
}
