import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { mergeServiceIds } from './ai-operations.util.js';
import {
  resolveEmployees,
  resolveServices,
} from './ai-orchestration.helpers.js';

const SENIORITY_MATRIX_RE =
  /\b(?:senior|junior)\s+(?:only|stylist|stylists|provider|providers|staff)\b/i;

/** "Assign all services from Color category to Gevorg Gasparyan". */
export function isAssignCategoryToProviderPrompt(prompt: string): boolean {
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

  const serviceIds = mergedFromCategory
    ? mergeServiceIds(
        targets[0].serviceIds,
        matched.map((s) => s.id),
      )
    : matched.map((s) => s.id);

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
