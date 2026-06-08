import { describe, expect, it } from 'vitest';
import {
  buildProviderBookingPrompt,
  listProviderBookableTimes,
  normalizeAvailableProviders,
} from './ai-available-providers.util.js';

describe('normalizeAvailableProviders', () => {
  it('returns empty list for missing details', () => {
    expect(normalizeAvailableProviders()).toEqual([]);
    expect(normalizeAvailableProviders(undefined)).toEqual([]);
    expect(normalizeAvailableProviders({})).toEqual([]);
  });

  it('normalizes structured provider availability rows', () => {
    expect(
      normalizeAvailableProviders({
        availability: [
          {
            id: 'emp-1',
            name: 'Karo Mazmanyan',
            role: 'Cosmetologist',
            previewTimes: ['14:00', '14:30'],
          },
        ],
      }),
    ).toEqual([
      {
        id: 'emp-1',
        name: 'Karo Mazmanyan',
        role: 'Cosmetologist',
        previewTimes: ['14:00', '14:30'],
      },
    ]);
  });

  it('deduplicates providers by id', () => {
    expect(
      normalizeAvailableProviders({
        availability: [{ id: 'emp-1', name: 'A' }],
        providers: [{ id: 'emp-1', name: 'A duplicate' }],
      }),
    ).toEqual([{ id: 'emp-1', name: 'A' }]);
  });

  it('falls back to name-only providers', () => {
    expect(
      normalizeAvailableProviders({
        availableProviders: ['Mary', 'Gevorg'],
      }),
    ).toEqual([{ name: 'Mary' }, { name: 'Gevorg' }]);
  });
});

describe('listProviderBookableTimes', () => {
  it('prefers previewTimes', () => {
    expect(
      listProviderBookableTimes({
        name: 'A',
        previewTimes: ['09:00', '10:00'],
        earliestStartTime: '2026-06-09T08:00:00.000Z',
      }),
    ).toEqual(['09:00', '10:00']);
  });

  it('normalizes ISO open slot starts', () => {
    expect(
      listProviderBookableTimes({
        name: 'A',
        openSlots: [{ start: '2026-06-09T14:30:00.000Z', end: '2026-06-09T15:00:00.000Z' }],
      }),
    ).toEqual(['14:30']);
  });
});

describe('buildProviderBookingPrompt', () => {
  it('includes explicit time when provided', () => {
    expect(
      buildProviderBookingPrompt({
        provider: { name: 'Mary' },
        serviceName: 'Brows',
        date: '2026-06-10',
        time: '11:00',
      }),
    ).toBe('Book Brows with Mary on 2026-06-10 at 11:00');
  });
});
