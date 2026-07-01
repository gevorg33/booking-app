import {
  BOOK_LAB_COLLECTION_NEAREST_PROMPTS,
  BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS,
} from './ai-book-lab-collection-nearest.fixtures.js';
import { BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS } from './ai-book-lab-collection-nearest-multilingual.fixtures.js';
import {
  buildBookLabCollectionNearestCompoundParams,
  decomposeBookLabCollectionNearestCompoundPrompt,
  decomposeCustomerBookLabCollectionNearestCompoundPrompt,
  decomposePublicBookLabCollectionNearestCompoundPrompt,
  hasLabCollectionNearestSlotCue,
  isBookLabCollectionNearestCompoundPrompt,
  rescueBookLabCollectionNearestCompoundIntent,
} from './ai-book-lab-collection-nearest.util.js';
import {
  isBookLabCollectionPrompt,
  isListMyLabBookingRequestsPrompt,
} from './ai-clinic-lab-booking.util.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('ai-book-lab-collection-nearest.util (ai-cmd-customer-4.7.3)', () => {
  it.each(
    BOOK_LAB_COLLECTION_NEAREST_PROMPTS.map((row) => [row.id, row] as const),
  )('detects compound for $id on $surface', (_id, row) => {
    expect(isBookLabCollectionNearestCompoundPrompt(row.prompt)).toBe(true);
    expect(hasLabCollectionNearestSlotCue(row.prompt)).toBe(true);
    const steps = decomposeBookLabCollectionNearestCompoundPrompt(
      row.prompt,
      row.surface,
    );
    expect(steps.map((step) => step.action)).toEqual(row.orderedActions);
    expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
    if (row.testName) {
      expect(steps[1]?.params.testName).toBe(row.testName);
    }
  });

  it.each(
    BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual compound for $id', (_id, row) => {
    expect(isBookLabCollectionNearestCompoundPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_LAB_COLLECTION_NEAREST_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues compound from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueBookLabCollectionNearestCompoundIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('compound_intent');
    const golden = matchGoldenCompoundPattern(row.surface, row.prompt);
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'list_my_lab_booking_requests',
      'book_lab_collection',
    ]);
  });

  it('decomposes via golden patterns for customer and public', () => {
    const prompt = 'Book lab draw earliest slot';
    const customer = decomposeDeterministicForSurface('customer', prompt);
    expect(customer?.recipeId).toBe('book_lab_collection_nearest');
    expect(customer?.steps.map((step) => step.action)).toEqual([
      'list_my_lab_booking_requests',
      'book_lab_collection',
    ]);
    const pub = decomposeDeterministicForSurface('public', prompt);
    expect(pub?.recipeId).toBe('public_book_lab_collection_nearest');
  });

  it('excludes plain list/book lab prompts without nearest cue', () => {
    expect(
      isListMyLabBookingRequestsPrompt(
        'What lab appointments do I need to book?',
      ),
    ).toBe(true);
    expect(
      isBookLabCollectionNearestCompoundPrompt(
        'What lab appointments do I need to book?',
      ),
    ).toBe(false);
    expect(isBookLabCollectionPrompt('Book my lab collection')).toBe(true);
    expect(
      isBookLabCollectionNearestCompoundPrompt('Book my lab collection'),
    ).toBe(false);
    expect(
      isBookLabCollectionNearestCompoundPrompt('Book nearest slot for haircut'),
    ).toBe(false);
    expect(
      isBookLabCollectionNearestCompoundPrompt(
        'Book nearest slot for my blood test',
      ),
    ).toBe(false);
  });

  it('covers params builder and rescue guard', () => {
    expect(
      buildBookLabCollectionNearestCompoundParams(
        'Book lipid panel blood draw earliest available',
      ).bookingFirstAvailable,
    ).toBe(true);
    expect(
      rescueBookLabCollectionNearestCompoundIntent(
        'Book lab draw earliest slot',
        'compound_intent',
      ),
    ).toBeNull();
    expect(
      decomposeBookLabCollectionNearestCompoundPrompt(
        'Show my appointments only',
      ),
    ).toEqual([]);
  });

  it('detects heuristic compound prompts not in fixtures', () => {
    const prompt = 'Reserve the lab blood draw next available opening please';
    expect(isBookLabCollectionNearestCompoundPrompt(prompt)).toBe(true);
    expect(
      decomposeCustomerBookLabCollectionNearestCompoundPrompt(prompt).map(
        (step) => step.action,
      ),
    ).toEqual(['list_my_lab_booking_requests', 'book_lab_collection']);
    expect(
      decomposePublicBookLabCollectionNearestCompoundPrompt(prompt).map(
        (step) => step.action,
      ),
    ).toEqual(['list_my_lab_booking_requests', 'book_lab_collection']);
  });
});
