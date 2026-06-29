import { describe, expect, it, vi } from 'vitest';
import {
  buildGuideHandoffTelemetryEvent,
  buildGuideStepCompletedEvent,
  createGuideTelemetrySessionId,
  ingestGuideTelemetryEvents,
} from './guide-telemetry.util';

describe('guide-telemetry.util (ai-guide-1.7.3)', () => {
  it('createGuideTelemetrySessionId returns a non-empty id', () => {
    expect(createGuideTelemetrySessionId()).toMatch(
      /^([0-9a-f-]{36}|guide-\d+-[0-9a-f]+)$/i,
    );
  });

  it('ingestGuideTelemetryEvents posts client events', async () => {
    const postJson = vi.fn(async () => ({ recorded: 1, skipped: 0 }));
    const sessionId = '11111111-1111-4111-8111-111111111111';
    await ingestGuideTelemetryEvents(
      postJson,
      '/businesses/biz-1/ai/guide-telemetry',
      [
        buildGuideStepCompletedEvent({
          surface: 'dashboard',
          topicId: 'dashboard.core.schedule',
          route: '/dashboard/schedule',
          locale: 'en',
          sessionId,
          stepIndex: 1,
          totalSteps: 3,
        }),
      ],
    );
    expect(postJson).toHaveBeenCalledWith('/businesses/biz-1/ai/guide-telemetry', {
      events: [
        expect.objectContaining({
          event: 'step_completed',
          stepIndex: 1,
          totalSteps: 3,
        }),
      ],
    });
  });

  it('buildGuideHandoffTelemetryEvent includes handoff action', () => {
    expect(
      buildGuideHandoffTelemetryEvent({
        surface: 'dashboard',
        sessionId: '11111111-1111-4111-8111-111111111111',
        handoffAction: 'apply_schedule',
      }).handoffAction,
    ).toBe('apply_schedule');
  });
});
