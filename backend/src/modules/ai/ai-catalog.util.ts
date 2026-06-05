import { PackageDiscountType } from '../service-packages/entities/service-package.entity.js';

export const CATALOG_MUTATE_INTENTS = [
  'create_service_category',
  'bulk_create_catalog',
  'deactivate_service',
  'create_package',
  'update_package',
  'deactivate_package',
  'duplicate_package',
  'create_subscription_plan',
  'update_subscription_plan',
  'deactivate_subscription_plan',
  'assign_subscription_to_customer',
  'configure_gift_card_products',
  'create_gift_card_bundle',
  'configure_multi_service_settings',
  'set_service_compatibility',
] as const;

export const CATALOG_READ_INTENTS = [
  'list_packages',
  'list_subscription_plans',
] as const;

export const CATALOG_INTENTS = [
  ...CATALOG_MUTATE_INTENTS,
  ...CATALOG_READ_INTENTS,
] as const;

export type CatalogIntent = (typeof CATALOG_INTENTS)[number];

import type { AppLocale } from '../../common/i18n/messages.js';
import type { LocalizedNamesMap } from '../../common/i18n/service-localized-names.util.js';

export interface CatalogServiceDraft {
  serviceName: string;
  durationMinutes: number;
  price: number;
  description?: string;
  bufferMinutes?: number;
  currency?: string;
  localizedNames?: LocalizedNamesMap;
}

export interface CatalogCategoryDraft {
  categoryName: string;
  description?: string;
  services: CatalogServiceDraft[];
  localizedNames?: LocalizedNamesMap;
}

export interface CatalogCompoundStep {
  action: CatalogIntent;
  params: Record<string, unknown>;
  segment: string;
}

const CATALOG_VERB =
  /\b(create|add|bulk|configure|enable|deactivate|duplicate|update|assign|list|set|hide|block)\b/i;

const COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+(?=(?:add|create|enable|configure|deactivate|duplicate|update|assign|set|hide)\b)/i;

export function isCatalogIntent(action: string): action is CatalogIntent {
  return (CATALOG_INTENTS as readonly string[]).includes(action);
}

export function isBulkCreateCatalogPrompt(prompt: string): boolean {
  const hasCountedServices = /\b\d{1,2}\s+(?:linked\s+)?services?\b/i.test(
    prompt,
  );
  const hasServiceLines = parseServiceLinesFromText(prompt).length > 0;
  const hasCategoryContext =
    /\b(?:create|add|adding)\s+(?:a\s+)?(?:new\s+)?(?:service\s+)?category\b/i.test(
      prompt,
    ) ||
    /\badding\s+(?:a\s+)?(?:new\s+)?[A-Za-z][\w\s&'-]+\s+category\b/i.test(
      prompt,
    ) ||
    /\bnew\s+[A-Za-z][\w\s&'-]+\s+(?:service\s+)?category\b/i.test(prompt);
  if (hasCategoryContext) return hasServiceLines || hasCountedServices;
  if (!/\b(?:create|add)\s+(?:category|catalog)\b/i.test(prompt)) return false;
  return hasServiceLines;
}

export function isCreateServiceCategoryPrompt(prompt: string): boolean {
  return (
    /\b(add|create)\s+(a\s+)?(service\s+)?category\b/i.test(prompt) &&
    !isBulkCreateCatalogPrompt(prompt)
  );
}

export function isDeactivateServicePrompt(prompt: string): boolean {
  return (
    /\b(hide|deactivate|disable|remove)\b/i.test(prompt) &&
    /\b(from\s+public|service|offering|catalog)\b/i.test(prompt) &&
    !/\bpackage\b/i.test(prompt)
  );
}

export function isCreatePackagePrompt(prompt: string): boolean {
  return (
    /\b(create|add)\s+(?:the\s+)?[\w\s]+\s+package\b/i.test(prompt) &&
    !/\b(booking|visit|appointment)\b/i.test(prompt)
  );
}

export function isUpdatePackagePrompt(prompt: string): boolean {
  return /\b(update|change|edit)\s+(the\s+)?\w*\s*package\b/i.test(prompt);
}

export function isDeactivatePackagePrompt(prompt: string): boolean {
  return /\b(deactivate|hide|disable|archive)\s+(the\s+)?\w*\s*package\b/i.test(
    prompt,
  );
}

export function isDuplicatePackagePrompt(prompt: string): boolean {
  return /\b(duplicate|copy|clone)\s+(the\s+)?\w*\s*package\b/i.test(prompt);
}

export function isListPackagesPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\bpackages?\b/i.test(prompt) &&
    !/\b(visit|visits|booking|appointments?)\b/i.test(prompt)
  );
}

