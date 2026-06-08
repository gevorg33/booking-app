import { describe, expect, it } from 'vitest';
import { groupBookingCountsByDate, renderStarRating } from './provider-profile';

describe('provider-profile util', () => {
  it('groups booking counts by YYYY-MM-DD date key', () => {
    expect(
      groupBookingCountsByDate([
        { startTime: '2026-06-09T09:00:00.000Z' },
        { startTime: '2026-06-09T14:00:00.000Z' },
        { startTime: '2026-06-10T11:00:00.000Z' },
      ]),
    ).toEqual({
      '2026-06-09': 2,
      '2026-06-10': 1,
    });
  });

  it.each([
    { rating: 0, expected: '☆☆☆☆☆' },
    { rating: 2.4, expected: '★★☆☆☆' },
    { rating: 4.6, expected: '★★★★★' },
    { rating: 7, expected: '★★★★★' },
  ])('renders $rating as $expected', ({ rating, expected }) => {
    expect(renderStarRating(rating)).toBe(expected);
  });
});
