import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingService } from '../booking/booking.service.js';
import { Business } from '../business/entities/business.entity.js';
import { EmployeeService } from '../employee/employee.service.js';
import { OnboardingService } from '../onboarding/onboarding.service.js';
import { ServiceService } from '../service/service.service.js';
import type { CommandResult } from './command-completion.types.js';
import { handleDiagnoseTourCapacityLogic } from './ai-tour-capacity.logic.js';
import { handleListUpcomingTourDeparturesLogic } from './ai-upcoming-tour-departures.logic.js';
import { handleExplainTourBookingRecordLogic } from './ai-tour-booking-record.logic.js';
import { handleExplainTourCalendarSpanLogic } from './ai-tour-calendar-span.logic.js';
import { handleListTourCalendarWeekLogic } from './ai-tour-calendar-week.logic.js';
import { handleExplainTourBookingLogic } from './ai-tour-booking.logic.js';
import { handleExplainTourDaySlotsLogic } from './ai-tour-day-slots.logic.js';
import {
  handleApplyTourPlaybookLogic,
  handleConfigureTourServiceLogic,
  handleExplainTourServicesLogic,
  type TourPlaybookLogicDeps,
  type TourServiceLogicDeps,
} from './ai-tour-service.logic.js';

@Injectable()
export class AiTourServiceService {
  private readonly deps: TourServiceLogicDeps;
  private readonly playbookDeps: TourPlaybookLogicDeps;

  private readonly calendarWeekDeps: {
    bookingService: BookingService;
    serviceService: ServiceService;
    employeeService: EmployeeService;
  };

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    serviceService: ServiceService,
    bookingService: BookingService,
    employeeService: EmployeeService,
    onboardingService: OnboardingService,
  ) {
    this.deps = { serviceService, bookingService };
    this.calendarWeekDeps = {
      bookingService,
      serviceService,
      employeeService,
    };
    this.playbookDeps = { businessRepo, onboardingService };
  }

  handleConfigureTourService(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureTourServiceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainTourServices(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainTourServicesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainTourBookingRecord(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainTourBookingRecordLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainTourCalendarSpan(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainTourCalendarSpanLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleListTourCalendarWeek(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListTourCalendarWeekLogic(
      this.calendarWeekDeps,
      businessId,
      params,
      prompt,
    );
  }

  handleListUpcomingTourDepartures(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListUpcomingTourDeparturesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleApplyTourPlaybook(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleApplyTourPlaybookLogic(
      this.playbookDeps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleExplainTourBooking(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainTourBookingLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainTourDaySlots(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainTourDaySlotsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleDiagnoseTourCapacity(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleDiagnoseTourCapacityLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
