import { PackageDiscountType } from '../service-packages/entities/service-package.entity.js';
import {
  findServiceByExactName,
  fuzzyMatchServiceByName,
} from './ai-orchestration.helpers.js';
import {
  enrichCreateServicePrepaymentParamsFromPrompt,
  enrichCreateServicesPrepaymentParamsFromPrompt,
} from './ai-create-service-prepayment.util.js';
import {
  isCatalogNotifyCustomersPrompt,
  isCatalogNotifyExplicitSkipPrompt,
} from './ai-catalog-notify.util.js';
import { isConfigureServiceOnlinePaymentPrompt } from './ai-service-online-payment.util.js';
import {
  isUpdateServiceDurationBufferPrompt,
  rescueUpdateServiceDurationBufferIntent,
  enrichServiceDurationBufferParamsFromPrompt,
} from './ai-service-duration-buffer.util.js';
import {
  isConfigureServiceFeaturedPrompt,
  rescueConfigureServiceFeaturedIntent,
} from './ai-configure-service-featured.util.js';
import {
  isBulkAssignServicesCategoryPrompt,
  rescueBulkAssignServicesCategoryIntent,
} from './ai-bulk-assign-services-category.util.js';
import {
  isConfigurePackageOnlinePaymentPrompt,
  rescueConfigurePackageOnlinePaymentIntent,
} from './ai-configure-package-online-payment.util.js';
import {
  enrichDeactivateServiceCategoryScopeParamsFromPrompt,
  rescueDeactivateServiceCategoryScopeIntent,
} from './ai-deactivate-service-category-scope.util.js';

export const CATALOG_MUTATE_INTENTS = [
  'create_service_category',
  'update_service_category',
  'delete_service_category',
  'bulk_create_catalog',
  'update_service',
  'update_service_duration_buffer',
  'deactivate_service',
  'create_package',
  'update_package',
  'deactivate_package',
  'activate_package',
  'duplicate_package',
  'create_subscription_plan',
  'update_subscription_plan',
  'deactivate_subscription_plan',
  'activate_subscription_plan',
  'assign_subscription_to_customer',
  'configure_gift_card_products',
  'create_gift_card_bundle',
  'configure_multi_service_settings',
  'set_service_compatibility',
  'configure_service_featured',
  'bulk_assign_services_category',
  'configure_package_online_payment',
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
  // e2e-bug.151 — allow "Add a new service category called …" (optional "new").
  return (
    /\b(add|create)\s+(a\s+)?(new\s+)?(service\s+)?category\b/i.test(prompt) &&
    !isBulkCreateCatalogPrompt(prompt)
  );
}

/** e2e-bug.144 — natural "delete/remove service" maps to soft-delete deactivate_service. */
export function isDeactivateServicePrompt(prompt: string): boolean {
  if (isConfigureServiceOnlinePaymentPrompt(prompt)) return false;
  if (/\bpackage\b/i.test(prompt)) return false;
  // Real cart remove only — ignore "not a cart …" disambiguation.
  if (
    /\b(?:from|in|to)\s+(?:the\s+|my\s+)?(?:cart|basket)\b/i.test(prompt) &&
    !/\bnot\s+a\s+cart\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\bunassign\b/i.test(prompt)) return false;
  if (
    /\bfrom\s+(?:service\s+)?(?:provider|employee|stylist|team\s+member)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  // Provider skill removal: "Remove X from Maria" — not catalog soft-delete.
  if (
    /\bfrom\s+[A-Z][a-z][\w'-]*(?:\s+[A-Z][a-z][\w'-]*)?\b/.test(prompt) &&
    !/\bfrom\s+(?:my|the|our|public|service|business)\b/i.test(prompt)
  ) {
    return false;
  }

  const hasVerb = /\b(hide|deactivate|disable|remove|delete)\b/i.test(prompt);
  if (!hasVerb) return false;

  // "Delete the service called X" / "Delete service X from the catalog"
  if (
    /\b(?:delete|remove|deactivate|hide|disable)\s+(?:the\s+)?service\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:delete|remove|deactivate|hide|disable)\b/i.test(prompt) &&
    /\bservices?\b/i.test(prompt) &&
    /\b(?:catalog|service\s+menu|public\s+booking|business\s+catalog|permanently|offering)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  // Legacy hide/deactivate ("Hide balayage from public booking").
  if (
    /\b(hide|deactivate|disable)\b/i.test(prompt) &&
    /\b(from\s+public|service|offering|catalog)\b/i.test(prompt)
  ) {
    return true;
  }
  // "Remove X from public/catalog" — not "Remove X from Maria" (unassign).
  return (
    /\bremove\b/i.test(prompt) &&
    /\b(?:from\s+public|catalog|service\s+menu|permanently)\b/i.test(prompt)
  );
}

