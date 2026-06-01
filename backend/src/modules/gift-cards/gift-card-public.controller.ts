import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { GiftCardPurchaseService, type PurchaseGiftCardInput } from './gift-card-purchase.service.js';
import { OptionalPublicCustomerAuthGuard } from '../public-booking/optional-public-customer-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { PublicCustomerRequestUser } from '../public-booking/public-customer-auth.decorator.js';

@Controller('public/:slug/gift-cards')
export class GiftCardPublicController {
  constructor(
    private publicBookingService: PublicBookingService,
    private purchaseService: GiftCardPurchaseService,
    private bookingPaymentService: BookingPaymentService,
  ) {}

  @Get('catalog')
  async getCatalog(@Param('slug') slug: string) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    return this.purchaseService.getPublicCatalog(business.id);
  }

  @Post('quote')
  async quote(@Param('slug') slug: string, @Body() dto: PurchaseGiftCardInput) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    return this.purchaseService.quotePurchase(business.id, dto);
  }

  @Post('checkout')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  async checkout(
    @Param('slug') slug: string,
    @Body() dto: PurchaseGiftCardInput,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.bookingPaymentService.createGiftCardCheckoutSession(
      slug,
      dto,
      user?.customerId,
    );
  }
}
