import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';

describe('NotificationEmailTemplateService', () => {
  const businessRepo = { findOne: jest.fn(), save: jest.fn() };
  const service = new NotificationEmailTemplateService(businessRepo as any);

  const business = {
    id: 'biz-1',
    name: 'Glow Salon',
    settings: {
      emailTemplates: {
        templates: {
          booking_reminder: { subject: 'Custom reminder {{customerName}}' },
        },
        customVariables: [{ key: 'promo_line', label: 'Promo', defaultValue: '10% off' }],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({ ...business, settings: { ...business.settings } });
    businessRepo.save.mockImplementation(async (value) => value);
  });

  it('lists templates for businesses without stored email template settings', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-2', name: 'Fresh Salon', settings: {} });
    const result = await service.listTemplates('biz-2');
    expect(result.customVariables).toEqual([]);
    expect(result.templates.every((tpl) => tpl.enabled)).toBe(true);
  });

  it('lists templates, custom variables, and merged variable catalog', async () => {
    const result = await service.listTemplates('biz-1');

    expect(result.templates).toHaveLength(7);
    expect(result.templates.find((tpl) => tpl.key === 'booking_reminder')?.subject).toContain('Custom reminder');
    expect(result.customVariables).toEqual([{ key: 'promo_line', label: 'Promo', defaultValue: '10% off' }]);
    expect(result.variables.some((v) => v.key === 'promo_line' && v.custom)).toBe(true);
    expect(result.variables.some((v) => v.key === 'customerName' && !v.custom)).toBe(true);
  });

  it('updates a template override and persists merged settings', async () => {
    businessRepo.findOne.mockResolvedValue({ id: 'biz-1', name: 'Fresh Salon', settings: {} });
    const template = await service.updateTemplate('biz-1', 'booking_confirmation', {
      subject: 'Thanks {{customerName}}',
      bodyText: 'See you soon',
    });

    expect(template.subject).toBe('Thanks {{customerName}}');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          emailTemplates: expect.objectContaining({
            templates: expect.objectContaining({
              booking_confirmation: expect.objectContaining({
                subject: 'Thanks {{customerName}}',
                bodyText: 'See you soon',
              }),
            }),
          }),
        }),
      }),
    );
  });

  it('resets a template override back to platform defaults', async () => {
    const template = await service.resetTemplate('biz-1', 'booking_reminder');

    expect(template.subject).toContain('Reminder:');
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          emailTemplates: expect.objectContaining({
            templates: expect.not.objectContaining({
              booking_reminder: expect.anything(),
            }),
          }),
        }),
      }),
    );
  });

  it('replaces custom variables after validation', async () => {
    const variables = await service.replaceCustomVariables('biz-1', [
      { key: 'footer_note', label: 'Footer', defaultValue: 'Thanks!' },
    ]);

    expect(variables).toEqual([{ key: 'footer_note', label: 'Footer', defaultValue: 'Thanks!' }]);
    expect(businessRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          emailTemplates: expect.objectContaining({
            customVariables: variables,
          }),
        }),
      }),
    );
  });

  it('rejects reserved custom variable keys', async () => {
    await expect(
      service.replaceCustomVariables('biz-1', [{ key: 'customerName', label: 'Name', defaultValue: 'X' }]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when business is missing', async () => {
    businessRepo.findOne.mockResolvedValue(null);
    await expect(service.listTemplates('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
