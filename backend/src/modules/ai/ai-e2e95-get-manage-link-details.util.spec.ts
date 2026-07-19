import { commandResultToPublicAssistantResult } from './customer-ai-command.util.js';
import { buildManageLinkResendSummary } from './ai-get-manage-link.util.js';
import { E2E95_GET_MANAGE_LINK_DETAIL_SCENARIOS } from './ai-e2e95-get-manage-link-details.fixtures.js';

describe('e2e-bug.95 get_manage_link delivers link/token', () => {
  it.each(
    E2E95_GET_MANAGE_LINK_DETAIL_SCENARIOS.map((row) => [row.id, row] as const),
  )('public assistant result keeps %s', (_id, row) => {
    const mapped = commandResultToPublicAssistantResult({
      success: true,
      action: 'get_manage_link',
      summary: `Here is your booking manage link: ${
        row.detailKey === 'manageUrl' ? row.detailValue : 'https://example/manage'
      }`,
      details: {
        bookingId: 'book-1',
        [row.detailKey]: row.detailValue,
        manageUrl: 'https://book.example/s/salon/manage?bookingId=b1&token=t1',
        manageToken: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
      },
    });

    expect(mapped.bookingId).toBe('book-1');
    expect(mapped.details?.[row.detailKey]).toBe(row.detailValue);
    expect(mapped.details?.manageUrl).toContain('/manage');
    expect(mapped.details?.manageToken).toBe(
      'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    );
  });

  it('summary includes manageUrl for link_only delivery', () => {
    const url =
      'https://book.example/s/salon/manage?bookingId=b1&token=tok-abc';
    expect(
      buildManageLinkResendSummary({
        delivery: 'link_only',
        resent: false,
        manageUrl: url,
      }),
    ).toBe(`Here is your booking manage link: ${url}`);
  });
});
