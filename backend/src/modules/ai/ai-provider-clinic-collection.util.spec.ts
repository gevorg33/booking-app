import {
  EXPLAIN_SPECIMEN_RECOLLECT_PROMPTS,
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
  PROVIDER_CLINIC_COLLECTION_RESCUE_SCENARIOS,
} from './ai-provider-clinic-collection.fixtures.js';
import {
  extractMarkSpecimenCustomerNameFromPrompt,
  extractSpecimenIdFromPrompt,
  formatSpecimenRecollectText,
  isExplainSpecimenRecollectPrompt,
  isListMyCollectionQueuePrompt,
  isMarkSpecimenCollectedPrompt,
  parseExplainSpecimenRecollectFromPrompt,
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

  it.each(EXPLAIN_SPECIMEN_RECOLLECT_PROMPTS)(
    'detects explain specimen recollect prompt $id (ai-cmd-provider-5.19.3)',
    ({ prompt, customerName, specimenId }) => {
      expect(isExplainSpecimenRecollectPrompt(prompt)).toBe(true);
      const parsed = parseExplainSpecimenRecollectFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (customerName) {
        expect(parsed?.customerName?.toLowerCase()).toContain(
          customerName.toLowerCase(),
        );
      }
      if (specimenId) expect(parsed?.specimenId).toBe(specimenId);
    },
  );

  it('does not let explain_specimen_recollect steal mark-collected prompts', () => {
    expect(
      isExplainSpecimenRecollectPrompt('Mark specimen collected for Maria'),
    ).toBe(false);
    expect(
      isExplainSpecimenRecollectPrompt('Show my collection queue today'),
    ).toBe(false);
  });

  it('formats specimen recollect text', () => {
    expect(
      formatSpecimenRecollectText('Jane', {
        status: 'RecollectRequired',
        incompletionReason: 'Sample hemolyzed',
      }),
    ).toBe(
      "Jane's specimen needs to be recollected. Reason: Sample hemolyzed. Draw a new sample, then mark it collected — or mark it rejected if the visit can't proceed.",
    );
    expect(
      formatSpecimenRecollectText('Jane', {
        status: 'RecollectRequired',
        incompletionReason: null,
      }),
    ).toBe(
      "Jane's specimen needs to be recollected. No reason was recorded for the recollection. Draw a new sample, then mark it collected — or mark it rejected if the visit can't proceed.",
    );
    expect(
      formatSpecimenRecollectText('Jane', {
        status: 'Collected',
        incompletionReason: null,
      }),
    ).toBe(
      "Jane's specimen is not flagged for recollection (current status: Collected).",
    );
  });

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
