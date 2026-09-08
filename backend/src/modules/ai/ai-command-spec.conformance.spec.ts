/**
 * AI-ROADMAP Phase 1 — spec ⟷ registry conformance.
 *
 * The migration to CommandSpec cannot be a flag day: 696 commands cannot move
 * at once. So specs are introduced alongside the live registry, and this suite
 * asserts the two never disagree about anything the runtime already relies on
 * (which surfaces a command is legal on, which service handles it, whether it
 * mutates).
 *
 * That makes the migration checkable command-by-command: port a command to a
 * spec, and if the spec is wrong about the surface list, CI says so immediately
 * instead of the command quietly becoming unreachable — which is exactly how
 * e2e-bug.342 happened.
 *
 * When a domain is fully ported and the registry rows are generated FROM the
 * specs, these tests become tautological and should be deleted.
 */
import type { AccessTier } from './access-control.matrix.js';
import { isIntentAllowed } from './ai-capability.matrix.js';
import { COMMAND_SPECS } from './ai-command-spec.registry.js';
import { isMutatingSpec } from './ai-command-spec.types.js';
import { COMMAND_REGISTRY } from './ai-command-registry.js';

const ALL_TIERS: readonly AccessTier[] = [
  'client',
  'staff',
  'manager',
  'owner',
];

/**
 * What the platform *actually* permits today, end to end.
 *
 * Two live gates, not one: `isIntentAllowed` (per surface and tier, consulted by
 * every surface service) and `AiGatewayService.executeCommandPipeline`'s blanket
 * refusal of `client` on the dashboard. A spec that reproduced only the first
 * would claim clients may run dashboard commands, which is untrue of the
 * running system.
 */
function effectiveTiers(surface: string, legacyAction: string): AccessTier[] {
  return ALL_TIERS.filter((tier) => {
    if (surface === 'dashboard' && tier === 'client') return false;
    return isIntentAllowed(surface as never, tier, legacyAction);
  });
}