export function isCreateSubscriptionPlanPrompt(prompt: string): boolean {
  return (
    (/\b(create|add)\b/i.test(prompt) &&
      /\bplan\b/i.test(prompt) &&
      (/\b\d+[\s-]?(?:month|mo)\b/i.test(prompt) ||
        /\bvisits?\b/i.test(prompt) ||
        /\b(subscription|membership)\b/i.test(prompt))) ||
    (/\b(subscription|membership)\s+plan\b/i.test(prompt) &&
      /\b(create|add)\b/i.test(prompt))
  );
}

export function isUpdateSubscriptionPlanPrompt(prompt: string): boolean {
  return /\b(update|change|edit)\s+(the\s+)?\w*\s*(subscription|membership)\s+plan\b/i.test(
    prompt,
  );
}

export function isDeactivateSubscriptionPlanPrompt(prompt: string): boolean {
  return /\b(deactivate|disable|archive)\s+(the\s+)?\w*\s*(subscription|membership)\s+plan\b/i.test(
    prompt,
  );
}

export function isListSubscriptionPlansPrompt(prompt: string): boolean {
  return (
    /\b(list|show)\b/i.test(prompt) &&
    /\b(subscription|membership)\s+plans?\b/i.test(prompt)
  );
}

export function isAssignSubscriptionPrompt(prompt: string): boolean {
  return (
    /\b(assign|give|enroll)\b/i.test(prompt) &&
    /\b(subscription|membership|plan)\b/i.test(prompt) &&
    !/\b(create|add)\s+(?:a\s+)?(?:\d+[\s-]?(?:month|mo)\s+)?/i.test(prompt)
  );
}

export function isConfigureGiftCardProductsPrompt(prompt: string): boolean {
  return (
    /\b(enable|configure|set up|setup)\b/i.test(prompt) &&
    /\b(gift\s*card|preset)\b/i.test(prompt)
  );
}

export function isCreateGiftCardBundlePrompt(prompt: string): boolean {
  return (
    /\b(create|add|sell)\b/i.test(prompt) &&
    /\b(gift\s*card\s+)?bundle\b/i.test(prompt)
  );
}

export function isConfigureMultiServiceSettingsPrompt(prompt: string): boolean {
  return (
    /\b(enable|configure|set)\b/i.test(prompt) &&
    /\bmulti[\s-]?service\b/i.test(prompt) &&
    /\b(booking|settings?|max|limit)\b/i.test(prompt)
  );
}

export function isSetServiceCompatibilityPrompt(prompt: string): boolean {
  return (
    /\b(block|prevent|incompatible|cannot)\b/i.test(prompt) &&
    /\b(same\s+visit|together|combo)\b/i.test(prompt)
  );
}

