import {
  extractEntityRefsFromResult,
  recordEntityRefsFromResult,
} from './ai-entity-ref-recorder.util.js';
import { createEntityStore, lookupEntity } from './ai-entity-store.util.js';

/**
 * e2e-bug.373 — the entity store is written from what a turn reported.
 */
describe('extractEntityRefsFromResult (e2e-bug.373)', () => {
  const NOW = new Date('2026-09-11T10:00:00Z');

  it('records every id the result reports, with its label', () => {
    const refs = extractEntityRefsFromResult(
      {
        success: true,
        details: {
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          employeeId: 'emp-1',
          employeeName: 'Anna',
          bookingId: 'book-1',
        },
      },
      3,
      NOW,
    );
    expect(refs.map((r) => [r.kind, r.id, r.label])).toEqual([
      ['service', 'svc-1', 'Haircut'],
      ['employee', 'emp-1', 'Anna'],
      ['appointment', 'book-1', 'Haircut'],
    ]);
    expect(refs.every((r) => r.turnIndex === 3)).toBe(true);
  });

  it('records nothing from a failed result', () => {
    // A clarify naming three candidate customers resolved nothing the user
    // acted on. Recording any of them would be the confidently-wrong binding
    // §231 was written about.
    expect(
      extractEntityRefsFromResult(
        {
          success: false,
          details: { customerId: 'cust-1', candidates: [] },
        },
        1,
      ),
    ).toEqual([]);
  });

  it('records nothing from a name without an id', () => {
    // The store exists so "it" can be acted on without re-resolving. A label
    // alone puts resolution back on the read path.
    expect(
      extractEntityRefsFromResult(
        { success: true, details: { serviceName: 'Haircut' } },
        1,
      ),
    ).toEqual([]);
  });

  it('falls back to the id as label when no name was reported', () => {
    const [ref] = extractEntityRefsFromResult(
      { success: true, details: { packageId: 'pkg-9' } },
      1,
    );
    expect(ref).toMatchObject({ kind: 'package', id: 'pkg-9', label: 'pkg-9' });
  });

  it('understands the nested employee shape the dashboard handlers report', () => {
    const refs = extractEntityRefsFromResult(
      { success: true, details: { employee: { id: 'emp-2', name: 'Maria' } } },
      1,
    );
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({ kind: 'employee', id: 'emp-2', label: 'Maria' });
  });

  it('does not record the same entity twice from one result', () => {
    const refs = extractEntityRefsFromResult(
      {
        success: true,
        details: {
          employeeId: 'emp-2',
          employeeName: 'Maria',
          employee: { id: 'emp-2', name: 'Maria' },
        },
      },
      1,
    );
    expect(refs).toHaveLength(1);
  });

  it('ignores ids that are not strings', () => {
    expect(
      extractEntityRefsFromResult(
        { success: true, details: { serviceId: 42, employeeId: null } },
        1,
      ),
    ).toEqual([]);
  });
});

describe('recordEntityRefsFromResult (e2e-bug.373)', () => {
  it('makes a later turn able to look "it" up', () => {
    // The end-to-end property the whole chain (401 → 373 → 370) is for.
    const store = recordEntityRefsFromResult(
      createEntityStore('conv-1'),
      { success: true, details: { serviceId: 'svc-1', serviceName: 'Haircut' } },
      1,
      new Date('2026-09-11T10:00:00Z'),
    );
    const lookup = lookupEntity(store, {
      now: new Date('2026-09-11T10:01:00Z'),
      currentTurn: 2,
      kind: 'service',
    });
    expect(lookup.status).toBe('resolved');
    expect(lookup.ref?.id).toBe('svc-1');
  });

  it('a newer resolution of the same entity moves to the front, not duplicates', () => {
    let store = createEntityStore('conv-1');
    store = recordEntityRefsFromResult(
      store,
      { success: true, details: { serviceId: 'svc-1', serviceName: 'Haircut' } },
      1,
    );
    store = recordEntityRefsFromResult(
      store,
      { success: true, details: { serviceId: 'svc-1', serviceName: 'Haircut' } },
      2,
    );
    expect(store.refs).toHaveLength(1);
    expect(store.refs[0].turnIndex).toBe(2);
  });

  it('leaves the store untouched when the turn reported nothing', () => {
    const before = recordEntityRefsFromResult(
      createEntityStore('conv-1'),
      { success: true, details: { serviceId: 'svc-1' } },
      1,
    );
    const after = recordEntityRefsFromResult(
      before,
      { success: true, details: { message: 'ok' } },
      2,
    );
    expect(after.refs).toEqual(before.refs);
  });
});
