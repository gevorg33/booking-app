import {
  attachGatewayMeta,
  buildCustomerEntityMemoryLearnPayload,
  buildEntityMemoryLearnPayload,
  buildProviderEntityMemoryLearnPayload,
  shouldLearnFromCommandResult,
} from './ai-gateway-meta.util.js';

describe('ai-gateway-meta.util', () => {
  it('shouldLearnFromCommandResult accepts successful known actions only', () => {
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
      }),
    ).toBe(true);
    expect(
      shouldLearnFromCommandResult({
        success: false,
        action: 'list_bookings',
        summary: 'x',
      }),
    ).toBe(false);
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'unknown',
        summary: 'x',
      }),
    ).toBe(false);
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'error',
        summary: 'x',
      }),
    ).toBe(false);
    expect(
      shouldLearnFromCommandResult({ success: true, summary: 'x' } as any),
    ).toBe(false);
  });

  it('buildEntityMemoryLearnPayload merges details', () => {
    expect(
      buildEntityMemoryLearnPayload({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {
          employee: 'Gevorg',
          serviceName: 'Cut',
          params: { date: 'today' },
        },
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

  it('buildCustomerEntityMemoryLearnPayload merges session context', () => {
    expect(
      buildCustomerEntityMemoryLearnPayload({
        success: true,
        action: 'book_package',
        summary: 'ok',
        details: {
          packageId: 'pkg-1',
          bookingId: 'bk-1',
          serviceName: 'Spa',
          employeeName: 'Maria',
          sessionContext: { slug: 'salon', promoCode: 'SPRING25' },
        },
      }),
    ).toEqual({
      slug: 'salon',
      promoCode: 'SPRING25',
      service: 'Spa',
      employee: 'Maria',
      packageId: 'pkg-1',
      bookingId: 'bk-1',
    });
    expect(
      buildCustomerEntityMemoryLearnPayload({
        success: true,
        action: 'ok',
        summary: 'ok',
      }),
    ).toEqual({
      service: undefined,
      employee: undefined,
      packageId: undefined,
      bookingId: undefined,
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

  it('attachGatewayMeta stamps traceId on pipeline stages (acc-1.3)', () => {
    const attached = attachGatewayMeta(
      {
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {
          pipelineTrace: [
            { stage: 'classify', action: 'list_bookings', at: 't1' },
            { stage: 'execute', action: 'list_bookings', at: 't2' },
          ],
        },
      },
      'dashboard',
      'owner',
      'corr-123',
    );
    expect(attached.details?.traceId).toBe('corr-123');
    expect(attached.details?.pipelineTrace).toEqual([
      { stage: 'classify', action: 'list_bookings', at: 't1', traceId: 'corr-123' },
      { stage: 'execute', action: 'list_bookings', at: 't2', traceId: 'corr-123' },
    ]);
  });
});
