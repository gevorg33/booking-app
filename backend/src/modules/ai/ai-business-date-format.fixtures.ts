import { DATE_INPUT_FORMAT_CLASSIFIER_RULES } from './ai-date-input-format.fixtures.js';
import { NOTIFICATION_DATE_FORMAT_CLASSIFIER_RULES } from './ai-notification-date-format.fixtures.js';

/** Dashboard classifier rules for business date/time format (ai-cmd-fmt-1..10). */
export const BUSINESS_DATE_FORMAT_CLASSIFIER_RULES = `- configure_business_date_format: MUTATE — set salon dateFormat (DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD) and/or timeFormat (24h | 12h) in business settings. Triggers: use/switch/set + US/European/ISO date format; 12-hour or 24-hour time. "Use US date format" → dateFormat=MM/DD/YYYY. "Switch to 12-hour time" → timeFormat=12h. "Set ISO dates" → dateFormat=YYYY-MM-DD. NOT explain_business_date_format (read-only status).
- explain_business_date_format: READ — explain current business dateFormat and timeFormat plus examples of today's date in each supported date format and a sample time in the active time format. Triggers: what/which/explain/show + date format/time format/salon dates. NOT configure_business_date_format (mutate), NOT explain_booking_date_format (customer booking page visitor display), NOT preview_business_date_format (alternate preview), and NOT audit_dashboard_date_surfaces (migration inventory).
- preview_business_date_format: READ — preview a sample booking date/time in current settings vs an alternate dateFormat and/or timeFormat before saving. Triggers: preview/compare/show how/what would + US/European/ISO/12-hour/24-hour + before saving or vs current. Optional dateFormat/timeFormat params. NOT configure_business_date_format (mutate) and NOT explain_business_date_format (status only).
- audit_dashboard_date_surfaces: READ — list dashboard pages/components still using browser locale, toLocaleString, or Intl helpers vs business format cache (deferred fmt-1.6 sweep). Triggers: audit/list/scan/which/what + dashboard + date surfaces/locale/toLocaleString/migrated. NOT migrate_dashboard_date_display (mutate sweep) and NOT preview_business_date_format.
- migrate_dashboard_date_display: MUTATE — guided sweep checklist to replace deferred toLocaleString/Intl date calls with formatDateDisplay / formatTimeDisplay (does not edit frontend files). Triggers: migrate/replace/sweep/fix + dashboard/deferred/toLocaleString/formatDateDisplay. Optional surfaceId filter. NOT audit_dashboard_date_surfaces (inventory) and NOT configure_business_date_format (settings).
- Examples:
  - "Use US date format" → configure_business_date_format, dateFormat=MM/DD/YYYY
  - "Switch to 12-hour time" → configure_business_date_format, timeFormat=12h
  - "Set ISO dates for our salon" → configure_business_date_format, dateFormat=YYYY-MM-DD
  - "What date format does our salon use?" → explain_business_date_format
  - "Explain our date and time format settings" → explain_business_date_format
  - "Show date format examples for today" → explain_business_date_format
  - "Preview US date format before saving" → preview_business_date_format, dateFormat=MM/DD/YYYY
  - "Show how bookings would look with 12-hour time" → preview_business_date_format, timeFormat=12h
  - "Which dashboard pages still use browser locale for dates?" → audit_dashboard_date_surfaces
  - "List components still using toLocaleString for dates" → audit_dashboard_date_surfaces
  - "Migrate deferred dashboard date display surfaces to formatDateDisplay" → migrate_dashboard_date_display
  - "Replace toLocaleString date calls in the dashboard" → migrate_dashboard_date_display

${NOTIFICATION_DATE_FORMAT_CLASSIFIER_RULES}

${DATE_INPUT_FORMAT_CLASSIFIER_RULES}`;

/** Declared so the array is one type, not a union of six literal shapes. */
export type ConfigureBusinessDateFormatPromptFixture = {
  id: string;
  prompt: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
};

export const CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS: readonly ConfigureBusinessDateFormatPromptFixture[] = [
  {
    id: 'use-us-date-format',
    prompt: 'Use US date format',
    dateFormat: 'MM/DD/YYYY' as const,
  },
  {
    id: 'switch-12-hour-time',
    prompt: 'Switch to 12-hour time',
    timeFormat: '12h' as const,
  },
  {
    id: 'set-iso-dates',
    prompt: 'Set ISO dates for our salon',
    dateFormat: 'YYYY-MM-DD' as const,
  },
  {
    id: 'use-european-date-format',
    prompt: 'Use European date format for our salon',
    dateFormat: 'DD/MM/YYYY' as const,
  },
  {
    id: 'switch-24-hour-time',
    prompt: 'Switch to 24-hour time',
    timeFormat: '24h' as const,
  },
  {
    id: 'set-dd-mm-format',
    prompt: 'Set DD/MM date format for the dashboard',
    dateFormat: 'DD/MM/YYYY' as const,
  },
] as const;

export const EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS = [
  {
    id: 'what-date-format',
    prompt: 'What date format does our salon use?',
  },
  {
    id: 'explain-date-time-settings',
    prompt: 'Explain our date and time format settings',
  },
  {
    id: 'how-dates-displayed',
    prompt: 'How are dates displayed in the dashboard?',
  },
  {
    id: 'current-time-format',
    prompt: 'What is our current time format?',
  },
  {
    id: 'date-format-examples-today',
    prompt: 'Show date format examples for today',
  },
  {
    id: 'which-date-format-configured',
    prompt: 'Which date format is configured for the business?',
  },
] as const;
