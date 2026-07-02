import type { CommandResult } from './command-completion.types.js';
import {
  DASHBOARD_CATALOG_DISPATCH_INTENTS,
  DASHBOARD_CORE_DISPATCH_INTENTS,
  DASHBOARD_PAYMENTS_DISPATCH_INTENTS,
  DASHBOARD_SETTINGS_DISPATCH_INTENTS,
  isDashboardCatalogDispatchIntent,
  isDashboardCoreDispatchIntent,
  isDashboardPaymentsDispatchIntent,
  isDashboardSettingsDispatchIntent,
} from './ai-dashboard-core.util.js';
import {
  dispatchDashboardCoreIntent,
  type DashboardCoreDispatchContext,
  type DashboardCoreLogicDeps,
} from './ai-dashboard-core.logic.js';

describe('ai-dashboard-core.util (ai-cmd-ext-6.1)', () => {
  it('classifies catalog intents', () => {
    expect(isDashboardCatalogDispatchIntent('list_packages')).toBe(true);
    expect(isDashboardCatalogDispatchIntent('create_booking')).toBe(false);
  });

  it('classifies payments intents', () => {
    expect(isDashboardPaymentsDispatchIntent('summarize_unpaid')).toBe(true);
    expect(isDashboardPaymentsDispatchIntent('adjust_gift_card_balance')).toBe(
      true,
    );
    expect(isDashboardPaymentsDispatchIntent('create_booking')).toBe(false);
  });

  it('classifies settings intents', () => {
    expect(isDashboardSettingsDispatchIntent('configure_online_booking')).toBe(
      true,
    );
    expect(isDashboardSettingsDispatchIntent('list_packages')).toBe(false);
  });

  it('unions all core dispatch intents without duplicates', () => {
    const union = new Set(DASHBOARD_CORE_DISPATCH_INTENTS);
    expect(union.size).toBe(DASHBOARD_CORE_DISPATCH_INTENTS.length);
    for (const intent of DASHBOARD_CATALOG_DISPATCH_INTENTS) {
      expect(isDashboardCoreDispatchIntent(intent)).toBe(true);
    }
    for (const intent of DASHBOARD_PAYMENTS_DISPATCH_INTENTS) {
      expect(isDashboardCoreDispatchIntent(intent)).toBe(true);
    }
    for (const intent of DASHBOARD_SETTINGS_DISPATCH_INTENTS) {
      expect(isDashboardCoreDispatchIntent(intent)).toBe(true);
    }
  });
});

describe('dispatchDashboardCoreIntent (ai-cmd-ext-6.1)', () => {
  const baseCtx: DashboardCoreDispatchContext = {
    businessId: 'biz-1',
    action: 'list_packages',
    params: {},
    effectivePrompt: 'list packages',
    services: [],
    customers: [],
    resolveCustomer: () => undefined,
    isExecutionConfirmed: () => false,
  };

  function mockDeps(
    overrides: Partial<DashboardCoreLogicDeps> = {},
  ): DashboardCoreLogicDeps {
    return {
      catalog: {
        handleListPackages: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'list_packages' }),
      } as unknown as DashboardCoreLogicDeps['catalog'],
      payments: {
        dispatchIntent: jest.fn().mockResolvedValue({
          success: true,
          action: 'summarize_unpaid',
        }),
      } as unknown as DashboardCoreLogicDeps['payments'],
      marketingGrowth: {} as DashboardCoreLogicDeps['marketingGrowth'],
      notificationSettings: {
        handleConfigureNotificationSettings: jest.fn().mockResolvedValue({
          success: true,
          action: 'configure_notification_settings',
        }),
      } as unknown as DashboardCoreLogicDeps['notificationSettings'],
      whatsappIntegration: {} as DashboardCoreLogicDeps['whatsappIntegration'],
      pushNotifications: {} as DashboardCoreLogicDeps['pushNotifications'],
      integrations: {} as DashboardCoreLogicDeps['integrations'],
      operations: {} as DashboardCoreLogicDeps['operations'],
      businessCurrency: {} as DashboardCoreLogicDeps['businessCurrency'],
      businessTax: {} as DashboardCoreLogicDeps['businessTax'],
      businessCompliance: {} as DashboardCoreLogicDeps['businessCompliance'],
      businessLanguages: {} as DashboardCoreLogicDeps['businessLanguages'],
      businessDateFormat: {} as DashboardCoreLogicDeps['businessDateFormat'],
      ...overrides,
    };
  }

  it('returns null for non-core intents', async () => {
    const result = await dispatchDashboardCoreIntent(mockDeps(), {
      ...baseCtx,
      action: 'create_booking',
    });
    expect(result).toBeNull();
  });

  it('dispatches catalog intent', async () => {
    const deps = mockDeps();
    const result = (await dispatchDashboardCoreIntent(
      deps,
      baseCtx,
    )) as CommandResult;
    expect(result.success).toBe(true);
    expect(deps.catalog.handleListPackages).toHaveBeenCalledWith('biz-1');
  });

  it('dispatches payments intent', async () => {
    const deps = mockDeps();
    const result = await dispatchDashboardCoreIntent(deps, {
      ...baseCtx,
      action: 'summarize_unpaid',
      effectivePrompt: 'who owes money',
    });
    expect(result?.action).toBe('summarize_unpaid');
    expect(deps.payments.dispatchIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        action: 'summarize_unpaid',
        prompt: 'who owes money',
      }),
    );
  });

  it('dispatches settings intent', async () => {
    const deps = mockDeps();
    const result = await dispatchDashboardCoreIntent(deps, {
      ...baseCtx,
      action: 'configure_notification_settings',
      effectivePrompt: 'disable SMS reminders',
    });
    expect(result?.action).toBe('configure_notification_settings');
    expect(
      deps.notificationSettings.handleConfigureNotificationSettings,
    ).toHaveBeenCalledWith('biz-1', {}, 'disable SMS reminders');
  });
});