export function isCatalogCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !CATALOG_VERB.test(trimmed)) return false;
  if (
    isBulkCreateCatalogPrompt(prompt) &&
    /\b\d{1,2}\s+(?:linked\s+)?services?\b/i.test(prompt)
  ) {
    return false;
  }
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeCatalogCompoundPrompt(trimmed).length > 1
  );
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueCatalogIntent(
  prompt: string,
  action: string,
): { action: CatalogIntent; rescueReason: string } | null {
  if (isCatalogCompoundPrompt(prompt) && action !== 'compound_intent') {
    return null;
  }
  if (
    isBulkCreateCatalogPrompt(prompt) &&
    action !== 'create_services' &&
    action !== 'create_service'
  ) {
    return { action: 'bulk_create_catalog', rescueReason: 'bulk_catalog' };
  }
  if (
    isCreateServiceCategoryPrompt(prompt) &&
    action !== 'create_service_category' &&
    (action === 'unknown' ||
      action === 'create_service' ||
      action === 'create_services')
  ) {
    return {
      action: 'create_service_category',
      rescueReason: 'service_category',
    };
  }
  if (isListPackagesPrompt(prompt)) {
    return { action: 'list_packages', rescueReason: 'list_packages' };
  }
  if (isListSubscriptionPlansPrompt(prompt)) {
    return {
      action: 'list_subscription_plans',
      rescueReason: 'list_subscription_plans',
    };
  }
  if (
    isAssignSubscriptionPrompt(prompt) &&
    action !== 'create_booking_subscription_credit'
  ) {
    return {
      action: 'assign_subscription_to_customer',
      rescueReason: 'assign_subscription',
    };
  }
  if (isDeactivatePackagePrompt(prompt)) {
    return { action: 'deactivate_package', rescueReason: 'deactivate_package' };
  }
  if (isDuplicatePackagePrompt(prompt)) {
    return { action: 'duplicate_package', rescueReason: 'duplicate_package' };
  }
  if (isUpdatePackagePrompt(prompt)) {
    return { action: 'update_package', rescueReason: 'update_package' };
  }
  if (
    isCreatePackagePrompt(prompt) &&
    action !== 'create_package' &&
    (action === 'unknown' ||
      action === 'create_package_booking' ||
      action === 'create_booking')
  ) {
    return { action: 'create_package', rescueReason: 'create_package' };
  }
  if (isDeactivateSubscriptionPlanPrompt(prompt)) {
    return {
      action: 'deactivate_subscription_plan',
      rescueReason: 'deactivate_subscription_plan',
    };
  }
  if (isUpdateSubscriptionPlanPrompt(prompt)) {
    return {
      action: 'update_subscription_plan',
      rescueReason: 'update_subscription_plan',
    };
  }
  if (isCreateSubscriptionPlanPrompt(prompt)) {
    return {
      action: 'create_subscription_plan',
      rescueReason: 'create_subscription_plan',
    };
  }
  if (isConfigureGiftCardProductsPrompt(prompt)) {
    return {
      action: 'configure_gift_card_products',
      rescueReason: 'gift_card_products',
    };
  }
  if (isCreateGiftCardBundlePrompt(prompt)) {
    return {
      action: 'create_gift_card_bundle',
      rescueReason: 'gift_card_bundle',
    };
  }
  if (isConfigureMultiServiceSettingsPrompt(prompt)) {
    return {
      action: 'configure_multi_service_settings',
      rescueReason: 'multi_service_settings',
    };
  }
  if (isSetServiceCompatibilityPrompt(prompt)) {
    return {
      action: 'set_service_compatibility',
      rescueReason: 'service_compatibility',
    };
  }
  if (isDeactivateServicePrompt(prompt) && action !== 'update_service_prices') {
    return { action: 'deactivate_service', rescueReason: 'deactivate_service' };
  }
  return null;
}

const SERVICE_LINE =
  /([^,;]+?)\s+(\d+)\s*(?:m|min(?:ute)?s?)\s*(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)/gi;

export function parseServiceLinesFromText(text: string): CatalogServiceDraft[] {
  const services: CatalogServiceDraft[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(SERVICE_LINE.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    const name = match[1].replace(/^[\s:-]+|[\s:-]+$/g, '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    services.push({
      serviceName: name,
      durationMinutes: Math.max(10, parseInt(match[2], 10)),
      price: parseFloat(match[3]),
    });
  }
  return services;
}

const LOCALE_ALIASES: Record<string, AppLocale> = {
  en: 'en',
  english: 'en',
  hy: 'hy',
  armenian: 'hy',
  ru: 'ru',
  russian: 'ru',
};

export function parseCatalogServiceCountFromPrompt(
  prompt: string,
): number | undefined {
  const linked = prompt.match(/\b(\d{1,2})\s+linked\s+services?\b/i);
  if (linked) return Math.min(25, Math.max(1, parseInt(linked[1], 10)));
  const createN = prompt.match(/\b(?:create|add)\s+(\d{1,2})\s+services?\b/i);
  if (createN) return Math.min(25, Math.max(1, parseInt(createN[1], 10)));
  const nServices = prompt.match(/\b(\d{1,2})\s+services?\b/i);
  if (nServices && /\b(category|catalog|linked)\b/i.test(prompt)) {
    return Math.min(25, Math.max(1, parseInt(nServices[1], 10)));
  }
  return undefined;
}

export function parseLocalizedNamesFromPrompt(
  prompt: string,
): LocalizedNamesMap | undefined {
  const result: LocalizedNamesMap = {};
  const localeList = prompt.match(
    /\b(?:translations?|translate|localized?(?:\s+names?)?)\s+(?:in|for|to)?\s*([a-zA-Z\u0400-\u04FF\u0530-\u058F,\s]+?)(?:\s+and\s+add|\s+for\s+(?:the\s+)?(?:category|services?)|$)/i,
  );
  if (localeList?.[1]) {
    for (const token of localeList[1].split(/,|\band\b/i)) {
      const locale = LOCALE_ALIASES[token.trim().toLowerCase()];
      if (locale) result[locale] = [];
    }
  }
  const pairs = prompt.matchAll(
    /\b(en|english|hy|armenian|ru|russian)\s*[:=]\s*["']?([^"',\n;]+?)["']?(?=\s*(?:,|;|\band\b|\.|$))/gi,
  );
  for (const match of pairs) {
    const locale = LOCALE_ALIASES[match[1].toLowerCase()];
    const label = match[2]?.trim();
    if (locale && label) result[locale] = [label];
  }
  return Object.keys(result).length ? result : undefined;
}

