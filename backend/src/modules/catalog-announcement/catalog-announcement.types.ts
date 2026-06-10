import type { AppLocale } from '../../common/i18n/messages.js';

export type CatalogAnnouncementKind = 'package' | 'subscription_plan';

export interface CatalogNotifyLocaleTemplate {
  subject: string;
  bodyText: string;
}

export type CatalogNotifyTemplateMap = Partial<
  Record<AppLocale, CatalogNotifyLocaleTemplate>
>;

export interface CatalogNotifyRequest {
  notifyCustomers: true;
  notificationTemplate: CatalogNotifyTemplateMap;
}

export interface CatalogAnnouncementTemplateContext {
  customerName: string;
  packageName?: string;
  planName?: string;
  discount: string;
  businessName: string;
  bookUrl: string;
}

export interface CatalogAnnouncementSendSummary {
  emailed: number;
  pushed: number;
  skipped: number;
  failed: number;
}

export interface CatalogAnnouncementDefaultTemplates {
  package?: CatalogNotifyTemplateMap;
  subscriptionPlan?: CatalogNotifyTemplateMap;
}
