import type { ProviderAiScreenContext } from '../components/ProviderAiAssistant';
import type { ProviderMobileRoute } from './provider-ai-quick-chips';
import { providerTabPath, resolveProviderTabId } from './provider-tab-route.util';

export interface ProviderAiCommandContextInput {
  sessionContext?: Record<string, unknown>;
  screenContext?: ProviderAiScreenContext;
  mobileRoute?: ProviderMobileRoute;
  pathname?: string;
}

/** Build provider AI command context with guide-flow route fields (ai-guide-1.4.2). */
export function buildProviderAiCommandContext(
  input: ProviderAiCommandContextInput = {},
): Record<string, unknown> {
  const tab =
    input.screenContext?.tab ??
    (input.pathname ? resolveProviderTabId(input.pathname) : undefined);
  const route =
    input.screenContext?.route ??
    (tab ? providerTabPath(tab as Parameters<typeof providerTabPath>[0]) : undefined);
  const mobileRoute = input.mobileRoute;

  return {
    ...(input.sessionContext ?? {}),
    ...(input.screenContext ?? {}),
    ...(route ? { route } : {}),
    ...(tab ? { tab } : {}),
    ...(mobileRoute ? { mobileRoute } : {}),
    screenContext: {
      ...(input.screenContext ?? {}),
      ...(route ? { route } : {}),
      ...(tab ? { tab } : {}),
      ...(mobileRoute ? { mobileRoute } : {}),
    },
  };
}
