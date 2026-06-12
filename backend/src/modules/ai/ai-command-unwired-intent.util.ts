import type { CommandSurface } from './ai-command-registry.types.js';
import {
  getCommandEntry,
  resolveHandlerForSurface,
} from './ai-command-registry.util.js';
import type { CommandResult } from './command-completion.types.js';

export type UnwiredIntentDispatchGap =
  | 'unregistered'
  | 'delegated_handler'
  | 'missing_switch_case';

export function resolveUnwiredIntentDispatchGap(
  action: string,
  surface: CommandSurface,
  switchHost: string = 'AiCommandService',
): UnwiredIntentDispatchGap {
  const entry = getCommandEntry(action);
  if (!entry) return 'unregistered';

  const handler = resolveHandlerForSurface(action, surface) ?? entry.handler;
  if (handler !== switchHost) return 'delegated_handler';
  return 'missing_switch_case';
}

export function buildUnwiredIntentSummary(
  action: string,
  surface: CommandSurface,
  options: { reasoning?: string; switchHost?: string } = {},
): string {
  const switchHost = options.switchHost ?? 'AiCommandService';
  const entry = getCommandEntry(action);
  const handler =
    resolveHandlerForSurface(action, surface) ?? entry?.handler ?? 'unknown';
  const gap = resolveUnwiredIntentDispatchGap(action, surface, switchHost);

  if (gap === 'unregistered') {
    return `Action "${action}" is not registered in the command registry for ${surface}. Try rephrasing or pick a supported command.`;
  }

  if (gap === 'delegated_handler') {
    return `Action "${action}" is registered for ${surface} with handler ${handler}, but ${switchHost} reached the default branch instead of delegating.`;
  }

  return `Action "${action}" is registered for ${surface} (handler ${handler}) but ${switchHost} has no switch case wired yet.`;
}

/** Registry-aware default-branch result for dashboard dispatch (ai-cmd-ext-0.3). */
export function buildUnwiredDashboardIntentResult(
  action: string,
  options: { reasoning?: string; parsed?: Record<string, unknown> } = {},
): CommandResult {
  const entry = getCommandEntry(action);
  const handler =
    resolveHandlerForSurface(action, 'dashboard') ?? entry?.handler ?? null;
  const dispatchGap = resolveUnwiredIntentDispatchGap(action, 'dashboard');

  return {
    success: false,
    action: 'unknown',
    summary: buildUnwiredIntentSummary(action, 'dashboard', options),
    details: {
      attemptedAction: action,
      dispatchGap,
      registryHandler: handler,
      registrySurfaces: entry?.surfaces ?? [],
      reasoning: options.reasoning,
      parsed: options.parsed,
    },
  };
}
