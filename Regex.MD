# Regex.MD — From regex command detection → reliable classifier

**Goal (two tracks):**

1. **Classifier track** — Natural-language **intent/action** is decided by the confidence-gated classify pipeline (LLM + semantic anchors + self-verify), not by `is*Prompt` / rescue regex. Regex stays only for **deterministic text processing** (IDs, dates, tokens, cleanup).
2. **Safety track** — You cannot guarantee zero misclassifications forever with NL + LLMs. You **can** drive **wrong silent executions → ≈ 0**: wrong/uncertain understand → clarify, refuse, or confirm — never write the wrong mutation. Accurate outcome = `(correct intent × params × exec) OR honest clarify / safe refusal`.

**End state:**

- Every **command-detection** regex is either (a) **deleted**, or (b) **reclassified as structural** (slots / connectors / confirm / credentials) and no longer chooses `action`. No user-visible intent depends on regex reachability.
- Mutating paths always pass ambiguity / confirm / resolution / self-verify / blast-radius / post-exec checks (§8). Wrong-execution rate &lt; 1% rolling, money/PII paths ≪ 1% via confirm + verify + rollback.

**How (not a single PR):** Inventory → classify each detector → strengthen classifier → **replace all** paraphrase detectors in domain waves → wire safety layers → CI forbids regressions. Do not delete a detector until its replacement is proven green.

**Related:** [`TODO.md`](./TODO.md) (`acc-2`–`acc-6`, `pipe-1`, `acc-3.4`), [`.cursor/rules/ai-accuracy-program.mdc`](./.cursor/rules/ai-accuracy-program.mdc), [`.cursor/rules/ai-command-pipeline.mdc`](./.cursor/rules/ai-command-pipeline.mdc), [`docs/FAST_INTENT_HEURISTICS_BOUNDARY.md`](./docs/FAST_INTENT_HEURISTICS_BOUNDARY.md).

---

## 1. Current state (honest)

| Layer | Role today | Regex for intent? |
|-------|------------|-------------------|
| `normalize` | Locale / cache prep | No (cleanup) |
| `fast_heuristics` | Routing + structural hints | **Fenced** — paraphrase forbidden (`acc-3.14`) |
| LLM `classify_intent` | Primary action + params (`responseFormat: json_object`) | No |
| `confidence_gate` → semantic + re-rank | Low-confidence paraphrase via **anchors** | No |
| `AiIntentRescueService` + domain `is*Prompt` | Post-classify override / steal prevention | **Yes — primary control plane for many bugs** |
| Structural enrich | Dates, times, IDs, manage tokens | Yes — **allowed** |

**Inventory snapshot (2026-08-01, `backend/src/modules/ai`):**

| Signal | Count |
|--------|------:|
| `export function is*Prompt` | **~780** |
| Files defining them | **~308** |
| `rescue*` / `tryRescue*` call sites / helpers | large (orchestrated mainly via `ai-intent-rescue.service.ts`) |

**Largest detector files (migrate as waves first):**

| File | Approx. `is*Prompt` count |
|------|--------------------------:|
| `ai-customer-crm.util.ts` | 29 |
| `ai-payments.util.ts` | 26 |
| `ai-retail-finance.util.ts` | 23 |
| `ai-push-notifications.util.ts` | 23 |
| `ai-gift-fulfillment.util.ts` | 23 |
| `ai-catalog.util.ts` | 21 |
| `ai-self-service-booking.util.ts` | 20 |
| `ai-business-compliance.util.ts` | 20 |
| `ai-provider-compound-recipes.util.ts` | 18 |
| `ai-schedule-resources.util.ts` | 17 |
| `ai-integrations.util.ts` | 17 |
| (+ ~297 other files) | … |

**Problem:** Architecture says classify-first; ops reality is rescue-regex-first. That does not scale (order fights, locale gaps, flaky live when rescue misses).

---

## 2. Target architecture

