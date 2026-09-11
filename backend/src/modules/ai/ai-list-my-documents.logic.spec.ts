import type { Business } from '../business/entities/business.entity.js';
import type { PatientReleasedDocumentCustomerView } from '../../common/utils/patient-customer-document-access.util.js';
import { handleListMyDocumentsLogic } from './ai-list-my-documents.logic.js';
import {
  LIST_MY_DOCUMENTS_PROMPTS,
  LIST_MY_DOCUMENTS_RESCUE_SCENARIOS,
} from './ai-list-my-documents.fixtures.js';
import { rescueListMyDocumentsIntent } from './ai-list-my-documents.util.js';
import type { ListMyDocumentsLogicDeps } from './ai-list-my-documents.logic.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';

const clinicBusiness = makeBusiness({
  id: 'biz-1',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
});

const sampleDocument: PatientReleasedDocumentCustomerView = {
  id: 'doc-1',
  category: 'referral_letter',
  title: 'Cardiology referral',
  originalFileName: 'referral.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1200,
  downloadUrl: 'https://example.com/doc-1',
  createdAt: '2026-06-01T10:00:00.000Z',
};

function buildDeps(overrides: Partial<ListMyDocumentsLogicDeps> = {}) {
  return {
    businessRepo: {
      findOne: jest.fn().mockResolvedValue(clinicBusiness),
    },
    patientDocumentsService: {
      listReleasedDocumentsForCustomerAccount: jest
        .fn()
        .mockResolvedValue([sampleDocument]),
    },
    ...overrides,
  } satisfies ListMyDocumentsLogicDeps;
}

describe('ai-list-my-documents.logic (ai-cmd-customer-4.14.5)', () => {
  it.each(
    LIST_MY_DOCUMENTS_PROMPTS.slice(0, 4).map((row) => [row.id, row.prompt]),
  )('handles list_my_documents for $0', async (_id, prompt) => {
    const result = await handleListMyDocumentsLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('list_my_documents');
    expect(result.details?.myDocumentsSection).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: '/results',
      query: expect.objectContaining({ section: 'my-documents' }),
    });
    expect(result.details?.count).toBe(1);
  });

  it('requires sign-in', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps(),
      'biz-1',
      {},
      'Show my referral letter',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it('clarifies on unrecognized prompt', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('filters by category from API', async () => {
    const listReleased = jest.fn().mockResolvedValue([sampleDocument]);
    await handleListMyDocumentsLogic(
      buildDeps({
        patientDocumentsService: {
          listReleasedDocumentsForCustomerAccount: listReleased,
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my referral letter',
    );
    expect(listReleased).toHaveBeenCalledWith(
      'biz-1',
      'cust-1',
      'cust-1',
      'referral_letter',
    );
  });

  it.each(LIST_MY_DOCUMENTS_RESCUE_SCENARIOS)(
    'rescue fixture $id maps to list_my_documents',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueListMyDocumentsIntent(prompt, misclassifiedAction)?.action,
      ).toBe('list_my_documents');
    },
  );

  it('rejects non-clinic businesses', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps({
        businessRepo: {
          findOne: jest.fn().mockResolvedValue({
            ...clinicBusiness,
            settings: { businessType: 'salon' },
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my referral letter',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('handles missing business', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps({
        businessRepo: { findOne: jest.fn().mockResolvedValue(null) },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my referral letter',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });

  it('handles service errors', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps({
        patientDocumentsService: {
          listReleasedDocumentsForCustomerAccount: jest
            .fn()
            .mockRejectedValue(new Error('Documents unavailable')),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'List my documents',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Documents unavailable');
  });

  it('filters by title in summary', async () => {
    const result = await handleListMyDocumentsLogic(
      buildDeps({
        patientDocumentsService: {
          listReleasedDocumentsForCustomerAccount: jest.fn().mockResolvedValue([
            sampleDocument,
            {
              ...sampleDocument,
              id: 'doc-2',
              title: 'Other file',
            },
          ]),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1', title: 'Cardiology' },
      'Show my referral letter',
    );
    expect(result.success).toBe(true);
    expect(result.details?.count).toBe(1);
  });
});
