import {
  CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS,
  EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS,
} from './ai-business-date-format.fixtures.js';
import {
  AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS,
  MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS,
  PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS,
} from './ai-dashboard-date-surface-audit.fixtures.js';
import {
  isAuditDashboardDateSurfacesPrompt,
  isConfigureBusinessDateFormatPrompt,
  isExplainBusinessDateFormatPrompt,
  isMigrateDashboardDateDisplayPrompt,
  isPreviewBusinessDateFormatPrompt,
  parseBusinessDateFormatFromPrompt,
  rescueBusinessDateFormatIntent,
} from './ai-business-date-format.util.js';

describe('ai-business-date-format.util (ai-cmd-fmt-1..2)', () => {
  it.each(CONFIGURE_BUSINESS_DATE_FORMAT_PROMPTS)(
    'detects configure prompt $id',
    ({ prompt, dateFormat, timeFormat }) => {
      expect(isConfigureBusinessDateFormatPrompt(prompt)).toBe(true);
      expect(isExplainBusinessDateFormatPrompt(prompt)).toBe(false);
      const parsed = parseBusinessDateFormatFromPrompt(prompt);
      if (dateFormat) expect(parsed?.dateFormat).toBe(dateFormat);
      if (timeFormat) expect(parsed?.timeFormat).toBe(timeFormat);
      expect(rescueBusinessDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'configure_business_date_format',
        rescueReason: 'configure_business_date_format',
      });
    },
  );

  it.each(EXPLAIN_BUSINESS_DATE_FORMAT_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainBusinessDateFormatPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessDateFormatPrompt(prompt)).toBe(false);
      expect(rescueBusinessDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'explain_business_date_format',
        rescueReason: 'explain_business_date_format',
      });
    },
  );

  it.each(PREVIEW_BUSINESS_DATE_FORMAT_PROMPTS)(
    'detects preview prompt $id',
    ({ prompt }) => {
      expect(isPreviewBusinessDateFormatPrompt(prompt)).toBe(true);
      expect(isExplainBusinessDateFormatPrompt(prompt)).toBe(false);
      expect(rescueBusinessDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'preview_business_date_format',
        rescueReason: 'preview_business_date_format',
      });
    },
  );

  it.each(AUDIT_DASHBOARD_DATE_SURFACES_PROMPTS)(
    'detects audit prompt $id',
    ({ prompt }) => {
      expect(isAuditDashboardDateSurfacesPrompt(prompt)).toBe(true);
      expect(isMigrateDashboardDateDisplayPrompt(prompt)).toBe(false);
      expect(rescueBusinessDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'audit_dashboard_date_surfaces',
        rescueReason: 'audit_dashboard_date_surfaces',
      });
    },
  );

  it.each(MIGRATE_DASHBOARD_DATE_DISPLAY_PROMPTS)(
    'detects migrate prompt $id',
    ({ prompt }) => {
      expect(isMigrateDashboardDateDisplayPrompt(prompt)).toBe(true);
      expect(isAuditDashboardDateSurfacesPrompt(prompt)).toBe(false);
      expect(rescueBusinessDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'migrate_dashboard_date_display',
        rescueReason: 'migrate_dashboard_date_display',
      });
    },
  );

  it('does not rescue when action is already configure_business_date_format', () => {
    expect(
      rescueBusinessDateFormatIntent(
        'Use US date format',
        'configure_business_date_format',
      ),
    ).toBeNull();
  });
});
