import { BadRequestException } from '@nestjs/common';
import { resolveEmailTemplate } from './notification-email-template.defaults.js';
import { listResolvedEmailTemplates } from './notification-email-template.util.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';

describe('Sprint 29 — notification email template locales', () => {
  describe('resolveEmailTemplate per-locale overrides', () => {
    it('prefers locale-specific override over global override', () => {
      const resolved = resolveEmailTemplate(
        'booking_confirmation',
        {
          subject: 'Global subject',
          locales: {
            hy: { subject: 'Հայերեն վերնագիր' },
          },
        },
        'hy',
      );
      expect(resolved.subject).toBe('Հայերեն վերնագիր');
    });

    it('marks template customized when locale overrides exist', () => {
      const resolved = resolveEmailTemplate(
        'booking_reminder',
        {
          locales: {
            ru: { bodyText: 'Кастомный текст' },
          },
        },
        'ru',
      );
      expect(resolved.bodyText).toBe('Кастомный текст');
      expect(resolved.isCustomized).toBe(true);
    });
  });

  describe('listResolvedEmailTemplates byLocale', () => {
    it('returns byLocale only for tenant-enabled locales', () => {
      const templates = listResolvedEmailTemplates({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
      });
      const confirmation = templates.find(
        (tpl) => tpl.key === 'booking_confirmation',
      );
      expect(confirmation?.byLocale).toEqual({
        en: expect.objectContaining({
          subject: expect.any(String),
          bodyText: expect.any(String),
          bodyHtml: expect.any(String),
        }),
        hy: expect.objectContaining({
          subject: expect.stringContaining('{{'),
          bodyText: expect.any(String),
          bodyHtml: expect.any(String),
        }),
      });
      expect(confirmation?.byLocale?.ru).toBeUndefined();
    });

    it('uses stored locale override in byLocale output', () => {
      const templates = listResolvedEmailTemplates({
        enabledLocales: ['en', 'hy'],
        defaultLocale: 'en',
        emailTemplates: {
          templates: {
            booking_confirmation: {
              locales: {
                hy: { subject: 'Custom HY subject' },
              },
            },
          },
        },
      });
      const confirmation = templates.find(
        (tpl) => tpl.key === 'booking_confirmation',
      );
      expect(confirmation?.byLocale?.hy?.subject).toBe('Custom HY subject');
    });
  });

  describe('NotificationEmailTemplateService locale gating', () => {
    const businessRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (b: unknown) => b),
    };
    const service = new NotificationEmailTemplateService(businessRepo as never);

    beforeEach(() => {
      jest.clearAllMocks();
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          enabledLocales: ['en', 'hy'],
          defaultLocale: 'en',
          emailTemplates: { templates: {}, customVariables: [] },
        },
      });
    });

    it('persists locale-specific template overrides for enabled locales', async () => {
      const result = await service.updateTemplate(
        'biz-1',
        'booking_confirmation',
        {
          locales: {
            hy: {
              subject: 'HY only',
              bodyText: 'HY text',
              bodyHtml: '<p>HY</p>',
            },
          },
        },
      );

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            emailTemplates: expect.objectContaining({
              templates: expect.objectContaining({
                booking_confirmation: expect.objectContaining({
                  locales: expect.objectContaining({
                    hy: expect.objectContaining({ subject: 'HY only' }),
                  }),
                }),
              }),
            }),
          }),
        }),
      );
      expect(result.subject).toBeTruthy();
    });

    it('rejects locale overrides for disabled locales', async () => {
      await expect(
        service.updateTemplate('biz-1', 'booking_confirmation', {
          locales: {
            ru: { subject: 'Should fail' },
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(businessRepo.save).not.toHaveBeenCalled();
    });
  });
});
