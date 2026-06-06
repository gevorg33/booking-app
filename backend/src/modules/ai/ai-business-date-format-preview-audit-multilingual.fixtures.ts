import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { BusinessDateFormat, BusinessTimeFormat } from '../../common/utils/business-date-format.util.js';

export type PreviewAuditDateFormatEvalAction =
  | 'preview_business_date_format'
  | 'audit_dashboard_date_surfaces';

export interface PreviewAuditDateFormatEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: PreviewAuditDateFormatEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
  needsMultilingual?: boolean;
}

/** Armenian/Russian dashboard date-format preview + audit phrasing (ai-cmd-fmt-8). */
export const BUSINESS_DATE_FORMAT_PREVIEW_AUDIT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian dashboard date-format preview + audit (fmt-1.6 deferred sweep):
  - preview_business_date_format: hy «նախադիտել US ամսաթվի ձևաչափը պահելուց առաջ», «ցույց տուր ինչպես կերևան գրանցումները 12-ժամյա ժամով», «համեմատիր եվրոպական ամսաթվի ձևաչափը ներկայիս կարգավորումների հետ», «ինչ կլինի օրինակ գրանցումը ISO ձևաչափով»; ru «предпросмотр американского формата дат перед сохранением», «покажи как будут выглядеть записи с 12-часовым временем», «сравни европейский формат дат с текущими настройками», «как будет выглядеть пример записи в ISO формате». READ sample booking preview before saving — NOT configure_business_date_format (mutate) and NOT explain_business_date_format (status only).
  - audit_dashboard_date_surfaces: hy «որ dashboard էջերն են դեռ օգտագործում browser locale-ը ամսաթվերի համար», «աուդիտ ամսաթվի մակերեսների dashboard-ում», «ցուցակ կոմպոնենտների որոնք դեռ օգտագործում են toLocaleString ամսաթվերի համար», «ինչը դեռ չի միգրացվել business date format-ին»; ru «какие страницы dashboard всё ещё используют locale браузера для дат», «аудит поверхностей формата дат в dashboard», «список компонентов с toLocaleString для дат», «что ещё не мигрировано на business date format». READ deferred fmt-1.6 inventory — NOT migrate_dashboard_date_display (guided sweep) and NOT preview_business_date_format.`;

export const MULTILINGUAL_PREVIEW_AUDIT_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS: PreviewAuditDateFormatEvalScenario[] =
  [
    {
      id: 'hy-preview-us-before-saving',
      locale: 'hy',
      prompt: 'Նախադիտել US ամսաթվի ձևաչափը պահելուց առաջ',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'MM/DD/YYYY' },
      dateFormat: 'MM/DD/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-12-hour-bookings',
      locale: 'hy',
      prompt: 'Ցույց տուր ինչպես կերևան գրանցումները 12-ժամյա ժամով',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { timeFormat: '12h' },
      timeFormat: '12h',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-european-vs-current',
      locale: 'hy',
      prompt:
        'Համեմատիր եվրոպական ամսաթվի ձևաչափը ներկայիս կարգավորումների հետ',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'DD/MM/YYYY' },
      dateFormat: 'DD/MM/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'hy-preview-iso-sample',
      locale: 'hy',
      prompt: 'Ինչ կլինի օրինակ գրանցումը ISO ձևաչափով',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'YYYY-MM-DD' },
      dateFormat: 'YYYY-MM-DD',
      needsMultilingual: true,
    },
    {
      id: 'hy-audit-locale-pages',
      locale: 'hy',
      prompt:
        'Որ dashboard էջերն են դեռ օգտագործում browser locale-ը ամսաթվերի համար',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'hy-audit-date-surfaces',
      locale: 'hy',
      prompt: 'Աուդիտ ամսաթվի մակերեսների dashboard-ում',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'hy-audit-tolocalestring-list',
      locale: 'hy',
      prompt:
        'Ցուցակ կոմպոնենտների որոնք դեռ օգտագործում են toLocaleString ամսաթվերի համար',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'hy-audit-not-migrated',
      locale: 'hy',
      prompt: 'Ինչը դեռ չի միգրացվել business date format-ին',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-us-before-saving',
      locale: 'ru',
      prompt: 'Предпросмотр американского формата дат перед сохранением',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'MM/DD/YYYY' },
      dateFormat: 'MM/DD/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-12-hour-bookings',
      locale: 'ru',
      prompt: 'Покажи как будут выглядеть записи с 12-часовым временем',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { timeFormat: '12h' },
      timeFormat: '12h',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-european-vs-current',
      locale: 'ru',
      prompt: 'Сравни европейский формат дат с текущими настройками',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'DD/MM/YYYY' },
      dateFormat: 'DD/MM/YYYY',
      needsMultilingual: true,
    },
    {
      id: 'ru-preview-iso-sample',
      locale: 'ru',
      prompt: 'Как будет выглядеть пример записи в ISO формате',
      expectedAction: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
      paramsPartial: { dateFormat: 'YYYY-MM-DD' },
      dateFormat: 'YYYY-MM-DD',
      needsMultilingual: true,
    },
    {
      id: 'ru-audit-locale-pages',
      locale: 'ru',
      prompt:
        'Какие страницы dashboard всё ещё используют locale браузера для дат',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'ru-audit-date-surfaces',
      locale: 'ru',
      prompt: 'Аудит поверхностей формата дат в dashboard',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'ru-audit-tolocalestring-list',
      locale: 'ru',
      prompt: 'Список компонентов с toLocaleString для дат',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
    {
      id: 'ru-audit-not-migrated',
      locale: 'ru',
      prompt: 'Что ещё не мигрировано на business date format',
      expectedAction: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
      needsMultilingual: true,
    },
  ];
