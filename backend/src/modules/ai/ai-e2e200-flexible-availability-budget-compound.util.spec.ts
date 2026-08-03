import {
  E2E200_BOOK_NEAREST_PROMPTS,
  E2E200_COMPOUND_CASES,
  E2E200_NORMALIZE_CASES,
} from './ai-e2e200-flexible-availability-budget-compound.fixtures.js';
import {
  buildFlexibleAvailabilityCompoundSharedParams,
  decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityBudgetBookCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import {
  normalizeAvailabilityServiceCategory,
  resolveAvailabilityServiceFieldsFromKeyword,
} from './ai-flexible-availability.util.js';
import { isBookNearestSlotPrompt } from './ai-payments.util.js';

describe('e2e-bug.200 flexible availability budget compound service parity', () => {
  it.each(E2E200_NORMALIZE_CASES.map((row) => [row.id, row] as const))(
    'normalize/fields $id',
    (_id, row) => {
      expect(normalizeAvailabilityServiceCategory(row.input)).toBe(
        row.expectCategory,
      );
      expect(resolveAvailabilityServiceFieldsFromKeyword(row.input)).toEqual(
        row.expectFields,
      );
    },
  );

  it.each(E2E200_BOOK_NEAREST_PROMPTS.map((row) => [row.id, row] as const))(
    'isBookNearestSlotPrompt $id',
    (_id, row) => {
      expect(isBookNearestSlotPrompt(row.prompt)).toBe(row.expect);
    },
  );

  it.each(E2E200_COMPOUND_CASES.map((row) => [row.id, row] as const))(
    'compound detect + service fields $id',
    (_id, row) => {
      expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(row.prompt)).toBe(
        row.expectBookCompound,
      );

      const steps = decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt(
        row.prompt,
      );
      if (!row.expectBookCompound) {
        expect(steps).toEqual([]);
        return;
      }

      expect(steps.map((s) => s.action)).toEqual([
        'check_providers_for_service',
        'book_nearest_slot',
      ]);

      const shared = buildFlexibleAvailabilityCompoundSharedParams(
        row.prompt,
        'customer',
      );
      const step0 = steps[0]?.params ?? {};

      if (row.expectServiceName) {
        const name =
          (typeof step0.serviceName === 'string' && step0.serviceName) ||
          (typeof shared.serviceName === 'string' && shared.serviceName) ||
          (typeof step0.serviceCategory === 'string' &&
            step0.serviceCategory === row.expectServiceName &&
            step0.serviceCategory) ||
          null;
        expect(name).toBe(row.expectServiceName);
      }

      if (row.expectServiceCategory != null) {
        expect(
          step0.serviceCategory ?? shared.serviceCategory ?? null,
        ).toBe(row.expectServiceCategory);
      }

      if (row.expectServiceCategory === null && row.expectServiceName) {
        // Multi-word should not be collapsed to first token on serviceCategory
        expect(step0.serviceCategory).not.toBe(
          row.expectServiceName.split(/\s+/)[0]?.toLowerCase(),
        );
      }

      if (row.forbidServiceCategory) {
        expect(step0.serviceCategory).not.toBe(row.forbidServiceCategory);
        expect(shared.serviceCategory).not.toBe(row.forbidServiceCategory);
      }

      expect(step0.maxPrice).toBe(50);
      expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
    },
  );

  it('hairstyle compound is not dropped vs Neck Massage control', () => {
    const hair =
      'I want a hairstyle tomorrow evening or Friday afternoon, I have $50, book the soonest';
    const neck =
      'I want a Neck Massage tomorrow evening or Friday afternoon, I have $50, book the soonest';
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(hair)).toBe(true);
    expect(isFlexibleAvailabilityBudgetBookCompoundPrompt(neck)).toBe(true);
    expect(
      decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt(hair),
    ).toHaveLength(2);
    expect(
      decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt(neck),
    ).toHaveLength(2);
  });

  it('Swedish massage is not truncated to swedish', () => {
    const prompt =
      "Who's free for a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest";
    const shared = buildFlexibleAvailabilityCompoundSharedParams(
      prompt,
      'customer',
    );
    expect(shared.serviceCategory).not.toBe('swedish');
    expect(
      shared.serviceName === 'Swedish massage' ||
        shared.serviceCategory === 'Swedish massage',
    ).toBe(true);
  });
});
