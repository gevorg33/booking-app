import type { Employee } from '../employee/entities/employee.entity.js';
import type { Repository } from 'typeorm';
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

export function buildExplainAnyProviderOptionSummary(input: {
  aspect: AnyProviderOptionAspect;
  activeProviderCount?: number;
}): string {
  const teamNote =
    input.activeProviderCount && input.activeProviderCount > 0
      ? ` This salon has ${input.activeProviderCount} active specialists who can be matched.`
      : '';

  const parts: string[] = [];
  const includeMeaning =
    input.aspect === 'what_it_means' || input.aspect === 'all';
  const includeAssignment =
    input.aspect === 'assignment' || input.aspect === 'all';
  const includePicker = input.aspect === 'picker' || input.aspect === 'all';

  if (includeMeaning) {
    parts.push(
      'Any available specialist means you do not pick a named stylist upfront — we match whoever is free for your service and time slot.',
    );
  }
  if (includeAssignment) {
    parts.push(
      'When you leave Any stylist selected, the salon assigns an available specialist when you confirm the booking; their name appears on your confirmation.',
    );
  }
  if (includePicker) {
    parts.push(
      'Tap the specialist row on checkout, then choose Any available specialist at the top of the list, or pick someone by name.',
    );
  }

  return `${parts.join(' ')}${teamNote}`.trim();
}

export async function handleExplainAnyProviderOptionLogic(
  deps: AnyProviderOptionLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const parsed = parseExplainAnyProviderOptionFromPrompt(
    prompt || String(params._prompt ?? ''),
    params,
  );
  if (!parsed) {
    return failure(
      'explain_any_provider_option',
      'Ask what Any stylist means, whether someone will be assigned, or how to pick any provider on checkout.',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const activeProviderCount = await deps.employeeRepo.count({
    where: { businessId, isActive: true },
  });

  const summary = buildExplainAnyProviderOptionSummary({
    aspect: parsed.aspect,
    activeProviderCount,
  });

  return success('explain_any_provider_option', summary, {
    aspect: parsed.aspect,
    activeProviderCount,
    label: 'Any available specialist',
    navigate: {
      path: 'booking',
      query: { focus: 'specialistPicker' },
    },
  });
}
