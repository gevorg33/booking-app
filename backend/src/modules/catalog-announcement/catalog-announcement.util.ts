import { BadRequestException } from '@nestjs/common';
import type { AppLocale } from '../../common/i18n/messages.js';
import {
  filterTranslationLocaleKeys,
  getBusinessEnabledLocales,
  normalizeAppLocale,
} from '../../common/utils/business-locale.util.js';
import { formatBusinessMoney } from '../../common/utils/business-currency.util.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import { getCustomerGdpr } from '../customer/customer-privacy.types.js';
import { getCustomerNotificationPreferences } from '../notifications/notification.types.js';
import { shouldSendConsumerPush } from '../notifications/consumer-notification-preferences.util.js';
import type {
  CatalogAnnouncementDefaultTemplates,
  CatalogAnnouncementKind,
  CatalogAnnouncementTemplateContext,
  CatalogNotifyLocaleTemplate,
  CatalogNotifyRequest,
  CatalogNotifyTemplateMap,
} from './catalog-announcement.types.js';

const CATALOG_NOTIFY_KEYS = ['notifyCustomers', 'notificationTemplate'] as const;

export function stripCatalogNotifyFields<T extends Record<string, unknown>>(
  dto: T,
): Omit<T, 'notifyCustomers' | 'notificationTemplate'> {
  const next = { ...dto };
  for (const key of CATALOG_NOTIFY_KEYS) {
    delete next[key];
  }
  return next;
}

export function parseCatalogNotifyRequest(
  input: Record<string, unknown>,
  businessSettings?: Record<string, unknown>,
): CatalogNotifyRequest | null {
  if (input.notifyCustomers !== true) return null;

  const enabledLocales = getBusinessEnabledLocales(businessSettings);
  const rawTemplate = input.notificationTemplate;
  if (!rawTemplate || typeof rawTemplate !== 'object') {
    throw new BadRequestException(
      'notificationTemplate is required when notifyCustomers is true',
    );
  }

  const filtered = filterTranslationLocaleKeys(
    rawTemplate as Record<string, unknown>,
    enabledLocales,
    { strict: true },
  ) as CatalogNotifyTemplateMap;

  for (const locale of enabledLocales) {
    const entry = filtered[locale];
    if (!entry?.subject?.trim() || !entry?.bodyText?.trim()) {
      throw new BadRequestException(
        `notificationTemplate.${locale} requires subject and bodyText`,
      );
    }
  }

  return {
    notifyCustomers: true,
    notificationTemplate: filtered,
  };
}

export function renderCatalogAnnouncementTemplate(
  template: string,
  context: CatalogAnnouncementTemplateContext,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = context[key as keyof CatalogAnnouncementTemplateContext];
    return value == null ? '' : String(value);
  });
}

export function resolveCatalogAnnouncementTemplate(
  request: CatalogNotifyRequest,
  locale: AppLocale,
  kind: CatalogAnnouncementKind,
  businessSettings?: Record<string, unknown>,
): CatalogNotifyLocaleTemplate | null {
  const direct = request.notificationTemplate[locale];
  if (direct?.subject?.trim() && direct?.bodyText?.trim()) {
    return {
      subject: direct.subject.trim(),
      bodyText: direct.bodyText.trim(),
    };
  }

  const defaults = readCatalogAnnouncementDefaults(businessSettings);
  const fallback =
    kind === 'package'
      ? defaults.package?.[locale]
      : defaults.subscriptionPlan?.[locale];
  if (fallback?.subject?.trim() && fallback?.bodyText?.trim()) {
    return {
      subject: fallback.subject.trim(),
      bodyText: fallback.bodyText.trim(),
    };
  }

  return null;
}

export function readCatalogAnnouncementDefaults(
  businessSettings?: Record<string, unknown>,
): CatalogAnnouncementDefaultTemplates {
  const raw = businessSettings?.catalogAnnouncementTemplates;
  if (!raw || typeof raw !== 'object') return {};
  const templates = raw as CatalogAnnouncementDefaultTemplates;
  return {
    package: sanitizeDefaultTemplateMap(templates.package),
    subscriptionPlan: sanitizeDefaultTemplateMap(templates.subscriptionPlan),
  };
}

function sanitizeDefaultTemplateMap(
  input?: CatalogNotifyTemplateMap,
): CatalogNotifyTemplateMap | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const result: CatalogNotifyTemplateMap = {};
  for (const [key, value] of Object.entries(input)) {
    const locale = normalizeAppLocale(key);
    if (!locale || !value || typeof value !== 'object') continue;
    const subject =
      typeof (value as CatalogNotifyLocaleTemplate).subject === 'string'
        ? (value as CatalogNotifyLocaleTemplate).subject
        : '';
    const bodyText =
      typeof (value as CatalogNotifyLocaleTemplate).bodyText === 'string'
        ? (value as CatalogNotifyLocaleTemplate).bodyText
        : '';
    if (!subject.trim() || !bodyText.trim()) continue;
    result[locale] = { subject: subject.trim(), bodyText: bodyText.trim() };
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function formatCatalogDiscountLabel(
  discountType: 'percent' | 'fixed' | string,
  discountValue: number,
  businessSettings?: Record<string, unknown>,
): string {
  if (discountType === 'percent') {
    return `${Math.round(discountValue)}%`;
  }
  return formatBusinessMoney(discountValue, businessSettings ?? {});
}

export function isCustomerEligibleForCatalogEmail(customer: Customer): boolean {
  if (!customer.isActive) return false;
  if (!customer.email?.trim()) return false;
  const gdpr = getCustomerGdpr(customer.metadata);
  return gdpr.marketingOptIn === true;
}

export function isCustomerEligibleForCatalogPush(customer: Customer): boolean {
  if (!customer.isActive) return false;
  const gdpr = getCustomerGdpr(customer.metadata);
  if (gdpr.marketingOptIn !== true) return false;
  const prefs = getCustomerNotificationPreferences(customer.metadata);
  return shouldSendConsumerPush(prefs, 'news');
}

export function buildCatalogAnnouncementContext(input: {
  customerName: string;
  businessName: string;
  bookUrl: string;
  discount: string;
  packageName?: string;
  planName?: string;
}): CatalogAnnouncementTemplateContext {
  return {
    customerName: input.customerName.trim() || 'there',
    businessName: input.businessName,
    bookUrl: input.bookUrl,
    discount: input.discount,
    packageName: input.packageName,
    planName: input.planName,
  };
}