```
normalize
  → fast_heuristics          # routing / structural only — no intent meaning
  → LLM classify             # primary action (shortlist + few-shots)
  → confidence gate
  → semantic match + re-rank # anchors / embeddings for paraphrase
  → optional narrow re-classify
  → rescue                   # structural + confirm + security ONLY
  → self-verify              # "action+params satisfy prompt?" else clarify
  → structural enrich        # regex OK: slots only, not action
  → validate → execute → telemetry
```

**Meaning of “reliable classifier” here:**

1. Correct **action** from classify (+ semantic), measured on eval + traces.
2. Wrong action rate on mutating intents &lt; 1% (prefer clarify / confirm) — see **§8 Safety track**.
3. Paraphrase / typo / locale covered by **anchors + few-shots + nightly LLM eval**, not synonym regex.
4. Regex never the sole authority to auto-execute a **mutation**.
5. When unsure: **honest clarify / refuse** beats a confident wrong write.

---

## 3. Regex policy (hard rules)

### ✅ Keep / prefer regex (structural — may remain forever)

- Extract IDs, UUIDs, manage-link `bookingId`/`token`, gift/promo code shapes (`GCM-…`, etc.)
- Parse timestamps / relative dates into ISO (structural extractors)
- Validate emails, phones
- Strip markdown / code fences from model text if needed
- Detect placeholders `{{variable}}`
- Compound **connectors** only (`and then`, `;`) — not clause meaning
- Confirm tokens (`yes` / `confirm` / locale equivalents) when **pending** session context exists

### ❌ Replace completely (command detection)

- Detect user intent / paraphrase (“whats the deal if i cancel”)
- Decide which tool / registry **action** to call
- Override LLM action because a synonym matched
- Domain “steal guards” that rewrite action via keyword lists
- Compound **meaning** classifiers (which steps) beyond connector split + golden recipes backed by classify

### Enforcement

| Gate | What it blocks |
|------|----------------|
| `test:pipe-fast-heuristics-boundary` | Paraphrase in `fast-intent-heuristics.*` (exists) |
| **New:** `test:pipe-rescue-regex-boundary` | New paraphrase `is*Prompt` / rescue action rewrite without allowlist |
| **New:** `test:pipe-regex-inventory` | Inventory JSON must list every `is*Prompt`; untagged = fail |
| **Final:** zero `legacy_paraphrase` left in inventory | Program complete |

---

## 4. What replaces regex for commands

| Capability | Mechanism | Where |
|------------|-----------|--------|
| Primary intent | LLM classify + schema rules | per-surface schemas / command services |
| Paraphrase | Intent **anchors** (generic phrases, no entity names) | `intent-anchor.bank.ts`, `AiSemanticIntentService` |
| Disambiguation | Top‑K shortlist (~10–15) before classify | `acc-3.3` |
| Few-shots | Retrieve similar labeled eval cases | `acc-3.1` |
| Business shorthand | Entity / phrasing memory | `acc-3.2`, `acc-3.13` |
| Safety when unsure | Self-verify + clarify chips | `acc-3.4`–`3.6`, `acc-4` |
| Residual flaky LLM | Nightly N-trial eval (`requiresLlm`, `minPassRate`) | `eval/ai-command-eval.*` |
| Slot fill only | Structural regex / parsers | `ai-structural-extractors.ts`, enrich |

---

## 5. Replace-all program (inventory → delete)

This section is the plan to **retire every current hardcoded command-detection regex**, not only freeze new ones.

### 5.1 Detector taxonomy (every `is*Prompt` gets one label)

| Label | Meaning | Fate |
|-------|---------|------|
| `legacy_paraphrase` | Chooses or strongly implies **action** from NL synonyms | **Must replace** → then delete |
| `structural_slot` | Extracts ID/date/code/email/token; does not set action alone | **Keep** (optionally move under `ai-structural-extractors*`) |
| `confirm_gate` | Affirm/deny with pending context | **Keep** (narrow) |
| `compound_connector` | Split markers only | **Keep** |
| `routing_shape` | read_only / list-vs-book shape for re-rank hints, no final action | **Keep** only if already fenced like fast-heuristics; else migrate |
| `unknown` | Not yet reviewed | **Illegal after Phase R0** — CI fails |

