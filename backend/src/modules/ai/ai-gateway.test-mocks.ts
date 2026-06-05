import { jest } from '@jest/globals';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

/** Shared Sprint 25 + settings mocks for AiGatewayService unit/integration tests. */
export function createAiGatewaySprint25Mocks() {
  return {
    aiSettings: {
      getSettings: jest.fn(async () => DEFAULT_AI_SETTINGS),
    },
    sprint25: {
      resolveRoleProfile: jest.fn(() => 'owner' as const),
      resolveBranchContext: jest.fn(() => ({ scope: {}, classifierHint: undefined })),
      resolveConfidenceForExperiment: jest.fn(() => ({
        high: DEFAULT_AI_SETTINGS.confidence.high,
        abVariantId: undefined,
      })),
      recordCommandOutcome: jest.fn(),
    },
  };
}
