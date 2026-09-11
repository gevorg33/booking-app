/**
 * AI-ROADMAP Phase 0 — detector inventory: labelling rules.
 *
 * Phase 8 deletes 785 `is*Prompt` detectors **in bulk by slice** rather than
 * migrating them one at a time. That only works if we know, before deleting a
 * slice, which detectors in it are paraphrase matchers (safe to delete once the
 * planner owns the domain) and which are doing structural work the planner does
 * not replace (slot extraction, confirmation replies, compound splitting,
 * anti-steal guards).
 *
 * This file holds the *pure* half of the inventory: given facts extracted from
 * the AST about one detector, decide what it is and which commands it steers.
 * The AST extraction itself lives in `ai-command-inventory.boundary.spec.ts`
 * (a spec, because `typescript` is a devDependency and must never be imported
 * from shipped code).
 *
 * Nothing here reads the filesystem, so every rule below is unit-testable.
 */

/** Detector triage buckets (AI-ROADMAP §6 Phase 0). */
export type DetectorLabel =
  /** "Does this message mean command X?" — the planner replaces these. Phase 8 deletes them. */
  | 'legacy_paraphrase'
  /** Recognises a slot/value inside the message (a price, a duration, a scope). Kept — this is regex's surviving role (§3, step 3). */
  | 'structural_slot'
  /** Recognises a reply to a pending confirmation or follow-up, not a fresh intent. Kept until Phase 6 owns conversation state. */
  | 'confirm_gate'
  /** Splits or recognises a multi-intent message. Kept until the planner's CommandPlan owns multi-command extraction. */
  | 'compound_connector'
  /** A guard that scopes or blocks another detector rather than choosing a command itself. Kept until its guarded detector retires. */
  | 'routing_shape';

export const DETECTOR_LABELS: readonly DetectorLabel[] = [
  'legacy_paraphrase',
  'structural_slot',
  'confirm_gate',
  'compound_connector',
  'routing_shape',
];

/** How `mapsToActions` was established, so a wrong row can be argued with. */
export type ActionSource =
  /** `isRescheduleBookingPrompt` → `reschedule_booking`, and that is a real registry id. */
  | 'symbol_name'
  /** Registry ids that appear inside a branch this detector guards at a call site. */
  | 'guarded_branch'
  /** The defining file's own `*_INTENTS` list. */
  | 'file_intents'
  /** No evidence ties this detector to a command. */
  | 'none';

/** Everything the AST pass knows about one detector. */
export interface DetectorFacts {
  readonly symbol: string;
  /** Path relative to `src/`. */
  readonly file: string;
  readonly line: number;
  /** Registry ids appearing in branches this detector guards, across all call sites. */
  readonly guardedActions: readonly string[];
  /** Registry ids listed in the defining file's `*_INTENTS` exports. */
  readonly fileIntents: readonly string[];
  /** Names of production functions that call this detector. */
  readonly callers: readonly string[];
  /** Names of `*.spec.ts` functions/blocks that call it. */
  readonly specCallers: readonly string[];
  /** True when some call site uses it to *reject* (`if (isX(p)) return false`, `&& !isX(p)`). */
  readonly blockingUse: boolean;
  /** Reachable from a `tryRescue*` method through the call graph. */
  readonly wiredInRescue: boolean;
  /** This symbol is exported from more than one file; call-site facts cannot be split between them. */
  readonly duplicateSymbol: boolean;
  /** Rows from the defining file's sibling `*.fixtures.ts`, with the action each asserts. */
  readonly fixtures: readonly {
    readonly id: string;
    readonly action: string | null;
  }[];
}

/** One row of `ai-command-inventory.json`. */
export interface DetectorInventoryRow {
  readonly symbol: string;
  readonly file: string;
  readonly line: number;
  readonly label: DetectorLabel;
  /** Why `label` was chosen — the auditable half of the triage. */
  readonly labelReason: string;
  readonly mapsToActions: readonly string[];
  readonly actionSource: ActionSource;
  /** Union of the registry surfaces of `mapsToActions`. */
  readonly surfaces: readonly string[];
  readonly wiredInRescue: boolean;
  /** False when nothing outside its own tests calls it — a free deletion. */
  readonly reachableFromProduction: boolean;
  /** True when a second file exports the same name with a different regex. */
  readonly duplicateSymbol: boolean;
  readonly callers: readonly string[];
  readonly fixtureIds: readonly string[];
}

