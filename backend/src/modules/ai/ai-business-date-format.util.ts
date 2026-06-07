import {
  BUSINESS_DATE_FORMATS,
  BUSINESS_TIME_FORMATS,
  normalizeBusinessDateFormat,
  normalizeBusinessTimeFormat,
  type BusinessDateFormat,
  type BusinessTimeFormat,
} from '../../common/utils/business-date-format.util.js';
import {
  hasProviderPushTimeContext,
  hasProviderScheduleDisplayContext,
} from './ai-provider-date-format.util.js';

export const BUSINESS_DATE_FORMAT_INTENTS = [
  'configure_business_date_format',
  'explain_business_date_format',
  'preview_business_date_format',
  'audit_dashboard_date_surfaces',
  'migrate_dashboard_date_display',
  'explain_notification_date_format',
  'preview_notification_datetime',
  'notify_patient_result_ready',
  'explain_date_input_format',
  'preview_date_input_parse',
] as const;

export const BUSINESS_DATE_FORMAT_MUTATE_INTENTS = [
  'configure_business_date_format',
  'migrate_dashboard_date_display',
  'notify_patient_result_ready',
] as const;

export type BusinessDateFormatIntent =
  (typeof BUSINESS_DATE_FORMAT_INTENTS)[number];

export interface ParsedConfigureBusinessDateFormat {
  dateFormat?: BusinessDateFormat;
  timeFormat?: BusinessTimeFormat;
}

const MUTATE_DATE_FORMAT_VERBS =
  /\b(set|switch|change|use|make|configure|update)\b/i;

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function extractExplicitDateFormat(
  prompt: string,
): BusinessDateFormat | undefined {
  for (const format of BUSINESS_DATE_FORMATS) {
    if (prompt.includes(format)) return format;
  }
  if (/\b(?:iso|yyyy-mm-dd)\b/i.test(prompt)) return 'YYYY-MM-DD';
  if (
    /\b(?:us|american|mm\/dd|mm-dd)\b/i.test(prompt) ||
    /(?:ամերիկան|ամերիկյան|US\s+ամսաթ)/i.test(prompt) ||
    /(?:американск|мм\/дд)/i.test(prompt)
  ) {
    return 'MM/DD/YYYY';
  }
  if (
    /\b(?:european|uk|british|dd\/mm|dd-mm)\b/i.test(prompt) ||
    /(?:եվրոպական|ևրոպական|DD\/MM)/i.test(prompt) ||
    /(?:европейск|дд\/мм)/i.test(prompt)
  ) {
    return 'DD/MM/YYYY';
  }
  return undefined;
}

function extractExplicitTimeFormat(
  prompt: string,
): BusinessTimeFormat | undefined {
  if (
    /\b12[- ]?hour\b/i.test(prompt) ||
    /\b12h\b/i.test(prompt) ||
    /12[- ]?ժամ/i.test(prompt) ||
    /12[- ]?час/i.test(prompt)
  ) {
    return '12h';
  }
  if (
    /\b24[- ]?hour\b/i.test(prompt) ||
    /\b24h\b/i.test(prompt) ||
    /24[- ]?ժամ/i.test(prompt) ||
    /24[- ]?час/i.test(prompt)
  ) {
    return '24h';
  }
  if (/\bam\/pm\b/i.test(prompt) || /\b12\s*hour\s+clock\b/i.test(prompt)) {
    return '12h';
  }
  return undefined;
}

export function parseBusinessDateFormatFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureBusinessDateFormat | null {
  const dateFormatFromParams = normalizeBusinessDateFormat(
    typeof params.dateFormat === 'string' ? params.dateFormat : undefined,
  );
  const timeFormatFromParams = normalizeBusinessTimeFormat(
    typeof params.timeFormat === 'string' ? params.timeFormat : undefined,
  );

  const dateFormat = dateFormatFromParams ?? extractExplicitDateFormat(prompt);
  const timeFormat = timeFormatFromParams ?? extractExplicitTimeFormat(prompt);

  if (!dateFormat && !timeFormat) return null;
  return { dateFormat, timeFormat };
}