### 5.2 Phase R0 — Full inventory machine (blocking)

Produce a committed artifact (suggested path):

`backend/src/modules/ai/regex-command-inventory.json` (or `.ts` const)

Each row:

```ts
{
  id: 'payments.isPayOnlinePrompt',           // stable id
  symbol: 'isPayOnlinePrompt',
  file: 'ai-payments.util.ts',
  kind: 'legacy_paraphrase' | 'structural_slot' | …,
  mapsToActions: ['pay_online'],             // empty if structural
  surfaces: ['public', 'customer'],
  wiredInRescue: true,
  fixtureIds: ['…'],                         // existing tests that depend on it
  replacement: null | { type: 'anchor'|'few_shot'|'schema'|'structural_move', refs: string[] },
  status: 'open' | 'shadow' | 'disabled' | 'removed' | 'kept_structural',
  wave: 'W1' | 'W2' | …,
}
```

Tasks:

- [ ] **R0.1** Script: `rg` / AST scan all `export function is*Prompt` (+ inline `/\b…\b/` action steals in rescue if feasible).
- [ ] **R0.2** Human/agent pass: label every row (`unknown` → 0).
- [ ] **R0.3** CI `test:pipe-regex-inventory`: count(symbols in repo) == count(inventory); no `unknown`.
- [ ] **R0.4** Split progress counters: `legacy_paraphrase open` vs `removed` vs `kept_structural`.

**Exit:** Inventory complete; dashboard or report shows **N paraphrase to kill**.

---

### 5.3 Phase R1 — Per-detector replacement factory (repeat until N = 0)

For **each** `legacy_paraphrase` row (batch by wave / file):

| Step | Work |
|------|------|
| 1. Harvest | Collect every fixture prompt + eval case that currently needs this detector; add missing EN/HY/RU/translit paraphrases (≥5 where core intent). |
| 2. Anchors | Add generic anchors (no entity names) to phrasing / intent bank. |
| 3. Schema | Ensure classifier rule text covers the intent on **each** surface that exposes it. |
| 4. Few-shots | If still weak, add labeled eval rows for retrieval (`acc-3.1`). |
| 5. Shadow | Run rescue path but **do not apply** override when classify+semantic already agree; log would-have-rescued (`shadow` status). |
| 6. Prove | Eval + unit `it.each` pass with detector **disabled** (feature flag or early `return false`). Nightly LLM N-trial for flaky prompts. |
| 7. Disable | `status: disabled` — rescue no longer calls it; keep function body temporarily for bisect. |
| 8. Remove | Delete symbol + dead imports; `status: removed`; inventory + CI update. |
| 9. Guard | If mutating intent: confirm gate / self-verify still mandatory. |

**Shadow gate (required before disable):** for 7+ days or ≥K live traces (pick after Phase A), `wouldRescue !== finalAction` rate below threshold **or** all disagreements are clarify-safe.

**Anti-pattern:** adding a new regex to unblock deletion of an old one.

---

### 5.4 Domain waves (replace **all** files, ordered)

Waves cover the full ~308 files. Size is “ship 1–2 waves / sprint” after Phase B muscle exists. Adjust order using override-rate from traces once A.2 lands; default order by detector count + steal severity:

