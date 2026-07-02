import {
  buildBookAnotherServiceNavigate,
  buildBookAnotherServiceSummary,
  FRESH_BOOK_QUERY_KEY,
  FRESH_BOOK_QUERY_VALUE,
  isFreshBookQueryValue,
} from './book-another-service.util.js';

describe('book-another-service.util (ai-cmd-customer-4.3.6)', () => {
  it('builds services navigate with freshBook reset flag', () => {
    expect(buildBookAnotherServiceNavigate({ date: '2026-07-15' })).toEqual({
      path: 'services',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
        date: '2026-07-15',
      },
    });
  });

  it('builds checkout navigate with serviceId and freshBook reset flag', () => {
    expect(
      buildBookAnotherServiceNavigate({
        serviceId: 'svc-massage',
        date: '2026-07-15',
      }),
    ).toEqual({
      path: 'checkout',
      query: {
        [FRESH_BOOK_QUERY_KEY]: FRESH_BOOK_QUERY_VALUE,
        date: '2026-07-15',
        serviceId: 'svc-massage',
      },
    });
  });

  it('detects freshBook query value', () => {
    expect(isFreshBookQueryValue(FRESH_BOOK_QUERY_VALUE)).toBe(true);
    expect(isFreshBookQueryValue('0')).toBe(false);
  });

  it('summarizes fresh rebook navigation', () => {
    expect(
      buildBookAnotherServiceSummary({
        serviceName: 'Massage',
        date: '2026-07-15',
      }),
    ).toContain('fresh booking flow');
    expect(buildBookAnotherServiceSummary({ date: '2026-07-15' })).toContain(
      'service list',
    );
  });
});