export interface DetectorInventory {
  readonly generatedBy: string;
  readonly detectorCount: number;
  readonly labelCounts: Readonly<Record<DetectorLabel, number>>;
  readonly actionSourceCounts: Readonly<Record<ActionSource, number>>;
  readonly unreachableFromProduction: number;
  /** Rows whose symbol is exported from a second file too. */
  readonly duplicateSymbols: number;
  readonly detectors: readonly DetectorInventoryRow[];
}

/** `isReschedulePendingBookingPrompt` → `reschedule_pending_booking`. */
export function symbolToActionId(symbol: string): string {
  return symbol
    .replace(/^is/, '')
    .replace(/Prompt$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

const CALLER_EXTRACTS =
  /^(extract|enrich|parse|resolve|apply|collect|derive|inherit|hydrate|normalize|prepare)/;
const CALLER_IS_DETECTOR = /^(is[A-Za-z0-9_]*Prompt|has[A-Z])/;
const CALLER_DECOMPOSES = /^(decompose|tryDecompose)|Compound/;

const SYMBOL_IS_COMPOUND = /Compound/;
const FILE_IS_COMPOUND = /-compound[-.]|compound-recipes|intent-decomposition/;
const SYMBOL_IS_CONFIRM_REPLY =
  /(Affirmative|FollowUp|Continuation|ClarifyReply)/;

/**
 * Which commands this detector steers, and on what evidence.
 *
 * Evidence is ordered by precision, not by convenience. The symbol name is the
 * strongest signal available (539 of 785 detectors are named after a real
 * registry command); guarded branches are next, because they are read from the
 * *specific* `if` this detector controls rather than from the whole enclosing
 * function — attributing every action a 400-line rescue function mentions would
 * make the inventory useless for slicing, which is its only purpose.
 */
export function resolveDetectorActions(
  facts: DetectorFacts,
  isRegistryAction: (id: string) => boolean,
): { actions: string[]; source: ActionSource } {
  const named = symbolToActionId(facts.symbol);
  if (isRegistryAction(named))
    return { actions: [named], source: 'symbol_name' };

  const guarded = [...new Set(facts.guardedActions)]
    .filter(isRegistryAction)
    .sort();
  if (guarded.length) return { actions: guarded, source: 'guarded_branch' };

  // Only when the defining file owns exactly one command. A domain util that
  // lists 54 intents tells us which *slice* the detector lives in, not which
  // command it steers — and `mapsToActions: [54 commands]` would be worse than
  // an honest empty list, because it reads as knowledge we do not have.
  const intents = [...new Set(facts.fileIntents)].filter(isRegistryAction);
  if (intents.length === 1) return { actions: intents, source: 'file_intents' };

  return { actions: [], source: 'none' };
}

/**
 * Triage one detector into a Phase 8 bucket.
 *
 * Precedence matters and is deliberate: a compound splitter that happens to be
 * named after a command is still a compound splitter, and deleting it with the
 * paraphrase slice would silently collapse multi-command messages into single
 * ones — which is already the shape of the worst production failure we have
 * (`compound_intent`, 380 calls, 61.8% failed).
 *
 * The default is `legacy_paraphrase`, which is honest — it is what the large
 * majority genuinely are — but it is a *work-list*, not permission to delete.
 * Phase 8 still requires the planner to pass the domain's eval and a shadow
 * window before any slice is removed.
 */
export function classifyDetector(
  facts: DetectorFacts,
  actions: readonly string[],
): { label: DetectorLabel; labelReason: string } {
  const callerDecomposes = facts.callers.some((c) => CALLER_DECOMPOSES.test(c));
  if (SYMBOL_IS_COMPOUND.test(facts.symbol)) {
    return {
      label: 'compound_connector',
      labelReason: 'symbol names a compound message shape',
    };
  }
  if (FILE_IS_COMPOUND.test(facts.file)) {
    return {
      label: 'compound_connector',
      labelReason: 'defined in a compound/decomposition module',
    };
  }
  if (callerDecomposes) {
    return {
      label: 'compound_connector',
      labelReason: 'consumed by a multi-intent decomposer',
    };
  }
  if (actions.includes('compound_intent')) {
    return {
      label: 'compound_connector',
      labelReason: 'steers the compound_intent command',
    };
  }

  const namedAfterCommand =
    actions.length === 1 && actions[0] === symbolToActionId(facts.symbol);
  if (SYMBOL_IS_CONFIRM_REPLY.test(facts.symbol) && !namedAfterCommand) {
    return {
      label: 'confirm_gate',
      labelReason: 'recognises a reply to a pending confirmation or follow-up',
    };
  }

  const consumers = facts.callers;
  const allExtract =
    consumers.length > 0 && consumers.every((c) => CALLER_EXTRACTS.test(c));
  if (allExtract && !namedAfterCommand) {
    return {
      label: 'structural_slot',
      labelReason: 'only consumed by parameter extraction/enrichment',
    };
  }

  const onlyDetectors =
    consumers.length > 0 && consumers.every((c) => CALLER_IS_DETECTOR.test(c));
  if (facts.blockingUse && !namedAfterCommand) {
    return {
      label: 'routing_shape',
      labelReason: 'used to block or scope another detector',
    };
  }
  if (onlyDetectors && actions.length === 0) {
    return {
      label: 'routing_shape',
      labelReason: 'only consumed by other detectors, steers no command',
    };
  }

  return {
    label: 'legacy_paraphrase',
    labelReason:
      actions.length > 0
        ? `paraphrase matcher for ${actions.join(', ')}`
        : 'paraphrase matcher with no attributable command',
  };
}

export function buildInventoryRow(
  facts: DetectorFacts,
  registrySurfaces: (actionId: string) => readonly string[],
  isRegistryAction: (id: string) => boolean,
): DetectorInventoryRow {
  const { actions, source } = resolveDetectorActions(facts, isRegistryAction);
  const { label, labelReason } = classifyDetector(facts, actions);
  const surfaces = [
    ...new Set(actions.flatMap((a) => [...registrySurfaces(a)])),
  ].sort();
  // A domain's fixture file covers every detector in that domain, so keep only
  // the rows asserting a command this detector actually steers. Rows that name
  // no command stay attached — sibling-file proximity is the only signal there.
  const fixtureIds = facts.fixtures
    .filter((f) => f.action === null || actions.includes(f.action))
    .map((f) => f.id)
    .sort();
  return {
    symbol: facts.symbol,
    file: facts.file,
    line: facts.line,
    label,
    labelReason,
    mapsToActions: actions,
    actionSource: source,
    surfaces,
    wiredInRescue: facts.wiredInRescue,
    reachableFromProduction: facts.callers.length > 0,
    duplicateSymbol: facts.duplicateSymbol,
    callers: [...facts.callers].sort(),
    fixtureIds,
  };
}

export function summarizeInventory(
  rows: readonly DetectorInventoryRow[],
  generatedBy: string,
): DetectorInventory {
  const labelCounts = Object.fromEntries(
    DETECTOR_LABELS.map((l) => [l, rows.filter((r) => r.label === l).length]),
  ) as Record<DetectorLabel, number>;
  const sources: ActionSource[] = [
    'symbol_name',
    'guarded_branch',
    'file_intents',
    'none',
  ];
  const actionSourceCounts = Object.fromEntries(
    sources.map((s) => [s, rows.filter((r) => r.actionSource === s).length]),
  ) as Record<ActionSource, number>;
  return {
    generatedBy,
    detectorCount: rows.length,
    labelCounts,
    actionSourceCounts,
    unreachableFromProduction: rows.filter((r) => !r.reachableFromProduction)
      .length,
    duplicateSymbols: rows.filter((r) => r.duplicateSymbol).length,
    detectors: [...rows].sort(
      (a, b) =>
        a.symbol.localeCompare(b.symbol) || a.file.localeCompare(b.file),
    ),
  };
}
