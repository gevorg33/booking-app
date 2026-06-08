import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CommandResult } from './command-completion.types.js';
import { rescueAdopt6GrowthIntent, rescueProviderAdopt6GrowthIntent } from './ai-adopt-6-growth-loops.util.js';
import {
  handleEnablePushNotificationsLogic,
  handleExplainMyNotificationsLogic,
  handleExplainPushSetupLogic,
  handleFindMySavedSalonsLogic,
  handleManageNotificationPreferencesLogic,
  handleReferAFriendLogic,
  handleRebookLastAppointmentLogic,
  type Adopt6GrowthLogicDeps,
} from './ai-adopt-6-growth-loops.logic.js';

@Injectable()
export class AiAdopt6GrowthLoopsService {
  private readonly deps: Adopt6GrowthLogicDeps;

  constructor(
    configService: ConfigService,
    notificationsService: NotificationsService,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
  ) {
    this.deps = {
      configService,
      notificationsService,
      customerRepo,
      businessRepo,
      bookingRepo,
    };
  }

  rescueIntent(prompt: string, action: string) {
    return rescueAdopt6GrowthIntent(prompt, action);
  }

  rescueProviderIntent(prompt: string, action: string) {
    return rescueProviderAdopt6GrowthIntent(prompt, action);
  }

  handleExplainMyNotifications(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<CommandResult> {
    return handleExplainMyNotificationsLogic(this.deps, businessId, params);
  }

  handleManageNotificationPreferences(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleManageNotificationPreferencesLogic(this.deps, businessId, params, prompt);
  }

  handleReferAFriend(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<CommandResult> {
    return handleReferAFriendLogic(this.deps, businessId, params);
  }

  handleRebookLastAppointment(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<CommandResult> {
    return handleRebookLastAppointmentLogic(this.deps, businessId, params);
  }

  handleFindMySavedSalons(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<CommandResult> {
    return handleFindMySavedSalonsLogic(this.deps, businessId, params);
  }

  handleExplainPushSetup(): CommandResult {
    return handleExplainPushSetupLogic();
  }

  handleEnablePushNotifications(): CommandResult {
    return handleEnablePushNotificationsLogic();
  }
}
