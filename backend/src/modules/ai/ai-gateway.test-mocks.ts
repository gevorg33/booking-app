import { jest } from '@jest/globals';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

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
