import {
  handleCancelTimeOffRequestLogic,
  type ProviderTimeOffLogicDeps,
} from './ai-provider-time-off.logic.js';

function buildDeps(
  overrides: Partial<ProviderTimeOffLogicDeps['timeOffService']> = {},
): ProviderTimeOffLogicDeps {
  return {
    timeOffService: {
      listForEmployee: jest.fn(async () => []),
      cancelRequest: jest.fn(async () => ({
        id: 'req-1',
        employeeId: 'emp-1',
        employeeName: 'Alex',
        startDate: '2026-06-20',
        endDate: '2026-06-20',
        dailyStartTime: '00:00',
        dailyEndTime: '23:59',
        reason: null,
        status: 'cancelled',
        reviewNotes: null,
        reviewedAt: null,
        blockScheduleId: null,
        createdAt: '2026-06-01T00:00:00.000Z',
      })),
      ...overrides,
    } as any,
    businessService: {} as any,
  };
}

describe('ai-provider-time-off.logic — handleCancelTimeOffRequestLogic (ai-cmd-provider-6.7.1)', () => {
  it('cancels by explicit requestId', async () => {
    const deps = buildDeps();
    const result = await handleCancelTimeOffRequestLogic(
      deps,
      'biz-1',
      'emp-1',
      { requestId: 'req-1' },
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('cancel_time_off_request');
    expect(deps.timeOffService.cancelRequest).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      'req-1',
    );
  });

  it('auto-resolves the single pending request when no requestId is given', async () => {
    const deps = buildDeps({
      listForEmployee: jest.fn(async () => [
        { id: 'req-pending', status: 'pending' },
        { id: 'req-old', status: 'cancelled' },
      ]),
    } as any);

    const result = await handleCancelTimeOffRequestLogic(
      deps,
      'biz-1',
      'emp-1',
      {},
    );

    expect(result.success).toBe(true);
    expect(deps.timeOffService.cancelRequest).toHaveBeenCalledWith(
      'biz-1',
      'emp-1',
      'req-pending',
    );
  });

  it('clarifies when multiple pending requests exist and no requestId given', async () => {
    const deps = buildDeps({
      listForEmployee: jest.fn(async () => [
        { id: 'req-1', status: 'pending' },
        { id: 'req-2', status: 'pending' },
      ]),
    } as any);

    const result = await handleCancelTimeOffRequestLogic(
      deps,
      'biz-1',
      'emp-1',
      {},
    );

    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
    expect(deps.timeOffService.cancelRequest).not.toHaveBeenCalled();
  });

  it('fails when no pending request exists', async () => {
    const deps = buildDeps({
      listForEmployee: jest.fn(async () => []),
    } as any);

    const result = await handleCancelTimeOffRequestLogic(
      deps,
      'biz-1',
      'emp-1',
      {},
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No pending time-off request');
  });

  it('surfaces errors from cancelRequest (e.g. not pending, not owner)', async () => {
    const deps = buildDeps({
      cancelRequest: jest.fn(async () => {
        throw new Error('Only pending requests can be cancelled');
      }),
    } as any);

    const result = await handleCancelTimeOffRequestLogic(
      deps,
      'biz-1',
      'emp-1',
      { requestId: 'req-1' },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Only pending requests can be cancelled');
  });
});
