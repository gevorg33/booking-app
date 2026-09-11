import { GuideTelemetryService } from './guide-telemetry.service.js';
import { GUIDE_TELEMETRY_AGGREGATE_ROWS } from './guide/guide-telemetry.fixtures.js';

describe('GuideTelemetryService (ai-guide-1.7.3)', () => {
  it('getAnalytics aggregates persisted rows', async () => {
    const service = new GuideTelemetryService({
      find: jest.fn(async () =>
        GUIDE_TELEMETRY_AGGREGATE_ROWS.map((row, index) => ({
          id: `row-${index}`,
          businessId: 'biz-1',
          userId: null,
          createdAt: new Date(),
          route: null,
          locale: 'en',
          sessionId: null,
          issueCodes: null,
          ...row,
          // After the spread, not before it: these two were previously written
          // ahead of `...row`, which overwrote them, so the `?? null` defaulting
          // never ran and an absent value reached the service as `undefined`.
          handoffAction: row.handoffAction ?? null,
          relatedActionsCount: row.relatedActionsCount ?? null,
        })),
      ),
    } as any);

    const summary = await service.getAnalytics('biz-1', 30);
    expect(summary.topicsOpened).toBe(2);
    expect(summary.handoffToActionRate).toBeCloseTo(0.5);
    expect(summary.byTopic['dashboard.core.schedule'].handoffs).toBe(1);
    expect(summary.topUnansweredTopics.length).toBeGreaterThan(0);
    expect(summary.topUnansweredTopics[0]?.topicId).toBe(
      'provider.today.overview',
    );
  });

  it('ingestClientEvents skips invalid rows', async () => {
    const save = jest.fn(async (row) => row);
    const create = jest.fn((row) => row);
    const service = new GuideTelemetryService({
      save,
      create,
    } as any);

    const result = await service.ingestClientEvents(
      'biz-1',
      [
        {
          event: 'step_completed',
          surface: 'dashboard',
          stepIndex: 0,
          totalSteps: 2,
        },
        {
          event: 'invalid_event',
          surface: 'dashboard',
        } as any,
      ],
      'user-1',
    );

    expect(result).toEqual({ recorded: 1, skipped: 1 });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
