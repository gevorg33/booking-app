import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BusinessService } from '../business/business.service.js';

@Controller('businesses/:businessId/gift-cards')
export class GiftCardsController {
  constructor(
    private giftCardsService: GiftCardsService,
    private businessService: BusinessService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Param('businessId') businessId: string, @CurrentUser() user: { id: string }) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.giftCardsService.list(businessId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: { amount: number; currency?: string; expiresAt?: string },
    @CurrentUser() user: { id: string },
  ) {
    await this.businessService.ensureMember(businessId, user.id);
    return this.giftCardsService.create(businessId, dto);
  }

  @Post('validate')
  async validate(
    @Param('businessId') businessId: string,
    @Body() dto: { code: string },
  ) {
    const card = await this.giftCardsService.validate(businessId, dto.code);
    return { code: card.code, balance: card.balance, currency: card.currency };
  }

  @Post('redeem')
  async redeem(
    @Param('businessId') businessId: string,
    @Body() dto: { code: string; amount: number },
  ) {
    const card = await this.giftCardsService.redeem(businessId, dto.code, dto.amount);
    return { code: card.code, balance: card.balance };
  }
}
