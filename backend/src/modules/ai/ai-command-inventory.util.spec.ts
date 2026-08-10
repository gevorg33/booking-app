/**
 * AI-ROADMAP Phase 0 — unit tests for the detector triage rules.
 *
 * The inventory's whole value is that Phase 8 can trust its labels enough to
 * delete a slice of detectors in bulk. These tests pin the rules that decide
 * what survives that deletion, using the real shapes found in the tree.
 */
import {
  buildInventoryRow,
  classifyDetector,
  resolveDetectorActions,
  summarizeInventory,
  symbolToActionId,
  type DetectorFacts,
} from './ai-command-inventory.util.js';

const ACTIONS = new Set([
  'reschedule_booking',
  'create_booking',
  'compound_intent',
  'cancel_all_upcoming_bookings',
  'update_service_prices',
  'check_providers_for_service',
]);
const isAction = (id: string): boolean => ACTIONS.has(id);
const surfacesOf = (id: string): readonly string[] =>
  id === 'reschedule_booking' ? ['dashboard', 'provider'] : ['dashboard'];

function facts(overrides: Partial<DetectorFacts> = {}): DetectorFacts {
  return {
    symbol: 'isSomethingPrompt',
    file: 'modules/ai/ai-something.util.ts',
    line: 1,
    guardedActions: [],
    fileIntents: [],
    callers: [],
    specCallers: [],
    blockingUse: false,
    wiredInRescue: false,
    duplicateSymbol: false,
    fixtures: [],
    ...overrides,
  };
}

describe('symbolToActionId', () => {
  it('maps a detector symbol onto the flat registry name', () => {
    expect(symbolToActionId('isRescheduleBookingPrompt')).toBe(
      'reschedule_booking',
    );
    expect(symbolToActionId('isAddServicesToCartPrompt')).toBe(
      'add_services_to_cart',
    );
  });

  it('keeps acronym runs together', () => {
    expect(symbolToActionId('isExplainPHIAccessPrompt')).toBe(
      'explain_phi_access',
    );
  });
});

describe('resolveDetectorActions', () => {
  it('prefers the symbol name when it is a real command', () => {
    const result = resolveDetectorActions(
      facts({
        symbol: 'isRescheduleBookingPrompt',
        guardedActions: ['create_booking'],
      }),
      isAction,
    );
    expect(result).toEqual({
      actions: ['reschedule_booking'],
      source: 'symbol_name',
    });
  });

  it('falls back to the branch the detector guards', () => {
    const result = resolveDetectorActions(
      facts({
        symbol: 'isMoveMyVisitPrompt',
        guardedActions: ['reschedule_booking'],
      }),
      isAction,
    );
    expect(result).toEqual({
      actions: ['reschedule_booking'],
      source: 'guarded_branch',
    });
  });

  it('ignores string literals that are not registry commands', () => {
    const result = resolveDetectorActions(
      facts({
        symbol: 'isMoveMyVisitPrompt',
        guardedActions: ['not_a_command'],
      }),
      isAction,
    );
    expect(result).toEqual({ actions: [], source: 'none' });
  });

  it('uses the file intent list only when the file owns exactly one command', () => {
    expect(
      resolveDetectorActions(
        facts({ fileIntents: ['create_booking'] }),
        isAction,
      ),
    ).toEqual({ actions: ['create_booking'], source: 'file_intents' });
  });

  it('reports no attribution rather than naming a whole domain', () => {
    // A util that lists every command in its domain says which slice the
    // detector lives in, not which command it steers.
    const result = resolveDetectorActions(
      facts({ fileIntents: ['create_booking', 'reschedule_booking'] }),
      isAction,
    );
    expect(result).toEqual({ actions: [], source: 'none' });
  });
});

