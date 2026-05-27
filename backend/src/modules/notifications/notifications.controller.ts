import { Controller, Get, Put, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto.js';
import { UpdateWhatsAppIntegrationDto } from './dto/update-whatsapp-integration.dto.js';
import { WhatsAppIntegrationService } from './whatsapp-integration.service.js';
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
  ) {}

  @Get('settings')
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    const settings = await this.notificationsService.getBusinessSettings(businessId);
    const business = await this.businessService.findOne(businessId);
    const providers = this.notificationsService.getProviderStatus(business?.settings);
    return { settings, providers };
  }

  @Put('settings')
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateNotificationSettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    const settings = await this.notificationsService.updateBusinessSettings(businessId, dto);
    const business = await this.businessService.findOne(businessId);
    const providers = this.notificationsService.getProviderStatus(business?.settings);
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

  private async ensureMember(businessId: string, userId: string) {
    const businesses = await this.businessService.getUserBusinesses(userId);
    if (!businesses.some((b) => b.id === businessId)) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}
