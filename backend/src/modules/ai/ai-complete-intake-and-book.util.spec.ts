import {
  COMPLETE_INTAKE_AND_BOOK_BOUNDARY_PROMPTS,
  COMPLETE_INTAKE_AND_BOOK_PROMPTS,
  COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS,
} from './ai-complete-intake-and-book.fixtures.js';
import { COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-complete-intake-and-book-multilingual.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS } from './ai-explain-public-intake-form.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_PROMPTS } from './ai-book-lab-collection-nearest.fixtures.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';
import { isIntakeLabBookPayCompoundPrompt } from './ai-intake-lab-book-pay-compound.util.js';
import {
  assertCompleteIntakeAndBookBusinessType,
  buildCompleteIntakeAndBookCompoundParams,
  buildCompleteIntakeAndBookNavigate,
  decomposeCustomerCompleteIntakeAndBookCompoundPrompt,
  decomposeCompleteIntakeAndBookCompoundPrompt,
  decomposePublicCompleteIntakeAndBookCompoundPrompt,
  extractLabServiceNameFromIntakeBookPrompt,
  formatCompleteIntakeAndBookSummary,
  isCompleteIntakeAndBookCompoundPrompt,
  isCompleteIntakeAndBookIntent,
  parseCompleteIntakeAndBookFromPrompt,
  rescueCompleteIntakeAndBookCompoundIntent,
  resolveIntakeBookLabService,
} from './ai-complete-intake-and-book.util.js';

