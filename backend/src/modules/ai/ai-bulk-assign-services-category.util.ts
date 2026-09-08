import type { Service } from '../service/entities/service.entity.js';
import { resolveServices } from './ai-orchestration.helpers.js';
import { resolveServicesByCategoryHint } from './ai-operations.util.js';
import { isUpdateServiceDurationBufferPrompt } from './ai-service-duration-buffer.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.27). */
export const BULK_ASSIGN_SERVICES_CATEGORY_INTENT =
  'bulk_assign_services_category' as const;

export const BULK_ASSIGN_SERVICES_CATEGORY_CLASSIFIER_RULES = `- bulk_assign_services_category: MUTATE — move many catalog services into a target service category (Categories tab). Params: targetCategoryName (required), sourceCategoryName (current category), sourceCategoryHint (name/category keyword e.g. hair), serviceNames[], allServices. Use for "Move all hair services under Hair category", "Reassign all services in Nails category to Beauty category". NOT update_service (single service move), NOT assign_employee_services (provider skills), NOT update_service_duration_buffer (duration/buffer only).
- Examples:
  - "Move all hair services under Hair category" → sourceCategoryHint=hair, targetCategoryName=Hair
  - "Move all massage services to Massage category" → sourceCategoryHint=massage, targetCategoryName=Massage
  - "Reassign all services in Nails category to Beauty category" → sourceCategoryName=Nails, targetCategoryName=Beauty
  - "Move Haircut, Blowdry and Color under Hair category" → serviceNames=[Haircut,Blowdry,Color], targetCategoryName=Hair
  - NOT "Move Neck Massage under service category: Massage" → update_service`;

export type BulkAssignServicesCategoryPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof BULK_ASSIGN_SERVICES_CATEGORY_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const BULK_ASSIGN_SERVICES_CATEGORY_PROMPTS: BulkAssignServicesCategoryPromptFixture[] =
  [
    {
      id: 'all-hair-to-hair',
      prompt: 'Move all hair services under Hair category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'hair',
        targetCategoryName: 'Hair',
      },
    },
    {
      id: 'all-massage-to-massage',
      prompt: 'Move all massage services to Massage category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'massage',
        targetCategoryName: 'Massage',
      },
    },
    {
      id: 'from-nails-to-beauty',
      prompt: 'Reassign all services in Nails category to Beauty category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryName: 'Nails',
        targetCategoryName: 'Beauty',
      },
    },
    {
      id: 'named-three-under-hair',
      prompt: 'Move Haircut, Blowdry and Color under Hair category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        serviceNames: ['Haircut', 'Blowdry', 'Color'],
        targetCategoryName: 'Hair',
      },
    },
    {
      id: 'bulk-assign-color',
      prompt: 'Bulk assign all color services under Color category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'color',
        targetCategoryName: 'Color',
      },
    },
    {
      id: 'services-in-hair-category',
      prompt: 'Move all services in Hair category under Hair category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryName: 'Hair',
        targetCategoryName: 'Hair',
      },
    },
    {
      id: 'relocate-facial-services',
      prompt: 'Relocate all facial services into Skincare category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'facial',
        targetCategoryName: 'Skincare',
      },
    },
    {
      id: 'place-nail-services',
      prompt: 'Place all nail services under Nails category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'nail',
        targetCategoryName: 'Nails',
      },
    },
    {
      id: 'from-spa-to-wellness',
      prompt: 'Move all services from Spa category to Wellness category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryName: 'Spa',
        targetCategoryName: 'Wellness',
      },
    },
    {
      id: 'two-named-services',
      prompt: 'Assign Haircut and Blowdry to Hair category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        serviceNames: ['Haircut', 'Blowdry'],
        targetCategoryName: 'Hair',
      },
    },
    {
      id: 'all-services-target',
      prompt: 'Move all services under General category',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: { allServices: true, targetCategoryName: 'General' },
    },
    {
      id: 'under-service-category-colon',
      prompt: 'Move all dental services under service category: Dental',
      surface: 'dashboard',
      expectedAction: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      paramsPartial: {
        sourceCategoryHint: 'dental',
        targetCategoryName: 'Dental',
      },
    },
  ];

const BULK_MOVE_VERB = /\b(move|assign|reassign|relocate|put|place|bulk)\b/i;

