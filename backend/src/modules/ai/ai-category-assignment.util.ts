import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { mergeServiceIds, removeServiceIds } from './ai-operations.util.js';
import {
  resolveEmployees,
  resolveServices,
} from './ai-orchestration.helpers.js';
import { isCapacityRebalancePrompt } from './ai-scheduling.util.js';

const SENIORITY_MATRIX_RE =
  /\b(?:senior|junior)\s+(?:only|stylist|stylists|provider|providers|staff)\b/i;

/** "Move all Color services from Maria to Anna". */
export function isTransferServicesBetweenProvidersPrompt(
  prompt: string,
): boolean {
  if (isCapacityRebalancePrompt(prompt)) return false;
  if (/\b(slot|appointment|booking)s?\b/i.test(prompt) && /\bmove\s+\d+/i.test(prompt)) {
    return false;
  }
  const hasTransferVerb = /\b(move|transfer|reassign)\b/i.test(prompt);
  if (!hasTransferVerb) return false;
  if (!/\bfrom\s+.+\s+to\s+/i.test(prompt)) return false;
  return /\b(services?|category|skills?)\b/i.test(prompt);
}

/** "Unassign all Color services from Gevorg Gasparyan". */
export function isUnassignServicesFromProviderPrompt(prompt: string): boolean {
  if (isTransferServicesBetweenProvidersPrompt(prompt)) return false;
  if (SENIORITY_MATRIX_RE.test(prompt)) return false;
  if (
    /\b(?:seniors?|juniors?|matrix)\b/i.test(prompt) &&
    /\bonly\b/i.test(prompt)
  ) {
    return false;
  }

  const hasUnassign =
    /\b(unassign|remove|strip|drop|revoke|take away|clear)\b/i.test(prompt);
  if (!hasUnassign) return false;

  const hasFromProvider =
    /\bfrom\s+(?:service\s+)?provider\s+[A-Za-z]/i.test(prompt) ||
    (/\bfrom\s+[A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?(?:\s*$|\s)/i.test(prompt) &&
      !/\bfrom\s+(?:seniors?|juniors?)\b/i.test(prompt));

  const hasScope =
    /\ball\s+(?:the\s+)?services?\b/i.test(prompt) ||
    /\ball\s+[A-Za-z][\w&'-]+\s+category\s+services?\b/i.test(prompt) ||
    /\ball\s+[A-Za-z][\w&'-]+\s+services?\b/i.test(prompt) ||
    /\b(?:from|in|under)\s+(?:the\s+)?[A-Za-z][\w&'-]+\s+(?:service\s+)?category\b/i.test(
      prompt,
    ) ||
    /\bservices?\s+(?:in|from)\s+(?:the\s+)?[A-Za-z][\w&'-]+\s+category\b/i.test(
      prompt,
    ) ||
    /\b(?:unassign|remove|strip|drop|revoke|clear)\s+.+\s+from\b/i.test(prompt);

  return hasFromProvider && hasScope;
}

/** "Assign all services from Color category to Gevorg Gasparyan". */
export function isAssignCategoryToProviderPrompt(prompt: string): boolean {
  if (isTransferServicesBetweenProvidersPrompt(prompt)) return false;
  if (isUnassignServicesFromProviderPrompt(prompt)) return false;
  if (SENIORITY_MATRIX_RE.test(prompt)) return false;
  if (
    /\b(?:seniors?|juniors?|matrix)\b/i.test(prompt) &&
    /\bonly\b/i.test(prompt)
  )
    return false;

  const hasAssign = /\b(assign|give|add|grant)\b/i.test(prompt);
  if (!hasAssign) return false;

  const hasCategoryScope =
    /\ball\s+(?:the\s+)?services?\s+(?:from|in|under)\b/i.test(prompt) ||
    /\ball\s+[A-Za-z][\w&'-]+\s+services?\b/i.test(prompt) ||
    /\bassign\s+(?:the\s+)?(?:service\s+)?category\b/i.test(prompt) ||
    /\bservice\s+category\s+[A-Za-z]/i.test(prompt) ||
    /\bservices?\s+(?:in|from)\s+(?:the\s+)?[A-Za-z][\w&'-]+\s+category\b/i.test(
      prompt,
    );

  const hasNamedProvider =
    /\bto\s+(?:service\s+)?provider\s+[A-Za-z]/i.test(prompt) ||
    (/\bto\s+[A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?(?:\s*$|\s)/i.test(prompt) &&
      !/\bto\s+(?:seniors?|juniors?)\b/i.test(prompt));

  return hasCategoryScope && hasNamedProvider;
}

export function extractCategoryToProviderFromPrompt(prompt: string): {
  categoryName?: string;
  employeeName?: string;
} {
  const result: { categoryName?: string; employeeName?: string } = {};

  const categoryPatterns = [
    /\b(?:from|in|under)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\bservices?\s+(?:in|from)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+category\b/i,
    /\bassign\s+(?:the\s+)?(?:service\s+)?category\s+([A-Za-z][\w\s&'-]+?)(?:\s+to\b|\s*$)/i,
    /\bservice\s+category\s+([A-Za-z][\w\s&'-]+?)(?:\s+to\b|\s*$)/i,
    /\ball\s+([A-Za-z][\w&'-]+)\s+services?\b/i,
  ];
  for (const re of categoryPatterns) {
    const m = prompt.match(re);
    const name = m?.[1]?.trim();
    if (
      name &&
      !/^(all|the|service|services|category|from|in|under|to)$/i.test(name)
    ) {
      result.categoryName = name.replace(/\s+services?$/i, '').trim();
      break;
    }
  }

  const providerPatterns = [
    /\bto\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bto\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s*$/i,
    /\bto\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)(?:\s|$)/i,
  ];
  for (const re of providerPatterns) {
    const m = prompt.match(re);
    const name = m?.[1]?.trim();
    if (name && !/^(service|provider|category|services)$/i.test(name)) {
      result.employeeName = name;
      break;
    }
  }

  return result;
}

/** Exact category name match (case-insensitive); falls back to hint match when no exact hits. */
export function resolveServicesByCategoryName<
  T extends {
    id: string;
    name: string;
    category?: { name: string } | null;
    categoryId?: string | null;
  },
>(
  services: T[],
  categoryName: string,
  categories?: Array<{ id: string; name: string }>,
): T[] {
  const lower = categoryName.toLowerCase().trim();
  if (!lower) return [];

  const category = categories?.find((c) => c.name.toLowerCase() === lower);
  if (category) {
    const byId = services.filter((s) => s.categoryId === category.id);
    if (byId.length > 0) return byId;
  }

  return services.filter((s) => s.category?.name?.toLowerCase() === lower);
}

export function resolveServicesForEmployeeAssignment(
  services: Service[],
  params: {
    serviceName?: string | null;
    serviceNames?: string[] | null;
    categoryName?: string | null;
  },
  categories?: Array<{ id: string; name: string }>,
): Service[] {
  const fromNames = resolveServices(services, params);
  if (fromNames.length > 0) return fromNames;

  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName.trim()) ||
    undefined;
  if (!categoryName) return [];

  return resolveServicesByCategoryName(services, categoryName, categories);
}

export type AssignEmployeeServicesResolution =
  | {
      ok: true;
      employeeId: string;
      employeeName: string;
      serviceIds: string[];
      serviceNames: string[];
      mergedFromCategory: boolean;
    }
  | {
      ok: false;
      summary: string;
      details?: Record<string, unknown>;
    };

export function resolveAssignEmployeeServicesInput(
  employees: Employee[],
  services: Service[],
  params: Record<string, unknown>,
  categories?: Array<{ id: string; name: string }>,
): AssignEmployeeServicesResolution {
  const targets = resolveEmployees(employees, params);
  if (targets.length !== 1) {
    return {
      ok: false,
      summary: 'Specify one service provider to assign services to.',
      details: { params },
    };
  }

  const matched = resolveServicesForEmployeeAssignment(
    services,
    params,
    categories,
  );
  if (matched.length === 0) {
    return {
      ok: false,
      summary: 'Specify which service(s) or service category to assign.',
      details: {
        availableServices: services.map((s) => s.name),
        categoryName: params.categoryName ?? null,
      },
    };
  }

  const mergedFromCategory =
    params.assignFromCategory === true ||
    (typeof params.categoryName === 'string' &&
      !!params.categoryName.trim() &&
      !params.serviceName);

  const serviceIds = mergeServiceIds(
    targets[0].serviceIds,
    matched.map((s) => s.id),
  );

  return {
    ok: true,
    employeeId: targets[0].id,
    employeeName: targets[0].name,
    serviceIds,
    serviceNames: matched.map((s) => s.name),
    mergedFromCategory,
  };
}

export function buildCategoryAssignRescueParams(
  extracted: { categoryName?: string; employeeName?: string },
  params: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...params,
    categoryName:
      extracted.categoryName ??
      (typeof params.categoryName === 'string'
        ? params.categoryName
        : undefined),
    employeeName:
      extracted.employeeName ??
      (typeof params.employeeName === 'string'
        ? params.employeeName
        : undefined),
    assignFromCategory: true,
  };
}

export function rescueAssignCategoryToProviderIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): {
  action: string;
  params: Record<string, unknown>;
  rescueReason: string;
} | null {
  if (!isAssignCategoryToProviderPrompt(prompt)) return null;
  if (action === 'assign_employee_services') return null;

  const extracted = extractCategoryToProviderFromPrompt(prompt);
  return {
    action: 'assign_employee_services',
    params: buildCategoryAssignRescueParams(extracted, params),
    rescueReason: 'assign_category_to_provider',
  };
}

export function extractUnassignFromProviderFromPrompt(prompt: string): {
  categoryName?: string;
  employeeName?: string;
  unassignAllServices?: boolean;
} {
  const result: {
    categoryName?: string;
    employeeName?: string;
    unassignAllServices?: boolean;
  } = {};

  if (/\ball\s+(?:the\s+)?services?\b/i.test(prompt)) {
    result.unassignAllServices = true;
  }

  const categoryPatterns = [
    /\b(?:from|in|under)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\bservices?\s+(?:in|from)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+category\b/i,
    /\ball\s+([A-Za-z][\w&'-]+)\s+category\s+services?\b/i,
    /\ball\s+([A-Za-z][\w&'-]+)\s+services?\b/i,
  ];
  for (const re of categoryPatterns) {
    const m = prompt.match(re);
    const name = m?.[1]?.trim();
    if (
      name &&
      !/^(all|the|service|services|category|from|in|under)$/i.test(name)
    ) {
      result.categoryName = name.replace(/\s+services?$/i, '').trim();
      break;
    }
  }

  const providerPatterns = [
    /\bfrom\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bfrom\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s*$/i,
    /\bfrom\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)(?:\s|$)/i,
  ];
  for (const re of providerPatterns) {
    const m = prompt.match(re);
    const name = m?.[1]?.trim();
    if (name && !/^(service|provider|category|services)$/i.test(name)) {
      result.employeeName = name;
      break;
    }
  }

  return result;
}

export function extractTransferBetweenProvidersFromPrompt(prompt: string): {
  categoryName?: string;
  fromEmployeeName?: string;
  toEmployeeName?: string;
  unassignAllServices?: boolean;
} {
  const result: {
    categoryName?: string;
    fromEmployeeName?: string;
    toEmployeeName?: string;
    unassignAllServices?: boolean;
  } = {};

  if (/\ball\s+(?:the\s+)?services?\b/i.test(prompt)) {
    result.unassignAllServices = true;
  }

  const categoryPatterns = [
    /\b(?:from|in|under)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\ball\s+([A-Za-z][\w&'-]+)\s+category\s+services?\b/i,
    /\ball\s+([A-Za-z][\w&'-]+)\s+services?\b/i,
    /\b(?:move|transfer|reassign)\s+(?:all\s+)?([A-Za-z][\w&'-]+)\s+services?\b/i,
  ];
  for (const re of categoryPatterns) {
    const m = prompt.match(re);
    const name = m?.[1]?.trim();
    if (
      name &&
      !/^(all|the|service|services|category|from|in|under|move|transfer|reassign)$/i.test(
        name,
      )
    ) {
      result.categoryName = name.replace(/\s+services?$/i, '').trim();
      break;
    }
  }

  const fromToPatterns = [
    /\bfrom\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+to\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bfrom\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+to\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bfrom\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+to\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
  ];
  for (const re of fromToPatterns) {
    const m = prompt.match(re);
    const fromName = m?.[1]?.trim();
    const toName = m?.[2]?.trim();
    if (fromName && toName) {
      result.fromEmployeeName = fromName;
      result.toEmployeeName = toName;
      break;
    }
  }

  return result;
}

export function resolveScopedEmployeeServices(
  employee: Employee,
  services: Service[],
  params: {
    serviceName?: string | null;
    serviceNames?: string[] | null;
    categoryName?: string | null;
    unassignAllServices?: boolean | null;
    unassignFromCategory?: boolean | null;
    transferFromCategory?: boolean | null;
  },
  categories?: Array<{ id: string; name: string }>,
): Service[] {
  const assignedIds = new Set(employee.serviceIds ?? []);
  const assigned = services.filter((s) => assignedIds.has(s.id));
  if (assigned.length === 0) return [];

  if (params.unassignAllServices === true) return assigned;

  const fromNames = resolveServices(services, params);
  if (fromNames.length > 0) {
    const nameIds = new Set(fromNames.map((s) => s.id));
    return assigned.filter((s) => nameIds.has(s.id));
  }

  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName.trim()) ||
    undefined;
  const fromCategory =
    params.unassignFromCategory === true ||
    params.transferFromCategory === true ||
    (!!categoryName && !params.serviceName);

  if (fromCategory && categoryName) {
    const categoryServices = resolveServicesByCategoryName(
      services,
      categoryName,
      categories,
    );
    const categoryIds = new Set(categoryServices.map((s) => s.id));
    return assigned.filter((s) => categoryIds.has(s.id));
  }

  return [];
}

export type UnassignEmployeeServicesResolution =
  | {
      ok: true;
      employeeId: string;
      employeeName: string;
      serviceIds: string[];
      removedServiceIds: string[];
      serviceNames: string[];
      scopedFromCategory: boolean;
    }
  | {
      ok: false;
      summary: string;
      details?: Record<string, unknown>;
    };

export function resolveUnassignEmployeeServicesInput(
  employees: Employee[],
  services: Service[],
  params: Record<string, unknown>,
  categories?: Array<{ id: string; name: string }>,
): UnassignEmployeeServicesResolution {
  const targets = resolveEmployees(employees, params);
  if (targets.length !== 1) {
    return {
      ok: false,
      summary: 'Specify one service provider to unassign services from.',
      details: { params },
    };
  }

  const employee = targets[0];
  const matched = resolveScopedEmployeeServices(
    employee,
    services,
    {
      serviceName:
        typeof params.serviceName === 'string' ? params.serviceName : null,
      serviceNames: Array.isArray(params.serviceNames)
        ? (params.serviceNames as string[])
        : null,
      categoryName:
        typeof params.categoryName === 'string' ? params.categoryName : null,
      unassignAllServices:
        params.unassignAllServices === true ? true : null,
      unassignFromCategory:
        params.unassignFromCategory === true ? true : null,
    },
    categories,
  );

  if (matched.length === 0) {
    return {
      ok: false,
      summary:
        'Specify which assigned service(s), category, or all services to remove from this provider.',
      details: {
        employeeName: employee.name,
        assignedServices: services
          .filter((s) => (employee.serviceIds ?? []).includes(s.id))
          .map((s) => s.name),
        categoryName: params.categoryName ?? null,
      },
    };
  }

  const removedServiceIds = matched.map((s) => s.id);
  const scopedFromCategory =
    params.unassignFromCategory === true ||
    (typeof params.categoryName === 'string' &&
      !!params.categoryName.trim() &&
      !params.serviceName);

  return {
    ok: true,
    employeeId: employee.id,
    employeeName: employee.name,
    serviceIds: removeServiceIds(employee.serviceIds, removedServiceIds),
    removedServiceIds,
    serviceNames: matched.map((s) => s.name),
    scopedFromCategory,
  };
}

export type TransferEmployeeServicesResolution =
  | {
      ok: true;
      fromEmployeeId: string;
      fromEmployeeName: string;
      fromServiceIds: string[];
      toEmployeeId: string;
      toEmployeeName: string;
      toServiceIds: string[];
      transferredServiceIds: string[];
      serviceNames: string[];
      scopedFromCategory: boolean;
    }
  | {
      ok: false;
      summary: string;
      details?: Record<string, unknown>;
    };

export function resolveTransferEmployeeServicesInput(
  employees: Employee[],
  services: Service[],
  params: Record<string, unknown>,
  categories?: Array<{ id: string; name: string }>,
): TransferEmployeeServicesResolution {
  const fromName =
    typeof params.fromEmployeeName === 'string'
      ? params.fromEmployeeName
      : undefined;
  const toName =
    typeof params.toEmployeeName === 'string'
      ? params.toEmployeeName
      : undefined;

  const fromTargets = resolveEmployees(employees, { employeeName: fromName });
  const toTargets = resolveEmployees(employees, { employeeName: toName });

  if (fromTargets.length !== 1 || toTargets.length !== 1) {
    return {
      ok: false,
      summary: 'Specify one source provider and one target provider.',
      details: { params },
    };
  }

  if (fromTargets[0].id === toTargets[0].id) {
    return {
      ok: false,
      summary: 'Source and target provider must be different people.',
      details: {
        fromEmployeeName: fromTargets[0].name,
        toEmployeeName: toTargets[0].name,
      },
    };
  }

  const fromEmployee = fromTargets[0];
  const toEmployee = toTargets[0];
  const matched = resolveScopedEmployeeServices(
    fromEmployee,
    services,
    {
      serviceName:
        typeof params.serviceName === 'string' ? params.serviceName : null,
      serviceNames: Array.isArray(params.serviceNames)
        ? (params.serviceNames as string[])
        : null,
      categoryName:
        typeof params.categoryName === 'string' ? params.categoryName : null,
      unassignAllServices:
        params.unassignAllServices === true ? true : null,
      transferFromCategory:
        params.transferFromCategory === true ? true : null,
    },
    categories,
  );

  if (matched.length === 0) {
    return {
      ok: false,
      summary:
        'Specify which assigned service(s), category, or all services to move from the source provider.',
      details: {
        fromEmployeeName: fromEmployee.name,
        assignedServices: services
          .filter((s) => (fromEmployee.serviceIds ?? []).includes(s.id))
          .map((s) => s.name),
        categoryName: params.categoryName ?? null,
      },
    };
  }

  const transferredServiceIds = matched.map((s) => s.id);
  const scopedFromCategory =
    params.transferFromCategory === true ||
    (typeof params.categoryName === 'string' &&
      !!params.categoryName.trim() &&
      !params.serviceName);

  return {
    ok: true,
    fromEmployeeId: fromEmployee.id,
    fromEmployeeName: fromEmployee.name,
    fromServiceIds: removeServiceIds(
      fromEmployee.serviceIds,
      transferredServiceIds,
    ),
    toEmployeeId: toEmployee.id,
    toEmployeeName: toEmployee.name,
    toServiceIds: mergeServiceIds(toEmployee.serviceIds, transferredServiceIds),
    transferredServiceIds,
    serviceNames: matched.map((s) => s.name),
    scopedFromCategory,
  };
}

export function buildUnassignRescueParams(
  extracted: ReturnType<typeof extractUnassignFromProviderFromPrompt>,
  params: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...params,
    categoryName:
      extracted.categoryName ??
      (typeof params.categoryName === 'string'
        ? params.categoryName
        : undefined),
    employeeName:
      extracted.employeeName ??
      (typeof params.employeeName === 'string'
        ? params.employeeName
        : undefined),
    unassignAllServices:
      extracted.unassignAllServices === true ||
      params.unassignAllServices === true,
    unassignFromCategory:
      extracted.categoryName != null || params.unassignFromCategory === true,
  };
}

export function buildTransferRescueParams(
  extracted: ReturnType<typeof extractTransferBetweenProvidersFromPrompt>,
  params: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...params,
    categoryName:
      extracted.categoryName ??
      (typeof params.categoryName === 'string'
        ? params.categoryName
        : undefined),
    fromEmployeeName:
      extracted.fromEmployeeName ??
      (typeof params.fromEmployeeName === 'string'
        ? params.fromEmployeeName
        : undefined),
    toEmployeeName:
      extracted.toEmployeeName ??
      (typeof params.toEmployeeName === 'string'
        ? params.toEmployeeName
        : undefined),
    unassignAllServices:
      extracted.unassignAllServices === true ||
      params.unassignAllServices === true,
    transferFromCategory:
      extracted.categoryName != null || params.transferFromCategory === true,
  };
}

export function rescueUnassignServicesFromProviderIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): {
  action: string;
  params: Record<string, unknown>;
  rescueReason: string;
} | null {
  if (!isUnassignServicesFromProviderPrompt(prompt)) return null;
  if (action === 'unassign_employee_services') return null;

  const extracted = extractUnassignFromProviderFromPrompt(prompt);
  return {
    action: 'unassign_employee_services',
    params: buildUnassignRescueParams(extracted, params),
    rescueReason: 'unassign_services_from_provider',
  };
}

export function rescueTransferServicesBetweenProvidersIntent(
  prompt: string,
  action: string,
  params: Record<string, unknown>,
): {
  action: string;
  params: Record<string, unknown>;
  rescueReason: string;
} | null {
  if (!isTransferServicesBetweenProvidersPrompt(prompt)) return null;
  if (action === 'transfer_employee_services') return null;

  const extracted = extractTransferBetweenProvidersFromPrompt(prompt);
  return {
    action: 'transfer_employee_services',
    params: buildTransferRescueParams(extracted, params),
    rescueReason: 'transfer_services_between_providers',
  };
}
