import {
  rescueIntegrationsIntent,
  isIntegrationsCompoundPrompt,
  decomposeIntegrationsCompoundPrompt,
  isListWebhooksPrompt,
  isCreateWebhookPrompt,
  isDeleteWebhookPrompt,
  isToggleWebhookPrompt,
  resolveWebhookEnabledFromPrompt,
  isTestWebhookPrompt,
  isRotateApiKeyPrompt,
  isListZapierTriggersPrompt,
  isConfigureZapierPrompt,
  isRunAccountingExportPrompt,
  isConfigureZendeskPrompt,
  isCreateSupportTicketPrompt,
  isSyncCustomerToZendeskPrompt,
  isConfigureMarketingRegistrationEmailPrompt,
  isListIntegrationHealthPrompt,
  isContactSupportPrompt,
  isOpenTicketForOrderPrompt,
  extractWebhookUrlFromPrompt,
  extractWebhookEventsFromPrompt,
  extractWebhookIdFromPrompt,
  extractApiKeyNameFromPrompt,
  extractApiKeyIdFromPrompt,
  extractCustomerNameFromPrompt,
  extractZendeskSubdomainFromPrompt,
  extractTicketSubjectFromPrompt,
  extractTicketBodyFromPrompt,
  extractGiftCardIdFromPrompt,
  extractBookingIdFromPrompt,
  extractMarketingEmailsFromPrompt,
  parseFirstActiveWebhook,
  buildBookingCreatedTestPayload,
  sendTestWebhookDelivery,
  resolveZapierEnabledFromPrompt,
  resolveZendeskSyncEnabledFromPrompt,
  INTEGRATIONS_INTENTS,
  isIntegrationsIntent,
} from './ai-integrations.util.js';

