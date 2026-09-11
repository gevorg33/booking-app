/** Curated fmt-1.6 dashboard date-display surface inventory (ai-cmd-fmt-6). */
export type DashboardDateSurfaceStatus =
  | 'business_format'
  | 'locale_fallback'
  | 'intl_helper';

export interface DashboardDateSurfaceEntry {
  id: string;
  page: string;
  component: string;
  path: string;
  status: DashboardDateSurfaceStatus;
  mechanism: string;
  notes?: string;
}

export const DASHBOARD_DATE_SURFACE_MIGRATED: DashboardDateSurfaceEntry[] = [
  {
    id: 'calendar-page',
    page: 'Calendar',
    component: 'dashboard/calendar/page',
    path: 'frontend/src/app/(dashboard)/dashboard/calendar/page.tsx',
    status: 'business_format',
    mechanism:
      'formatDateDisplay / formatScheduleTime via business format cache',
  },
  {
    id: 'bookings-page',
    page: 'Bookings',
    component: 'dashboard/bookings/page',
    path: 'frontend/src/app/(dashboard)/dashboard/bookings/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay / formatBookingDateTimeRange',
  },
  {
    id: 'appointments-page',
    page: 'Appointments',
    component: 'dashboard/appointments/page',
    path: 'frontend/src/app/(dashboard)/dashboard/appointments/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay / formatScheduleTime',
  },
  {
    id: 'customers-page',
    page: 'Customers',
    component: 'dashboard/customers/page',
    path: 'frontend/src/app/(dashboard)/dashboard/customers/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay',
  },
  {
    id: 'reports-page',
    page: 'Reports',
    component: 'dashboard/reports/page',
    path: 'frontend/src/app/(dashboard)/dashboard/reports/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay / formatScheduleTime',
  },
  {
    id: 'schedule-page',
    page: 'Schedule',
    component: 'dashboard/schedule/page',
    path: 'frontend/src/app/(dashboard)/dashboard/schedule/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay / formatScheduleTime',
  },
  {
    id: 'booking-detail-panel',
    page: 'Bookings',
    component: 'booking-detail-panel',
    path: 'frontend/src/components/bookings/booking-detail-panel.tsx',
    status: 'business_format',
    mechanism: 'formatBookingDateTimeRange',
  },
  {
    id: 'customer-detail-panel',
    page: 'Customers',
    component: 'customer-detail-panel',
    path: 'frontend/src/components/customers/customer-detail-panel.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay',
  },
  {
    id: 'date-picker',
    page: 'Shared UI',
    component: 'date-picker',
    path: 'frontend/src/components/ui/date-picker.tsx',
    status: 'business_format',
    mechanism: 'businessDateFormatPattern + formatDateDisplay',
  },
  {
    id: 'business-date-format-settings',
    page: 'Settings',
    component: 'business-date-format-settings',
    path: 'frontend/src/components/settings/business-date-format-settings.tsx',
    status: 'business_format',
    mechanism: 'settings preview via business format cache',
  },
  {
    id: 'gift-cards-tab',
    page: 'Gift cards',
    component: 'dashboard-gift-cards-tab',
    path: 'frontend/src/components/gift-cards/dashboard-gift-cards-tab.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay',
  },
  {
    id: 'reviews-page',
    page: 'Reviews',
    component: 'dashboard/reviews/page',
    path: 'frontend/src/app/(dashboard)/dashboard/reviews/page.tsx',
    status: 'business_format',
    mechanism: 'formatDateDisplay',
  },
] as const;

/** Deferred fmt-1.6 sweep — still locale/Intl instead of business format cache. */
export const DASHBOARD_DATE_SURFACE_DEFERRED: DashboardDateSurfaceEntry[] = [
  {
    id: 'ai-autopilot-settings',
    page: 'AI settings',
    component: 'ai-autopilot-settings',
    path: 'frontend/src/components/ai-autopilot-settings.tsx',
    status: 'locale_fallback',
    mechanism: 'Date.toLocaleString() for lastRunAt',
    notes: 'Autopilot last-run timestamp ignores business timeFormat',
  },
  {
    id: 'ai-audit-log',
    page: 'AI audit',
    component: 'ai-audit-log',
    path: 'frontend/src/components/ai-audit-log.tsx',
    status: 'locale_fallback',
    mechanism: 'Date.toLocaleString() for entry.timestamp',
    notes: 'AI command audit log uses browser locale',
  },
  {
    id: 'ai-agent-workspaces',
    page: 'AI workspaces',
    component: 'ai-agent-workspaces',
    path: 'frontend/src/components/ai-agent-workspaces.tsx',
    status: 'locale_fallback',
    mechanism: 'Date.toLocaleString() / toLocaleTimeString() for booking slots',
    notes: 'Workspace booking previews bypass formatDateDisplay',
  },
  {
    id: 'business-compliance-settings',
    page: 'Settings → Compliance',
    component: 'business-compliance-settings',
    path: 'frontend/src/components/settings/business-compliance-settings.tsx',
    status: 'locale_fallback',
    mechanism: 'Date.toLocaleString() for breach/incident timestamps',
    notes: 'GDPR breach log and access-log rows use browser locale',
  },
  {
    id: 'locale-date-format-helper',
    page: 'Shared helpers',
    component: 'locale-date-format',
    path: 'frontend/src/lib/locale-date-format.ts',
    status: 'intl_helper',
    mechanism: 'Intl.DateTimeFormat(intlLocale) weekday/month labels',
    notes:
      'Calendar chrome labels still locale-driven (not business dateFormat)',
  },
  {
    id: 'calendar-date-util',
    page: 'Shared helpers',
    component: 'calendar-date.util',
    path: 'frontend/src/lib/calendar-date.util.ts',
    status: 'intl_helper',
    mechanism: 'Intl.DateTimeFormat en-CA for ISO day keys',
    notes:
      'Timezone day-key helper — internal, not user-facing booking display',
  },
  {
    id: 'date-picker-calendar-util',
    page: 'Shared helpers',
    component: 'date-picker-calendar.util',
    path: 'frontend/src/lib/date-picker-calendar.util.ts',
    status: 'intl_helper',
    mechanism: 'Intl.DateTimeFormat for month/weekday chrome',
    notes: 'Picker header labels still locale-driven',
  },
] as const;

