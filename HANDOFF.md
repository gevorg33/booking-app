# Handoff — AI command work

*Sections §216–§235 in `TODO.md` are this session's; see §2.*

Written for whoever picks this up next. Branch `ai-roadmap-implementation`, last commit
`f265eeb5 ai corrections in progress`.

---

## 1. Read this first: nothing is committed, and another session is editing the same files

**Nothing from this session has been committed.** 120 paths are dirty (106 modified, 12 untracked including this
file, 1 deleted, 1 renamed). All of it is working-tree only. If you need a clean baseline, diff against
`f265eeb5` — but see the warning below before assuming the diff is one person's work.

**A second Claude session was writing to this repo concurrently on 2026-08-18/19.** This is not
speculation; it collided three times:

- **Ticket ids** `476`, `477`, `482` were each taken by both sessions within minutes, because both
  computed `max + 1` against a copy of `TODO.BUGS.MD` the other was already extending. Resolved by
  moving this session's duplicates to **`483`, `484`, `485`**. A hazard note sits at the top of the
  index in `TODO.BUGS.MD`. **If you allocate a new id, re-read the file immediately before writing
  the row** — a number chosen at the start of a slice is stale by the time you append.
- **`§` section numbers in `TODO.md` are still colliding and this is unresolved.** §197–§209 are
  used by *two interleaved series*. Mine are the C2/T0 slices; theirs are routing/gates/i18n work
  (`§198 "who offers X?"`, `§201 import cycle`, `§205 known-failures gate`, `§207–§208 Armenian
  inflection`). **Do not renumber either series unilaterally** — mine are cited by ~270 spec
  comments, theirs by their own code. Mine are at least tagged `§NNN (C2/T0)` in every comment.
  This needs a human decision.

The other session's lane has been **routing, cue matching, i18n, test infrastructure and CI gates**.
Mine has been **the command registry / declared-inputs work and date-time correctness**. Staying out
of each other's files is what kept this workable; `e2e-bug.444` and `e2e-bug.450` are routing tickets
I deliberately left alone for that reason.

## 2. What this session did

**C2 is closed on all three tiers.** The declared-inputs campaign (`e2e-bug.418`) finished:

| tier | start | end | rule |
|---|---|---|---|
| T2/T3 | 134 | 0 | §177 |
| T1 | 163 | 0 | §178 |
| **T0** | **367** | **0** | **§215** |

Final T0 shape: **369 commands, 271 declared, 98 exempt (26.6%)**. The exempt floor is real, not
laziness — §190 predicted a high floor and forbade treating zero as the target, because driving
those 98 to a declaration means inventing inputs (`e2e-bug.399`). The ceiling was converted to a
per-command named rule in §215, and **the rule was verified to fail** when an exemption is removed
(52/54, not a silent pass).

Corpus accuracy did not move by a single case across all 15 T0 slices — expected, since
`spec.variables` has no runtime consumer, and it is the evidence that the campaign documented
existing behaviour rather than changing it.

**Everything after C2 is recorded as `### §NNN` sections in `TODO.md`, §216–§235.** They are not
restated here — a list duplicated from `TODO.md` is stale within a slice, and this file is for what
`TODO.md` does *not* say. Read them there; the headings are self-describing. In summary:

| theme | sections | outcome |
|---|---|---|
| date/time correctness | §217–§219 | a missing quarter branch, a window that disagreed with itself by a day, a normaliser that fabricated `25:30` |
| credentials | §222 | **API keys were being persisted in command traces**; PHI redaction ran but knew nothing about secrets |
| registry integrity | §220, §224, §229 | `handler` diffed against all 41 dispatch maps; orchestration flags pinned |
| D5 silent-pick (`e2e-bug.362` family) | §225–§228, §230–§235 | **closed on writing paths** — every site that acts on a resolved provider, customer or template now refuses a tie instead of picking one |
| my own errors, corrected | §216, §229, §230 | a false finding, a stale rule rationale, a deferral that was too cautious |

**The D5 result worth carrying forward:** four separate items were labelled *blocked by return
shape*, and the label was wrong the same way each time — **it describes the helper, while the
refusal belongs to the caller**. §225, §228, §234 and §235 each closed one. If you meet that label
again, check what the *caller* returns before believing it.

## 3. How to verify the tree

Run these from `backend/`. Clear the cache first — a stale jest cache has produced both false reds
and a false green in this repo (`e2e-bug.474`, corrected in §195 and again in §201).

```bash
npx jest --clearCache
npx tsc --noEmit -p tsconfig.build.json     # expect 0 — this is the config that gates startup
npm run test:ai-roadmap-gates               # expect ~4,165 passing, 0 failing
node scripts/ai-accuracy-gate.mjs           # expect 99.99%, delta +0% (case total rises
                                            # as the other session adds cases — 8468 and counting)
```

The single corpus failure is the long-standing `e2e137-professional-profile` case and is expected.

**Run `npm run build:ai-inventory` after editing any file that hosts detectors** — the inventory is
line-number sensitive, so an insert anywhere in `ai-*.util.ts`/`ai-command-spec.*.ts` makes
`ai-command-inventory.boundary.spec` red for pure line drift. That failure means "regenerate", not
"you broke something".

Do **not** typecheck with `tsconfig.json` and read the count: it reports ~1,434 errors, essentially
all in `.spec.ts` files the build excludes. `tsconfig.build.json` is the honest signal (§197 — three
real build errors hid behind a filtered typecheck for an entire session).

