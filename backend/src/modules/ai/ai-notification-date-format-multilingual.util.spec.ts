import { MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS } from './ai-notification-date-format-multilingual.fixtures.js';
import {
  isExplainNotificationDateFormatPrompt,
  isNotifyPatientResultReadyPrompt,
  isPreviewNotificationDatetimePrompt,
  parseNotificationMessageKind,
  rescueNotificationDateFormatIntent,
} from './ai-notification-date-format.util.js';

describe('ai-notification-date-format multilingual (ai-cmd-fmt-12)', () => {
  it.each(MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueNotificationDateFormatIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (expectedAction === 'explain_notification_date_format') {
        expect(isExplainNotificationDateFormatPrompt(prompt)).toBe(true);
      } else if (expectedAction === 'preview_notification_datetime') {
        expect(isPreviewNotificationDatetimePrompt(prompt)).toBe(true);
      } else {
        expect(isNotifyPatientResultReadyPrompt(prompt)).toBe(true);
      }

      if (paramsPartial) {
        expect(rescued).toBeTruthy();
      }
    },
  );

  it.each(
    MULTILINGUAL_NOTIFICATION_DATE_FORMAT_EVAL_SCENARIOS.filter(
      (scenario) => scenario.messageKind,
    ),
  )(
    'parses $locale $id messageKind as $messageKind',
    ({ prompt, messageKind }) => {
      expect(parseNotificationMessageKind(prompt)).toBe(messageKind);
    },
  );
});
