import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { ApiKeyService } from './api-key.service.js';
import { WebhooksService } from './webhooks.service.js';
import { CreateApiKeyDto, CreateWebhookDto, UpdateWebhookDto } from './dto/integrations.dto.js';
import { UpdateOpenAiIntegrationDto } from './dto/update-openai-integration.dto.js';
import { OpenAiIntegrationService } from './openai/openai-integration.service.js';
import { OpenAiGatewayService } from './openai/openai-gateway.service.js';
import { UpdateZendeskIntegrationDto } from './dto/update-zendesk-integration.dto.js';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto.js';
import { UpdateDistributionIntegrationDto } from './dto/update-distribution-integration.dto.js';
import { ZendeskIntegrationService } from './zendesk/zendesk-integration.service.js';
import { DistributionIntegrationService } from './distribution/distribution-integration.service.js';

@Controller('businesses/:businessId/integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private businessService: BusinessService,
    private apiKeyService: ApiKeyService,
    private webhooksService: WebhooksService,
    private openAiIntegrationService: OpenAiIntegrationService,
    private openAiGateway: OpenAiGatewayService,
    private zendeskIntegrationService: ZendeskIntegrationService,
    private distributionIntegrationService: DistributionIntegrationService,
  ) {}

  @Get('docs')
  getApiDocs(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    return this.businessService.ensureMember(businessId, user.id).then(() => ({
      baseUrl: process.env.API_PUBLIC_URL || 'http://localhost:3001',
      authentication: {
        type: 'api_key',
        header: 'Authorization: Bearer osk_live_…',
        alternateHeader: 'X-Api-Key: osk_live_…',
      },
      publicBookingApi: {
        description: 'No API key required — scoped by business slug',
        endpoints: [
          { method: 'GET', path: '/public/:slug', description: 'Business profile' },
          { method: 'GET', path: '/public/:slug/services', description: 'List bookable services' },
          { method: 'GET', path: '/public/:slug/providers', description: 'List providers for a date' },
          { method: 'GET', path: '/public/:slug/providers/:employeeId/slots', description: 'Available time slots' },
          { method: 'POST', path: '/public/:slug/bookings', description: 'Create a booking' },
          { method: 'POST', path: '/public/:slug/bookings/checkout', description: 'Start Stripe prepay checkout' },
        ],
      },
      businessApi: {
        description: 'Requires API key created in Integrations settings',
        endpoints: [
          { method: 'GET', path: '/v1/bookings', description: 'List bookings (optional ?date=, ?employeeId=)' },
          { method: 'GET', path: '/v1/bookings/:id', description: 'Get booking by ID' },
          { method: 'GET', path: '/v1/customers', description: 'List customers' },
          { method: 'GET', path: '/v1/services', description: 'List services' },
        ],
      },
      webhooks: {
        description: 'Outbound HTTP POST with HMAC-SHA256 signature in X-OptiSchedule-Signature',
        events: this.webhooksService.getEventOptions().events,
      },
    }));
  }

  @Get('api-keys')
  async listApiKeys(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.apiKeyService.listKeys(businessId);
  }

  @Post('api-keys')
  async createApiKey(
    @Param('businessId') businessId: string,
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.apiKeyService.createKey(businessId, user.id, dto);
  }

  @Delete('api-keys/:keyId')
  async revokeApiKey(
    @Param('businessId') businessId: string,
    @Param('keyId') keyId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.apiKeyService.revokeKey(businessId, keyId);
  }

  @Get('webhooks/events')
  async listWebhookEvents(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.webhooksService.getEventOptions();
  }

  @Get('webhooks')
  async listWebhooks(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.webhooksService.listSubscriptions(businessId);
  }

  @Post('webhooks')
  async createWebhook(
    @Param('businessId') businessId: string,
    @Body() dto: CreateWebhookDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.webhooksService.assertAdminRole(membership);
    return this.webhooksService.createSubscription(businessId, dto);
  }

  @Put('webhooks/:webhookId')
  async updateWebhook(
    @Param('businessId') businessId: string,
    @Param('webhookId') webhookId: string,
    @Body() dto: UpdateWebhookDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.webhooksService.assertAdminRole(membership);
    return this.webhooksService.updateSubscription(businessId, webhookId, dto);
  }

  @Delete('webhooks/:webhookId')
  async deleteWebhook(
    @Param('businessId') businessId: string,
    @Param('webhookId') webhookId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.webhooksService.assertAdminRole(membership);
    return this.webhooksService.deleteSubscription(businessId, webhookId);
  }

  @Get('webhooks/deliveries')
  async listDeliveries(
    @Param('businessId') businessId: string,
    @Query('subscriptionId') subscriptionId: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.webhooksService.listDeliveries(businessId, subscriptionId);
  }

  @Get('openai')
  async getOpenAiIntegration(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.openAiIntegrationService.getPublicSettings(businessId);
  }

  @Get('zendesk/widget')
  async getZendeskWidgetKey(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessService.findOne(businessId);
    return {
      widgetKey: this.zendeskIntegrationService.getDashboardWidgetKey(business.settings),
    };
  }

  @Put('openai')
  async updateOpenAiIntegration(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateOpenAiIntegrationDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    const result = await this.openAiIntegrationService.updateSettings(businessId, dto);
    this.openAiGateway.invalidateBusiness(businessId);
    return result;
  }

  @Get('zendesk')
  async getZendeskIntegration(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.zendeskIntegrationService.getPublicSettings(businessId);
  }

  @Put('zendesk')
  async updateZendeskIntegration(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateZendeskIntegrationDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.zendeskIntegrationService.updateSettings(businessId, dto);
  }

  @Post('zendesk/support-ticket')
  async createSupportTicket(
    @Param('businessId') businessId: string,
    @Body() dto: CreateSupportTicketDto,
    @CurrentUser() user: { id: string; email?: string; firstName?: string; lastName?: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const actorName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined;
    return this.zendeskIntegrationService.createSupportTicket(
      businessId,
      dto,
      user.email,
      actorName,
    );
  }

  @Post('zendesk/sync-customer/:customerId')
  async syncCustomerToZendesk(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    const result = await this.zendeskIntegrationService.syncCustomerIfEnabled(businessId, customerId);
    if (!result) {
      return { synced: false, message: 'Zendesk sync disabled or customer has no email' };
    }
    return { synced: true, ...result };
  }

  @Get('distribution')
  async getDistributionIntegration(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.distributionIntegrationService.getPublicSettings(businessId);
  }

  @Put('distribution')
  async updateDistributionIntegration(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateDistributionIntegrationDto,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.distributionIntegrationService.updateSettings(businessId, dto);
  }

  @Get('google-reserve/feed')
  async getGoogleReserveFeed(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    const membership = await this.businessService.ensureMember(businessId, user.id);
    this.apiKeyService.assertAdminRole(membership);
    return this.distributionIntegrationService.getGoogleReserveFeed(businessId);
  }
}