## 4. Working discipline that actually earned its keep

Not process for its own sake — each of these caught a real error this session.

- **Measure before fixing; the ticket is a hypothesis.** Three tickets had wrong or stale premises
  (`467`, `469`, `484`). Two were already fixed. One was inert.
- **A clean result can mean absent coverage rather than correctness.** §221 is the case: the
  "obvious fix" passed 537 tests and the full corpus, and was still wrong — nothing exercised the
  path. Ask what *would* have failed.
- **Never filter a tool's warnings.** §212: I piped a tracer through `grep "reads:"` for a tidy
  table and threw away the `!! NAME COLLISION` lines that were the whole point. Same shape as §197's
  filtered typecheck.
- **Every tooling defect found here under-reported reads. None over-reported.** A shortcut that
  fails in this codebase fails toward "takes nothing" — the answer that silently drops work.
- **Check the call site, not just the callee.** `resolveDateRange(params, …)` and
  `resolveDateRange({ _timeZone }, …)` are the same function with opposite answers (§204 vs §212).
- **Follow the chain until it terminates.** §200: a context resolver with no `params.` reference at
  all delegated to one that read four fields.
- **Pin tests against a fake clock.** §217: I nearly shipped assertions that would have started
  failing on 1 October — the `clinic-task-auto.util` failure mode from `e2e-bug.471`.
- **Prove a new rule can fail.** A ceiling at 0 and a rule that always passes look identical from
  outside (§215, §220, §221 all include a deliberate-break check).
- **A negative control that only *partly* bites is itself a finding.** Three times (§225, §227,
  §231) the control exposed a test passing for a reason unrelated to the fix — an empty mock, a
  mismatched call signature, a weekday in a prompt string that filtered the fixture out. The control
  did more work than the assertions.
- **"Blocked by return shape" describes the helper, not the fix.** Four items carried that label and
  all four were guardable at the caller (§225, §228, §234, §235). Check what the caller returns.
- **When someone else fixes a problem you pinned, re-read the pin.** §229: the rule still described
  the pre-fix world, and could not have detected a regression of the fix that replaced it.

A recursive params tracer lived at `scratchpad/trace.py`. **It is gone with the session** and it was
never trustworthy alone — it encodes the four failure classes above but cannot resolve name
collisions (`resolveSessionCustomerId` has 55 definitions) or bindings aliased out of `params`. It
announced what it could not resolve; that was the useful part. Rebuild it only if a similar campaign
starts, and read its warnings.

## 5. One correction I owe the record

**`e2e-bug.484` (originally filed as 476) was my own false finding.** I claimed `catalog.locations`
was read by the dashboard adapter and written by nothing, making `e2e-bug.460`'s disambiguation
inert. It is written — `executeCommand` loads the roster, `BusinessCatalog` has declared
`locations?` all along, and the branch-scope path preserves it through a spread.

The mistake: I grepped `catalog: {`, found five hits, and read them as producers. All five were
*parameter type declarations*. I never grepped `const catalog = {`, the one line that answers "who
writes this". There was a real defect underneath — those five parameter types omitted `locations`,
so it survived only by structural pass-through and was invisible to the compiler — and that is fixed
(§216), but the ticket as filed was wrong and is closed as such.

## 6. What is open

**Actionable, no decision needed:**

- `e2e-bug.499` — the known-failures manifest, **120 remaining**. The other session's lane; they
  have been working it since 2026-08-21. Coordinate before touching.
- `e2e-bug.467` — the `dateRange` two-shape cleanup. Measured **inert** in §217 (the shapes never
  meet); tidying, not urgency.
- `e2e-bug.473` — committed test debris. Low. `backend/src/modules/ai/eval/zz-state.spec.ts` is the
  user's own untracked scratch file — **leave it alone**.
- **D5's genuine remainder** is now only `resolveEmployees`' own signature (`(list, name) => T |
  undefined`, 7 of its 31 callers are callback injections). §231 measured that only **seven** of the
  31 write, and §231–§235 guarded all seven at their call sites, so the signature change buys
  tidiness rather than safety.

**Blocked on a human, not on effort** — deliberately not guessed at:

- `e2e-bug.475` — should a tour checkout require prepayment when the service says
  `prepaymentMode: NONE`? The two readings need opposite fixes and one changes what customers are
  charged.
- `e2e-bug.483` — double-booking has **no database-level constraint**. The application guarantee is
  correct and verified; the textbook `EXCLUDE USING gist` does **not** fit, because
  `maxAppointmentCount` is configurable (group classes legally overlap) and multi-service visits
  deliberately overlap. Options costed in the ticket.
- `e2e-bug.493`, `e2e-bug.501`, `e2e-bug.504` — the other session's, each needing a product or
  semantic answer.
- **The `§` numbering collision** in §1 above. It has since recurred: `e2e-bug.502` cites their
  §221/§222, and mine exist too. Their dates now run to 2026-08-29, ahead of this session's.

## 7. Constraints carried through this session

- `git stash@{0}` ("WIP on sprint-2") is **the user's** — never pop, drop, or apply it. It is still
  intact; I used `git stash push -- <file>` twice for baseline comparisons and popped each
  immediately, verifying `stash@{0}` afterwards.
- `backend/src/modules/ai/eval/zz-state.spec.ts` is the user's scratch file. Untouched.
- Issues found in passing get a numbered ticket in **both** `TODO.md` and `TODO.BUGS.MD` — that is a
  standing instruction from the user, not a convention I invented.
