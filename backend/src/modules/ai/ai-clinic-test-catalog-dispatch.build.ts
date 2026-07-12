import type { CommandResult } from './command-completion.types.js';
import {
  handleCreateTestPanelLogic,
  handleCreateTestTypeLogic,
  handleDeleteTestTypeLogic,
  handleImportClinicCatalogCsvLogic,
  handleSetTestPanelItemsLogic,
  handleUpdateTestPanelLogic,
  handleUpdateTestTypeLogic,
  type ClinicTestCatalogLogicDeps,
} from './ai-clinic-test-catalog.logic.js';

export type ClinicTestCatalogDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, any>;
  userId?: string;
};

export type ClinicTestCatalogLogicDispatchHandler = (
  deps: ClinicTestCatalogLogicDeps,
  ctx: ClinicTestCatalogDispatchContext,
) => Promise<CommandResult>;

export function buildClinicTestCatalogLogicDispatchMap(): ReadonlyMap<
  string,
  ClinicTestCatalogLogicDispatchHandler
> {
  const map = new Map<string, ClinicTestCatalogLogicDispatchHandler>();

  map.set('create_test_type', async (deps, ctx) =>
    handleCreateTestTypeLogic(deps, ctx.businessId, ctx.userId ?? '', ctx.params),
  );
  map.set('update_test_type', async (deps, ctx) =>
    handleUpdateTestTypeLogic(deps, ctx.businessId, ctx.userId ?? '', ctx.params),
  );
  map.set('delete_test_type', async (deps, ctx) =>
    handleDeleteTestTypeLogic(deps, ctx.businessId, ctx.userId ?? '', ctx.params),
  );
  map.set('create_test_panel', async (deps, ctx) =>
    handleCreateTestPanelLogic(deps, ctx.businessId, ctx.userId ?? '', ctx.params),
  );
  map.set('update_test_panel', async (deps, ctx) =>
    handleUpdateTestPanelLogic(deps, ctx.businessId, ctx.userId ?? '', ctx.params),
  );
  map.set('set_test_panel_items', async (deps, ctx) =>
    handleSetTestPanelItemsLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );
  map.set('import_clinic_catalog_csv', async (deps, ctx) =>
    handleImportClinicCatalogCsvLogic(
      deps,
      ctx.businessId,
      ctx.userId ?? '',
      ctx.params,
    ),
  );

  return map;
}

/** Registry-driven dispatch table for AiClinicTestCatalogService (ai-cmd-ext-0.5). */
export const CLINIC_TEST_CATALOG_LOGIC_DISPATCH_MAP =
  buildClinicTestCatalogLogicDispatchMap();
