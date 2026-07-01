import { PrepaymentMode } from '../service/entities/service.entity.js';
import { isAuditServicesMissingOnlinePaymentPrompt } from './ai-audit-services-missing-online-payment.util.js';
import { isFilterServicesNoPrepaymentPrompt } from './ai-filter-services-no-prepayment.util.js';

export const LIST_SERVICES_PAYMENT_FILTER_CLASSIFIER_RULES = `- list_services payment filters (ai-cmd-ext-5.1): when browsing the catalog by online payment policy, set prepaymentMode (none|full|deposit) and/or onlinePaymentEnabled (true|false). Triggers: list/show/what can I book + require/accept online payment|prepayment; full prepayment|deposit prepayment on services; without paying online|no online prepayment (prepaymentMode=none). NOT audit_services_missing_online_payment (gap audit for services still missing online payment); NOT explain_service_online_payment_setup (Stripe/cash/setup summary); NOT configure_service_online_payment (mutate).
- Examples:
  - "List services that require online payment" → list_services, onlinePaymentEnabled=true
  - "Show services with full prepayment" → list_services, prepaymentMode=full
  - "List services with deposit prepayment" → list_services, prepaymentMode=deposit
  - Customer/public "What can I book without paying online?" → filter_services_no_prepayment (not list_services)
  - "List massage services that require online prepayment" → list_services, prepaymentMode=deposit|onlinePaymentEnabled=true, serviceCategory=massage`;

export type ListServicesPaymentFilter = {
  prepaymentMode?: 'none' | 'full' | 'deposit';
  onlinePaymentEnabled?: boolean;
};

export type ParsedListServicesPaymentFilter = ListServicesPaymentFilter;

function normalizePrepaymentModeParam(
  value: unknown,
): ListServicesPaymentFilter['prepaymentMode'] | undefined {
  if (value === 'none' || value === 'full' || value === 'deposit') {
    return value;
  }
  return undefined;
}

function hasCatalogBrowseCue(prompt: string): boolean {
  return (
    /\b(?:list|show|what\s+can\s+(?:i|we)\s+book|options|which\s+services?|services?\s+that|services?\s+with|our\s+services?|service\s+catalog|service\s+menu)\b/i.test(
      prompt,
    ) || /\bservices?\b/i.test(prompt)
  );
}

function hasPaymentPolicyCue(prompt: string): boolean {
  return (
    /\b(?:online\s+payment|online\s+prepayment|prepayment|pay(?:ing)?(?:\s+for)?\s+online|deposit\s+prepayment|full\s+prepayment|cash[\s-]?only)\b/i.test(
      prompt,
    ) ||
    /\bwithout\s+paying\s+online\b/i.test(prompt) ||
    /\b(?:require|requiring|accept|accepting)\b.{0,40}\b(?:prepayment|online\s+payment)\b/i.test(
      prompt,
    )
  );
}

export function parseListServicesPaymentFilterFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListServicesPaymentFilter | null {
  const fromParams: ParsedListServicesPaymentFilter = {};
  const prepaymentFromParams = normalizePrepaymentModeParam(
    params.prepaymentMode,
  );
  if (prepaymentFromParams) fromParams.prepaymentMode = prepaymentFromParams;
  if (typeof params.onlinePaymentEnabled === 'boolean') {
    fromParams.onlinePaymentEnabled = params.onlinePaymentEnabled;
  }

  const text = prompt.trim();
  if (!text) {
    return Object.keys(fromParams).length ? fromParams : null;
  }

  const parsed: ParsedListServicesPaymentFilter = { ...fromParams };

  if (
    /\bwithout\s+paying\s+online\b/i.test(text) ||
    /\b(?:no|without)\s+online\s+prepayment\b/i.test(text) ||
    /\bdon'?t\s+require\s+prepayment\b/i.test(text) ||
    /\bbook\b.{0,30}\bwithout\s+paying\s+online\b/i.test(text)
  ) {
    parsed.prepaymentMode = 'none';
    parsed.onlinePaymentEnabled = false;
  } else if (
    /\b(?:full|100\s*%|pay\s+in\s+full)\b/i.test(text) &&
    /\b(?:prepayment|online\s+payment)\b/i.test(text)
  ) {
    parsed.prepaymentMode = 'full';
  } else if (
    /\b(?:deposit|partial|50\s*%|half)\b/i.test(text) &&
    /\b(?:prepayment|online\s+payment|deposit)\b/i.test(text)
  ) {
    parsed.prepaymentMode = 'deposit';
  } else if (
    /\b(?:require|requiring|accept|accepting|with|have)\b/i.test(text) &&
    /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(text) &&
    !/\b(?:don'?t|do\s+not|without|missing|still)\b/i.test(text)
  ) {
    parsed.onlinePaymentEnabled = true;
  } else if (
    /\bpay(?:ing)?(?:\s+for)?\s+online\b/i.test(text) &&
    /\bservices?\b/i.test(text)
  ) {
    parsed.onlinePaymentEnabled = true;
  } else if (
    /\bcash[\s-]?only\b/i.test(text) &&
    /\bservices?\b/i.test(text) &&
    !/\baudit\b/i.test(text)
  ) {
    parsed.prepaymentMode = 'none';
    parsed.onlinePaymentEnabled = false;
  }

  if (!parsed.prepaymentMode && parsed.onlinePaymentEnabled === undefined) {
    return Object.keys(fromParams).length ? fromParams : null;
  }

  return parsed;
}

export function hasListServicesPaymentFilter(
  filter: ParsedListServicesPaymentFilter | null,
): filter is ParsedListServicesPaymentFilter {
  if (!filter) return false;
  return (
    filter.prepaymentMode != null || filter.onlinePaymentEnabled !== undefined
  );
}

export function isListServicesPaymentFilterPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text || !hasCatalogBrowseCue(text) || !hasPaymentPolicyCue(text)) {
    return false;
  }

  if (isFilterServicesNoPrepaymentPrompt(text)) return false;

  const hasListFilterCue =
    /\blist\s+services?\b/i.test(text) ||
    /\bwhat\b.{0,30}\bcan\s+(?:i|we)\s+book\b/i.test(text) ||
    /\b(?:show|what\s+can\s+(?:i|we)\s+book)\b/i.test(text) ||
    /\bbook\b.{0,30}\bwithout\s+paying\s+online\b/i.test(text) ||
    /\bservices?\s+(?:with|that|customers?\s+can)\b/i.test(text) ||
    /\b(?:list|show)\b.{0,40}\bservices?\b/i.test(text) ||
    /\bwhat\s+services?\s+require\b/i.test(text);

  if (!hasListFilterCue) return false;

  if (
    /\b(?:accept|enable|configure|decline|disable|turn\s+on|turn\s+off)\b/i.test(
      text,
    ) &&
    !/\b(?:list|show)\s+services?\b/i.test(text) &&
    /\b(?:online\s+payment|online\s+prepayment|prepayment)\b/i.test(text)
  ) {
    return false;
  }

  if (isAuditServicesMissingOnlinePaymentPrompt(text)) return false;

  if (
    /\b(?:explain|describe|stripe\s+connect|cash\s+still\s+allowed|payment\s+setup)\b/i.test(
      text,
    ) &&
    !/\blist\s+services?\b/i.test(text)
  ) {
    return false;
  }

  return hasListServicesPaymentFilter(
    parseListServicesPaymentFilterFromPrompt(text, {}),
  );
}

export function enrichListServicesPaymentFilterParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseListServicesPaymentFilterFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    ...(parsed.prepaymentMode ? { prepaymentMode: parsed.prepaymentMode } : {}),
    ...(parsed.onlinePaymentEnabled !== undefined
      ? { onlinePaymentEnabled: parsed.onlinePaymentEnabled }
      : {}),
  };
}

export function matchesListServicesPaymentFilter<
  T extends {
    prepaymentMode?: PrepaymentMode | string | null;
    onlinePaymentEnabled?: boolean;
  },
>(service: T, filter: ParsedListServicesPaymentFilter): boolean {
  if (filter.prepaymentMode) {
    const mode = service.prepaymentMode ?? PrepaymentMode.NONE;
    return mode === filter.prepaymentMode;
  }

  if (filter.onlinePaymentEnabled === true) {
    if (typeof service.onlinePaymentEnabled === 'boolean') {
      return service.onlinePaymentEnabled;
    }
    return (
      (service.prepaymentMode ?? PrepaymentMode.NONE) !== PrepaymentMode.NONE
    );
  }

  if (filter.onlinePaymentEnabled === false) {
    if (typeof service.onlinePaymentEnabled === 'boolean') {
      return !service.onlinePaymentEnabled;
    }
    return (
      (service.prepaymentMode ?? PrepaymentMode.NONE) === PrepaymentMode.NONE
    );
  }

  return true;
}

export function filterServicesByListServicesPaymentPolicy<
  T extends {
    prepaymentMode?: PrepaymentMode | string | null;
    onlinePaymentEnabled?: boolean;
  },
>(services: readonly T[], filter: ParsedListServicesPaymentFilter | null): T[] {
  if (!hasListServicesPaymentFilter(filter)) return [...services];
  return services.filter((service) =>
    matchesListServicesPaymentFilter(service, filter),
  );
}

export function buildListServicesPaymentFilterHeader(
  filter: ParsedListServicesPaymentFilter,
): string {
  if (filter.prepaymentMode === 'none') {
    return 'Services without online payment';
  }
  if (filter.prepaymentMode === 'full') {
    return 'Services with full prepayment';
  }
  if (filter.prepaymentMode === 'deposit') {
    return 'Services with deposit prepayment';
  }
  if (filter.onlinePaymentEnabled === true) {
    return 'Services with online payment';
  }
  if (filter.onlinePaymentEnabled === false) {
    return 'Services without online payment';
  }
  return 'Services';
}

export function rescueListServicesPaymentFilterIntent(
  prompt: string,
  action: string,
): { action: 'list_services'; rescueReason: string } | null {
  if (action === 'list_services') return null;
  if (!isListServicesPaymentFilterPrompt(prompt)) return null;
  return {
    action: 'list_services',
    rescueReason: 'list_services_payment_filter',
  };
}