describe('AI-ROADMAP Phase 1 — CommandSpec conformance with the live registry', () => {
  const byId = new Map(COMMAND_REGISTRY.map((e) => [e.id, e]));

  /** Specs are keyed to the registry through their legacy alias. */
  const pairs = COMMAND_SPECS.map((spec) => {
    const legacyId = spec.aliases[0];
    return { spec, legacyId, entry: legacyId ? byId.get(legacyId) : undefined };
  });

  it('every pilot spec maps to a real registry action via its alias', () => {
    const unmapped = pairs
      .filter((p) => !p.entry)
      .map((p) => `${p.spec.id} -> ${p.legacyId ?? '(no alias)'}`);
    expect(unmapped).toEqual([]);
  });

  it.each(pairs.map((p) => [p.spec.id, p] as const))(
    '%s declares the same surfaces as the registry',
    (_id, { spec, entry }) => {
      expect([...spec.surfaces].sort()).toEqual(
        [...(entry?.surfaces ?? [])].sort(),
      );
    },
  );

  it.each(pairs.map((p) => [p.spec.id, p] as const))(
    '%s routes to the same handler as the registry',
    (_id, { spec, entry }) => {
      expect(spec.handler).toBe(entry?.handler);
    },
  );

  it.each(pairs.map((p) => [p.spec.id, p] as const))(
    '%s agrees with the registry on whether it mutates',
    (_id, { spec, entry }) => {
      expect(isMutatingSpec(spec)).toBe(entry?.mutating);
    },
  );

  it.each(pairs.map((p) => [p.spec.id, p] as const))(
    '%s permits exactly the tiers the running system permits',
    (_id, { spec, legacyId }) => {
      const declared = Object.fromEntries(
        spec.surfaces.map((s) => [s, [...(spec.tiers[s] ?? [])].sort()]),
      );
      const live = Object.fromEntries(
        spec.surfaces.map((s) => [s, effectiveTiers(s, legacyId).sort()]),
      );
      expect(declared).toEqual(live);
    },
  );

  it('declares tiers for every surface it claims, and no others', () => {
    const mismatched = COMMAND_SPECS.filter(
      (spec) =>
        Object.keys(spec.tiers).sort().join() !==
        [...spec.surfaces].sort().join(),
    ).map((s) => s.id);
    // A surface with no tier entry would be permanently unreachable through the
    // planner, since `isSpecAllowedForTier` denies on absent data.
    expect(mismatched).toEqual([]);
  });

  /**
   * The direction nothing was checking — tech-debt C1 / e2e-bug.379.
   *
   * Every assertion above runs spec → registry. Nothing ran registry → spec,
   * and §125's "all 696 registry entries resolve to a spec; none is orphaned"
   * was a one-time measurement, not a gate.
   *
   * It had already stopped being true. At 705 entries, **nine had no spec** —
   * and they were §149's nine. That fix added the registry rows the pipeline
   * was discarding answers for, and stopped there.
   *
   * A registry entry with no spec is not cosmetic. The planner's entire
   * catalogue is `COMMAND_SPECS`, so such a command is unroutable by the layer
   * Phase 8 replaces detectors with, and invisible to every spec-derived gate:
   * risk tier, confirmation model, shortlist, retirement criterion.
   *
   * No exception list, deliberately. The nine are specced, so the honest
   * baseline is zero and anything else is a regression to fix rather than a
   * ratchet to record.
   */
  it('every registry entry has a spec — the direction §125 only measured', () => {
    const specced = new Set(COMMAND_SPECS.flatMap((s) => [s.id, ...s.aliases]));
    const orphaned = COMMAND_REGISTRY.filter((e) => !specced.has(e.id)).map(
      (e) => e.id,
    );
    expect(orphaned).toEqual([]);
  });

  it('no two pilot specs claim the same legacy action', () => {
    const legacy = pairs.map((p) => p.legacyId);
    expect(legacy.length).toBe(new Set(legacy).size);
  });

  /**
   * §241 — the same rule for `examples`, which had none.
   *
   * `commandMatchText` is `description + examples`, so two commands on one
   * surface sharing an example string enter the planner's shortlist with
   * matching retrieval text and must be separated on description alone. The
   * examples also seed the few-shots and the eval goldens, so a shared string is
   * contradictory training signal for whichever command loses.
   *
   * Cross-surface sharing is fine and common — "show my profile" means
   * `customer.my_profile` to a customer and `provider.show_profile` to a
   * provider, and the shortlist is surface-filtered before the planner sees it
   * (7 of the 10 registry-wide collisions are this shape). Only a collision
   * *within* one surface is a defect.
   */
  it('no two specs sharing a surface document the same example', () => {
    const KNOWN: ReadonlyArray<readonly [string, string]> = [
      // Near-duplicate commands, not typos — each group needs a registry
      // decision about which command is canonical (e2e-bug.518), and inventing
      // distinguishing examples here would paper over that.
      ['customer', 'turn on notifications'],
      ['dashboard', 'what are the ai settings'],
      // A real defect with a ready fix, held only by credentials.
      // `onboarding.apply_playbook` [T3] documents `clinic.apply_playbook`'s
      // [T3] example; `ai-onboarding.fixtures.ts` says outright this string is
      // NOT the onboarding command. The one-line fix is to replace it with the
      // fixture's own trigger, 'apply our vertical playbook' — but any edit to a
      // spec's description or examples changes `commandMatchText` and so
      // invalidates the committed embedding cache, and
      // `npm run build:ai-embeddings` needs OPENAI_API_KEY (e2e-bug.390's gate,
      // §82's seven-point lesson). Applied and reverted here rather than left
      // failing the chain. Whoever holds the key: make the swap, run the
      // rebuild, drop this entry. See e2e-bug.518.
      ['dashboard', 'apply the clinic playbook'],
    ];
    const seen = new Map<string, string[]>();
    for (const spec of COMMAND_SPECS)
      for (const surface of spec.surfaces)
        for (const example of spec.examples) {
          const key = `${surface}\u0000${example.trim().toLowerCase()}`;
          if (!seen.has(key)) seen.set(key, []);
          if (!seen.get(key)!.includes(spec.id)) seen.get(key)!.push(spec.id);
        }
    const collisions = [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => {
        const [surface, example] = key.split('\u0000');
        return `${surface}: "${example}" -> ${ids.sort().join(', ')}`;
      })
      .filter(
        (line) =>
          !KNOWN.some(([surface, example]) =>
            line.startsWith(`${surface}: "${example}" ->`),
          ),
      );
    expect(collisions.sort()).toEqual([]);
  });

  /**
   * §242 — the same rule for `description`, the other half of
   * `commandMatchText` and the field the type calls "what disambiguates
   * commands". Two specs on one surface with the *same* description give the
   * planner nothing to choose on.
   *
   * Clean at zero when written: 3 identical descriptions exist registry-wide and
   * all 3 are cross-surface pairs of the same operation (`cancel_package_visit`
   * / `_self`, `reschedule_package_visit` / `_self`, `give_ai_feedback` on
   * provider vs customer). Those are correct — the shortlist is surface-filtered
   * before the planner sees it — which is why this matches on surface rather
   * than registry-wide, exactly as the examples rule does.
   *
   * Exact match only, deliberately. The near-duplicates are real
   * ("Turn notifications on." vs "Turn on push notifications for this device.",
   * e2e-bug.518) but catching them needs a similarity threshold, and a rule that
   * fires on judgement gets switched off (§190). Exact collisions are
   * unarguable; the near ones are tracked as a ticket instead.
   */
  it('no two specs sharing a surface document the same description', () => {
    const seen = new Map<string, string[]>();
    for (const spec of COMMAND_SPECS)
      for (const surface of spec.surfaces) {
        const key = `${surface}\u0000${spec.description
          .trim()
          .toLowerCase()
          .replace(/\.$/, '')}`;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(spec.id);
      }
    const collisions = [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => {
        const [surface, description] = key.split('\u0000');
        return `${surface}: "${description}" -> ${ids.sort().join(', ')}`;
      });
    expect(collisions.sort()).toEqual([]);
  });

  it('each named example-collision exemption still collides', () => {
    // An exemption that no longer applies is worse than no exemption: it hides
    // the next collision on that exact surface and string. Same reason §215's
    // T0 exemptions are checked for continued relevance.
    const KNOWN: ReadonlyArray<readonly [string, string]> = [
      ['customer', 'turn on notifications'],
      ['dashboard', 'what are the ai settings'],
      ['dashboard', 'apply the clinic playbook'],
    ];
    for (const [surface, example] of KNOWN) {
      const owners = COMMAND_SPECS.filter(
        (s) =>
          s.surfaces.includes(surface as (typeof s.surfaces)[number]) &&
          s.examples.some((e) => e.trim().toLowerCase() === example),
      ).map((s) => s.id);
      expect({ surface, example, count: owners.length }).toEqual({
        surface,
        example,
        count: owners.length > 1 ? owners.length : 'MORE THAN ONE',
      });
    }
  });

  describe('compensation (AI-ROADMAP Phase 5)', () => {
    const mutating = COMMAND_SPECS.filter(isMutatingSpec);

    it('every mutating command declares how it is undone', () => {
      // An ABSENT compensation and a DECLARED-IMPOSSIBLE one are identical at
      // runtime and opposite in review: the first is an oversight, the second is
      // a decision someone made. Requiring the field forces the decision.
      const undeclared = mutating
        .filter((s) => !s.compensation)
        .map((s) => s.id)
        .sort();
      expect(undeclared).toEqual([]);
    });

    it('reads declare no compensation, having nothing to undo', () => {
      const readsWithCompensation = COMMAND_SPECS.filter(
        (s) => !isMutatingSpec(s) && s.compensation,
      ).map((s) => s.id);
      expect(readsWithCompensation).toEqual([]);
    });

    it('every inverse names a command that exists', () => {
      // A compensation pointing at a missing command is a rollback that will
      // throw at exactly the moment it is needed most.
      const ids = new Set(COMMAND_SPECS.flatMap((s) => [s.id, ...s.aliases]));
      const dangling = mutating
        .filter(
          (s) =>
            s.compensation?.kind === 'inverse' &&
            !ids.has(s.compensation.command),
        )
        .map(
          (s) =>
            `${s.id} -> ${(s.compensation as { command: string }).command}`,
        )
        .sort();
      expect(dangling).toEqual([]);
    });

    it('every inverse is itself a mutating command', () => {
      // A read cannot undo a write. Cheap, but it is the class of error that
      // slipped through while writing these: `catalog.create_category` was
      // first declared as compensated by `catalog.deactivate_service`, which
      // exists, is mutating, and retires an unrelated *service*.
      //
      // Note the limit of what conformance can check: that a compensating
      // command *semantically* undoes the original is not verifiable from the
      // spec alone, and needs the handler integration (e2e-bug.368).
      const byId = new Map(COMMAND_SPECS.map((s) => [s.id, s]));
      const nonMutating = mutating
        .filter((s) => {
          if (s.compensation?.kind !== 'inverse') return false;
          const target = byId.get(s.compensation.command);
          return target ? !isMutatingSpec(target) : false;
        })
        .map((s) => s.id);
      expect(nonMutating).toEqual([]);
    });

    it('every inverse captures at least one variable', () => {
      // A compensating command with nothing captured cannot target the row it
      // is meant to undo.
      const empty = mutating
        .filter(
          (s) =>
            s.compensation?.kind === 'inverse' &&
            s.compensation.captures.length === 0,
        )
        .map((s) => s.id);
      expect(empty).toEqual([]);
    });

    it('every irreversible command explains why', () => {
      const unexplained = mutating
        .filter(
          (s) =>
            (s.compensation?.kind === 'none' ||
              s.compensation?.kind === 'manual') &&
            s.compensation.reason.length < 20,
        )
        .map((s) => s.id);
      expect(unexplained).toEqual([]);
    });

    it('money is never declared reversible', () => {
      // A refund is a new financial event, not an undo, and letting a saga issue
      // one to tidy up a failed plan is the outcome this model exists to prevent.
      //
      // Scoped to the `payment` domain rather than to T2 as a whole. The rule was
      // written as `risk === 'T2'` when payment commands were the only T2s in the
      // registry; §58's customer slice showed that reads as "money" only by
      // coincidence. T2 is defined as money **or PII**, and restoring a phone
      // number to its previous value is a genuine undo — refusing it would lose
      // real rollback capability for no safety gain. The stricter capture rule
      // below covers the PII case instead.
      const reversibleMoney = COMMAND_SPECS.filter(
        (s) =>
          s.risk === 'T2' &&
          s.domain === 'payment' &&
          s.compensation?.kind === 'inverse',
      ).map((s) => s.id);
      expect(reversibleMoney).toEqual([]);
    });

    it('a T2 command that restores values captures the values it will restore', () => {
      // What replaces the blanket T2 ban. A T2 inverse that overwrites fields
      // while capturing nothing resembling prior state would "restore" whatever
      // the compensating command defaults to — on a PII field, overwriting real
      // data with a blank under the name of a rollback.
      //
      // Scoped to inverses that point at the SAME command, which is the shape
      // that restores values. An inverse naming a DIFFERENT command is a
      // distinct operation — `record_expense` is undone by `delete_expense`,
      // which needs the created id and nothing else, because there was no prior
      // state to put back. §60 hit this with create→delete pairs where the
      // delete did not exist; §64 hit it where it does, which is what showed the
      // rule was matching on the wrong property.
      const restoresValues = COMMAND_SPECS.filter(
        (s) =>
          s.risk === 'T2' &&
          s.compensation?.kind === 'inverse' &&
          s.compensation.command === s.id,
      );
      const withoutPriorState = restoresValues
        .filter(
          (s) =>
            s.compensation?.kind === 'inverse' &&
            !s.compensation.captures.some((c) =>
              /^(previous|original)/i.test(c),
            ),
        )
        .map((s) => s.id);
      expect(restoresValues.length).toBeGreaterThan(3);
      expect(withoutPriorState).toEqual([]);
    });

    it('a T2 inverse naming another command captures something to target', () => {
      // The other half. `delete_expense` still needs to know WHICH expense.
      const withoutTarget = COMMAND_SPECS.filter(
        (s) =>
          s.risk === 'T2' &&
          s.compensation?.kind === 'inverse' &&
          s.compensation.command !== s.id &&
          s.compensation.captures.length === 0,
      ).map((s) => s.id);
      expect(withoutTarget).toEqual([]);
    });
  });

  it('reports pilot coverage', () => {
    console.log(
      `[AI-ROADMAP spec pilot] ${COMMAND_SPECS.length} commands specced ` +
        `of ${COMMAND_REGISTRY.length} registry entries total`,
    );
    expect(COMMAND_SPECS.length).toBeGreaterThan(0);
  });
});