export type ParsedBulkAssignServicesCategory = {
  targetCategoryName?: string;
  sourceCategoryName?: string;
  sourceCategoryHint?: string;
  serviceNames?: string[];
  allServices?: boolean;
};

function readStringParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return undefined;
}

function readStringArrayParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string[] | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (!Array.isArray(raw)) continue;
    const values = raw
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.trim().length > 0,
      )
      .map((value) => value.trim());
    if (values.length) return values;
  }
  return undefined;
}

function extractTargetCategoryFromPrompt(prompt: string): string | null {
  const trailingTarget = prompt.match(
    /\bto\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\s*$/i,
  );
  if (trailingTarget?.[1]) {
    return trailingTarget[1].replace(/^["']|["']$/g, '').trim();
  }

  const patterns = [
    /\b(?:under|in(?:to)?|to)\s+(?:the\s+)?(?:service\s+)?category\s*:?\s*([A-Za-z][\w\s&'-]+)$/i,
    /\b(?:under|in(?:to)?|to)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\bto\s+category\s+([A-Za-z][\w\s&'-]+)\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.replace(/^["']|["']$/g, '').trim();
    if (name) return name;
  }
  return null;
}

function extractSourceCategoryNameFromPrompt(prompt: string): string | null {
  if (/\ball\s+services?\s+under\b/i.test(prompt)) return null;

  const patterns = [
    /\bservices?\s+(?:in|from)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+category\b/i,
    /\ball\s+services?\s+(?:in|from)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+category\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.replace(/^["']|["']$/g, '').trim();
    if (name && !/^(all|every|each)$/i.test(name)) return name;
  }
  return null;
}

function extractSourceCategoryHintFromPrompt(prompt: string): string | null {
  const match = prompt.match(/\ball\s+([A-Za-z][\w&'-]+)\s+services?\b/i);
  if (match) return match[1].trim();
  return null;
}

const CATEGORY_TARGET_TAIL =
  "(?:under|in(?:to)?|to)\\s+(?:the\\s+)?(?:(?:service\\s+)?category\\s*:?\\s*[A-Za-z][\\w\\s&'-]+|[A-Za-z][\\w\\s&'-]+\\s+(?:service\\s+)?category)";

function extractBulkServiceNamesFromPrompt(
  prompt: string,
): string[] | undefined {
  const listMatch = prompt.match(
    new RegExp(
      `\\b(?:move|assign|place|relocate)\\s+(.+?)\\s+${CATEGORY_TARGET_TAIL}\\b`,
      'i',
    ),
  );
  if (!listMatch) return undefined;
  const segment = listMatch[1].trim();
  if (!/\band\b|,/i.test(segment)) return undefined;
  return segment
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

export function isBulkAssignServicesCategoryPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isUpdateServiceDurationBufferPrompt(text)) return false;
  if (/\b(?:senior|junior|provider|employee|staff)\b/i.test(text)) return false;
  if (/\b(?:duration|buffer|minutes?\s+long)\b/i.test(text)) return false;

  const hasCategoryTarget =
    /\bcategory\b/i.test(text) ||
    /\b(?:under|in(?:to)?|to)\s+(?:the\s+)?(?:service\s+)?category\b/i.test(
      text,
    );
  if (!hasCategoryTarget || !BULK_MOVE_VERB.test(text)) return false;

  const hasBulkScope =
    /\b(?:all|every|each)\s+(?:\w+\s+)?services?\b/i.test(text) ||
    // C3 / e2e-bug.360 — this command's own example, "put all the massages
    // under the Massage category", names the service *type* rather than the
    // literal word "services". `all the massages` is exactly as bulk as `all
    // services`; requiring the noun be spelled "services" was an accident of
    // how the first examples happened to be phrased.
    //
    // Safe because it is the *third* condition, not the first: the prompt has
    // already had to name a category target and a move verb, and person nouns
    // are excluded here as well as at the top of the function, so "move all the
    // customers to the VIP category" does not become a service move.
    /\b(?:all|every|each)\s+(?:the\s+)?(?!customers?\b|clients?\b|people\b)\w+s\b/i.test(
      text,
    ) ||
    /\bservices?\s+(?:in|from|under)\s+(?:the\s+)?[A-Za-z]/i.test(text) ||
    extractBulkServiceNamesFromPrompt(text)?.length !== undefined;

  if (!hasBulkScope) return false;

  const namedList = extractBulkServiceNamesFromPrompt(text);
  if (namedList?.length === 1 && !/\ball\b/i.test(text)) return false;

  if (
    !/\ball\b/i.test(text) &&
    !/\bservices?\s+(?:in|from)\b/i.test(text) &&
    (namedList?.length ?? 0) < 2
  ) {
    return false;
  }

  return true;
}

export function parseBulkAssignServicesCategoryFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBulkAssignServicesCategory | null {
  const hasParamSignal =
    readStringParam(params, 'targetCategoryName', 'categoryName') != null ||
    readStringParam(params, 'sourceCategoryName') != null ||
    readStringParam(params, 'sourceCategoryHint') != null ||
    (readStringArrayParam(params, 'serviceNames')?.length ?? 0) > 0 ||
    params.allServices === true;

  if (!isBulkAssignServicesCategoryPrompt(prompt) && !hasParamSignal)
    return null;

  const targetCategoryName =
    readStringParam(params, 'targetCategoryName', 'categoryName') ??
    extractTargetCategoryFromPrompt(prompt) ??
    undefined;

  const parsed: ParsedBulkAssignServicesCategory = {
    targetCategoryName,
    sourceCategoryName:
      readStringParam(params, 'sourceCategoryName') ??
      extractSourceCategoryNameFromPrompt(prompt) ??
      undefined,
    sourceCategoryHint:
      readStringParam(params, 'sourceCategoryHint') ??
      extractSourceCategoryHintFromPrompt(prompt) ??
      undefined,
    serviceNames:
      readStringArrayParam(params, 'serviceNames') ??
      extractBulkServiceNamesFromPrompt(prompt) ??
      undefined,
    allServices:
      params.allServices === true ||
      (/\ball\s+services?\b/i.test(prompt) &&
        !extractSourceCategoryHintFromPrompt(prompt) &&
        !extractSourceCategoryNameFromPrompt(prompt)),
  };

  if (
    !parsed.targetCategoryName &&
    !parsed.sourceCategoryName &&
    !parsed.sourceCategoryHint &&
    !parsed.serviceNames?.length &&
    !parsed.allServices &&
    !isBulkAssignServicesCategoryPrompt(prompt)
  ) {
    return null;
  }

  return parsed;
}

export function resolveTargetServicesForBulkCategoryAssign<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name?: string | null } | null;
  },
>(catalog: T[], config: ParsedBulkAssignServicesCategory): T[] {
  const active = catalog.filter((service) => service.isActive !== false);

  if (config.allServices) return active;

  if (config.serviceNames?.length) {
    const matched = resolveServices(active as unknown as Service[], {
      serviceNames: config.serviceNames,
    });
    if (matched.length) return matched as unknown as T[];
  }

  if (config.sourceCategoryName) {
    const hint = config.sourceCategoryName.toLowerCase();
    const byCategory = active.filter((service) =>
      service.category?.name?.toLowerCase().includes(hint),
    );
    if (byCategory.length) return byCategory;
  }

  if (config.sourceCategoryHint) {
    const matched = resolveServicesByCategoryHint(
      active as unknown as Service[],
      config.sourceCategoryHint,
    ) as unknown as T[];
    if (matched.length && matched.length < active.length) return matched;
    if (matched.length) return matched;
  }

  return [];
}

export function rescueBulkAssignServicesCategoryIntent(
  prompt: string,
  action: string,
): {
  action: typeof BULK_ASSIGN_SERVICES_CATEGORY_INTENT;
  rescueReason: string;
} | null {
  if (
    isBulkAssignServicesCategoryPrompt(prompt) &&
    action !== BULK_ASSIGN_SERVICES_CATEGORY_INTENT
  ) {
    return {
      action: BULK_ASSIGN_SERVICES_CATEGORY_INTENT,
      rescueReason: 'bulk_assign_services_category',
    };
  }
  return null;
}

export function enrichBulkAssignServicesCategoryParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseBulkAssignServicesCategoryFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.targetCategoryName
      ? { targetCategoryName: parsed.targetCategoryName }
      : {}),
    ...(parsed.sourceCategoryName
      ? { sourceCategoryName: parsed.sourceCategoryName }
      : {}),
    ...(parsed.sourceCategoryHint
      ? { sourceCategoryHint: parsed.sourceCategoryHint }
      : {}),
    ...(parsed.serviceNames?.length
      ? { serviceNames: parsed.serviceNames }
      : {}),
    ...(parsed.allServices ? { allServices: true } : {}),
  };
}