| Wave | Domain / files (seed list) | Surfaces |
|------|----------------------------|----------|
| **W1** | Payments & checkout — `ai-payments.util.ts`, `ai-pay-online-checkout.util.ts`, `ai-cash-payment-checkout.util.ts`, `ai-stripe-*`, gift-card payment hints | all 4 |
| **W2** | Self-service cancel/reschedule/manage — `ai-self-service-booking.util.ts`, manage-token utils, cancel-and-rebook | customer, public |
| **W3** | Customer CRM / appointments / loyalty / privacy — `ai-customer-crm.util.ts`, privacy, referral/rewards | customer, public |
| **W4** | Catalog & pricing — `ai-catalog.util.ts`, budget/discovery, service rank, compare services | dashboard, public, customer |
| **W5** | Gift fulfillment & promo — `ai-gift-fulfillment.util.ts`, create promo, track shipment | dashboard, customer, public |
| **W6** | Push / notifications / date-format explainers — `ai-push-notifications.util.ts`, notification settings | all |
| **W7** | Retail finance / compliance / tax — `ai-retail-finance.util.ts`, `ai-business-compliance.util.ts`, tax utils | dashboard |
| **W8** | Schedule resources / ops / staff — `ai-schedule-resources.util.ts`, scheduling, staff-ops, revenue | dashboard |
| **W9** | Integrations / onboarding / marketing growth | dashboard |
| **W10** | Provider mobile — booking, compounds, client context, clinic tasks, handoff, visit status, exp-2/3 | provider |
| **W11** | Clinic / lab / tour vertical detectors | clinic/tour surfaces |
| **W12** | Remainder — every leftover `legacy_paraphrase` in inventory (long tail &lt;6 detectors/file) | as tagged |
| **W13** | Rescue orchestrator cleanup — delete dead branches in `ai-intent-rescue.service.ts`; only structural/confirm/security remain | all |

**Wave DoD (each):**

- [ ] All wave rows `shadow` → `disabled` → `removed` (or `kept_structural` with action-write removed)
- [ ] `test:sprint14` + domain `test:ai-*` green
- [ ] No live override dependency on removed symbols (trace)
- [ ] Inventory counters updated; wave checkbox in this file `[x]`

---

### 5.5 Structural keep-list (explicit exceptions — not “command detection”)

These may remain **after** replace-all, but must not set `action` by themselves:

- Manage-link URL credential extract → may *upgrade* to token actions only when credentials present (document as structural upgrade, not paraphrase)
- Code-shape extractors (`GCM-`, `GCB-`, UUID, email)
- Date/time/number word parsers in structural enrich
- `COMPOUND_PROMPT_MARKERS` / split helpers
- Pending confirm lexicons bound to `sessionContext`
- Security / PHI preflight patterns (not intent catalog)

Anything that maps free NL → registry action without the above → **wave delete**.

---

### 5.6 Kill criteria (program complete)

- [ ] Inventory: `legacy_paraphrase` with `status: open|shadow|disabled` = **0**
- [ ] `rg 'export function is\w+Prompt'` either gone or every hit labeled `kept_structural|confirm_gate|compound_connector|routing_shape`
- [ ] Rescue cannot change `action` except structural upgrade / confirm / security
- [ ] CI: `test:pipe-regex-inventory` + rescue boundary + fast-heuristics boundary green
- [ ] Metrics: rescue override rate ≈ structural-only baseline; wrong-exec &lt; 1%
- [ ] This file Section 8 DoD all checked

---

## 6. Supporting phases (classifier muscle — do before / during early waves)

### Phase 0 — Policy freeze (1–2 days)

- [ ] Link this file from `TODO.md`.
- [ ] **Freeze:** no new `legacy_paraphrase` detectors (P0 exception requires inventory row + wave assignment + expiry).
- [ ] Start R0 inventory (can parallelize).

**Exit:** Freeze + inventory kickoff.

### Phase A — Measure (`acc-1`, `acc-2`)

- [ ] **A.1** `ai_command_trace` with action, confidence, source.
- [ ] **A.2** `rescuedFrom` / `rescuedTo` / detector id when override applies.
- [ ] **A.3** CI accuracy floor (`test:ai-accuracy` / `test:sprint14`).
- [ ] **A.4** Nightly LLM N-trial eval for `requiresLlm`.
- [ ] **A.5** Scorecard: override rate, precision/recall, inventory burn-down.

