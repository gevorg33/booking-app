import type { CommandResult } from './command-completion.types.js';
import {
  CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP,
  type ClinicTestCatalogDispatchContext,
  type ClinicTestCatalogLogicDispatchHandler,
} from './ai-clinic-test-catalog-dispatch.build.js';
import type { ClinicTestCatalogLogicDeps } from './ai-clinic-test-catalog.logic.js';

export function getClinicTestCatalogLogicDispatchHandler(
  action: string,
): ClinicTestCatalogLogicDispatchHandler | undefined {
  return CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchClinicTestCatalogLogicIntent(
  deps: ClinicTestCatalogLogicDeps,
  ctx: ClinicTestCatalogDispatchContext,
): Promise<CommandResult | null> {
  const handler = CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function clinicTestCatalogDispatchMapHas(action: string): boolean {
  return CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP.has(action);
}