export function extractDeactivateServiceNameFromPrompt(
  prompt: string,
): string | null {
  const patterns = [
    /\b(?:delete|remove|deactivate|hide|disable)\s+(?:the\s+)?service\s+(?:called|named)\s+["']?([^"'.,]+?)["']?(?=\s*[.?!]|$)/i,
    /\b(?:delete|remove|deactivate|hide|disable)\s+(?:the\s+)?service\s+["']?([^"'.,]+?)["']?(?=\s+from\b|\s*[.?!]|$)/i,
    /\b(?:delete|remove|deactivate|hide|disable)\s+(?:the\s+)?["']?([^"'.,]+?)["']?\s+service\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]
      ?.replace(/^["']|["']$/g, '')
      .replace(/\s+service$/i, '')
      .trim();
    if (
      name &&
      name.length >= 2 &&
      name.length <= 80 &&
      !/^(all|every|the|a|an)$/i.test(name)
    ) {
      return name;
    }
  }
  return null;
}

/** "Move Neck Massage under service category: Massage". */
export function isAssignServiceCategoryPrompt(prompt: string): boolean {
  if (isBulkAssignServicesCategoryPrompt(prompt)) return false;
  if (isUpdateServiceDurationBufferPrompt(prompt)) return false;
  if (isDeactivateServicePrompt(prompt)) return false;
  if (/\b(?:senior|junior|provider|employee|staff)\b/i.test(prompt)) {
    return false;
  }
  const hasCategory =
    /\b(?:service\s+)?category\b/i.test(prompt) ||
    /\bunder\s+[A-Za-z][\w\s&'-]+\s+category\b/i.test(prompt);
  const hasMove =
    /\b(?:move|put|place|assign|reassign|relocate|add)\b/i.test(prompt) &&
    /\b(?:under|in|into|to)\b/i.test(prompt);
  return hasCategory && hasMove;
}

export function parseAssignServiceCategoryFromPrompt(prompt: string): {
  serviceName?: string;
  categoryName?: string;
} {
  const patterns = [
    /\b(?:move|put|place|assign|reassign|relocate|add)\s+(.+?)\s+(?:under|in|into|to)\s+(?:the\s+)?(?:service\s+)?category\s*:?\s*(.+)$/i,
    /\b(?:move|put|place|assign|reassign|relocate|add)\s+(.+?)\s+(?:under|in|into|to)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\b(?:move|put|place|assign|reassign|relocate)\s+(.+?)\s+to\s+category\s+([A-Za-z][\w\s&'-]+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match) continue;
    const serviceName = match[1]?.replace(/^["']|["']$/g, '').trim();
    const categoryName = match[2]?.replace(/^["']|["']$/g, '').trim();
    if (serviceName && categoryName) {
      return { serviceName, categoryName };
    }
  }

  return {};
}

/** Category scope when creating a catalog service (not a category entity). */
export function extractCreateServiceCategoryFromPrompt(
  prompt: string,
): string | undefined {
  const patterns = [
    // e2e-bug.151 — "Add a new service category called Wellness"
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?(?:service\s+)?category\s+(?:called|named)\s+["']?([A-Za-z][\w\s&'-]+?)["']?\s*$/i,
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?(?:service\s+)?category\s+["']([A-Za-z][\w\s&'-]+?)["']/i,
    /\b(?:under|in|into|within)\s+(?:the\s+)?(?:service\s+)?category\s*:?\s*([A-Za-z][\w\s&'-]+)/i,
    /\b(?:under|in|into|within)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:service\s+)?category\b/i,
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?service\b[^.]*\bcategory\s*:?\s*([A-Za-z][\w\s&'-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.trim();
    if (name && !/^(?:called|named)$/i.test(name)) return name;
  }

  return undefined;
}

const CREATE_SERVICE_VERB =
  '(?:create|add|register|list|offer|introduce|set\\s+up)';
const CREATE_SERVICE_NOUN = '(?:service|offering|treatment)s?';
const CREATE_SERVICE_NAME_STOP =
  /(?:\s*,|\s+price\b|\s+duration\b|\s+for\s+\$|\s+\$\s*\d|\s+\d+\s*(?:min(?:ute)?s?|m)\b|\s+under\b|\s+with\s+\d+\s*%|\s+with\s+(?:full|deposit|online)\s+prepayment|\s+—\s+|\s+no\s+online\b|\s+requiring\s+online\b|\s+in\s+(?:the\s+)?(?:service\s+)?category\b)/i;

function trimCreateServiceNameSegment(raw: string): string | undefined {
  let name = raw.trim().replace(/^["']|["']$/g, '');
  const stop = name.search(CREATE_SERVICE_NAME_STOP);
  if (stop >= 0) name = name.slice(0, stop);
  name = name.trim().replace(/[,.]$/, '').trim();
  return name.length >= 2 ? name : undefined;
}

function extractCreateServiceNameSegmentFromPrompt(
  prompt: string,
): string | undefined {
  const colon = prompt.match(
    new RegExp(
      `\\b${CREATE_SERVICE_VERB}\\s+(?:a\\s+)?(?:new\\s+)?${CREATE_SERVICE_NOUN}\\s*:\\s*(.+)$`,
      'i',
    ),
  );
  if (colon?.[1]) {
    const segment = trimCreateServiceNameSegment(colon[1]);
    if (segment) return segment;
  }

  const unquoted = prompt.match(
    new RegExp(
      `\\b${CREATE_SERVICE_VERB}\\s+(?:a\\s+)?(?:new\\s+)?${CREATE_SERVICE_NOUN}\\s+(?:called\\s+|named\\s+)?(.+?)${CREATE_SERVICE_NAME_STOP.source}`,
      'i',
    ),
  );
  return unquoted?.[1] ? trimCreateServiceNameSegment(unquoted[1]) : undefined;
}

/** Extract the new catalog service name from create_service prompts (quoted or before price/duration). */
export function extractCreateServiceNameFromPrompt(
  prompt: string,
): string | undefined {
  const quotedPatterns = [
    new RegExp(
      `\\b${CREATE_SERVICE_VERB}\\s+(?:a\\s+)?(?:new\\s+)?${CREATE_SERVICE_NOUN}\\s+(?:called\\s+|named\\s+)?"([^"]+)"`,
      'i',
    ),
    new RegExp(
      `\\b${CREATE_SERVICE_VERB}\\s+(?:a\\s+)?(?:new\\s+)?${CREATE_SERVICE_NOUN}\\s+(?:called\\s+|named\\s+)?'((?:[^']|'[a-z])+)'`,
      'i',
    ),
    /\bservices?\s+(?:called\s+|named\s+)?"([^"]+)"/i,
    /\bservices?\s+(?:called\s+|named\s+)?'((?:[^']|'[a-z])+)'/i,
  ];
  for (const pattern of quotedPatterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.trim();
    if (name) return name;
  }

  return extractCreateServiceNameSegmentFromPrompt(prompt);
}

/** Prefer prompt-derived new service names over classifier snaps to existing catalog rows. */
export function reconcileCreateServiceNameFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
  existingServices: Array<{ name: string }>,
): void {
  const extracted = extractCreateServiceNameFromPrompt(prompt);
  if (extracted) {
    params.serviceName = extracted;
    delete params.serviceId;
    return;
  }

  const proposed =
    typeof params.serviceName === 'string' ? params.serviceName.trim() : '';
  if (!proposed || findServiceByExactName(existingServices, proposed)) {
    return;
  }

  const fuzzy = fuzzyMatchServiceByName(existingServices, proposed);
  if (!fuzzy) return;

  const segment = extractCreateServiceNameSegmentFromPrompt(prompt);
  if (
    segment &&
    segment.length > fuzzy.name.length &&
    !findServiceByExactName(existingServices, segment)
  ) {
    params.serviceName = segment;
    delete params.serviceId;
  }
}

export function enrichCreateServicesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): void {
  enrichServiceCategoryRescueParams('create_services', params, prompt);
  Object.assign(
    params,
    enrichCreateServicesPrepaymentParamsFromPrompt(params, prompt),
  );
}

export function enrichCreateServiceParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
  existingServices: Array<{ name: string }>,
): void {
  enrichServiceCategoryRescueParams('create_service', params, prompt);
  reconcileCreateServiceNameFromPrompt(prompt, params, existingServices);
  Object.assign(
    params,
    enrichCreateServicePrepaymentParamsFromPrompt(params, prompt),
  );
}

export function enrichServiceCategoryRescueParams(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): void {
  if (action === 'update_service') {
    const parsed = parseAssignServiceCategoryFromPrompt(prompt);
    if (parsed.serviceName && !params.serviceName) {
      params.serviceName = parsed.serviceName;
    }
    if (parsed.categoryName && !params.categoryName) {
      params.categoryName = parsed.categoryName;
    }
    return;
  }

  if (
    action === 'create_service' ||
    action === 'create_services' ||
    action === 'create_service_category'
  ) {
    const categoryName = extractCreateServiceCategoryFromPrompt(prompt);
    if (categoryName && !params.categoryName) {
      params.categoryName = categoryName;
    }
    if (action === 'create_service') {
      const serviceName = extractCreateServiceNameFromPrompt(prompt);
      if (serviceName) {
        params.serviceName = serviceName;
        delete params.serviceId;
      }
    }
  }
}

export function isCreatePackagePrompt(prompt: string): boolean {
  if (/\b(booking|visit|appointment)\b/i.test(prompt)) return false;
  // Gift-card product create — never treat as service package (e2e-bug.157).
  if (/\bgift\s*card\b/i.test(prompt) && !/\bpackage\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(create|add)\s+(?:a\s+|the\s+|new\s+)*package\b/i.test(prompt) ||
    /\b(create|add)\s+(?:the\s+)?[\w\s«»]+\s+package\b/i.test(prompt) ||
    (/\bpackage\s+called\b/i.test(prompt) &&
      /\b(create|add|combining|with|includes?)\b/i.test(prompt)) ||
    (/(ստեղծ|ավելաց)/i.test(prompt) && /(փաթեթ|package)/i.test(prompt)) ||
    (/(создай|создать|добав)/i.test(prompt) && /(пакет|package)/i.test(prompt))
  );
}

export function isUpdatePackagePrompt(prompt: string): boolean {
  if (/\b(update|change|edit)\s+(the\s+)?\w*\s*package\b/i.test(prompt)) {
    return true;
  }
  if (/(թարմաց|փոխ)\w*/i.test(prompt) && /(փաթեթ|package)/i.test(prompt)) {
    return true;
  }
  if (/(обнов|измен)\w*/i.test(prompt) && /(пакет|package)/i.test(prompt)) {
    return true;
  }
  return false;
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
      /\b(create|add)\b/i.test(prompt)) ||
    (/(ավելաց|ստեղծ)/i.test(prompt) &&
      /\bplan\b/i.test(prompt) &&
      (/\b\d+[\s-]?(?:month|mo)\b/i.test(prompt) ||
        /\bvisits?\b/i.test(prompt) ||
        /(ամիս|այց)/i.test(prompt))) ||
    (/(добав|создай|создать)/i.test(prompt) &&
      /\bplan\b/i.test(prompt) &&
      (/\b\d+[\s-]?(?:month|mo|месяц)/i.test(prompt) ||
        /\bvisits?\b/i.test(prompt) ||
        /(визит|месяц)/i.test(prompt)))
  );
}

export function isUpdateSubscriptionPlanPrompt(prompt: string): boolean {
  if (/\b(assign|give|enroll)\b/i.test(prompt)) return false;
  if (
    /\b(update|change|edit)\s+(the\s+)?\w*\s*(subscription|membership)\s+plan\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(update|change|edit)\s+(the\s+)?[\w\s-]*\b(subscription|membership)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    (/(թարմաց|փոխ)\w*/i.test(prompt) || /(обнов|измен)\w*/i.test(prompt)) &&
    (/\b(membership|subscription|plan|club)\b/i.test(prompt) ||
      /(անդամակցություն|բաժանորդ)/i.test(prompt) ||
      /(абонемент|подписк)/i.test(prompt))
  ) {
    return true;
  }
  return false;
}

/** Catalog package/plan create or update — exclude from unrelated READ rescues. */
export function isCatalogMutateCommandPrompt(prompt: string): boolean {
  return (
    isCreatePackagePrompt(prompt) ||
    isUpdatePackagePrompt(prompt) ||
    isCreateSubscriptionPlanPrompt(prompt) ||
    isUpdateSubscriptionPlanPrompt(prompt)
  );
}

export function isDeactivateSubscriptionPlanPrompt(prompt: string): boolean {
  return /\b(deactivate|disable|archive)\s+(the\s+)?\w*\s*(subscription|membership)\s+plan\b/i.test(
    prompt,
  );
}

export function isActivateSubscriptionPlanPrompt(prompt: string): boolean {
  return /\b(activate|enable|reactivate|re-activate|turn\s+back\s+on)\s+(the\s+)?\w*\s*(subscription|membership)\s+plan\b/i.test(
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

/**
 * Gift-card bundle product — requires an explicit gift-card cue.
 * e2e-bug.157: bare "bundle" / "package called … Bundle" must NOT match
 * (those are create_package).
 */
export function isCreateGiftCardBundlePrompt(prompt: string): boolean {
  if (isCreatePackagePrompt(prompt)) return false;
  if (/\bpackage\b/i.test(prompt) && !/\bgift\s*card\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(create|add|sell)\b/i.test(prompt) &&
    (/\bgift\s*card\s+bundle\b/i.test(prompt) ||
      (/\bbundle\b/i.test(prompt) && /\bgift\s*card\b/i.test(prompt)))
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
): {
  action: CatalogIntent;
  rescueReason: string;
  params?: Record<string, unknown>;
} | null {
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
  // e2e-bug.151 — also steal back from create_promo_code ("called Wellness" false positive).
  if (
    isCreateServiceCategoryPrompt(prompt) &&
    action !== 'create_service_category'
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
      action === 'create_booking' ||
      // e2e-bug.157 — LLM confuses multi-service packages with gift-card bundles
      action === 'create_gift_card_bundle' ||
      action === 'configure_gift_card_products')
  ) {
    return {
      action: 'create_package',
      rescueReason: 'create_package',
      params: extractCreatePackageParamsFromPrompt(prompt),
    };
  }
  if (isDeactivateSubscriptionPlanPrompt(prompt)) {
    return {
      action: 'deactivate_subscription_plan',
      rescueReason: 'deactivate_subscription_plan',
    };
  }
  if (isActivateSubscriptionPlanPrompt(prompt)) {
    return {
      action: 'activate_subscription_plan',
      rescueReason: 'activate_subscription_plan',
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
  const durationBuffer = rescueUpdateServiceDurationBufferIntent(
    prompt,
    action,
  );
  if (durationBuffer) return durationBuffer;
  const featured = rescueConfigureServiceFeaturedIntent(prompt, action);
  if (featured) return featured;
  const bulkCategory = rescueBulkAssignServicesCategoryIntent(prompt, action);
  if (bulkCategory) return bulkCategory;
  const packageOnlinePayment = rescueConfigurePackageOnlinePaymentIntent(
    prompt,
    action,
  );
  if (packageOnlinePayment) return packageOnlinePayment;
  const categoryDeactivate = rescueDeactivateServiceCategoryScopeIntent(
    prompt,
    action,
  );
  if (categoryDeactivate) {
    return {
      action: 'deactivate_service',
      rescueReason: categoryDeactivate.rescueReason,
      params: enrichDeactivateServiceCategoryScopeParamsFromPrompt({}, prompt),
    };
  }
  if (isDeactivateServicePrompt(prompt) && action !== 'update_service_prices') {
    const params = enrichDeactivateServiceCategoryScopeParamsFromPrompt(
      {},
      prompt,
    );
    const calledName = extractDeactivateServiceNameFromPrompt(prompt);
    if (calledName && !params.serviceName) {
      params.serviceName = calledName;
    }
    return {
      action: 'deactivate_service',
      rescueReason: 'deactivate_service',
      params,
    };
  }
  if (
    isAssignServiceCategoryPrompt(prompt) &&
    action !== 'update_service' &&
    action !== 'assign_employee_services'
  ) {
    const parsed = parseAssignServiceCategoryFromPrompt(prompt);
    return {
      action: 'update_service',
      rescueReason: 'assign_service_category',
      params: {
        serviceName: parsed.serviceName ?? null,
        categoryName: parsed.categoryName ?? null,
      },
    };
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
  const combining = prompt.match(
    /\bcombining\s+(.+?)(?:\s+services?)?(?:\s+for\b|\s+at\b|\s+\$|\s+priced|\s*$)/i,
  );
  const plusSection =
    combining ??
    prompt.match(
      /\b(?:with|includes?|:)\s+(.+?)(?:\s+\d+\s*%|\s+off|\s+expires?|\s+for\b|\s+\$|$)/i,
    );
  const raw = plusSection?.[1] ?? prompt;
  return raw
    .split(/\s*\+\s*|\s+and\s+/i)
    .map((s) =>
      s
        .replace(/\b\d+\s*%?\s*off\b/gi, '')
        .replace(/\bservices?\b/gi, '')
        .replace(/\bfor\s+\d+.*$/i, '')
        .trim(),
    )
    .filter(
      (s) =>
        s.length > 1 &&
        !/^\d/.test(s) &&
        !/\bpackage\b/i.test(s) &&
        !/\bbundle\b/i.test(s) &&
        !/\bcalled\b/i.test(s) &&
        !/\bnew\b/i.test(s) &&
        !/\bcreate\b/i.test(s),
    );
}

/** Params for create_package rescue / compound segments (e2e-bug.157). */
export function extractCreatePackageParamsFromPrompt(
  prompt: string,
): Record<string, unknown> {
  const calledName = prompt
    .match(
      /\b(?:package\s+)?called\s+["«']?([A-Za-z0-9][\w\s-]{0,80}?)["»']?(?=\s+combining|\s+with|\s+includes?|\s+for\b|\s+at\b|\s*$)/i,
    )?.[1]
    ?.trim();
  const packageName =
    calledName ??
    prompt
      .match(
        /\b(?:create|add)\s+(?:a\s+|the\s+|new\s+)*package\s+(?:called\s+)?["«']?([A-Za-z0-9][\w\s-]{0,80}?)["»']?(?=\s+combining|\s+with|\s+includes?|\s+for\b|\s+at\b|\s*$)/i,
      )?.[1]
      ?.trim() ??
    prompt
      .match(
        /\b(?:create|add)\s+(?:the\s+)?([A-Za-z][\w\s]+?)\s+package\b/i,
      )?.[1]
      ?.trim() ??
    prompt
      .match(/\bpackage\s+([A-Za-z][\w\s]+?)(?:\s+with|\s*:|$)/i)?.[1]
      ?.trim();

  const serviceNames = extractPackageServiceNames(prompt);
  const discount = extractDiscountFromPrompt(prompt);

  return {
    ...(packageName ? { packageName } : {}),
    ...(serviceNames.length ? { serviceNames } : {}),
    ...(discount ?? {}),
    expiresAt: extractExpiresAtFromPrompt(prompt),
    ...catalogNotifyParamsFromPrompt(prompt),
  };
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

function catalogNotifyParamsFromPrompt(text: string): Record<string, unknown> {
  if (isCatalogNotifyExplicitSkipPrompt(text)) {
    return { notifyCustomers: false };
  }
  if (isCatalogNotifyCustomersPrompt(text)) {
    return { notifyCustomers: true };
  }
  return {};
}

function extractPackageNameFromUpdatePrompt(text: string): string | undefined {
  return (
    text
      .match(
        /\b(?:update|change|edit)\s+(?:the\s+)?([A-Za-z][\w\s]+?)\s+package\b/i,
      )?.[1]
      ?.trim() ??
    text
      .match(
        /(?:обнов|измен)\w*\s+(?:the\s+)?(?:пакет\s+)?([A-Za-z][\w\s]+)/i,
      )?.[1]
      ?.trim()
  );
}

function extractPlanNameFromUpdatePrompt(text: string): string | undefined {
  return (
    text
      .match(
        /\b(?:update|change|edit)\s+(?:the\s+)?([A-Za-z][\w\s-]+?)\s+(?:subscription\s+)?(?:membership|plan)\b/i,
      )?.[1]
      ?.trim() ??
    text.match(/\b([A-Za-z][\w\s-]+?)\s+membership\b/i)?.[1]?.trim()
  );
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
    return {
      action: 'create_package',
      params: extractCreatePackageParamsFromPrompt(text),
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
        ...catalogNotifyParamsFromPrompt(text),
      },
      segment: text,
    };
  }
  if (isUpdatePackagePrompt(text)) {
    return {
      action: 'update_package',
      params: {
        packageName: extractPackageNameFromUpdatePrompt(text),
        ...extractDiscountFromPrompt(text),
        ...catalogNotifyParamsFromPrompt(text),
      },
      segment: text,
    };
  }
  if (isUpdateSubscriptionPlanPrompt(text)) {
    return {
      action: 'update_subscription_plan',
      params: {
        planName: extractPlanNameFromUpdatePrompt(text),
        ...extractDiscountFromPrompt(text),
        ...catalogNotifyParamsFromPrompt(text),
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
  if (isConfigureServiceFeaturedPrompt(text)) {
    return {
      action: 'configure_service_featured',
      params: {},
      segment: text,
    };
  }
  if (isBulkAssignServicesCategoryPrompt(text)) {
    return {
      action: 'bulk_assign_services_category',
      params: {},
      segment: text,
    };
  }
  if (isConfigurePackageOnlinePaymentPrompt(text)) {
    return {
      action: 'configure_package_online_payment',
      params: {},
      segment: text,
    };
  }
  if (isUpdateServiceDurationBufferPrompt(text)) {
    return {
      action: 'update_service_duration_buffer',
      params: enrichServiceDurationBufferParamsFromPrompt({}, text),
      segment: text,
    };
  }
  if (isDeactivateServicePrompt(text)) {
    return {
      action: 'deactivate_service',
      params: enrichDeactivateServiceCategoryScopeParamsFromPrompt({}, text),
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
