import {
  attachGatewayMeta,
  buildCustomerEntityMemoryLearnPayload,
  buildEntityMemoryLearnPayload,
  buildProviderEntityMemoryLearnPayload,
  shouldLearnFromCommandResult,
} from './ai-gateway-meta.util.js';
import type { CommandResult } from './command-completion.types.js';

describe('ai-gateway-meta.util', () => {
  it('shouldLearnFromCommandResult accepts successful known actions only', () => {
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: {},
      }),
    ).toBe(true);
    expect(
      shouldLearnFromCommandResult({
        success: false,
        action: 'list_bookings',
        summary: 'x',
        details: {},
      }),
    ).toBe(false);
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'unknown',
        summary: 'x',
        details: {},
      }),
    ).toBe(false);
    expect(
      shouldLearnFromCommandResult({
        success: true,
        action: 'error',
        summary: 'x',
        details: {},
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
      // `details` is required on `CommandResult`, so this state cannot be
      // produced through the type — but `buildEntityMemoryLearnPayload` guards
      // with `result.details ?? {}`, as do 62 other reads in the module against
      // 33 that do not. This pins the guard; the cast is the only way to reach it.
      buildEntityMemoryLearnPayload({
        success: true,
        action: 'list_bookings',
        summary: 'ok',
        details: undefined,
      } as unknown as CommandResult),
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
        details: {},
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
        // Same reason as above: pins that `attachGatewayMeta` constructs
        // `details` when a result arrives without one.
        {
          success: true,
          action: 'list_bookings',
          summary: 'ok',
        } as unknown as CommandResult,
        'dashboard',
        'owner',
      ).details,
    ).toEqual({
      gateway: { surface: 'dashboard', tier: 'owner' },
      executionTimeline: undefined,
    });
  });
});