**Exit:** Burn-down chart possible; wave order validated by data.

### Phase B — Classifier path (`acc-3`, `pipe-1`)

- [ ] **B.1** Dynamic shortlist (`acc-3.3`)
- [ ] **B.2** Few-shot retrieval (`acc-3.1`)
- [ ] **B.3** Anchor coverage (`acc-3.16`)
- [ ] **B.4** Self-verify (`acc-3.4`–`3.6`)
- [ ] **B.5** Mutating disagreement → escalate / confirm — **never silent regex win** (`acc-3.5`)
- [ ] **B.6** Normalization (`acc-3.7`)
- [ ] **B.7** Rescue + inventory CI gates

**Exit:** Safe to run W1+ shadow/disable without accuracy collapse.

### Phase C — Execute waves W1–W13

- [ ] Follow §5.3 factory per row; mark wave tables in §5.4.
- [ ] Prefer file-complete PRs (one util file’s paraphrase set) over random symbols.

### Phase D — Thin rescue shell

Rescue may keep only §5.5 + security. Delete temporary flags and dead code.

### Phase E — Learning loop (`acc-6`; **acc-3.8` reinterpreted**)

- [ ] Misses → eval + anchor / few-shot / prompt — **not** new paraphrase regex.
- [ ] Accuracy ratchet; clarify over guess (`acc-4`).

---

## 7. Surface parity (mandatory)

| Surface | Schema / service |
|---------|------------------|
| Dashboard | `INTENT_SCHEMA` / `AiCommandService` |
| Provider | `PROVIDER_INTENT_SCHEMA` / `ProviderAiCommandService` |
| Customer | `buildCustomerClassifierSchema()` / `CustomerAiCommandService` |
| Public | `buildPublicClassifierSchema()` / `PublicBookingAssistantService` |

Every wave row lists `surfaces[]`; replacement incomplete if a surface still needs the regex.

---

## 8. Safety track — as close to zero wrong *executions* as physics allows

### 8.1 What we refuse to promise

- **Zero wrong classifications forever** — impossible with open-ended NL + model drift + new slang/locales.
- **Zero wrong *suggested* reads forever** — low rate is achievable; metaphysical zero is not.

### 8.2 What we do promise (program property)

**Wrong silent mutation ≈ 0:** if understand is wrong, low-confidence, or conflicting, the system **clarifies, refuses, or confirms** — it does not commit the wrong write. A good clarify counts as an accurate outcome.

Regex.MD classifier waves reduce *steals*; this section is the **execution safety net** when steals or LLM misses still happen (`acc-4`, `acc-5`, `acc-6`).

### 8.3 Mandatory layers (ship / complete these)

| Layer | Rule | Maps to | Status intent |
|-------|------|---------|---------------|
| **Ambiguity** | Top‑2 intent chips / form — **never pick** when two intents are close | `acc-4.2`, clarify wizard | Required before trusting wave disables on confuse-prone pairs |
| **Mutations** | Preview + confirm (bulk / money / cancel / privacy). Regex vs LLM disagree on a mutate → **confirm or escalate**, never silent regex win | `acc-4.6`, `acc-3.5`, execution-confirm utils | Hard rule during and after migration |
| **Resolution** | Fuzzy name→id / service→id / date→ISO below confidence → **clarify**, never silent pick | `acc-5.1` | Block auto-exec on low-res entities |
| **Self-verify** | “Do action+params satisfy the prompt?” — **no → do not execute** (lower confidence / clarify) | `acc-3.4`–`3.6`, pipe-1 self-verify | Required in Phase B before W1+ disable |
| **Post-exec** | Assert world matches intent (booking time/provider/etc.); mismatch → flag + **rollback** | `acc-5.4`–`5.6`, undo services | Especially money / cancel / schedule |
| **Blast radius** | Cap N cancellations / providers / date range → force confirm or split | `acc-5.7` | Dashboard bulk ops |
| **New intents** | Ship **dry-run / propose-only** until accuracy bar on real traffic, then graduate | `acc-5.8` | Every new registry action |
| **Learn** | Every miss → eval case + anchor/few-shot/prompt fix; **ratchet** CI / nightly floors | `acc-6.1`–`6.4` (anchors-first, not new paraphrase regex) | Ongoing Phase E |

