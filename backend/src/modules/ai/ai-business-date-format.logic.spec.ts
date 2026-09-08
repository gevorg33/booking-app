import {
  handleAuditDashboardDateSurfacesLogic,
  handleConfigureBusinessDateFormatLogic,
  handleExplainBookingDateFormatLogic,
  handleExplainBusinessDateFormatLogic,
  handleConfigureProviderPushDateFormatLogic,
  handleExplainDateInputFormatLogic,
  handleExplainProviderDateDisplayLogic,
  handleExplainNotificationDateFormatLogic,
  handleMigrateDashboardDateDisplayLogic,
  handlePreviewBusinessDateFormatLogic,
  handlePreviewDateInputParseLogic,
  handleNotifyPatientResultReadyLogic,
  handlePreviewNotificationDatetimeLogic,
} from './ai-business-date-format.logic.js';
import {
  DASHBOARD_DATE_SURFACE_DEFERRED,
  DASHBOARD_DATE_SURFACE_MIGRATED,
} from './ai-dashboard-date-surface-audit.fixtures.js';
import type { Business } from '../business/entities/business.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

describe('ai-business-date-format.logic (ai-cmd-fmt-1..2)', () => {
  const business: Business = makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    settings: { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' },
  });

  const businessRepo = {
    findOne: jest.fn(async () => ({ ...business })),
    save: jest.fn(async (b: Business) => b),
  };
  const resultRepo = {
    findOne: jest.fn(async () => ({ id: 'result-1' })),
    find: jest.fn(async () => [{ id: 'result-1' }]),
  };
  const sendClinicResultReady = jest.fn(async () => ({
    delivered: ['email', 'whatsapp'],
    pushSkippedReason: 'consumer_push_tokens_not_available',
  }));

  const deps = () => ({
    businessRepo,
    resultRepo,
    sendClinicResultReady,
    frontendUrl: 'https://app.test',
  });

  beforeEach(() => {
    jest.clearAllMocks();
    business.settings = { dateFormat: 'DD/MM/YYYY', timeFormat: '24h' };
    businessRepo.findOne.mockResolvedValue({ ...business });
  });

  it('configures US date format', async () => {
    const result = await handleConfigureBusinessDateFormatLogic(
      deps(),
      'biz-1',
      { dateFormat: 'MM/DD/YYYY' },
      'Use US date format',
    );
    expect(result.success).toBe(true);
    expect(result.details?.dateFormat).toBe('MM/DD/YYYY');
    expect(businessRepo.save).toHaveBeenCalled();
  });

  it('configures 12-hour time', async () => {
    const result = await handleConfigureBusinessDateFormatLogic(
      deps(),
      'biz-1',
      { timeFormat: '12h' },
      'Switch to 12-hour time',
    );
    expect(result.success).toBe(true);
    expect(result.details?.timeFormat).toBe('12h');
  });

  it('reports unchanged settings', async () => {
    const result = await handleConfigureBusinessDateFormatLogic(
      deps(),
      'biz-1',
      { dateFormat: 'DD/MM/YYYY' },
      'Use European date format for our salon',
    );
    expect(result.success).toBe(true);
    expect(result.details?.unchanged).toBe(true);
    expect(businessRepo.save).not.toHaveBeenCalled();
  });

  it('explains current format with examples', async () => {
    const result = await handleExplainBusinessDateFormatLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_business_date_format');
    expect(result.summary).toContain('DD/MM/YYYY');
    expect(result.summary).toContain('24-hour');
    expect(result.summary).toContain('Examples for today');
    expect(result.details?.examplesByFormat).toEqual(
      expect.objectContaining({
        'DD/MM/YYYY': expect.any(String),
        'MM/DD/YYYY': expect.any(String),
        'YYYY-MM-DD': expect.any(String),
      }),
    );
  });

  it('explains booking page date display for visitors (ai-cmd-fmt-4)', async () => {
    const result = await handleExplainBookingDateFormatLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_booking_date_format');
    expect(result.summary).toContain('booking page');
    expect(result.summary).toContain('browser locale');
    expect(result.details?.examplesByFormat).toEqual(
      expect.objectContaining({
        'DD/MM/YYYY': expect.any(String),
        'MM/DD/YYYY': expect.any(String),
      }),
    );
  });

  it('previews alternate US date format before saving (ai-cmd-fmt-5)', async () => {
    const result = await handlePreviewBusinessDateFormatLogic(
      deps(),
      'biz-1',
      { dateFormat: 'MM/DD/YYYY' },
      'Preview US date format before saving',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('preview_business_date_format');
    expect(result.summary).toContain('Current settings');
    expect(result.summary).toContain('Alternate preview');
    expect(result.details?.alternatePreviews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dateFormat: 'MM/DD/YYYY' }),
      ]),
    );
  });

  it('audits deferred dashboard date surfaces (ai-cmd-fmt-6)', async () => {
    const result = await handleAuditDashboardDateSurfacesLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('audit_dashboard_date_surfaces');
    expect(result.details?.migratedCount).toBe(
      DASHBOARD_DATE_SURFACE_MIGRATED.length,
    );
    expect(result.details?.deferredCount).toBe(
      DASHBOARD_DATE_SURFACE_DEFERRED.length,
    );
    expect(result.summary).toContain('toLocaleString');
  });

  it('previews guided migration sweep before confirmation (ai-cmd-fmt-7)', async () => {
    const result = await handleMigrateDashboardDateDisplayLogic(
      deps(),
      'biz-1',
      {},
      'Migrate deferred dashboard date display surfaces to formatDateDisplay',
      false,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('migrate_dashboard_date_display');
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
    expect(result.details?.surfaceCount).toBe(
      DASHBOARD_DATE_SURFACE_DEFERRED.length,
    );
    expect(result.summary).toContain('formatDateDisplay');
  });

  it('acknowledges migration sweep after confirmation (ai-cmd-fmt-7)', async () => {
    const result = await handleMigrateDashboardDateDisplayLogic(
      deps(),
      'biz-1',
      { surfaceId: 'ai-audit-log' },
      'Migrate ai-audit-log timestamps to formatTimeDisplay',
      true,
    );
    expect(result.success).toBe(true);
    expect(result.details?.sweepAcknowledged).toBe(true);
    expect(result.details?.surfaceCount).toBe(1);
    expect(result.summary).toContain('audit_dashboard_date_surfaces');
  });

  it('explains provider schedule date display from auth settings (ai-cmd-fmt-15)', async () => {
    const result = await handleExplainProviderDateDisplayLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_provider_date_display');
    expect(result.summary).toContain('fmt-1.8');
    expect(result.details?.usesAuthBusinessSettings).toBe(true);
  });

  it('previews provider push time-format wiring before confirmation (ai-cmd-fmt-16)', async () => {
    const result = await handleConfigureProviderPushDateFormatLogic(
      deps(),
      'biz-1',
      { timeFormat: '12h' },
      'Set provider push booking times to 12-hour format',
      false,
    );
    expect(result.success).toBe(true);
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
    expect(result.details?.fcmBodySample).toMatch(/AM|PM/i);
  });

  it('explains typed date input parsing vs calendar picker (ai-cmd-fmt-13)', async () => {
    const result = await handleExplainDateInputFormatLogic(deps(), 'biz-1');
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_date_input_format');
    expect(result.summary).toContain('parseBusinessDateInput');
    expect(result.summary).toContain('calendar picker');
    expect(result.details?.calendarPickerUsesIsoDay).toBe(true);
  });

  it('previews ambiguous typed date parse under DD/MM (ai-cmd-fmt-14)', async () => {
    const result = await handlePreviewDateInputParseLogic(
      deps(),
      'biz-1',
      { dateStrings: ['04/06/2026'] },
      'Preview how 04/06/2026 parses with our date format',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('preview_date_input_parse');
    expect(result.details?.parseResults).toEqual([
      { typed: '04/06/2026', isoDay: '2026-06-04', valid: true },
    ]);
  });

  it('marks invalid slash dates for current format (ai-cmd-fmt-14)', async () => {
    const result = await handlePreviewDateInputParseLogic(
      deps(),
      'biz-1',
      { dateStrings: ['08/15/2026'] },
      'What would 08/15/2026 parse to under our current date format?',
    );
    expect(result.success).toBe(true);
    expect(result.details?.parseResults).toEqual([
      { typed: '08/15/2026', isoDay: null, valid: false },
    ]);
  });

  it('explains notification date format vs dashboard (ai-cmd-fmt-9)', async () => {
    const result = await handleExplainNotificationDateFormatLogic(
      deps(),
      'biz-1',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_notification_date_format');
    expect(result.summary).toContain('formatNotificationDateDisplay');
    expect(result.summary).toContain('dashboard');
    expect(result.details?.usesBusinessSettings).toBe(true);
  });

  it('previews sample confirmation notification (ai-cmd-fmt-10)', async () => {
    const result = await handlePreviewNotificationDatetimeLogic(
      deps(),
      'biz-1',
      { messageKind: 'confirmation' },
      'Preview a sample confirmation email with our current date format',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('preview_notification_datetime');
    expect(result.details?.messageKind).toBe('confirmation');
    expect(result.details?.emailSample).toContain('confirmed');
    expect(result.details?.whatsappSample).toContain('confirmed');
  });

  it('previews gift card expiry notification (ai-cmd-fmt-10)', async () => {
    const result = await handlePreviewNotificationDatetimeLogic(
      deps(),
      'biz-1',
      { messageKind: 'gift_card' },
      'Sample gift card expiry email with our date settings',
    );
    expect(result.success).toBe(true);
    expect(result.details?.messageKind).toBe('gift_card');
    expect(result.details?.emailSample).toContain('expires');
  });

  it('previews result-ready notification before confirmation (ai-cmd-fmt-11)', async () => {
    business.settings = {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      businessType: 'clinic',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleNotifyPatientResultReadyLogic(
      deps(),
      'biz-1',
      {},
      'Notify patient their lab results are ready',
      false,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('notify_patient_result_ready');
    expect(result.details?.requiresExecutionConfirmation).toBe(true);
    expect(result.summary).toContain('formatResultReadyNotificationWhen');
    expect(result.details?.whenLabel).toBeTruthy();
  });

  it('rejects result-ready notify for non-clinic businesses (ai-cmd-fmt-11)', async () => {
    business.settings = {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      businessType: 'hair_salon',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleNotifyPatientResultReadyLogic(
      deps(),
      'biz-1',
      {},
      'Notify patient their lab results are ready',
      false,
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('sends result-ready notification on confirmation (vert-clinic-2.4.7)', async () => {
    business.settings = {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      businessType: 'clinic',
    };
    businessRepo.findOne.mockResolvedValue({ ...business });

    const result = await handleNotifyPatientResultReadyLogic(
      deps(),
      'biz-1',
      { bookingId: 'booking-1' },
      'Send result-ready email to the patient',
      true,
    );

    expect(result.success).toBe(true);
    expect(sendClinicResultReady).toHaveBeenCalledWith('result-1');
    expect(result.details?.deliveredChannels).toEqual(['email', 'whatsapp']);
    expect(result.summary).toContain('Delivered via email, whatsapp');
  });

  it('fails confirmation when no released result is found', async () => {
    business.settings = { businessType: 'clinic' };
    businessRepo.findOne.mockResolvedValue({ ...business });
    resultRepo.find.mockResolvedValue([]);

    const result = await handleNotifyPatientResultReadyLogic(
      deps(),
      'biz-1',
      {},
      'Notify patient their lab results are ready',
      true,
    );

    expect(result.success).toBe(false);
    expect(result.details?.missingReleasedResult).toBe(true);
    expect(sendClinicResultReady).not.toHaveBeenCalled();
  });
});
