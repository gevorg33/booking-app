import type { ClinicTestResultExtIntent } from './ai-clinic-test-result-ext.util.js';
import type { CommandResult } from './command-completion.types.js';

export type ClinicTestResultExtDispatchScenario = {
  id: string;
  action: ClinicTestResultExtIntent;
  handler:
    | 'handleUploadPatientResult'
    | 'handleExplainPatientResults'
    | 'handleConfigureTestReferenceRange'
    | 'handleListAbnormalResults';
  params: Record<string, unknown>;
  prompt?: string;
  mockResult: CommandResult;
};

export const CLINIC_TEST_RESULT_EXT_DISPATCH_SCENARIOS: ClinicTestResultExtDispatchScenario[] =
  [
    {
      id: 'upload-order',
      action: 'upload_patient_result',
      handler: 'handleUploadPatientResult',
      params: { orderId: 'abc123' },
      prompt: 'Upload lab result for order #abc123',
      mockResult: {
        success: true,
        action: 'upload_patient_result',
        summary:
          'Opening lab results for order abc123 — attach your result file in the booking panel.',
        details: {
          orderId: 'abc123',
          navigate: {
            path: '/dashboard/bookings',
            query: {
              bookingId: 'booking-1',
              labTab: 'results',
              orderId: 'abc123',
              uploadResult: '1',
            },
          },
        },
      },
    },
    {
      id: 'explain-maria',
      action: 'explain_patient_results',
      handler: 'handleExplainPatientResults',
      params: { customerName: 'Maria' },
      prompt: "Explain Maria's lab results",
      mockResult: {
        success: true,
        action: 'explain_patient_results',
        summary: 'Released results for Maria',
        details: { customerName: 'Maria', resultIds: ['result-1'] },
      },
    },
    {
      id: 'configure-wbc',
      action: 'configure_test_reference_range',
      handler: 'handleConfigureTestReferenceRange',
      params: {
        measurementCode: 'WBC',
        normalLow: '4',
        normalHigh: '11',
      },
      mockResult: {
        success: true,
        action: 'configure_test_reference_range',
        summary: 'Reference range for WBC set to 4–11.',
        details: {
          measurementCode: 'WBC',
          normalLow: 4,
          normalHigh: 11,
          testTypeId: 'type-wbc',
        },
      },
    },
    {
      id: 'list-abnormal',
      action: 'list_abnormal_results',
      handler: 'handleListAbnormalResults',
      params: {},
      mockResult: {
        success: true,
        action: 'list_abnormal_results',
        summary: 'Abnormal results (1):\n• WBC 12.5 [H] (order order-abc123)',
        details: { count: 1, entries: [] },
      },
    },
  ];
