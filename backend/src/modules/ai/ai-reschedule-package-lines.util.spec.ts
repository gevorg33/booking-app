import {
  extractPackageVisitIndexesFromPrompt,
  parseReschedulePackageLinesFromPrompt,
} from './ai-reschedule-package-lines.util.js';

describe('extractPackageVisitIndexesFromPrompt', () => {
  it('extracts two visit numbers joined by "and"', () => {
    expect(
      extractPackageVisitIndexesFromPrompt('Move visits 2 and 3 to next week'),
    ).toEqual([2, 3]);
  });

  it('extracts three visit numbers with a comma list', () => {
    expect(
      extractPackageVisitIndexesFromPrompt(
        'Reschedule visits 1, 2 and 4 of my package to Friday',
      ),
    ).toEqual([1, 2, 4]);
  });

  it('returns a single number for a singular visit prompt', () => {
    expect(
      extractPackageVisitIndexesFromPrompt('Move package visit 3 to next week'),
    ).toEqual([3]);
  });

  it('returns an empty array with no visit numbers', () => {
    expect(
      extractPackageVisitIndexesFromPrompt('Reschedule my spa day'),
    ).toEqual([]);
  });
});

describe('isReschedulePackageLinesPrompt', () => {});

describe('parseReschedulePackageLinesFromPrompt', () => {
  it('parses visit indexes, package name, and target date', () => {
    const parsed = parseReschedulePackageLinesFromPrompt(
      'Move Spa Day visits 2 and 3 to Friday',
      {},
      'UTC',
    );
    expect(parsed?.visitIndexes).toEqual([2, 3]);
    expect(parsed?.packageName).toBe('Spa Day');
  });

  it('returns null when fewer than 2 indexes are found', () => {
    expect(
      parseReschedulePackageLinesFromPrompt('Reschedule my spa day', {}, 'UTC'),
    ).toBeNull();
  });

  it('accepts visitIndexes passed directly in params', () => {
    const parsed = parseReschedulePackageLinesFromPrompt('', {
      visitIndexes: [1, 3],
    });
    expect(parsed?.visitIndexes).toEqual([1, 3]);
  });
});
