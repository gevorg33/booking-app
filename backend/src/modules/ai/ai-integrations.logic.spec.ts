import {
  handleListWebhooksLogic,
  handleCreateWebhookLogic,
  handleDeleteWebhookLogic,
  handleToggleWebhookLogic,
  handleTestWebhookLogic,
  handleRotateApiKeyLogic,
  handleListZapierTriggersLogic,
  handleConfigureZapierLogic,
  handleRunAccountingExportLogic,
  handleConfigureZendeskLogic,
  handleCreateSupportTicketLogic,
  handleSyncCustomerToZendeskLogic,
  handleConfigureMarketingRegistrationEmailLogic,
  handleListIntegrationHealthLogic,
  handleContactSupportLogic,
  handleOpenTicketForOrderLogic,
  handleIntegrationsCompoundLogic,
  mergeCompoundContext,
  type IntegrationsLogicDeps,
} from './ai-integrations.logic.js';

const business = {
  id: 'biz-1',
  name: 'Test Salon',
  settings: {
    notifications: {
      emailOnNewCustomerRegistration: false,
      marketingTeamEmails: [],
    },
  },
};

const customers = [
  { id: 'c1', name: 'Anna', businessId: 'biz-1', email: 'anna@example.com' },
];

function buildDeps(
  overrides: Partial<IntegrationsLogicDeps> = {},
): IntegrationsLogicDeps {
  return {
    webhooksService: {
      listSubscriptions: jest.fn(async () => [
        {
          id: 'wh-1',
          url: 'https://hooks.example.com/a',
          events: ['booking.created'],
          isActive: true,
        },
      ]),
      createSubscription: jest.fn(async () => ({
        id: 'wh-2',
        url: 'https://hooks.example.com/b',
        events: ['booking.created'],
        isActive: true,
        secret: 'sec',
      })),
      getEventOptions: jest.fn(() => ({ events: ['booking.created'] })),
    } as any,
    apiKeyService: {
      listKeys: jest.fn(async () => [{ id: 'k1', name: 'Main' }]),
      createKey: jest.fn(async () => ({
        id: 'k2',
        name: 'Rotated',
        key: 'osk_live_x',
      })),
      revokeKey: jest.fn(async () => ({ revoked: true })),
    } as any,
    zapierIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        enabled: true,
        webhookEvents: ['booking.created'],
        samplePayloads: [{ event: 'booking.created' }],
        setupSteps: ['step'],
      })),
      updateSettings: jest.fn(async () => ({
        enabled: true,
        webhookEvents: ['booking.created'],
        samplePayloads: [],
        setupSteps: [],
        apiBaseUrl: 'http://localhost:3001',
        makeCompatible: true,
      })),
    } as any,
    accountingIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        enabled: true,
        provider: 'csv',
      })),
      generateExport: jest.fn(async () => ({
        rowCount: 3,
        format: 'csv',
        content: 'a,b,c',
      })),
    } as any,
    zendeskIntegrationService: {
      getPublicSettings: jest.fn(async () => ({
        configured: true,
        enabled: true,
        syncCustomersEnabled: true,
      })),
      updateSettings: jest.fn(async () => ({
        configured: true,
        enabled: true,
        subdomain: 'mybiz',
        syncCustomersEnabled: true,
      })),
      createSupportTicket: jest.fn(async () => ({
        ticketId: 42,
        requesterEmail: 'anna@example.com',
      })),
      syncCustomerIfEnabled: jest.fn(async () => ({ userId: 9 })),
    } as any,
    integrationsDocsService: {
      buildDocs: jest.fn(() => ({ baseUrl: 'http://localhost:3001' })),
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({ ...business })),
      save: jest.fn(async (b) => b),
    } as any,
    customerRepo: {
      find: jest.fn(async () => customers),
      findOne: jest.fn(
        async ({ where }: any) =>
          customers.find((c) => c.id === where.id) ?? null,
      ),
    } as any,
    giftCardRepo: {
      findOne: jest.fn(async () => ({ id: 'gc-1', businessId: 'biz-1' })),
    } as any,
    ...overrides,
  };
}