describe('classifyDetector', () => {
  it('labels a plain intent matcher legacy_paraphrase', () => {
    const { label } = classifyDetector(
      facts({
        symbol: 'isRescheduleBookingPrompt',
        callers: ['rescueSchedulingIntent'],
      }),
      ['reschedule_booking'],
    );
    expect(label).toBe('legacy_paraphrase');
  });

  it('labels compound splitters compound_connector even when they name a command', () => {
    // Deleting one of these with the paraphrase slice would collapse a
    // multi-command message into a single command — the exact shape of the
    // worst production failure we have (compound_intent, 61.8% failed).
    const { label } = classifyDetector(
      facts({ symbol: 'isCancelAndRebookCompoundPrompt' }),
      ['create_booking'],
    );
    expect(label).toBe('compound_connector');
  });

  it('treats anything defined in a decomposition module as a compound connector', () => {
    const { label } = classifyDetector(
      facts({
        symbol: 'isChairCloseoutPrompt',
        file: 'modules/ai/ai-provider-compound-recipes.util.ts',
      }),
      [],
    );
    expect(label).toBe('compound_connector');
  });

  it('labels a detector that steers compound_intent a compound connector', () => {
    const { label } = classifyDetector(facts({ symbol: 'isTwoThingsPrompt' }), [
      'compound_intent',
    ]);
    expect(label).toBe('compound_connector');
  });

  it('labels a yes-reply recogniser confirm_gate, not a command matcher', () => {
    const { label } = classifyDetector(
      facts({
        symbol: 'isCancelAllUpcomingAffirmativePrompt',
        callers: ['rescueCancelAllUpcomingIntent'],
      }),
      ['cancel_all_upcoming_bookings'],
    );
    expect(label).toBe('confirm_gate');
  });

  it('does not mistake a command whose own name contains "confirm" for a gate', () => {
    const { label } = classifyDetector(
      facts({ symbol: 'isConfirmMyBookingDetailsPrompt' }),
      ['confirm_my_booking_details'],
    );
    expect(label).toBe('legacy_paraphrase');
  });

  it('labels slot detectors structural_slot when only extractors consume them', () => {
    // Regex's surviving role (§3, step 3) — these are kept, not deleted.
    const { label, labelReason } = classifyDetector(
      facts({
        symbol: 'isBudgetPriceRangePrompt',
        callers: ['extractMinPriceFromBudgetPrompt'],
      }),
      [],
    );
    expect(label).toBe('structural_slot');
    expect(labelReason).toContain('extraction');
  });

  it('labels a blocking guard routing_shape', () => {
    const { label } = classifyDetector(
      facts({
        symbol: 'isProviderAvailabilityOpenCheckPrompt',
        callers: ['isAddBookingToCalendarPrompt'],
        blockingUse: true,
      }),
      [],
    );
    expect(label).toBe('routing_shape');
  });

  it('keeps a broadening delegate with its parent instead of calling it a guard', () => {
    // `isMultilingualCheckProvidersPrompt` widens its parent detector rather
    // than scoping it, so it dies with the same slice.
    const { label } = classifyDetector(
      facts({
        symbol: 'isMultilingualCheckProvidersPrompt',
        callers: [
          'isCheckProvidersForServicePrompt',
          'enrichBookingTimeHintsFromPrompt',
        ],
      }),
      ['check_providers_for_service'],
    );
    expect(label).toBe('legacy_paraphrase');
  });

  it('never leaves a detector without a reason', () => {
    const { labelReason } = classifyDetector(facts(), []);
    expect(labelReason).not.toBe('');
  });
});

describe('buildInventoryRow', () => {
  it('derives surfaces from the registry rather than the detector', () => {
    const row = buildInventoryRow(
      facts({ symbol: 'isRescheduleBookingPrompt' }),
      surfacesOf,
      isAction,
    );
    expect(row.surfaces).toEqual(['dashboard', 'provider']);
  });

  it('carries rescue wiring and fixtures through unchanged', () => {
    const row = buildInventoryRow(
      facts({
        symbol: 'isRescheduleBookingPrompt',
        wiredInRescue: true,
        fixtures: [
          { id: 'b', action: null },
          { id: 'a', action: null },
        ],
        callers: ['rescueSchedulingIntent'],
      }),
      surfacesOf,
      isAction,
    );
    expect(row.wiredInRescue).toBe(true);
    expect(row.fixtureIds).toEqual(['a', 'b']);
  });

  it('keeps only the sibling fixtures that assert a command this detector steers', () => {
    // One fixture file covers a whole domain; attaching all of it to every
    // detector in that domain would say nothing about any of them.
    const row = buildInventoryRow(
      facts({
        symbol: 'isRescheduleBookingPrompt',
        fixtures: [
          { id: 'move-my-visit', action: 'reschedule_booking' },
          { id: 'book-me-in', action: 'create_booking' },
          { id: 'unlabelled-row', action: null },
        ],
      }),
      surfacesOf,
      isAction,
    );
    expect(row.fixtureIds).toEqual(['move-my-visit', 'unlabelled-row']);
  });
});

describe('summarizeInventory', () => {
  it('counts every label bucket, including the empty ones', () => {
    const rows = [
      buildInventoryRow(
        facts({ symbol: 'isRescheduleBookingPrompt' }),
        surfacesOf,
        isAction,
      ),
    ];
    const summary = summarizeInventory(rows, 'test');
    expect(summary.detectorCount).toBe(1);
    expect(summary.labelCounts).toEqual({
      legacy_paraphrase: 1,
      structural_slot: 0,
      confirm_gate: 0,
      compound_connector: 0,
      routing_shape: 0,
    });
  });

  it('sorts rows by symbol so regeneration produces a stable diff', () => {
    const rows = ['isZebraPrompt', 'isAlphaPrompt'].map((symbol) =>
      buildInventoryRow(facts({ symbol }), surfacesOf, isAction),
    );
    expect(
      summarizeInventory(rows, 'test').detectors.map((d) => d.symbol),
    ).toEqual(['isAlphaPrompt', 'isZebraPrompt']);
  });
});
