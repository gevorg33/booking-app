/** Dashboard clinic lab ext intents (ai-cmd-ext-2.1–2.4). */

export type ClinicTestResultExtPromptFixture = {
  id: string;
  prompt: string;
  expectedAction:
    | 'upload_patient_result'
    | 'explain_patient_results'
    | 'configure_test_reference_range'
    | 'list_abnormal_results';
  expectedParams?: Record<string, unknown>;
};

export const UPLOAD_PATIENT_RESULT_PROMPTS = [
  {
    id: 'upload-order-hash',
    prompt: 'Upload lab result for order #abc123',
    orderId: 'abc123',
  },
  {
    id: 'attach-pdf-order',
    prompt: 'Attach PDF result file to order ord-42',
    orderId: 'ord-42',
  },
  {
    id: 'import-result-order',
    prompt: 'Import patient test result for lab order abc123',
    orderId: 'abc123',
  },
  {
    id: 'upload-document-order',
    prompt: 'Upload result document for order #lab-77',
    orderId: 'lab-77',
  },
  {
    id: 'attach-lab-report',
    prompt: 'Attach lab report to order abc123',
    orderId: 'abc123',
  },
  {
    id: 'import-file-order',
    prompt: 'Import lab result file for order ord-99',
    orderId: 'ord-99',
  },
  {
    id: 'upload-patient-lab',
    prompt: 'Upload patient lab result for order #abc123',
    orderId: 'abc123',
  },
  {
    id: 'attach-result-pdf',
    prompt: 'Attach the test result PDF to order abc123',
    orderId: 'abc123',
  },
  {
    id: 'import-external-lab',
    prompt: 'Import external lab result for order #ext-12',
    orderId: 'ext-12',
  },
  {
    id: 'upload-scan-order',
    prompt: 'Upload scanned lab result for order ord-scan-1',
    orderId: 'ord-scan-1',
  },
  {
    id: 'question-upload',
    prompt: 'Can you upload the lab result for order #abc123?',
    orderId: 'abc123',
  },
] as const;

export const EXPLAIN_PATIENT_RESULTS_PROMPTS = [
  {
    id: 'explain-maria',
    prompt: "Explain Maria's lab results in plain language",
    customerName: 'Maria',
  },
  {
    id: 'summarize-john',
    prompt: 'Summarize test results for patient John',
    customerName: 'John',
  },
  {
    id: 'interpret-cbc',
    prompt: 'What do the CBC results mean for Anna?',
    customerName: 'Anna',
  },
  {
    id: 'explain-order',
    prompt: 'Explain lab results for order #abc123',
    orderId: 'abc123',
  },
  {
    id: 'plain-language',
    prompt: 'Give me a plain language summary of lab results for Maria',
    customerName: 'Maria',
  },
  {
    id: 'interpret-results',
    prompt: 'Interpret the test results for patient Lopez',
    customerName: 'Lopez',
  },
  {
    id: 'explain-released',
    prompt: 'Explain released lab results for Maria',
    customerName: 'Maria',
  },
  {
    id: 'what-do-results',
    prompt: 'What do lab results show for John?',
    customerName: 'John',
  },
  {
    id: 'summarize-patient-labs',
    prompt: 'Summarize patient lab results for Anna',
    customerName: 'Anna',
  },
  {
    id: 'explain-bmp',
    prompt: 'Explain BMP test results for Maria Lopez',
    customerName: 'Maria Lopez',
  },
  {
    id: 'question-explain',
    prompt: 'Can you explain lab results for patient Maria?',
    customerName: 'Maria',
  },
] as const;

