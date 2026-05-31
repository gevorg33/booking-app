import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { CreatePublicBookingDto, ConfirmBookingPaymentDto, GetProviderSlotsQueryDto, GetServiceSlotsQueryDto, GetServiceSlotProvidersQueryDto, PublicBookingQuoteDto } from './dto/public-booking.dto.js';
import { PublicCustomerGoogleLoginDto } from './dto/public-customer-google-login.dto.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { PublicAssistantDto } from './dto/public-assistant.dto.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { SubmitPublicReviewDto } from '../reviews/dto/submit-public-review.dto.js';
import { SubmitProviderPortalReviewDto } from '../reviews/dto/submit-provider-portal-review.dto.js';
import { PublicCustomerAuthGuard } from './public-customer-auth.guard.js';
import { OptionalPublicCustomerAuthGuard } from './optional-public-customer-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { PublicCustomerRequestUser } from './public-customer-auth.decorator.js';
import { CustomerPrivacyService } from '../customer/customer-privacy.service.js';

@Controller('public/:slug')
export class PublicBookingController {
  constructor(
    private publicBookingService: PublicBookingService,
    private publicAssistantService: PublicBookingAssistantService,
    private bookingPaymentService: BookingPaymentService,
    private reviewsService: ReviewsService,
    private publicCustomerAuthService: PublicCustomerAuthService,
    private customerPrivacyService: CustomerPrivacyService,
  ) {}

  @Get()
  getProfile(@Param('slug') slug: string) {
    return this.publicBookingService.getProfile(slug);
  }

  @Get('providers')
  getProviders(@Param('slug') slug: string, @Query('date') date?: string) {
    return this.publicBookingService.getProviders(slug, date);
  }

  @Get('providers/:employeeId/slots')
  getProviderSlots(
    @Param('slug') slug: string,
    @Param('employeeId') employeeId: string,
    @Query() query: GetProviderSlotsQueryDto,
  ) {
    return this.publicBookingService.getProviderSlots(slug, employeeId, query.date);
  }

  @Get('providers/:employeeId/reviews')
  listProviderReviews(
    @Param('slug') slug: string,
    @Param('employeeId') employeeId: string,
    @Query('page') page?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    return this.reviewsService.listPublicProviderReviews(slug, employeeId, pageNum);
  }

  @Get('services')
  getServices(@Param('slug') slug: string, @Query('employeeId') employeeId?: string) {
    return this.publicBookingService.getServices(slug, employeeId);
  }

  @Get('services/for-slot')
  getServicesForSlot(
    @Param('slug') slug: string,
    @Query('employeeId') employeeId: string,
    @Query('startTime') startTime: string,
  ) {
    return this.publicBookingService.getServicesForSlot(slug, employeeId, startTime);
  }

  @Get('services/:serviceId/subscription-plans')
  getServiceSubscriptionPlans(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicBookingService.getServiceSubscriptionPlans(slug, serviceId);
  }

  @Get('services/:serviceId/slots')
  getServiceDaySlots(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
    @Query() query: GetServiceSlotsQueryDto,
  ) {
    return this.publicBookingService.getServiceDaySlots(slug, serviceId, query.date);
  }

  @Get('services/:serviceId/providers')
  getProvidersForServiceSlot(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
    @Query() query: GetServiceSlotProvidersQueryDto,
  ) {
    return this.publicBookingService.getProvidersForServiceSlot(slug, serviceId, query.startTime);
  }

  @Post('bookings/quote')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  quoteBooking(
    @Param('slug') slug: string,
    @Body() dto: PublicBookingQuoteDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.quoteCheckout(slug, dto, user?.customerId);
  }

  @Post('bookings')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicBookingDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.createBooking(slug, dto, user?.customerId);
  }

  @Post('bookings/checkout')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  createBookingCheckout(
    @Param('slug') slug: string,
    @Body() dto: CreatePublicBookingDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.bookingPaymentService.createCheckoutSession(slug, dto, user?.customerId);
  }

  @Post('bookings/confirm-payment')
  confirmBookingPayment(@Param('slug') slug: string, @Body() dto: ConfirmBookingPaymentDto) {
    return this.bookingPaymentService.confirmCheckoutSession(slug, dto.sessionId);
  }

  @Post('assistant')
  assistant(@Param('slug') slug: string, @Body() dto: PublicAssistantDto) {
    return this.publicAssistantService.chat(slug, dto.prompt, {
      history: dto.history,
      context: dto.context,
      locale: dto.locale,
    });
  }

  @Get('reviews/context')
  getReviewContext(
    @Param('slug') slug: string,
    @Query('bookingId') bookingId: string,
    @Query('token') token: string,
  ) {
    return this.reviewsService.getPublicContext(slug, bookingId, token);
  }

  @Post('reviews')
  submitReview(@Param('slug') slug: string, @Body() dto: SubmitPublicReviewDto) {
    return this.reviewsService.submitPublic(slug, dto);
  }

  @Post('providers/:employeeId/reviews')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  submitProviderPortalReview(
    @Param('slug') slug: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: SubmitProviderPortalReviewDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.reviewsService.submitProviderPortalReview(
      slug,
      employeeId,
      dto,
      user?.customerId,
    );
  }

  @Post('auth/google')
  loginWithGoogle(@Param('slug') slug: string, @Body() dto: PublicCustomerGoogleLoginDto) {
    return this.publicCustomerAuthService.loginWithGoogle(slug, dto.idToken);
  }

  @Get('auth/me')
  @UseGuards(PublicCustomerAuthGuard)
  getAuthMe(@CurrentUser() user: PublicCustomerRequestUser) {
    return this.publicCustomerAuthService.getProfile(user.customer);
  }

  @Get('me/bookings')
  @UseGuards(PublicCustomerAuthGuard)
  listMyBookings(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerAuthService.listBookings(slug, user.customerId);
  }

  @Get('me/loyalty')
  @UseGuards(PublicCustomerAuthGuard)
  getMyLoyalty(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerLoyalty(slug, user.customerId);
  }

  @Get('me/subscriptions')
  @UseGuards(PublicCustomerAuthGuard)
  listMySubscriptions(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerSubscriptions(slug, user.customerId);
  }

  @Get('me/subscriptions/active')
  @UseGuards(PublicCustomerAuthGuard)
  getMyActiveSubscription(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getActiveCustomerSubscriptionForService(
      slug,
      user.customerId,
      serviceId,
    );
  }

  @Get('me/subscriptions/:subscriptionId/usage')
  @UseGuards(PublicCustomerAuthGuard)
  getMySubscriptionUsage(
    @Param('slug') slug: string,
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerSubscriptionUsage(
      slug,
      user.customerId,
      subscriptionId,
    );
  }

  @Get('me/data')
  @UseGuards(PublicCustomerAuthGuard)
  exportMyData(@CurrentUser() user: PublicCustomerRequestUser) {
    return this.customerPrivacyService.exportCustomerData(user.businessId, user.customerId);
  }

  @Delete('me/data')
  @UseGuards(PublicCustomerAuthGuard)
  deleteMyData(@CurrentUser() user: PublicCustomerRequestUser) {
    return this.customerPrivacyService.deleteCustomerData(user.businessId, user.customerId);
  }
}
