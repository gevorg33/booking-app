export const DEACTIVATE_SERVICE_CATEGORY_SCOPE_CLASSIFIER_RULES = `- deactivate_service category scope (ai-cmd-ext-5.5): hide/deactivate catalog services by category — set categoryName and allInCategory=true when the user deactivates every service in a category ("Deactivate all dental services", "Hide all hair services from public catalog"). Single-service prompts still use serviceName only (no allInCategory). NOT deactivate_package, NOT unassign_employee_services (remove provider skills — "from Maria/Gevorg"), NOT bulk_assign_services_category (move services into a category).
- Examples:
  - "Deactivate all dental services" → categoryName=dental, allInCategory=true
  - "Hide all hair services from public catalog" → categoryName=hair, allInCategory=true
  - "Remove all services in Skin category from public booking" → categoryName=Skin, allInCategory=true
  - "Hide balayage from public catalog" → serviceName=balayage`;

export type ParsedDeactivateServiceCategoryScope = {
  categoryName?: string;
  allInCategory?: boolean;
  serviceName?: string;
};

function isDeactivateCatalogServicePrompt(prompt: string): boolean {
  if (/\bpackage\b/i.test(prompt)) return false;
  return (
    /\b(hide|deactivate|disable|remove)\b/i.test(prompt) &&
    /\b(?:from\s+public|services?|offerings?|catalog|booking)\b/i.test(prompt)
  );
}

function isProviderSkillRemovalPrompt(prompt: string): boolean {
  if (/\bunassign\b/i.test(prompt)) return true;
  if (/\bfrom\s+(?:provider|employee|stylist|team\s+member)\b/i.test(prompt)) {
    return true;
  }
  if (
    /\bfrom\s+(?:(?:the|our)\s+)?(?:public|service\s+catalog|catalog|public\s+booking|booking|service\s+menu)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return /\bfrom\s+[A-Z][a-z][\w'-]*(?:\s+[A-Z][a-z][\w'-]*)?\b/i.test(prompt);
}

function parseCategoryScopeFromPrompt(prompt: string): {
  categoryName?: string;
  allInCategory?: boolean;
} {
  const categoryIn = prompt.match(
    /\b(?:all|every)\s+services?\s+in\s+(?:the\s+)?([A-Za-z][\w&'-]+)\s+category\b/i,
  );
  if (categoryIn) {
    return { categoryName: categoryIn[1].trim(), allInCategory: true };
  }

  const allCategoryNamed = prompt.match(
    /\b(?:all|every)\s+([A-Za-z][\w&'-]+)\s+category\s+services?\b/i,
  );
  if (allCategoryNamed) {
    return { categoryName: allCategoryNamed[1].trim(), allInCategory: true };
  }

  const allCategoryServices = prompt.match(
    /\b(?:all|every)\s+([A-Za-z][\w&'-]+)\s+services?\b/i,
  );
  if (allCategoryServices) {
    return {
      categoryName: allCategoryServices[1].trim(),
      allInCategory: true,
    };
  }

  const allOfferings = prompt.match(
    /\b(?:all|every)\s+([A-Za-z][\w&'-]+)\s+offerings?\b/i,
  );
  if (allOfferings) {
    return { categoryName: allOfferings[1].trim(), allInCategory: true };
  }

  return {};
}

function parseSingleServiceNameFromDeactivatePrompt(
  prompt: string,
): string | undefined {
  const patterns = [
    /\b(?:hide|deactivate|disable|remove)\s+(?:the\s+)?service\s+["']?([^"']+?)["']?\s+from\b/i,
    /\b(?:hide|deactivate|disable|remove)\s+(?:the\s+)?["']?([^"']+?)["']?\s+from\s+(?:public|the\s+service\s+catalog|catalog|public\s+booking)\b/i,
    /\b(?:hide|deactivate|disable|remove)\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+from\b/i,
    /\b(?:hide|deactivate|disable|remove)\s+(?:the\s+)?([A-Za-z][\w\s'-]+)\s+service\b/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.replace(/^["']|["']$/g, '').trim();
    if (name && !/^(all|every)$/i.test(name)) return name;
  }

  return undefined;
}

export function parseDeactivateServiceCategoryScopeFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedDeactivateServiceCategoryScope | null {
  const hasExplicitParams =
    params.allInCategory === true ||
    typeof params.categoryName === 'string' ||
    typeof params.serviceName === 'string';

  if (!isDeactivateCatalogServicePrompt(prompt) && !hasExplicitParams) {
    return null;
  }

  if (isProviderSkillRemovalPrompt(prompt)) return null;
  if (/\bpackage\b/i.test(prompt)) return null;

  const scopeFromPrompt = parseCategoryScopeFromPrompt(prompt);
  const allInCategory =
    params.allInCategory === true || scopeFromPrompt.allInCategory === true;
  const categoryName =
    (typeof params.categoryName === 'string' && params.categoryName.trim()) ||
    scopeFromPrompt.categoryName;

  if (allInCategory && categoryName) {
    return { categoryName, allInCategory: true };
  }

  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    parseSingleServiceNameFromDeactivatePrompt(prompt);

  if (serviceName) {
    return { serviceName };
  }

  if (hasExplicitParams && categoryName) {
    return {
      categoryName,
      allInCategory: allInCategory || undefined,
    };
  }

  return hasExplicitParams ? {} : null;
}

export function isDeactivateServiceCategoryScopePrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): boolean {
  const parsed = parseDeactivateServiceCategoryScopeFromPrompt(prompt, params);
  return parsed?.allInCategory === true && !!parsed.categoryName;
}

export function enrichDeactivateServiceCategoryScopeParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseDeactivateServiceCategoryScopeFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
    ...(parsed.allInCategory ? { allInCategory: true } : {}),
    ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
  };
}

export function resolveServicesForDeactivateCategoryScope<
  T extends {
    id: string;
    name: string;
    isActive?: boolean;
    category?: { name: string } | null;
  },
>(services: readonly T[], categoryName: string): T[] {
  const active = services.filter((service) => service.isActive !== false);
  const lower = categoryName.toLowerCase().trim();
  if (!lower) return [];

  const categoryMatches = active.filter((service) => {
    const category = service.category?.name?.toLowerCase() ?? '';
    return category === lower || category.includes(lower);
  });
  if (categoryMatches.length) return categoryMatches;

  return active.filter((service) => service.name.toLowerCase().includes(lower));
}

export function rescueDeactivateServiceCategoryScopeIntent(
  prompt: string,
  action: string,
): { action: 'deactivate_service'; rescueReason: string } | null {
  if (action === 'deactivate_service') return null;
  if (!isDeactivateServiceCategoryScopePrompt(prompt)) return null;
  return {
    action: 'deactivate_service',
    rescueReason: 'deactivate_service_category_scope',
  };
}
