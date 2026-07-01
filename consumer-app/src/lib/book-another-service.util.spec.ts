import { describe, expect, it } from 'vitest';
import {
  FRESH_BOOK_QUERY_KEY,
  FRESH_BOOK_QUERY_VALUE,
  shouldResetBookPageSuccessState,
  stripFreshBookQueryParam,
} from './book-another-service.util.js';

describe('book-another-service.util (ai-cmd-customer-4.3.6)', () => {
  it('detects freshBook reset query', () => {
    expect(
      shouldResetBookPageSuccessState(`?${FRESH_BOOK_QUERY_KEY}=${FRESH_BOOK_QUERY_VALUE}`),
    ).toBe(true);
    expect(shouldResetBookPageSuccessState('?date=2026-07-15')).toBe(false);
  });

  it('strips freshBook from search params', () => {
    expect(
      stripFreshBookQueryParam(`?${FRESH_BOOK_QUERY_KEY}=${FRESH_BOOK_QUERY_VALUE}&date=2026-07-15`),
    ).toBe('?date=2026-07-15');
  });
});
