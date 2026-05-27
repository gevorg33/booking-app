import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PublicBookingService } from './public-booking.service.js';
import { PublicBookingAssistantService } from './public-booking-assistant.service.js';
import { CreatePublicBookingDto, ConfirmBookingPaymentDto, GetProviderSlotsQueryDto } from './dto/public-booking.dto.js';
import { BookingPaymentService } from '../booking/booking-payment.service.js';
import { PublicAssistantDto } from './dto/public-assistant.dto.js';
import { ReviewsService } from '../reviews/reviews.service.js';
import { SubmitPublicReviewDto } from '../reviews/dto/submit-public-review.dto.js';

@Controller('public/:slug')
export class PublicBookingController {
  constructor(
    private publicBookingService: PublicBookingService,
    private publicAssistantService: PublicBookingAssistantService,
    private bookingPaymentService: BookingPaymentService,
    private reviewsService: ReviewsService,
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

  @Post('bookings')
  createBooking(@Param('slug') slug: string, @Body() dto: CreatePublicBookingDto) {
    return this.publicBookingService.createBooking(slug, dto);
  }

  @Post('bookings/checkout')
  createBookingCheckout(@Param('slug') slug: string, @Body() dto: CreatePublicBookingDto) {
    return this.bookingPaymentService.createCheckoutSession(slug, dto);
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
}
