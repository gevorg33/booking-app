import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import { PublicCustomerWaitlistService } from '../public-booking/public-customer-waitlist.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { PublicConsumerSupportService } from '../public-booking/public-consumer-support.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeCustomerBookingCompoundPrompt,
  isCustomerBookingCompoundPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import { handleExplainDepositForfeitureLogic } from './ai-explain-deposit-forfeiture.logic.js';
import { handleExplainManageBookingPageLogic } from './ai-explain-manage-booking-page.logic.js';
import {
  handleAddServicesToCartLogic,
  handleBookMultiServiceLogic,
  handleBookPackageLogic,
  handleBookWithCashLogic,
  handleCancelMyBookingLogic,
  handleCancelAllUpcomingBookingsLogic,
  handleCancelPackageVisitSelfLogic,
  handleChangeProviderOnRescheduleLogic,
  handleCheckMultiServiceAvailabilityLogic,
  handleCheckPackageAvailabilityLogic,
  handleCustomerBookingCompoundLogic,
  handleExplainCancelPolicyLogic,
  handleGetManageLinkLogic,
  handleRecoverLostManageLinkLogic,
  handleSignInToManageBookingLogic,
  handleNotifyRunningLateLogic,
  handleLeaveVisitReviewLogic,
  handleExplainPostVisitReviewPromptLogic,
  handleReportBookingProblemLogic,
  handleSignInAfterBookingLogic,
  handleJoinWaitlistLogic,
  handleCheckWaitlistStatusLogic,
  handleListMyAppointmentsLogic,
  handleListMyUpcomingAppointmentsLogic,
  handleListMyPackageVisitsLogic,
  handlePreviewMultiServiceCartLogic,
  handleRemoveServiceFromCartLogic,
  handleRescheduleMyBookingLogic,
  handleReschedulePackageVisitSelfLogic,
  handleSelectSubscriptionPlanLogic,
  handleShowCartTotalDurationLogic,
  handleSuggestPackageBlockLogic,
  handleUseSubscriptionCreditLogic,
  handleConfirmMyBookingDetailsLogic,
  handleAddBookingToCalendarLogic,
  type SelfServiceBookingLogicDeps,
} from './ai-self-service-booking.logic.js';
import { handleBookWithGiftCardLogic } from './ai-book-with-gift-card.logic.js';
import { handleExplainPreparationNotesLogic } from './ai-explain-preparation-notes.logic.js';
import { handleBookAnotherServiceLogic } from './ai-book-another-service.logic.js';
import { handleDiscoverPackagesLogic } from './ai-customer-crm.logic.js';
import { handleExplainMultiServiceCartLogic } from './ai-explain-multi-service-cart.logic.js';
import { handleExplainPackageSavingsLogic } from './ai-explain-package-savings.logic.js';
import { handleExplainSubscriptionVsOneTimeLogic } from './ai-explain-subscription-vs-one-time.logic.js';
import { handleExplainPackageVisitRulesLogic } from './ai-explain-package-visit-rules.logic.js';
import { handleReschedulePackageLinesLogic } from './ai-reschedule-package-lines.logic.js';
import {
  handleCancelBookingWithTokenLogic,
  handleCancelPackageVisitWithTokenLogic,
  handleExplainManageBookingContextLogic,
  handleRescheduleBookingWithTokenLogic,
  handleReschedulePackageVisitWithTokenLogic,
} from './ai-manage-booking-with-token.logic.js';
import { dispatchSelfServiceBookingIntent } from './ai-self-service-booking-dispatch.util.js';
import type { SelfServiceBookingDispatchContext } from './ai-self-service-booking-dispatch.build.js';

@Injectable()
export class AiSelfServiceBookingService {
  private readonly deps: SelfServiceBookingLogicDeps;

  constructor(
    publicBookingService: PublicBookingService,
    publicCustomerBookingService: PublicCustomerBookingService,
    publicCustomerWaitlistService: PublicCustomerWaitlistService,
    publicCustomerAuthService: PublicCustomerAuthService,
    publicConsumerSupportService: PublicConsumerSupportService,
    notificationsService: NotificationsService,
    packagesService: ServicePackagesService,
    subscriptionsService: ServiceSubscriptionsService,
    multiServiceBookingsService: MultiServiceBookingsService,
    configService: ConfigService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
  ) {
    this.deps = {
      publicBookingService,
      publicCustomerBookingService,
      publicCustomerWaitlistService,
      publicCustomerAuthService,
      publicConsumerSupportService,
      notificationsService,
      packagesService,
      subscriptionsService,
      multiServiceBookingsService,
      bookingRepo,
      businessRepo,
      serviceRepo,
      configService,
    };
  }

  rescueCustomerBookingIntent(prompt: string, action: string) {
    return rescueSelfServiceBookingIntent(prompt, action);
  }

  isCustomerBookingCompound(prompt: string) {
    return isCustomerBookingCompoundPrompt(prompt);
  }

  decomposeCustomerBookingCompound(prompt: string) {
    return decomposeCustomerBookingCompoundPrompt(prompt);
  }

  handleCustomerBookingCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCustomerBookingCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleBookPackage(businessId: string, params: Record<string, any>) {
    return handleBookPackageLogic(this.deps, businessId, params);
  }

  handleDiscoverPackages(businessId: string) {
    return handleDiscoverPackagesLogic(
      { packagesService: this.deps.packagesService },
      businessId,
    );
  }

  handleBookMultiService(businessId: string, params: Record<string, any>) {
    return handleBookMultiServiceLogic(this.deps, businessId, params);
  }

  handleCheckPackageAvailability(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleCheckPackageAvailabilityLogic(this.deps, businessId, params);
  }

  handleCheckMultiServiceAvailability(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCheckMultiServiceAvailabilityLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handlePreviewMultiServiceCart(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handlePreviewMultiServiceCartLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSuggestPackageBlock(businessId: string, params: Record<string, any>) {
    return handleSuggestPackageBlockLogic(this.deps, businessId, params);
  }

  handleSelectSubscriptionPlan(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleSelectSubscriptionPlanLogic(this.deps, businessId, params);
  }

  handleUseSubscriptionCredit(businessId: string, params: Record<string, any>) {
    return handleUseSubscriptionCreditLogic(this.deps, businessId, params);
  }

  handleCancelMyBooking(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleCancelMyBookingLogic(this.deps, businessId, params, prompt);
  }

  handleCancelAllUpcomingBookings(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleCancelAllUpcomingBookingsLogic(this.deps, businessId, params);
  }

  handleRescheduleMyBooking(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleRescheduleMyBookingLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleCancelPackageVisitSelf(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleCancelPackageVisitSelfLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleReschedulePackageVisitSelf(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleReschedulePackageVisitSelfLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleReschedulePackageLines(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleReschedulePackageLinesLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleListMyAppointments(businessId: string, params: Record<string, any>) {
    return handleListMyAppointmentsLogic(this.deps, businessId, params);
  }

  handleListMyUpcomingAppointments(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleListMyUpcomingAppointmentsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfirmMyBookingDetails(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleConfirmMyBookingDetailsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAddBookingToCalendar(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleAddBookingToCalendarLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPreparationNotes(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainPreparationNotesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleBookAnotherService(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleBookAnotherServiceLogic(this.deps, businessId, params, prompt);
  }

  handleListMyPackageVisits(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleListMyPackageVisitsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleGetManageLink(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleGetManageLinkLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainManageBookingContext(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainManageBookingContextLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleCancelBookingWithToken(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleCancelBookingWithTokenLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleRescheduleBookingWithToken(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleRescheduleBookingWithTokenLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleCancelPackageVisitWithToken(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleCancelPackageVisitWithTokenLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleReschedulePackageVisitWithToken(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleReschedulePackageVisitWithTokenLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleRecoverLostManageLink(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleRecoverLostManageLinkLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleSignInToManageBooking(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleSignInToManageBookingLogic(
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainManageBookingPage(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainManageBookingPageLogic(
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleNotifyRunningLate(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleNotifyRunningLateLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleLeaveVisitReview(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleLeaveVisitReviewLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleJoinWaitlist(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleJoinWaitlistLogic(
      this.deps as any,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleCheckWaitlistStatus(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleCheckWaitlistStatusLogic(
      this.deps as any,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainCancelPolicy(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainCancelPolicyLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainDepositForfeiture(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainDepositForfeitureLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainPackageVisitRules(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainPackageVisitRulesLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleExplainPostVisitReviewPrompt(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleExplainPostVisitReviewPromptLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleReportBookingProblem(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleReportBookingProblemLogic(
      this.deps as any,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleSignInAfterBooking(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleSignInAfterBookingLogic(
      this.deps,
      businessId,
      params,
      prompt || String(params._prompt ?? ''),
    );
  }

  handleBookWithCash(businessId: string, params: Record<string, any>) {
    return handleBookWithCashLogic(this.deps, businessId, params);
  }

  handleBookWithGiftCard(businessId: string, params: Record<string, any>) {
    return handleBookWithGiftCardLogic(this.deps, businessId, params);
  }

  handleChangeProviderOnReschedule(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleChangeProviderOnRescheduleLogic(this.deps, businessId, params);
  }

  handleAddServicesToCart(businessId: string, params: Record<string, any>) {
    return handleAddServicesToCartLogic(this.deps, businessId, params);
  }

  handleRemoveServiceFromCart(businessId: string, params: Record<string, any>) {
    return handleRemoveServiceFromCartLogic(this.deps, businessId, params);
  }

  handleShowCartTotalDuration(businessId: string, params: Record<string, any>) {
    return handleShowCartTotalDurationLogic(this.deps, businessId, params);
  }

  handleExplainMultiServiceCart(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainMultiServiceCartLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPackageSavings(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainPackageSavingsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainSubscriptionVsOneTime(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainSubscriptionVsOneTimeLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a self-service-booking intent. */
  dispatchIntent(
    ctx: SelfServiceBookingDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchSelfServiceBookingIntent(this, ctx);
  }
}
