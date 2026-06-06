import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { BusinessComplianceIntent } from './ai-business-compliance.util.js';

export interface BusinessComplianceEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: BusinessComplianceIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian dashboard compliance configuration phrasing (ai-cmd-compliance-6). */
export const BUSINESS_COMPLIANCE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian business compliance (dashboard):
  - configure_privacy_retention: hy «պահել հաճախորդի տվյալները 3 տարի», «միացնել cookie բաները ամրագրման էջում», «անջատել cookie համաձայնության բաները»; ru «хранить данные клиента 3 года», «включить cookie баннер на странице бронирования», «отключить cookie баннер». Retention days + cookie banner — NOT configure_granular_consent and NOT admin_delete_customer_data.
  - configure_granular_consent: hy «պահանջել AI մշակման համաձայնությունը checkout-ում», «կարգավորել երրորդ կողմի ինտեգրացիայի համաձայնությունը»; ru «требовать согласие на обработку AI при оформлении», «запросить согласие на сторонние интеграции». Granular consent toggles — NOT configure_privacy_retention.
  - enable_hipaa_mode: hy «միացնել HIPAA պաշտպանությունը», «սահմանել 15 րոպեանոց session timeout HIPAA-ի համար»; ru «включить защиту HIPAA», «установить 15-минутный тайм-аут сессии для HIPAA». Clinic only — NOT explain_compliance_status.
  - explain_compliance_status: hy «ցույց տալ մեր GDPR compliance checklist-ը», «բացատրիր տվյալների պահպանման ժամկետները», «ինչ է մեր HIPAA BAA կարգավիճակը»; ru «показать наш GDPR чеклист», «объяснить сроки хранения данных», «какой статус HIPAA BAA». READ status — NOT enable_hipaa_mode.
  - admin_delete_customer_data: hy «մոռանալ այս հաճախորդին», «անոնիմացնել հաճախորդի PII-ը»; ru «забыть этого клиента», «анонимизировать PII клиента». Owner GDPR erasure for a named customer — NOT privacy_delete (customer self-service) and NOT delete_customer_data (generic CRM delete).`;

export const MULTILINGUAL_BUSINESS_COMPLIANCE_EVAL_SCENARIOS: BusinessComplianceEvalScenario[] =
  [
    {
      id: 'hy-keep-customer-data-3-years',
      locale: 'hy',
      prompt: 'Պահել հաճախորդի տվյալները 3 տարի',
      expectedAction: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
      paramsPartial: { customerPiiDays: 1095 },
      needsMultilingual: true,
    },
    {
      id: 'hy-enable-cookie-banner',
      locale: 'hy',
      prompt: 'Միացնել cookie բաները ամրագրման էջում',
      expectedAction: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
      paramsPartial: { cookieBannerEnabled: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-keep-customer-data-3-years',
      locale: 'ru',
      prompt: 'Хранить данные клиента 3 года',
      expectedAction: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
      paramsPartial: { customerPiiDays: 1095 },
      needsMultilingual: true,
    },
    {
      id: 'ru-enable-cookie-banner',
      locale: 'ru',
      prompt: 'Включить cookie баннер на странице бронирования',
      expectedAction: 'configure_privacy_retention',
      rescueReason: 'configure_privacy_retention',
      paramsPartial: { cookieBannerEnabled: true },
      needsMultilingual: true,
    },
    {
      id: 'hy-require-ai-consent',
      locale: 'hy',
      prompt: 'Պահանջել AI մշակման համաձայնությունը checkout-ում',
      expectedAction: 'configure_granular_consent',
      rescueReason: 'configure_granular_consent',
      paramsPartial: { requireAiProcessing: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-require-ai-consent',
      locale: 'ru',
      prompt: 'Требовать согласие на обработку AI при оформлении',
      expectedAction: 'configure_granular_consent',
      rescueReason: 'configure_granular_consent',
      paramsPartial: { requireAiProcessing: true },
      needsMultilingual: true,
    },
    {
      id: 'hy-enable-hipaa',
      locale: 'hy',
      prompt: 'Միացնել HIPAA պաշտպանությունը',
      expectedAction: 'enable_hipaa_mode',
      rescueReason: 'enable_hipaa_mode',
      paramsPartial: { enabled: true },
      needsMultilingual: true,
    },
    {
      id: 'ru-hipaa-15-minute-timeout',
      locale: 'ru',
      prompt: 'Установить 15-минутный тайм-аут сессии для HIPAA',
      expectedAction: 'enable_hipaa_mode',
      rescueReason: 'enable_hipaa_mode',
      paramsPartial: { sessionTimeoutMinutes: 15 },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-gdpr-checklist',
      locale: 'hy',
      prompt: 'Ցույց տալ մեր GDPR compliance checklist-ը',
      expectedAction: 'explain_gdpr_checklist',
      rescueReason: 'explain_gdpr_checklist',
      paramsPartial: { aspect: 'checklist' },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-retention',
      locale: 'ru',
      prompt: 'Объяснить сроки хранения данных',
      expectedAction: 'explain_compliance_status',
      rescueReason: 'explain_compliance_status',
      paramsPartial: { aspect: 'retention' },
      needsMultilingual: true,
    },
    {
      id: 'hy-forget-customer',
      locale: 'hy',
      prompt: 'Մոռանալ այս հաճախորդին',
      expectedAction: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
      needsMultilingual: true,
    },
    {
      id: 'ru-forget-customer',
      locale: 'ru',
      prompt: 'Забыть этого клиента',
      expectedAction: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
      needsMultilingual: true,
    },
    {
      id: 'hy-anonymize-customer-pii',
      locale: 'hy',
      prompt: 'Անոնիմացնել հաճախորդի PII-ը',
      expectedAction: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
      needsMultilingual: true,
    },
    {
      id: 'ru-anonymize-customer-pii',
      locale: 'ru',
      prompt: 'Анонимизировать PII клиента',
      expectedAction: 'admin_delete_customer_data',
      rescueReason: 'admin_delete_customer_data',
      needsMultilingual: true,
    },
  ];
