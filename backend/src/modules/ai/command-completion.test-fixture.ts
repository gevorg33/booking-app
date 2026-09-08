import type {
  ResolvedCommand,
  ResolvedEntities,
} from './command-completion.types.js';

/**
 * Build a complete `ResolvedCommand` for tests.
 *
 * F1 / e2e-bug.359 — this exists because per-property patching does not
 * converge. Three passes over the spec type errors each fixed a real pattern
 * and each simply exposed the next complaint about the *same* object literal:
 *
 *   `entities: {}` missing employees/services   (TS2739, 97 sites)
 *     → a stale `confidence` field              (TS2353, 98 sites)
 *       → the literal not matching the parameter (TS2345, 92 sites — missing
 *         `businessId`)
 *
 * The aggregate moved 1,431 → 1,424 across all three. The literals are not
 * slightly wrong; they are **assembled by hand against a type that has grown**,
 * so each pass repairs one field and leaves the next one to be discovered.
 *
 * A builder ends that: a fixture is *constructed* as a `ResolvedCommand` rather
 * than asserted to be one, so adding a required field to the type breaks this
 * file once instead of every spec that ever built the shape by hand.
 *
 * Defaults are chosen to be inert. `validateCommand` reads `params`, `entities`
 * and `enrichedParams`; it never reads `businessId`, so the placeholder there
 * cannot change a verdict. Mirrors the production builder
 * `buildAmbiguityValidationCommand` in `ai-ambiguity-corpus.util.ts`.
 */
export const EMPTY_RESOLVED_ENTITIES: ResolvedEntities = {
  employees: [],
  services: [],
};

export function makeResolvedCommand(
  partial: Partial<ResolvedCommand> & Pick<ResolvedCommand, 'action'>,
): ResolvedCommand {
  return {
    action: partial.action,
    params: partial.params ?? {},
    reasoning: partial.reasoning ?? 'test',
    prompt: partial.prompt ?? '',
    businessId: partial.businessId ?? 'test-business',
    entities: partial.entities ?? { ...EMPTY_RESOLVED_ENTITIES },
    enrichedParams: partial.enrichedParams ?? {},
  };
}
