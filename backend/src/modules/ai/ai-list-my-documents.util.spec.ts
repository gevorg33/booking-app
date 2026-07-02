import {
  CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES,
  LIST_MY_DOCUMENTS_PROMPTS,
  LIST_MY_DOCUMENTS_RESCUE_SCENARIOS,
} from './ai-list-my-documents.fixtures.js';
import { LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS } from './ai-list-my-documents-multilingual.fixtures.js';
import { LIST_MY_TEST_RESULTS_PROMPTS } from './ai-consumer-clinic-test-results.fixtures.js';
import {
  isListMyTestResultsPrompt,
  isExplainResultStatusPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { isTrackLabOrderStatusPrompt } from './ai-track-lab-order-status.util.js';
import {
  enrichListMyDocumentsParamsFromPrompt,
  formatReleasedDocumentsSummary,
  isListMyDocumentsIntent,
  isListMyDocumentsPrompt,
  parseListMyDocumentsFromPrompt,
  rescueListMyDocumentsIntent,
  buildListMyDocumentsNavigate,
  buildListMyDocumentsFixtureExpectations,
  extractDocumentTitleFromPrompt,
} from './ai-list-my-documents.util.js';
import { AI_COMMAND_EVAL_LIST_MY_DOCUMENTS_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-list-my-documents.util (ai-cmd-customer-4.14.5)', () => {
  it('exports classifier rules for list_my_documents', () => {
    expect(CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES).toContain(
      'list_my_documents',
    );
    expect(CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES).toContain(
      'NOT list_my_test_results',
    );
  });

  it.each(LIST_MY_DOCUMENTS_PROMPTS)(
    'detects list_my_documents for $id',
    ({ prompt, category }) => {
      expect(isListMyDocumentsPrompt(prompt)).toBe(true);
      const parsed = parseListMyDocumentsFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (category) {
        expect(parsed?.category).toBe(category);
      }
    },
  );

  it.each(LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual list_my_documents for $id',
    ({ prompt }) => {
      expect(isListMyDocumentsPrompt(prompt)).toBe(true);
    },
  );

  it.each(LIST_MY_DOCUMENTS_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueListMyDocumentsIntent(prompt, misclassifiedAction)?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(LIST_MY_TEST_RESULTS_PROMPTS)(
    'does not treat lab results prompt $id as documents',
    ({ prompt }) => {
      expect(isListMyDocumentsPrompt(prompt)).toBe(false);
      expect(isListMyTestResultsPrompt(prompt)).toBe(true);
    },
  );

  it('does not treat track or explain FAQ as documents', () => {
    expect(isListMyDocumentsPrompt('Are my results ready?')).toBe(false);
    expect(isTrackLabOrderStatusPrompt('Are my results ready?')).toBe(true);
    expect(
      isListMyDocumentsPrompt('What does released mean for my lab results?'),
    ).toBe(false);
    expect(
      isExplainResultStatusPrompt(
        'What does released mean for my lab results?',
      ),
    ).toBe(true);
  });

  it('enriches params from prompt', () => {
    expect(
      enrichListMyDocumentsParamsFromPrompt({}, 'Show my referral letter')
        .category,
    ).toBe('referral_letter');
  });

  it('formats empty and populated summaries', () => {
    expect(
      formatReleasedDocumentsSummary([], { category: 'referral_letter' }),
    ).toContain('referral letter');
    expect(
      formatReleasedDocumentsSummary([
        {
          id: 'doc-1',
          category: 'referral_letter',
          title: 'Cardiology referral',
          originalFileName: 'referral.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 1000,
          downloadUrl: 'https://example.com/doc-1',
          createdAt: '2026-06-01T10:00:00.000Z',
        },
      ]),
    ).toContain('Cardiology referral');
  });

  it('recognizes list_my_documents intent', () => {
    expect(isListMyDocumentsIntent('list_my_documents')).toBe(true);
    expect(isListMyDocumentsIntent('list_my_test_results')).toBe(false);
  });

  it('maps eval golden cases', () => {
    expect(AI_COMMAND_EVAL_LIST_MY_DOCUMENTS_CASES.length).toBeGreaterThan(20);
    expect(
      AI_COMMAND_EVAL_LIST_MY_DOCUMENTS_CASES.every(
        (row) => row.expect.useSurfaceListMyDocumentsRescue === true,
      ),
    ).toBe(true);
  });

  it('extracts quoted title and builds navigate', () => {
    expect(extractDocumentTitleFromPrompt('Open "MRI summary" document')).toBe(
      'MRI summary',
    );
    expect(buildListMyDocumentsNavigate('imaging_report')).toEqual({
      path: '/results',
      query: { section: 'my-documents', category: 'imaging_report' },
    });
  });

  it('summarizes multiple documents with overflow', () => {
    const docs = [1, 2, 3, 4].map((index) => ({
      id: `doc-${index}`,
      category: 'other' as const,
      title: `Doc ${index}`,
      originalFileName: null,
      mimeType: 'application/pdf',
      fileSizeBytes: 100,
      downloadUrl: `https://example.com/${index}`,
      createdAt: '2026-06-01T10:00:00.000Z',
    }));
    expect(formatReleasedDocumentsSummary(docs)).toContain('+1 more');
  });

  it('builds fixture expectations', () => {
    expect(buildListMyDocumentsFixtureExpectations()).toHaveLength(
      LIST_MY_DOCUMENTS_PROMPTS.length,
    );
  });

  it('rejects staff upload prompts', () => {
    expect(
      isListMyDocumentsPrompt('Upload referral document for patient'),
    ).toBe(false);
  });

  it('does not rescue when action already matches', () => {
    expect(
      rescueListMyDocumentsIntent(
        'Show my referral letter',
        'list_my_documents',
      ),
    ).toBeNull();
  });
});
