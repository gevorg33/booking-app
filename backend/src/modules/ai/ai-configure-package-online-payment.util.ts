import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  computeServiceDepositAmount,
  describePrepaymentMode,
  parseDepositPercent,
  parseFixedDepositAmount,
  parseServiceOnlinePaymentConfig,
  type ParsedServiceOnlinePaymentConfig,
} from './ai-service-online-payment.util.js';
import { isConfigureServiceDepositPolicyPrompt } from './ai-service-deposit-policy.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

/** Dashboard mutate intent (ai-cmd-ext-2.28). */
export const CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT =
  'configure_package_online_payment' as const;

export const CONFIGURE_PACKAGE_ONLINE_PAYMENT_CLASSIFIER_RULES = `- configure_package_online_payment: MUTATE — set online prepayment on services included in one or more catalog packages (Packages tab). No per-package prepayment field yet — updates constituent service prepaymentMode (none|full|deposit), which drives package checkout. Params: packageName, packageNames[], allPackages, prepaymentMode, depositPercent, depositAmount. Requires Stripe Connect before enabling full/deposit. NOT configure_service_online_payment (service/category scope without package), NOT update_package (discount/items), NOT create_package, NOT configure_service_deposit_policy (tier/featured scope), NOT explain_service_online_payment_setup (read-only).
- Examples:
  - "Require 50% online prepayment for Spa Day package" → packageName=Spa Day, prepaymentMode=deposit, depositPercent=50
  - "Enable full online payment for Bridal package" → packageName=Bridal, prepaymentMode=full
  - "Disable online payment for Glow package" → packageName=Glow, prepaymentMode=none
  - "Accept online prepayment on all packages with half deposit" → allPackages=true, prepaymentMode=deposit, depositPercent=50
  - NOT "Accept online payment for all services with 50% prepayment" → configure_service_online_payment`;

const ONLINE_PAYMENT_SIGNAL =
  /\b(online\s+payment|online\s+pay(?:ment)?s?|prepayment|pre[-\s]?pay|pay\s+online|stripe|card\s+checkout|checkout\s+online)\b|stripe\s+checkout/iu;

const DISABLE_ONLINE_PAYMENT_RE =
  /\b(decline(?:\s+to)?|disable|turn\s+off|stop|reject|remove|refuse|no\s+longer|do\s+not\s+accept|don't\s+accept|dont\s+accept)\b/iu;

export type ConfigurePackageOnlinePaymentPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_PACKAGE_ONLINE_PAYMENT_PROMPTS: ConfigurePackageOnlinePaymentPromptFixture[] =
  [
    {
      id: 'single-package-50-deposit',
      prompt: 'Require 50% online prepayment for Spa Day package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        packageName: 'Spa Day',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'single-package-full',
      prompt: 'Enable full online payment for Bridal package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { packageName: 'Bridal', prepaymentMode: 'full' },
    },
    {
      id: 'disable-package',
      prompt: 'Disable online payment for Spa Day package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { packageName: 'Spa Day', prepaymentMode: 'none' },
    },
    {
      id: 'all-packages-deposit',
      prompt: 'Accept online prepayment on all packages with 50% deposit',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        allPackages: true,
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'named-two-packages',
      prompt: 'Require online payment for Spa Day and Glow packages',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        packageNames: ['Spa Day', 'Glow'],
        prepaymentMode: 'full',
      },
    },
    {
      id: 'package-half-prepay',
      prompt: 'Require half prepayment online for Wellness package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        packageName: 'Wellness',
        prepaymentMode: 'deposit',
        depositPercent: 50,
      },
    },
    {
      id: 'package-fixed-deposit',
      prompt: 'Require $25 deposit online for Spa Day package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        packageName: 'Spa Day',
        prepaymentMode: 'deposit',
        depositAmount: 25,
      },
    },
    {
      id: 'package-public-booking',
      prompt: 'Accept online payment on public booking for Spa Day package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { packageName: 'Spa Day', prepaymentMode: 'full' },
    },
    {
      id: 'all-packages-disable',
      prompt: 'Turn off online payment for all packages',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { allPackages: true, prepaymentMode: 'none' },
    },
    {
      id: 'decline-package-prepay',
      prompt: 'Decline online prepayment for Glow package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { packageName: 'Glow', prepaymentMode: 'none' },
    },
    {
      id: 'configure-dental-package',
      prompt: 'Enable online payment for Dental package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: { packageName: 'Dental', prepaymentMode: 'full' },
    },
    {
      id: 'package-30-percent',
      prompt: 'Set 30% online prepayment for Spa Day package',
      surface: 'dashboard',
      expectedAction: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      paramsPartial: {
        packageName: 'Spa Day',
        prepaymentMode: 'deposit',
        depositPercent: 30,
      },
    },
  ];

