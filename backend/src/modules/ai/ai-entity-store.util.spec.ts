/**
 * AI-ROADMAP Phase 6 / §3.4 tier 2 — the session entity store.
 *
 * Two properties carry the weight. **Recency decides** what "it" means, because
 * that is what the word does. And **a tie is asked about, never picked**, since
 * a wrongly bound reference sends a mutating command at a row the user never
 * named — §47 established many of those writes cannot be undone.
 */
import {
  clearEntityStore,
  createEntityStore,
  isRefStale,
  lookupEntity,
  MAX_ENTITY_REFS,
  pruneEntityStore,
  recordResolution,
  type EntityRef,
  type LookupOptions,
} from './ai-entity-store.util.js';
import { BINDING_MAX_TURNS, BINDING_TTL_MS } from './ai-topic-change.util.js';

const NOW = new Date('2026-08-07T12:00:00Z');

const ref = (over: Partial<EntityRef> = {}): EntityRef => ({
  kind: 'appointment',
  id: 'a1',
  label: 'Tuesday 3pm',
  turnIndex: 1,
  recordedAt: new Date(NOW.getTime() - 1000),
  ...over,
});

const opts = (over: Partial<LookupOptions> = {}): LookupOptions => ({
  now: NOW,
  currentTurn: 2,
  ...over,
});

describe('recordResolution', () => {
  it('keeps the newest first', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ id: 'a1' }));
    store = recordResolution(store, ref({ id: 'a2' }));
    expect(store.refs.map((r) => r.id)).toEqual(['a2', 'a1']);
  });

  it('moves a re-resolved entity to the front instead of duplicating it', () => {
    // Two copies of one appointment would make a later lookup look ambiguous
    // when it is not.
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ id: 'a1', turnIndex: 1 }));
    store = recordResolution(store, ref({ id: 'a2', turnIndex: 1 }));
    store = recordResolution(store, ref({ id: 'a1', turnIndex: 2 }));
    expect(store.refs.map((r) => r.id)).toEqual(['a1', 'a2']);
    expect(store.refs).toHaveLength(2);
  });

  it('treats the same id of a different kind as a different entity', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ kind: 'service', id: 'x' }));
    store = recordResolution(store, ref({ kind: 'employee', id: 'x' }));
    expect(store.refs).toHaveLength(2);
  });

  it('bounds the store', () => {
    // A long tail adds candidates that make lookups ambiguous without making
    // them more useful.
    let store = createEntityStore('cv_1');
    for (let i = 0; i < MAX_ENTITY_REFS + 5; i += 1) {
      store = recordResolution(store, ref({ id: `a${i}` }));
    }
    expect(store.refs).toHaveLength(MAX_ENTITY_REFS);
  });

  it('does not mutate the store it was given', () => {
    const store = createEntityStore('cv_1');
    recordResolution(store, ref());
    expect(store.refs).toEqual([]);
  });

  it('keeps the conversation id', () => {
    // Scoping is a property of the store, not of each call, so a caller cannot
    // consult it for the wrong conversation by forgetting an argument.
    expect(
      recordResolution(createEntityStore('cv_1'), ref()).conversationId,
    ).toBe('cv_1');
  });
});