export function isConfigureBusinessDateFormatPrompt(prompt: string): boolean {
  if (hasProviderPushTimeContext(prompt)) return false;
  if (
    /\b(preview|compare|vs\s+current|before\s+(?:saving|changing|switching)|sample\s+booking|what\s+would|audit|scan|migrate)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(why|how)\b/i.test(prompt) ||
    /(?:ինչու|ինչպես|почему|зачем|как\s+отображ)/i.test(prompt)
  ) {
    return false;
  }

  if (
    MUTATE_DATE_FORMAT_VERBS.test(prompt) &&
    /\b(?:date\s+format|time\s+format|dates?|iso|us\s+date|european\s+date)\b/i.test(
      prompt,
    )
  ) {
    return Boolean(parseBusinessDateFormatFromPrompt(prompt));
  }

  if (
    /\b(?:use|switch|set)\b/i.test(prompt) &&
    /\b(?:us|european|iso)\b/i.test(prompt) &&
    /\b(?:date|format)\b/i.test(prompt)
  ) {
    return Boolean(parseBusinessDateFormatFromPrompt(prompt));
  }

  if (
    /\b(?:switch|use|set)\b/i.test(prompt) &&
    /\b(?:12[- ]?hour|24[- ]?hour|12h|24h|am\/pm)\b/i.test(prompt)
  ) {
    return Boolean(parseBusinessDateFormatFromPrompt(prompt));
  }

  if (containsArmenianScript(prompt)) {
    if (
      /([Սս]ահմանել|[Փփ]ոխել|[Օո]գտագործել|[Կկ]արգավորիր|[Աա]նցնել)/.test(
        prompt,
      ) &&
      /(ամսաթիվ|ամսաթվ|ժամ|ձևաչափ|date\s*format|time\s*format|ISO|US|12|24|ժամացույց|եվրոպական|ևրոպական)/i.test(
        prompt,
      )
    ) {
      return Boolean(parseBusinessDateFormatFromPrompt(prompt));
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(установить|сменить|переключить|использовать)/i.test(prompt) &&
      /(формат\s+дат|дата|времени|ISO|US|12|24|американск|европейск)/i.test(
        prompt,
      )
    ) {
      return Boolean(parseBusinessDateFormatFromPrompt(prompt));
    }
  }

  return false;
}

function hasBookingPageVisitorContext(prompt: string): boolean {
  return (
    /\b(booking page|booking site|this page|on this page|online booking|public booking|appointment page|for bookings?)\b/i.test(
      prompt,
    ) ||
    /\b(?:here|this site|calendar)\b/i.test(prompt) ||
    /(?:էջ|կայք|գրանցման)/i.test(prompt) ||
    /(?:страниц|сайт|записи)/i.test(prompt)
  );
}

export function extractMigrationSurfaceId(prompt: string): string | null {
  const normalized = prompt.toLowerCase();
  const surfaceIds = [
    'ai-autopilot-settings',
    'ai-audit-log',
    'ai-agent-workspaces',
    'business-compliance-settings',
    'locale-date-format-helper',
    'calendar-date-util',
    'date-picker-calendar-util',
  ];
  for (const id of surfaceIds) {
    if (normalized.includes(id)) return id;
  }
  if (/\bai-audit-log\b/i.test(prompt)) return 'ai-audit-log';
  if (/\bai-autopilot\b/i.test(prompt)) return 'ai-autopilot-settings';
  if (/\bagent-workspaces\b/i.test(prompt)) return 'ai-agent-workspaces';
  if (/\bcompliance-settings\b/i.test(prompt))
    return 'business-compliance-settings';
  return null;
}

