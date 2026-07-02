import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CommandResult } from './command-completion.types.js';
import { rescueConfigureNotificationSettingsIntent } from './ai-notification-settings.util.js';
import { handleConfigureNotificationSettingsLogic } from './ai-notification-settings.logic.js';

@Injectable()
export class AiNotificationSettingsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  rescueNotificationSettingsIntent(prompt: string, action: string) {
    return rescueConfigureNotificationSettingsIntent(prompt, action);
  }

  handleConfigureNotificationSettings(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureNotificationSettingsLogic(
      { notificationsService: this.notificationsService },
      businessId,
      params,
      prompt,
    );
  }
}
