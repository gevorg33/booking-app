import { BadRequestException } from '@nestjs/common';
import {
  CATALOG_ANNOUNCEMENT_RENDER_SCENARIOS,
  CATALOG_NOTIFY_PARSE_SCENARIOS,
} from './catalog-announcement.fixtures.js';
import {
  buildCatalogAnnouncementContext,
  formatCatalogDiscountLabel,
  isCustomerEligibleForCatalogEmail,
  isCustomerEligibleForCatalogPush,
  parseCatalogNotifyFromDto,
  parseCatalogNotifyRequest,
  readCatalogAnnouncementDefaults,
  renderCatalogAnnouncementTemplate,
  resolveCatalogAnnouncementTemplate,
  stripCatalogNotifyFields,
} from './catalog-announcement.util.js';

describe('catalog-announcement.util (catalog-notify-1.6–1.8)', () => {
  describe('stripCatalogNotifyFields', () => {
    it('removes notify fields from payload', () => {
      expect(
        stripCatalogNotifyFields({
          name: 'Spa',
          notifyCustomers: true,
          notificationTemplate: { en: { subject: 'Hi', bodyText: 'Body' } },
        }),
      ).toEqual({ name: 'Spa' });
    });
  });

  describe('parseCatalogNotifyRequest', () => {
    it.each(CATALOG_NOTIFY_PARSE_SCENARIOS)(
      '$id',
      ({ input, enabledLocales, expected }) => {
        const parsed = parseCatalogNotifyRequest(input, {
          enabledLocales: [...enabledLocales],
        });
        if (expected === 'null') {
          expect(parsed).toBeNull();
        } else {
          expect(parsed?.notifyCustomers).toBe(true);
        }
      },
    );

    it('requires template when notifyCustomers is true', () => {
      expect(() =>
        parseCatalogNotifyRequest({ notifyCustomers: true }, {}),
      ).toThrow(BadRequestException);
    });

    it('requires all enabled locales', () => {
      expect(() =>
        parseCatalogNotifyRequest(
          {
            notifyCustomers: true,
            notificationTemplate: {
              en: { subject: 'Hi', bodyText: 'Body' },
            },
          },
          { enabledLocales: ['en', 'hy'] },
        ),
      ).toThrow(BadRequestException);
    });

    it('parseCatalogNotifyFromDto accepts typed dto objects', () => {
      expect(
        parseCatalogNotifyFromDto({
          name: 'Spa Day',
          notifyCustomers: false,
        }),
      ).toBeNull();
    });
  });

  describe('renderCatalogAnnouncementTemplate', () => {
    it.each(CATALOG_ANNOUNCEMENT_RENDER_SCENARIOS)(
      '$id',
      ({ template, context, expectedSubject, expectedBody }) => {
        expect(
          renderCatalogAnnouncementTemplate(template.subject, context),
        ).toBe(expectedSubject);
        expect(
          renderCatalogAnnouncementTemplate(template.bodyText, context),
        ).toBe(expectedBody);
      },
    );

    it('replaces missing variables with empty strings', () => {
      expect(
        renderCatalogAnnouncementTemplate('Hi {{packageName}}', {
          customerName: 'Anna',
          businessName: 'Salon',
          bookUrl: 'https://book.example',
          discount: '10%',
        }),
      ).toBe('Hi ');
    });
  });

  describe('resolveCatalogAnnouncementTemplate', () => {
    it('falls back to business default templates', () => {
      const resolved = resolveCatalogAnnouncementTemplate(
        {
          notifyCustomers: true,
          notificationTemplate: {},
        },
        'en',
        'package',
        {
          catalogAnnouncementTemplates: {
            package: {
              en: {
                subject: 'Default {{packageName}}',
                bodyText: 'Book {{bookUrl}}',
              },
            },
          },
        },
      );
      expect(resolved?.subject).toBe('Default {{packageName}}');
    });

    it('prefers request template over defaults', () => {
      const resolved = resolveCatalogAnnouncementTemplate(
        {
          notifyCustomers: true,
          notificationTemplate: {
            en: { subject: 'Live', bodyText: 'Now' },
          },
        },
        'en',
        'subscription_plan',
        {
          catalogAnnouncementTemplates: {
            subscriptionPlan: {
              en: { subject: 'Default', bodyText: 'Old' },
            },
          },
        },
      );
      expect(resolved).toEqual({ subject: 'Live', bodyText: 'Now' });
    });

    it('returns null when no template is available', () => {
      expect(
        resolveCatalogAnnouncementTemplate(
          { notifyCustomers: true, notificationTemplate: {} },
          'en',
          'package',
          {},
        ),
      ).toBeNull();
    });

    it('falls back to subscription plan defaults', () => {
      const resolved = resolveCatalogAnnouncementTemplate(
        {
          notifyCustomers: true,
          notificationTemplate: {},
        },
        'en',
        'subscription_plan',
        {
          catalogAnnouncementTemplates: {
            subscriptionPlan: {
              en: { subject: 'Plan {{planName}}', bodyText: 'Join now' },
            },
          },
        },
      );
      expect(resolved?.subject).toBe('Plan {{planName}}');
    });
  });

  describe('readCatalogAnnouncementDefaults', () => {
    it('returns empty object for invalid settings', () => {
      expect(readCatalogAnnouncementDefaults(undefined)).toEqual({});
      expect(
        readCatalogAnnouncementDefaults({ catalogAnnouncementTemplates: null }),
      ).toEqual({});
    });

    it('sanitizes invalid locale entries', () => {
      expect(
        readCatalogAnnouncementDefaults({
          catalogAnnouncementTemplates: {
            package: {
              'not-a-locale': { subject: 'Hi', bodyText: 'Body' },
              en: { subject: '  ', bodyText: 'Body' },
              hy: { subject: 'Barev', bodyText: 'OK' },
              ru: null,
            },
          },
        }),
      ).toEqual({
        package: { hy: { subject: 'Barev', bodyText: 'OK' } },
        subscriptionPlan: undefined,
      });
    });
  });

  describe('buildCatalogAnnouncementContext', () => {
    it('uses a friendly fallback when customer name is blank', () => {
      expect(
        buildCatalogAnnouncementContext({
          customerName: '   ',
          businessName: 'Demo Salon',
          bookUrl: 'https://book.example',
          discount: '10%',
        }).customerName,
      ).toBe('there');
    });
  });

  describe('formatCatalogDiscountLabel', () => {
    it('formats percent and fixed discounts', () => {
      expect(
        formatCatalogDiscountLabel('percent', 15, { currency: 'USD' }),
      ).toBe('15%');
      expect(
        formatCatalogDiscountLabel('fixed', 20, { currency: 'USD' }),
      ).toContain('20');
    });
  });

  describe('customer eligibility', () => {
    const customer = {
      isActive: true,
      email: 'a@example.com',
      metadata: {
        gdpr: { marketingOptIn: true },
        notifications: { pushNews: true },
      },
    };

    it('allows email and push when opted in', () => {
      expect(isCustomerEligibleForCatalogEmail(customer as any)).toBe(true);
      expect(isCustomerEligibleForCatalogPush(customer as any)).toBe(true);
    });

    it('blocks without marketing opt-in', () => {
      expect(
        isCustomerEligibleForCatalogEmail({
          ...customer,
          metadata: { gdpr: { marketingOptIn: false } },
        } as any),
      ).toBe(false);
    });

    it('blocks inactive customers and missing email', () => {
      expect(
        isCustomerEligibleForCatalogEmail({
          ...customer,
          isActive: false,
        } as any),
      ).toBe(false);
      expect(
        isCustomerEligibleForCatalogEmail({
          ...customer,
          email: '  ',
        } as any),
      ).toBe(false);
    });

    it('blocks push when news preference is off', () => {
      expect(
        isCustomerEligibleForCatalogPush({
          ...customer,
          isActive: false,
        } as any),
      ).toBe(false);
      expect(
        isCustomerEligibleForCatalogPush({
          ...customer,
          metadata: {
            gdpr: { marketingOptIn: true },
            notifications: { pushNews: false },
          },
        } as any),
      ).toBe(false);
    });
  });
});
