import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import { CreatePublicBookingDto, ConfirmBookingPaymentDto, GetProviderSlotsQueryDto, GetServiceSlotsQueryDto, GetServiceSlotProvidersQueryDto, PublicBookingQuoteDto, BookPublicPackageDto, PublicPackageQuoteDto, PackageBlockSlotsQueryDto, PackageBlockProvidersQueryDto, MultiServiceSelectionDto, MultiServiceBlockSlotsQueryDto, MultiServiceBlockProvidersQueryDto, BookPublicMultiServiceDto, PublicMultiServiceQuoteDto, parseServiceIdsQuery } from './dto/public-booking.dto.js';
import { PublicCustomerGoogleLoginDto } from './dto/public-customer-google-login.dto.js';
import { PublicCustomerRescheduleBookingDto } from './dto/public-customer-booking.dto.js';
import {
  PublicBookingManagePackageCancelDto,
  PublicBookingManagePackageRescheduleDto,
  PublicCustomerReschedulePackageVisitDto,
} from './dto/public-customer-package-visit.dto.js';
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
import { normalizeMultiServiceIds } from '../../common/utils/multi-service-booking.util.js';

@Controller('public/:slug')
export class PublicBookingController {
  constructor(
    private publicBookingService: PublicBookingService,
    private publicAssistantService: PublicBookingAssistantService,
    private bookingPaymentService: BookingPaymentService,
    private reviewsService: ReviewsService,
    private publicCustomerAuthService: PublicCustomerAuthService,
    private publicCustomerBookingService: PublicCustomerBookingService,
    private customerPrivacyService: CustomerPrivacyService,
  ) {}

  @Get()
  getProfile(@Param('slug') slug: string) {
    return this.publicBookingService.getProfile(slug);
  }