### 8.4 Steal-specific safety (bridges classifier + safety)

When a steal is detected or suspected:

1. **Do not** fix only by inserting an earlier regex (reorders the fight).
2. Prefer: narrow structural stealer **or** anchors/eval for victim + self-verify.
3. If two intents remain plausible → **Top‑2 clarify**, not another steal guard.
4. Trace must record `classifiedAction`, `finalAction`, `rescueDetectorId` (Phase A.2) so steals are measurable.
5. Mutating steal that reached execute without confirm = **Sev-1** learning item (eval + gate gap).

### 8.5 Risk tiers (how hard the gates are)

| Tier | Examples | Minimum gates before auto-exec |
|------|----------|--------------------------------|
| **T0 read** | list, explain, summarize | Classify/semantic OK; wrong read → clarify preferred over confident nonsense |
| **T1 single mutate** | one booking, one price tweak | Self-verify + resolution confidence; confirm if classify/rescue disagree |
| **T2 money / PII / privacy** | pay, refund, gift card, privacy delete | Always preview + confirm; post-exec check where applicable |
| **T3 bulk / schedule blast** | clear week, mass cancel, apply template to all staff | Confirm + blast-radius cap + rollback path |

### 8.6 Phase F — Safety rails checklist (parallel to late waves)

- [ ] **F.1** Top‑2 ambiguity UI wired on dashboard + customer + public (+ provider where mutations exist).
- [ ] **F.2** Mutating confirm path cannot be skipped by rescue-only action rewrite.
- [ ] **F.3** Resolution confidence threshold enforced in gateway/validate (`acc-5.1`).
- [ ] **F.4** Self-verify blocks execute on fail (not only logs).
- [ ] **F.5** Post-exec verify + rollback for T2/T3 handlers (`acc-5`).
- [ ] **F.6** Blast-radius caps on bulk intents.
- [ ] **F.7** New intents default propose-only until bar met (`acc-5.8`).
- [ ] **F.8** Learning loop: miss → eval + fix; ratchet floors (`acc-6`); no default “add paraphrase regex.”
- [ ] **F.9** Metrics: wrong-execution, clarify→success, undo-within-1min, suspected_miss (from `acc-1`).

**Exit:** Rolling 30-day wrong-execution &lt; 1%; T2/T3 wrong silent mutation ≈ 0 in reviewed incidents; escalate rate tracked (`acc-6.5`–`6.7`).

### 8.7 “Forever” in practice

Forever means **the loop never stops**: measure → eval → fix → ratchet. Stop the loop and drift returns (new model, new phrasing, new intents). Regex.MD + §8 are the standing operating system, not a one-time project.

---

## 9. Success metrics

| Metric | Baseline (Phase A / R0) | Target (kill / safety) |
|--------|-------------------------|------------------------|
| `legacy_paraphrase` open+shadow+disabled | ~most of ~780 (after labeling) | **0** |
| Rescue override rate | measure | structural-only |
| No-clarify completion | measure | ≥ 90% (`acc-6.8`) |
| Completion + good clarify | measure | ≥ 99% |
| **Wrong execution** | measure | **&lt; 1%** rolling |
| **Wrong silent T2/T3 mutation** | measure | **≈ 0** (incident review) |
| Clarify → success next turn | measure | &gt; 90% (`acc-4.8`) |
| Undo within 1 min / wrong_execution signal | measure | trend ↓ (`acc-1`) |
| New paraphrase detectors / month | unconstrained | **0** |
| Anchor coverage (core intents) | `acc-3.16` | ≥5 × EN/HY/RU |
| Nightly LLM `minPassRate` | n/a | ≥ 0.9; ratchet |

