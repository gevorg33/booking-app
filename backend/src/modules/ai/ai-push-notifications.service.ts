import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { NotificationLog } from '../notifications/entities/notification-log.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import { PushService } from '../provider-mobile/push.service.js';
import { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import { ProviderPushHistoryService } from '../provider-mobile/provider-push-history.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposePushNotificationsCompoundPrompt,
  isPushNotificationsCompoundPrompt,
  rescuePushNotificationsIntent,
} from './ai-push-notifications.util.js';
import {
  handleAppointmentReminderPreferencesLogic,
  handleConfigurePushRecipientsLogic,
  handleDismissPushLogic,
  handleEnableNotificationsLogic,
  handleEndOfDaySummaryLogic,
  handleExplainLastPushLogic,
  handleListPushNotificationsLogic,
  handleMarkAllNotificationsReadLogic,
  handleMarkBookingNotificationsReadLogic,
  handleMarkNotificationReadLogic,
  handleNewBookingPushActionsLogic,
  handleNotificationHistoryLogic,
  handleOfflineQueueStatusLogic,
  handleOpenBookingFromPushLogic,
  handleProviderExplainAppUpdateGateLogic,
  handleProviderExplainOfflineModeLogic,
  handlePushNotificationsCompoundLogic,
  handleRetryOfflineActionLogic,
  handleTestPushLogic,
  handleToggleBusinessEmailOnCustomerChangeLogic,
  type PushNotificationsLogicDeps,
} from './ai-push-notifications.logic.js';
import { dispatchPushNotificationsLogicIntent } from './ai-push-notifications-dispatch.util.js';
import type { PushNotificationsDispatchContext } from './ai-push-notifications-dispatch.build.js';

@Injectable()
export class AiPushNotificationsService {
  private readonly deps: PushNotificationsLogicDeps;

  constructor(
    notificationsService: NotificationsService,
    whatsappIntegrationService: WhatsAppIntegrationService,
    pushService: PushService,
    providerMobileService: ProviderMobileService,
    pushHistoryService: ProviderPushHistoryService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    @InjectRepository(NotificationLog)
    notificationLogRepo: Repository<NotificationLog>,
  ) {
    this.deps = {
      notificationsService,
      whatsappIntegrationService,
      pushService,
      providerMobileService,
      pushHistoryService,
      bookingRepo,
      businessRepo,
      customerRepo,
      employeeRepo,
      notificationLogRepo,
    };
  }

  rescuePushNotificationsIntent(prompt: string, action: string) {
    return rescuePushNotificationsIntent(prompt, action);
  }

  isPushNotificationsCompound(prompt: string) {
    return isPushNotificationsCompoundPrompt(prompt);
  }

  decomposePushNotificationsCompound(prompt: string) {
    return decomposePushNotificationsCompoundPrompt(prompt);
  }

  handleExplainLastPush(params: Record<string, any>) {
    return handleExplainLastPushLogic(this.deps, params);
  }

  handleOpenBookingFromPush(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleOpenBookingFromPushLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleOfflineQueueStatus(params: Record<string, any>) {
    return handleOfflineQueueStatusLogic(this.deps, params);
  }

  handleRetryOfflineAction(params: Record<string, any>) {
    return handleRetryOfflineActionLogic(this.deps, params);
  }

  handleProviderExplainOfflineMode(params: Record<string, any>) {
    return handleProviderExplainOfflineModeLogic(this.deps, params);
  }

  handleProviderExplainAppUpdateGate(params: Record<string, any>) {
    return handleProviderExplainAppUpdateGateLogic(this.deps, params);
  }

  handleDismissPush(params: Record<string, any>) {
    return handleDismissPushLogic(this.deps, params);
  }

  handleListPushNotifications(businessId: string, userId: string) {
    return handleListPushNotificationsLogic(this.deps, businessId, userId);
  }

  handleMarkAllNotificationsRead(businessId: string, userId: string) {
    return handleMarkAllNotificationsReadLogic(this.deps, businessId, userId);
  }

  handleMarkBookingNotificationsRead(
    businessId: string,
    userId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleMarkBookingNotificationsReadLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleMarkNotificationRead(
    businessId: string,
    userId: string,
    params: Record<string, any>,
  ) {
    return handleMarkNotificationReadLogic(
      this.deps,
      businessId,
      userId,
      params,
    );
  }

  handleEndOfDaySummary(businessId: string, params: Record<string, any>) {
    return handleEndOfDaySummaryLogic(this.deps, businessId, params);
  }

  handleNewBookingPushActions() {
    return handleNewBookingPushActionsLogic(this.deps);
  }

  handleConfigurePushRecipients(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigurePushRecipientsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleTestPush(businessId: string, params: Record<string, any>) {
    return handleTestPushLogic(this.deps, businessId, params);
  }

  handleNotificationHistory(businessId: string, params: Record<string, any>) {
    return handleNotificationHistoryLogic(this.deps, businessId, params);
  }

  handleToggleBusinessEmailOnCustomerChange(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleToggleBusinessEmailOnCustomerChangeLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleEnableNotifications(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleEnableNotificationsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAppointmentReminderPreferences(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleAppointmentReminderPreferencesLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handlePushNotificationsCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handlePushNotificationsCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not a push-notifications intent. */
  dispatchIntent(
    ctx: PushNotificationsDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchPushNotificationsLogicIntent(this.deps, ctx);
  }
}