  @Get('providers')
  getProviders(
    @Param('slug') slug: string,
    @Query('date') date?: string,
    @Query('locale') locale?: string,
  ) {
    return this.publicBookingService.getProviders(slug, date, locale);
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
  getServices(
    @Param('slug') slug: string,
    @Query('employeeId') employeeId?: string,
    @Query('locale') locale?: string,
  ) {
    return this.publicBookingService.getServices(slug, employeeId, locale);
  }

  @Get('services/for-slot')
  getServicesForSlot(
    @Param('slug') slug: string,
    @Query('employeeId') employeeId: string,
    @Query('startTime') startTime: string,
    @Query('locale') locale?: string,
  ) {
    return this.publicBookingService.getServicesForSlot(slug, employeeId, startTime, locale);
  }

  @Get('services/:serviceId/subscription-plans')
  getServiceSubscriptionPlans(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicBookingService.getServiceSubscriptionPlans(slug, serviceId);
  }

  @Get('packages')
  getPackages(@Param('slug') slug: string) {
    return this.publicBookingService.getPublicPackages(slug);
  }

  @Get('packages/:packageId')
  getPackage(@Param('slug') slug: string, @Param('packageId') packageId: string) {
    return this.publicBookingService.getPublicPackage(slug, packageId);
  }

  @Get('packages/:packageId/suggest-slots')
  suggestPackageSlots(
    @Param('slug') slug: string,
    @Param('packageId') packageId: string,
  ) {
    return this.publicBookingService.suggestPackageLineSlots(slug, packageId);
  }

  @Get('packages/:packageId/suggest-block')
  suggestPackageBlock(
    @Param('slug') slug: string,
    @Param('packageId') packageId: string,
  ) {
    return this.publicBookingService.suggestPackageBlock(slug, packageId);
  }

  @Get('packages/:packageId/block-slots')
  getPackageBlockSlots(
    @Param('slug') slug: string,
    @Param('packageId') packageId: string,
    @Query() query: PackageBlockSlotsQueryDto,
  ) {
    return this.publicBookingService.getPackageBlockDaySlots(slug, packageId, query.date);
  }

  @Get('packages/:packageId/providers')
  getPackageBlockProviders(
    @Param('slug') slug: string,
    @Param('packageId') packageId: string,
    @Query() query: PackageBlockProvidersQueryDto,
  ) {
    return this.publicBookingService.getPackageBlockProviders(
      slug,
      packageId,
      query.startTime,
      query.includeLaterDays,
    );
  }

  @Post('packages/quote')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  quotePackage(
    @Param('slug') slug: string,
    @Body() dto: PublicPackageQuoteDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.quotePackageCheckout(slug, dto, user?.customerId);
  }

  @Post('packages/book')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  bookPackage(
    @Param('slug') slug: string,
    @Body() dto: BookPublicPackageDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.bookPackage(slug, dto, user?.customerId);
  }

  @Post('packages/checkout')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  createPackageCheckout(
    @Param('slug') slug: string,
    @Body() dto: BookPublicPackageDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.bookingPaymentService.createPackageCheckoutSession(slug, dto, user?.customerId);
  }

  @Get('multi-service/settings')
  getMultiServiceSettings(@Param('slug') slug: string) {
    return this.publicBookingService.getMultiServiceSettings(slug);
  }

  @Post('multi-service/preview')
  previewMultiService(@Param('slug') slug: string, @Body() dto: MultiServiceSelectionDto) {
    return this.publicBookingService.previewMultiServiceSelection(slug, dto.serviceIds);
  }

  @Get('multi-service/block-slots')
  getMultiServiceBlockSlots(
    @Param('slug') slug: string,
    @Query() query: MultiServiceBlockSlotsQueryDto,
  ) {
    return this.publicBookingService.getMultiServiceBlockDaySlots(
      slug,
      query.serviceIds,
      query.date,
    );
  }

  @Get('multi-service/suggest-block')
  suggestMultiServiceBlock(
    @Param('slug') slug: string,
    @Query('serviceIds') serviceIdsRaw?: string | string[],
  ) {
    const serviceIds = normalizeMultiServiceIds(
      parseServiceIdsQuery(Array.isArray(serviceIdsRaw) ? serviceIdsRaw : serviceIdsRaw),
    );
    return this.publicBookingService.suggestMultiServiceBlock(slug, serviceIds);
  }

  @Get('multi-service/suggest-lines')
  suggestMultiServiceLines(
    @Param('slug') slug: string,
    @Query('serviceIds') serviceIdsRaw?: string | string[],
  ) {
    const serviceIds = normalizeMultiServiceIds(
      parseServiceIdsQuery(Array.isArray(serviceIdsRaw) ? serviceIdsRaw : serviceIdsRaw),
    );
    return this.publicBookingService.suggestMultiServicePerServiceLines(slug, serviceIds);
  }

  @Get('multi-service/providers')
  getMultiServiceProviders(
    @Param('slug') slug: string,
    @Query() query: MultiServiceBlockProvidersQueryDto,
  ) {
    return this.publicBookingService.getMultiServiceBlockProviders(
      slug,
      query.serviceIds,
      query.startTime,
      query.includeLaterDays === true,
    );
  }

  @Post('multi-service/quote')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  quoteMultiService(
    @Param('slug') slug: string,
    @Body() dto: PublicMultiServiceQuoteDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.quoteMultiServiceCheckout(slug, dto, user?.customerId);
  }

  @Post('multi-service/book')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  bookMultiService(
    @Param('slug') slug: string,
    @Body() dto: BookPublicMultiServiceDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.bookMultiService(slug, dto, user?.customerId);
  }

  @Post('multi-service/checkout')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  createMultiServiceCheckout(
    @Param('slug') slug: string,
    @Body() dto: BookPublicMultiServiceDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.bookingPaymentService.createMultiServiceCheckoutSession(
      slug,
      dto,
      user?.customerId,
    );
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

  @Post('me/bookings/:bookingId/cancel')
  @UseGuards(PublicCustomerAuthGuard)
  cancelMyBooking(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerBookingService.cancelBooking(slug, user.customerId, bookingId);
  }

  @Post('me/bookings/:bookingId/reschedule')
  @UseGuards(PublicCustomerAuthGuard)
  rescheduleMyBooking(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: PublicCustomerRescheduleBookingDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerBookingService.rescheduleBooking(
      slug,
      user.customerId,
      bookingId,
      dto,
    );
  }

  @Post('me/bookings/:bookingId/package/cancel')
  @UseGuards(PublicCustomerAuthGuard)
  cancelMyPackageVisit(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerBookingService.cancelPackageVisit(slug, user.customerId, bookingId);
  }

  @Post('me/bookings/:bookingId/package/reschedule')
  @UseGuards(PublicCustomerAuthGuard)
  rescheduleMyPackageVisit(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: PublicCustomerReschedulePackageVisitDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerBookingService.reschedulePackageVisit(
      slug,
      user.customerId,
      bookingId,
      dto,
    );
  }

  @Get('bookings/manage')
  getBookingManageContext(
    @Param('slug') slug: string,
    @Query('bookingId') bookingId: string,
    @Query('token') token: string,
  ) {
    return this.publicCustomerBookingService.getManageContext(slug, bookingId, token);
  }

  @Post('bookings/manage/cancel')
  cancelBookingWithManageToken(
    @Param('slug') slug: string,
    @Body() dto: { bookingId: string; token: string },
  ) {
    return this.publicCustomerBookingService.cancelBookingWithToken(
      slug,
      dto.bookingId,
      dto.token,
    );
  }

  @Post('bookings/manage/reschedule')
  rescheduleBookingWithManageToken(
    @Param('slug') slug: string,
    @Body() dto: { bookingId: string; token: string; startTime: string; employeeId?: string },
  ) {
    return this.publicCustomerBookingService.rescheduleBookingWithToken(
      slug,
      dto.bookingId,
      dto.token,
      { startTime: dto.startTime, employeeId: dto.employeeId },
    );
  }

  @Post('bookings/manage/package/cancel')
  cancelPackageVisitWithManageToken(
    @Param('slug') slug: string,
    @Body() dto: PublicBookingManagePackageCancelDto,
  ) {
    return this.publicCustomerBookingService.cancelPackageVisitWithToken(
      slug,
      dto.bookingId,
      dto.token,
    );
  }

  @Post('bookings/manage/package/reschedule')
  reschedulePackageVisitWithManageToken(
    @Param('slug') slug: string,
    @Body() dto: PublicBookingManagePackageRescheduleDto,
  ) {
    return this.publicCustomerBookingService.reschedulePackageVisitWithToken(
      slug,
      dto.bookingId,
      dto.token,
      { lines: dto.lines },
    );
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
