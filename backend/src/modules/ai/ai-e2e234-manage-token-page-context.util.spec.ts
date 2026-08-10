import {
  E2E234_MANAGE_PAGE_SESSION,
  E2E234_MANAGE_TOKEN_PAGE_SCENARIOS,
} from './ai-e2e234-manage-token-page-context.fixtures.js';
import {
  hasManageLinkCredentialsInSession,
  rescueManageBookingWithTokenIntent,
  resolveManageBookingCredentials,
} from './ai-manage-booking-with-token.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { PUBLIC_ASSISTANT_SESSION_MERGE_KEYS } from '../public-booking/public-booking-assistant-session.util.js';
import { mergePublicAssistantSessionParams } from '../public-booking/public-booking-assistant-session.util.js';

describe('e2e-bug.234 manage-page URL manageToken for guest cancel/reschedule', () => {
  const rescue = new AiIntentRescueService();

  it('session merge keys include manage credentials', () => {
    expect(PUBLIC_ASSISTANT_SESSION_MERGE_KEYS).toEqual(
      expect.arrayContaining(['bookingId', 'manageToken']),
    );
  });

  it('merges manageToken from page session into empty params', () => {
    const merged = mergePublicAssistantSessionParams(
      {},
      { ...E2E234_MANAGE_PAGE_SESSION },
      'reschedule_booking_with_token',
    );
    expect(merged.bookingId).toBe(E2E234_MANAGE_PAGE_SESSION.bookingId);
    expect(merged.manageToken).toBe(E2E234_MANAGE_PAGE_SESSION.manageToken);
  });

  it.each(
    E2E234_MANAGE_TOKEN_PAGE_SCENARIOS.map((row) => [row.id, row] as const),
  )('$id: rescueManageBookingWithTokenIntent', (_id, row) => {
    const hasCreds = hasManageLinkCredentialsInSession(row.session);
    const rescued = rescueManageBookingWithTokenIntent(
      row.prompt,
      row.misclassifiedAction,
      row.session,
    );
    if (row.expectedAction == null) {
      expect(hasCreds).toBe(false);
      expect(rescued).toBeNull();
      return;
    }
    expect(hasCreds).toBe(true);
    // Already-correct with_token action → rescue no-ops; credentials still resolve.
    if (row.misclassifiedAction === row.expectedAction) {
      expect(rescued).toBeNull();
    } else {
      expect(rescued?.action).toBe(row.expectedAction);
    }
    const creds = resolveManageBookingCredentials(
      { ...row.session },
      row.prompt,
    );
    expect(creds.bookingId).toBe(row.session.bookingId);
    expect(creds.manageToken).toBe(
      'manageToken' in row.session ? row.session.manageToken : undefined,
    );
  });

  it.each(
    E2E234_MANAGE_TOKEN_PAGE_SCENARIOS.filter(
      (r) => r.expectedAction && r.misclassifiedAction !== r.expectedAction,
    ).map((row) => [row.id, row] as const),
  )(
    '$id: AiIntentRescueService remaps with params as session bag (pipeline shape)',
    (_id, row) => {
      for (const surface of ['customer', 'public'] as const) {
        const result = rescue.rescue({
          prompt: row.prompt,
          action: row.misclassifiedAction,
          params: {
            bookingId: row.session.bookingId,
            ...('manageToken' in row.session
              ? { manageToken: row.session.manageToken }
              : {}),
          },
          surface,
        });
        expect(result?.action).toBe(row.expectedAction);
        expect(result?.params?.bookingId).toBe(row.session.bookingId);
        if ('manageToken' in row.session) {
          expect(result?.params?.manageToken).toBe(row.session.manageToken);
        }
      }
    },
  );

  it('already-correct with_token still resolves credentials from page session', () => {
    const row = E2E234_MANAGE_TOKEN_PAGE_SCENARIOS.find(
      (r) => r.id === 'e2e234-reschedule-with-manage-token-phrase',
    )!;
    const creds = resolveManageBookingCredentials(
      { ...row.session },
      row.prompt,
    );
    expect(creds).toEqual({
      bookingId: E2E234_MANAGE_PAGE_SESSION.bookingId,
      manageToken: E2E234_MANAGE_PAGE_SESSION.manageToken,
    });
  });

  it('does not rescue signed-in family without manageToken', () => {
    expect(
      rescue.rescue({
        prompt: 'Reschedule my booking to July 31 at 10:00',
        action: 'reschedule_my_booking',
        params: { bookingId: E2E234_MANAGE_PAGE_SESSION.bookingId },
        surface: 'customer',
      }),
    ).toBeNull();
  });
});