describe('lookupEntity', () => {
  it('resolves to the most recent reference', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ id: 'a1', turnIndex: 1 }));
    store = recordResolution(store, ref({ id: 'a2', turnIndex: 2 }));
    const found = lookupEntity(store, opts({ currentTurn: 2 }));
    expect(found.status).toBe('resolved');
    expect(found.ref?.id).toBe('a2');
  });

  it('does not tie an older reference against a newer one', () => {
    // "it" means the thing just mentioned. An earlier ref is not a rival.
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ id: 'a1', turnIndex: 1 }));
    store = recordResolution(store, ref({ id: 'a2', turnIndex: 2 }));
    expect(lookupEntity(store, opts({ currentTurn: 2 })).status).toBe(
      'resolved',
    );
  });

  it('asks when two entities were resolved on the same turn', () => {
    // "book a massage and a facial" then "make it 4pm" — "it" genuinely could
    // be either, and §7 working agreement 5 says ask.
    let store = createEntityStore('cv_1');
    store = recordResolution(
      store,
      ref({ kind: 'service', id: 's1', turnIndex: 2 }),
    );
    store = recordResolution(
      store,
      ref({ kind: 'service', id: 's2', turnIndex: 2 }),
    );
    const found = lookupEntity(store, opts({ currentTurn: 2 }));
    expect(found.status).toBe('ambiguous');
    expect(found.ref).toBeNull();
    expect(found.candidates.map((c) => c.id).sort()).toEqual(['s1', 's2']);
  });

  it('filters by kind', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(
      store,
      ref({ kind: 'service', id: 's1', turnIndex: 2 }),
    );
    store = recordResolution(
      store,
      ref({ kind: 'employee', id: 'e1', turnIndex: 2 }),
    );
    const found = lookupEntity(
      store,
      opts({ currentTurn: 2, kind: 'service' }),
    );
    expect(found.status).toBe('resolved');
    expect(found.ref?.id).toBe('s1');
  });

  it('finds nothing in an empty store', () => {
    expect(lookupEntity(createEntityStore('cv_1'), opts()).status).toBe(
      'not_found',
    );
  });

  it('finds nothing when every reference has gone stale', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(
      store,
      ref({ recordedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000) }),
    );
    expect(lookupEntity(store, opts()).status).toBe('not_found');
  });
});

describe('staleness reuses §48 rather than redefining it', () => {
  it('expires a reference older than the binding window', () => {
    expect(
      isRefStale(
        ref({ recordedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1) }),
        opts({ currentTurn: 1 }),
      ),
    ).toBe(true);
  });

  it('keeps a reference inside the window', () => {
    expect(
      isRefStale(
        ref({ recordedAt: new Date(NOW.getTime() - BINDING_TTL_MS + 1000) }),
        opts({ currentTurn: 1 }),
      ),
    ).toBe(false);
  });

  it('expires a reference left behind by too many turns', () => {
    expect(
      isRefStale(
        ref({ turnIndex: 1 }),
        opts({ currentTurn: 1 + BINDING_MAX_TURNS + 1 }),
      ),
    ).toBe(true);
  });

  it('uses the same window §48 uses for pending bindings', () => {
    // One definition of "still the same conversation". Two that can disagree is
    // the duplication §46 was written about.
    const justInside = ref({
      recordedAt: new Date(NOW.getTime() - BINDING_TTL_MS + 1),
      turnIndex: 2,
    });
    expect(isRefStale(justInside, opts({ currentTurn: 2 }))).toBe(false);
  });
});

describe('pruneEntityStore', () => {
  it('drops only what has aged out', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref({ id: 'fresh', turnIndex: 2 }));
    store = recordResolution(
      store,
      ref({
        id: 'old',
        turnIndex: 2,
        recordedAt: new Date(NOW.getTime() - BINDING_TTL_MS - 1000),
      }),
    );
    const pruned = pruneEntityStore(store, opts({ currentTurn: 2 }));
    expect(pruned.refs.map((r) => r.id)).toEqual(['fresh']);
  });

  it('keeps the conversation id', () => {
    expect(
      pruneEntityStore(createEntityStore('cv_1'), opts()).conversationId,
    ).toBe('cv_1');
  });
});

describe('clearEntityStore', () => {
  it('drops everything when §48 says the subject changed', () => {
    let store = createEntityStore('cv_1');
    store = recordResolution(store, ref());
    expect(clearEntityStore(store).refs).toEqual([]);
  });

  it('returns a store rather than null, so refs cannot be carried forward', () => {
    // A caller treating "cleared" as "unchanged" would keep the stale refs,
    // which is the failure the clear exists to prevent.
    const cleared = clearEntityStore(createEntityStore('cv_1'));
    expect(cleared).toEqual({ conversationId: 'cv_1', refs: [] });
  });
});
