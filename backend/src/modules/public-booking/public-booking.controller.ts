import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PublicBookingService } from './public-booking.service.js';
import { BusinessService } from '../business/business.service.js';
import { AiGatewayService } from '../ai/ai-gateway.service.js';
import { AiCommandTraceService } from '../ai/ai-command-trace.service.js';
import { AiCommandTraceFeedbackDto } from '../ai/dto/ai-command-trace-feedback.dto.js';
import { commandResultToPublicAssistantResult } from '../ai/customer-ai-command.util.js';
import { PublicCustomerAuthService } from './public-customer-auth.service.js';
import { PublicCustomerBookingService } from './public-customer-booking.service.js';
import {
  CreatePublicBookingDto,
  ConfirmBookingPaymentDto,
  GetProviderSlotsQueryDto,
  GetServiceSlotsQueryDto,
  GetServiceSlotProvidersQueryDto,
  PublicBookingQuoteDto,
  BookPublicPackageDto,
  PublicPackageQuoteDto,
  PackageBlockSlotsQueryDto,
  PackageBlockProvidersQueryDto,
  MultiServiceSelectionDto,
  MultiServiceBlockSlotsQueryDto,
  MultiServiceBlockProvidersQueryDto,
  BookPublicMultiServiceDto,
  PublicMultiServiceQuoteDto,
  RecordProductRecommendationEventDto,
  parseServiceIdsQuery,
} from './dto/public-booking.dto.js';
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
import { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import { ClinicTestOrderBookingRequestService } from '../clinic-test-results/order/clinic-test-order-booking-request.service.js';
import { PatientDocumentsService } from '../patient-clinical-profiles/patient-documents.service.js';
import { PublicPreVisitIntakeService } from './public-pre-visit-intake.service.js';
import {
  PublicPreVisitIntakeDraftDto,
  PublicPreVisitIntakeQueryDto,
} from './dto/public-pre-visit-intake.dto.js';
import { SubmitClinicPreVisitIntakeAnswersDto } from '../clinic-pre-visit-intakes/dto/clinic-pre-visit-intake.dto.js';
import { PatientClinicalAlertsService } from '../patient-clinical-profiles/patient-clinical-alerts.service.js';
import type { ClinicPatientAlertType } from '../../common/utils/clinic-patient-alert.types.js';
import { ConsumerPushTokenService } from '../notifications/consumer-push-token.service.js';
import { RegisterConsumerNativePushDto } from '../notifications/dto/register-consumer-native-push.dto.js';
import { AckConsumerPushDeliveryDto } from '../notifications/dto/ack-consumer-push-delivery.dto.js';
import { PublicConsumerSupportService } from './public-consumer-support.service.js';
import { PublicConsumerSupportTicketDto } from './dto/public-consumer-support-ticket.dto.js';
import { UpdatePublicConsumerNotificationPreferencesDto } from './dto/public-consumer-notification-preferences.dto.js';
import { ClaimReferralCodeDto } from './dto/claim-referral.dto.js';
import { SubmitCustomerReviewDto } from './dto/submit-customer-review.dto.js';

@Controller('public/:slug')
export class PublicBookingController {
  constructor(
    private publicBookingService: PublicBookingService,
    private businessService: BusinessService,
    private aiGateway: AiGatewayService,
    private commandTrace: AiCommandTraceService,
    private bookingPaymentService: BookingPaymentService,
    private reviewsService: ReviewsService,
    private publicCustomerAuthService: PublicCustomerAuthService,
    private publicCustomerBookingService: PublicCustomerBookingService,
    private customerPrivacyService: CustomerPrivacyService,
    private clinicTestResultsService: ClinicTestResultsService,
    private clinicTestOrderBookingRequestService: ClinicTestOrderBookingRequestService,
    private patientDocumentsService: PatientDocumentsService,
    private publicPreVisitIntakeService: PublicPreVisitIntakeService,
    private patientClinicalAlertsService: PatientClinicalAlertsService,
    private consumerPushTokenService: ConsumerPushTokenService,
    private publicConsumerSupportService: PublicConsumerSupportService,
  ) {}

  @Get()
  getProfile(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.publicBookingService.getProfile(slug, locale);
  }

  @Get('checkout/recommendations')
  getCheckoutRecommendations(
    @Param('slug') slug: string,
    @Query('serviceId') serviceId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.publicBookingService.getCheckoutRecommendations(
      slug,
      serviceId,
      categoryId,
    );
  }

  @Post('checkout/recommendations/events')
  recordCheckoutRecommendationEvent(
    @Param('slug') slug: string,
    @Body() dto: RecordProductRecommendationEventDto,
  ) {
    return this.publicBookingService.recordCheckoutRecommendationEvent(
      slug,
      dto,
    );
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
    return this.publicBookingService.getProviderSlots(
      slug,
      employeeId,
      query.date,
    );
  }

  @Get('providers/:employeeId/reviews')
  listProviderReviews(
    @Param('slug') slug: string,
    @Param('employeeId') employeeId: string,
    @Query('page') page?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page ?? '1', 10) || 1);
    return this.reviewsService.listPublicProviderReviews(
      slug,
      employeeId,
      pageNum,
    );
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
    return this.publicBookingService.getServicesForSlot(
      slug,
      employeeId,
      startTime,
      locale,
    );
  }

  @Get('services/:serviceId/subscription-plans')
  getServiceSubscriptionPlans(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicBookingService.getServiceSubscriptionPlans(
      slug,
      serviceId,
    );
  }

  @Get('packages')
  getPackages(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.publicBookingService.getPublicPackages(slug, locale);
  }

  @Get('packages/:packageId')
  getPackage(
    @Param('slug') slug: string,
    @Param('packageId') packageId: string,
    @Query('locale') locale?: string,
  ) {
    return this.publicBookingService.getPublicPackage(slug, packageId, locale);
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
    return this.publicBookingService.getPackageBlockDaySlots(
      slug,
      packageId,
      query.date,
    );
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
    return this.publicBookingService.quotePackageCheckout(
      slug,
      dto,
      user?.customerId,
    );
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
    return this.bookingPaymentService.createPackageCheckoutSession(
      slug,
      dto,
      user?.customerId,
    );
  }

  @Get('multi-service/settings')
  getMultiServiceSettings(@Param('slug') slug: string) {
    return this.publicBookingService.getMultiServiceSettings(slug);
  }

  @Post('multi-service/preview')
  previewMultiService(
    @Param('slug') slug: string,
    @Body() dto: MultiServiceSelectionDto,
  ) {
    return this.publicBookingService.previewMultiServiceSelection(
      slug,
      dto.serviceIds,
    );
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
      parseServiceIdsQuery(
        Array.isArray(serviceIdsRaw) ? serviceIdsRaw : serviceIdsRaw,
      ),
    );
    return this.publicBookingService.suggestMultiServiceBlock(slug, serviceIds);
  }

  @Get('multi-service/suggest-lines')
  suggestMultiServiceLines(
    @Param('slug') slug: string,
    @Query('serviceIds') serviceIdsRaw?: string | string[],
  ) {
    const serviceIds = normalizeMultiServiceIds(
      parseServiceIdsQuery(
        Array.isArray(serviceIdsRaw) ? serviceIdsRaw : serviceIdsRaw,
      ),
    );
    return this.publicBookingService.suggestMultiServicePerServiceLines(
      slug,
      serviceIds,
    );
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
    return this.publicBookingService.quoteMultiServiceCheckout(
      slug,
      dto,
      user?.customerId,
    );
  }

  @Post('multi-service/book')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  bookMultiService(
    @Param('slug') slug: string,
    @Body() dto: BookPublicMultiServiceDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.bookMultiService(
      slug,
      dto,
      user?.customerId,
    );
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
    return this.publicBookingService.getServiceDaySlots(
      slug,
      serviceId,
      query.date,
    );
  }

  @Get('services/:serviceId/nearest-slot')
  getNearestServiceSlot(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.publicBookingService.findNearestBookableSlot(slug, {
      serviceId,
      employeeId: employeeId ?? null,
    });
  }

  @Get('services/:serviceId/providers')
  getProvidersForServiceSlot(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
    @Query() query: GetServiceSlotProvidersQueryDto,
  ) {
    return this.publicBookingService.getProvidersForServiceSlot(
      slug,
      serviceId,
      query.startTime,
    );
  }

  @Get('checkout/pre-visit-intake/config')
  getPreVisitIntakeConfig(
    @Param('slug') slug: string,
    @Query() query: PublicPreVisitIntakeQueryDto,
  ) {
    return this.publicPreVisitIntakeService.getCheckoutConfig(
      slug,
      query.serviceId,
    );
  }

  @Post('me/pre-visit-intake/draft')
  @UseGuards(PublicCustomerAuthGuard)
  createPreVisitIntakeDraft(
    @Param('slug') slug: string,
    @Body() dto: PublicPreVisitIntakeDraftDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicPreVisitIntakeService.ensureCustomerDraft(
      slug,
      user.customerId,
      dto,
    );
  }

  @Get('me/pre-visit-intake/:intakeId')
  @UseGuards(PublicCustomerAuthGuard)
  getPreVisitIntakeFlow(
    @Param('slug') slug: string,
    @Param('intakeId') intakeId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicPreVisitIntakeService.getCustomerFlow(
      slug,
      user.customerId,
      intakeId,
    );
  }

  @Post('me/pre-visit-intake/:intakeId/start')
  @UseGuards(PublicCustomerAuthGuard)
  startPreVisitIntake(
    @Param('slug') slug: string,
    @Param('intakeId') intakeId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicPreVisitIntakeService.startCustomerIntake(
      slug,
      user.customerId,
      intakeId,
    );
  }

  @Post('me/pre-visit-intake/:intakeId/answers')
  @UseGuards(PublicCustomerAuthGuard)
  submitPreVisitIntakeAnswers(
    @Param('slug') slug: string,
    @Param('intakeId') intakeId: string,
    @Body() dto: SubmitClinicPreVisitIntakeAnswersDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicPreVisitIntakeService.submitCustomerAnswers(
      slug,
      user.customerId,
      intakeId,
      dto,
    );
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
    return this.bookingPaymentService.createCheckoutSession(
      slug,
      dto,
      user?.customerId,
    );
  }

  @Post('bookings/confirm-payment')
  confirmBookingPayment(
    @Param('slug') slug: string,
    @Body() dto: ConfirmBookingPaymentDto,
  ) {
    return this.bookingPaymentService.confirmCheckoutSession(
      slug,
      dto.sessionId,
    );
  }

  @Get('assistant/capabilities')
  assistantCapabilities(@Param('slug') slug: string) {
    return this.businessService
      .findBySlug(slug)
      .then((business) =>
        this.aiGateway.getCapabilities(business.id, 'customer', 'client'),
      );
  }

  @Post('assistant')
  @UseGuards(OptionalPublicCustomerAuthGuard)
  async assistant(
    @Param('slug') slug: string,
    @Body() dto: PublicAssistantDto,
    @CurrentUser() user?: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    const result = await this.aiGateway.execute({
      surface: 'customer',
      businessId: business.id,
      prompt: dto.prompt,
      userId: user?.customerId,
      membershipRole: 'client',
      history: dto.history,
      context: {
        slug,
        locale: dto.locale,
        customerId: user?.customerId,
        userEmail: user?.email ?? undefined,
        ...dto.context,
      },
    });
    return commandResultToPublicAssistantResult(
      result as import('../ai/command-completion.types.js').CommandResult,
    );
  }

  @Post('assistant/trace/:traceId/feedback')
  async recordAssistantTraceFeedback(
    @Param('slug') slug: string,
    @Param('traceId') traceId: string,
    @Body() dto: AiCommandTraceFeedbackDto,
  ) {
    const business = await this.businessService.findBySlug(slug);
    await this.commandTrace.recordFeedback(traceId, business.id, dto);
    return { ok: true };
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
  submitReview(
    @Param('slug') slug: string,
    @Body() dto: SubmitPublicReviewDto,
  ) {
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
  loginWithGoogle(
    @Param('slug') slug: string,
    @Body() dto: PublicCustomerGoogleLoginDto,
  ) {
    return this.publicCustomerAuthService.loginWithGoogle(
      slug,
      dto.idToken,
      dto.analyticsAnonId,
    );
  }

  @Post('auth/apple')
  loginWithApple(
    @Param('slug') slug: string,
    @Body() dto: PublicCustomerGoogleLoginDto,
  ) {
    return this.publicCustomerAuthService.loginWithApple(
      slug,
      dto.idToken,
      dto.analyticsAnonId,
    );
  }

  @Post('auth/phone')
  loginWithPhone(
    @Param('slug') slug: string,
    @Body() dto: PublicCustomerGoogleLoginDto,
  ) {
    return this.publicCustomerAuthService.loginWithPhone(
      slug,
      dto.idToken,
      dto.analyticsAnonId,
    );
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

  @Get('me/clinic-lab-booking-requests')
  @UseGuards(PublicCustomerAuthGuard)
  async listMyClinicLabBookingRequests(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    const data =
      await this.clinicTestOrderBookingRequestService.listPendingBookingRequestsForCustomer(
        business.id,
        user.customerId,
      );
    return { data };
  }

  @Get('me/clinic-test-results')
  @UseGuards(PublicCustomerAuthGuard)
  async listMyReleasedClinicResults(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    const data =
      await this.clinicTestResultsService.listReleasedResultsForCustomer(
        business.id,
        user.customerId,
      );
    return { data };
  }

  @Get('me/clinic-documents')
  @UseGuards(PublicCustomerAuthGuard)
  async listMyReleasedClinicDocuments(
    @Param('slug') slug: string,
    @Query('category') category: string | undefined,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    const data =
      await this.patientDocumentsService.listReleasedDocumentsForCustomerAccount(
        business.id,
        user.customerId,
        user.customerId,
        category,
      );
    return { data };
  }

  @Get('me/clinic-patient-alerts')
  @UseGuards(PublicCustomerAuthGuard)
  async listMyClinicPatientAlerts(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    return {
      data: await this.patientClinicalAlertsService.listAlertsForCustomerAccount(
        business.id,
        user.customerId,
      ),
    };
  }

  @Post('me/clinic-patient-alerts/:alertType/:sourceId/dismiss')
  @UseGuards(PublicCustomerAuthGuard)
  async dismissMyClinicPatientAlert(
    @Param('slug') slug: string,
    @Param('alertType') alertType: ClinicPatientAlertType,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    return {
      data: await this.patientClinicalAlertsService.dismissAlertForCustomerAccount(
        business.id,
        user.customerId,
        alertType,
        sourceId,
      ),
    };
  }

  @Get('me/clinic-documents/:documentId')
  @UseGuards(PublicCustomerAuthGuard)
  async getMyReleasedClinicDocument(
    @Param('slug') slug: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    const business = await this.businessService.findBySlug(slug);
    if (user.businessId !== business.id) {
      throw new ForbiddenException(
        'Customer session does not match this business',
      );
    }
    return {
      data: await this.patientDocumentsService.getReleasedDocumentForCustomerAccount(
        business.id,
        user.customerId,
        documentId,
        user.customerId,
      ),
    };
  }

  @Post('me/support/ticket')
  @UseGuards(PublicCustomerAuthGuard)
  createPostBookingSupportTicket(
    @Param('slug') slug: string,
    @Body() dto: PublicConsumerSupportTicketDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicConsumerSupportService.createPostBookingSupportTicket(
      slug,
      user.customerId,
      dto,
    );
  }

  @Post('me/bookings/:bookingId/cancel')
  @UseGuards(PublicCustomerAuthGuard)
  cancelMyBooking(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerBookingService.cancelBooking(
      slug,
      user.customerId,
      bookingId,
    );
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
    return this.publicCustomerBookingService.cancelPackageVisit(
      slug,
      user.customerId,
      bookingId,
    );
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
    return this.publicCustomerBookingService.getManageContext(
      slug,
      bookingId,
      token,
    );
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
    @Body()
    dto: {
      bookingId: string;
      token: string;
      startTime: string;
      employeeId?: string;
    },
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

  @Get('promotions')
  getPublicPromotions(@Param('slug') slug: string) {
    return this.publicBookingService.getPublicPromotions(slug);
  }

  @Get('me/loyalty')
  @UseGuards(PublicCustomerAuthGuard)
  getMyLoyalty(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerLoyalty(slug, user.customerId);
  }

  @Get('me/rewards')
  @UseGuards(PublicCustomerAuthGuard)
  getMyRewards(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerRewards(slug, user.customerId);
  }

  @Get('me/referral')
  @UseGuards(PublicCustomerAuthGuard)
  getMyReferralProgram(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerReferralProgram(
      slug,
      user.customerId,
    );
  }

  @Post('me/referral/claim')
  @UseGuards(PublicCustomerAuthGuard)
  claimReferralCode(
    @Param('slug') slug: string,
    @Body() dto: ClaimReferralCodeDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.claimCustomerReferralCode(
      slug,
      user.customerId,
      dto.referralCode,
    );
  }

  @Get('me/bookings/:bookingId/review')
  @UseGuards(PublicCustomerAuthGuard)
  getMyReviewSession(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerReviewSession(
      slug,
      user.customerId,
      bookingId,
    );
  }

  @Post('me/bookings/:bookingId/review')
  @UseGuards(PublicCustomerAuthGuard)
  submitMyReview(
    @Param('slug') slug: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: SubmitCustomerReviewDto,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.submitCustomerReview(
      slug,
      user.customerId,
      bookingId,
      dto,
    );
  }

  @Get('me/subscriptions')
  @UseGuards(PublicCustomerAuthGuard)
  listMySubscriptions(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicBookingService.getCustomerSubscriptions(
      slug,
      user.customerId,
    );
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

  @Post('me/push/register-native')
  @UseGuards(PublicCustomerAuthGuard)
  async registerConsumerNativePush(
    @CurrentUser() user: PublicCustomerRequestUser,
    @Body() dto: RegisterConsumerNativePushDto,
  ) {
    const result = await this.consumerPushTokenService.registerToken(
      user.customerId,
      user.businessId,
      dto,
    );
    await this.publicCustomerAuthService.linkAnalyticsAnonByCustomerId(
      user.businessId,
      user.customerId,
      dto.analyticsAnonId,
    );
    return result;
  }

  @Post('me/push/delivery-ack')
  @UseGuards(PublicCustomerAuthGuard)
  ackConsumerPushDelivery(
    @CurrentUser() user: PublicCustomerRequestUser,
    @Body() dto: AckConsumerPushDeliveryDto,
  ) {
    return this.consumerPushTokenService.recordDeliveryAck(
      user.customerId,
      user.businessId,
      dto.platform,
      dto.deliveryId,
    );
  }

  @Get('me/push/native-status')
  @UseGuards(PublicCustomerAuthGuard)
  getConsumerNativePushStatus(
    @CurrentUser() user: PublicCustomerRequestUser,
    @Query('platform') platform?: 'ios' | 'android',
  ) {
    return this.consumerPushTokenService.getNativePushStatus(
      user.customerId,
      user.businessId,
      platform,
    );
  }

  @Get('me/notification-preferences')
  @UseGuards(PublicCustomerAuthGuard)
  getMyNotificationPreferences(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
  ) {
    return this.publicCustomerAuthService.getNotificationPreferences(
      slug,
      user.customerId,
    );
  }

  @Patch('me/notification-preferences')
  @UseGuards(PublicCustomerAuthGuard)
  updateMyNotificationPreferences(
    @Param('slug') slug: string,
    @CurrentUser() user: PublicCustomerRequestUser,
    @Body() dto: UpdatePublicConsumerNotificationPreferencesDto,
  ) {
    return this.publicCustomerAuthService.updateNotificationPreferences(
      slug,
      user.customerId,
      dto,
    );
  }

  @Get('me/data')
  @UseGuards(PublicCustomerAuthGuard)
  exportMyData(@CurrentUser() user: PublicCustomerRequestUser) {
    return this.customerPrivacyService.exportCustomerData(
      user.businessId,
      user.customerId,
    );
  }

  @Delete('me/data')
  @UseGuards(PublicCustomerAuthGuard)
  deleteMyData(@CurrentUser() user: PublicCustomerRequestUser) {
    return this.customerPrivacyService.deleteCustomerData(
      user.businessId,
      user.customerId,
    );
  }
}
