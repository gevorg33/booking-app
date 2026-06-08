import type { AppLocale } from '@/i18n';

export type CatalogNotifyMode = 'skip' | 'notify';

export type CatalogNotifyPreviewKind = 'package' | 'subscription_plan';

export interface CatalogNotifyPreviewContext {
  kind: CatalogNotifyPreviewKind;
  catalogName: string;
  discountLabel: string;
  businessName: string;
  bookUrl: string;
}

export interface CatalogNotifyRenderedPreview {
  subject: string;
  bodyText: string;
}

const SAMPLE_CUSTOMER_BY_LOCALE: Record<AppLocale, string> = {
  en: 'Anna',
  hy: 'Աննա',
  ru: 'Анна',
};

export interface CatalogNotifyLocaleTemplate {
  subject: string;
  bodyText: string;
}

export type CatalogNotifyTemplateState = Partial<
  Record<AppLocale, CatalogNotifyLocaleTemplate>
>;

export interface CatalogNotifyFormState {
  mode: CatalogNotifyMode;
  template: CatalogNotifyTemplateState;
}

export function defaultCatalogNotifyFormState(): CatalogNotifyFormState {
  return { mode: 'skip', template: {} };
}

export function catalogNotifyLocaleTemplate(
  state: CatalogNotifyTemplateState,
  locale: AppLocale,
): CatalogNotifyLocaleTemplate {
  return state[locale] ?? { subject: '', bodyText: '' };
}

export function patchCatalogNotifyLocaleTemplate(
  state: CatalogNotifyTemplateState,
  locale: AppLocale,
  patch: Partial<CatalogNotifyLocaleTemplate>,
): CatalogNotifyTemplateState {
  const current = catalogNotifyLocaleTemplate(state, locale);
  return {
    ...state,
    [locale]: { ...current, ...patch },
  };
}

export function buildCatalogNotifySavePayload(state: CatalogNotifyFormState) {
  if (state.mode !== 'notify') {
    return { notifyCustomers: false as const };
  }
  return {
    notifyCustomers: true as const,
    notificationTemplate: state.template,
  };
}

export function catalogNotifyTemplateIsComplete(
  state: CatalogNotifyFormState,
  enabledLocales: readonly AppLocale[],
): boolean {
  if (state.mode !== 'notify') return true;
  return enabledLocales.every((locale) => {
    const entry = catalogNotifyLocaleTemplate(state.template, locale);
    return entry.subject.trim().length > 0 && entry.bodyText.trim().length > 0;
  });
}

export function formatCatalogNotifyDiscountLabel(
  discountType: 'percent' | 'fixed',
  discountValue: number,
  formatFixed?: (amount: number) => string,
): string {
  if (discountType === 'percent') {
    return `${Math.round(discountValue)}%`;
  }
  return formatFixed ? formatFixed(discountValue) : String(discountValue);
}

export function buildCatalogNotifyBookUrl(
  slug: string,
  kind: CatalogNotifyPreviewKind,
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
): string {
  const trimmed = slug.trim() || 'your-salon';
  return kind === 'package' ? `${origin}/book/${trimmed}/any` : `${origin}/book/${trimmed}`;
}

export function renderCatalogAnnouncementTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    return variables[key] ?? '';
  });
}

export function buildCatalogNotifyPreviewVariables(
  context: CatalogNotifyPreviewContext,
  previewLocale: AppLocale,
): Record<string, string> {
  const shared = {
    customerName: SAMPLE_CUSTOMER_BY_LOCALE[previewLocale],
    businessName: context.businessName,
    discount: context.discountLabel,
    bookUrl: context.bookUrl,
  };
  if (context.kind === 'package') {
    return { ...shared, packageName: context.catalogName };
  }
  return { ...shared, planName: context.catalogName };
}

export function renderCatalogNotifyPreview(
  template: CatalogNotifyLocaleTemplate,
  context: CatalogNotifyPreviewContext,
  previewLocale: AppLocale,
): CatalogNotifyRenderedPreview {
  const variables = buildCatalogNotifyPreviewVariables(context, previewLocale);
  return {
    subject: renderCatalogAnnouncementTemplate(template.subject, variables),
    bodyText: renderCatalogAnnouncementTemplate(template.bodyText, variables),
  };
}

export function catalogNotifyPreviewHasContent(
  template: CatalogNotifyLocaleTemplate,
): boolean {
  return template.subject.trim().length > 0 || template.bodyText.trim().length > 0;
}
