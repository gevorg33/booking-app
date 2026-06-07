import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
  PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS,
} from './ai-provider-clinic-collection.fixtures.js';
import {
  extractMarkSpecimenCustomerNameFromPrompt,
  extractSpecimenIdFromPrompt,
  isListMyCollectionQueuePrompt,
  isMarkSpecimenCollectedPrompt,
  parseListMyCollectionQueueFromPrompt,
  parseMarkSpecimenCollectedFromPrompt,
  rescueProviderClinicCollectionIntent,
} from './ai-provider-clinic-collection.util.js';

describe('ai-provider-clinic-collection.util', () => {
  it.each(LIST_MY_COLLECTION_QUEUE_PROMPTS)(
    'detects list collection queue prompt $id',
    ({ prompt }) => {
      expect(isListMyCollectionQueuePrompt(prompt)).toBe(true);
      expect(parseListMyCollectionQueueFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(MARK_SPECIMEN_COLLECTED_PROMPTS)(
    'detects mark specimen collected prompt $id',
    ({ prompt, customerName, specimenId, orderId }) => {
      expect(isMarkSpecimenCollectedPrompt(prompt)).toBe(true);
      const parsed = parseMarkSpecimenCollectedFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerName) {
        expect(parsed?.customerName?.toLowerCase()).toContain(
          customerName.toLowerCase(),
        );
      }
      if (specimenId) expect(parsed?.specimenId).toBe(specimenId);
      if (orderId) expect(parsed?.orderId).toBe(orderId);
    },
  );

  it('extracts specimen ids with hash prefix', () => {
    expect(extractSpecimenIdFromPrompt('Mark specimen #abc123 collected')).toBe(
      'abc123',
    );
  });

  it('extracts possessive customer names for specimen marks', () => {
    expect(
      extractMarkSpecimenCustomerNameFromPrompt(
        "Mark Maria's specimen as collected",
      ),
    ).toBe('Maria');
  });

  it.each(PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      const rescued = rescueProviderClinicCollectionIntent(
        prompt,
        misclassifiedAction,
      );
      expect(rescued?.action).toBe(expectedAction);
    },
  );
});
