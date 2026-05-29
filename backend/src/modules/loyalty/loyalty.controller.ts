import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';
import { UpdateLoyaltySettingsDto } from './dto/update-loyalty-settings.dto.js';
import { getLoyaltySettingsResponse } from './loyalty-settings.util.js';

@Controller('businesses/:businessId/loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(
    private loyaltyService: LoyaltyService,
    private businessService: BusinessService,
  ) {}

  @Get('settings')
  async getSettings(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessService.findOne(businessId);
    return getLoyaltySettingsResponse(business.settings);
  }

  @Patch('settings')
  async updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateLoyaltySettingsDto,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    const business = await this.businessService.findOne(businessId);
    business.settings = {
      ...(business.settings || {}),
      loyalty: {
        ...((business.settings?.loyalty as Record<string, unknown>) || {}),
        earnPercentCashback: dto.earnPercentCashback,
      },
    };
    await this.businessService.update(businessId, { settings: business.settings });
    return getLoyaltySettingsResponse(business.settings);
  }

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