export function isMigrateDashboardDateDisplayPrompt(prompt: string): boolean {
  if (isConfigureBusinessDateFormatPrompt(prompt)) return false;

  const migrateVerbs =
    /\b(migrate|replace|swap|convert|fix|sweep|update|switch|run)\b/i;
  const migrateTargets =
    /\b(?:dashboard|deferred\s+surfaces?|tolocalestring|tolocale(?:date|time)string|intl(?:\.datetimeformat)?|formatdatedisplay|formattimedisplay|business\s+format\s+cache|locale\s+fallback|date\s+display|fmt-1\.6)\b/i;

  if (migrateVerbs.test(prompt) && migrateTargets.test(prompt)) {
    return true;
  }

  if (
    /\b(?:guided\s+)?(?:migration|sweep)\b/i.test(prompt) &&
    /\b(?:date|dashboard|fmt-1\.6|display)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    migrateVerbs.test(prompt) &&
    /\b(?:ai-audit-log|ai-autopilot|autopilot-settings|agent-workspaces|compliance-settings)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(վերաթողարկել|փոխարինել|միգրացիա|ուղղել|թարմացնել)/i.test(prompt) &&
      /(dashboard|tolocalestring|ամսաթիվ|էջ|կոմպոնենտ|formatDateDisplay|deferred)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(мигрировать|заменить|исправить|обновить|перевести)/i.test(prompt) &&
      /(dashboard|toLocaleString|дата|компонент|formatDateDisplay|deferred)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  return false;
}

function isNonDashboardVisitorSurfacePrompt(prompt: string): boolean {
  if (
    /\b(booking\s+page|booking\s+site|language\s+menu|checkout\s+currency|package\s+display\s+name|localized\s+(?:name|title))\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/(գրանցման\s+էջ|լեզու|անվանում|արժույթ)/i.test(prompt)) {
    return true;
  }
  if (/(страниц\w*\s+записи|язык|названи|валют)/i.test(prompt)) {
    return true;
  }
  if (
    /\b(?:booking\s+page|this\s+(?:booking\s+)?site|on\s+this\s+page)\b/i.test(
      prompt,
    ) &&
    /\b(?:date\s+format|time\s+format|dates?\s+show|dd\/mm|mm\/dd)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  return false;
}

export function isAuditDashboardDateSurfacesPrompt(prompt: string): boolean {
  if (isMigrateDashboardDateDisplayPrompt(prompt)) return false;
  if (isNonDashboardVisitorSurfacePrompt(prompt)) return false;

  if (
    /\btoLocaleString\b/i.test(prompt) &&
    /\b(?:date|component|dashboard|list)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:audit|scan|inventory)\b/i.test(prompt) &&
    /\b(?:dashboard|surfaces?|pages?|components?)\b/i.test(prompt) &&
    /\b(?:dates?|locale|format|display)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:which|what|list|show)\b/i.test(prompt) &&
    /\b(?:dashboard|pages?|components?)\b/i.test(prompt) &&
    /\b(?:still\s+using|not\s+migrated|deferred|locale|browser\s+locale|business\s+format)\b/i.test(
      prompt,
    ) &&
    /\b(?:dates?|tolocalestring|format)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:fmt-1\.6|deferred\s+fmt)\b/i.test(prompt) &&
    /\b(?:date|surface|sweep|display)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:not\s+migrated|hasn['']t\s+been\s+migrated|migrated\s+to)\b/i.test(
      prompt,
    ) &&
    /\b(?:date\s+format|business\s+format|business\s+date)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:which|what|list)\b/i.test(prompt) &&
    /\b(?:pages?|components?|surfaces?)\b/i.test(prompt) &&
    /\b(?:locale|tolocalestring|browser)\b/i.test(prompt) &&
    /\b(?:dates?)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչ|որ|ցուցադր|ցույց\s+տուր|ցուցակ|աուդիտ)/i.test(prompt) &&
      /(dashboard|locale|ամսաթիվ|toLocaleString|մակերես|օրաձև|ժամաձև)/i.test(
        prompt,
      ) &&
      !/(լեզու|լեզուներ)/i.test(prompt)
    ) {
      return true;
    }
    if (
      /(չի\s+միգրացվել|դեռ\s+չի)/i.test(prompt) &&
      /(business\s+date|date\s+format|ամսաթիվ)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(аудит|список|покажи|какие|какой|какая)/i.test(prompt) &&
      /(dashboard|toLocaleString|поверхност|locale\s+браузер|не\s+мигрирован|страниц|браузер)/i.test(
        prompt,
      ) &&
      /(дат[аы]?|формат)/i.test(prompt)
    ) {
      return true;
    }
    if (
      /(не\s+мигрировано|ещё\s+не\s+мигрировано)/i.test(prompt) &&
      /(business\s+date|формат\s+дат|date\s+format)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function isPreviewBusinessDateFormatPrompt(prompt: string): boolean {
  if (isConfigureBusinessDateFormatPrompt(prompt)) return false;
  if (isMigrateDashboardDateDisplayPrompt(prompt)) return false;
  if (isAuditDashboardDateSurfacesPrompt(prompt)) return false;

  if (
    /\b(confirmation|reminder|gift\s*card|cancellation)\b/i.test(prompt) &&
    /\b(email|e-mail|whatsapp|sms|message)\b/i.test(prompt) &&
    /\b(preview|sample|show\s+how|what\s+would|look\s+like)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(preview|compare|sample)\b/i.test(prompt) &&
    /\b(?:date\s+format|time\s+format|booking|us|european|iso|12[- ]?hour|24[- ]?hour|mm\/dd|dd\/mm)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:show\s+how|what\s+would)\b/i.test(prompt) &&
    /\b(?:booking|date|time|look|display)\b/i.test(prompt) &&
    /\b(?:format|hour|us|european|iso|12|24|mm\/dd|dd\/mm|before\s+saving)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\bcompare\b/i.test(prompt) &&
    /\b(?:european|us|iso|mm\/dd|dd\/mm|date\s+format|time\s+format)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:before\s+(?:saving|changing|switching)|vs\s+current|compared\s+to|alternate)\b/i.test(
      prompt,
    ) &&
    /\b(?:date\s+format|time\s+format|format)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(նախադիտ|համեմատ|ցույց\s+տուր|ինչ\s+կլինի)/i.test(prompt) &&
      /(ամսաթիվ|ժամ|ձևաչափ|booking|US|ISO|12|24|գրանցում|պահելուց)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(предпросмотр|сравни|покажи\s+как|как\s+будет)/i.test(prompt) &&
      /(формат|дата|времени|booking|US|ISO|12|24|запис)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function isExplainBusinessDateFormatPrompt(prompt: string): boolean {
  if (hasProviderScheduleDisplayContext(prompt)) return false;
  if (isMigrateDashboardDateDisplayPrompt(prompt)) return false;
  if (isAuditDashboardDateSurfacesPrompt(prompt)) return false;
  if (isPreviewBusinessDateFormatPrompt(prompt)) return false;

  if (
    /\b(?:typed|date\s+input|date\s+field|calendar\s+picker|parse\s+input)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(confirmation|reminder|gift\s*card|cancellation)\b/i.test(prompt) &&
    /\b(email|e-mail|whatsapp|sms|message)\b/i.test(prompt) &&
    /\b(?:date|time|format|display)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    isConfigureBusinessDateFormatPrompt(prompt) &&
    parseBusinessDateFormatFromPrompt(prompt)
  ) {
    return false;
  }

  if (hasBookingPageVisitorContext(prompt)) {
    return false;
  }

  if (
    /\b(explain|describe|show|tell me|what(?:'s|\s+is)?|which|how)\b/i.test(
      prompt,
    ) &&
    /\b(?:date\s+format|time\s+format|date\s+and\s+time\s+format)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(?:salon|business|dashboard)\b/i.test(prompt) &&
    /\b(?:date\s+format|time\s+format|dates?\s+displayed)\b/i.test(prompt) &&
    !MUTATE_DATE_FORMAT_VERBS.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:examples?|example)\b/i.test(prompt) &&
    /\b(?:today|date\s+format)\b/i.test(prompt)
  ) {
    return true;
  }

  if (
    /\b(?:configured|current)\b/i.test(prompt) &&
    /\b(?:date\s+format|time\s+format)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /([Իի]նչ|[Ոո]ր|[Բբ]ացատրիր|[Ցց]ույց\s+տուր)/.test(prompt) &&
      /(ամսաթիվ|ժամ|ձևաչափ|date\s*format|time\s*format|օրինակ)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(какой|какая|объясни|покажи)/i.test(prompt) &&
      /(формат\s+дат|дата|времени|пример)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueBusinessDateFormatIntent(
  prompt: string,
  action: string,
): { action: BusinessDateFormatIntent; rescueReason: string } | null {
  if ((BUSINESS_DATE_FORMAT_INTENTS as readonly string[]).includes(action)) {
    return null;
  }
  if (isConfigureBusinessDateFormatPrompt(prompt)) {
    return {
      action: 'configure_business_date_format',
      rescueReason: 'configure_business_date_format',
    };
  }
  if (isMigrateDashboardDateDisplayPrompt(prompt)) {
    return {
      action: 'migrate_dashboard_date_display',
      rescueReason: 'migrate_dashboard_date_display',
    };
  }
  if (isPreviewBusinessDateFormatPrompt(prompt)) {
    return {
      action: 'preview_business_date_format',
      rescueReason: 'preview_business_date_format',
    };
  }
  if (isExplainBusinessDateFormatPrompt(prompt)) {
    return {
      action: 'explain_business_date_format',
      rescueReason: 'explain_business_date_format',
    };
  }
  if (isAuditDashboardDateSurfacesPrompt(prompt)) {
    return {
      action: 'audit_dashboard_date_surfaces',
      rescueReason: 'audit_dashboard_date_surfaces',
    };
  }
  return null;
}

export function dateFormatLabel(format: BusinessDateFormat): string {
  if (format === 'MM/DD/YYYY') return 'US (MM/DD/YYYY)';
  if (format === 'YYYY-MM-DD') return 'ISO (YYYY-MM-DD)';
  return 'European (DD/MM/YYYY)';
}

export function timeFormatLabel(format: BusinessTimeFormat): string {
  return format === '12h' ? '12-hour AM/PM' : '24-hour';
}
