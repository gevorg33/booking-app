/** ai-cmd-dashboard-6.9.1/6.9.2 — clinic lab catalog CRUD + CSV import (dashboard, manager+). */

export const DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS = [
  'create_test_type',
  'update_test_type',
  'delete_test_type',
  'create_test_panel',
  'update_test_panel',
  'set_test_panel_items',
  'import_clinic_catalog_csv',
] as const;

export type ClinicTestCatalogIntent =
  (typeof DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS)[number];

const CLINIC_TEST_CATALOG_INTENT_SET = new Set<string>(
  DASHBOARD_CLINIC_TEST_CATALOG_MUTATE_INTENTS,
);

export function isClinicTestCatalogIntent(
  action: string,
): action is ClinicTestCatalogIntent {
  return CLINIC_TEST_CATALOG_INTENT_SET.has(action);
}

export interface ClinicTestTypeLike {
  id: string;
  code: string;
  title: string;
}

export interface ClinicTestPanelLike {
  id: string;
  code: string;
  title: string;
}

function resolveByIdCodeOrTitle<
  T extends { id: string; code: string; title: string },
>(
  entries: T[],
  params: Record<string, unknown>,
  idKey: string,
  codeKey: string,
  nameKey: string,
): T | undefined {
  const id =
    typeof params[idKey] === 'string' && (params[idKey] as string).trim()
      ? (params[idKey] as string).trim()
      : undefined;
  if (id) return entries.find((entry) => entry.id === id);

  const code =
    typeof params[codeKey] === 'string' && (params[codeKey] as string).trim()
      ? (params[codeKey] as string).trim()
      : undefined;
  const name =
    typeof params[nameKey] === 'string' && (params[nameKey] as string).trim()
      ? (params[nameKey] as string).trim()
      : undefined;
  const needle = (code ?? name)?.toLowerCase();
  if (!needle) return undefined;

  return (
    entries.find((entry) => entry.code.toLowerCase() === needle) ??
    entries.find((entry) => entry.title.toLowerCase() === needle) ??
    entries.find((entry) => entry.title.toLowerCase().includes(needle))
  );
}

export function resolveClinicTestTypeFromList<T extends ClinicTestTypeLike>(
  testTypes: T[],
  params: Record<string, unknown>,
): T | undefined {
  return resolveByIdCodeOrTitle(
    testTypes,
    params,
    'testTypeId',
    'testTypeCode',
    'testTypeName',
  );
}

export function resolveClinicTestPanelFromList<T extends ClinicTestPanelLike>(
  panels: T[],
  params: Record<string, unknown>,
): T | undefined {
  return resolveByIdCodeOrTitle(
    panels,
    params,
    'panelId',
    'panelCode',
    'panelName',
  );
}
