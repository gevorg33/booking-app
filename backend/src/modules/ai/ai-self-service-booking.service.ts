import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { PublicCustomerBookingService } from '../public-booking/public-customer-booking.service.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeCustomerBookingCompoundPrompt,
  isCustomerBookingCompoundPrompt,
  rescueSelfServiceBookingIntent,
} from './ai-self-service-booking.util.js';
import {
  handleAddServicesToCartLogic,
  handleBookMultiServiceLogic,
  handleBookPackageLogic,
  handleBookWithCashLogic,
  handleBookWithGiftCardLogic,
  handleCancelMyBookingLogic,
  handleCancelPackageVisitSelfLogic,
  handleChangeProviderOnRescheduleLogic,
  handleCheckMultiServiceAvailabilityLogic,
  handleCheckPackageAvailabilityLogic,
  handleCustomerBookingCompoundLogic,
  handleExplainCancelPolicyLogic,
  handleGetManageLinkLogic,
  handleListMyAppointmentsLogic,
  handleListMyPackageVisitsLogic,
  handleRemoveServiceFromCartLogic,
  handleRescheduleMyBookingLogic,
  handleReschedulePackageVisitSelfLogic,
  handleSelectSubscriptionPlanLogic,
  handleShowCartTotalDurationLogic,
  handleUseSubscriptionCreditLogic,
  type SelfServiceBookingLogicDeps,
} from './ai-self-service-booking.logic.js';

@Injectable()
export class AiSelfServiceBookingService {
  private readonly deps: SelfServiceBookingLogicDeps;

  constructor(
    publicBookingService: PublicBookingService,
    publicCustomerBookingService: PublicCustomerBookingService,
    publicCustomerAuthService: PublicCustomerAuthService,
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
      publicCustomerAuthService,
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

  handleRescheduleMyBooking(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleRescheduleMyBookingLogic(this.deps, businessId, params, prompt);
  }

  handleCancelPackageVisitSelf(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleCancelPackageVisitSelfLogic(this.deps, businessId, params);
  }

  handleReschedulePackageVisitSelf(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleReschedulePackageVisitSelfLogic(this.deps, businessId, params);
  }

  handleListMyAppointments(businessId: string, params: Record<string, any>) {
    return handleListMyAppointmentsLogic(this.deps, businessId, params);
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

  handleGetManageLink(businessId: string, params: Record<string, any>) {
    return handleGetManageLinkLogic(this.deps, businessId, params);
  }

  handleExplainCancelPolicy(businessId: string, params: Record<string, any>) {
    return handleExplainCancelPolicyLogic(this.deps, businessId, params);
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
}
