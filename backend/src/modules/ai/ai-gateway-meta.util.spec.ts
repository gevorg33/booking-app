import {
  attachGatewayMeta,
  buildEntityMemoryLearnPayload,
  buildProviderEntityMemoryLearnPayload,
  shouldLearnFromCommandResult,
} from './ai-gateway-meta.util.js';

describe('ai-gateway-meta.util', () => {
  it('shouldLearnFromCommandResult accepts successful known actions only', () => {
    expect(shouldLearnFromCommandResult({ success: true, action: 'list_bookings', summary: 'ok' })).toBe(
      true,
    );
    expect(shouldLearnFromCommandResult({ success: false, action: 'list_bookings', summary: 'x' })).toBe(
      false,
    );
    expect(shouldLearnFromCommandResult({ success: true, action: 'unknown', summary: 'x' })).toBe(false);
    expect(shouldLearnFromCommandResult({ success: true, action: 'error', summary: 'x' })).toBe(false);
    expect(shouldLearnFromCommandResult({ success: true, summary: 'x' } as any)).toBe(false);
  });

  it('buildEntityMemoryLearnPayload merges details', () => {
    expect(
      buildEntityMemoryLearnPayload({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: { employee: 'Gevorg', serviceName: 'Cut', params: { date: 'today' } },
      }),
    ).toEqual({
      date: 'today',
      employee: 'Gevorg',
      service: 'Cut',
    });
    expect(
      buildEntityMemoryLearnPayload({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      }),
    ).toEqual({
      employee: undefined,
      service: undefined,
    });
    expect(
      buildEntityMemoryLearnPayload({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: undefined,
      }),
    ).toEqual({
      employee: undefined,
      service: undefined,
    });
  });

  it('buildProviderEntityMemoryLearnPayload merges session context', () => {
    expect(
      buildProviderEntityMemoryLearnPayload({
        action: 'list_bookings',
        details: {
          employee: 'Maria',
          serviceName: 'Massage',
          customerName: 'John',
          sessionContext: { date: '02/06/2026', employeeName: 'Maria' },
        },
      }),
    ).toEqual({
      date: '02/06/2026',
      employeeName: 'Maria',
      employee: 'Maria',
      service: 'Massage',
      customer: 'John',
    });
    expect(buildProviderEntityMemoryLearnPayload({ details: {} })).toEqual({
      employee: undefined,
      service: undefined,
      customer: undefined,
    });
    expect(buildProviderEntityMemoryLearnPayload({})).toEqual({
      employee: undefined,
      service: undefined,
      customer: undefined,
    });
  });

  it('attachGatewayMeta adds surface tier and timeline fallback', () => {
    expect(
      attachGatewayMeta(
        {
          success: true,
          action: 'list_bookings',
          summary: 'ok',
          details: { workflowSteps: [{ id: 'wf' }] },
        },
        'dashboard',
        'owner',
      ),
    ).toEqual({
      success: true,
      action: 'list_bookings',
      summary: 'ok',
      details: {
        workflowSteps: [{ id: 'wf' }],
        gateway: { surface: 'dashboard', tier: 'owner' },
        executionTimeline: [{ id: 'wf' }],
      },
    });

    expect(
      attachGatewayMeta(
        {
          success: true,
          action: 'list_bookings',
          summary: 'ok',
          details: { executionTimeline: [{ id: 'tl' }] },
        },
        'provider',
        'manager',
      ).details?.executionTimeline,
    ).toEqual([{ id: 'tl' }]);

    expect(
      attachGatewayMeta(
        { success: true, action: 'list_bookings', summary: 'ok' },
        'dashboard',
        'owner',
      ).details,
    ).toEqual({
      gateway: { surface: 'dashboard', tier: 'owner' },
      executionTimeline: undefined,
    });
  });
});
