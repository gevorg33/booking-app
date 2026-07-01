import {
  mapProviderMobileGuideRoute,
  resolveProductGuideSessionContext,
} from './ai-product-guide-session.util.js';

describe('ai-product-guide-session.util (ai-guide-1.4.2)', () => {
  it('maps provider mobile route and role profile from screen context', () => {
    const ctx = resolveProductGuideSessionContext(
      {
        context: {
          route: '/tabs/today',
          mobileRoute: 'today',
          tab: 'today',
          _accessTier: 'staff',
          retailPosEnabled: true,
          enabledModules: ['giftCards'],
        },
      },
      'provider',
    );
    expect(ctx.route).toBe('/tabs/today');
    expect(ctx.mobileRoute).toBe('today');
    expect(ctx.screenTab).toBe('today');
    expect(ctx.role).toBe('staff');
    expect(ctx.roleProfile).toBe('provider');
    expect(ctx.retailPosEnabled).toBe(true);
    expect(ctx.enabledModules).toEqual(['giftCards']);
  });

  it('maps public checkout route from booking step context', () => {
    expect(
      resolveProductGuideSessionContext(
        { context: { bookingStep: 'checkout', vertical: 'tour' } },
        'public',
      ).route,
    ).toBe('/book/checkout');
  });

  it('maps public professionals and services routes from booking step context (ai-guide-1.5.1)', () => {
    expect(
      resolveProductGuideSessionContext(
        { context: { bookingStep: 'professionals' } },
        'public',
      ).route,
    ).toBe('/book/professionals');
    expect(
      resolveProductGuideSessionContext(
        { context: { bookingStep: 'services' } },
        'public',
      ).route,
    ).toBe('/book/services');
  });

  it('maps public funnel route from consumer screen pathname (ai-guide-1.5.1)', () => {
    expect(
      resolveProductGuideSessionContext(
        { context: { screen: '/book/demo-salon/professionals' } },
        'public',
      ).route,
    ).toBe('/book/professionals');
  });

  it('maps customer account route from tab context', () => {
    expect(
      resolveProductGuideSessionContext(
        { context: { tab: 'account' } },
        'customer',
      ).route,
    ).toBe('/s/account');
  });

  it('maps customer packages route from tab and screen context (ai-guide-1.5.2)', () => {
    expect(
      resolveProductGuideSessionContext(
        { context: { tab: 'packages' } },
        'customer',
      ).route,
    ).toBe('/s/packages');
    expect(
      resolveProductGuideSessionContext(
        { context: { screen: '/s/demo-salon/account' } },
        'customer',
      ).route,
    ).toBe('/s/account');
  });

  it('passes dashboard owner role into session context', () => {
    const ctx = resolveProductGuideSessionContext(
      {
        context: {
          route: '/dashboard/ai-ops',
          _accessTier: 'owner',
          vertical: 'salon',
        },
      },
      'dashboard',
    );
    expect(ctx.role).toBe('owner');
    expect(ctx.roleProfile).toBe('owner');
    expect(ctx.surface).toBe('dashboard');
  });

  it('maps nested screenContext calendar route over schedule chip alias', () => {
    expect(
      mapProviderMobileGuideRoute({
        mobileRoute: 'schedule',
        screenContext: { tab: 'calendar', route: '/tabs/calendar' },
      }),
    ).toBe('/tabs/calendar');
    expect(
      resolveProductGuideSessionContext(
        {
          context: {
            mobileRoute: 'schedule',
            screenContext: { tab: 'calendar', route: '/tabs/calendar' },
          },
        },
        'provider',
      ).route,
    ).toBe('/tabs/calendar');
  });
});
