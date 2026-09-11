import type { OpenAiIntegrationService } from '../integrations/openai/openai-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  describeOpenaiIntegrationPatch,
  parseConfigureOpenaiIntegrationFromPrompt,
} from './ai-openai-integration.util.js';
import { redactSecretDetailFields } from '../../common/utils/phi-ai-guard.util.js';

export interface ConfigureOpenaiIntegrationLogicDeps {
  openAiIntegrationService: OpenAiIntegrationService;
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
      'Open Settings → OpenAI and choose Platform default to use the shared platform API key.',
      'AI command bar and automations will bill against platform usage limits.',
    ];
  }

  return [
    'Open Settings → OpenAI and choose Connect your own key (BYOK).',
    'Paste a valid OpenAI API key (sk-…) — it is encrypted before storage.',
    'Only business owners/admins should configure tenant OpenAI keys.',
  ];
}

export async function handleConfigureOpenaiIntegrationLogic(
  deps: ConfigureOpenaiIntegrationLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseConfigureOpenaiIntegrationFromPrompt(
    effectivePrompt,
    params,
  );
  if (parsed === null) {
    return failure(
      'configure_openai_integration',
      'Ask to configure OpenAI integration (e.g. "Configure OpenAI integration" or "Use platform default OpenAI API").',
      {
        clarify: true,
        missing: ['usePlatformDefault', 'apiKey'],
      },
    );
  }

  const navigate = {
    path: SETTINGS_PATH,
    label: 'Open Settings → OpenAI',
  };
  const patchKeys = Object.keys(parsed);

  if (patchKeys.length === 0) {
    const current =
      await deps.openAiIntegrationService.getPublicSettings(businessId);
    return success(
      'configure_openai_integration',
      current.configured
        ? 'OpenAI integration is configured. Open Settings → OpenAI to review connection mode and usage.'
        : 'Set up OpenAI on Settings → OpenAI — choose platform default or connect your own API key.',
      {
        settings: current,
        navigate,
        steps: buildSetupSteps(current.usingPlatformDefault),
      },
    );
  }

  try {
    const settings = await deps.openAiIntegrationService.updateSettings(
      businessId,
      parsed,
    );
    const changes = describeOpenaiIntegrationPatch(parsed);

    return success(
      'configure_openai_integration',
      changes.length
        ? `OpenAI integration updated: ${changes.join('; ')}.`
        : 'OpenAI integration updated.',
      {
        settings,
        patch: redactSecretDetailFields(parsed),
        navigate,
        steps: buildSetupSteps(settings.usingPlatformDefault),
      },
    );
  } catch (err: any) {
    return failure(
      'configure_openai_integration',
      err?.message ??
        'Could not update OpenAI integration. Check the API key on Settings → OpenAI.',
      {
        navigate,
        steps: buildSetupSteps(parsed.usePlatformDefault),
        patch: redactSecretDetailFields(parsed),
      },
    );
  }
}