export function buildCountedCatalogDraft(
  categoryName: string,
  serviceCount: number,
  categoryTranslations?: LocalizedNamesMap,
  serviceTranslationTemplate?: LocalizedNamesMap,
): CatalogCategoryDraft {
  const services: CatalogServiceDraft[] = [];
  for (let i = 1; i <= serviceCount; i++) {
    const baseName = `${categoryName} Service ${i}`;
    const localizedNames = serviceTranslationTemplate
      ? Object.fromEntries(
          Object.entries(serviceTranslationTemplate).map(([locale, names]) => [
            locale,
            names.map((n) => (names.length === 1 ? n : `${n} ${i}`)),
          ]),
        )
      : undefined;
    services.push({
      serviceName: baseName,
      durationMinutes: 30,
      price: 0,
      description: `Linked service ${i} for ${categoryName}`,
      localizedNames,
    });
  }
  return { categoryName, services, localizedNames: categoryTranslations };
}

export function parseBulkCatalogWithCountFromPrompt(
  prompt: string,
): CatalogCategoryDraft | null {
  const count = parseCatalogServiceCountFromPrompt(prompt);
  if (!count) return null;
  const categoryMatch =
    prompt.match(
      /\badding\s+(?:a\s+)?(?:new\s+)?([A-Za-z][\w&'-]+)\s+category\b/i,
    ) ??
    prompt.match(/\bnew\s+([A-Za-z][\w&'-]+)\s+service\s+category\b/i) ??
    prompt.match(
      /\b(?:new\s+)?service\s+category\s+([A-Za-z][\w&'-]+)(?=\s+(?:with\s+\d|linked)|\s*$)/i,
    );
  if (!categoryMatch) return null;
  const categoryName = categoryMatch[1].trim();
  const translations = parseLocalizedNamesFromPrompt(prompt);
  return buildCountedCatalogDraft(
    categoryName,
    count,
    translations,
    translations,
  );
}

export function parseBulkCatalogFromPrompt(
  prompt: string,
): CatalogCategoryDraft | null {
  const categoryMatch =
    prompt.match(
      /\bcategory\s+([A-Za-z][\w\s&'-]{1,40}?)(?:\s+with|\s*:|$)/i,
    ) ??
    prompt.match(
      /\b(?:catalog|menu)\s+(?:for\s+)?([A-Za-z][\w\s&'-]{1,40}?)(?:\s+with|\s*:|$)/i,
    );
  if (!categoryMatch) return null;

  const servicesText =
    prompt.split(/:\s*/).slice(1).join(':') ||
    prompt.replace(/.*\bwith\s+services?\s*:?\s*/i, '');
  const services = parseServiceLinesFromText(servicesText);
  if (!services.length) return null;

  return {
    categoryName: categoryMatch[1].trim(),
    services,
  };
}

export function extractPackageServiceNames(prompt: string): string[] {
  const plusSection = prompt.match(
    /\b(?:with|includes?|:)\s+(.+?)(?:\s+\d+\s*%|\s+off|\s+expires?|$)/i,
  );
  const raw = plusSection?.[1] ?? prompt;
  return raw
    .split(/\s*\+\s*|\s+and\s+/i)
    .map((s) => s.replace(/\b\d+\s*%?\s*off\b/gi, '').trim())
    .filter((s) => s.length > 1 && !/^\d/.test(s) && !/\bpackage\b/i.test(s));
}

export function extractDiscountFromPrompt(prompt: string): {
  discountType: PackageDiscountType;
  discountValue: number;
} | null {
  const fixed = prompt.match(/\$\s*(\d+(?:\.\d+)?)\s*off/i);
  if (fixed) {
    return {
      discountType: PackageDiscountType.FIXED,
      discountValue: parseFloat(fixed[1]),
    };
  }
  const percent = prompt.match(/(\d+(?:\.\d+)?)\s*%?\s*off/i);
  if (percent) {
    return {
      discountType: PackageDiscountType.PERCENT,
      discountValue: parseFloat(percent[1]),
    };
  }
  return null;
}

export function extractExpiresAtFromPrompt(prompt: string): string | null {
  const iso = prompt.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dec = prompt.match(
    /\bexpires?\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2}(?:,?\s+20\d{2})?)\b/i,
  );
  return dec ? dec[1] : null;
}

export function extractPresetAmounts(prompt: string): number[] {
  const amounts: number[] = [];
  const dollarMatches = prompt.matchAll(/\$\s*(\d+)/g);
  for (const m of dollarMatches) {
    const n = parseInt(m[1], 10);
    if (n > 0) amounts.push(n);
  }
  return [...new Set(amounts)];
}

export function extractMultiServiceLimits(prompt: string): {
  maxServiceCount?: number;
  maxDurationMinutes?: number;
} {
  const maxServices = prompt.match(/\bmax(?:imum)?\s+(\d+)\s+services?\b/i);
  const maxDuration = prompt.match(
    /\b(\d+)\s*(?:min(?:ute)?s?|m)\s+(?:max|limit|cap)\b/i,
  );
  return {
    maxServiceCount: maxServices ? parseInt(maxServices[1], 10) : undefined,
    maxDurationMinutes: maxDuration ? parseInt(maxDuration[1], 10) : undefined,
  };
}

function classifyCatalogSegment(segment: string): CatalogCompoundStep | null {
  const text = segment.trim();

  if (isBulkCreateCatalogPrompt(text)) {
    const draft =
      parseBulkCatalogFromPrompt(text) ??
      parseBulkCatalogWithCountFromPrompt(text);
    return {
      action: 'bulk_create_catalog',
      params: draft ? { catalogDraft: draft } : {},
      segment: text,
    };
  }
  if (isCreateServiceCategoryPrompt(text)) {
    const name = text.match(/\bcategory\s+([A-Za-z][\w\s&'-]+)/i)?.[1]?.trim();
    return {
      action: 'create_service_category',
      params: { categoryName: name ?? null },
      segment: text,
    };
  }
  if (isCreatePackagePrompt(text)) {
    const packageName =
      text
        .match(
          /\b(?:create|add)\s+(?:the\s+)?([A-Za-z][\w\s]+)\s+package\b/i,
        )?.[1]
        ?.trim() ??
      text
        .match(/\bpackage\s+([A-Za-z][\w\s]+?)(?:\s+with|\s*:|$)/i)?.[1]
        ?.trim();
    return {
      action: 'create_package',
      params: {
        packageName,
        serviceNames: extractPackageServiceNames(text),
        ...extractDiscountFromPrompt(text),
        expiresAt: extractExpiresAtFromPrompt(text),
      },
      segment: text,
    };
  }
  if (isCreateSubscriptionPlanPrompt(text)) {
    const months = text.match(/(\d+)[\s-]?(?:month|mo)/i);
    const visits = text.match(/(\d+)\s+visits?/i);
    const service = text.match(/\bfor\s+([A-Za-z][\w\s]+?)(?:\s+plan|\s*$)/i);
    return {
      action: 'create_subscription_plan',
      params: {
        planName: text.match(/\bplan\s+([A-Za-z][\w\s]+)/i)?.[1]?.trim(),
        durationMonths: months ? parseInt(months[1], 10) : undefined,
        includedAppointments: visits ? parseInt(visits[1], 10) : undefined,
        serviceName: service?.[1]?.trim(),
        ...extractDiscountFromPrompt(text),
      },
      segment: text,
    };
  }
  if (isConfigureGiftCardProductsPrompt(text)) {
    return {
      action: 'configure_gift_card_products',
      params: {
        presetAmounts: extractPresetAmounts(text),
        purchaseEnabled: true,
      },
      segment: text,
    };
  }
  if (isConfigureMultiServiceSettingsPrompt(text)) {
    return {
      action: 'configure_multi_service_settings',
      params: { enabled: true, ...extractMultiServiceLimits(text) },
      segment: text,
    };
  }
  if (isSetServiceCompatibilityPrompt(text)) {
    const names = extractPackageServiceNames(text);
    return {
      action: 'set_service_compatibility',
      params: { incompatibleServiceNames: names.slice(0, 2) },
      segment: text,
    };
  }
  if (isDeactivateServicePrompt(text)) {
    const svc = text
      .match(/\b(?:service|hide|deactivate)\s+([A-Za-z][\w\s]+)/i)?.[1]
      ?.trim();
    return {
      action: 'deactivate_service',
      params: { serviceName: svc },
      segment: text,
    };
  }
  return null;
}

/** Deterministic multi-command split for catalog operations. */
export function decomposeCatalogCompoundPrompt(
  prompt: string,
): CatalogCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed
    .split(COMPOUND_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const single = classifyCatalogSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: CatalogCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyCatalogSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
