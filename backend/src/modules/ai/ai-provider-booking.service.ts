import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { BookingService } from '../booking/booking.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeProviderBookingCompoundPrompt,
  isProviderBookingCompoundPrompt,
  rescueProviderBookingIntent,
} from './ai-provider-booking.util.js';
import {
  handleListMyMultiServiceGroupsLogic,
  handleListMyPackageVisitsLogic,
  handleListPackageAppointmentsTodayLogic,
  handleProviderBookingCompoundLogic,
  handleProviderMarkPaidLogic,
  type ProviderBookingLogicDeps,
} from './ai-provider-booking.logic.js';

@Injectable()
export class AiProviderBookingService {
  private readonly deps: ProviderBookingLogicDeps;

  constructor(
    bookingService: BookingService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
  ) {
    this.deps = { bookingRepo, bookingService };
  }

  rescueProviderBookingIntent(prompt: string, action: string) {
    return rescueProviderBookingIntent(prompt, action);
  }

  isProviderBookingCompound(prompt: string) {
    return isProviderBookingCompoundPrompt(prompt);
  }

  decomposeProviderBookingCompound(prompt: string) {
    return decomposeProviderBookingCompoundPrompt(prompt);
  }

  handleProviderBookingCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleProviderBookingCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleListPackageAppointmentsToday(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleListPackageAppointmentsTodayLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleListMyPackageVisits(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleListMyPackageVisitsLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleListMyMultiServiceGroups(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ) {
    return handleListMyMultiServiceGroupsLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleMarkPaid(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleProviderMarkPaidLogic(this.deps, businessId, params, userId);
  }
}
