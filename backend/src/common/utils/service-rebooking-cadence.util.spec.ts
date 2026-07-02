import {
  REBOOKING_CADENCE_SCENARIOS,
  REBOOKING_DUE_SCENARIOS,
} from './service-rebooking-cadence.fixtures.js';
import {
  computeRebookingDueDate,
  formatRebookingCadenceLabel,
  isRebookingNudgeDue,
  readServiceRebookingCadenceDays,
  resolveServiceRebookingCadenceDays,
} from './service-rebooking-cadence.util.js';

describe('service-rebooking-cadence.util', () => {
  it.each(REBOOKING_CADENCE_SCENARIOS)(
    'resolves cadence for $id',
    ({ serviceMetadata, defaultCadenceDays, expectedCadenceDays }) => {
      expect(
        resolveServiceRebookingCadenceDays(
          { metadata: serviceMetadata },
          { defaultRebookingCadenceDays: defaultCadenceDays },
        ),
      ).toBe(expectedCadenceDays);
    },
  );

  it('returns null when service cadence metadata is invalid', () => {
    expect(
      readServiceRebookingCadenceDays({
        metadata: { rebookingCadenceDays: 'bad' },
      }),
    ).toBeNull();
  });

  it.each(REBOOKING_DUE_SCENARIOS)(
    'isRebookingNudgeDue $id',
    ({ lastCompletedAt, cadenceDays, now, expectedDue }) => {
      expect(
        isRebookingNudgeDue(
          new Date(lastCompletedAt),
          cadenceDays,
          new Date(now),
        ),
      ).toBe(expectedDue);
    },
  );

  it('computes due date from last completed visit', () => {
    const lastCompleted = new Date(2026, 4, 1, 15, 0, 0);
    const due = computeRebookingDueDate(lastCompleted, 28);
    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(4);
    expect(due.getDate()).toBe(29);
  });

  it('formats single-day cadence label', () => {
    expect(formatRebookingCadenceLabel(1)).toBe('1 day');
    expect(formatRebookingCadenceLabel(7)).toBe('1 week');
    expect(formatRebookingCadenceLabel(8)).toBe('8 days');
    expect(formatRebookingCadenceLabel(14)).toBe('2 weeks');
  });

  it('reads string cadence days from service metadata', () => {
    expect(
      readServiceRebookingCadenceDays({
        metadata: { rebookingCadenceDays: '21' },
      }),
    ).toBe(21);
  });

  it('returns null for invalid string cadence metadata', () => {
    expect(
      readServiceRebookingCadenceDays({
        metadata: { rebookingCadenceDays: 'bad' },
      }),
    ).toBeNull();
  });
});
