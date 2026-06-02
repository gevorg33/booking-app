import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { GiftCardPurchaseService, type PurchaseGiftCardInput } from './gift-card-purchase.service.js';
import { GiftCardOrderService } from './gift-card-order.service.js';
import { OptionalPublicCustomerAuthGuard } from '../public-booking/optional-public-customer-auth.guard.js';
import { PublicCustomerAuthGuard } from '../public-booking/public-customer-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { PublicCustomerRequestUser } from '../public-booking/public-customer-auth.decorator.js';
import type { SubmitGiftCardModifyInput } from './gift-card-order.types.js';

@Controller('public/:slug/gift-cards')
export class GiftCardPublicController {
  constructor(
    private publicBookingService: PublicBookingService,
    private purchaseService: GiftCardPurchaseService,
    private bookingPaymentService: BookingPaymentService,
    private orderService: GiftCardOrderService,
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

  @Get('orders')
  @UseGuards(PublicCustomerAuthGuard)
  async listMyOrders(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    const orders = await this.orderService.listCustomerOrders(business.id, user.customerId);
    return { orders };
  }

  @Get('orders/:giftCardId')
  @UseGuards(PublicCustomerAuthGuard)
  async getMyOrder(
    @Param('slug') slug: string,
    @Param('giftCardId') giftCardId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    const order = await this.orderService.getCustomerOrder(
      business.id,
      user.customerId,
      giftCardId,
    );
    return { order };
  }

  @Post('orders/:giftCardId/cancel-request')
  @UseGuards(PublicCustomerAuthGuard)
  async cancelRequest(
    @Param('slug') slug: string,
    @Param('giftCardId') giftCardId: string,
    @Body() dto: { customerNotes?: string },
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    return this.orderService.submitCancelRequest(
      business.id,
      user.customerId,
      giftCardId,
      dto.customerNotes,
    );
  }

  @Post('orders/:giftCardId/modify-request')
  @UseGuards(PublicCustomerAuthGuard)
  async modifyRequest(
    @Param('slug') slug: string,
    @Param('giftCardId') giftCardId: string,
    @Body() dto: SubmitGiftCardModifyInput,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.publicBookingService.resolveBusiness(slug);
    return this.orderService.submitModifyRequest(
      business.id,
      user.customerId,
      giftCardId,
      dto,
    );
  }
}
