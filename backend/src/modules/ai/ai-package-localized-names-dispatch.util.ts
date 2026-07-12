import type { CommandResult } from './command-completion.types.js';
import {
  PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP,
  type PackageLocalizedNamesDispatchContext,
  type PackageLocalizedNamesLogicDispatchHandler,
} from './ai-package-localized-names-dispatch.build.js';
import type { PackageLocalizedNamesLogicDeps } from './ai-package-localized-names.logic.js';

export function getPackageLocalizedNamesLogicDispatchHandler(
  action: string,
): PackageLocalizedNamesLogicDispatchHandler | undefined {
  return PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchPackageLocalizedNamesLogicIntent(
  deps: PackageLocalizedNamesLogicDeps,
  ctx: PackageLocalizedNamesDispatchContext,
): Promise<CommandResult | null> {
  const handler = PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function packageLocalizedNamesDispatchMapHas(action: string): boolean {
  return PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP.has(action);
}