describe('ai-complete-intake-and-book.util (ai-cmd-customer-4.14.2)', () => {
  it.each(
    COMPLETE_INTAKE_AND_BOOK_PROMPTS.map((row) => [row.id, row] as const),
  )(
    'detects complete_intake_and_book compound for $id on $surface',
    (_id, row) => {
      expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(true);
      const steps = decomposeCustomerCompleteIntakeAndBookCompoundPrompt(
        row.prompt,
      );
      if (row.surface === 'customer') {
        expect(steps.map((step) => step.action)).toEqual(row.orderedActions);
        expect(steps[0]?.params.preVisitIntakeRequired).toBe(true);
        expect(steps[1]?.params.continueAfterIntake).toBe(true);
      }
    },
  );

  it.each(
    COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual complete_intake_and_book for $id', (_id, row) => {
    expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(true);
  });

  it.each(
    COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueCompleteIntakeAndBookCompoundIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('compound_intent');
  });

  it.each(
    COMPLETE_INTAKE_AND_BOOK_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('does not steal boundary prompt $id', (_id, row) => {
    expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(false);
  });

  it('decomposes public compound with book_appointment', () => {
    const steps = decomposePublicCompleteIntakeAndBookCompoundPrompt(
      'Fill intake and book blood draw',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'complete_intake_and_book',
      'book_appointment',
    ]);
  });

  it('extracts service names and resolves lab services', () => {
    expect(
      extractLabServiceNameFromIntakeBookPrompt(
        'Answer intake questions and book lipid panel',
      ),
    ).toBe('lipid panel');
    const resolved = resolveIntakeBookLabService(
      [
        { id: 'svc-1', name: 'Haircut', metadata: {} },
        {
          id: 'svc-2',
          name: 'CBC Blood Draw',
          metadata: { serviceType: 'lab_test' },
        },
      ],
      'CBC',
    );
    expect(resolved?.id).toBe('svc-2');
    expect(
      buildCompleteIntakeAndBookCompoundParams(
        'Fill intake form then book earliest blood draw slot',
      ).bookingFirstAvailable,
    ).toBe(true);
  });

  it('covers helpers, branches, and service resolution paths', () => {
    expect(
      extractLabServiceNameFromIntakeBookPrompt(
        'Book "Metabolic panel" after intake',
      ),
    ).toBe('Metabolic panel');
    expect(extractLabServiceNameFromIntakeBookPrompt('book blood work')).toBe(
      'blood work',
    );
    expect(extractLabServiceNameFromIntakeBookPrompt('book lab test now')).toBe(
      'lab test',
    );
    expect(
      extractLabServiceNameFromIntakeBookPrompt(
        'Complete intake and book blood sample for visit',
      ),
    ).toBe('blood draw');
    expect(
      extractLabServiceNameFromIntakeBookPrompt('fill intake and schedule lab'),
    ).toBe('lab test');
    expect(
      parseCompleteIntakeAndBookFromPrompt('nope', {
        _action: 'complete_intake_and_book',
        serviceName: 'TSH',
      }),
    ).toMatchObject({ serviceName: 'TSH' });
    expect(
      parseCompleteIntakeAndBookFromPrompt('unrelated', {
        completeIntakeAndBook: true,
        serviceName: 'CBC',
      }),
    ).toMatchObject({ serviceName: 'CBC' });
    expect(assertCompleteIntakeAndBookBusinessType('clinic')).toBeNull();
    expect(assertCompleteIntakeAndBookBusinessType('salon')).toBe('salon');
    expect(formatCompleteIntakeAndBookSummary('Blood Draw', false)).toContain(
      'slot selection',
    );
    expect(formatCompleteIntakeAndBookSummary('Blood Draw', true)).toContain(
      'earliest available',
    );
    expect(buildCompleteIntakeAndBookNavigate('svc-1')).toEqual({
      path: 'book',
      query: {
        serviceId: 'svc-1',
        bookingPhase: 'intake',
        completeIntakeAndBook: '1',
      },
    });
    expect(
      resolveIntakeBookLabService(
        [
          {
            id: 'svc-lipid',
            name: 'Lipid panel',
            metadata: { serviceType: 'lab_test' },
          },
        ],
        'lipid',
      )?.id,
    ).toBe('svc-lipid');
    expect(
      resolveIntakeBookLabService(
        [
          {
            id: 'svc-draw',
            name: 'Venipuncture',
            metadata: { serviceType: 'lab_test' },
          },
        ],
        'blood draw',
      )?.id,
    ).toBe('svc-draw');
    expect(
      resolveIntakeBookLabService(
        [{ id: 'svc-1', name: 'Panel', metadata: { serviceType: 'lab_test' } }],
        undefined,
      )?.id,
    ).toBe('svc-1');
    expect(
      resolveIntakeBookLabService(
        [
          {
            id: 'svc-cbc',
            name: 'CBC panel',
            metadata: { serviceType: 'lab_test' },
          },
        ],
        'cbc',
      )?.id,
    ).toBe('svc-cbc');
    expect(
      resolveIntakeBookLabService(
        [
          {
            id: 'svc-exact',
            name: 'Blood Draw',
            metadata: { serviceType: 'lab_test' },
          },
        ],
        'Blood Draw',
      )?.id,
    ).toBe('svc-exact');
    expect(
      decomposeCompleteIntakeAndBookCompoundPrompt(
        'Fill intake and book blood draw',
        'customer',
      ).map((step) => step.action),
    ).toEqual(['complete_intake_and_book', 'book_nearest_slot']);
    expect(parseCompleteIntakeAndBookFromPrompt('nope')).toBeNull();
    expect(
      isCompleteIntakeAndBookCompoundPrompt('Book my lab collection'),
    ).toBe(false);
    expect(isCompleteIntakeAndBookCompoundPrompt('')).toBe(false);
    expect(
      decomposeCustomerCompleteIntakeAndBookCompoundPrompt('Book a haircut'),
    ).toEqual([]);
  });

  it('does not steal explain or lab-nearest prompts', () => {
    for (const row of EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS.slice(0, 2)) {
      expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(false);
      expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(true);
    }
    for (const row of BOOK_LAB_COLLECTION_NEAREST_PROMPTS.slice(0, 2)) {
      expect(isCompleteIntakeAndBookCompoundPrompt(row.prompt)).toBe(false);
    }
    expect(isCompleteIntakeAndBookIntent('complete_intake_and_book')).toBe(
      true,
    );
    expect(isCompleteIntakeAndBookIntent('unknown')).toBe(false);
    expect(
      rescueCompleteIntakeAndBookCompoundIntent(
        'Fill intake and book blood draw',
        'compound_intent',
      ),
    ).toBeNull();
  });

  it('defers intake+lab+pay prompts to intake_lab_book_pay compound', () => {
    const prompt = 'Fill intake and book blood draw, pay online';
    expect(isCompleteIntakeAndBookCompoundPrompt(prompt)).toBe(false);
    expect(isIntakeLabBookPayCompoundPrompt(prompt)).toBe(true);
  });
});
