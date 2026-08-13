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
  isDeactivateServiceCategoryScopePrompt,
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

// e2e-bug.347 — a semicolon only starts a new step when a catalog verb follows
// it. Splitting on every ";" shredded service enumerations ("service A, 30
// minutes, $50; service B, 45 minutes, $45"), so each service line became its
// own "step" and the category link was lost. The "and <verb>" branch already
// required a following verb; the semicolon branch now does too.
// e2e-bug.349 — a sentence boundary starts a new step under the same rule the
// semicolon branch follows: only when a catalog verb (or `under`, which begins
// the "Under <Category> add …" shape below) starts the next sentence. Splitting
// on every "." would shred "(30 min, $50). Turn on …" style enumerations, which
// is the class e2e-bug.347 fixed for semicolons.
//
// `under` is in the lookahead deliberately. Adding the sentence split *without*
// it is a measured no-op on the reported prompt — its sentences begin "Create,
// Under, Under, Turn", so nothing after the first is a verb, and the prompt
// stays one segment. The split and the scoped-category classifier only work
// together.
const CATALOG_STEP_VERBS =
  'add|create|enable|configure|deactivate|duplicate|update|assign|set|hide';
const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*(?=(?:${CATALOG_STEP_VERBS})\\b)` +
    `|\\s+and\\s+(?=(?:${CATALOG_STEP_VERBS})\\b)` +
    `|\\.\\s+(?=(?:${CATALOG_STEP_VERBS}|under)\\b)`,
  'i',
);

/**
 * e2e-bug.349 — `Under <Category> add <service lines>`.
 *
 * The reported dashboard prompt scopes services to a category by sentence
 * ("Under Y add service A (30 min, $50) …") rather than with the
 * "category Y with services: …" shape `parseBulkCatalogFromPrompt` expects.
 * That parser splits on `:` or `with services`, so it returned null and the
 * whole request produced nothing.
 *
 * Maps to the same `bulk_create_catalog` draft, which already creates the
 * category when it does not exist (`ai-catalog.logic.ts` — `if (!category)
 * … categoryService.create`). That is why the prompt's leading
 * "Create categories Y and Z" sentence does not need its own step: each scoped
 * segment creates its own category.
 */
export function parseScopedCategoryLinesFromSegment(
  segment: string,
): CatalogCategoryDraft | null {
  const match = segment
    .trim()
    .match(
      /^under\s+(?:the\s+)?(?:categor(?:y|ies)\s+)?([A-Za-z][\w\s&'-]{0,40}?)\s+add\s+(.+)$/is,
    );
  if (!match) return null;
  const categoryName = match[1].trim();
  const services = parseServiceLinesFromText(match[2]);
  if (!categoryName || !services.length) return null;
  return { categoryName, services };
}

export function isCatalogIntent(action: string): action is CatalogIntent {
  return (CATALOG_INTENTS as readonly string[]).includes(action);
}

export function isBulkCreateCatalogPrompt(prompt: string): boolean {
  const hasCountedServices = /\b\d{1,2}\s+(?:linked\s+)?services?\b/i.test(
    prompt,
  );
  const hasServiceLines = parseServiceLinesFromText(prompt).length > 0;
  const hasCategoryContext =
    // e2e-bug.349 — `categories` as well as `category`. "Create categories Y
    // and Z. Under Y add ..." registered no category context at all, so a
    // dashboard catalog request was left to whatever else would claim it.
    /\b(?:create|add|adding)\s+(?:a\s+)?(?:new\s+)?(?:service\s+)?categor(?:y|ies)\b/i.test(
      prompt,
    ) ||
    /\badding\s+(?:a\s+)?(?:new\s+)?[A-Za-z][\w\s&'-]+\s+categor(?:y|ies)\b/i.test(
      prompt,
    ) ||
    /\bnew\s+[A-Za-z][\w\s&'-]+\s+(?:service\s+)?categor(?:y|ies)\b/i.test(
      prompt,
    );
  if (hasCategoryContext) return hasServiceLines || hasCountedServices;
  if (!/\b(?:create|add)\s+(?:categor(?:y|ies)|catalog)\b/i.test(prompt))
    return false;
  return hasServiceLines;
}

function isHyCreateServiceCategoryPrompt(prompt: string): boolean {
  // e2e-bug.291 — «Ավելացրու կատալոգի կատեգորիա անունով…»
  if (isBulkCreateCatalogPrompt(prompt)) return false;
  if (
    /(?:ավելացր(?:ու|ել|եք)?|ստեղծ(?:իր|ել|եք)?)\s+[\s\S]*կատեգորիա/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  return (
    /կատեգորիա\s+անունով\s+\S/iu.test(prompt) &&
    /(?:ավելացր|ստեղծ|նոր)/iu.test(prompt)
  );
}

function isRuCreateServiceCategoryPrompt(prompt: string): boolean {
  // e2e-bug.292 — «Добавь категорию каталога с названием…» (single category,
  // not bulk_create_catalog with service lines).
  if (isBulkCreateCatalogPrompt(prompt)) return false;
  if (parseServiceLinesFromText(prompt).length > 0) return false;
  // Bulk-style: category + priced service menu in one prompt.
  if (
    /категор/iu.test(prompt) &&
    /\bс\s+услуг/iu.test(prompt) &&
    /(?:\$\s*\d|\d+\s*(?:мин|m(?:in)?)\b)/iu.test(prompt)
  ) {
    return false;
  }
  const hasVerb = /(?:добав(?:ь|ьте|ить)?|созда(?:й|йте|ть)?)/iu.test(prompt);
  const hasCategory = /категор/iu.test(prompt);
  if (!hasVerb || !hasCategory) return false;
  return (
    /(?:с|под)\s+названием/iu.test(prompt) ||
    /категор[\p{L}\p{M}]*\s+каталог/iu.test(prompt) ||
    /(?:новую\s+)?категор[\p{L}\p{M}]*\s+каталог/iu.test(prompt) ||
    /категор[\p{L}\p{M}]*\s*[«"„]/iu.test(prompt)
  );
}

export function isCreateServiceCategoryPrompt(prompt: string): boolean {
  // e2e-bug.151 / e2e-bug.251 — "service category" or "catalog category"
  // (optional "new"); not bulk_create_catalog with service lines.
  // e2e-bug.291 — HY create-category phrasing.
  // e2e-bug.292 — RU create-category phrasing.
  if (isBulkCreateCatalogPrompt(prompt)) return false;
  return (
    /\b(add|create)\s+(a\s+)?(new\s+)?((?:service|catalog)\s+)?category\b/i.test(
      prompt,
    ) ||
    isHyCreateServiceCategoryPrompt(prompt) ||
    isRuCreateServiceCategoryPrompt(prompt)
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
      // e2e-bug.430 — drop a dangling "from the" the lazy capture swallowed.
      //
      // The third pattern ends at `\s+service\b`, so "Disable Deluxe Facial
      // from the service catalog" captures everything up to the *second*
      // occurrence of the word: "Deluxe Facial from the". The second pattern
      // already stops at `from`; this one cannot, because the service word it
      // anchors on comes after.
      .replace(/\s+from(?:\s+(?:the|our|my|your))?$/i, '')
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

/**
 * e2e-bug.271 / e2e-bug.290 — strip voice politeness / softeners so
 * "… E2E271-x please" / "… kindly please" keep the suffix (not "kindly").
 */
const CATEGORY_NAME_TRAILING_POLITENESS =
  '(?:please|kindly|thanks(?:\\s+you)?|thank\\s+you|pls|thx|cheers|appreciate(?:\\s+it)?|пожалуйста|խնդրում\\s+եմ)';

// e2e-bug.338 — a trailing "with N placeholder service(s)" / RU "и N placeholder
// услугами" / "и N услугами-заглушками" count clause must not be absorbed into
// categoryName; placeholderCount itself is parsed separately and unaffected.
const CATEGORY_NAME_TRAILING_PLACEHOLDER_CLAUSE =
  '(?:with|and|и)\\s+\\d+\\s+(?:placeholder\\s+services?|placeholder\\s+услуг\\p{L}*|услуг\\p{L}*[\\s-]*заглушк\\p{L}*)';

const CATEGORY_NAME_TRAILING_EXTRA = `(?:${CATEGORY_NAME_TRAILING_POLITENESS}|${CATEGORY_NAME_TRAILING_PLACEHOLDER_CLAUSE})`;

export function stripTrailingCategoryNamePoliteness(name: string): string {
  let out = name.trim();
  // Repeat: "kindly please" / "please kindly" / stacked softeners and
  // placeholder-count clauses in any order.
  const trailing = new RegExp(
    `\\s+${CATEGORY_NAME_TRAILING_EXTRA}(?:\\s+${CATEGORY_NAME_TRAILING_EXTRA})*\\s*[.?!]*\\s*$`,
    'iu',
  );
  for (let i = 0; i < 4; i++) {
    const next = out
      .replace(trailing, '')
      .replace(/[.?!]+$/g, '')
      .trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Category scope when creating a catalog service (not a category entity). */
export function extractCreateServiceCategoryFromPrompt(
  prompt: string,
): string | undefined {
  const patterns = [
    // e2e-bug.151 / e2e-bug.251 — "Add a new (service|catalog) category called/named X"
    // e2e-bug.271 / e2e-bug.290 — trailing please/kindly/thanks (stripped after capture).
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?(?:(?:service|catalog)\s+)?category\s+(?:called|named)\s+["']?([A-Za-z][\w\s&'-]+?)["']?(?:\s+(?:please|kindly|thanks(?:\s+you)?|thank\s+you|pls|thx|cheers|appreciate(?:\s+it)?))*\s*[.?!]?\s*$/i,
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?(?:(?:service|catalog)\s+)?category\s+["']([A-Za-z][\w\s&'-]+?)["']/i,
    /\b(?:under|in|into|within)\s+(?:the\s+)?(?:(?:service|catalog)\s+)?category\s*:?\s*([A-Za-z][\w\s&'-]+)/i,
    /\b(?:under|in|into|within)\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+(?:(?:service|catalog)\s+)?category\b/i,
    /\b(?:create|add)\s+(?:a\s+)?(?:new\s+)?service\b[^.]*\bcategory\s*:?\s*([A-Za-z][\w\s&'-]+)/i,
    // e2e-bug.291 — HY «կատեգորիա անունով X» / «կատեգորիա՝ X»
    /կատեգորիա\s+անունով\s+["']?(.+?)["']?(?:\s+(?:խնդրում\s+եմ|please|kindly|thanks))*\s*[.?!]?\s*$/iu,
    /կատեգորիա\s*[՝:]\s*["']?(.+?)["']?\s*$/iu,
    // e2e-bug.292 — RU «категорию … с/под названием X» / «категорию каталога «X»»
    /(?:с|под)\s+названием\s+["'«„]?(.+?)["'»“]?(?:\s+(?:пожалуйста|please|kindly))*\s*[.?!]?\s*$/iu,
    /категор[\p{L}\p{M}]*(?:\s+каталог[\p{L}\p{M}]*)?\s*[«"]([^»"]+)[»"]/iu,
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]
      ? stripTrailingCategoryNamePoliteness(match[1])
      : undefined;
    if (name && !/^(?:called|named)$/i.test(name)) return name;
  }

  return undefined;
}

/**
 * e2e-bug.271 — prefer prompt-regex category name over a shorter classifier
 * fragment (e.g. "brows" vs "brows E2E271-abc").
 */
export function reconcileCreateServiceCategoryNameFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
): void {
  const extracted = extractCreateServiceCategoryFromPrompt(prompt);
  const current =
    typeof params.categoryName === 'string'
      ? stripTrailingCategoryNamePoliteness(params.categoryName)
      : '';

  if (extracted) {
    params.categoryName = extracted;
    return;
  }
  if (current) {
    params.categoryName = current;
  }
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

  if (action === 'create_service_category') {
    // e2e-bug.271 — always prefer prompt extract over truncated classifier names.
    reconcileCreateServiceCategoryNameFromPrompt(prompt, params);
    return;
  }

  if (action === 'create_service' || action === 'create_services') {
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
  // e2e-bug.151 / e2e-bug.292 — single-category create before bulk (RU/HY/EN
  // "category named X" must not stay on bulk_create_catalog confirm).
  if (
    isCreateServiceCategoryPrompt(prompt) &&
    action !== 'create_service_category'
  ) {
    return {
      action: 'create_service_category',
      rescueReason: 'service_category',
    };
  }
  if (
    isBulkCreateCatalogPrompt(prompt) &&
    action !== 'create_services' &&
    action !== 'create_service'
  ) {
    return { action: 'bulk_create_catalog', rescueReason: 'bulk_catalog' };
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
      // e2e-bug.430 — say *which* deactivation this is, even when the action
      // needed no correcting.
      //
      // `rescueDeactivateServiceCategoryScopeIntent` above returns null when the
      // classifier already said `deactivate_service`, on the reasonable ground
      // that there is no action to change. But the reason is not only a record
      // of a correction — it names the shape of the request, and
      // "hide all hair services" is a category-wide deactivation whether or not
      // the classifier got there unaided. Seven eval cases asserted the scoped
      // reason and got the generic one.
      //
      // The params were already right: this branch builds them with the same
      // `enrichDeactivateServiceCategoryScopeParamsFromPrompt`. Only the label
      // was wrong.
      rescueReason: isDeactivateServiceCategoryScopePrompt(prompt)
        ? 'deactivate_service_category_scope'
        : 'deactivate_service',
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

/**
 * e2e-bug.347 — two alternatives, delimited-first then bare:
 * 1. `Name, 30 minutes, $50` / `Name (30 min, $50)` — a comma or paren
 *    separates the name from the duration and/or the duration from the price.
 * 2. `Name 60m $65` — the original whitespace-only form (kept verbatim so
 *    existing bulk-catalog prompts parse identically).
 * Ordering matters: the delimited branch must be tried first, otherwise the
 * bare branch matches a truncated name inside a delimited line.
 */
const SERVICE_LINE =
  /([^,;()]+?)\s*[,(]\s*(\d+)\s*(?:m|min(?:ute)?s?)\b\s*[,)]?\s*(?:for\s+)?(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)|([^,;()]+?)\s+(\d+)\s*(?:m|min(?:ute)?s?)\b\s*(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)/gi;

/**
 * e2e-bug.347 — the name capture can absorb the list connector joining two
 * entries ("… and B (45 min, $45)" → "and B") and the generic "service"
 * descriptor users write in enumerations ("service A, 30 minutes, $50" → the
 * intended name is "A"). Both are stripped, never down to an empty string —
 * so a catalog entry genuinely called "Service" survives untouched.
 */
function normalizeServiceLineName(raw: string): string {
  let name = raw.replace(/^[\s:.\-–—]+|[\s:.\-–—]+$/g, '').trim();
  // e2e-bug.347 — when the whole prompt is scanned (rather than the
  // already-split services text) the first name absorbs the command preamble:
  // "Create category Hair with Women's cut" → "Women's cut". Only strip when
  // the prefix actually looks like a create-category preamble, so a service
  // legitimately named "Facial with peel" is left alone.
  const preamble = name.match(
    /^.*\b(?:categor(?:y|ies)|catalog|menu)\b.*?\bwith\s+(?:services?\s+)?(.+)$/i,
  );
  if (preamble?.[1]?.trim()) name = preamble[1].trim();
  // "…with three services: service A" — the enumeration colon also fronts the
  // first entry when the raw prompt (not the split services text) is scanned.
  const afterColon = name.split(':').pop()?.trim();
  if (afterColon) name = afterColon;
  const withoutConnector = name
    .replace(/^(?:and|or|plus|&|и|плюс|և)\s+/i, '')
    .trim();
  if (withoutConnector) name = withoutConnector;
  const withoutDescriptor = name.replace(/^services?\s+/i, '').trim();
  if (withoutDescriptor) name = withoutDescriptor;
  return name;
}

export function parseServiceLinesFromText(text: string): CatalogServiceDraft[] {
  const services: CatalogServiceDraft[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(SERVICE_LINE.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    const rawName = match[1] ?? match[4] ?? '';
    const rawDuration = match[2] ?? match[5];
    const rawPrice = match[3] ?? match[6];
    if (!rawDuration || !rawPrice) continue;
    const name = normalizeServiceLineName(rawName);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    services.push({
      serviceName: name,
      durationMinutes: Math.max(10, parseInt(rawDuration, 10)),
      price: parseFloat(rawPrice),
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
  // e2e-bug.347 — `{1,40}?` demanded at least two characters, so a
  // single-letter category ("category Y with …") never matched and the whole
  // draft came back null. `{0,40}?` allows the one-character name; the lazy
  // quantifier still stops at the first "with"/":" boundary for longer names.
  const categoryMatch =
    prompt.match(
      /\bcategor(?:y|ies)\s+([A-Za-z][\w\s&'-]{0,40}?)(?:\s+with\b|\s*[:(]|$)/i,
    ) ??
    prompt.match(
      /\b(?:catalog|menu)\s+(?:for\s+)?([A-Za-z][\w\s&'-]{0,40}?)(?:\s+with\b|\s*[:(]|$)/i,
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

  // e2e-bug.349 — checked first: "Under Y add service A (30 min, $50)" carries
  // its own category scope, which the generic bulk parser cannot recover once
  // the segment is considered on its own.
  const scoped = parseScopedCategoryLinesFromSegment(text);
  if (scoped) {
    return {
      action: 'bulk_create_catalog',
      params: { catalogDraft: scoped },
      segment: text,
    };
  }

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
    // e2e-bug.347 — the greedy capture used to swallow the trailing service
    // clause ("category Y with services A (30 min, $50)" → "Y with services A").
    // Prefer the sanitized extractor, then fall back to a lazy match that stops
    // at the "with …"/":"/"(" boundary, same as `parseBulkCatalogFromPrompt`.
    const name =
      extractCreateServiceCategoryFromPrompt(text) ??
      (() => {
        const raw = text.match(
          /\bcategor(?:y|ies)\s+([A-Za-z][\w\s&'-]{0,40}?)(?:\s+with\b|\s*[:(,]|\s*$)/i,
        )?.[1];
        return raw ? stripTrailingCategoryNamePoliteness(raw) : undefined;
      })();
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
