import { MULTILINGUAL_PROVIDER_CLINIC_COLLECTION_EVAL_SCENARIOS } from './ai-provider-clinic-collection-multilingual.fixtures.js';
import {
  parseListMyCollectionQueueFromPrompt,
  parseMarkSpecimenCollectedFromPrompt,
  rescueProviderClinicCollectionIntent,
} from './ai-provider-clinic-collection.util.js';

describe('ai-provider-clinic-collection multilingual (i18n-clinic-v2-ai-4)', () => {
  it.each(MULTILINGUAL_PROVIDER_CLINIC_COLLECTION_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueProviderClinicCollectionIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      const parsed =
        expectedAction === 'list_my_collection_queue'
          ? parseListMyCollectionQueueFromPrompt(prompt)
          : parseMarkSpecimenCollectedFromPrompt(prompt);
      expect(parsed).not.toBeNull();

      if (paramsPartial?.customerName) {
        expect(
          'customerName' in (parsed ?? {})
            ? (parsed as { customerName?: string }).customerName
            : undefined,
        ).toBe(paramsPartial.customerName);
      }
      if (paramsPartial?.specimenId) {
        expect(
          'specimenId' in (parsed ?? {})
            ? (parsed as { specimenId?: string }).specimenId
            : undefined,
        ).toBe(paramsPartial.specimenId);
      }
      if (paramsPartial?.orderId) {
        expect(
          'orderId' in (parsed ?? {})
            ? (parsed as { orderId?: string }).orderId
            : undefined,
        ).toBe(paramsPartial.orderId);
      }
    },
  );
});
