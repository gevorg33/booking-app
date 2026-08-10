/**
 * AI-ROADMAP Phase 8 — which detectors are safe to delete, and which are not.
 *
 * Phase 8 runs in six slices, and each one is gated: "planner passes that
 * domain's eval → shadow-compare 7 days → bulk-delete the slice's
 * `legacy_paraphrase` detectors". The shadow compare is time; the eval pass is
 * measurable; and *which detectors belong to a slice* was not answerable until
 * §66 finished the port, because a detector's domain is its command's domain and
 * only 16 of 696 commands had one.
 *
 * This computes the readiness half. It answers, per domain: how many
 * `legacy_paraphrase` detectors are there, and how many could go today?
 *
 * ## What makes a detector retirement-ready
 *
 * A detector exists to route a phrasing to a command. Deleting it is safe when
 * the planner can do that instead, which needs three things to be true of every
 * command the detector maps to:
 *
 * 1. **a spec exists** — otherwise the planner has never heard of the command;
 * 2. **the spec has examples** — the shortlist is descriptions plus examples, and
 *    §29 measured that a command with no examples is one the planner routes to
 *    by description alone;
 * 3. **the command clears the accuracy bar** — §42's `PROPOSE_ONLY_ACCURACY_BAR`.
 *    A command the planner gets wrong is one the detector is still carrying.
 *
 * A detector mapping to several commands needs all of them ready: deleting it
 * removes the route for every one.
 *
 * ## What this deliberately does not do
 *
 * It does not delete anything, and it does not claim a domain is *safe* to
 * retire — only that it has cleared the measurable precondition. The 7-day
 * shadow compare is the other half and no static analysis substitutes for it.
 */
import { PROPOSE_ONLY_ACCURACY_BAR } from './ai-propose-only.util.js';
import type { CommandSpec } from './ai-command-spec.types.js';

/** One row of `ai-command-inventory.json`. */
export interface InventoryDetector {
  symbol: string;
  file: string;
  label: string;
  mapsToActions: string[];
  reachableFromProduction: boolean;
  wiredInRescue: boolean;
}

/** Per-intent accuracy, as the §25 baseline records it. */
export interface IntentAccuracy {
  passed: number;
  total: number;
}

export type BlockReason =
  /** No spec maps to this action — the planner cannot route it at all. */
  | 'no_spec'
  /** The spec exists but offers the planner no example phrasings. */
  | 'no_examples'
  /** The command is below §42's accuracy bar. */
  | 'below_accuracy_bar'
  /** The eval corpus has no cases for it, so accuracy is unknown. */
  | 'not_evaluated'
  /** The detector maps to nothing, so nothing can be checked. */
  | 'maps_to_nothing';

export interface DetectorReadiness {
  symbol: string;
  domain: string;
  ready: boolean;
  /** Empty when ready. One entry per action that is not ready. */
  blockedBy: { action: string; reason: BlockReason }[];
}

export interface RetirementOptions {
  accuracyBar?: number;
}

function specFor(
  specs: readonly CommandSpec[],
  action: string,
): CommandSpec | undefined {
  return specs.find((s) => s.id === action || s.aliases.includes(action));
}

/**
 * Assess one detector.
 *
 * `not_evaluated` is a *block*, not a pass. An action with no eval cases has
 * unknown accuracy, and deleting its detector on the strength of "nothing has
 * failed" would be reading absence of evidence as evidence.
 */
export function assessDetector(
  detector: InventoryDetector,
  specs: readonly CommandSpec[],
  accuracy: Readonly<Record<string, IntentAccuracy>>,
  options: RetirementOptions = {},
): DetectorReadiness {
  const bar = options.accuracyBar ?? PROPOSE_ONLY_ACCURACY_BAR;
  const blockedBy: { action: string; reason: BlockReason }[] = [];

  if (detector.mapsToActions.length === 0) {
    return {
      symbol: detector.symbol,
      domain: 'unknown',
      ready: false,
      blockedBy: [{ action: '(none)', reason: 'maps_to_nothing' }],
    };
  }

  let domain = 'unknown';
  for (const action of detector.mapsToActions) {
    const spec = specFor(specs, action);
    if (!spec) {
      blockedBy.push({ action, reason: 'no_spec' });
      continue;
    }
    if (domain === 'unknown') domain = spec.domain;

    if (spec.examples.length === 0) {
      blockedBy.push({ action, reason: 'no_examples' });
      continue;
    }
    const stat = accuracy[action];
    if (!stat || stat.total === 0) {
      blockedBy.push({ action, reason: 'not_evaluated' });
      continue;
    }
    if ((stat.passed / stat.total) * 100 < bar) {
      blockedBy.push({ action, reason: 'below_accuracy_bar' });
    }
  }

  return {
    symbol: detector.symbol,
    domain,
    ready: blockedBy.length === 0,
    blockedBy,
  };
}

export interface DomainRetirementReport {
  domain: string;
  total: number;
  ready: number;
  /** Blocking reasons across the domain, most common first. */
  blockers: { reason: BlockReason; count: number }[];
  /** True when every `legacy_paraphrase` detector in the domain can go. */
  sliceReady: boolean;
}

export interface RetirementReport {
  totalDetectors: number;
  readyDetectors: number;
  byDomain: DomainRetirementReport[];
  /** Domains where the whole slice has cleared the measurable precondition. */
  sliceReadyDomains: string[];
}

/**
 * Assess every `legacy_paraphrase` detector and group by domain.
 *
 * Only `legacy_paraphrase` — Phase 8 retires paraphrase matchers, not the
 * structural extractors, confirm gates or compound connectors, which do work the
 * planner does not replace.
 */
export function buildRetirementReport(
  detectors: readonly InventoryDetector[],
  specs: readonly CommandSpec[],
  accuracy: Readonly<Record<string, IntentAccuracy>>,
  options: RetirementOptions = {},
): RetirementReport {
  const paraphrase = detectors.filter((d) => d.label === 'legacy_paraphrase');
  const assessed = paraphrase.map((d) =>
    assessDetector(d, specs, accuracy, options),
  );

  const byDomain = new Map<string, DetectorReadiness[]>();
  for (const a of assessed) {
    const bucket = byDomain.get(a.domain) ?? [];
    bucket.push(a);
    byDomain.set(a.domain, bucket);
  }

  const domains: DomainRetirementReport[] = [...byDomain.entries()]
    .map(([domain, rows]) => {
      const counts = new Map<BlockReason, number>();
      for (const r of rows) {
        for (const b of r.blockedBy) {
          counts.set(b.reason, (counts.get(b.reason) ?? 0) + 1);
        }
      }
      const ready = rows.filter((r) => r.ready).length;
      return {
        domain,
        total: rows.length,
        ready,
        blockers: [...counts.entries()]
          .map(([reason, count]) => ({ reason, count }))
          .sort(
            (a, b) => b.count - a.count || a.reason.localeCompare(b.reason),
          ),
        sliceReady: ready === rows.length,
      };
    })
    .sort((a, b) => b.total - a.total || a.domain.localeCompare(b.domain));

  return {
    totalDetectors: paraphrase.length,
    readyDetectors: assessed.filter((a) => a.ready).length,
    byDomain: domains,
    sliceReadyDomains: domains.filter((d) => d.sliceReady).map((d) => d.domain),
  };
}