export type ParsedConfigurePackageOnlinePayment = {
  prepaymentMode: PrepaymentMode;
  packageName?: string;
  packageNames?: string[];
  allPackages?: boolean;
  depositPercent?: number | null;
  depositAmount?: number | null;
};

function hasPackageKeyword(prompt: string): boolean {
  return /\bpackages?\b/i.test(prompt);
}

function hasOnlinePaymentVerb(prompt: string): boolean {
  return (
    /\b(accept|enable|disable|decline(?:\s+to)?|turn\s+(?:on|off)|require|configure|set\s+up|allow|stop|reject|refuse|set)\b/i.test(
      prompt,
    ) || /\bprepayment\b/i.test(prompt)
  );
}

function isDisablingOnlinePayment(prompt: string): boolean {
  return DISABLE_ONLINE_PAYMENT_RE.test(prompt);
}

function isPackageCrudWithoutPayment(prompt: string): boolean {
  if (!hasPackageKeyword(prompt)) return false;
  if (ONLINE_PAYMENT_SIGNAL.test(prompt)) return false;
  return (
    /\b(create|add|update|change|edit|duplicate|deactivate|list)\b/i.test(
      prompt,
    ) || /\bnotify\b/i.test(prompt)
  );
}

function extractPackageNameFromPrompt(prompt: string): string | undefined {
  const patterns = [
    /\bfor\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+package\b/i,
    /\bon\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+package\b/i,
    /\b(?:require|enable|configure|set)\s+(?:online\s+)?(?:payment|prepayment)\s+for\s+(?:the\s+)?([A-Za-z][\w\s&'-]+?)\s+package\b/i,
    /\b([A-Za-z][\w\s&'-]+?)\s+package\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    const name = match?.[1]?.replace(/^["']|["']$/g, '').trim();
    if (name && !/^(all|every|each|online|public)$/i.test(name)) {
      return name;
    }
  }
  return undefined;
}

function extractPackageNamesFromPrompt(prompt: string): string[] | undefined {
  const listMatch = prompt.match(/\bfor\s+(.+?)\s+packages?\b/i);
  if (!listMatch) return undefined;
  const segment = listMatch[1].trim();
  if (!/\band\b/i.test(segment)) return undefined;
  return segment
    .split(/\s+and\s+/i)
    .map((part) => part.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

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
  key: string,
): string[] | undefined {
  const raw = params[key];
  if (!Array.isArray(raw)) return undefined;
  const values = raw
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    )
    .map((value) => value.trim());
  return values.length ? values : undefined;
}

function resolveDepositPercent(
  prompt: string,
  params: Record<string, unknown>,
  servicePayment: ParsedServiceOnlinePaymentConfig | null,
): number | null | undefined {
  if (typeof params.depositPercent === 'number') return params.depositPercent;
  if (servicePayment?.depositPercent != null)
    return servicePayment.depositPercent;
  const parsed = parseDepositPercent(prompt);
  if (parsed != null) return parsed;
  const pctBeforeOnline = prompt.match(
    /\b(\d{1,3})\s*%\s+online\s+prepayment\b/i,
  );
  if (pctBeforeOnline) return Number.parseInt(pctBeforeOnline[1], 10);
  const anyPct = prompt.match(/\b(\d{1,3})\s*%\b/);
  if (anyPct && /\b(?:prepayment|pre[-\s]?pay|deposit)\b/i.test(prompt)) {
    return Number.parseInt(anyPct[1], 10);
  }
  return undefined;
}

export function isConfigurePackageOnlinePaymentPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (!hasPackageKeyword(text)) return false;
  if (isPackageCrudWithoutPayment(text)) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (isConfigureServiceDepositPolicyPrompt(text)) return false;
  const hasPaymentSignal =
    ONLINE_PAYMENT_SIGNAL.test(text) ||
    (/\$\s*\d+/.test(text) && /\bdeposit\b/i.test(text));
  if (!hasPaymentSignal && !hasOnlinePaymentVerb(text)) {
    return false;
  }

  const disabling =
    isDisablingOnlinePayment(text) &&
    (hasPaymentSignal || hasOnlinePaymentVerb(text));
  const enabling =
    !isDisablingOnlinePayment(text) &&
    hasPaymentSignal &&
    hasOnlinePaymentVerb(text);

  return disabling || enabling;
}

export function parseConfigurePackageOnlinePaymentFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigurePackageOnlinePayment | null {
  const hasParamSignal =
    readStringParam(params, 'packageName') != null ||
    (readStringArrayParam(params, 'packageNames')?.length ?? 0) > 0 ||
    params.allPackages === true ||
    params.prepaymentMode != null;

  if (!isConfigurePackageOnlinePaymentPrompt(prompt) && !hasParamSignal) {
    return null;
  }

  const prepaymentMode =
    (params.prepaymentMode === 'none' ||
    params.prepaymentMode === 'full' ||
    params.prepaymentMode === 'deposit'
      ? (params.prepaymentMode as PrepaymentMode)
      : undefined) ??
    parseServiceOnlinePaymentConfig(prompt, params)?.prepaymentMode;
  if (!prepaymentMode) return null;

  const servicePayment = parseServiceOnlinePaymentConfig(prompt, params);

  const packageNames =
    readStringArrayParam(params, 'packageNames') ??
    extractPackageNamesFromPrompt(prompt);
  const packageName =
    readStringParam(params, 'packageName') ??
    (packageNames?.length ? undefined : extractPackageNameFromPrompt(prompt));
  const allPackages =
    params.allPackages === true || /\ball\s+packages?\b/i.test(prompt);

  const depositPercent = resolveDepositPercent(prompt, params, servicePayment);
  const depositAmount =
    typeof params.depositAmount === 'number'
      ? params.depositAmount
      : (servicePayment?.depositAmount ?? parseFixedDepositAmount(prompt));

  if (
    !allPackages &&
    !packageName &&
    !packageNames?.length &&
    !isConfigurePackageOnlinePaymentPrompt(prompt)
  ) {
    return null;
  }

  return {
    prepaymentMode,
    packageName,
    packageNames,
    allPackages: allPackages || undefined,
    depositPercent: depositPercent === undefined ? undefined : depositPercent,
    depositAmount: depositAmount ?? undefined,
  };
}

export function resolveTargetPackages<
  T extends { id: string; name: string; isActive?: boolean },
>(packages: T[], config: ParsedConfigurePackageOnlinePayment): T[] {
  const active = packages.filter((pkg) => pkg.isActive !== false);
  if (config.allPackages) return active;

  if (config.packageNames?.length) {
    const matched = config.packageNames
      .map((name) => resolvePackageByName(active, name))
      .filter((pkg): pkg is T => !!pkg);
    if (matched.length)
      return [...new Map(matched.map((pkg) => [pkg.id, pkg])).values()];
  }

  if (config.packageName) {
    const pkg = resolvePackageByName(active, config.packageName);
    if (pkg) return [pkg];
  }

  return [];
}

export function resolvePackageByName<T extends { name: string }>(
  packages: T[],
  name: string,
): T | undefined {
  const needle = name.toLowerCase();
  return (
    packages.find((pkg) => pkg.name.toLowerCase() === needle) ??
    packages.find((pkg) => pkg.name.toLowerCase().includes(needle))
  );
}

export function collectServiceIdsFromPackages<
  T extends { items?: Array<{ serviceId?: string; service?: { id: string } }> },
>(packages: T[]): string[] {
  const ids = new Set<string>();
  for (const pkg of packages) {
    for (const item of pkg.items ?? []) {
      const serviceId = item.serviceId ?? item.service?.id;
      if (serviceId) ids.add(serviceId);
    }
  }
  return [...ids];
}

export function toServiceOnlinePaymentConfig(
  parsed: ParsedConfigurePackageOnlinePayment,
): ParsedServiceOnlinePaymentConfig {
  return {
    prepaymentMode: parsed.prepaymentMode,
    allServices: false,
    depositPercent: parsed.depositPercent,
    depositAmount: parsed.depositAmount,
  };
}

export { computeServiceDepositAmount, describePrepaymentMode };

export function rescueConfigurePackageOnlinePaymentIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT;
  rescueReason: string;
} | null {
  if (
    isConfigurePackageOnlinePaymentPrompt(prompt) &&
    action !== CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT
  ) {
    return {
      action: CONFIGURE_PACKAGE_ONLINE_PAYMENT_INTENT,
      rescueReason: 'configure_package_online_payment',
    };
  }
  return null;
}

export function enrichConfigurePackageOnlinePaymentParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseConfigurePackageOnlinePaymentFromPrompt(prompt, params);
  if (!parsed) return params;
  return {
    ...params,
    prepaymentMode: parsed.prepaymentMode,
    ...(parsed.packageName ? { packageName: parsed.packageName } : {}),
    ...(parsed.packageNames?.length
      ? { packageNames: parsed.packageNames }
      : {}),
    ...(parsed.allPackages ? { allPackages: true } : {}),
    ...(parsed.depositPercent !== undefined
      ? { depositPercent: parsed.depositPercent }
      : {}),
    ...(parsed.depositAmount !== undefined
      ? { depositAmount: parsed.depositAmount }
      : {}),
  };
}
