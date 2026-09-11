import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * e2e-bug.483 — every booking row must be created by a guarded path.
 *
 * There is no constraint under `bookings`: no `UNIQUE`, no `EXCLUDE`, no
 * trigger across the 56 migrations, only indexes. Overlap is prevented entirely
 * by `BookingService.create`, which is correct — one transaction,
 * `claimSlotsInWindowForUpdate` taking `SELECT … FOR UPDATE` over the window's
 * micro-slots ordered by `(startTime, id)` for deadlock avoidance, then a
 * second `FOR UPDATE` over overlapping non-cancelled bookings.
 *
 * The decision (2026-09-10) was to keep enforcement in the application rather
 * than add a database backstop, because neither backstop is cheap here: the
 * capacity that decides legality lives on the **slot** row
 * (`appointmentCount < maxAppointmentCount`), not on the booking, so it is not
 * expressible as a constraint over `bookings` at all. A trigger would put
 * capacity policy in PL/pgSQL alongside the TypeScript, and a denormalised
 * capacity column would carry a stale value whenever a slot's capacity is
 * edited.
 *
 * That decision has a condition attached, and this is it: **the guarantee
 * holds only while every writer routes through the guarded path.** A future
 * admin action, import script or backfill that inserts a `Booking` directly
 * gets no protection and fails silently rather than loudly — the failure mode
 * being a double-booked customer, discovered by the customer.
 *
 * So the creation sites are enumerated rather than trusted. This is a ratchet:
 * adding a booking-creation path is allowed, but it has to be a deliberate act
 * that updates this list, which is the moment to ask whether the new path takes
 * the same locks.
 */
const SRC = path.join(__dirname, '..', '..');

/**
 * Every way a `Booking` row gets constructed. `.save(booking)` on an entity
 * loaded from the database is an UPDATE and is deliberately not matched — the
 * race this guards is creation.
 */
const CREATION_PATTERNS = [
  /\bmanager\.create\(\s*Booking\b/,
  /\b(?:bookingRepo|bookingsRepo|bookingRepository)\.create\(/,
  /\bnew Booking\(/,
  /\.insert\(\s*Booking\b/,
];

const ALLOWED_CREATORS: ReadonlyArray<{ file: string; why: string }> = [
  {
    file: 'modules/booking/booking.service.ts',
    why: 'The guarded path: transaction + ordered slot FOR UPDATE + overlap FOR UPDATE.',
  },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('e2e-bug.483 — booking creation is confined to guarded paths', () => {
  const files = walk(SRC);

  const creators = files.filter((file) => {
    const src = fs.readFileSync(file, 'utf8');
    return CREATION_PATTERNS.some((pattern) => pattern.test(src));
  });

  it('scanned a plausible tree', () => {
    // Guards every assertion below against passing because the walk found
    // nothing — a moved directory would otherwise make this suite vacuous.
    expect(files.length).toBeGreaterThan(500);
  });

  it('finds the guarded path itself', () => {
    // And against the patterns silently ceasing to match anything, which would
    // make an empty result look like compliance.
    expect(
      creators.some((f) => f.endsWith('modules/booking/booking.service.ts')),
    ).toBe(true);
  });

  it('creates bookings only in files on the allowlist', () => {
    const allowed = new Set(ALLOWED_CREATORS.map((row) => row.file));
    const unexpected = creators
      .map((f) => path.relative(SRC, f).split(path.sep).join('/'))
      .filter((rel) => !allowed.has(rel));

    // A new entry here is not necessarily wrong — but it must take the same
    // locks as `BookingService.create`, and saying so out loud is the point.
    expect(unexpected).toEqual([]);
  });

  it('every allowed creator says why it is allowed', () => {
    for (const row of ALLOWED_CREATORS) {
      expect(row.why.trim().length).toBeGreaterThan(40);
    }
  });

  it('has no allowlist entry that no longer creates bookings', () => {
    // e2e-bug.539 — the direction this list was missing.
    //
    // As first written (§232) this suite only checked creators ⊆ allowlist, so
    // deleting a creator left its entry behind and the gate stayed green while
    // documenting a path that no longer exists. That is the same one-way slack
    // as e2e-bug.360's `<= 9` ceiling, and the known-failures gate refuses it
    // explicitly ("a manifest entry that has disappeared → delete the entry").
    //
    // It matters here beyond tidiness: an entry naming a file as an accepted
    // booking creator is a licence. `SchedulingEngineService.createBooking` was
    // deleted precisely because being listed made a divergent creator look
    // sanctioned.
    const actual = new Set(
      creators.map((f) => path.relative(SRC, f).split(path.sep).join('/')),
    );
    const stale = ALLOWED_CREATORS.map((row) => row.file).filter(
      (file) => !actual.has(file),
    );
    expect(stale).toEqual([]);
  });
});
