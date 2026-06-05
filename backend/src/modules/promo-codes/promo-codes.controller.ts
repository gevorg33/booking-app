import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service.js';
import { PromoDiscountType } from './entities/promo-code.entity.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/promo-codes')
export class PromoCodesController {
  constructor(
    private promoCodesService: PromoCodesService,
    private businessService: BusinessService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.promoCodesService.list(businessId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('businessId') businessId: string,
    @Body()
    dto: {
      code: string;
      discountType: PromoDiscountType;
      discountValue: number;
      minOrderAmount?: number;
      maxUses?: number;
      expiresAt?: string;
      description?: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.promoCodesService.create(businessId, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivate(
    @Param('businessId') businessId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.promoCodesService.deactivate(businessId, id);
  }
}
