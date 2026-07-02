import {
  CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES,
  NOTIFY_WHEN_RESULTS_READY_PROMPTS,
  NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS,
  assembleNotifyWhenResultsReadySummary,
  enrichNotifyWhenResultsReadyParamsFromPrompt,
  extractNotifyChannelFromPrompt,
  isNotifyWhenResultsReadyIntent,
  isNotifyWhenResultsReadyPrompt,
  parseNotifyWhenResultsReadyFromPrompt,
  rescueNotifyWhenResultsReadyIntent,
  buildNotifyWhenResultsReadyNavigate,
  resolveNotifyWhenResultsReadyAspect,
  type ParsedNotifyWhenResultsReadyRequest,
} from './ai-notify-when-results-ready.util.js';
import { NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS } from './ai-notify-when-results-ready-multilingual.fixtures.js';
import { TRACK_LAB_ORDER_STATUS_PROMPTS } from './ai-track-lab-order-status.fixtures.js';
import { isTrackLabOrderStatusPrompt } from './ai-track-lab-order-status.util.js';
import { isNotifyPatientResultReadyPrompt } from './ai-notification-date-format.util.js';
import { AI_COMMAND_EVAL_NOTIFY_WHEN_RESULTS_READY_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-notify-when-results-ready.util (ai-cmd-customer-4.14.7)', () => {
  it('exports classifier rules for notify_when_results_ready', () => {
    expect(CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES).toContain(
      'notify_when_results_ready',
    );
    expect(CUSTOMER_NOTIFY_WHEN_RESULTS_READY_CLASSIFIER_RULES).toContain(
      'NOT notify_patient_result_ready',
    );
  });

  it.each(NOTIFY_WHEN_RESULTS_READY_PROMPTS)(
    'detects notify_when_results_ready for $id',
    ({ prompt, aspect, channel }) => {
      expect(isNotifyWhenResultsReadyPrompt(prompt)).toBe(true);
      const parsed = parseNotifyWhenResultsReadyFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (aspect) expect(parsed?.aspect).toBe(aspect);
      if (channel) expect(parsed?.channel).toBe(channel);
    },
  );

  it.each(NOTIFY_WHEN_RESULTS_READY_MULTILINGUAL_SCENARIOS)(
    'detects multilingual notify_when_results_ready for $id',
    ({ prompt }) => {
      expect(isNotifyWhenResultsReadyPrompt(prompt)).toBe(true);
    },
  );

  it.each(NOTIFY_WHEN_RESULTS_READY_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueNotifyWhenResultsReadyIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(TRACK_LAB_ORDER_STATUS_PROMPTS)(
    'does not treat track prompt $id as notify explain',
    ({ prompt }) => {
      expect(isNotifyWhenResultsReadyPrompt(prompt)).toBe(false);
      expect(isTrackLabOrderStatusPrompt(prompt)).toBe(true);
    },
  );

  it('does not treat staff notify patient as customer explain', () => {
    expect(
      isNotifyWhenResultsReadyPrompt(
        'Notify patient their lab results are ready',
      ),
    ).toBe(false);
    expect(
      isNotifyPatientResultReadyPrompt(
        'Notify patient their lab results are ready',
      ),
    ).toBe(true);
  });

  it('assembles read-only summary and navigate hints', () => {
    expect(
      assembleNotifyWhenResultsReadySummary({
        aspect: 'push_channel',
        channel: 'push',
      }),
    ).toContain('read-only');
    expect(buildNotifyWhenResultsReadyNavigate('push')).toEqual({
      path: '/account',
      query: { section: 'notifications' },
    });
    expect(
      extractNotifyChannelFromPrompt('Text me when results are ready'),
    ).toBe('text');
    expect(resolveNotifyWhenResultsReadyAspect('How do I get notified?')).toBe(
      'how_it_works',
    );
    expect(
      enrichNotifyWhenResultsReadyParamsFromPrompt(
        { keep: true },
        'book a haircut tomorrow',
      ),
    ).toEqual({ keep: true });
    expect(
      assembleNotifyWhenResultsReadySummary({
        aspect: 'subscribe_explain',
      }),
    ).toContain('cannot turn on result-ready alerts');
    expect(
      assembleNotifyWhenResultsReadySummary({
        aspect: 'sms_email_channel',
        channel: 'whatsapp',
      }),
    ).toContain('WhatsApp');
    expect(
      enrichNotifyWhenResultsReadyParamsFromPrompt(
        {},
        'Alert me when my CBC is ready',
      ).testName,
    ).toBe('CBC');
  });

  it('recognizes intent and eval cases', () => {
    expect(isNotifyWhenResultsReadyIntent('notify_when_results_ready')).toBe(
      true,
    );
    expect(isNotifyWhenResultsReadyIntent('track_lab_order_status')).toBe(
      false,
    );
    expect(
      AI_COMMAND_EVAL_NOTIFY_WHEN_RESULTS_READY_CASES.length,
    ).toBeGreaterThan(20);
  });

  it('covers additional detection branches', () => {
    expect(isNotifyWhenResultsReadyPrompt('')).toBe(false);
    expect(
      isNotifyWhenResultsReadyPrompt(
        'Book lipid panel and notify me when results are ready',
      ),
    ).toBe(false);
    expect(
      isNotifyWhenResultsReadyPrompt('Tell me when lab results are ready'),
    ).toBe(true);
    expect(isNotifyWhenResultsReadyPrompt('Notify me please')).toBe(false);
    expect(isNotifyWhenResultsReadyPrompt('Are my lab results ready?')).toBe(
      false,
    );
    expect(
      isNotifyWhenResultsReadyPrompt('When will my CBC results be ready?'),
    ).toBe(false);
    expect(extractNotifyChannelFromPrompt('Send me an email when ready')).toBe(
      'email',
    );
    expect(
      extractNotifyChannelFromPrompt('Send a text message when results ready'),
    ).toBe('text');
    expect(
      extractNotifyChannelFromPrompt('WhatsApp me when results ready'),
    ).toBe('whatsapp');
    expect(resolveNotifyWhenResultsReadyAspect('Send push when ready')).toBe(
      'push_channel',
    );
    expect(resolveNotifyWhenResultsReadyAspect('Use SMS for lab results')).toBe(
      'sms_email_channel',
    );
    expect(
      resolveNotifyWhenResultsReadyAspect('Lab result notification options'),
    ).toBe('general');
    expect(
      assembleNotifyWhenResultsReadySummary({
        aspect: 'sms_email_channel',
        channel: 'sms',
      }),
    ).toContain('SMS/text');
    expect(
      assembleNotifyWhenResultsReadySummary({ aspect: 'general' }),
    ).toContain('read-only');
    expect(
      assembleNotifyWhenResultsReadySummary(
        {} as ParsedNotifyWhenResultsReadyRequest,
      ),
    ).toContain('Result-ready notifications depend');
    expect(
      rescueNotifyWhenResultsReadyIntent(
        'Text me when results are ready',
        'notify_when_results_ready',
      ),
    ).toBeNull();
    expect(
      parseNotifyWhenResultsReadyFromPrompt('Text me when results are ready', {
        aspect: 'how_it_works',
        channel: 'push',
        testName: 'CBC',
      }),
    ).toEqual({
      aspect: 'how_it_works',
      channel: 'push',
      testName: 'CBC',
    });
    expect(buildNotifyWhenResultsReadyNavigate()).toEqual({
      path: '/results',
      query: { section: 'my-results' },
    });
  });
});
