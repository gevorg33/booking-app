import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { EXPLAIN_PATIENT_ALERT_PROMPTS } from './ai-explain-patient-alert.fixtures.js';
import { EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS } from './ai-explain-patient-alert-multilingual.fixtures.js';

describe('customer-ai-command explain_patient_alert integration (ai-cmd-customer-4.14.3)', () => {
  it.each(
    [
      ...EXPLAIN_PATIENT_ALERT_PROMPTS,
      ...EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_patient_alert for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'explain_patient_alert',
    );
  });
});
