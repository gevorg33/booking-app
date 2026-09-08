import { jest } from '@jest/globals';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

/** The fourth argument `AiGatewayService` passes to a dashboard surface. */
export type GatewaySession = {
  history: unknown[];
  context: Record<string, unknown>;
  confirmed: boolean;
};

/*
 * The three helpers below exist so specs can read `mock.calls[0][3]`.
 * `jest.fn(async () => x)` infers an *empty* argument tuple, so every positional
 * read against such a mock is a type error however the call really looked — and
 * the assertions doing those reads are the ones checking that the gateway
 * assembles its context correctly. Each helper wraps a result-producer in the
 * argument list the gateway actually passes, taken from `ai-gateway.service.ts`.
 */

/** `executeCommand(businessId, prompt, userId, session)` — ai-gateway.service.ts:489. */
export function dashboardExecuteCommandMock<T>(produce: () => Promise<T>) {
  return jest.fn(
    async (
      _businessId: string,
      _prompt: string,
      _userId: string | undefined,
      _session: GatewaySession,
    ): Promise<T> => produce(),
  );
}

/** `executeCommand(businessId, prompt, history, context)` — ai-gateway.service.ts:406. */
export function customerExecuteCommandMock<T>(produce: () => Promise<T>) {
  return jest.fn(
    async (
      _businessId: string,
      _prompt: string,
      _history: unknown[],
      _context: Record<string, unknown>,
    ): Promise<T> => produce(),
  );
}

/** `executeCommand(businessId, userId, prompt, history, options)` — ai-gateway.service.ts:447. */
export function providerExecuteCommandMock<T>(produce: () => Promise<T>) {
  return jest.fn(
    async (
      _businessId: string,
      _userId: string | undefined,
      _prompt: string,
      _history: unknown[],
      _options: Record<string, unknown>,
    ): Promise<T> => produce(),
  );
}

/** `buildRagContextBlock(businessId, prompt)` — ai-rag.service.ts:32. */
export function ragContextBlockMock(produce: () => Promise<string>) {
  return jest.fn(
    async (_businessId: string, _prompt: string): Promise<string> => produce(),
  );
}

export function createCommandTraceServiceMock() {
  return {
    record: jest.fn(async () => ({ id: 'trace-row-1' })),
    recordFireAndForget: jest.fn(),
    findRecentByBusiness: jest.fn(async () => []),
  };
}

/** Shared Sprint 25 + settings mocks for AiGatewayService unit/integration tests. */
export function createAiGatewayPlatformMocks() {
  return {
    commandTrace: createCommandTraceServiceMock(),
    aiSettings: {
      getSettings: jest.fn(async () => DEFAULT_AI_SETTINGS),
      getBusinessRecord: jest.fn(async () => ({
        id: 'biz-1',
        settings: { businessType: 'hair_salon' },
      })),
    },
    platform: {
      resolveRoleProfile: jest.fn(() => 'owner' as const),
      resolveBranchContext: jest.fn(() => ({
        scope: {},
        classifierHint: undefined,
      })),
      resolveConfidenceForExperiment: jest.fn(() => ({
        high: DEFAULT_AI_SETTINGS.confidence.high,
        abVariantId: undefined,
      })),
      recordCommandOutcome: jest.fn(),
    },
  };
}
