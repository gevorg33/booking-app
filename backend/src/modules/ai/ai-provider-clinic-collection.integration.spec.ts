import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
  PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS,
} from './ai-provider-clinic-collection.fixtures.js';

describe('AiProviderClinicCollection integration', () => {
  const rescueService = new AiIntentRescueService();

  it.each(PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS)(
    'rescues provider prompt $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: misclassifiedAction,
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it.each(LIST_MY_COLLECTION_QUEUE_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for list prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('list_my_collection_queue');
    },
  );

  it.each(MARK_SPECIMEN_COLLECTED_PROMPTS.slice(0, 3))(
    'rescues unknown classifier for mark prompt $id',
    ({ prompt }) => {
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe('mark_specimen_collected');
    },
  );
});