describe('ai-integrations.logic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists and creates webhooks', async () => {
    const deps = buildDeps();
    expect((await handleListWebhooksLogic(deps, 'biz-1')).success).toBe(true);

    const emptyDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
        getEventOptions: jest.fn(() => ({ events: [] })),
      } as any,
    });
    expect(
      (await handleListWebhooksLogic(emptyDeps, 'biz-1')).summary,
    ).toContain('No webhook');

    const missing = await handleCreateWebhookLogic(deps, 'biz-1', {});
    expect(missing.success).toBe(false);

    const missingEvents = await handleCreateWebhookLogic(deps, 'biz-1', {
      url: 'https://x',
    });
    expect(missingEvents.success).toBe(false);

    const created = await handleCreateWebhookLogic(deps, 'biz-1', {
      url: 'https://hooks.example.com/new',
      events: ['booking.created'],
      description: 'Custom hook',
    });
    expect(created.success).toBe(true);
    expect((created.details as any).webhookId).toBe('wh-2');

    const failDeps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        createSubscription: jest.fn(async () => {
          throw new Error('bad webhook');
        }),
      } as any,
    });
    expect(
      (
        await handleCreateWebhookLogic(failDeps, 'biz-1', {
          url: 'https://x',
          events: ['booking.created'],
        })
      ).success,
    ).toBe(false);
  });

  it('deletes webhooks by id, url, or single subscription', async () => {
    const deps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        deleteSubscription: jest.fn(async () => ({ deleted: true })),
      } as any,
    });

    const byUrl = await handleDeleteWebhookLogic(deps, 'biz-1', {
      url: 'https://hooks.example.com/a',
    });
    expect(byUrl.success).toBe(true);
    expect((byUrl.details as any).webhookId).toBe('wh-1');

    const single = await handleDeleteWebhookLogic(deps, 'biz-1', {});
    expect(single.success).toBe(true);

    const emptyDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
      } as any,
    });
    const none = await handleDeleteWebhookLogic(emptyDeps, 'biz-1', {});
    expect(none.success).toBe(false);
    expect(none.summary).toContain('no webhook');

    const multiDeps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        listSubscriptions: jest.fn(async () => [
          {
            id: 'wh-1',
            url: 'https://hooks.example.com/a',
            events: ['booking.created'],
            isActive: true,
          },
          {
            id: 'wh-2',
            url: 'https://hooks.example.com/b',
            events: ['payment.received'],
            isActive: false,
          },
        ]),
        deleteSubscription: jest.fn(async () => ({ deleted: true })),
      } as any,
    });
    const ambiguous = await handleDeleteWebhookLogic(multiDeps, 'biz-1', {});
    expect(ambiguous.success).toBe(false);
    expect((ambiguous.details as any).clarify).toBe(true);
    expect((ambiguous.details as any).webhooks).toHaveLength(2);

    const byId = await handleDeleteWebhookLogic(multiDeps, 'biz-1', {
      webhookId: 'wh-2',
    });
    expect(byId.success).toBe(true);
    expect((byId.details as any).webhookId).toBe('wh-2');

    const failDeps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        deleteSubscription: jest.fn(async () => {
          throw new Error('boom');
        }),
      } as any,
    });
    expect((await handleDeleteWebhookLogic(failDeps, 'biz-1', {})).success).toBe(
      false,
    );
  });

  it('toggles webhooks on and off with idempotent summaries', async () => {
    const updateSubscription = jest.fn(async (_b: string, id: string, dto: any) => ({
      id,
      url: 'https://hooks.example.com/a',
      events: ['booking.created'],
      isActive: dto.isActive,
    }));
    const deps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        updateSubscription,
      } as any,
    });

    const needsDirection = await handleToggleWebhookLogic(deps, 'biz-1', {});
    expect(needsDirection.success).toBe(false);
    expect((needsDirection.details as any).missing).toEqual(['enabled']);

    const disabled = await handleToggleWebhookLogic(
      deps,
      'biz-1',
      {},
      'Disable the booking webhook',
    );
    expect(disabled.success).toBe(true);
    expect((disabled.details as any).isActive).toBe(false);
    expect((disabled.details as any).changed).toBe(true);
    expect(updateSubscription).toHaveBeenCalledWith('biz-1', 'wh-1', {
      isActive: false,
    });

    const alreadyOn = await handleToggleWebhookLogic(deps, 'biz-1', {
      enabled: true,
    });
    expect(alreadyOn.success).toBe(true);
    expect((alreadyOn.details as any).changed).toBe(false);
    expect(alreadyOn.summary).toContain('already enabled');

    const emptyDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
      } as any,
    });
    const none = await handleToggleWebhookLogic(emptyDeps, 'biz-1', {
      enabled: false,
    });
    expect(none.success).toBe(false);

    const failDeps = buildDeps({
      webhooksService: {
        ...buildDeps().webhooksService,
        updateSubscription: jest.fn(async () => {
          throw new Error('boom');
        }),
      } as any,
    });
    expect(
      (
        await handleToggleWebhookLogic(failDeps, 'biz-1', {
          enabled: false,
        })
      ).success,
    ).toBe(false);
  });

  it('tests webhooks with id or first active subscription', async () => {
    const deps = buildDeps();
    const ok = await handleTestWebhookLogic(deps, 'biz-1', {
      webhookId: 'wh-1',
    });
    expect(ok.success).toBe(true);
    expect((ok.details as any).testResult.success).toBe(true);

    const first = await handleTestWebhookLogic(deps, 'biz-1', {});
    expect(first.success).toBe(true);

    global.fetch = jest.fn(async () => ({ ok: false, status: 503 })) as any;
    const failedDelivery = await handleTestWebhookLogic(deps, 'biz-1', {
      webhookId: 'wh-1',
    });
    expect((failedDelivery.details as any).testResult.success).toBe(false);

    const emptyDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
        getEventOptions: jest.fn(),
      } as any,
    });
    expect((await handleTestWebhookLogic(emptyDeps, 'biz-1', {})).success).toBe(
      false,
    );
  });

  it('rotates api keys with optional revoke', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleRotateApiKeyLogic(
          deps,
          'biz-1',
          { apiKeyName: 'New key' },
          'u1',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleRotateApiKeyLogic(deps, 'biz-1', {}, 'u1', 'rotate api key'))
        .success,
    ).toBe(true);
    expect(
      (await handleRotateApiKeyLogic(deps, 'biz-1', { keyId: 'k1' }, 'u1'))
        .details,
    ).toMatchObject({
      revokedKeyId: 'k1',
    });

    const failDeps = buildDeps({
      apiKeyService: {
        createKey: jest.fn(async () => {
          throw new Error('key fail');
        }),
      } as any,
    });
    expect(
      (await handleRotateApiKeyLogic(failDeps, 'biz-1', {}, 'u1')).success,
    ).toBe(false);
  });

  it('lists zapier triggers and configures zapier', async () => {
    const deps = buildDeps();
    expect((await handleListZapierTriggersLogic(deps, 'biz-1')).success).toBe(
      true,
    );
    expect(
      (await handleConfigureZapierLogic(deps, 'biz-1', { enabled: true }))
        .success,
    ).toBe(true);
    expect(
      (await handleConfigureZapierLogic(deps, 'biz-1', {}, 'disable Zapier'))
        .success,
    ).toBe(true);
    expect((await handleConfigureZapierLogic(deps, 'biz-1', {})).success).toBe(
      true,
    );
    expect(
      (
        await handleConfigureZapierLogic(
          deps,
          'biz-1',
          {},
          'update zapier integration',
        )
      ).success,
    ).toBe(true);

    const failDeps = buildDeps({
      zapierIntegrationService: {
        updateSettings: jest.fn(async () => {
          throw new Error('zapier fail');
        }),
      } as any,
    });
    expect(
      (await handleConfigureZapierLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('runs accounting export with date range', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleRunAccountingExportLogic(deps, 'biz-1', {
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRunAccountingExportLogic(deps, 'biz-1', {
          from: '2026-06-01',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRunAccountingExportLogic(deps, 'biz-1', {
          from: '2026-06-01',
          to: '2026-06-30',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRunAccountingExportLogic(
          deps,
          'biz-1',
          {},
          'run accounting export this month',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleRunAccountingExportLogic(
          deps,
          'biz-1',
          {},
          'run accounting export from June 1 to June 30',
        )
      ).success,
    ).toBe(true);

    const failDeps = buildDeps({
      accountingIntegrationService: {
        generateExport: jest.fn(async () => {
          throw new Error('export fail');
        }),
      } as any,
    });
    expect(
      (await handleRunAccountingExportLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('configures zendesk and creates support tickets', async () => {
    const deps = buildDeps();
    expect(
      (await handleConfigureZendeskLogic(deps, 'biz-1', { subdomain: 'mybiz' }))
        .success,
    ).toBe(true);
    expect(
      (await handleConfigureZendeskLogic(deps, 'biz-1', {}, 'disable Zendesk'))
        .success,
    ).toBe(true);
    expect(
      (
        await handleConfigureZendeskLogic(deps, 'biz-1', {
          syncCustomersEnabled: true,
          enabled: true,
        })
      ).success,
    ).toBe(true);

    const ticket = await handleCreateSupportTicketLogic(deps, 'biz-1', {
      customerName: 'Anna',
      subject: 'Help',
    });
    expect(ticket.success).toBe(true);
    expect((ticket.details as any).ticketId).toBe(42);

    const byId = await handleCreateSupportTicketLogic(deps, 'biz-1', {
      customerId: 'c1',
      subject: 'Help',
    });
    expect(byId.success).toBe(true);

    const missingCustomerDeps = buildDeps({
      customerRepo: {
        findOne: jest.fn(async () => null),
        find: jest.fn(async () => []),
      } as any,
    });
    expect(
      (
        await handleCreateSupportTicketLogic(missingCustomerDeps, 'biz-1', {
          customerId: 'missing',
          subject: 'Help',
        })
      ).success,
    ).toBe(true);

    const failDeps = buildDeps({
      zendeskIntegrationService: {
        ...buildDeps().zendeskIntegrationService,
        updateSettings: jest.fn(async () => {
          throw new Error('zendesk fail');
        }),
        createSupportTicket: jest.fn(async () => {
          throw new Error('ticket fail');
        }),
      } as any,
    });
    expect(
      (await handleConfigureZendeskLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
    expect(
      (await handleCreateSupportTicketLogic(failDeps, 'biz-1', {})).success,
    ).toBe(false);
  });

  it('syncs customers to zendesk', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleSyncCustomerToZendeskLogic(deps, 'biz-1', {
          customerName: 'Anna',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleSyncCustomerToZendeskLogic(deps, 'biz-1', {
          customerName: 'Ann',
        })
      ).success,
    ).toBe(true);
    expect(
      (await handleSyncCustomerToZendeskLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const disabledDeps = buildDeps({
      zendeskIntegrationService: {
        syncCustomerIfEnabled: jest.fn(async () => null),
      } as any,
    });
    expect(
      (
        await handleSyncCustomerToZendeskLogic(disabledDeps, 'biz-1', {
          customerId: 'c1',
        })
      ).success,
    ).toBe(false);

    const failDeps = buildDeps({
      zendeskIntegrationService: {
        syncCustomerIfEnabled: jest.fn(async () => {
          throw new Error('sync fail');
        }),
      } as any,
    });
    expect(
      (
        await handleSyncCustomerToZendeskLogic(failDeps, 'biz-1', {
          customerId: 'c1',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleSyncCustomerToZendeskLogic(failDeps, 'biz-1', {
          customerName: 'Anna',
        })
      ).success,
    ).toBe(false);
  });

  it('configures marketing registration email settings', async () => {
    const deps = buildDeps();
    const enabled = await handleConfigureMarketingRegistrationEmailLogic(
      deps,
      'biz-1',
      {
        marketingTeamEmails: ['team@example.com'],
      },
    );
    expect(enabled.success).toBe(true);

    const disabled = await handleConfigureMarketingRegistrationEmailLogic(
      deps,
      'biz-1',
      {
        emailOnNewCustomerRegistration: false,
      },
    );
    expect(disabled.success).toBe(true);

    const keepEmails = await handleConfigureMarketingRegistrationEmailLogic(
      deps,
      'biz-1',
      {
        emailOnNewCustomerRegistration: true,
      },
    );
    expect(keepEmails.success).toBe(true);

    const missingBusiness = buildDeps({
      businessRepo: {
        findOne: jest.fn(async () => null),
        save: jest.fn(),
      } as any,
    });
    expect(
      (
        await handleConfigureMarketingRegistrationEmailLogic(
          missingBusiness,
          'biz-1',
          {},
        )
      ).success,
    ).toBe(false);
  });

  it('lists integration health', async () => {
    const deps = buildDeps();
    const health = await handleListIntegrationHealthLogic(deps, 'biz-1');
    expect(health.success).toBe(true);
    expect((health.details as any).health.webhooks.configured).toBe(true);
    expect((health.details as any).docsAvailable).toBe(true);

    const noDocs = buildDeps({ integrationsDocsService: undefined });
    expect(
      (await handleListIntegrationHealthLogic(noDocs, 'biz-1')).details,
    ).toMatchObject({ docsAvailable: false });
  });

  it('handles customer contact support and open ticket for order', async () => {
    const deps = buildDeps();
    expect((await handleContactSupportLogic(deps, 'biz-1', {})).success).toBe(
      false,
    );
    expect(
      (
        await handleContactSupportLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
          subject: 'Help',
        })
      ).success,
    ).toBe(true);

    expect(
      (await handleOpenTicketForOrderLogic(deps, 'biz-1', {})).success,
    ).toBe(false);
    const orderTicket = await handleOpenTicketForOrderLogic(deps, 'biz-1', {
      sessionCustomerId: 'c1',
      giftCardId: 'gc-1',
      bookingId: 'b1',
    });
    expect(orderTicket.success).toBe(true);

    const bookingOnlyDeps = buildDeps({
      giftCardRepo: { findOne: jest.fn(async () => null) } as any,
    });
    expect(
      (
        await handleOpenTicketForOrderLogic(bookingOnlyDeps, 'biz-1', {
          sessionCustomerId: 'c1',
          bookingId: 'b1',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleOpenTicketForOrderLogic(
          deps,
          'biz-1',
          {
            sessionCustomerId: 'c1',
          },
          'open ticket for my order',
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleContactSupportLogic(
          deps,
          'biz-1',
          { sessionCustomerId: 'c1' },
          'contact support about billing',
        )
      ).success,
    ).toBe(true);

    const failDeps = buildDeps({
      zendeskIntegrationService: {
        createSupportTicket: jest.fn(async () => {
          throw new Error('zendesk down');
        }),
      } as any,
    });
    expect(
      (
        await handleContactSupportLogic(failDeps, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(false);
    expect(
      (
        await handleOpenTicketForOrderLogic(failDeps, 'biz-1', {
          sessionCustomerId: 'c1',
        })
      ).success,
    ).toBe(false);
  });

  it('runs integrations compound flows and stops on failure', async () => {
    const deps = buildDeps();
    const compound = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'List webhooks and create webhook https://hooks.example.com for booking.created events',
      {},
      'u1',
    );
    expect(compound.success).toBe(true);
    expect((compound.details as any).integrationsCompound).toBe(true);

    const zendeskCompound = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'Configure Zendesk and sync customer Anna to Zendesk',
      {},
    );
    expect(zendeskCompound.success).toBe(true);

    const accountingCompound = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'Run accounting export for this month and list integration health',
      {},
    );
    expect(accountingCompound.success).toBe(true);

    const customerCompound = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'Contact support and open ticket for my gift card order',
      { sessionCustomerId: 'c1' },
    );
    expect(customerCompound.success).toBe(true);

    const tooShort = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'only one command',
      {},
    );
    expect(tooShort.success).toBe(false);

    const stopped = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'sync_customer_to_zendesk', params: {}, segment: 'sync' },
          { action: 'list_webhooks', params: {}, segment: 'list' },
        ],
      },
    );
    expect(stopped.success).toBe(false);
    expect((stopped.details as any).failedStep).toBe(
      'sync_customer_to_zendesk',
    );

    const unsupported = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'a' },
          { action: 'not_real' as any, params: {}, segment: 'b' },
        ],
      },
    );
    expect(unsupported.success).toBe(false);
  });

  it('covers compound step switch branches and context merge', async () => {
    const deps = buildDeps();
    const allSteps = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'list' },
          { action: 'test_webhook', params: {}, segment: 'test' },
          { action: 'rotate_api_key', params: {}, segment: 'rotate' },
          { action: 'list_zapier_triggers', params: {}, segment: 'zapier' },
        ],
        sessionCustomerId: 'c1',
      },
    );
    expect(allSteps.success).toBe(true);

    const moreSteps = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'configure_zapier', params: {}, segment: 'cz' },
          { action: 'configure_zendesk', params: {}, segment: 'zd' },
          {
            action: 'create_support_ticket',
            params: { subject: 'x', body: 'y' },
            segment: 'ticket',
          },
          {
            action: 'configure_marketing_registration_email',
            params: { marketingTeamEmails: ['a@b.com'] },
            segment: 'm',
          },
        ],
      },
    );
    expect(moreSteps.success).toBe(true);

    const createThenTest = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'create_webhook',
            params: {
              url: 'https://hooks.example.com/z',
              events: ['booking.created'],
            },
            segment: 'create',
          },
          { action: 'test_webhook', params: {}, segment: 'test' },
        ],
      },
    );
    expect(createThenTest.success).toBe(true);
    expect((createThenTest.details as any).finalContext.webhookId).toBe('wh-2');

    const ticketContext = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'contact_support',
            params: { sessionCustomerId: 'c1', subject: 'Help' },
            segment: 'contact',
          },
          {
            action: 'open_ticket_for_order',
            params: { sessionCustomerId: 'c1', giftCardId: 'gc-1' },
            segment: 'order',
          },
        ],
      },
    );
    expect(ticketContext.success).toBe(true);
    expect((ticketContext.details as any).finalContext.ticketId).toBe(42);
  });

  it('covers remaining handler branches', async () => {
    const deps = buildDeps();
    expect(
      (await handleSyncCustomerToZendeskLogic(deps, 'biz-1', {})).success,
    ).toBe(false);

    const unconfiguredZendesk = buildDeps({
      zendeskIntegrationService: {
        ...buildDeps().zendeskIntegrationService,
        updateSettings: jest.fn(async () => ({
          configured: false,
          enabled: true,
        })),
      } as any,
    });
    expect(
      (await handleConfigureZendeskLogic(unconfiguredZendesk, 'biz-1', {}))
        .summary,
    ).toContain('credentials');

    const zendeskPlain = buildDeps({
      zendeskIntegrationService: {
        updateSettings: jest.fn(async () => ({
          configured: true,
          enabled: true,
          subdomain: 'x',
        })),
      } as any,
    });
    expect(
      (
        await handleConfigureZendeskLogic(zendeskPlain, 'biz-1', {
          subdomain: 'x',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureZendeskLogic(
          zendeskPlain,
          'biz-1',
          {},
          'zendesk settings update',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureZendeskLogic(zendeskPlain, 'biz-1', {
          enabled: false,
          syncCustomersEnabled: false,
        })
      ).success,
    ).toBe(true);

    const testUnknownId = await handleTestWebhookLogic(deps, 'biz-1', {
      webhookId: 'missing-id',
    });
    expect(testUnknownId.success).toBe(true);

    expect(
      (
        await handleCreateWebhookLogic(deps, 'biz-1', {
          url: 'https://hooks.example.com/default-desc',
          events: ['booking.created'],
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleCreateSupportTicketLogic(deps, 'biz-1', {
          subject: 'Help',
          body: 'Body text',
        })
      ).success,
    ).toBe(true);

    const emptyListDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
        getEventOptions: jest.fn(() => ({ events: [] })),
      } as any,
    });
    const listOnlyCompound = await handleIntegrationsCompoundLogic(
      emptyListDeps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'list' },
          { action: 'test_webhook', params: {}, segment: 'test' },
        ],
      },
    );
    expect(listOnlyCompound.success).toBe(false);

    const noGiftCardDeps = buildDeps({
      giftCardRepo: { findOne: jest.fn(async () => null) } as any,
    });
    expect(
      (
        await handleOpenTicketForOrderLogic(noGiftCardDeps, 'biz-1', {
          sessionCustomerId: 'c1',
          giftCardId: 'gc-missing',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleOpenTicketForOrderLogic(deps, 'biz-1', {
          sessionCustomerId: 'c1',
          bookingId: 'b1',
        })
      ).success,
    ).toBe(true);

    expect(
      (
        await handleContactSupportLogic(
          deps,
          'biz-1',
          { sessionCustomerId: 'c1' },
          'contact support',
        )
      ).success,
    ).toBe(true);
  });

  it('covers error fallbacks and optional branch paths', async () => {
    const deps = buildDeps();
    expect(
      (
        await handleSyncCustomerToZendeskLogic(deps, 'biz-1', {
          customerName: 'Bob',
        })
      ).success,
    ).toBe(false);

    const throwNoMessage = (action: string) => {
      throw { code: action };
    };

    expect(
      (
        await handleCreateWebhookLogic(
          buildDeps({
            webhooksService: {
              createSubscription: jest.fn(async () => {
                throwNoMessage('webhook');
              }),
            } as any,
          }),
          'biz-1',
          { url: 'https://x', events: ['booking.created'] },
        )
      ).summary,
    ).toBe('Could not create webhook.');

    expect(
      (
        await handleRotateApiKeyLogic(
          buildDeps({
            apiKeyService: {
              createKey: jest.fn(async () => {
                throwNoMessage('key');
              }),
            } as any,
          }),
          'biz-1',
          {},
          'u1',
        )
      ).summary,
    ).toBe('Could not rotate API key.');

    const zapierDisabled = buildDeps({
      zapierIntegrationService: {
        updateSettings: jest.fn(async () => ({
          enabled: false,
          webhookEvents: [],
          samplePayloads: [],
          setupSteps: [],
          apiBaseUrl: 'http://localhost:3001',
          makeCompatible: true,
        })),
      } as any,
    });
    expect(
      (
        await handleConfigureZapierLogic(zapierDisabled, 'biz-1', {
          enabled: false,
        })
      ).summary,
    ).toContain('disabled');

    expect(
      (
        await handleRunAccountingExportLogic(
          buildDeps({
            accountingIntegrationService: {
              generateExport: jest.fn(async () => {
                throwNoMessage('export');
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toBe('Accounting export failed.');

    const zendeskNoSubdomain = buildDeps({
      zendeskIntegrationService: {
        updateSettings: jest.fn(async () => ({
          configured: true,
          enabled: true,
        })),
      } as any,
    });
    expect(
      (await handleConfigureZendeskLogic(zendeskNoSubdomain, 'biz-1', {}))
        .summary,
    ).toBe('Zendesk configured.');

    expect(
      (
        await handleCreateSupportTicketLogic(
          buildDeps({
            zendeskIntegrationService: {
              createSupportTicket: jest.fn(async () => {
                throwNoMessage('ticket');
              }),
            } as any,
          }),
          'biz-1',
          { subject: 'x', body: 'y' },
        )
      ).summary,
    ).toBe('Could not create support ticket.');

    expect(
      (
        await handleSyncCustomerToZendeskLogic(
          buildDeps({
            zendeskIntegrationService: {
              syncCustomerIfEnabled: jest.fn(async () => {
                throwNoMessage('sync');
              }),
            } as any,
          }),
          'biz-1',
          { customerId: 'c1' },
        )
      ).summary,
    ).toBe('Customer sync failed.');

    const bareBusinessDeps = buildDeps({
      businessRepo: {
        findOne: jest.fn(async () => ({ id: 'biz-1', settings: undefined })),
        save: jest.fn(async (b) => b),
      } as any,
    });
    expect(
      (
        await handleConfigureMarketingRegistrationEmailLogic(
          bareBusinessDeps,
          'biz-1',
          {
            emailOnNewCustomerRegistration: false,
          },
        )
      ).success,
    ).toBe(true);

    expect(
      (
        await handleContactSupportLogic(
          buildDeps({
            zendeskIntegrationService: {
              createSupportTicket: jest.fn(async () => {
                throwNoMessage('contact');
              }),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'c1' },
        )
      ).summary,
    ).toBe('Could not contact support.');

    expect(
      (
        await handleOpenTicketForOrderLogic(
          buildDeps({
            zendeskIntegrationService: {
              createSupportTicket: jest.fn(async () => {
                throwNoMessage('order');
              }),
            } as any,
          }),
          'biz-1',
          { sessionCustomerId: 'c1' },
        )
      ).summary,
    ).toBe('Could not open ticket for order.');

    const listMerge = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'list' },
          { action: 'list_zapier_triggers', params: {}, segment: 'zapier' },
        ],
      },
    );
    expect(listMerge.success).toBe(true);
    expect((listMerge.details as any).finalContext.webhookId).toBe('wh-1');

    const supportMerge = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'create_support_ticket',
            params: { subject: 'x', body: 'y' },
            segment: 'ticket',
          },
          { action: 'list_integration_health', params: {}, segment: 'health' },
        ],
      },
    );
    expect(supportMerge.success).toBe(true);
    expect((supportMerge.details as any).finalContext.ticketId).toBe(42);

    expect(
      (
        await handleConfigureZapierLogic(
          buildDeps({
            zapierIntegrationService: {
              updateSettings: jest.fn(async () => {
                throw { code: 'zapier' };
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toBe('Could not configure Zapier.');

    expect(
      (await handleConfigureZendeskLogic(deps, 'biz-1', {}, 'turn off zendesk'))
        .success,
    ).toBe(true);

    expect(
      (
        await handleConfigureZendeskLogic(
          buildDeps({
            zendeskIntegrationService: {
              updateSettings: jest.fn(async () => {
                throw { code: 'zendesk' };
              }),
            } as any,
          }),
          'biz-1',
          {},
        )
      ).summary,
    ).toBe('Could not configure Zendesk.');

    const presetWebhook = await handleIntegrationsCompoundLogic(
      deps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'list' },
          { action: 'list_zapier_triggers', params: {}, segment: 'zapier' },
        ],
        webhookId: 'preset-wh',
      },
    );
    expect((presetWebhook.details as any).finalContext.webhookId).toBe(
      'preset-wh',
    );

    expect(
      (
        await handleConfigureZendeskLogic(
          deps,
          'biz-1',
          {},
          'zendesk subdomain foo',
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await handleConfigureZendeskLogic(
          deps,
          'biz-1',
          { enabled: false },
          'configure zendesk',
        )
      ).success,
    ).toBe(true);
    expect(
      (await handleConfigureZendeskLogic(deps, 'biz-1', {}, 'enable zendesk'))
        .success,
    ).toBe(true);

    const emptyListDeps = buildDeps({
      webhooksService: {
        listSubscriptions: jest.fn(async () => []),
        getEventOptions: jest.fn(() => ({ events: [] })),
      } as any,
    });
    const emptyWebhookMerge = await handleIntegrationsCompoundLogic(
      emptyListDeps,
      'biz-1',
      'compound',
      {
        compoundSteps: [
          { action: 'list_webhooks', params: {}, segment: 'list' },
          { action: 'list_zapier_triggers', params: {}, segment: 'zapier' },
        ],
      },
    );
    expect(emptyWebhookMerge.success).toBe(true);
    expect(
      (emptyWebhookMerge.details as any).finalContext.webhookId,
    ).toBeUndefined();

    const ticketlessSupport = await handleIntegrationsCompoundLogic(
      buildDeps({
        zendeskIntegrationService: {
          ...buildDeps().zendeskIntegrationService,
          createSupportTicket: jest.fn(async () => ({
            requesterEmail: 'a@b.com',
          })),
        } as any,
      }),
      'biz-1',
      'compound',
      {
        compoundSteps: [
          {
            action: 'contact_support',
            params: { sessionCustomerId: 'c1', subject: 'Help' },
            segment: 'contact',
          },
          { action: 'list_integration_health', params: {}, segment: 'health' },
        ],
      },
    );
    expect(ticketlessSupport.success).toBe(true);
    expect(
      (ticketlessSupport.details as any).finalContext.ticketId,
    ).toBeUndefined();

    expect(
      mergeCompoundContext(
        { webhookId: 'preset' },
        { action: 'list_webhooks', params: {}, segment: 'list' },
        { success: true, action: 'list_webhooks', summary: '', details: {} },
      ).webhookId,
    ).toBe('preset');

    expect(
      mergeCompoundContext(
        {},
        { action: 'list_webhooks', params: {}, segment: 'list' },
        {
          success: true,
          action: 'list_webhooks',
          summary: '',
          details: { subscriptions: undefined },
        },
      ).webhookId,
    ).toBeUndefined();
  });
});