---

## 10. Definition of done (program-level)

**Classifier track**

- [ ] Regex policy enforced in CI (fast heuristics + rescue boundary + inventory).
- [ ] **All** `legacy_paraphrase` detectors removed (§5.6).
- [ ] Classifier path: shortlist + few-shots + anchors + self-verify on all four surfaces.
- [ ] Nightly non-deterministic eval owns residual LLM variance.
- [ ] `TODO.md` **acc-3.8** / learning loop = anchors-first, not regex-first.
- [ ] No feature shippable with “regex-only reachability.”

**Safety track**

- [ ] §8.3 layers live for T1–T3 on all surfaces that mutate.
- [ ] Phase F checklist complete.
- [ ] Wrong-execution &lt; 1%; T2/T3 silent wrong mutation treated as Sev-1 with eval+gate fix.
- [ ] Ambiguity → Top‑2 / form, never silent pick.
- [ ] Learning loop running weekly; accuracy floors ratchet.

---

## 11. Suggested sequencing

| Order | Focus | Notes |
|-------|--------|--------|
| 1 | Phase 0 + **R0 inventory** | Label all ~780 before mass deletes |
| 2 | Phase A telemetry | Override + detector id + wrong_execution signals |
| 3 | Phase B classifier muscle + **self-verify execute-block** | Required before W1 disable |
| 4 | **Phase F early** (confirm, ambiguity chips, resolution guard) | Safety net while waves delete regex |
| 5 | Waves **W1–W4** | Highest traffic / steal families |
| 6 | Waves **W5–W11** | Domain sweep |
| 7 | **W12–W13** + Phase D | Long tail + thin rescue |
| 8 | Phase F complete (post-exec, blast radius, dry-run graduate) | `acc-5` |
| 9 | Phase E | Permanent learn + ratchet (`acc-6`) |

Rough sizing: after B, **1–2 waves per sprint** → on the order of **one to two quarters** for full replace-all; safety rails (F) should **overlap** waves, not wait until the end.

---

## 12. Working agreements (for agents & humans)

1. **Replace-all is the classifier goal**; **wrong silent mutation ≈ 0 is the safety goal**; wave PRs are the unit of work — never one mega-diff.
2. Do not delete a detector until shadow + eval prove classify/semantic own it.
3. **New intent meaning** → classifier rule + anchors + eval only.
4. **Regex for slots; models+anchors for verbs.**
5. Prefer **clarify / Top‑2** over steal when two intents are close.
6. Mutating: classify agree **or** explicit confirm; never regex-only execute; disagree → confirm or escalate.
7. Fuzzy resolve below threshold → clarify; never silent entity pick.
8. Self-verify fail → do not execute.
9. Every PR that removes paraphrase regex updates `regex-command-inventory` status.
10. P0 hotfix regex allowed only with inventory row `status: open`, wave id, and **14-day expiry** to re-enter factory.
11. New mutating intents ship propose-only until accuracy bar; T2/T3 need confirm + post-exec plan.
12. Misses become eval + fix; **not** a new paraphrase regex by default.

---

## 13. Open decisions (resolve in Phase A / R0)

1. Inventory format (JSON vs TS) and CI script owner.
2. Shadow duration / trace count before disable.
3. Nightly LLM trial defaults (recommendation: 5–8 trials, `minPassRate` 0.9; mutate wrong-exec = hard fail).
4. Whether structural “credential upgrade” may set action without classify agree (recommendation: yes only when manage-link credentials are present in prompt/context).
5. Burn-down owner (AI ops) and wave assignment for long-tail W12.
6. Exact blast-radius caps (N cancels / days) per plan tier.
7. Accuracy bar to graduate propose-only → auto-exec per risk tier.

---

*Last updated: 2026-08-01 — replace-all + wrong-execution safety plan; implementation tracks `acc-*` / `pipe-1` in `TODO.md`.*
