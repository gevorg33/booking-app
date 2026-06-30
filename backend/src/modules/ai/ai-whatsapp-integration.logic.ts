import type { WhatsAppIntegrationService } from '../notifications/whatsapp-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  describeWhatsappIntegrationPatch,
  parseConfigureWhatsappIntegrationFromPrompt,
} from './ai-whatsapp-integration.util.js';

export interface ConfigureWhatsappIntegrationLogicDeps {
  whatsappIntegrationService: WhatsAppIntegrationService;
}

const SETTINGS_PATH = '/dashboard/settings';

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

function buildSetupSteps(usePlatformDefault?: boolean): string[] {
  if (usePlatformDefault === true) {
    return [
      'Open Settings → WhatsApp and choose Platform default to use the shared WhatsApp account.',
      'Turn on WhatsApp under Settings → Notifications when you are ready to send client messages.',
    ];
  }

  return [
    'Open Settings → WhatsApp and choose Connect your own account.',
    'Enter your Meta phone number ID, WhatsApp Business Account ID (WABA), and access token.',
    'Set approved template names for confirmations and reminders, plus the template language code.',
    'Enable the WhatsApp channel under Settings → Notifications after credentials are saved.',
  ];
}

export async function handleConfigureWhatsappIntegrationLogic(
  deps: ConfigureWhatsappIntegrationLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureWhatsappIntegrationFromPrompt(
    effectivePrompt,
    params,
  );
  if (parsed === null) {
    return failure(
      'configure_whatsapp_integration',
      'Ask to configure WhatsApp integration (e.g. "Configure WhatsApp integration" or "Use platform default WhatsApp connection").',
      {
        clarify: true,
        missing: ['usePlatformDefault', 'templateConfirmation', 'phoneNumberId'],
      },
    );
  }

  const navigate = {
    path: SETTINGS_PATH,
    label: 'Open Settings → WhatsApp',
  };
  const patchKeys = Object.keys(parsed);

  if (patchKeys.length === 0) {
    const current =
      await deps.whatsappIntegrationService.getPublicSettings(businessId);
    return success(
      'configure_whatsapp_integration',
      current.configured
        ? 'WhatsApp integration is configured. Open Settings → WhatsApp to review templates and connection mode.'
        : 'Set up WhatsApp on Settings → WhatsApp — choose platform default or connect your own Meta Business account.',
      {
        settings: current,
        navigate,
        steps: buildSetupSteps(current.usingPlatformDefault),
      },
    );
  }

  try {
    const settings = await deps.whatsappIntegrationService.updateSettings(
      businessId,
      parsed,
    );
    const changes = describeWhatsappIntegrationPatch(parsed);

    return success(
      'configure_whatsapp_integration',
      changes.length
        ? `WhatsApp integration updated: ${changes.join('; ')}.`
        : 'WhatsApp integration updated.',
      {
        settings,
        patch: parsed,
        navigate,
        steps: buildSetupSteps(settings.usingPlatformDefault),
      },
    );
  } catch (err: any) {
    return failure(
      'configure_whatsapp_integration',
      err?.message ??
        'Could not update WhatsApp integration. Check credentials and template names on Settings → WhatsApp.',
      {
        navigate,
        steps: buildSetupSteps(parsed.usePlatformDefault),
        patch: parsed,
      },
    );
  }
}
