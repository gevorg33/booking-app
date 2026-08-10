import type { BusinessService } from '../business/business.service.js';
import type { ClinicTestCatalogService } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  resolveClinicTestPanelFromList,
  resolveClinicTestTypeFromList,
  type ClinicTestPanelLike,
  type ClinicTestTypeLike,
} from './ai-clinic-test-catalog.util.js';

export interface ClinicTestCatalogLogicDeps {
  businessService: Pick<BusinessService, 'ensureMember'>;
  catalogService: Pick<
    ClinicTestCatalogService,
    | 'listTestTypes'
    | 'createTestType'
    | 'updateTestType'
    | 'deactivateTestType'
    | 'listPanels'
    | 'createPanel'
    | 'updatePanel'
    | 'upsertPanelItems'
    | 'importFromCsv'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

async function resolveRoleOrFail(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  action: string,
): Promise<{ ok: true; role: string } | { ok: false; result: CommandResult }> {
  try {
    const membership = await deps.businessService.ensureMember(
      businessId,
      userId,
    );
    return { ok: true, role: membership.role };
  } catch {
    return {
      ok: false,
      result: failure(
        action,
        'You must be a business member to manage the clinic lab catalog.',
      ),
    };
  }
}

async function resolveTestTypeOrFail(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  action: string,
): Promise<
  | { ok: true; testType: ClinicTestTypeLike }
  | { ok: false; result: CommandResult }
> {
  const testTypes = await deps.catalogService.listTestTypes(businessId);
  const testType = resolveClinicTestTypeFromList(testTypes, params);
  if (!testType) {
    return {
      ok: false,
      result: failure(
        action,
        'Which test type is this? Provide testTypeId, testTypeCode, or testTypeName.',
        { clarify: true, missing: ['testTypeId', 'testTypeCode'] },
      ),
    };
  }
  return { ok: true, testType };
}

async function resolvePanelOrFail(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  params: Record<string, any>,
  action: string,
): Promise<
  | { ok: true; panel: ClinicTestPanelLike }
  | { ok: false; result: CommandResult }
> {
  const panels = await deps.catalogService.listPanels(businessId);
  const panel = resolveClinicTestPanelFromList(panels, params);
  if (!panel) {
    return {
      ok: false,
      result: failure(
        action,
        'Which test panel is this? Provide panelId, panelCode, or panelName.',
        { clarify: true, missing: ['panelId', 'panelCode'] },
      ),
    };
  }
  return { ok: true, panel };
}

export async function handleCreateTestTypeLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'create_test_type';
  const title = typeof params.title === 'string' ? params.title.trim() : '';
  if (!title) {
    return failure(action, 'What should this lab test type be called?', {
      clarify: true,
      missing: ['title'],
    });
  }
  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  const code = typeof params.code === 'string' ? params.code.trim() : undefined;
  const unit = typeof params.unit === 'string' ? params.unit : undefined;
  const price = typeof params.price === 'number' ? params.price : undefined;
  const requiresFasting =
    typeof params.requiresFasting === 'boolean'
      ? params.requiresFasting
      : undefined;
  const normalLow =
    typeof params.normalLow === 'number' ? params.normalLow : undefined;
  const normalHigh =
    typeof params.normalHigh === 'number' ? params.normalHigh : undefined;

