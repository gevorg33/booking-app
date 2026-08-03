import type { Employee } from '../employee/entities/employee.entity.js';
import type { Repository } from 'typeorm';
import { resolveLocale, t } from '../../common/i18n/messages.js';
import type { CommandResult } from './command-completion.types.js';
import { parseExplainAnyProviderOptionFromPrompt } from './ai-explain-any-provider-option.util.js';
import type { AnyProviderOptionAspect } from './ai-explain-any-provider-option.fixtures.js';

export interface AnyProviderOptionLogicDeps {
  employeeRepo: Pick<Repository<Employee>, 'count'>;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveParamsLocale(params: Record<string, unknown> = {}): string {
  return typeof params.locale === 'string' ? params.locale : 'en';
}

export function buildExplainAnyProviderOptionSummary(input: {
  aspect: AnyProviderOptionAspect;
  activeProviderCount?: number;
  locale?: string | null;
}): string {
  const locale = resolveLocale(input.locale);
  const teamNote =
    input.activeProviderCount && input.activeProviderCount > 0
      ? t(locale, 'assistant.anyProviderTeamNote', {
          count: String(input.activeProviderCount),
        })
      : '';

  const parts: string[] = [];
  const includeMeaning =
    input.aspect === 'what_it_means' || input.aspect === 'all';
  const includeAssignment =
    input.aspect === 'assignment' || input.aspect === 'all';
  const includePicker = input.aspect === 'picker' || input.aspect === 'all';

  if (includeMeaning) {
    parts.push(t(locale, 'assistant.anyProviderMeaning'));
  }
  if (includeAssignment) {
    parts.push(t(locale, 'assistant.anyProviderAssignment'));
  }
  if (includePicker) {
    parts.push(t(locale, 'assistant.anyProviderPicker'));
  }

  return `${parts.join(' ')}${teamNote}`.trim();
}

export async function handleExplainAnyProviderOptionLogic(
  deps: AnyProviderOptionLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const locale = resolveLocale(resolveParamsLocale(params));
  const parsed = parseExplainAnyProviderOptionFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_any_provider_option',
      // e2e-bug.259 — localize clarify so it is not prepended in English over hy guides.
      t(locale, 'assistant.anyProviderClarify'),
      { clarify: true, missing: ['aspect'] },
    );
  }

  const activeProviderCount = await deps.employeeRepo.count({
    where: { businessId, isActive: true },
  });

  const summary = buildExplainAnyProviderOptionSummary({
    aspect: parsed.aspect,
    activeProviderCount,
    locale,
  });

  return success('explain_any_provider_option', summary, {
    aspect: parsed.aspect,
    activeProviderCount,
    label: t(locale, 'assistant.anyProviderLabel'),
    navigate: {
      path: 'booking',
      query: { focus: 'specialistPicker' },
    },
  });
}
