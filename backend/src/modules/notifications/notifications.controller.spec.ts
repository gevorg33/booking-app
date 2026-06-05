import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { BusinessService } from '../business/business.service.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';
import {
  ReplaceCustomEmailVariablesDto,
  UpdateEmailTemplateDto,
} from './dto/update-email-template.dto.js';

describe('NotificationsController email templates', () => {
  const notificationsService = {
    getBusinessSettings: jest.fn(),
    updateBusinessSettings: jest.fn(),
    getProviderStatus: jest.fn(),
  };
  const businessService = { getUserBusinesses: jest.fn(), findOne: jest.fn() };
  const whatsappIntegrationService = {
    getPublicSettings: jest.fn(),
    updateSettings: jest.fn(),
  };
  const emailTemplateService = {
    listTemplates: jest.fn(),
    updateTemplate: jest.fn(),
    resetTemplate: jest.fn(),
    replaceCustomVariables: jest.fn(),
  };

  const controller = new NotificationsController(
    notificationsService as unknown as NotificationsService,
    businessService as unknown as BusinessService,
    whatsappIntegrationService as unknown as WhatsAppIntegrationService,
    emailTemplateService as unknown as NotificationEmailTemplateService,
  );

  const user = { id: 'user-1' };
  const template = {
    key: 'booking_confirmation',
    label: 'Booking confirmation',
    description: 'Sent when confirmed',
    enabled: true,
    isCustomized: true,
    subject: 'Custom subject',
    bodyText: 'Custom text',
    bodyHtml: '<p>Custom html</p>',
    variables: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.getUserBusinesses.mockResolvedValue([
      { id: 'biz-1', name: 'Glow' },
    ]);
    emailTemplateService.listTemplates.mockResolvedValue({
      templates: [template],
      customVariables: [],
      variables: [],
    });
    emailTemplateService.updateTemplate.mockResolvedValue(template);
    emailTemplateService.resetTemplate.mockResolvedValue({
      ...template,
      isCustomized: false,
    });
    emailTemplateService.replaceCustomVariables.mockResolvedValue([
      { key: 'promo_line', label: 'Promo', defaultValue: '10% off' },
    ]);
  });

  it('lists email templates for business members', async () => {
    const result = await controller.listEmailTemplates('biz-1', user);
    expect(emailTemplateService.listTemplates).toHaveBeenCalledWith('biz-1');
    expect(result.templates).toHaveLength(1);
  });

  it('updates an email template for business members', async () => {
    const dto = new UpdateEmailTemplateDto();
    dto.subject = 'Hello {{customerName}}';
    const result = await controller.updateEmailTemplate(
      'biz-1',
      'booking_confirmation',
      dto,
      user,
    );
    expect(emailTemplateService.updateTemplate).toHaveBeenCalledWith(
      'biz-1',
      'booking_confirmation',
      dto,
    );
    expect(result.template.subject).toBe('Custom subject');
  });

  it('resets an email template for business members', async () => {
    const result = await controller.resetEmailTemplate(
      'biz-1',
      'booking_confirmation',
      user,
    );
    expect(emailTemplateService.resetTemplate).toHaveBeenCalledWith(
      'biz-1',
      'booking_confirmation',
    );
    expect(result.template.isCustomized).toBe(false);
  });

  it('replaces custom variables and defaults missing dto variables to empty list', async () => {
    const dto = new ReplaceCustomEmailVariablesDto();
    dto.variables = [
      { key: 'promo_line', label: 'Promo', defaultValue: '10% off' },
    ];
    const result = await controller.replaceCustomEmailVariables(
      'biz-1',
      dto,
      user,
    );
    expect(emailTemplateService.replaceCustomVariables).toHaveBeenCalledWith(
      'biz-1',
      dto.variables,
    );
    expect(result.variables).toHaveLength(1);

    const emptyDto = new ReplaceCustomEmailVariablesDto();
    await controller.replaceCustomEmailVariables('biz-1', emptyDto, user);
    expect(
      emailTemplateService.replaceCustomVariables,
    ).toHaveBeenLastCalledWith('biz-1', []);

    await controller.replaceCustomEmailVariables(
      'biz-1',
      {} as ReplaceCustomEmailVariablesDto,
      user,
    );
    expect(
      emailTemplateService.replaceCustomVariables,
    ).toHaveBeenLastCalledWith('biz-1', []);
  });

  it('rejects unknown template keys', async () => {
    await expect(
      controller.updateEmailTemplate('biz-1', 'not_a_template', {}, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids email template access for non-members', async () => {
    businessService.getUserBusinesses.mockResolvedValue([{ id: 'other-biz' }]);
    await expect(
      controller.listEmailTemplates('biz-1', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.updateEmailTemplate('biz-1', 'booking_confirmation', {}, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.resetEmailTemplate('biz-1', 'booking_confirmation', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.replaceCustomEmailVariables('biz-1', { variables: [] }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns and updates notification settings for business members', async () => {
    notificationsService.getBusinessSettings.mockResolvedValue({
      emailEnabled: true,
    });
    notificationsService.getProviderStatus.mockReturnValue({
      emailConfigured: true,
    });
    businessService.findOne.mockResolvedValue({ id: 'biz-1', settings: {} });

    const settingsResult = await controller.getSettings('biz-1', user);
    expect(settingsResult.settings).toEqual({ emailEnabled: true });
    expect(settingsResult.providers).toEqual({ emailConfigured: true });

    notificationsService.updateBusinessSettings.mockResolvedValue({
      emailEnabled: false,
    });
    const updateResult = await controller.updateSettings(
      'biz-1',
      { emailEnabled: false },
      user,
    );
    expect(updateResult.settings.emailEnabled).toBe(false);
  });

  it('rejects unknown template keys on reset', async () => {
    await expect(
      controller.resetEmailTemplate('biz-1', 'bad_key', user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns notification settings when business record is missing', async () => {
    notificationsService.getBusinessSettings.mockResolvedValue({
      emailEnabled: true,
    });
    notificationsService.getProviderStatus.mockReturnValue({
      emailConfigured: false,
    });
    businessService.findOne.mockResolvedValue(null);

    const result = await controller.getSettings('biz-1', user);
    expect(result.providers).toEqual({ emailConfigured: false });
  });

  it('returns and updates WhatsApp integration settings for business members', async () => {
    whatsappIntegrationService.getPublicSettings.mockResolvedValue({
      configured: true,
    });
    whatsappIntegrationService.updateSettings.mockResolvedValue({
      configured: true,
      templateLanguage: 'en',
    });

    await expect(
      controller.getWhatsAppIntegration('biz-1', user),
    ).resolves.toEqual({ configured: true });
    await expect(
      controller.updateWhatsAppIntegration(
        'biz-1',
        { templateLanguage: 'en' },
        user,
      ),
    ).resolves.toEqual({ configured: true, templateLanguage: 'en' });
  });
});
