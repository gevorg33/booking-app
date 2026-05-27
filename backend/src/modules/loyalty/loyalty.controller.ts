import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(
    private loyaltyService: LoyaltyService,
    private businessService: BusinessService,
  ) {}

  @Get('customer/:customerId')
  async balance(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.loyaltyService.getBalance(businessId, customerId);
  }

  @Post('customer/:customerId/adjust')
  async adjust(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: { points: number; note?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.loyaltyService.adjust(businessId, customerId, dto.points, dto.note);
  }

  @Post('customer/:customerId/redeem')
  async redeem(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: { points: number; bookingId?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.loyaltyService.redeem(businessId, customerId, dto.points, dto.bookingId);
  }
}
