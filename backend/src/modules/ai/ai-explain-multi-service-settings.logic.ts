import type { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  resolveMultiServiceSettings,
  type MultiServiceSchedulingMode,
  type MultiServiceSettings,
} from '../../common/utils/multi-service-settings.util.js';
import { parseExplainMultiServiceSettingsFromPrompt } from './ai-explain-multi-service-settings.util.js';

const NAVIGATE = {
  path: '/dashboard/services?tab=multiService',
  label: 'Open Multi-service settings',
};

export interface ExplainMultiServiceSettingsLogicDeps {
  businessRepo: Pick<Repository<Business>, 'findOne'>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function formatSchedulingMode(mode: MultiServiceSchedulingMode): string {
  return mode === 'per_service'
    ? 'per service (separate appointments)'
    : 'same visit (one combined block)';
}

function formatIncompatibleSummary(settings: MultiServiceSettings): string {
  const pairs =
    settings.incompatiblePairMode === 'category'
      ? settings.incompatibleCategoryPairs
      : settings.incompatiblePairs;
  if (!pairs.length) {
    return 'No incompatible pairs configured.';
  }
  const scope =
    settings.incompatiblePairMode === 'category' ? 'category' : 'service';
  const preview = pairs
    .slice(0, 3)
    .map(([left, right]) => `${left} + ${right}`)
    .join('; ');
  const extra = pairs.length > 3 ? ` (+${pairs.length - 3} more)` : '';
  return `${pairs.length} incompatible ${scope} pair(s): ${preview}${extra}.`;
}

export function buildMultiServiceSettingsSummary(
  settings: MultiServiceSettings,
): string {
  if (!settings.enabled) {
    return 'Multi-service booking is disabled. Public booking allows one service per appointment unless you enable multi-service in Services → Multi-service.';
  }

  return [
    'Multi-service booking is enabled.',
    `Limits: up to ${settings.maxServiceCount} services per visit, ${settings.maxDurationMinutes} minute total duration cap, ${settings.turnoverBufferMinutes} minute turnover buffer between blocks.`,
    `Scheduling mode: ${formatSchedulingMode(settings.schedulingMode)}.`,
    formatIncompatibleSummary(settings),
  ].join(' ');
}

export async function handleExplainMultiServiceSettingsLogic(
  deps: ExplainMultiServiceSettingsLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const parsed = parseExplainMultiServiceSettingsFromPrompt(
    String(prompt ?? params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_multi_service_settings',
      'Ask about multi-service settings (e.g. "Explain multi-service booking settings" or "What are our multi-service limits?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_multi_service_settings', 'Business not found.');
  }

  const settings = resolveMultiServiceSettings(business.settings ?? {});
  const summary = buildMultiServiceSettingsSummary(settings);

  return success('explain_multi_service_settings', summary, {
    settings,
    navigate: NAVIGATE,
  });
}