export const CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS = [
  {
    id: 'set-wbc-range',
    prompt: 'Set WBC reference range from 4.0 to 11.0',
    measurementCode: 'WBC',
    normalLow: '4.0',
    normalHigh: '11.0',
  },
  {
    id: 'configure-glucose',
    prompt: 'Configure normal range for glucose 70 to 99',
    measurementCode: 'glucose',
    normalLow: '70',
    normalHigh: '99',
  },
  {
    id: 'update-hemoglobin',
    prompt: 'Update hemoglobin reference range low 12 high 16',
    measurementCode: 'hemoglobin',
    normalLow: '12',
    normalHigh: '16',
  },
  {
    id: 'define-sodium-range',
    prompt: 'Define reference range for sodium 135-145',
    measurementCode: 'sodium',
    normalLow: '135',
    normalHigh: '145',
  },
  {
    id: 'set-range-creatinine',
    prompt: 'Set creatinine normal range 0.6 to 1.2',
    measurementCode: 'creatinine',
    normalLow: '0.6',
    normalHigh: '1.2',
  },
  {
    id: 'configure-bmp-wbc',
    prompt: 'Configure test reference range for WBC 4-11',
    measurementCode: 'WBC',
    normalLow: '4',
    normalHigh: '11',
  },
  {
    id: 'change-glucose-ref',
    prompt: 'Change glucose ref range to 70-100',
    measurementCode: 'glucose',
    normalLow: '70',
    normalHigh: '100',
  },
  {
    id: 'set-normal-range-ldl',
    prompt: 'Set normal range for LDL 0 to 100',
    measurementCode: 'LDL',
    normalLow: '0',
    normalHigh: '100',
  },
  {
    id: 'update-ref-range-hgb',
    prompt: 'Update reference range of hemoglobin from 12.0 to 17.5',
    measurementCode: 'hemoglobin',
    normalLow: '12.0',
    normalHigh: '17.5',
  },
  {
    id: 'define-range-potassium',
    prompt: 'Define normal range for potassium 3.5-5.0',
    measurementCode: 'potassium',
    normalLow: '3.5',
    normalHigh: '5.0',
  },
  {
    id: 'question-configure',
    prompt: 'Can you set WBC reference range 4 to 11?',
    measurementCode: 'WBC',
    normalLow: '4',
    normalHigh: '11',
  },
] as const;

export const LIST_ABNORMAL_RESULTS_PROMPTS = [
  { id: 'list-abnormal-en', prompt: 'List abnormal lab results' },
  { id: 'show-flagged', prompt: 'Show flagged measurements awaiting review' },
  { id: 'out-of-range', prompt: 'Show out of range test results' },
  { id: 'abnormal-today', prompt: 'List abnormal results from today' },
  { id: 'flagged-labs', prompt: 'Which lab measurements are flagged?' },
  { id: 'abnormal-awaiting', prompt: 'List abnormal results awaiting review' },
  { id: 'show-abnormal-labs', prompt: 'Show abnormal lab results this week' },
  { id: 'flagged-results', prompt: 'List flagged test results' },
  { id: 'critical-values', prompt: 'Show abnormal measurement results' },
  { id: 'review-flagged', prompt: 'List labs flagged for review' },
  { id: 'question-abnormal', prompt: 'Are there any abnormal lab results?' },
] as const;

export const CLINIC_TEST_RESULT_EXT_RESCUE_SCENARIOS = [
  {
    id: 'enter-to-upload',
    prompt: 'Upload lab result for order #abc123',
    misclassifiedAction: 'enter_test_result',
    expectedAction: 'upload_patient_result' as const,
  },
  {
    id: 'list-orders-to-abnormal',
    prompt: 'List abnormal lab results',
    misclassifiedAction: 'list_test_orders',
    expectedAction: 'list_abnormal_results' as const,
  },
  {
    id: 'chart-to-explain-results',
    prompt: "Explain Maria's lab results",
    misclassifiedAction: 'explain_patient_chart',
    expectedAction: 'explain_patient_results' as const,
  },
  {
    id: 'catalog-to-reference-range',
    prompt: 'Set WBC reference range from 4 to 11',
    misclassifiedAction: 'list_services',
    expectedAction: 'configure_test_reference_range' as const,
  },
  {
    id: 'unknown-upload',
    prompt: 'Attach PDF result file to order ord-42',
    misclassifiedAction: 'unknown',
    expectedAction: 'upload_patient_result' as const,
  },
] as const;

export const CLINIC_TEST_RESULT_EXT_PROMPT_FIXTURES: ClinicTestResultExtPromptFixture[] =
  [
    ...UPLOAD_PATIENT_RESULT_PROMPTS.map((entry) => ({
      id: entry.id,
      prompt: entry.prompt,
      expectedAction: 'upload_patient_result' as const,
      expectedParams: { orderId: entry.orderId },
    })),
    ...EXPLAIN_PATIENT_RESULTS_PROMPTS.map((entry) => ({
      id: entry.id,
      prompt: entry.prompt,
      expectedAction: 'explain_patient_results' as const,
      expectedParams: {
        ...('customerName' in entry && entry.customerName
          ? { customerName: entry.customerName }
          : {}),
        ...('orderId' in entry && entry.orderId
          ? { orderId: entry.orderId }
          : {}),
      },
    })),
    ...CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS.map((entry) => ({
      id: entry.id,
      prompt: entry.prompt,
      expectedAction: 'configure_test_reference_range' as const,
      expectedParams: {
        measurementCode: entry.measurementCode,
        normalLow: entry.normalLow,
        normalHigh: entry.normalHigh,
      },
    })),
    ...LIST_ABNORMAL_RESULTS_PROMPTS.map((entry) => ({
      id: entry.id,
      prompt: entry.prompt,
      expectedAction: 'list_abnormal_results' as const,
    })),
  ];
