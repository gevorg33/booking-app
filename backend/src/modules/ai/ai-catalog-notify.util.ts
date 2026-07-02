import type { AppLocale } from '../../common/utils/business-locale.util.js';
import { getBusinessEnabledLocales } from '../../common/utils/business-locale.util.js';
import { readCatalogAnnouncementDefaults } from '../catalog-announcement/catalog-announcement.util.js';
import type { CatalogNotifyTemplateMap } from '../catalog-announcement/catalog-announcement.types.js';

export const CATALOG_NOTIFY_MUTATE_ACTIONS = [
  'create_package',
  'update_package',
  'create_subscription_plan',
  'update_subscription_plan',
] as const;

export type CatalogNotifyMutateAction =
  (typeof CATALOG_NOTIFY_MUTATE_ACTIONS)[number];

export function isCatalogNotifyMutateAction(
  action: string,
): action is CatalogNotifyMutateAction {
  return (CATALOG_NOTIFY_MUTATE_ACTIONS as readonly string[]).includes(action);
}

export function isCatalogNotifyExplicitSkipPrompt(prompt: string): boolean {
  return (
    /\b(don'?t|do not|without|skip|no)\s+(notify|email|push|announce|message|tell)\b/i.test(
      prompt,
    ) ||
    /\bdo not notify\b/i.test(prompt) ||
    /(առանց\s+տեղեկաց|չտեղեկաց|առանց\s+ուղարկ)/i.test(prompt) ||
    /(без\s+уведом|не\s+уведом|без\s+рассыл)/i.test(prompt)
  );
}

export function isCatalogNotifyCustomersPrompt(prompt: string): boolean {
  if (isCatalogNotifyExplicitSkipPrompt(prompt)) return false;
  if (
    /\b(?:running\s+late|late\s+for|i'?m\s+late|behind\s+schedule)\b/i.test(
      prompt,
    ) ||
    /(ուշաց|ուշ\s+եմ|ուշացող)/i.test(prompt) ||
    /(опаздыва|опоздаю)/i.test(prompt)
  ) {
    return false;
  }
  return (
    (/\b(notify|email|push|announce|alert|message|tell|broadcast)\b/i.test(
      prompt,
    ) &&
      /\b(customers?|clients?|subscribers?|guests?|people|members?)\b/i.test(
        prompt,
      )) ||
    /\bnotify\s+customers?\b/i.test(prompt) ||
    /(հաճախորդ|տեղեկաց|ուղարկ|ծանուց)/i.test(prompt) ||
    /(клиент|уведом|оповест|разошл)/i.test(prompt)
  );
}

const PACKAGE_DEFAULTS: Record<
  AppLocale,
  { subject: string; bodyText: string }
> = {
  en: {
    subject: 'New package: {{packageName}}',
    bodyText:
      'Hi {{customerName}}, we just launched {{packageName}} — save {{discount}} at {{businessName}}. Book here: {{bookUrl}}',
  },
  hy: {
    subject: 'Նոր փաթեթ՝ {{packageName}}',
    bodyText:
      'Բարև {{customerName}}, {{packageName}} փաթեթը {{discount}} զեղչով է {{businessName}}-ում։ Պատվիրել՝ {{bookUrl}}',
  },
  ru: {
    subject: 'Новый пакет: {{packageName}}',
    bodyText:
      'Здравствуйте, {{customerName}}! Мы запустили {{packageName}} — скидка {{discount}} в {{businessName}}. Запись: {{bookUrl}}',
  },
};

const PLAN_DEFAULTS: Record<AppLocale, { subject: string; bodyText: string }> =
  {
    en: {
      subject: 'New membership: {{planName}}',
      bodyText:
        'Hi {{customerName}}, {{planName}} is now available — {{discount}} at {{businessName}}. Join here: {{bookUrl}}',
    },
    hy: {
      subject: 'Նոր անդամակցություն՝ {{planName}}',
      bodyText:
        'Բարև {{customerName}}, {{planName}} պլանը հասանելի է {{businessName}}-ում — {{discount}}։ Մանրամասներ՝ {{bookUrl}}',
    },
    ru: {
      subject: 'Новый абонемент: {{planName}}',
      bodyText:
        'Здравствуйте, {{customerName}}! Доступен план {{planName}} — {{discount}} в {{businessName}}. Подробнее: {{bookUrl}}',
    },
  };

function catalogNotifyTemplateIsComplete(
  template: unknown,
  enabledLocales: readonly AppLocale[],
): template is CatalogNotifyTemplateMap {
  if (!template || typeof template !== 'object') return false;
  const map = template as CatalogNotifyTemplateMap;
  return enabledLocales.every((locale) => {
    const entry = map[locale];
    return !!entry?.subject?.trim() && !!entry?.bodyText?.trim();
  });
}

export function buildAiDefaultCatalogNotifyTemplate(
  kind: 'package' | 'subscription_plan',
  enabledLocales: readonly AppLocale[],
  businessSettings?: Record<string, unknown>,
): CatalogNotifyTemplateMap {
  const saved = readCatalogAnnouncementDefaults(businessSettings);
  const savedMap = kind === 'package' ? saved.package : saved.subscriptionPlan;
  const builtIn = kind === 'package' ? PACKAGE_DEFAULTS : PLAN_DEFAULTS;
  const result: CatalogNotifyTemplateMap = {};
  for (const locale of enabledLocales) {
    const fromSettings = savedMap?.[locale];
    if (fromSettings?.subject?.trim() && fromSettings?.bodyText?.trim()) {
      result[locale] = {
        subject: fromSettings.subject.trim(),
        bodyText: fromSettings.bodyText.trim(),
      };
      continue;
    }
    result[locale] = builtIn[locale];
  }
  return result;
}

export function resolveAiCatalogNotifyPayload(
  params: Record<string, unknown>,
  businessSettings: Record<string, unknown> | undefined,
  kind: 'package' | 'subscription_plan',
): {
  notifyCustomers?: boolean;
  notificationTemplate?: CatalogNotifyTemplateMap;
} {
  if (params.notifyCustomers !== true) {
    return {};
  }
  const enabledLocales = getBusinessEnabledLocales(businessSettings);
  const template = catalogNotifyTemplateIsComplete(
    params.notificationTemplate,
    enabledLocales,
  )
    ? params.notificationTemplate
    : buildAiDefaultCatalogNotifyTemplate(
        kind,
        enabledLocales,
        businessSettings,
      );
  return {
    notifyCustomers: true,
    notificationTemplate: template,
  };
}

export function applyCatalogNotifyPromptHints(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): void {
  if (!isCatalogNotifyMutateAction(action)) return;
  if (isCatalogNotifyExplicitSkipPrompt(prompt)) {
    params.notifyCustomers = false;
    return;
  }
  if (isCatalogNotifyCustomersPrompt(prompt)) {
    params.notifyCustomers = true;
  }
}

/** Apply notify hints after catalog intent rescue (mirrors ai-command post-rescue flow). */
export function enrichCatalogNotifyRescueParams(
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): void {
  applyCatalogNotifyPromptHints(action, params, prompt);
}
