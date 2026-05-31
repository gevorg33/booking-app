import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ServiceSubscriptionsService } from './service-subscriptions.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/subscriptions')
@UseGuards(JwtAuthGuard)
export class ServiceSubscriptionsController {
  constructor(
    private subscriptionsService: ServiceSubscriptionsService,
    private businessService: BusinessService,
  ) {}

  @Get('plans')
  async listPlans(
    @Param('businessId') businessId: string,
    @Query('serviceId') serviceId: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const plans = await this.subscriptionsService.listPlans(businessId, serviceId);
    return Promise.all(
      plans.map(async (plan) => ({
        ...plan,
        preview: this.subscriptionsService.previewFromPlan(plan, Number(plan.service.price)),
      })),
    );
  }

  @Post('plans')
  async createPlan(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.createPlan(businessId, dto as any);
  }

  @Put('plans/:planId')
  async updatePlan(
    @Param('businessId') businessId: string,
    @Param('planId') planId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.updatePlan(businessId, planId, dto as any);
  }

  @Get('plans/:planId/preview')
  async previewPlan(
    @Param('businessId') businessId: string,
    @Param('planId') planId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.previewPlanPricing(businessId, planId);
  }

  @Post('assign')
  async assign(
    @Param('businessId') businessId: string,
    @Body() dto: { customerId: string; planId: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.assignSubscription(
      businessId,
      dto.customerId,
      dto.planId,
    );
  }

  @Get('customer/:customerId')
  async customerSubscriptions(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.listCustomerSubscriptions(businessId, customerId);
  }

  @Get(':subscriptionId/usage')
  async usageHistory(
    @Param('businessId') businessId: string,
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.subscriptionsService.getUsageHistory(businessId, subscriptionId);
  }
}
