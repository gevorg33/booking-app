import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLASSIFIER_MULTILINGUAL_RULES } from './ai-prompt-i18n.js';
import { CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES } from './ai-clinic-test-result-ext-multilingual.fixtures.js';
import { CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES } from './ai-clinic-test-result-ext.util.js';

import { DASHBOARD_INTENT_SCHEMA } from './ai-command-intent-schema.build.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);
const AI_PROMPT_I18N_SOURCE = readFileSync(
  join(__dirname, 'ai-prompt-i18n.ts'),
  'utf8',
);

describe('ai-clinic-test-result-ext multilingual wiring (ai-cmd-clinic-6-gap-1.2)', () => {
  it('wires HY/RU ext rules into dashboard CLASSIFIER_MULTILINGUAL_RULES', () => {
    expect(AI_PROMPT_I18N_SOURCE).toContain(
      'CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES',
    );
    expect(CLASSIFIER_MULTILINGUAL_RULES).toContain(
      CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES,
    );
    expect(CLASSIFIER_MULTILINGUAL_RULES).toContain('upload_patient_result');
    expect(CLASSIFIER_MULTILINGUAL_RULES).toContain('explain_patient_results');
    expect(CLASSIFIER_MULTILINGUAL_RULES).toContain(
      'configure_test_reference_range',
    );
    expect(CLASSIFIER_MULTILINGUAL_RULES).toContain('list_abnormal_results');
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/վերբեռնիր/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/загрузи/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/բացատրիր/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/объясни/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/կարգավորիր/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/установи/i);
    expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/\bWBC\b/);
  });

  it('wires EN ext rules into dashboard INTENT_SCHEMA appendix', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES.trim(),
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      '${CLASSIFIER_MULTILINGUAL_RULES}',
    );
    expect(CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES).toContain(
      'upload_patient_result',
    );
    expect(CLINIC_TEST_RESULT_EXT_CLASSIFIER_RULES).toContain(
      'CLINIC_TEST_RESULT_EXT_MULTILINGUAL_CLASSIFIER_RULES',
    );
  });

  it('places ext multilingual block after enter/release multilingual rules', () => {
    const enterReleaseIdx = CLASSIFIER_MULTILINGUAL_RULES.indexOf(
      'Armenian/Russian clinic lab result entry and release',
    );
    const extIdx = CLASSIFIER_MULTILINGUAL_RULES.indexOf(
      'Armenian/Russian clinic lab ext intents',
    );
    expect(enterReleaseIdx).toBeGreaterThanOrEqual(0);
    expect(extIdx).toBeGreaterThan(enterReleaseIdx);
  });
});
