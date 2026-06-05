import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(
    private membershipsService: MembershipsService,
    private businessService: BusinessService,
  ) {}

  @Get('plans')
  async listPlans(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.membershipsService.listPlans(businessId);
  }

  @Post('plans')
  async createPlan(
    @Param('businessId') businessId: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.membershipsService.createPlan(businessId, dto);
  }

  @Post('assign')
  async assign(
    @Param('businessId') businessId: string,
    @Body() dto: { customerId: string; planId: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.membershipsService.assignPlan(
      businessId,
      dto.customerId,
      dto.planId,
    );
  }

  @Get('customer/:customerId')
  async customerMembership(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.membershipsService.getCustomerMembership(
      businessId,
      customerId,
    );
  }
}
