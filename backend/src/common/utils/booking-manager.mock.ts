/**
 * Test double for `bookingRepo.manager` — e2e-bug.471.
 *
 * Deliberately lives in its own dependency-free module. It started life inside
 * `public-booking-test.harness.ts`, and importing it from a notifications spec
 * dragged `PublicBookingService`'s entire module graph into that worker, which
 * broke an unrelated date-format suite that passed in isolation. A shared test
 * utility must not carry a service graph with it.
 */
/**
 * A `bookingRepo.manager` that can mint a manage token — e2e-bug.471.
 *
 * `ensureBookingManageToken` (api-bug.6 / e2e-bug.120) does its work *inside*
 * `manager.transaction`, reading the row under a pessimistic lock and saving it
 * back. A generic stub returns null from `getOne()` and the util throws
 * "Booking not found", so the manager has to read the spec's own store —
 * faking a row would make the test assert nothing about token minting.
 *
 * Takes callbacks rather than a fixed store, because the specs that need this
 * keep their bookings differently: two in an array, one in a Map.
 */
export function createBookingManagerMock(store: {
  /** May return a promise — some specs delegate straight to their repo mock. */
  find: (
    id?: string,
  ) =>
    | Record<string, unknown>
    | null
    | undefined
    | Promise<Record<string, unknown> | null | undefined>;
  save: (booking: Record<string, unknown>) => unknown;
}) {
  return {
    transaction: jest.fn(
      async (run: (manager: Record<string, unknown>) => Promise<unknown>) =>
        run({
          createQueryBuilder: () => {
            let wanted: string | undefined;
            const qb: Record<string, unknown> = {
              setLock: () => qb,
              where: (_clause: string, params?: { bookingId?: string }) => {
                wanted = params?.bookingId;
                return qb;
              },
              getOne: async () => store.find(wanted),
            };
            return qb;
          },
          save: jest.fn(
            async (_entity: unknown, booking: Record<string, unknown>) =>
              store.save(booking),
          ),
        }),
    ),
  };
}
