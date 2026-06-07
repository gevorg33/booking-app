import { rescueClinicPatientChartIntent } from './ai-clinic-patient-chart.util.js';
import { rescueClinicTestOrderIntent } from './ai-clinic-test-order.util.js';
import { rescueClinicTestResultIntent } from './ai-clinic-test-result.util.js';
import { rescueConsumerClinicTestResultsIntent } from './ai-consumer-clinic-test-results.util.js';
import { rescueProviderClinicCollectionIntent } from './ai-provider-clinic-collection.util.js';
import type { ClinicV2SurfaceScenario } from './ai-clinic-v2-6.fixtures.js';

export type ClinicV2RescuableAction =
  | 'create_test_order'
  | 'list_test_orders'
  | 'enter_test_result'
  | 'release_test_result'
  | 'explain_patient_chart'
  | 'list_my_collection_queue'
  | 'mark_specimen_collected'
  | 'list_my_test_results'
  | 'explain_result_status';

export function rescueClinicV2SurfaceIntent(
  prompt: string,
  action: string,
  expectedAction: ClinicV2RescuableAction,
): { action: ClinicV2RescuableAction; rescueReason: string } | null {
  switch (expectedAction) {
    case 'create_test_order':
    case 'list_test_orders':
      return rescueClinicTestOrderIntent(prompt, action);
    case 'enter_test_result':
    case 'release_test_result':
      return rescueClinicTestResultIntent(prompt, action);
    case 'explain_patient_chart':
      return rescueClinicPatientChartIntent(prompt, action);
    case 'list_my_collection_queue':
    case 'mark_specimen_collected':
      return rescueProviderClinicCollectionIntent(prompt, action);
    case 'list_my_test_results':
    case 'explain_result_status':
      return rescueConsumerClinicTestResultsIntent(prompt, action);
    default:
      return null;
  }
}

export function rescueClinicV2SurfaceScenario(
  scenario: Pick<ClinicV2SurfaceScenario, 'prompt' | 'expectedAction'>,
  misclassifiedAction = 'unknown',
): { action: string; rescueReason: string } | null {
  return rescueClinicV2SurfaceIntent(
    scenario.prompt,
    misclassifiedAction,
    scenario.expectedAction as ClinicV2RescuableAction,
  );
}
