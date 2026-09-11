import type { CommandResult } from './command-completion.types.js';
import {
  handleConfigurePackageLocalizedNamesLogic,
  handleExplainPackageDisplayNameLogic,
  type PackageLocalizedNamesLogicDeps,
} from './ai-package-localized-names.logic.js';
import { parsePackageLocalizedNamesFromPrompt } from './ai-package-localized-names.util.js';
import { parsePackageDisplayNameExplainFromPrompt } from './ai-package-display-name.util.js';

export type PackageLocalizedNamesDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  sessionLocale?: string;
};

export type PackageLocalizedNamesLogicDispatchHandler = (
  deps: PackageLocalizedNamesLogicDeps,
  ctx: PackageLocalizedNamesDispatchContext,
) => Promise<CommandResult>;

export function buildPackageLocalizedNamesLogicDispatchMap(): ReadonlyMap<
  string,
  PackageLocalizedNamesLogicDispatchHandler
> {
  const map = new Map<string, PackageLocalizedNamesLogicDispatchHandler>();

  map.set('configure_package_localized_names', async (deps, ctx) => {
    const parsed = parsePackageLocalizedNamesFromPrompt(ctx.prompt, ctx.params);
    const merged = parsed
      ? {
          ...ctx.params,
          operation: parsed.operation,
          packageId: parsed.packageId,
          packageName: parsed.packageName,
          locale: parsed.locale,
          displayName: parsed.displayName,
        }
      : ctx.params;
    return handleConfigurePackageLocalizedNamesLogic(
      deps,
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_package_display_name', async (deps, ctx) => {
    const parsed = parsePackageDisplayNameExplainFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          packageId: parsed.packageId,
          packageName: parsed.packageName,
          locale: parsed.queryLocale,
        }
      : ctx.params;
    return handleExplainPackageDisplayNameLogic(
      deps,
      ctx.businessId,
      merged,
      ctx.prompt,
      ctx.sessionLocale,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiPackageLocalizedNamesService (ai-cmd-ext-0.5). */
export const PACKAGE_LOCALIZED_NAMES_LOGIC_DISPATCH_MAP =
  buildPackageLocalizedNamesLogicDispatchMap();
