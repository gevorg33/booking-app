import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service.js';
import { PlanEntitlementsService } from './plan-entitlements.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { ConfirmCheckoutDto } from './dto/confirm-checkout.dto.js';
import { UpdateStripeIntegrationDto } from './dto/update-stripe-integration.dto.js';
import { StartStripeConnectDto } from './dto/start-stripe-connect.dto.js';
import { CompleteStripeOAuthDto } from './dto/complete-stripe-oauth.dto.js';
import { StripeIntegrationService } from './stripe-integration.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('billing')
export class BillingPlansController {
  constructor(private billingService: BillingService) {}

  /** Public plan list for marketing / billing page */
  @Get('plans')
  listPlans() {
    return this.billingService.listPlans();
  }
}

@Controller('businesses/:businessId/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private billingService: BillingService,
    private planEntitlements: PlanEntitlementsService,
    private businessService: BusinessService,
    private stripeIntegrationService: StripeIntegrationService,
  ) {}

  @Get('entitlements')
  async getEntitlements(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.planEntitlements.getEntitlements(businessId);
  }

  @Get('subscription')
  async getSubscription(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.billingService.getSubscription(businessId);
  }

  @Post('checkout')
  async checkout(
    @Param('businessId') businessId: string,
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: { id: string; email: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.billingService.createCheckoutSession(
      businessId,
      dto.planId,
      user.email,
      dto.billingInterval ?? 'month',
    );
  }

  @Post('confirm-checkout')
  async confirmCheckout(
    @Param('businessId') businessId: string,
    @Body() dto: ConfirmCheckoutDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.billingService.confirmCheckoutSession(
      businessId,
      dto.sessionId,
    );
  }

  @Post('portal')
  async portal(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.billingService.createPortalSession(businessId);
  }

  @Get('stripe-connect')
  async getStripeConnect(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.getPublicSettings(businessId);
  }

  @Get('stripe-connect/supported-countries')
  async listStripeConnectCountries(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return [];
  }

  @Put('stripe-connect')
  async updateStripeConnect(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateStripeIntegrationDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.updateSettings(businessId, dto);
  }

  @Post('stripe-connect/onboard')
  async startStripeConnectOnboarding(
    @Param('businessId') businessId: string,
    @Body() dto: StartStripeConnectDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.startConnect(businessId, dto);
  }

  @Post('stripe-connect/oauth')
  async completeStripeConnectOAuth(
    @Param('businessId') businessId: string,
    @Body() dto: CompleteStripeOAuthDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.completeConnectOAuth(
      businessId,
      dto.code,
    );
  }

  @Post('stripe-connect/sync')
  async syncStripeConnect(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.syncConnectAccount(businessId);
  }

  @Post('stripe-connect/login')
  async stripeConnectLogin(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.ensureMember(businessId, user.id);
    return this.stripeIntegrationService.createConnectLoginLink(businessId);
  }

  private async ensureMember(businessId: string, userId: string) {
    const businesses = await this.businessService.getUserBusinesses(userId);
    if (!businesses.some((b) => b.id === businessId)) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}

@Controller('billing')
export class BillingWebhookController {
  constructor(private billingService: BillingService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !signature) {
      return { received: false };
    }
    const event = this.billingService.constructWebhookEvent(rawBody, signature);
    await this.billingService.handleWebhookEvent(event);
    return { received: true };
  }
}
