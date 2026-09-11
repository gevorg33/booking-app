/**
 * e2e-bug.488 — a name resolver that can report *why* it declined.
 *
 * tech-debt D5-b replaced the wrong-namesake mutation with a refusal: when two
 * customers are called "Anna", `resolveCustomerStrict` returns `undefined`
 * rather than whichever row the database handed back first. Correct and safe —
 * but the callees render `undefined` as their existing not-found clarify
 * ("Specify which customer…"), so the guest is told the name is unknown when
 * the truth is that it matched twice. The directly-guarded paths in
 * `ai-booking-core.service.ts` say "which of these two did you mean" via
 * `ambiguityRefusal`; the callback-injected paths could not, because
 * `(list, name) => T | undefined` has nowhere to put the candidates.
 *
 * The third parameter is **optional on purpose**. A two-argument lambda still
 * satisfies this type, so every existing injection site and every callee that
 * does not care about ties keeps compiling untouched — the richer message is
 * opt-in, file by file, instead of one 47-signature refactor that would have to
 * land all at once.
 */
export type AmbiguityCandidate = { id: string; name: string };

export type AmbiguityReport = {
  candidates: AmbiguityCandidate[];
  clarification: string;
};

/** Called instead of returning a match when the name matched more than one row. */
export type OnAmbiguousName = (report: AmbiguityReport) => void;

export type NamedResolver<T> = (
  list: T[],
  name: string,
  onAmbiguous?: OnAmbiguousName,
) => T | undefined;