describe('ai-integrations.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard integration prompts', () => {
      expect(isListWebhooksPrompt('List webhooks')).toBe(true);
      expect(isListWebhooksPrompt('Create webhook for events')).toBe(false);
      expect(isCreateWebhookPrompt('Create webhook for booking.created')).toBe(
        true,
      );
      expect(isTestWebhookPrompt('Test webhook delivery')).toBe(true);
      expect(isRotateApiKeyPrompt('Rotate API key for integrations')).toBe(
        true,
      );
      expect(isListZapierTriggersPrompt('List Zapier triggers')).toBe(true);
      expect(isConfigureZapierPrompt('Configure Zapier integration')).toBe(
        true,
      );
      expect(
        isRunAccountingExportPrompt('Run accounting export for this month'),
      ).toBe(true);
      expect(isRunAccountingExportPrompt('Export accounting for May')).toBe(
        false,
      );
      expect(isConfigureZendeskPrompt('Configure Zendesk subdomain')).toBe(
        true,
      );
      expect(isConfigureZendeskPrompt('Sync customer Anna to Zendesk')).toBe(
        false,
      );
      expect(
        isCreateSupportTicketPrompt('Create support ticket about billing'),
      ).toBe(true);
      expect(
        isCreateSupportTicketPrompt('Open ticket for my gift card order'),
      ).toBe(false);
      expect(
        isSyncCustomerToZendeskPrompt('Sync customer Anna to Zendesk'),
      ).toBe(true);
      expect(
        isConfigureMarketingRegistrationEmailPrompt(
          'Configure marketing registration email',
        ),
      ).toBe(true);
      expect(
        isListIntegrationHealthPrompt('List integration health status'),
      ).toBe(true);
    });

    it.each([
      'Delete the webhook for https://hooks.example.com/x',
      'Remove webhook 123e4567-e89b-12d3-a456-426614174000',
      'Drop the booking webhook',
      'Unregister our webhook',
      'Please delete that webhook subscription',
      'Get rid of the old webhook',
      'Remove the payment.received webhook',
      'Delete webhooks pointing to the staging server',
      'Can you remove the webhook we no longer use',
      'Delete the second webhook',
    ])('detects delete webhook prompt: %s', (prompt) => {
      expect(isDeleteWebhookPrompt(prompt)).toBe(true);
      expect(isCreateWebhookPrompt(prompt)).toBe(false);
      expect(isToggleWebhookPrompt(prompt)).toBe(false);
    });

    it.each([
      ['Disable the booking webhook', false],
      ['Pause our webhook for now', false],
      ['Turn off the webhook to https://hooks.example.com/x', false],
      ['Deactivate webhook 123e4567-e89b-12d3-a456-426614174000', false],
      ['Enable the webhook again', true],
      ['Resume the paused webhook', true],
      ['Turn on the payment webhook', true],
      ['Reactivate our webhook subscription', true],
      ['Activate the booking.created webhook', true],
      ['Please disable webhooks until the migration is done', false],
    ])('detects toggle webhook prompt: %s', (prompt, enabled) => {
      expect(isToggleWebhookPrompt(prompt)).toBe(true);
      expect(isDeleteWebhookPrompt(prompt)).toBe(false);
      expect(resolveWebhookEnabledFromPrompt(prompt)).toBe(enabled);
    });

    it('keeps webhook delete/toggle apart from neighbours', () => {
      expect(isDeleteWebhookPrompt('Create webhook for booking.created')).toBe(
        false,
      );
      expect(isDeleteWebhookPrompt('Test webhook delivery')).toBe(false);
      expect(isToggleWebhookPrompt('Configure Zapier integration')).toBe(false);
      expect(isToggleWebhookPrompt('Enable online booking')).toBe(false);
      expect(resolveWebhookEnabledFromPrompt('Enable online booking')).toBe(
        undefined,
      );
      expect(resolveWebhookEnabledFromPrompt('List webhooks')).toBe(undefined);
    });

    it('detects customer integration prompts', () => {
      expect(isContactSupportPrompt('Contact support about my booking')).toBe(
        true,
      );
      expect(
        isOpenTicketForOrderPrompt('Open ticket for my gift card order'),
      ).toBe(true);
      expect(isOpenTicketForOrderPrompt('Request gift card modify')).toBe(
        false,
      );
    });
  });

  describe('extractors and helpers', () => {
    it('extracts webhook, api key, zendesk, and ticket fields', () => {
      expect(
        extractWebhookUrlFromPrompt(
          'Create webhook https://hooks.example.com/x',
        ),
      ).toBe('https://hooks.example.com/x');
      expect(
        extractWebhookEventsFromPrompt('booking.created and payment.received'),
      ).toEqual(['booking.created', 'payment.received']);
      expect(
        extractWebhookIdFromPrompt(
          'test webhook 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(
        extractApiKeyNameFromPrompt('Rotate API key named "Prod key"'),
      ).toBe('Prod key');
      expect(
        extractApiKeyNameFromPrompt('Rotate API key for nightly sync'),
      ).toBe('nightly sync');
      expect(extractApiKeyNameFromPrompt('Rotate API key')).toBeNull();
      expect(extractWebhookUrlFromPrompt('no url here')).toBeNull();
      expect(extractWebhookEventsFromPrompt('no events')).toEqual([]);
      expect(extractWebhookIdFromPrompt('no id')).toBeNull();
      expect(extractApiKeyIdFromPrompt('no key id')).toBeNull();
      expect(extractCustomerNameFromPrompt('no customer')).toBeNull();
      expect(extractZendeskSubdomainFromPrompt('no subdomain')).toBeNull();
      expect(extractTicketSubjectFromPrompt('no subject')).toBeNull();
      expect(extractTicketBodyFromPrompt('no body')).toBeNull();
      expect(extractGiftCardIdFromPrompt('no gift card')).toBeNull();
      expect(extractBookingIdFromPrompt('no booking')).toBeNull();
      expect(extractMarketingEmailsFromPrompt('no emails')).toEqual([]);
      expect(
        parseFirstActiveWebhook([{ id: 'w2', isActive: false }]),
      ).toMatchObject({ id: 'w2' });
      expect(
        resolveZapierEnabledFromPrompt('update zapier settings'),
      ).toBeUndefined();
      expect(
        resolveZendeskSyncEnabledFromPrompt('configure zendesk'),
      ).toBeUndefined();
      expect(
        extractApiKeyIdFromPrompt(
          'revoke api key 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(
        extractCustomerNameFromPrompt('Sync customer Anna to Zendesk'),
      ).toBe('Anna');
      expect(
        extractCustomerNameFromPrompt(
          'sync customer Maria Smith and configure',
        ),
      ).toBe('Maria Smith');
      expect(
        extractZendeskSubdomainFromPrompt('subdomain mybiz and enable'),
      ).toBe('mybiz');
      expect(extractZendeskSubdomainFromPrompt('use mybiz.zendesk.com')).toBe(
        'mybiz',
      );
      expect(extractTicketSubjectFromPrompt('subject "Billing issue"')).toBe(
        'Billing issue',
      );
      expect(extractTicketBodyFromPrompt('body "Need help"')).toBe('Need help');
      expect(
        extractGiftCardIdFromPrompt(
          'order 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(
        extractBookingIdFromPrompt(
          'booking 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(
        extractMarketingEmailsFromPrompt(
          'notify team@example.com and ops@example.com',
        ),
      ).toEqual(['team@example.com', 'ops@example.com']);
      expect(
        extractMarketingEmailsFromPrompt(
          'team@example.com and team@example.com',
        ),
      ).toEqual(['team@example.com']);
      expect(
        parseFirstActiveWebhook([
          { id: 'w2', isActive: false },
          { id: 'w1', isActive: true },
        ]),
      ).toMatchObject({
        id: 'w1',
      });
      expect(parseFirstActiveWebhook([])).toBeNull();
      expect(buildBookingCreatedTestPayload('biz-1').event).toBe(
        'booking.created',
      );
      expect(resolveZapierEnabledFromPrompt('disable Zapier')).toBe(false);
      expect(resolveZapierEnabledFromPrompt('enable Zapier')).toBe(true);
      expect(
        resolveZendeskSyncEnabledFromPrompt('sync customers enabled'),
      ).toBe(true);
      expect(
        resolveZendeskSyncEnabledFromPrompt('disable sync customers'),
      ).toBe(false);
    });

    it('sendTestWebhookDelivery handles success and failure', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn(async () => ({ ok: true, status: 200 })) as any;
      await expect(
        sendTestWebhookDelivery('https://x', { a: 1 }),
      ).resolves.toMatchObject({
        success: true,
        status: 200,
      });

      global.fetch = jest.fn(async () => ({ ok: false, status: 500 })) as any;
      await expect(
        sendTestWebhookDelivery('https://x', { a: 1 }),
      ).resolves.toMatchObject({
        success: false,
        status: 500,
      });

      global.fetch = jest.fn(async () => {
        throw new Error('network down');
      }) as any;
      await expect(
        sendTestWebhookDelivery('https://x', { a: 1 }),
      ).resolves.toMatchObject({
        success: false,
        message: 'network down',
      });

      global.fetch = jest.fn(async () => {
        throw 'boom';
      }) as any;
      await expect(
        sendTestWebhookDelivery('https://x', { a: 1 }),
      ).resolves.toMatchObject({
        success: false,
        message: 'Webhook delivery failed',
      });
      global.fetch = originalFetch;
    });
  });

  describe('rescueIntegrationsIntent', () => {
    it('rescues all integration intents from unknown', () => {
      expect(rescueIntegrationsIntent('List webhooks', 'unknown')?.action).toBe(
        'list_webhooks',
      );
      expect(
        rescueIntegrationsIntent(
          'Create webhook for booking.created',
          'unknown',
        )?.action,
      ).toBe('create_webhook');
      expect(rescueIntegrationsIntent('Test webhook', 'unknown')?.action).toBe(
        'test_webhook',
      );
      expect(
        rescueIntegrationsIntent('Rotate API key', 'unknown')?.action,
      ).toBe('rotate_api_key');
      expect(
        rescueIntegrationsIntent('List Zapier triggers', 'unknown')?.action,
      ).toBe('list_zapier_triggers');
      expect(
        rescueIntegrationsIntent('Configure Zapier', 'unknown')?.action,
      ).toBe('configure_zapier');
      expect(
        rescueIntegrationsIntent(
          'Configure OpenAI integration for the salon',
          'unknown',
        )?.action,
      ).toBe('configure_openai_integration');
      expect(
        rescueIntegrationsIntent('Run accounting export this month', 'unknown')
          ?.action,
      ).toBe('run_accounting_export');
      expect(
        rescueIntegrationsIntent('Configure Zendesk', 'unknown')?.action,
      ).toBe('configure_zendesk');
      expect(
        rescueIntegrationsIntent('Create support ticket', 'unknown')?.action,
      ).toBe('create_support_ticket');
      expect(
        rescueIntegrationsIntent('Sync customer Anna to Zendesk', 'unknown')
          ?.action,
      ).toBe('sync_customer_to_zendesk');
      expect(
        rescueIntegrationsIntent(
          'Configure marketing registration email',
          'unknown',
        )?.action,
      ).toBe('configure_marketing_registration_email');
      expect(
        rescueIntegrationsIntent('List integration health', 'unknown')?.action,
      ).toBe('list_integration_health');
      expect(
        rescueIntegrationsIntent('Is WhatsApp connected?', 'unknown')?.action,
      ).toBe('explain_integration_health');
      expect(
        rescueIntegrationsIntent('Which integrations are connected?', 'unknown')
          ?.action,
      ).toBe('explain_integration_health');
      expect(
        rescueIntegrationsIntent('Contact support', 'unknown')?.action,
      ).toBe('contact_support');
      expect(
        rescueIntegrationsIntent(
          'Open ticket for my gift card order',
          'unknown',
        )?.action,
      ).toBe('open_ticket_for_order');
    });

    it('rescues delete and toggle webhook intents', () => {
      expect(
        rescueIntegrationsIntent(
          'Delete the webhook for https://hooks.example.com/x',
          'unknown',
        )?.action,
      ).toBe('delete_webhook');
      expect(
        rescueIntegrationsIntent('Disable the booking webhook', 'unknown')
          ?.action,
      ).toBe('toggle_webhook');
      expect(
        rescueIntegrationsIntent('Re-enable the paused webhook', 'unknown')
          ?.action,
      ).toBe('toggle_webhook');
      expect(
        rescueIntegrationsIntent(
          'Disable the booking webhook',
          'toggle_webhook',
        ),
      ).toBeNull();
    });

    it('skips rescue for payments export accounting and customerCrm gift card tickets', () => {
      expect(
        rescueIntegrationsIntent('Export accounting for May', 'unknown'),
      ).toBeNull();
      expect(
        rescueIntegrationsIntent('Generate accounting report', 'unknown'),
      ).toBeNull();
      expect(
        rescueIntegrationsIntent('Request gift card modify', 'unknown'),
      ).toBeNull();
      expect(
        rescueIntegrationsIntent('Request gift card cancel', 'unknown'),
      ).toBeNull();
      expect(
        rescueIntegrationsIntent('List webhooks', 'list_webhooks'),
      ).toBeNull();
      expect(
        rescueIntegrationsIntent(
          'List webhooks and create webhook for booking.created',
          'compound_intent',
        ),
      ).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('detects integrations compound prompts', () => {
      expect(
        isIntegrationsCompoundPrompt(
          'List webhooks and create webhook https://hooks.example.com for booking.created events',
        ),
      ).toBe(true);
      expect(
        isIntegrationsCompoundPrompt(
          'Request gift card modify for integration support ticket order',
        ),
      ).toBe(false);
      expect(
        isIntegrationsCompoundPrompt(
          'Request gift card cancel for integration webhook order',
        ),
      ).toBe(false);
      expect(isIntegrationsCompoundPrompt('short')).toBe(false);
      expect(
        isIntegrationsCompoundPrompt('Request gift card modify and cancel'),
      ).toBe(false);
    });

    it('decomposes compound prompts into steps', () => {
      const steps = decomposeIntegrationsCompoundPrompt(
        'List webhooks and create webhook https://hooks.example.com for booking.created events',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'list_webhooks',
        'create_webhook',
      ]);
      expect(steps[1].params.events).toEqual(['booking.created']);

      const lifecycle = decomposeIntegrationsCompoundPrompt(
        'Disable the webhook for https://hooks.example.com/x and delete webhook 123e4567-e89b-12d3-a456-426614174000',
      );
      expect(lifecycle.map((s) => s.action)).toEqual([
        'toggle_webhook',
        'delete_webhook',
      ]);
      expect(lifecycle[0].params.enabled).toBe(false);
      expect(lifecycle[1].params.webhookId).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      const zendesk = decomposeIntegrationsCompoundPrompt(
        'Configure Zendesk and sync customer Anna to Zendesk',
      );
      expect(zendesk.map((s) => s.action)).toEqual([
        'configure_zendesk',
        'sync_customer_to_zendesk',
      ]);

      const accounting = decomposeIntegrationsCompoundPrompt(
        'Run accounting export for this month and list integration health',
      );
      expect(accounting.map((s) => s.action)).toEqual([
        'run_accounting_export',
        'list_integration_health',
      ]);

      const customer = decomposeIntegrationsCompoundPrompt(
        'Contact support and open ticket for my gift card order',
      );
      expect(customer.map((s) => s.action)).toEqual([
        'contact_support',
        'open_ticket_for_order',
      ]);
    });

    it('covers intent registry and single-segment decomposition', () => {
      expect(INTEGRATIONS_INTENTS.length).toBe(21);
      expect(isIntegrationsIntent('list_webhooks')).toBe(true);
      expect(isIntegrationsIntent('not_real')).toBe(false);
      expect(decomposeIntegrationsCompoundPrompt('')).toEqual([]);
      expect(
        decomposeIntegrationsCompoundPrompt('unrelated prompt text only'),
      ).toEqual([]);
      expect(
        decomposeIntegrationsCompoundPrompt('List webhooks; test webhook')
          .length,
      ).toBe(2);
      expect(
        decomposeIntegrationsCompoundPrompt(
          'list integration health and configure zapier',
        ).length,
      ).toBe(2);
      expect(
        decomposeIntegrationsCompoundPrompt('Rotate API key named "Ops"').map(
          (s) => s.action,
        ),
      ).toEqual(['rotate_api_key']);

      const rich = decomposeIntegrationsCompoundPrompt(
        'test webhook 550e8400-e29b-41d4-a716-446655440000 https://hooks.example.com booking.created',
      )[0];
      expect(rich.params).toMatchObject({
        webhookId: '550e8400-e29b-41d4-a716-446655440000',
        url: 'https://hooks.example.com',
        events: ['booking.created'],
      });

      const marketing = decomposeIntegrationsCompoundPrompt(
        'configure marketing registration email team@example.com',
      )[0];
      expect(marketing.params.marketingTeamEmails).toEqual([
        'team@example.com',
      ]);

      const accounting = decomposeIntegrationsCompoundPrompt(
        'run accounting export this month',
      )[0];
      expect(accounting.params.dateRange).toBe('this_month');

      expect(
        decomposeIntegrationsCompoundPrompt(
          'configure zendesk subdomain mybiz; disable zapier integration',
        ).length,
      ).toBe(2);
      expect(
        decomposeIntegrationsCompoundPrompt(
          'configure zendesk sync customers enabled',
        )[0],
      ).toMatchObject({
        action: 'configure_zendesk',
        params: { syncCustomersEnabled: true, enabled: true },
      });
      expect(
        decomposeIntegrationsCompoundPrompt(
          'rotate api key 550e8400-e29b-41d4-a716-446655440000 named "Ops"',
        )[0].params,
      ).toMatchObject({
        keyId: '550e8400-e29b-41d4-a716-446655440000',
        apiKeyName: 'Ops',
      });
      expect(
        decomposeIntegrationsCompoundPrompt(
          'sync customer Anna to zendesk body "Need help"',
        )[0].params.body,
      ).toBe('Need help');
      expect(
        decomposeIntegrationsCompoundPrompt(
          'run accounting ledger export this month',
        )[0].action,
      ).toBe('run_accounting_export');
      expect(
        decomposeIntegrationsCompoundPrompt(
          'list webhooks; ; test webhook',
        ).map((s) => s.action),
      ).toEqual(['list_webhooks', 'test_webhook']);
      expect(
        decomposeIntegrationsCompoundPrompt(
          'list webhooks; random gibberish only here',
        ).length,
      ).toBe(1);
      expect(
        decomposeIntegrationsCompoundPrompt(
          'open ticket for gift card order 550e8400-e29b-41d4-a716-446655440000 booking 550e8400-e29b-41d4-a716-446655440001 subject "Help" body "Need"',
        )[0].params,
      ).toMatchObject({
        giftCardId: '550e8400-e29b-41d4-a716-446655440000',
        bookingId: '550e8400-e29b-41d4-a716-446655440001',
        subject: 'Help',
        body: 'Need',
      });
    });
  });
});
