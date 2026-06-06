import {
  EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS,
  NOTIFY_PATIENT_RESULT_READY_PROMPTS,
  PREVIEW_NOTIFICATION_DATETIME_PROMPTS,
} from './ai-notification-date-format.fixtures.js';
import {
  isExplainNotificationDateFormatPrompt,
  isNotifyPatientResultReadyPrompt,
  isPreviewNotificationDatetimePrompt,
  rescueNotificationDateFormatIntent,
} from './ai-notification-date-format.util.js';

describe('ai-notification-date-format.util (ai-cmd-fmt-9..11)', () => {
  it.each(EXPLAIN_NOTIFICATION_DATE_FORMAT_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainNotificationDateFormatPrompt(prompt)).toBe(true);
      expect(isPreviewNotificationDatetimePrompt(prompt)).toBe(false);
      expect(rescueNotificationDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'explain_notification_date_format',
        rescueReason: 'explain_notification_date_format',
      });
    },
  );

  it.each(PREVIEW_NOTIFICATION_DATETIME_PROMPTS)(
    'detects preview prompt $id',
    ({ prompt }) => {
      expect(isPreviewNotificationDatetimePrompt(prompt)).toBe(true);
      expect(isExplainNotificationDateFormatPrompt(prompt)).toBe(false);
      expect(rescueNotificationDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'preview_notification_datetime',
        rescueReason: 'preview_notification_datetime',
      });
    },
  );

  it.each(NOTIFY_PATIENT_RESULT_READY_PROMPTS)(
    'detects notify prompt $id',
    ({ prompt }) => {
      expect(isNotifyPatientResultReadyPrompt(prompt)).toBe(true);
      expect(isExplainNotificationDateFormatPrompt(prompt)).toBe(false);
      expect(rescueNotificationDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'notify_patient_result_ready',
        rescueReason: 'notify_patient_result_ready',
      });
    },
  );

  it('does not rescue when action is already explain_notification_date_format', () => {
    expect(
      rescueNotificationDateFormatIntent(
        'How do confirmation emails format dates vs the dashboard?',
        'explain_notification_date_format',
      ),
    ).toBeNull();
  });
});
