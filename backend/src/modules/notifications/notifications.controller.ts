import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';
import { UpdateWhatsAppIntegrationDto } from './dto/update-whatsapp-integration.dto.js';
import {
  UpdateEmailTemplateDto,
  ReplaceCustomEmailVariablesDto,
  EMAIL_TEMPLATE_KEYS,
} from './dto/update-email-template.dto.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
import { NotificationEmailTemplateService } from './notification-email-template.service.js';
import type { NotificationEmailTemplateKey } from './notification-email-template.types.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private businessService: BusinessService,
    private whatsappIntegrationService: WhatsAppIntegrationService,
    private emailTemplateService: NotificationEmailTemplateService,
  ) {}

  @Get('settings')
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    const settings =
      await this.notificationsService.getBusinessSettings(businessId);
    const business = await this.businessService.findOne(businessId);
    const providers = this.notificationsService.getProviderStatus(
      business?.settings,
    );
    return { settings, providers };
  }

  @Put('settings')
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateNotificationSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    const settings = await this.notificationsService.updateBusinessSettings(
      businessId,
      dto,
    );
    const business = await this.businessService.findOne(businessId);
    const providers = this.notificationsService.getProviderStatus(
      business?.settings,
    );
    return { settings, providers };
  }

  @Get('whatsapp')
  async getWhatsAppIntegration(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.whatsappIntegrationService.getPublicSettings(businessId);
  }

  @Put('whatsapp')
  async updateWhatsAppIntegration(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateWhatsAppIntegrationDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.whatsappIntegrationService.updateSettings(businessId, dto);
  }

  @Get('email-templates')
  async listEmailTemplates(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.emailTemplateService.listTemplates(businessId);
  }

  @Put('email-templates/:templateKey')
  async updateEmailTemplate(
    @Param('businessId') businessId: string,
    @Param('templateKey') templateKey: string,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    this.assertEmailTemplateKey(templateKey);
    const template = await this.emailTemplateService.updateTemplate(
      businessId,
      templateKey,
      dto,
    );
    return { template };
  }

  @Put('email-templates/:templateKey/reset')
  async resetEmailTemplate(
    @Param('businessId') businessId: string,
    @Param('templateKey') templateKey: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    this.assertEmailTemplateKey(templateKey);
    const template = await this.emailTemplateService.resetTemplate(
      businessId,
      templateKey,
    );
    return { template };
  }

  @Put('email-templates/custom-variables')
  async replaceCustomEmailVariables(
    @Param('businessId') businessId: string,
    @Body() dto: ReplaceCustomEmailVariablesDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    const variables = await this.emailTemplateService.replaceCustomVariables(
      businessId,
      dto.variables ?? [],
    );
    return { variables };
  }

  private assertEmailTemplateKey(
    key: string,
  ): asserts key is NotificationEmailTemplateKey {
    if (!EMAIL_TEMPLATE_KEYS.includes(key as NotificationEmailTemplateKey)) {
      throw new BadRequestException('Unknown email template key');
    }
  }

  private async ensureMember(businessId: string, userId: string) {
    const businesses = await this.businessService.getUserBusinesses(userId);
    if (!businesses.some((b) => b.id === businessId)) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}
