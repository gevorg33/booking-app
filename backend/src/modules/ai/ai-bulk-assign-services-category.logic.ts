import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { CatalogLogicDeps } from './ai-catalog.logic.js';
import {
  parseBulkAssignServicesCategoryFromPrompt,
  resolveTargetServicesForBulkCategoryAssign,
} from './ai-bulk-assign-services-category.util.js';

const NAVIGATE = {
  path: '/dashboard/services',
  label: 'Open Services',
};

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
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

function hasSourceScope(
  parsed: ReturnType<typeof parseBulkAssignServicesCategoryFromPrompt>,
): boolean {
  if (!parsed) return false;
  return (
    parsed.allServices === true ||
    (parsed.serviceNames?.length ?? 0) > 0 ||
    !!parsed.sourceCategoryName ||
    !!parsed.sourceCategoryHint
  );
}

function resolveByName<T extends { name: string }>(
  list: T[],
  name: string,
): T | undefined {
  const lower = name.toLowerCase();
  return (
    list.find((item) => item.name.toLowerCase() === lower) ??
    list.find((item) => item.name.toLowerCase().includes(lower))
  );
}

async function resolveTargetCategory(
  deps: CatalogLogicDeps,
  businessId: string,
  categoryName: string,
) {
  const categories = await deps.categoryService.findAll(businessId);
  return resolveByName(categories, categoryName);
}

export async function handleBulkAssignServicesCategoryLogic(
  deps: CatalogLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  services: Service[],
  prompt?: string,
  userId?: string,
): Promise<CommandResult> {
  const effectivePrompt = String(prompt ?? params._prompt ?? '');
  const parsed = parseBulkAssignServicesCategoryFromPrompt(
    effectivePrompt,
    params,
  );

  if (!parsed) {
    return failure(
      'bulk_assign_services_category',
      'Ask to move services in bulk (e.g. "Move all hair services under Hair category").',
      {
        clarify: true,
        missing: ['targetCategoryName', 'sourceCategoryHint'],
        navigate: NAVIGATE,
      },
    );
  }

  if (!parsed.targetCategoryName) {
    return failure(
      'bulk_assign_services_category',
      'Which category should I move the services into?',
      {
        clarify: true,
        missing: ['targetCategoryName'],
        navigate: NAVIGATE,
      },
    );
  }

  if (!hasSourceScope(parsed)) {
    return failure(
      'bulk_assign_services_category',
      'Which services should I move — all services, a category, or named services?',
      {
        clarify: true,
        missing: [
          'allServices',
          'sourceCategoryName',
          'sourceCategoryHint',
          'serviceNames',
        ],
        navigate: NAVIGATE,
      },
    );
  }

  const category = await resolveTargetCategory(
    deps,
    businessId,
    parsed.targetCategoryName,
  );
  if (!category) {
    return failure(
      'bulk_assign_services_category',
      `Service category "${parsed.targetCategoryName}" not found.`,
      { clarify: true, missing: ['targetCategoryName'], navigate: NAVIGATE },
    );
  }

  const targets = resolveTargetServicesForBulkCategoryAssign(services, parsed);
  if (!targets.length) {
    return failure(
      'bulk_assign_services_category',
      'No matching services found for that scope.',
      { clarify: true, navigate: NAVIGATE },
    );
  }

  const updatedServices: Array<{
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
  }> = [];

  for (const service of targets) {
    if (service.categoryId === category.id) continue;
    const updated = await deps.serviceService.update(
      service.id,
      { categoryId: category.id },
      userId,
    );
    updatedServices.push({
      id: updated.id,
      name: updated.name,
      categoryId: category.id,
      categoryName: category.name,
    });
  }

  if (!updatedServices.length) {
    return success(
      'bulk_assign_services_category',
      `All ${targets.length} matching service(s) are already in "${category.name}".`,
      {
        categoryId: category.id,
        categoryName: category.name,
        matchedCount: targets.length,
        updatedCount: 0,
        navigate: NAVIGATE,
      },
    );
  }

  const names = updatedServices
    .slice(0, 3)
    .map((service) => `"${service.name}"`)
    .join(', ');
  const extra =
    updatedServices.length > 3
      ? ` and ${updatedServices.length - 3} more`
      : '';
  const summary = `Moved ${updatedServices.length} service(s) (${names}${extra}) under category "${category.name}".`;

  return success('bulk_assign_services_category', summary, {
    categoryId: category.id,
    categoryName: category.name,
    matchedCount: targets.length,
    updatedCount: updatedServices.length,
    services: updatedServices,
    navigate: NAVIGATE,
  });
}
