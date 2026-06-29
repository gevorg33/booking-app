import type { GuideTelemetryService } from '../guide-telemetry.service.js';

export function createMockGuideTelemetryService(): GuideTelemetryService {
  return {
    record: jest.fn(async (row) => row),
    recordFireAndForget: jest.fn(),
    recordTopicOpened: jest.fn(),
    recordGroundingFailure: jest.fn(),
    recordStepCompleted: jest.fn(),
    recordHandoffToAction: jest.fn(),
    ingestEvents: jest.fn(async () => ({ recorded: 0, skipped: 0 })),
    ingestClientEvents: jest.fn(async () => ({ recorded: 0, skipped: 0 })),
    getAnalytics: jest.fn(async () => ({
      periodDays: 30,
      topicsOpened: 0,
      stepsCompleted: 0,
      handoffsToAction: 0,
      groundingFailures: 0,
      guideCompletionRate: 0,
      avgStepsCompletedPerGuide: 0,
      handoffToActionRate: 0,
      groundingFailureRate: 0,
      topUnansweredTopics: [],
      byTopic: {},
      bySurface: {
        dashboard: {
          opened: 0,
          stepsCompleted: 0,
          handoffs: 0,
          groundingFailures: 0,
          guideCompletions: 0,
        },
        provider: {
          opened: 0,
          stepsCompleted: 0,
          handoffs: 0,
          groundingFailures: 0,
          guideCompletions: 0,
        },
        customer: {
          opened: 0,
          stepsCompleted: 0,
          handoffs: 0,
          groundingFailures: 0,
          guideCompletions: 0,
        },
        public: {
          opened: 0,
          stepsCompleted: 0,
          handoffs: 0,
          groundingFailures: 0,
          guideCompletions: 0,
        },
      },
    })),
  } as unknown as GuideTelemetryService;
}
