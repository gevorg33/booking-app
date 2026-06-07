/** Dashboard classifier rules for clinic lab result entry and release (ai-cmd-clinic-v2-2). */
export const CLINIC_TEST_RESULT_CLASSIFIER_RULES = `- enter_test_result: MUTATE — clinic only: record a manual lab measurement value on a test order/result (WBC, CBC, glucose, etc.). Triggers: enter/record/log/set + {measurementCode} + numeric value + for order|result + optional orderId/resultId. Requires measurementCode, value, and orderId or resultId. NOT create_test_order (place order), NOT release_test_result (patient release), NOT notify_patient_result_ready (notification).
- release_test_result: MUTATE — clinic only: release reviewed lab results to the patient chart. Triggers: release/publish/make available + results|lab results + optional customerName, orderId, resultId. NOT notify_patient_result_ready (email/WhatsApp notification), NOT enter_test_result (value entry), NOT list_test_orders (read queue).
- Examples:
  - "Enter WBC 12.5 for order #abc123" → enter_test_result, measurementCode=WBC, value=12.5, orderId=abc123
  - "Release results to patient Maria" → release_test_result, customerName=Maria
  - "Release test result for order abc123" → release_test_result, orderId=abc123`;

export const ENTER_TEST_RESULT_PROMPTS = [
  {
    id: 'wbc-order-hash',
    prompt: 'Enter WBC 12.5 for order #abc123',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
  {
    id: 'cbc-order',
    prompt: 'Record CBC result 4.2 for order abc123',
    measurementCode: 'CBC',
    value: '4.2',
    orderId: 'abc123',
  },
  {
    id: 'hemoglobin-maria',
    prompt: "Enter hemoglobin 13.1 for Maria's lab order abc123",
    measurementCode: 'hemoglobin',
    value: '13.1',
    orderId: 'abc123',
    customerName: 'Maria',
  },
  {
    id: 'glucose-order',
    prompt: 'Log glucose 95 for order #ord-42',
    measurementCode: 'glucose',
    value: '95',
    orderId: 'ord-42',
  },
  {
    id: 'wbc-set-to',
    prompt: 'Set WBC to 12.5 on order abc123',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
  {
    id: 'wbc-lab-order',
    prompt: 'Enter result WBC 12.5 for lab order abc123',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
  {
    id: 'wbc-value-of',
    prompt: 'Record a WBC value of 12.5 for order abc123',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
  {
    id: 'question-enter',
    prompt: 'Can you enter WBC 12.5 for order abc123?',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
  {
    id: 'sodium-bmp',
    prompt: 'Enter sodium 140 for order abc123',
    measurementCode: 'sodium',
    value: '140',
    orderId: 'abc123',
  },
  {
    id: 'wbc-result-id',
    prompt: 'Enter WBC 12.5 for result #res-99',
    measurementCode: 'WBC',
    value: '12.5',
    resultId: 'res-99',
  },
  {
    id: 'compact-lab-value',
    prompt: 'Record lab value WBC 12.5 order abc123',
    measurementCode: 'WBC',
    value: '12.5',
    orderId: 'abc123',
  },
] as const;

export const RELEASE_TEST_RESULT_PROMPTS = [
  {
    id: 'release-to-patient',
    prompt: 'Release results to patient',
  },
  {
    id: 'maria-lab-results',
    prompt: "Release Maria's lab results",
    customerName: 'Maria',
  },
  {
    id: 'order-release',
    prompt: 'Release test result for order abc123',
    orderId: 'abc123',
  },
  {
    id: 'publish-maria',
    prompt: 'Publish results to Maria',
    customerName: 'Maria',
  },
  {
    id: 'visible-to-patient',
    prompt: "Make Maria's test results visible to the patient",
    customerName: 'Maria',
  },
  {
    id: 'reviewed-order',
    prompt: 'Release reviewed results for order #abc123',
    orderId: 'abc123',
  },
  {
    id: 'send-to-maria',
    prompt: 'Send lab results to patient Maria',
    customerName: 'Maria',
  },
  {
    id: 'result-id-release',
    prompt: 'Release result #res-99 to patient',
    resultId: 'res-99',
  },
  {
    id: 'cbc-maria-chart',
    prompt: "Release Maria's CBC results to her chart",
    customerName: 'Maria',
  },
  {
    id: 'available-maria',
    prompt: 'Make test results available to Maria',
    customerName: 'Maria',
  },
  {
    id: 'release-reviewed',
    prompt: 'Release reviewed lab results for Maria tomorrow',
    customerName: 'Maria',
  },
] as const;

export const CLINIC_TEST_RESULT_RESCUE_SCENARIOS = [
  {
    id: 'list-results-to-enter',
    prompt: 'Enter WBC 12.5 for order abc123',
    misclassifiedAction: 'list_test_orders',
    expectedAction: 'enter_test_result' as const,
  },
  {
    id: 'notify-to-release',
    prompt: "Release Maria's lab results to her chart",
    misclassifiedAction: 'notify_patient_result_ready',
    expectedAction: 'release_test_result' as const,
  },
  {
    id: 'create-booking-to-release',
    prompt: 'Release test result for order abc123',
    misclassifiedAction: 'create_booking',
    expectedAction: 'release_test_result' as const,
  },
] as const;
