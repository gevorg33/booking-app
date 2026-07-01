import { CATALOG_NOTIFY_DASHBOARD_SCENARIOS } from './ai-catalog-notify.fixtures.js';
import {
  applyCatalogNotifyPromptHints,
  buildAiDefaultCatalogNotifyTemplate,
  isCatalogNotifyCustomersPrompt,
  isCatalogNotifyExplicitSkipPrompt,
  enrichCatalogNotifyRescueParams,
  isCatalogNotifyMutateAction,
  resolveAiCatalogNotifyPayload,
} from './ai-catalog-notify.util.js';

describe('ai-catalog-notify.util (catalog-notify-1.9)', () => {
  describe('prompt detection', () => {
    it.each(CATALOG_NOTIFY_DASHBOARD_SCENARIOS)(
      '$id detects notify flag',
      ({ prompt, notifyCustomers }) => {
        if (notifyCustomers) {
          expect(isCatalogNotifyCustomersPrompt(prompt)).toBe(true);
        } else {
          expect(isCatalogNotifyExplicitSkipPrompt(prompt)).toBe(true);
        }
      },
    );
  });

  describe('applyCatalogNotifyPromptHints', () => {
    it.each(CATALOG_NOTIFY_DASHBOARD_SCENARIOS)(
      '$id sets notifyCustomers on $expectedAction',
      ({ prompt, expectedAction, notifyCustomers }) => {
        const params: Record<string, unknown> = {};
        applyCatalogNotifyPromptHints(expectedAction, params, prompt);
        expect(params.notifyCustomers).toBe(notifyCustomers);
      },
    );

    it('ignores unrelated actions', () => {
      const params: Record<string, unknown> = {};
      applyCatalogNotifyPromptHints(
        'list_packages',
        params,
        'notify customers about packages',
      );
      expect(params.notifyCustomers).toBeUndefined();
    });
  });

  describe('default templates', () => {
    it('builds per-locale package templates', () => {
      const template = buildAiDefaultCatalogNotifyTemplate('package', [
        'en',
        'hy',
      ]);
      expect(template.en?.subject).toContain('{{packageName}}');
      expect(template.hy?.subject).toContain('{{packageName}}');
    });

    it('prefers saved business defaults', () => {
      const template = buildAiDefaultCatalogNotifyTemplate(
        'subscription_plan',
        ['en'],
        {
          catalogAnnouncementTemplates: {
            subscriptionPlan: {
              en: {
                subject: 'Saved {{planName}}',
                bodyText: 'Join {{bookUrl}}',
              },
            },
          },
        },
      );
      expect(template.en).toEqual({
        subject: 'Saved {{planName}}',
        bodyText: 'Join {{bookUrl}}',
      });
    });
  });

  describe('resolveAiCatalogNotifyPayload', () => {
    it('returns empty payload when notify is off', () => {
      expect(
        resolveAiCatalogNotifyPayload(
          {},
          { enabledLocales: ['en'] },
          'package',
        ),
      ).toEqual({});
    });

    it('fills templates for enabled locales', () => {
      const payload = resolveAiCatalogNotifyPayload(
        { notifyCustomers: true },
        { enabledLocales: ['en', 'ru'] },
        'package',
      );
      expect(payload.notifyCustomers).toBe(true);
      expect(Object.keys(payload.notificationTemplate ?? {})).toEqual([
        'en',
        'ru',
      ]);
    });
  });

  describe('isCatalogNotifyMutateAction', () => {
    it('matches package and plan CRUD', () => {
      expect(isCatalogNotifyMutateAction('create_package')).toBe(true);
      expect(isCatalogNotifyMutateAction('update_subscription_plan')).toBe(
        true,
      );
      expect(isCatalogNotifyMutateAction('list_packages')).toBe(false);
    });
  });

  describe('enrichCatalogNotifyRescueParams', () => {
    it('mirrors applyCatalogNotifyPromptHints for rescued actions', () => {
      const params: Record<string, unknown> = {};
      enrichCatalogNotifyRescueParams(
        'update_subscription_plan',
        params,
        'Update nail club membership and notify customers',
      );
      expect(params.notifyCustomers).toBe(true);
    });
  });
});