  try {
    const testType = await deps.catalogService.createTestType(
      businessId,
      {
        title,
        ...(code !== undefined ? { code } : {}),
        ...(unit !== undefined ? { unit } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(requiresFasting !== undefined ? { requiresFasting } : {}),
        ...(normalLow !== undefined ? { normalLow } : {}),
        ...(normalHigh !== undefined ? { normalHigh } : {}),
      },
      roleResult.role,
    );
    return success(action, `Created the "${testType.title}" lab test type.`, {
      testType,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not create the test type.');
  }
}

export async function handleUpdateTestTypeLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_test_type';
  const resolved = await resolveTestTypeOrFail(
    deps,
    businessId,
    params,
    action,
  );
  if (!resolved.ok) return resolved.result;

  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  const title =
    typeof params.title === 'string' ? params.title.trim() : undefined;
  const price = typeof params.price === 'number' ? params.price : undefined;
  const requiresFasting =
    typeof params.requiresFasting === 'boolean'
      ? params.requiresFasting
      : undefined;
  const normalLow =
    typeof params.normalLow === 'number' ? params.normalLow : undefined;
  const normalHigh =
    typeof params.normalHigh === 'number' ? params.normalHigh : undefined;
  const isActive =
    typeof params.isActive === 'boolean' ? params.isActive : undefined;

  if (
    title === undefined &&
    price === undefined &&
    requiresFasting === undefined &&
    normalLow === undefined &&
    normalHigh === undefined &&
    isActive === undefined
  ) {
    return failure(
      action,
      `What should I change on "${resolved.testType.title}"? Provide a new title, price, reference range, fasting requirement, or active status.`,
    );
  }

  try {
    const testType = await deps.catalogService.updateTestType(
      businessId,
      resolved.testType.id,
      {
        ...(title !== undefined ? { title } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(requiresFasting !== undefined ? { requiresFasting } : {}),
        ...(normalLow !== undefined ? { normalLow } : {}),
        ...(normalHigh !== undefined ? { normalHigh } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      roleResult.role,
    );
    return success(action, `Updated the "${testType.title}" lab test type.`, {
      testType,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not update the test type.');
  }
}

export async function handleDeleteTestTypeLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'delete_test_type';
  const resolved = await resolveTestTypeOrFail(
    deps,
    businessId,
    params,
    action,
  );
  if (!resolved.ok) return resolved.result;

  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  try {
    const testType = await deps.catalogService.deactivateTestType(
      businessId,
      resolved.testType.id,
      roleResult.role,
    );
    return success(
      action,
      `Deactivated the "${testType.title}" lab test type.`,
      { testType },
    );
  } catch (err: any) {
    return failure(
      action,
      err?.message ?? 'Could not deactivate the test type.',
    );
  }
}

export async function handleCreateTestPanelLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'create_test_panel';
  const title = typeof params.title === 'string' ? params.title.trim() : '';
  if (!title) {
    return failure(action, 'What should this lab test panel be called?', {
      clarify: true,
      missing: ['title'],
    });
  }
  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  const code = typeof params.code === 'string' ? params.code.trim() : undefined;
  const price = typeof params.price === 'number' ? params.price : undefined;

  try {
    const panel = await deps.catalogService.createPanel(
      businessId,
      {
        title,
        ...(code !== undefined ? { code } : {}),
        ...(price !== undefined ? { price } : {}),
      },
      roleResult.role,
    );
    return success(action, `Created the "${panel.title}" lab test panel.`, {
      panel,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not create the test panel.');
  }
}

export async function handleUpdateTestPanelLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'update_test_panel';
  const resolved = await resolvePanelOrFail(deps, businessId, params, action);
  if (!resolved.ok) return resolved.result;

  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  const title =
    typeof params.title === 'string' ? params.title.trim() : undefined;
  const price = typeof params.price === 'number' ? params.price : undefined;
  const isActive =
    typeof params.isActive === 'boolean' ? params.isActive : undefined;

  if (title === undefined && price === undefined && isActive === undefined) {
    return failure(
      action,
      `What should I change on "${resolved.panel.title}"? Provide a new title, price, or active status.`,
    );
  }

  try {
    const panel = await deps.catalogService.updatePanel(
      businessId,
      resolved.panel.id,
      {
        ...(title !== undefined ? { title } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      roleResult.role,
    );
    return success(action, `Updated the "${panel.title}" lab test panel.`, {
      panel,
    });
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not update the test panel.');
  }
}

export async function handleSetTestPanelItemsLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'set_test_panel_items';
  const resolved = await resolvePanelOrFail(deps, businessId, params, action);
  if (!resolved.ok) return resolved.result;

  const testTypeIdsParam = Array.isArray(params.testTypeIds)
    ? params.testTypeIds.filter((id): id is string => typeof id === 'string')
    : [];
  const testTypeNamesParam = Array.isArray(params.testTypeNames)
    ? params.testTypeNames.filter(
        (name): name is string => typeof name === 'string',
      )
    : [];

  if (testTypeIdsParam.length === 0 && testTypeNamesParam.length === 0) {
    return failure(
      action,
      `Which test types should "${resolved.panel.title}" include? Provide testTypeIds or testTypeNames.`,
      { clarify: true, missing: ['testTypeIds', 'testTypeNames'] },
    );
  }

  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  let resolvedIds = testTypeIdsParam;
  if (resolvedIds.length === 0) {
    const testTypes = await deps.catalogService.listTestTypes(businessId);
    resolvedIds = testTypeNamesParam
      .map((name) => {
        const needle = name.toLowerCase();
        return (
          testTypes.find((t) => t.title.toLowerCase() === needle) ??
          testTypes.find((t) => t.title.toLowerCase().includes(needle))
        )?.id;
      })
      .filter((id): id is string => !!id);

    if (resolvedIds.length === 0) {
      return failure(
        action,
        `None of the given test type names matched the catalog for "${resolved.panel.title}".`,
      );
    }
  }

  try {
    const panel = await deps.catalogService.upsertPanelItems(
      businessId,
      resolved.panel.id,
      { items: resolvedIds.map((testTypeId) => ({ testTypeId })) },
      roleResult.role,
    );
    return success(
      action,
      `Set ${resolvedIds.length} test type${resolvedIds.length === 1 ? '' : 's'} on the "${panel.title}" panel.`,
      { panel },
    );
  } catch (err: any) {
    return failure(action, err?.message ?? 'Could not update the panel items.');
  }
}

export async function handleImportClinicCatalogCsvLogic(
  deps: ClinicTestCatalogLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const action = 'import_clinic_catalog_csv';
  const csv = typeof params.csv === 'string' ? params.csv : '';
  if (!csv.trim()) {
    return failure(
      action,
      'Paste the CSV contents to import into the lab catalog.',
      { clarify: true, missing: ['csv'] },
    );
  }

  const roleResult = await resolveRoleOrFail(deps, businessId, userId, action);
  if (!roleResult.ok) return roleResult.result;

  try {
    const summary = await deps.catalogService.importFromCsv(
      businessId,
      csv,
      roleResult.role,
    );
    return success(
      action,
      `Imported the lab catalog: ${summary.testTypesCreated} test type(s) and ${summary.panelsCreated} panel(s) created (${summary.testTypesSkipped} test type(s) and ${summary.panelsSkipped} panel(s) skipped as duplicates).`,
      { summary },
    );
  } catch (err: any) {
    return failure(
      action,
      err?.message ?? 'Could not import the lab catalog CSV.',
    );
  }
}
