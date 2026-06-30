import { describe, expect, it } from 'vitest';
import { buildProviderAiCommandContext } from './provider-ai-command-context.util';

describe('buildProviderAiCommandContext (ai-guide-1.4.2)', () => {
  it('includes route, tab, mobileRoute, and nested screenContext', () => {
    const ctx = buildProviderAiCommandContext({
      pathname: '/tabs/calendar',
      mobileRoute: 'schedule',
      screenContext: { customerName: 'Jane' },
      sessionContext: { date: '25/06/2026' },
    });

    expect(ctx.route).toBe('/tabs/calendar');
    expect(ctx.tab).toBe('calendar');
    expect(ctx.mobileRoute).toBe('schedule');
    expect(ctx.date).toBe('25/06/2026');
    expect(ctx.customerName).toBe('Jane');
    expect(ctx.screenContext).toEqual({
      customerName: 'Jane',
      route: '/tabs/calendar',
      tab: 'calendar',
      mobileRoute: 'schedule',
    });
  });

  it('maps today pathname to clients/today route', () => {
    const ctx = buildProviderAiCommandContext({
      pathname: '/tabs/today',
      mobileRoute: 'today',
    });
    expect(ctx.route).toBe('/tabs/today');
    expect(ctx.tab).toBe('today');
  });
});
