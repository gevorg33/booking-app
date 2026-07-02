import {
  BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS,
  BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS,
} from './ai-book-package-with-nearest-slot.fixtures.js';
import { BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS } from './ai-book-package-with-nearest-slot-multilingual.fixtures.js';
import {
  buildBookPackageWithNearestSlotCompoundParams,
  decomposeBookPackageWithNearestSlotCompoundPrompt,
  hasPackageNearestSlotCue,
  isBookPackageWithNearestSlotCompoundPrompt,
  rescueBookPackageWithNearestSlotCompoundIntent,
  wantsPackageBookingPrompt,
} from './ai-book-package-with-nearest-slot.util.js';
import {
  isBookPackagePrompt,
  isCheckPackageAvailabilityPrompt,
} from './ai-self-service-booking.util.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('ai-book-package-with-nearest-slot.util (ai-cmd-customer-4.6.2)', () => {
  it.each(
    BOOK_PACKAGE_WITH_NEAREST_SLOT_PROMPTS.map((row) => [row.id, row] as const),
  )('detects compound for $id on $surface', (_id, row) => {
    expect(isBookPackageWithNearestSlotCompoundPrompt(row.prompt)).toBe(true);
    expect(hasPackageNearestSlotCue(row.prompt)).toBe(true);
    const steps = decomposeBookPackageWithNearestSlotCompoundPrompt(
      row.prompt,
      row.surface,
    );
    expect(steps.map((step) => step.action)).toEqual(row.orderedActions);
    expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
    if (row.packageName) {
      expect(steps[1]?.params.packageName).toBe(row.packageName);
    }
  });

  it.each(
    BOOK_PACKAGE_WITH_NEAREST_SLOT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual compound for $id', (_id, row) => {
    expect(isBookPackageWithNearestSlotCompoundPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_PACKAGE_WITH_NEAREST_SLOT_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues compound from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueBookPackageWithNearestSlotCompoundIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('compound_intent');
    const golden = matchGoldenCompoundPattern(row.surface, row.prompt);
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'discover_packages',
      'book_package',
    ]);
  });

  it('decomposes via golden patterns for customer and public', () => {
    const prompt = 'Book the spa package earliest available';
    const customer = decomposeDeterministicForSurface('customer', prompt);
    expect(customer?.recipeId).toBe('book_package_with_nearest_slot');
    expect(customer?.steps.map((step) => step.action)).toEqual([
      'discover_packages',
      'book_package',
    ]);
    const pub = decomposeDeterministicForSurface('public', prompt);
    expect(pub?.recipeId).toBe('public_book_package_with_nearest_slot');
  });

  it('excludes promo and plain package prompts', () => {
    expect(
      isBookPackageWithNearestSlotCompoundPrompt(
        'Book spa day package and apply promo code WELCOME',
      ),
    ).toBe(false);
    expect(isBookPackagePrompt('Buy the spa day package')).toBe(true);
    expect(
      isBookPackageWithNearestSlotCompoundPrompt('Buy the spa day package'),
    ).toBe(false);
    expect(
      isCheckPackageAvailabilityPrompt(
        'Is the wellness package available tomorrow?',
      ),
    ).toBe(true);
    expect(
      isBookPackageWithNearestSlotCompoundPrompt(
        'Is the wellness package available tomorrow?',
      ),
    ).toBe(false);
  });

  it('covers heuristic package-name extraction and rescue guard', () => {
    expect(wantsPackageBookingPrompt('Buy deluxe bundle soonest opening')).toBe(
      true,
    );
    expect(
      buildBookPackageWithNearestSlotCompoundParams(
        'Purchase wellness package nearest available',
      ).packageName,
    ).toBe('wellness package');
    expect(
      rescueBookPackageWithNearestSlotCompoundIntent(
        'Book the spa package earliest available',
        'compound_intent',
      ),
    ).toBeNull();
    expect(
      decomposeBookPackageWithNearestSlotCompoundPrompt('Show packages only'),
    ).toEqual([]);
  });
});
