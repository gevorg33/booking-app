import { handleExplainPatientAlertLogic } from './ai-explain-patient-alert.logic.js';
import {
  EXPLAIN_PATIENT_ALERT_PROMPTS,
  EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS,
} from './ai-explain-patient-alert.fixtures.js';
import { rescueExplainPatientAlertIntent } from './ai-explain-patient-alert.util.js';

describe('ai-explain-patient-alert.logic (ai-cmd-customer-4.14.3)', () => {
  it.each(
    EXPLAIN_PATIENT_ALERT_PROMPTS.slice(0, 4).map((row) => [
      row.id,
      row.prompt,
    ]),
  )('handles explain_patient_alert for $0', async (_id, prompt) => {
    const result = await handleExplainPatientAlertLogic(
      'biz-1',
      {
        sessionCustomerId: 'cust-1',
        patientAlertCount: 1,
        patientAlerts: [
          {
            id: 'TestResultReleased:r1',
            type: 'TestResultReleased',
            sourceId: 'r1',
            bookingId: 'b1',
            title: 'New result',
            messages: [{ title: 'Ready' }],
            chartTab: 'results',
            createdAt: '2026-06-01T00:00:00.000Z',
            testName: 'CBC',
          },
        ],
      },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_patient_alert');
    expect(result.details?.consumerPatientAlert).toBe(true);
  });

  it('requires sign-in', async () => {
    const result = await handleExplainPatientAlertLogic(
      'biz-1',
      {},
      'What is this red banner?',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleExplainPatientAlertLogic(
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('uses params prompt fallback, navigate, and dismiss action', async () => {
    const result = await handleExplainPatientAlertLogic('biz-1', {
      sessionCustomerId: 'cust-1',
      _prompt: 'How do I dismiss the patient alert?',
    });
    expect(result.success).toBe(true);
    expect(result.details?.aspect).toBe('dismiss_alert');
    expect(result.details?.clientAction).toBe('dismissConsumerPatientAlert');
    expect(result.details?.navigate).toBeUndefined();

    const resultsReady = await handleExplainPatientAlertLogic('biz-1', {
      sessionCustomerId: 'cust-1',
      _prompt: 'Results ready — what do I do?',
    });
    expect(resultsReady.details?.navigate).toEqual({
      path: '/results',
      query: {},
    });
  });

  it.each(EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS)(
    'pipeline rescues explain_patient_alert for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainPatientAlertIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_patient_alert');
    },
  );
});
