import { jest } from '@jest/globals';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

export function createClassificationEngineMock() {
  return {
    buildClassifierAppendix: jest.fn(async () => ({
      block: '',
      fewShotCount: 0,
      shortlistCount: 0,
      shortlist: [],
      abVariantId: 'control',
    })),
    enrichClassification: jest.fn(
      async (input: {
        intent: {
          action: string;
          params?: Record<string, unknown>;
          reasoning?: string;
          confidence?: number;
        };
      }) => ({
        intent: input.intent,
        verification: {
          ok: true,
          confidence: 0.9,
          fieldConfidence: {},
          reasons: [],
        },
        consensus: { needsEscalation: false, llmAction: input.intent.action },
      }),
    ),
    matchSemanticIntentLexical: jest.fn(() => null),
    matchSemanticIntentEmbedding: jest.fn(async () => null),
  };
}

export function createEscalationHandoffMock() {
  return {
    shouldExecute: jest.fn(() => false),
    execute: jest.fn(async () => ({
      success: true,
      action: 'human_handoff',
      summary: 'handoff',
      details: {},
    })),
  };
}

/** Shared Sprint 25 + settings mocks for AiGatewayService unit/integration tests. */
export function createAiGatewayPlatformMocks() {
  return {
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
      resolveClassificationAppendixVariantId: jest.fn(() => 'control'),
      recordCommandOutcome: jest.fn(),
    },
    commandTrace: {
      recordTrace: jest.fn(),
    },
    classificationEngine: createClassificationEngineMock(),
  };
}