export const DASHBOARD_DATE_SURFACE_AUDIT_CATALOG: DashboardDateSurfaceEntry[] =
  [...DASHBOARD_DATE_SURFACE_MIGRATED, ...DASHBOARD_DATE_SURFACE_DEFERRED];

/** Declared so the array is one type, not a union of six literal shapes. */
export type PreviewBusinessDateFormatPromptFixture = {
  id: string;
  prompt: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat?: '12h' | '24h';
};

export const PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS: readonly PreviewBusinessDateFormatPromptFixture[] = [
  {
    id: 'preview-us-before-saving',
    prompt: 'Preview US date format before saving',
    dateFormat: 'MM/DD/YYYY' as const,
  },
  {
    id: 'preview-12-hour-sample',
    prompt: 'Show how bookings would look with 12-hour time',
    timeFormat: '12h' as const,
  },
  {
    id: 'preview-mm-dd-vs-current',
    prompt: 'Preview MM/DD format vs current settings',
    dateFormat: 'MM/DD/YYYY' as const,
  },
  {
    id: 'preview-iso-sample-booking',
    prompt: 'What would a sample booking look like in ISO format?',
    dateFormat: 'YYYY-MM-DD' as const,
  },
  {
    id: 'compare-european-format',
    prompt: 'Compare European date format to what we use now',
    dateFormat: 'DD/MM/YYYY' as const,
  },
  {
    id: 'preview-24-hour-time',
    prompt: 'Preview 24-hour time for a sample booking',
    timeFormat: '24h' as const,
  },
] as const;

/** Per-surface replacement guidance for fmt-1.7 guided migration sweep. */
export interface DashboardDateMigrationStep {
  surfaceId: string;
  page: string;
  path: string;
  order: number;
  mechanism: string;
  replacement: string;
  beforeExample: string;
  afterExample: string;
  notes?: string;
}

export const DASHBOARD_DATE_MIGRATION_STEPS: DashboardDateMigrationStep[] =
  DASHBOARD_DATE_SURFACE_DEFERRED.map((entry, index) => {
    const base = {
      surfaceId: entry.id,
      page: entry.page,
      path: entry.path,
      order: index + 1,
      mechanism: entry.mechanism,
      notes: entry.notes,
    };

    if (entry.status === 'locale_fallback') {
      return {
        ...base,
        replacement:
          'Replace Date.toLocaleString()/toLocaleTimeString() with formatDateDisplay (date keys) or formatTimeDisplay (instants) using the business format cache.',
        beforeExample: 'new Date(value).toLocaleString()',
        afterExample:
          'formatTimeDisplay(new Date(value), { dateFormat, timeFormat, timeZone })',
      };
    }

    return {
      ...base,
      replacement:
        'Keep internal Intl day-key helpers where non-user-facing; bind user-visible calendar chrome to businessDateFormatPattern / formatDateDisplay where labels are shown to staff.',
      beforeExample:
        'new Intl.DateTimeFormat(intlLocale, { weekday: "short" })',
      afterExample:
        'formatDateDisplay(dateKey, intlLocale, { dateFormat, timeFormat, timeZone }) for visible labels',
    };
  });

/** Declared so the array is one type, not a union of six literal shapes. */
export type MigrateDashboardDateDisplayPromptFixture = {
  id: string;
  prompt: string;
  surfaceId?: string;
};

export const MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS: readonly MigrateDashboardDateDisplayPromptFixture[] = [
  {
    id: 'migrate-deferred-surfaces',
    prompt:
      'Migrate deferred dashboard date display surfaces to formatDateDisplay',
  },
  {
    id: 'replace-tolocalestring',
    prompt: 'Replace toLocaleString date calls in the dashboard',
  },
  {
    id: 'sweep-intl-helpers',
    prompt: 'Sweep remaining Intl date helpers to business format',
  },
  {
    id: 'fix-locale-fallback-dates',
    prompt: 'Fix locale fallback date display in AI components',
  },
  {
    id: 'guided-date-migration',
    prompt: 'Run guided migration for dashboard date formatting',
  },
  {
    id: 'migrate-ai-audit-log',
    prompt: 'Migrate ai-audit-log timestamps to formatTimeDisplay',
    surfaceId: 'ai-audit-log',
  },
] as const;

export const AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS = [
  {
    id: 'audit-locale-surfaces',
    prompt: 'Which dashboard pages still use browser locale for dates?',
  },
  {
    id: 'audit-date-surfaces',
    prompt: 'Audit date format surfaces in the dashboard',
  },
  {
    id: 'list-tolocalestring-components',
    prompt: 'List components still using toLocaleString for dates',
  },
  {
    id: 'what-not-migrated',
    prompt: "What hasn't been migrated to business date format yet?",
  },
  {
    id: 'deferred-fmt-sweep',
    prompt: 'Show deferred fmt-1.6 date display surfaces',
  },
  {
    id: 'scan-dashboard-date-display',
    prompt: 'Scan the dashboard for date display inconsistencies',
  },
] as const;
