import type { NotificationsService } from '../notifications/notifications.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  describeNotificationSettingsPatch,
  parseConfigureNotificationSettingsFromPrompt,
} from './ai-notification-settings.util.js';

export interface ConfigureNotificationSettingsLogicDeps {
  notificationsService: NotificationsService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

export async function handleConfigureNotificationSettingsLogic(
  deps: ConfigureNotificationSettingsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseConfigureNotificationSettingsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'configure_notification_settings',
      'Specify notification settings to update (e.g. "Configure notification settings — enable email and WhatsApp, disable SMS").',
      {
        clarify: true,
        missing: [
          'emailEnabled',
          'smsEnabled',
          'whatsappEnabled',
          'reminder24hEmail',
        ],
      },
    );
  }

  const settings = await deps.notificationsService.updateBusinessSettings(
    businessId,
    parsed,
  );
  const changes = describeNotificationSettingsPatch(parsed);

  return success(
    'configure_notification_settings',
    changes.length
      ? `Notification settings updated: ${changes.join('; ')}.`
      : 'Notification settings updated.',
    {
      settings,
      patch: parsed,
      navigate: {
        path: '/dashboard/settings/notifications',
        label: 'Open Notifications settings',
      },
    },
  );
}
