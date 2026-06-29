# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress (completed items removed from this file)

**Build policy:** Ship **product features** first → **launch & consumer app** → **lifecycle & ops** → **AI expansion** → **onboarding, pricing & Stripe plans last**. Existing AI baseline stays.

---

## Sprint overview

~2-week sprints. Features **1–8** → Gift cards **9** → Launch & consumer **10–11** → Lifecycle & ops **12–13** → AI **14–25** → Monetization **26–27**.

| Sprint | Theme | IDs |
|--------|--------|-----|
| **1** | Mobile push & offline | gap-2.1, gap-2.3 |
| **2** | Integrations — webhooks & Zapier | gap-4.3, gap-4.4, gap-4.5 |
| **3** | Integrations — accounting & support | gap-4.1, gap-4.2 |
| **4** | In-app polish | gap-6.4, gap-6.5 |
| **5** | Scheduling vertical depth | gap-8.2, **sub-1**, **gap-8.3**, **gap-8.7** |
| **6** | Growth & vertical playbooks | gap-8.1, gap-8.5 |
| **7** | Retail POS & enterprise trust | gap-8.4, gap-5.4, gap-5.5 |
| **8** | Strategy & compliance eval | gap-5.6, gap-1.6 |
| **—** | Postgres RLS tenant isolation | **gap-5.7** |
| **9** | Customer gift card purchase & delivery | **gc-1** |
| **10** | Launch — billing & provider app store | gap-7.5, gap-7.6, gap-1.5 |
| **11** | Consumer booking app | **gap-2.5** |
| **12** | Marketing alerts & subscription accounting | gap-4.6, gap-4.7 |
| **13** | Customer booking self-service & staff push | gap-2.7, gap-2.8, **pay-2** |
| **14** | AI reliability & regression ✅ | gap-3.2, gap-3.7, gap-3.1 |
| **15** | AI platform & limits ✅ | ai-0.1, ai-0.2, ai-0.10, gap-3.3, ai-i10 |
| **16** | AI dashboard UX core | ai-d4, ai-d22, ai-d7, ai-d3 |
| **17** | AI dashboard depth | ai-d5, ai-d6, ai-d10, ai-d11, ai-d18, ai-d19 |
| **18** | AI page coverage & onboarding | ai-d21, ai-d24, ai-d25, gap-6.3, gap-6.6, gap-8.6 |
| **19** | AI mobile commands | ai-m3, ai-m6, ai-m8, ai-m9, ai-m11, ai-m13 |
| **20** | AI mobile push & voice | ai-m5, ai-m16, ai-m17, ai-m19, gap-2.2, gap-2.4, gap-2.6 |
| **21** | AI mobile offline | ai-m20, ai-m21, ai-m22 |
| **22** | AI intelligence layer | ai-i2, ai-i3, ai-i6, ai-i8 |
| **23** | AI scheduling scenarios | ai-s2, ai-s3, ai-s4, ai-s5, ai-s6 |
| **24** | AI booking & business ops | ai-b3, ai-b4, ai-b5, ai-o1–ai-o5 |
| **25** | AI enterprise & analytics | ai-e1, ai-e3–ai-e8, gap-3.5 |
| **—** | AI product commands — Sprints 1–13 coverage (planned) | **ai-cmd-0**, **ai-cmd-b1**–**ai-cmd-n1** (~270 intents) |
| **—** | AI command handlers & NLU quality (ongoing) | **ai-cmd-h1**–**ai-cmd-h4** |
| **26** | Onboarding & pricing UX | gap-6.1, gap-7.4 |
| **27** | Stripe plans & seats | gap-7.1, gap-7.2, gap-7.3, gap-5.2, gap-6.2 |
| **28** | Multi-currency support (core v1 shipped) | **curr-1** ✅, **ai-cmd-curr** |
| **29** | Per-tenant language enablement (core v1 shipped) | **lang-1**, **ai-cmd-lang** |
| **30** | Tours vertical (core v1 shipped) | **vert-tour-1**, **ai-cmd-tour** |
| **31** | Clinic vertical (core v1 shipped) | **vert-clinic-1**, **ai-cmd-clinic** |
| **32** | Post-checkout product recommendations (core v1 shipped) | **rec-1**, **ai-cmd-rec** |
| **33** | Ameria payment integration | **pay-ameria-1** |
| **34** | Date format settings (admin-controlled, all apps) (core v1 shipped) | **fmt-1**, **ai-cmd-fmt** |
| **35** | Additional payment gateways — PayPal, Tap, Payme, Wise | **pay-ext-1** |
| **36** | Tax / VAT configuration (core v1 shipped) | **tax-1**, **ai-cmd-tax** |
| **37** | GDPR & HIPAA compliance hardening (core v1 shipped) | **compliance-1**, **ai-cmd-compliance** |
| **38** | AI accuracy — telemetry & measurement | **acc-1** |
| **39** | AI accuracy — eval set expansion & CI gate | **acc-2** |
| **40** | AI accuracy — classification engine + semantic intent matching + confidence pipeline | **acc-3**, **pipe-1** |
| **41** | AI accuracy — smart clarification & disambiguation | **acc-4** |
| **42** | AI accuracy — execution verification & rollback | **acc-5** |
| **43** | AI accuracy — continuous learning & escalation | **acc-6** |
| **44** | Apps adoption — telemetry & funnel measurement | **adopt-1** |
| **45** | Apps adoption — acquisition & install funnel | **adopt-2** |
| **46** | Apps adoption — activation & onboarding | **adopt-3** |
| **47** | Apps adoption — retention & re-engagement | **adopt-4** |
| **48** | Apps adoption — performance, reliability & trust | **adopt-5** |
| **49** | Apps adoption — growth loops, habit & exit criteria | **adopt-6** |
| **50** | Near-99%: clarify → success on next turn | **n99-1** |
| **51** | Near-99%: no-clarify completion rate | **n99-2** |
| **52** | Near-99%: install → activation (≤ 7d) | **n99-3** |
| **53** | Near-99%: push opt-in / reachability | **n99-4** |
| **54** | Clinic vertical v2 — lab catalog, orders, results, light EMR | **vert-clinic-2**, **ai-cmd-clinic-v2**, **i18n-clinic-v2** |
| **55** | AI feature parity — inventory & per-role coverage matrix | **parity-1** |
| **56** | AI feature parity — close coverage gaps to 100% per role | **parity-2** |
| **57** | AI feature parity — role-scoped "do anything" agent | **parity-3** |
| **58** | AI feature parity — coverage CI gate & maintenance | **parity-4** |
| **59** | Provider app — customer context at chair | **prov-exp-1** |
| **60** | Provider app — stats, check-in & team floor | **prov-exp-2**–**prov-exp-4** |
| **61** | Provider app — retail, comms & schedule | **prov-exp-5**–**prov-exp-7** |
| **62** | Provider app — waitlist, growth & polish | **prov-exp-8**–**prov-exp-11** |
| **63** | Budget-aware service discovery ✅ | **budget-1**, **ai-cmd-budget** |
| **64** | Premium / best service discovery ✅ | **rank-1**, **ai-cmd-rank** |
| **65** | Flexible OR availability + budget compounds ✅ | **avail-1**, **ai-cmd-avail** |
| **—** | Unified service discovery (budget + rank + OR avail) ✅ | **discover-1**, **ai-cmd-discover** |
| **—** | Extend dashboard `AiCommandService` actions (orchestrator + registry parity) | **ai-cmd-ext** |
| **—** | Customer AI commands — public booking web + consumer mobile | **ai-cmd-customer** |
| **66** | In-app AI Helper — product guide & contextual how-to | **ai-guide-1** |

---

## ai-cmd-ext — Extend `AiCommandService` actions (plan)

**Goal:** Grow dashboard AI command coverage safely — every new product action gets a registry entry, classifier rule, handler (inline or delegated), rescue path, fixtures, and eval case — without letting `ai-command.service.ts` become an unmaintainable god-object.

**Baseline (today):**

| Metric | Value | Source |
|--------|-------|--------|
| Dashboard intents in registry | **252** (mutating subset in `DASHBOARD_MUTATING_INTENTS`) | `DASHBOARD_INTENTS` in `ai-command-registry.build.ts` |
| Dashboard REST ↔ AI audit | **~229** ops — **~58 gaps** | **ai-cmd-dashboard-6** (full table below **ai-cmd-provider-6**) |
| `executeSingleIntent` switch cases | **~337** (multi-surface + aliases) | `ai-command.service.ts` |
| LEGACY_CORE intents owned by `AiCommandService` | **~51 mutate + ~19 read** | `LEGACY_CORE_BINDINGS` in registry build |
| `INTENT_SCHEMA` action union | **252** (from `DASHBOARD_INTENTS`) | `ai-command-intent-schema.build.ts` → `INTENT_SCHEMA` in `ai-command.service.ts` |
| Documented rules in schema appendix | **~200+ actions** | fixture constants appended to `INTENT_SCHEMA` |
| Generic fallback on unknown handler | still active | `default` case → "don't know how to execute" |

**Architecture policy (mandatory for every new action):**

| Layer | Where to change | Rule |
|-------|-----------------|------|
| Registry | `ai-command-registry.build.ts` + domain `*.util.ts` intent list | Add `id`, `surfaces`, `handler`, `mutating`, `sprint` **before** handler code |
| Classifier | `INTENT_SCHEMA` union + `*_CLASSIFIER_RULES` in `*.fixtures.ts` | Extend action union; never rely on appendix-only rules |
| Dispatch | `AiCommandService.executeSingleIntent` `switch` | **One line:** `case 'x': result = await this.domain.handleX(...); break;` — no business logic inline |
| Handler | `Ai*Service` / `*.logic.ts` next to domain | All DB/API work lives here (match `AiCatalogService`, `AiSchedulingService`, …) |
| Validate | `command-completion.validator.ts` + `ai-command-entity-params.registry.ts` | Required params per action |
| Rescue | `AiIntentRescueService` or domain `rescue*FromPrompt` | Deterministic-first; regression-tested |
| Tests | `*.fixtures.ts` → `it.each` unit + `*.integration.spec.ts` + `eval/ai-command-eval.cases.ts` | EN/HY/RU; tag `surface: dashboard` |
| Other surfaces | `ProviderAiCommandService`, `CustomerAiCommandService`, `PublicBookingAssistantService` | Duplicate verbs where UI differs — **do not** route provider/customer/public through `AiCommandService` |

**Per-action definition of done** (every row in tables below):

> **Audit (2026-06):** not met globally for all **252** dashboard registry intents — see **ai-cmd-ext-gap** + REST audit **ai-cmd-dashboard-6**. Public/customer discovery (Sprints **63–65**) meets the spirit of this checklist; dashboard **`ai-cmd-ext-1`** param rows and **`ai-cmd-ext-2`** new verbs do not.

- [ ] Registry binding + access tier in `access-control.matrix.ts`
- [ ] `INTENT_SCHEMA` union entry + classifier rules wired
- [ ] `case` in `executeSingleIntent` **or** documented delegation to another surface service
- [ ] Handler + validator + entity params
- [ ] Rescue/heuristic + ≥10 NL variants in fixtures
- [ ] Eval golden cases (`npm run test:sprint14`; `test:ai-accuracy` when applicable)

### ai-cmd-ext-gap — Audit gaps (dashboard per-action DoD)

| Gap ID | DoD criterion | Current state | Close with |
|--------|---------------|---------------|------------|
| **ai-cmd-ext-gap-1** | Registry + access tier | Registry ↔ capability matrix tested; **uncovered UI actions remain** | **parity-2.1**–**2.3**, explicit tier rows per new intent in `access-control.matrix.ts` |
| **ai-cmd-ext-gap-2** | `INTENT_SCHEMA` union + classifier rules | **Union synced** — **252** actions from `DASHBOARD_INTENTS` via **`ai-command-intent-schema.build.ts`**; appendix rules still separate per domain | Per-intent classifier rules for appendix-only gaps — **parity-2.4** |
| **ai-cmd-ext-gap-5** | Rescue + ≥10 NL fixtures | Done for major domains (booking, clinic, payments, discover); **not every registry id** | **parity-2.4** per new intent; extend domain `*.fixtures.ts` |
| **ai-cmd-ext-gap-6** | Eval golden cases | **`test:ai-accuracy`** — **2738/2738** deterministic cases (100%); baseline ratchet **acc-2.9** | **acc-2.4**–**2.6**, **parity-2.4** |
| **ai-cmd-dashboard-gap-10** | Dashboard REST ↔ AI parity | **~58 REST gaps** vs **252** registry intents — no **`dashboard-api-ai-parity.fixtures.ts`** yet | **ai-cmd-dashboard-6.19**, **`test:dashboard-api-ai-parity`** |

- [ ] **ai-cmd-ext-gap-7** — Mark per-action DoD checklist `[x]` only when **ai-cmd-ext-gap-1**–**6** are green for that table row (or row is explicitly out of scope with surface tag). REST binding: see **ai-cmd-dashboard-6.19**.
- [ ] **ai-cmd-dashboard-gap-10** — **`dashboard-api-ai-parity.fixtures.ts`** + gate — see **ai-cmd-dashboard-6.19**

---

### ai-cmd-ext-0 — Orchestrator hygiene (do first)

> Blocks closing **ai-cmd-ext-gap-2**, **ai-cmd-ext-gap-3**. See audit table under **ai-cmd-ext-gap**.

| Task ID | Work | Why |
|---------|------|-----|
| **ai-cmd-ext-0.4** | Extract LEGACY_CORE inline methods → `AiDashboardCoreService` (booking, cancel, show, analytics, schedule mutate) — `AiCommandService` keeps classify + compound + dispatch only | Target orchestrator **< 5k LOC** |
| **ai-cmd-ext-0.5** | Optional: registry-driven dispatch table (`Map<intent, handlerFn>`) built at module init | Removes 300+ `case` branches over time |

- [ ] **ai-cmd-ext-0.4** — Extract LEGACY_CORE → `AiDashboardCoreService`
- [ ] **ai-cmd-ext-0.5** — Registry-driven dispatch table

---

### ai-cmd-ext-3 — Registry-only intents → wire dispatch (handlers exist or stubbed elsewhere)

These are already in `ai-command-registry.build.ts` with **`handler !== 'AiCommandService'`** — work is **ProviderAiCommandService** (or sibling), not the dashboard switch. Listed here so dashboard extension plan stays aligned with full intent inventory.

| Task ID | Action(s) | Target service | Sprint | Wire in |
|---------|-----------|----------------|--------|---------|
| **ai-cmd-ext-3.1** | `summarize_client`, `show_client_history`, `add_client_note` | `AiProviderClientContextService` | **59** / **prov-exp-1** | `ProviderAiCommandService` |
| **ai-cmd-ext-3.2** | `my_stats`, `team_floor_status`, `check_in_client`, `mark_running_late` | `AiProviderExp2Service` | **60** / **prov-exp-2** | `ProviderAiCommandService` |
| **ai-cmd-ext-3.3** | `summarize_my_appointments`, `summarize_my_revenue` | `AiProviderEarningsService` | **60** / **prov-exp-4** | `ProviderAiCommandService` |
| **ai-cmd-ext-3.4** | `add_retail_to_booking`, `send_client_message`, `block_my_time`, `request_time_off` | `AiProviderExp3Service` | **61** / **prov-exp-5** | `ProviderAiCommandService` |
| **ai-cmd-ext-3.5** | `list_time_off_requests`, `approve_time_off_request`, `deny_time_off_request` | `AiProviderTimeOffService` | **61** / **prov-exp-7** | dashboard switch **+** provider |
| **ai-cmd-ext-3.6** | `suggest_waitlist_for_gap` | `AiProviderOpenShiftsService` | **62** / **prov-exp-8** | `ProviderAiCommandService` |

---

### Implementation order

| Phase | Task IDs | Exit criteria |
|-------|----------|---------------|
| **0 — Hygiene** | **ai-cmd-ext-0.1**–**0.3** | CI gate: no registry intent without handler path; union synced |
| **1 — Param extensions** | **ai-cmd-ext-1.1**–**1.4** | **budget-1**, **rank-1**, **avail-1**, **discover-1** gates green |
| **2 — New dashboard verbs** | **ai-cmd-ext-2.*** per product sprint | Each row meets per-action DoD + **parity-2.4** locale eval |
| **3 — Provider dispatch** | **ai-cmd-ext-3.*** | Provider matrix 100% wired (**parity-1** inventory) — **new intents:** **ai-cmd-provider-5** |
| **4 — Compounds** | **ai-cmd-ext-4.*** | Labeled multi-step set ≥95% (**parity-3.2**) |
| **5 — Refactor** | **ai-cmd-ext-0.4**–**0.5** | `AiCommandService` LOC reduced; dispatch table optional |

**Related:** **ai-cmd-h1**–**h4** (NLU quality), **parity-1**–**parity-4** (role coverage matrix + CI), **acc-2** (eval expansion for every new action).

---

## ai-cmd-customer — Public booking web + consumer mobile AI commands (plan)

**Goal:** Every customer-visible AI feature works on **both** anonymous public booking and logged-in consumer mobile, with one backend implementation per action family — no duplicate handler logic in the apps.

**Not in scope:** Dashboard admin (`AiCommandService`), provider mobile (`ProviderAiCommandService`) — tracked under **ai-cmd-ext** / **prov-exp-***.

### Architecture (one change, two surfaces)

| Surface | User | API entry | Classifier schema | Handler dispatch |
|---------|------|-----------|-------------------|------------------|
| **Public booking web** | Anonymous visitor | `POST /public/:slug/assistant` | `buildPublicClassifierSchema()` | `PublicBookingAssistantService.chat()` |
| **Consumer mobile** | Logged-in customer | Customer AI gateway (`surface: customer`) | `buildCustomerClassifierSchema()` | `CustomerAiCommandService.executeCommand()` |

**Routing rule:**

| Action family | Consumer mobile path | Shared backend? |
|-------------|---------------------|-----------------|
| Discovery & anonymous booking (`list_services`, `check_availability`, `recommend_specialists`, `book_appointment`, `list_providers`, `business_info`, `booking_help`) | `isPublicOnlyAssistantAction` → `runPublicAssistant()` | **Yes** — wire once in `PublicBookingAssistantService` |
| Check-and-book compounds on mobile | `decomposeDeterministicForSurface('customer')` → `check_providers_for_service` + `book_nearest_slot` via `AiPaymentsService` | **Shipped** — budget/rank/avail in shared compound context + `ai-payments.logic.ts` |
| Account & checkout (`book_package`, `cancel_my_booking`, `my_appointments`, gift card, promo, clinic self-service, …) | `dispatchCustomerIntent()` in `customer-ai-command.logic.ts` | Customer-only — separate classifier rules + handlers |

**Definition of done (every customer feature row below):**

- [~] ≥10 NL variants per surface in fixtures; eval cases tagged `surface: public` **and** `surface: customer` (EN/HY/RU) — **partial** (**acc-2.4**)

### ai-cmd-customer-gap — Audit gaps (customer per-row DoD)

| Gap ID | DoD criterion | Current state | Close with |
|--------|---------------|---------------|------------|
| **ai-cmd-customer-gap-5** | ≥10 NL variants + eval EN/HY/RU | Discovery + deferred slices — **`ai-customer-deferred-locale-parity.spec.ts`** (210 EN/HY/RU eval rows); provider push (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 (+24 HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+4 HY/RU); provider team whos next (+4 HY/RU); provider time-off list (+6 HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in **`ai-provider-*-locale-parity.spec.ts`** | **acc-2.4** remaining EN golden rows outside deferred/provider slices |
| **ai-cmd-customer-gap-9** | Public API ↔ AI parity | Every **`public-api.ts`** export maps to intent or **`no-ai`** — **`test:customer-api-ai-parity`** | **ai-cmd-customer-6.13** |

- [~] **ai-cmd-customer-gap-5** — ≥10 NL variants + eval EN/HY/RU — **partial** (**acc-2.4**)
- [ ] **ai-cmd-customer-gap-8** — Mark customer DoD checklist `[x]` only when **ai-cmd-customer-gap-1**–**7** are green for that feature row (customer-only rows exempt from public-schema bullets)
- [ ] **ai-cmd-customer-gap-9** — **`customer-public-api-ai-parity.fixtures.ts`** + gate — see **ai-cmd-customer-6.13**

---

### ai-cmd-customer-2 — Customer-only actions (consumer mobile + logged-in web)

Handler target: **`customer-ai-command.logic.ts`** → domain `Ai*Service` (not `PublicBookingAssistantService`).

| Task ID | Domain | Example actions | Classifier | Integration spec | Notes |
|---------|--------|-----------------|------------|------------------|-------|
| **ai-cmd-customer-2.2** | Payments & gift cards | `book_with_gift_card`, `check_gift_card_balance`, `buy_gift_card`, … | customer schema + `rescuePaymentsIntent` | `ai-gift-card-payments.integration.spec.ts` | Must stay disjoint from **`maxPrice`** (**budget-1.8**) |
| **ai-cmd-customer-2.3** | Subscriptions & packages | `discover_packages`, `my_subscriptions`, `select_subscription_plan` | customer schema | package integration specs | Package budget ≠ service **`maxPrice`** |
| **ai-cmd-customer-2.4** | Clinic consumer | `list_my_test_results`, `book_lab_collection`, … | customer + public clinic appendices | `ai-clinic-lab-booking.integration.spec.ts` | Public clinic prompts overlap — keep surface tags |
| **ai-cmd-customer-2.5** | Adoption & growth | `how_to_download_app`, `switch_to_consumer_app`, deep-link resume | `CONSUMER_ADOPTION_CLASSIFIER_RULES` | `ai-consumer-adoption.*` | **adopt-2**–**adopt-4** |

---

### ai-cmd-customer — Implementation order

| Phase | Task IDs | Unlocks |
|-------|----------|---------|

**Key files map:**

| Concern | Public web | Consumer mobile | Shared |
|---------|------------|-----------------|--------|
| Classifier | `public-booking-assistant.service.ts` `buildPublicClassifierSchema()` | `customer-ai-command.util.ts` `buildCustomerClassifierSchema()` | `ai-budget-service-discovery.fixtures.ts` rules |
| Rescue | `PublicBookingAssistantService.chat()` rescue chain | `CustomerAiCommandService.rescueIntent()` | `ai-budget-service-discovery.util.ts` |
| Catalog filter/sort | `handleListServices` / `handleRecommendSpecialists` | same (via `runPublicAssistant`) | `ai-service-catalog-rank.util.ts` ✅ **budget-1.1** |
| Compounds | `tryExecutePublicCompound` ✅ **ai-cmd-customer-0.4** | `tryCompound` + `executeCustomerCompoundFromSteps` | `intent-decomposition.util.ts` golden patterns |
| Eval | `surface: public` | `surface: customer` | `eval/ai-command-eval.cases.ts` |

---

## PostgreSQL RLS — tenant isolation (defense in depth)

**Goal:** Complement application-level `businessId` checks with Postgres row-level security so a missed filter cannot leak cross-tenant data.

Today isolation is app-layer only: `ensureMember()` + explicit `business_id` in queries. RLS adds a second enforcement boundary at the database.

- [ ] **gap-5.7** — PostgreSQL row-level security (RLS) for multi-tenant isolation
- [ ] **gap-5.7.1** — Request middleware — resolve tenant id (`businessId`) from JWT, API key, or public-booking slug; attach to request context before handlers run
- [ ] **gap-5.7.2** — Connection pool session — per request, set tenant on the DB connection (e.g. `SET LOCAL app.current_tenant_id = …` via TypeORM query runner / pool hook) so all queries in that request inherit the tenant context
- [ ] **gap-5.7.3** — RLS policies on tenant-scoped tables — enable RLS + `USING (business_id = current_setting('app.current_tenant_id', true)::uuid)` on tables that carry `business_id` (bookings, customers, employees, services, schedules, gift cards, etc.); skip global tables (`users`, `businesses`)
- [ ] **gap-5.7.4** — Migration / admin bypass — dedicated DB role with `BYPASSRLS` for migrations, cron, and background jobs that legitimately operate across tenants
- [ ] **gap-5.7.5** — Tests — integration specs proving cross-tenant SELECT/UPDATE/DELETE fails at the database layer when RLS is enabled

---

- [ ] **gap-2.5.10** — Consumer app App Store / Play Store listing (separate from provider app **gap-1.5**)

*(Integrates **sub-1** subscriptions — one-time vs plan picker, My subscriptions profile.)*


## Sprint 26 — Onboarding & pricing UX

**Goal:** Streamlined first-run setup and public pricing once product, consumer app, and AI are ready.

- [ ] **gap-6.1** — Simplified “first 30 minutes” onboarding — book link live in ≤3 steps
- [ ] **gap-7.4** — Public pricing page with seat calculator + feature comparison matrix

---

## Sprint 27 — Stripe plans & seats

**Goal:** Solo / Starter / Growth / Business tiers live in Stripe; entitlements and tier-gated UI.

- [ ] **gap-7.1** — Implement Solo / Starter / Growth / Business tiers in `plans.ts` + Stripe
- [ ] **gap-7.2** — Per-seat billing (provider + admin seats) with enforcement on employee create / invite
- [ ] **gap-7.3** — Freemium Solo tier — 1 provider, capped AI, no Stripe Connect
- [ ] **gap-5.2** — Implement `PlanLimits` entitlements in API + UI (see `backend/docs/PLANS.md`)
- [ ] **gap-6.2** — Hide advanced modules (AI Ops, monetization, integrations) until Starter+ or explicit enable
- [ ] **gap-1.5** — App Store / Play Store listings for provider app and consumer app with screenshots + reviews flow

---

in the end when I will have many clients:
create Full marketplace per country
Central place where clients discover and book across tenants


**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---
- [ ] **vert-clinic-2.1.6** — Normal ranges — reference range entities + admin CRUD on test types; abnormal flags on result measurements (public My results + consumer My results + dashboard Results tab)

## Sprint 33 — Ameria payment integration

**Goal:** Add Ameriabank (Armenia) as a payment gateway option alongside Stripe; admin enables it in settings; public booking checkout routes to Ameria when Stripe is disabled or Ameria is selected.

- [ ] **pay-ameria-1** — Ameria payment gateway integration

- [ ] **pay-ameria-1.1** — `Settings → Payments`: **Ameria** section — enable toggle, `clientId`, `username`, `password` (encrypted at rest, same pattern as WhatsApp token encryption); test connection button; warning if both Stripe and Ameria disabled
- [ ] **pay-ameria-1.2** — Gateway priority — admin sets preferred gateway (Stripe / Ameria / both with customer choice); stored in `business.settings.paymentGateways`
- [ ] **pay-ameria-1.3** — Public API — expose `availablePaymentGateways[]` on `/public/{slug}/profile` so checkout knows which options to render

- [ ] **pay-ameria-1.4** — `AmeriaPaymentService` — initiate payment (`POST` to Ameria API → get `paymentId` + redirect URL), verify payment (`GET` payment status by `paymentId`), refund (`POST` refund)
- [ ] **pay-ameria-1.5** — Ameria checkout flow — `POST /public/{slug}/bookings/checkout/ameria` → create pending booking → call Ameria initiate → return redirect URL; customer redirected to Ameria hosted page
- [ ] **pay-ameria-1.6** — Callback handler — `GET /public/{slug}/payments/ameria/callback?paymentId=&orderId=` — verify status with Ameria API; on success: confirm booking + mark paid; on failure: cancel pending booking + return error
- [ ] **pay-ameria-1.7** — Idempotency — store `ameriaPaymentId` on booking; prevent duplicate confirmation on callback retry
- [ ] **pay-ameria-1.8** — Refund — extend booking cancel flow: if `paymentGateway: ameria` and paid, call Ameria refund API; same cancel UX as Stripe path

- [ ] **pay-ameria-1.9** — Payment method selector — when both Stripe and Ameria enabled: show **"Pay by card (Visa/MC)"** (Stripe) vs **"Pay via Ameriabank"** (Ameria) at checkout; when only Ameria: skip selector, go direct
- [ ] **pay-ameria-1.10** — Consumer app — same gateway selector; Ameria flow opens in-app browser (`capacitor-browser`) → return deep link after payment
- [ ] **pay-ameria-1.11** — Ameria return page — `/book/{slug}/payments/ameria/return` — shows success or failure; on success redirect to booking confirmation; on failure show retry option

- [ ] **pay-ameria-1.12** — Subscription purchase via Ameria — single-charge flow (no recurring; Ameria does not support subscriptions natively); treat as one-time payment for plan price
- [ ] **pay-ameria-1.13** — Gift card purchase via Ameria — same single-charge redirect flow as booking checkout

- [ ] **pay-ameria-1.14** — Booking + payment records — store `paymentGateway: 'ameria'`, `ameriaPaymentId`, `ameriaOrderId` on payment metadata
- [ ] **pay-ameria-1.15** — Accounting export — Ameria payments included in QuickBooks / Xero / CSV export with gateway column
- [ ] **pay-ameria-1.16** — Dashboard payments list — show gateway badge (Stripe / Ameria / Cash) per transaction

---

## Sprint 35 — Additional payment gateways (PayPal, Tap Payments, Payme, Wise)

**Goal:** Expand payment options to cover more countries and use cases; each gateway is opt-in per business; existing Stripe + Ameria flows unaffected.

- [ ] **pay-ext-1** — Additional payment gateway integrations

- [ ] **pay-ext-1.1** — Extract `PaymentGatewayAdapter` interface — `initiatePayment`, `verifyPayment`, `refund`, `getRedirectUrl`; Stripe, Ameria, and all new gateways implement this interface; `PaymentGatewayRouter` selects adapter from `business.settings.paymentGateways`
- [ ] **pay-ext-1.2** — Gateway selector UI — `Settings → Payments`: enable/disable each gateway independently; credentials per gateway stored encrypted; test connection per gateway; warning if no gateway enabled

- [ ] **pay-ext-1.3** — Admin settings — `clientId`, `clientSecret`; sandbox vs live toggle; supported currencies
- [ ] **pay-ext-1.4** — Backend — PayPal Orders API v2: create order → redirect to PayPal → capture on return; `PayPalPaymentAdapter` implementing shared interface
- [ ] **pay-ext-1.5** — Callback / return — `GET /public/{slug}/payments/paypal/return` — capture + confirm booking; cancel URL returns to checkout with error
- [ ] **pay-ext-1.6** — Refund — PayPal refund API on booking cancel; partial refund support (deposit scenario)
- [ ] **pay-ext-1.7** — Consumer app — opens PayPal in `capacitor-browser`; deep link return after payment

- [ ] **pay-ext-1.8** — Admin settings — `secretKey`, `publishableKey`; supported currencies (AED, SAR, KWD, BHD, QAR, OMR, EGP, etc.)
- [ ] **pay-ext-1.9** — Backend — Tap Charges API: create charge → hosted payment page redirect; `TapPaymentAdapter`
- [ ] **pay-ext-1.10** — Callback — `POST /public/{slug}/payments/tap/webhook` — verify HMAC signature; confirm booking on `CAPTURED`; cancel on `DECLINED`
- [ ] **pay-ext-1.11** — Refund — Tap refund API on cancel

- [ ] **pay-ext-1.12** — Admin settings — `merchantId`, `secretKey`; UZS currency support
- [ ] **pay-ext-1.13** — Backend — Payme JSONRPC API: `CreateTransaction` → `PerformTransaction` → `CheckTransaction`; `PaymePaymentAdapter`
- [ ] **pay-ext-1.14** — Webhook — `POST /public/{slug}/payments/payme/webhook` — handle `PerformTransaction` confirmation; update booking payment status
- [ ] **pay-ext-1.15** — Refund — `CancelTransaction` on booking cancel within allowed window

- [ ] **pay-ext-1.16** — Use case: **staff payouts only** (not customer checkout) — Wise is a payout/transfer tool, not a checkout gateway
- [ ] **pay-ext-1.17** — Admin settings — Wise API token, profile ID; target currencies for payouts
- [ ] **pay-ext-1.18** — Payout flow — from Payroll / Commissions dashboard: "Pay via Wise" button per staff member; create Wise transfer for calculated payout amount; store `wiseTransferId` on payout record
- [ ] **pay-ext-1.19** — Status sync — poll or webhook: `transfer.state_changed` → update payout status (outgoing_payment_sent / funds_converted / bounced_back)
- [ ] **pay-ext-1.20** — Dashboard — payout history shows Wise transfer ID + status + estimated delivery

- [ ] **pay-ext-1.21** — Payment method selector at checkout — show only gateways enabled by the business; icons (PayPal logo, Tap logo, Payme logo, card icon for Stripe/Ameria)
- [ ] **pay-ext-1.22** — Unified payment status — all gateways write to same `booking.paymentStatus` + `booking.paymentGateway` fields; dashboard and reports gateway-agnostic
- [ ] **pay-ext-1.23** — Accounting export — all gateway payments in QuickBooks / Xero / CSV with `paymentGateway` column

---

- [ ] **tax-1.8** — Ameria / other gateways — same tax-aware total passed to payment initiation
- [~] **compliance-1.6** — **DPA (Data Processing Agreement)** — DPA template exists (**gap-5.4** ✅ / Enterprise Trust tab); e-sign step + signed DPA storage deferred


# AI Accuracy Program — 99% accurate executions (Sprints 38–43)

**Goal:** Take AI command accuracy from the current baseline (>75% no-clarify completion) to **99% accurate executions** — meaning 99% of user prompts either execute correctly **or** ask the right clarifying question instead of doing the wrong thing.

**Core principle:** "Accurate execution" = (correct intent) × (correct parameters) × (correct execution) **OR** (honest clarify / safe refusal). A wrong action is a failure; a *good question* is a success.

### Accuracy ladder (how we climb to 99%)

| Stage | No-clarify completion | What unlocks it |
|-------|----------------------|-----------------|
| Baseline (today) | ~75% | Shipped: classify + rescue + confidence routing (ai-i4), clarify (ai-d4), eval harness (gap-3.1) |
| **Stage 1** | ~85% | Telemetry to *see* real failures (**acc-1**) + 10× eval set (**acc-2**) |
| **Stage 2** | ~92% | Classification engine: few-shot + retrieval + self-verify (**acc-3**) |
| **Stage 3** | ~96% | Smart clarification instead of wrong guesses (**acc-4**) + execution verification (**acc-5**) |
| **Stage 4** | **99%** | Continuous learning loop + escalation for the last 1% (**acc-6**) |

**Why this order:** You cannot improve what you cannot measure. Telemetry (**acc-1**) and a large labeled eval set (**acc-2**) come first; every later sprint is measured against that eval set with a CI regression gate so accuracy never silently drops.

**Builds on existing infra (do not rebuild):** `AiGatewayService`, `classify_intent`, `AiIntentRescueService`, confidence routing (ai-i4), clarify-as-form (ai-d4), entity memory (ai-i2), conversation summaries (ai-i3), RAG (ai-i8), eval harness (gap-3.1 / ai-cmd-0.4), command outcome analytics (ai-e6), human-in-the-loop SLA (ai-e7), prompt security preflight.

---

## Sprint 39 — AI accuracy: eval set expansion & CI regression gate

**Goal:** Grow the golden eval set from hundreds to **thousands** of real, labeled prompts across all surfaces and locales; make accuracy a hard CI gate so no change can regress it.

**Status (2026-06):** **`npm run test:ai-accuracy`** green — **2722/2722** deterministic cases (`AI_COMMAND_EVAL_DETERMINISTIC_CASES`).

- [~] **acc-2.4** — **Locale parity** — every EN golden case has HY + RU equivalents — **partial (2026-06):** customer deferred in **`ai-customer-deferred-locale-parity.spec.ts`** (210 rows); provider push setup (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 retail/comms/schedule (+36 EN+HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+6 EN+HY/RU); provider team whos next (+6 EN+HY/RU); provider time-off list (+9 EN+HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in **`ai-provider-*-locale-parity.spec.ts`**; discovery multilingual in **`ai-customer-public-eval-parity.spec.ts`**; implication corpus HY/RU in **`ai-implication-corpus-locale-parity.spec.ts`** (+50 eval rows, **pipe-1.11.5**)
- [~] **acc-2.5** — **Typo / fuzzy corpus** — auto-generate misspelled, abbreviated, lowercase, no-punctuation variants of top prompts — **partial (2026-06):** phase 1 lowercase/no-punctuation/double-spacing on 8 customer rescue seeds (+17 eval rows) in **`ai-typo-corpus.*`**; `hasConsumerAppContext` accepts flexible whitespace

---

## Sprint 40 — AI accuracy: classification engine

**Goal:** Make the core classify step dramatically more accurate via few-shot retrieval, self-verification, and layered fallback — measured against the **acc-2** eval set every step.

- [~] **acc-3** — Classification accuracy engine — **core shipped** via **pipe-1** + **acc-3.11**–**3.16**; remaining rows (**3.2**, **3.5**–**3.10**, **3.13**) open

- [ ] **acc-3.2** — **Per-business phrasing memory** — learn each business's recurring phrasings (build on entity memory ai-i2): "the usual", staff nicknames, service shorthand → bias classification

- [ ] **acc-3.5** — **Disagreement → escalate model** — when deterministic router and LLM classify disagree on a mutating intent, run a stronger model (e.g. escalate to a higher-tier model) as tie-breaker before acting
- [ ] **acc-3.6** — **Field-level confidence** — structured output returns confidence per param (action, date, provider, service); low-confidence *fields* (not whole command) drive targeted clarify (**acc-4**)

- [ ] **acc-3.7** — **Normalization upgrade** — extend `AiPromptNormalizationService`: spell-correction, abbreviation expansion, number/date word normalization, mixed-script splitting before classify
- [ ] **acc-3.8** — **Rescue rule expansion** — convert top recurring `suspected_miss` patterns from telemetry into deterministic rescues (no LLM cost), regression-tested in eval
- [ ] **acc-3.9** — **Multi-intent precision** — improve compound detection so "do X and Y" reliably decomposes; reduce false-compound on single-intent prompts (measured on ambiguity corpus)
- [ ] **acc-3.10** — **A/B prompt harness** — test system-prompt / few-shot variants against the eval set; promote the variant with best accuracy (ties into ai-e5 A/B infra)

### acc-3.4 — Semantic intent matching (replace brittle regex heuristics)

**Problem:** Context/paraphrase failures — when a user phrases a request with different words that convey the same meaning (e.g. "whoever has a gap soonest" vs "first available"), the deterministic rescue layer (`ai-intent-heuristics.ts`, `ai-intent-rescue.service.ts`) misses it because every phrasing must be anticipated by a hardcoded regex. Today this is handled by literal keyword/pattern heuristics; the better approach is matching by *meaning* instead.

- [ ] **acc-3.13** — **Per-business paraphrase learning** — feed confirmed corrections and recurring phrasings into the matcher via `AiEntityMemoryService` (build on **acc-3.2**) so a business's own shorthand resolves on the first try
- [~] **acc-3.15** — **Confidence + clarify fallback** — low semantic-match confidence routes to smart clarification (**acc-4**) instead of a wrong guess; wrong-execution guardrail stays < 1% — **partial** (**pipe-1.3** confidence gate + **pipe-1.6.2** clarify path)

### pipe-1 — Confidence-gated command understanding pipeline

**Goal:** Handle semantically equivalent requests with different wording. Heuristics + primary LLM for obvious cases; low-confidence / `unknown` escalates to embedding semantic match → re-rank → rescue → self-verify → structural enrich → validate → execute. Anchors (not phrase whitelists); no entity names in bank. Dashboard first; provider / customer / public via adapters. Implements **acc-3.11**–**3.16**, **acc-3.4**, **acc-3.15**, **acc-4.7** incrementally.

**Target flow:** normalize → fast heuristics → LLM classify → confidence gate → (low: semantic + re-rank + optional narrow re-classify) → rescue → self-verify → structural enrich → validate → execute → telemetry.

**Examples:** "Book me a haircut tomorrow" (classifier 99% → skip semantic) · "My hair is getting pretty long" (unknown 20% → semantic → `create_booking`) · "I think I need a trim soon" (unknown 35% → semantic → `create_booking`).


---

## Sprint 41 — AI accuracy: smart clarification & disambiguation

**Goal:** When uncertain, ask the **right** question instead of guessing wrong. A perfect clarify counts as an accurate outcome.

- [ ] **acc-4** — Smart clarification & disambiguation

- [ ] **acc-4.1** — **Ask only what's missing** — drive clarify from field-level confidence (**acc-3.6**) + completion validator; never re-ask known fields; render as form (extends ai-d4)
- [ ] **acc-4.2** — **Top-2 intent disambiguation** — when two intents are close, show a 2-choice chip ("Did you mean *cancel booking* or *reschedule booking*?") instead of a generic "rephrase"
- [ ] **acc-4.3** — **Entity disambiguation** — ambiguous person/service ("book with Anna" but 2 Annas; "massage" matches 3 services) → show specific options, not free-text re-ask

- [ ] **acc-4.4** — **Answer reuse** — clarification answers persist for the session and feed entity memory (ai-i2) so the same question is never asked twice
- [ ] **acc-4.5** — **Cross-turn slot merge** — merge clarify answers into the original intent without losing earlier params (extends session merge stage)
- [ ] **acc-4.6** — **Proactive confirm on high-risk** — for bulk/destructive intents, always preview + confirm with a plain-language summary ("This cancels 12 bookings and notifies 12 customers — proceed?")

- [ ] **acc-4.7** — **"I'm not sure" over wrong action** — when confidence stays low after one clarify, return an honest "I didn't fully understand — here's what I can do" with 2–3 suggested valid commands, rather than executing a guess
- [ ] **acc-4.8** — **Clarify quality metric** — track clarify→success-on-next-turn rate (target >90%); bad clarifies (led to abandon) feed back into **acc-2** labeling

---

## Sprint 42 — AI accuracy: execution verification & rollback

**Goal:** Correct intent ≠ correct result. Verify parameter resolution and execution, and auto-rollback when the result doesn't match the request.

- [ ] **acc-5** — Execution verification & rollback

- [ ] **acc-5.1** — **Resolution accuracy guard** — verify fuzzy-resolved entities (name→employeeId, service text→serviceId, date phrase→ISO) cleared a confidence threshold; ambiguous resolution → clarify, never silently pick
- [ ] **acc-5.2** — **Plan-vs-prompt check** — before executing a workflow plan, a verification pass confirms the plan's steps actually match the user's prompt (catches "right intent, wrong scope")
- [ ] **acc-5.3** — **Preview diff for mutations** — show the calendar/catalog diff before commit on medium-risk ops (extends ai-d9 plan diff), not just high-risk

- [ ] **acc-5.4** — **Post-exec assertion** — after execution, assert the world matches intent (e.g. booking exists at requested time with requested provider); mismatch → auto-flag + offer rollback
- [ ] **acc-5.5** — **Auto-rollback on assertion failure** — reuse undo/workflow execution log (ai-d7 / gap-3.7) to revert when post-exec assertion fails; surface clear error to user
- [ ] **acc-5.6** — **Idempotency + conflict re-validation** — re-check schedule conflicts and duplicates at execute time (not just classify time); reject stale plans rather than double-book

- [ ] **acc-5.7** — **Blast-radius cap** — hard limits on a single AI command (max N bookings cancelled, max N providers, max date range); over cap → force explicit confirm or split
- [ ] **acc-5.8** — **Dry-run mode for new intents** — newly added intents ship in "propose-only" until they hit an accuracy bar on real traffic, then graduate to auto-execute (ties to ai-e5 thresholds)

---

## Sprint 43 — AI accuracy: continuous learning loop & escalation

**Goal:** Close the loop so the system keeps improving toward 99% automatically, and the last 1% escalates gracefully to a human instead of acting wrongly.

- [ ] **acc-6** — Continuous learning loop & escalation

- [ ] **acc-6.1** — **Weekly accuracy review job** — auto-compile: new failures, regressions, top confused intents, locales below target → posted to an internal review (email / dashboard)
- [ ] **acc-6.2** — **Failure → eval → fix pipeline** — every triaged failure becomes (a) a new eval case (**acc-2**) and (b) either a rescue rule (**acc-3.8**), a few-shot example (**acc-3.1**), or a prompt fix — tracked to closure
- [ ] **acc-6.3** — **Auto-alias suggestions** — recurring entity corrections become suggested aliases for admin one-click approval into entity memory (ai-i2)
- [ ] **acc-6.4** — **Accuracy ratchet** — each release raises the CI accuracy floor (**acc-2.9**) toward 99%; dashboard tracks progress on the accuracy ladder

- [ ] **acc-6.5** — **Human handoff on repeated failure** — after 2 failed clarifies on the same task, offer "Get help" → routes to staff/owner (dashboard) or support ticket (customer, reuses Zendesk gap-4.2); ties to human-in-the-loop SLA (ai-e7)
- [ ] **acc-6.6** — **Suggested-action fallback** — when classification truly fails, show the closest valid commands as one-tap chips so the user still completes the task
- [ ] **acc-6.7** — **Escalation analytics** — track escalation rate as the inverse of accuracy; target < 1% of prompts escalate; review escalations weekly for new eval cases

- [ ] **acc-6.8** — **99% gate met** — rolling 30-day: no-clarify completion ≥ 90%, (completion + good-clarify) ≥ 99%, wrong-execution rate < 1%, all three locales within 3 points of each other; documented in accuracy dashboard

### AI accuracy success metrics (Sprints 38–43)

| Metric | Baseline | Target |
|--------|----------|--------|
| Accurate execution rate (correct exec **or** good clarify) | ~80% | **≥ 99%** |
| No-clarify completion rate | ~75% | ≥ 90% |
| Wrong-execution rate (undo / 👎 / corrected) | unknown | < 1% |
| Clarify → success on next turn | ~?? | > 90% |
| Per-locale accuracy spread (EN vs HY vs RU) | unknown | < 3 pts |
| Escalation rate (human handoff) | n/a | < 1% |
| Eval set size (labeled golden cases) | hundreds | 2,000+ |

---

# Apps Adoption Program — near-99% adoption (Sprints 44–49)

**Goal:** Move the **customer (consumer app + public booking web) and mobile (consumer app + provider app)** experiences from "shipped" to "habitually used." Drive the full adoption funnel toward best-in-class, with the technically-bounded rates at **≥ 99%**: install→activation completion, push opt-in deliverability, crash-free sessions, and notification reach.

**Core principle:** Adoption = (they install) × (they activate) × (they come back) × (they invite others). Every drop-off is **measured before it is fixed**. A feature only counts as "adopted" when telemetry shows real users completing it — not when it ships.

### Adoption ladder (how we climb)

| Stage | What it means | What unlocks it |
|-------|---------------|-----------------|
| Baseline (today) | Apps shipped: consumer app (**gap-2.5**), provider app (Sprints 19–22), deep links, Firebase auth, provider push + offline | — |
| **Stage 1** | We can *see* the funnel | Adoption telemetry (**adopt-1**) |
| **Stage 2** | More installs that activate | Acquisition + attribution (**adopt-2**) + frictionless activation (**adopt-3**) |
| **Stage 3** | Users come back | Retention, **consumer push**, lifecycle (**adopt-4**) |
| **Stage 4** | Fast, reliable, trusted | Performance + crash-free + ratings (**adopt-5**) |
| **Stage 5** | The funnel compounds | Referral + habit loops; exit gate (**adopt-6**) |

**Why this order:** like the AI Accuracy Program, you cannot improve what you cannot measure. Funnel telemetry (**adopt-1**) ships first; every later sprint is scored against the same funnel so adoption never silently drops.

**Builds on existing infra (do not rebuild):** consumer `deep-link.ts` / `customer-auth.ts` / `recent-salons.ts` / `branding.ts` / `tenant-locale.ts` / `product-recommendation-analytics.ts` / `google-auth.ts`; provider `provider-native-push.util.ts` / `provider-push-deep-link.util.ts` / `provider-push-foreground.util.ts` / `offline-queue.ts` / `use-online-status.ts`; backend `analytics` module + `AiEventsService` + event-store; marketing-automation + loyalty + promo-codes modules; store listings (**gap-1.5**, **gap-2.5.10**); push & offline (**gap-2.1**, **gap-2.3**); onboarding (**gap-6.1**).

> **Note (per `.cursor/rules/feature-ai-prompt-coverage`):** every adoption feature that is user-visible on the customer or provider surface also needs AI command coverage (classifier rules + eval cases, EN/HY/RU). See **adopt-6.6 / adopt-6.7**.

---

## Sprint 44 — Apps adoption: telemetry & funnel measurement

**Goal:** Instrument both mobile apps and the public booking web so the full adoption funnel — install → first open → sign-in → first booking → repeat booking → referral — is measurable per tenant, platform, and locale. **Nothing else in this program works without this.**

- [ ] **adopt-1** — Adoption telemetry & funnel measurement foundation

- [ ] **adopt-1.1** — Lightweight `analytics` client in consumer + provider apps (extend the existing `product-recommendation-analytics.ts` pattern): typed `track(event, props)` → batched `POST /events/app`; events: `app_installed`, `app_opened`, `signed_in`, `viewed_salon`, `started_booking`, `completed_booking`, `rebooked`, `referral_sent`. Consent-gated (GDPR **compliance-1**) — no PII, businessId + anonymous deviceId only
- [ ] **adopt-1.2** — Session + device context — platform (iOS/Android/web), app version, locale, tenant slug, cold vs warm start, first-open vs returning; attach to every event
- [ ] **adopt-1.3** — Backend `app_event` sink — table + ingest endpoint (reuse event-store / `ai_command_trace` migration pattern); indexes on `(businessId, event, createdAt)`, `(platform)`, `(anonId)`; redact + rate-limit

- [ ] **adopt-1.4** — Funnel builder — install→open→sign-in→first-booking→repeat conversion per step; drop-off attribution per platform/locale/tenant
- [ ] **adopt-1.5** — Retention cohorts — D1/D7/D30 return rate; "booked again within 30/60/90 days"; resurrection (win-back) cohort
- [ ] **adopt-1.6** — Activation definition — "activated user" = installed + signed in + ≥1 completed in-app booking within 7 days; track activation rate as the north-star sub-metric
- [ ] **adopt-1.7** — Adoption dashboard — extend backend `analytics` module + a dashboard page (mirror the AI-ops accuracy dashboard): funnel, cohorts, push opt-in rate, crash-free %, referral K-factor; alert when weekly activation drops > 2 pts

---

## Sprint 45 — Apps adoption: acquisition & install funnel

**Goal:** Turn intent into installs that attribute correctly, and make the web→app handoff seamless so customers land in the right salon on the first try.

- [ ] **adopt-2** — Acquisition & install funnel

- [ ] **adopt-2.1** — App Store / Play Store optimization — localized titles, keywords, screenshots, preview video per locale (EN/HY/RU); build on listings (**gap-1.5**, **gap-2.5.10**)
- [ ] **adopt-2.2** — Ratings & reviews flow — in-app prompt at peak-happiness (after a completed booking); route happy → store review, unhappy → support (Zendesk **gap-4.2**); never prompt mid-task

- [ ] **adopt-2.3** — Smart app banner on public booking web — "Open in app" / "Get the app" carrying a deferred deep link to the same salon + service
- [ ] **adopt-2.4** — Deferred deep links + install attribution — capture intended salon/service before install, restore on first open (extend consumer `deep-link.ts`); attribute install source (QR / link / referral / ad)
- [ ] **adopt-2.5** — QR at venue / on receipts & confirmations — per-tenant QR → install or open app pre-scoped to that salon
- [ ] **adopt-2.6** — Universal Links + Android App Links verification — https links open the app directly (no chooser), graceful web fallback

- [ ] **adopt-2.7** — Recent / saved salons home (extend `recent-salons.ts`) — one-tap return to previously-booked salons
- [ ] **adopt-2.8** — Low-friction tenant switch — remembered tenants list, switch without re-login (build on `customer-auth.ts` + `tenant-locale.ts`)

---

## Sprint 46 — Apps adoption: activation & onboarding

**Goal:** Get a new install to its first completed booking in the fewest taps; remove sign-in friction; earn the push opt-in.

- [ ] **adopt-3** — Activation & onboarding

- [ ] **adopt-3.1** — One-tap social / passwordless — Apple + Google sign-in parity on both apps (build on Firebase auth + `google-auth.ts`); phone-OTP fallback; **guest → account merge** so a guest booking is never lost on sign-up
- [ ] **adopt-3.2** — Prefill & autofill — name/email/phone autofill, SMS-OTP autofill, saved payment where available; minimize keyboard entry

- [ ] **adopt-3.3** — First-run value screen — skip generic carousels; land on the intended salon (from deep link) or recent salons; show "book in 3 taps"
- [ ] **adopt-3.4** — Time-to-first-booking guided flow — Welcome→Salon→Service→Slot→Confirm with nearest-available pre-selected and a progress indicator
- [ ] **adopt-3.5** — Push opt-in priming — soft pre-prompt explaining value (reminders, "your slot is confirmed") before the OS dialog; ask only after the first booking; track opt-in rate (target ≥ 80%)

- [ ] **adopt-3.6** — Wire activation events into the funnel (**adopt-1**); A/B onboarding variants; abandonment recovery — resume an unfinished booking on next open

---

## Sprint 47 — Apps adoption: retention & re-engagement

**Goal:** Bring customers back. The consumer app currently has **no push** — add the full consumer push lifecycle, plus lifecycle campaigns and home-screen presence.

- [ ] **adopt-4** — Retention & re-engagement

- [ ] **adopt-4.2** — Transactional push — booking confirmed, reminder (24h / 2h), rescheduled/cancelled, result-ready (clinic), gift-card received; deep-link into the right screen (extend `deep-link.ts`)
- [ ] **adopt-4.3** — Push deep-link + foreground handling parity with the provider app (`provider-push-deep-link.util.ts`, `provider-push-foreground.util.ts`)

- [ ] **adopt-4.4** — Rebooking nudges — "time for your next appointment" based on service cadence; build on the marketing-automation module
- [ ] **adopt-4.5** — Win-back — lapsed-customer campaign (no booking in N days) with optional incentive (loyalty / promo)
- [ ] **adopt-4.6** — Loyalty + offers surfacing — show points/rewards and active promos in-app (loyalty + promo-codes modules) to create a reason to return

- [ ] **adopt-4.7** — Home-screen widgets — next appointment + quick rebook (iOS WidgetKit / Android App Widget)

- [ ] **adopt-5.6** — Accessibility & localization QA — VoiceOver/TalkBack, dynamic type, RTL-safe, full EN/HY/RU coverage on every adoption surface

---

## Sprint 49 — Apps adoption: growth loops, habit & exit criteria

**Goal:** Make adoption compound through referrals and habit, add AI command coverage for the new surfaces, and lock the program's exit gate.

- [ ] **adopt-6** — Growth loops, habit & exit criteria

- [ ] **adopt-6.3** — Review solicitation loop — post-visit review prompt feeding tenant reputation; route to store review at peak-happiness (ties **adopt-2.2**)

- [ ] **adopt-6.8** — **Adoption gate met** — rolling 30-day: install→activation ≥ 60%, push opt-in ≥ 80%, crash-free sessions ≥ 99.5%, D30 retention and referral K-factor trending up, all three locales within 3 pts; documented on the adoption dashboard

### Apps adoption success metrics (Sprints 44–49)

| Metric | Baseline | Target |
|--------|----------|--------|
| Install → activation (signed in + 1st booking ≤ 7d) | unknown | ≥ 60% |
| Push opt-in rate (after priming) | n/a (consumer app has no push) | ≥ 80% |
| Crash-free sessions (both apps) | unknown | ≥ 99.5% |
| Notification deliverability | n/a | ≥ 99% |
| D30 retention (booked again ≤ 30d) | unknown | trending ↑ |
| Referral K-factor | 0 | > 0.2 |
| Per-locale adoption spread (EN vs HY vs RU) | unknown | < 3 pts |
| Adoption telemetry coverage (key funnel events instrumented) | ~0% (rec events only) | 100% |

---

# Near-99% Targets Program — clarify, completion, activation, push opt-in (Sprints 50–53)

**Goal:** Push four headline rates from their base-program targets to **near 99%**:

| Metric | Base-program target | This program |
|--------|--------------------:|-------------:|
| Clarify → success on next turn | > 90% (**acc-4**) | **near 99%** |
| No-clarify completion rate | ≥ 90% (acc ladder) | **near 99%** |
| Install → activation (signed in + 1st booking ≤ 7d) | ≥ 60% (**adopt-3**) | **near 99%** |
| Push opt-in rate (after priming) | ≥ 80% (**adopt-3.5**) | **near 99%** |

**This is a stretch tier on top of the AI Accuracy (Sprints 38–43) and Apps Adoption (Sprints 44–49) programs — do those first.** The last few points are the hardest; each sprint below names the levers *and* the honest denominator that makes 99% real instead of vanity.

**Guardrail (non-negotiable):** chasing these numbers must not break correctness or trust — wrong-execution stays **< 1%** (**acc-5**) and no dark-pattern opt-ins. A metric "won" by doing the wrong thing or nagging users is a regression, not a win.

---

## Sprint 50 — Near-99%: clarify → success on next turn

**Lever thesis:** when we *do* ask, the next turn should almost always succeed — because we ask the *right* question as a *tappable* choice, carry every known param, and resolve the answer deterministically.

- [ ] **n99-1** — Clarify → success on next turn → near 99%

- [ ] **n99-1.1** — Structured clarify controls — render every clarify as the right input, not free text: date picker, provider chips, service chips, time-slot list (extend clarify-as-form `ai-command-wizard.tsx`, ai-d4); a tap resolves deterministically
- [ ] **n99-1.2** — Pre-resolved option sets — for entity ambiguity (2 Annas, 3 "massage" services) show the concrete catalog candidates, never a "type the name again" re-ask (**acc-4.3**)

- [ ] **n99-1.6** — Localized + voice/typo-tolerant answers — parse EN/HY/RU and voice-to-text answers ("tomrw", "2pm", "Աննա" all resolve); extend normalization **acc-3.7**


## Sprint 51 — Near-99%: no-clarify completion rate

**Lever thesis:** the best clarify is the one you didn't need — resolve correctly *without asking* by inferring high-confidence defaults, while **never** raising wrong-execution.

- [ ] **n99-2** — No-clarify completion → near 99%

- [ ] **n99-2.1** — High-confidence auto-fill — when a missing param is strongly inferable (last provider, "the usual" service, business default duration, current-screen context), fill it and proceed instead of clarifying; gated by field confidence (**acc-3.6**) and risk tier
- [ ] **n99-2.2** — Screen/context grounding — pass the current app context (the booking/customer/service on screen) into the command so "book this", "cancel it", "remind her" resolve without asking

---

## Sprint 52 — Near-99%: install → activation

**Lever thesis:** an install that arrived *to book a specific salon* should almost always reach a completed first booking — by restoring intent and removing every step between open and confirm.

**Reality / denominator:** 99% is meaningful on **intent-qualified installs** (deferred deep link carrying a target salon/service, **adopt-2.4**). Cold / ad / curiosity installs get a separate, lower bar — don't average them into this number.

- [ ] **n99-3** — Install → activation (intent-qualified, ≤ 7d) → near 99%

- [ ] **n99-3.1** — Deferred deep-link resume — after install, land directly on the intended salon→service→slot→**confirm** (extend `deep-link.ts` + **adopt-2.4**); no re-navigation, no re-search
- [ ] **n99-3.2** — One-tap sign-in + guest→account merge — Apple/Google one-tap (**adopt-3.1**); a guest can complete the booking and the account merges after, so sign-in is never a wall before activation
- [ ] **n99-3.3** — Pre-filled, payment-optional booking — slot pre-selected; pay-at-venue / pay-later fallback so a payment hiccup never blocks the first booking (activation ≠ payment)

- [ ] **n99-3.4** — Abandonment resume — reopen an unfinished booking exactly where it was left on next app open (**adopt-3.6**)
- [ ] **n99-3.5** — Activation concierge nudges — if not activated within 24h / 72h, a single well-timed push/email with a one-tap resume link (consumer push **adopt-4.1** + marketing-automation module)
- [ ] **n99-3.6** — Dead-end audit — instrument every step of the qualified-install funnel (**adopt-1.4**); any step with > 1% drop gets a fix ticket

### parity-2.1 — Gap closure by module

**Inventory source:** **`ai-cmd-dashboard-6`** REST audit (below) + **`ai-cmd-ext`** action tables + `ai-capability.matrix.ts` vs dashboard UI routes — close every gap in **parity-2.1**–**2.3** before **parity-4** CI gate. Cross-ref **ai-cmd-ext-gap-1**, **ai-cmd-ext-gap-4**–**6**, **ai-cmd-customer-gap-1**, **ai-cmd-customer-gap-5**.
- [ ] **parity-2.1** — **Owner / manager dashboard gaps** — add intents for every uncovered owner/manager dashboard action (settings, integrations, billing, staff ops, reports, marketing, loyalty) with handlers, registry bindings, `tiers`, `surfaces`, and `mutating` / `executionMode` flags
- [ ] **parity-2.2** — **Staff / provider gaps** — add uncovered provider-app + staff-scoped dashboard actions (own schedule, assigned bookings, check-in, notes, breaks), honoring `STAFF_SCOPED_INTENTS` so staff only act within their own scope
- [ ] **parity-2.3** — **Customer / public gaps** — add uncovered self-service + public actions (manage/reschedule/cancel own bookings, profile, payment methods, packages/subscriptions, loyalty, notification preferences, gift cards)

- [ ] **parity-2.4** — Each new intent ships classifier rules + **EN/HY/RU** eval cases in `eval/ai-command-eval.cases.ts`, tagged with `surface` + expected `tier`

- [ ] **parity-3.2** — **Goal → multi-step execution** — e.g. "set up my new stylist end-to-end" decomposes into `create employee → assign services → set schedule → enable online booking`, each a permission-checked intent under one preview/confirm


### AI feature parity success metrics (Sprints 55–58)

| Metric | Baseline | Target |
|--------|----------|--------|
| Feature → intent coverage (per role / surface) | partial (~270 intents, unmeasured) | **100%** |
| Allow/deny divergence (UI vs AI) | unknown | **0** |
| Multi-step role tasks completed by agent (labeled set) | n/a | **≥ 95%** |
| New feature shipped without an intent (CI escapes) | occurs | **0** |
| Per-locale parity on new intents (EN / HY / RU) | — | **100%** |

---

# Provider App Expansion Program — richer data & at-chair features (Sprints 59–62)

**Goal:** Extend **`provider-app/`** from schedule-centric + AI into the primary **at-chair** and **floor** tool for stylists and managers — richer customer context, operational data, and lightweight actions staff need between appointments — **without** porting the full dashboard.

**Baseline (shipped today):**

| Area | What exists |
|------|-------------|
| **Tabs** | Today, Calendar, Schedule, Profile, Gift cards (+ clinic: lab collection, results, tasks, patients when vertical enabled) |
| **Bookings** | List + detail modal — status, payment, reschedule, cancel, payment breakdown; team vs own view for managers |
| **Profile** | Avatar, title, reviews summary, push toggle |
| **AI** | Floating assistant, suggestions, offline queue, voice, push deep-links + foreground actions |
| **Backend** | `GET/PUT .../provider/bookings/*`, profile, reviews, schedule summary, push, clinic queues, AI command gateway |

**Out of scope (stay on dashboard web):** full CRM admin, billing/plan settings, marketing automation config, inventory catalog editing, enterprise trust, strategy eval.

**Policy:** Every user-visible slice needs unit + integration tests (`feature-test-coverage.mdc`). Staff-facing AI needs `PROVIDER_INTENT_SCHEMA` rules + eval cases tagged `surface: provider` (`feature-ai-prompt-coverage.mdc`). UI copy EN/HY/RU in `provider-app-i18n.ts` + `frontend/src/i18n/messages/*` `provider.*` keys.

- [ ] **prov-exp** — Provider app expansion (Sprints 59–62) — **AI command backlog:** **ai-cmd-provider-5** + **API parity:** **ai-cmd-provider-6**

## Sprint 62 — Waitlist, growth visibility & polish

- [ ] **prov-exp-8.1** — **Waitlist panel** — staff-scoped list of waitlist entries for their services; tap offer slot when cancellation opens gap (reuse waitlist offer API from dashboard)
- [ ] **prov-exp-8.2** — **Rebooking candidates** — after cancel/no-show, show top 3 waitlist + last-regular clients; one-tap AI draft message (manager send or copy)

### Provider app expansion success metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Booking detail → customer context shown | name + service only | loyalty, history, notes, badges |
| Check-in usage (providers with ≥1 booking/day) | 0% | ≥ 40% |
| Retail attach via provider app | 0% | ≥ 10% of retail lines |
| Manager team-floor weekly active | n/a | ≥ 50% of manager seats |
| Provider AI intents for new slices | partial | 100% with eval EN/HY/RU |

---

## ai-guide-1 — In-app AI Helper (product guide & contextual how-to)

**Goal:** Extend existing AI assistants into a **friendly in-app guide** that answers product questions, explains features, and walks users through flows **step by step** — using current screen, role, and business context. Guide responses are **read-only by default**; explicit “do it for me” phrasing may hand off to existing mutate intents.

**Product principles:**

| Principle | Rule |
|-----------|------|
| **Context-first** | Prefer route / screen / onboarding step / checkout step / `screenContext` over generic FAQ |
| **Accurate** | Ground answers in guide corpus + capability matrix — no invented routes, settings, or permissions |
| **Concise** | Short summary + numbered steps; optional deep link (`navigate`) per step |
| **Friendly** | Conversational tone; locale-aware (EN/HY/RU) |
| **Safe** | Guide mode must not mutate data unless user clearly requests an action |

**Baseline (today):**

| Asset | Status | Gap |
|-------|--------|-----|
| Static guide UI | `/dashboard/guide` + `guide.*` i18n | Not conversational; not on mobile |
| Dashboard context | `AiPageContext`, `AI_ROUTE_CONTEXT_HINTS` in `ai-orchestration.ts` | Biased toward **actions**, not explain/help |
| Public booking | `booking_help`, checkout explain intents (partial) | No step-aware flow guide across all booking steps |
| Provider mobile | `ProviderAiAssistant` + `screenContext` | Scattered `explain_*` proposed (**ai-cmd-provider-5.21**, **5.24**) — not unified |
| Customer mobile | `how_to_download_app`, adoption copy | No general “how does this app work?” guide |
| **Consumer app UI** | Tab shell + `ConsumerBookingAssistant` | **No native guide screen** — only activation onboarding + booking progress |
| **Provider app UI** | `ProviderAiAssistant` + tab routes | **No native guide screen** — FAQ only via AI (not shipped) |
| Knowledge source | Ad hoc classifier rules + static strings | No shared retrieval corpus or grounding verifier |

**Architecture (target):**

```
User question → normalize → isGuidePrompt? (heuristics)
  → yes: retrieve guide snippets (route + role + vertical)
       → LLM synthesize (grounded) → steps + navigate + relatedActions
  → no: existing pipe-1 classify → validate → execute (mutate/read ops)
```

| Layer | Where | Notes |
|-------|-------|-------|
| Corpus | `backend/src/modules/ai/guide/` + synced from `frontend` guide i18n | Topic ids stable across locales |
| Router | `ai-product-guide.util.ts` — `isProductGuidePrompt`, topic extract | pipe-1.2 deterministic-first |
| Service | `AiProductGuideService` | Dashboard dispatch; provider/customer/public siblings |
| Intents | `explain_app_feature`, `guide_user_flow`, `explain_current_screen` | Per-surface action names where UI differs |
| UI | Command bar / provider sheet / consumer assistant | Guide chip, step progress, “Do this for me” handoff |
| Quality | `ai-product-guide.fixtures.ts`, eval, **`test:ai-guide`** | All four surfaces mandatory |

**Related (do not duplicate — wire into this epic):** **ai-cmd-customer-4.2.6** (`explain_checkout_steps`), **ai-cmd-provider-5.21** / **5.24** (provider FAQ), **ai-cmd-ext-2.30**–**2.32** (explain setup), **adopt-3** (consumer onboarding), **gap-6.1** (dashboard onboarding), Sprint **18** (**ai-d21**, **ai-d24**, **ai-d25**), **polish-2** (optional Zendesk embed).

- [x] **ai-guide-1.0.1** — Guide vs action taxonomy — document `guide_*` / `explain_*` vs mutate intents; disambiguation table in `ai-product-guide.util.ts`
- [x] **ai-guide-1.0.2** — `isProductGuidePrompt` fast heuristics (pipe-1.2) — “how do I”, “where is”, “what does … mean”, “walk me through”, “help me with this page”
- [x] **ai-guide-1.0.3** — Optional request flag `assistantMode: 'guide' | 'act'` on all four assistant APIs; default infer from prompt when omitted
- [x] **ai-guide-1.0.4** — Shared `GuideResponse` shape — `{ summary, steps[], navigate?, relatedActions?, topicId?, sources[] }` in `command-completion.types.ts`
- [x] **ai-guide-1.0.5** — Misroute guard — question-shaped prompts must not hit bulk mutate intents (rescue → guide)

- [x] **ai-guide-1.1.1** — Structured corpus from `frontend/src/i18n/messages/*/guide.*` + dashboard guide page TOC — stable `topicId` per section
- [x] **ai-guide-1.1.2** — Per-route flow playbooks — `guide-flows/dashboard/*.json`, `guide-flows/provider/*.json`, `guide-flows/customer/*.json`, `guide-flows/public/*.json` (ordered steps + `navigate` targets)
- [x] **ai-guide-1.1.3** — Vertical overlays — clinic lab/EMR, tour checkout, retail POS — merge into corpus by `business.vertical`
- [x] **ai-guide-1.1.4** — Role overlays — owner vs receptionist vs provider vs customer; hide manager-only topics from employee scope
- [x] **ai-guide-1.1.5** — EN/HY/RU parity for every `topicId` — mirror **i18n-clinic-v2** / **lang-1** patterns (dashboard corpus — `ai-guide-corpus.spec.ts`)
- [x] **ai-guide-1.1.6** — CI gate **`test:ai-guide-corpus`** — every dashboard nav route in `AI_ROUTE_CONTEXT_HINTS` has ≥1 playbook or explicit `no-guide` tag

- [x] **ai-guide-1.2.1** — `AiProductGuideService` — retrieve + rank snippets by `{ route, role, vertical, locale, topicId? }`
- [x] **ai-guide-1.2.2** — Registry intents **`explain_app_feature`**, **`guide_user_flow`**, **`explain_current_screen`** — `surfaces: ['dashboard']`, tier **R**
- [x] **ai-guide-1.2.3** — Handlers in `ai-product-guide.logic.ts` — deterministic playbook steps first; LLM polish only when corpus match confidence ≥ threshold
- [x] **ai-guide-1.2.4** — Grounding verifier — reject / clarify when synthesized answer cites unknown route, setting, or intent id
- [x] **ai-guide-1.2.5** — “Do this for me” handoff — map final guide step → existing mutate intent + prefilled params (e.g. guide “enable online payment” → `configure_service_online_payment`)
- [x] **ai-guide-1.2.6** — Wire **`AiCommandService`** dispatch + **`INTENT_SCHEMA`** appendix rules

- [x] **ai-guide-1.3.1** — `AiCommandBar` — **Help** / guide mode chip; first-open suggestions mix guide + action examples per route
- [x] **ai-guide-1.3.2** — Extend `buildAiCommandBarExamples` — contextual “How do I … on this page?” variants from playbooks
- [x] **ai-guide-1.3.3** — Multi-step guide UI — numbered steps, “Next step” / “Open in app” using `navigate` from response
- [x] **ai-guide-1.3.4** — Cross-link `/dashboard/guide#…` anchors ↔ conversational `topicId`
- [x] **ai-guide-1.3.5** — Onboarding variant — when `variant="onboarding"`, prefer setup playbooks (**gap-6.1**, **ai-d21**)

- [x] **ai-guide-1.4.1** — Provider intents — ship **ai-cmd-provider-5.21.1**–**5.21.4**, **5.24.2**, **5.24.4** under unified guide handlers (not one-off strings)
- [x] **ai-guide-1.4.2** — Pass `screenContext` + `mobileRoute` into guide retrieval — Today vs Calendar vs Clients vs Profile
- [x] **ai-guide-1.4.3** — Contextual suggestion chips on `ProviderAiAssistant` — “What’s on Today?”, “How do I mark paid?”, “Block vs time off?” (guide-mode examples + chip; backend handlers **1.4.1** still open)
- [x] **ai-guide-1.4.4** — Voice-friendly step summaries (**5.24.5**) reuse guide playbooks

- [x] **ai-guide-1.5.1** — Extend **`booking_help`** → full booking funnel guide (**ai-cmd-customer-4.2.6**) — step-aware by public booking route / consumer screen
- [x] **ai-guide-1.5.2** — Customer intents **`explain_app_feature`**, **`guide_user_flow`** — tabs, profile, packages, subscriptions, gift cards (read-only)
- [x] **ai-guide-1.5.3** — Public assistant — checkout-step context (`professionals` → `services` → `checkout`) drives playbook selection
- [x] **ai-guide-1.5.4** — Consumer activation guide aligned with **adopt-3.4** — welcome → salon → service → slot → confirm
- [x] **ai-guide-1.5.5** — HY/RU guide corpus for top 20 customer/public flows

- [x] **ai-guide-1.6.1** — `ai-product-guide.fixtures.ts` — `APP_GUIDE_CLASSIFIER_RULES`, `PROVIDER_APP_GUIDE_CLASSIFIER_RULES`, `CUSTOMER_APP_GUIDE_CLASSIFIER_RULES`, `PUBLIC_APP_GUIDE_CLASSIFIER_RULES`
- [x] **ai-guide-1.6.2** — ≥10 NL prompt variants **per surface** per top-20 flows (`SIMILAR_APP_GUIDE_PROMPTS` with `id`, `surface`, `topicId`)
- [x] **ai-guide-1.6.3** — Rescue + enrich — `rescueProductGuideIntent`, `enrichGuideTopicFromPrompt` on each assistant entry path
- [x] **ai-guide-1.6.4** — Eval cases in `eval/ai-command-eval.cases.ts` — tag `surface: dashboard | provider | customer | public`; EN/HY/RU
- [x] **ai-guide-1.6.5** — Gate **`npm run test:ai-guide`** — unit + integration + corpus parity + eval slice (dashboard eval seeds; four-surface eval **1.6.4** still open)
- [x] **ai-guide-1.6.6** — Compound: “explain then do” — e.g. `guide_user_flow` → `configure_service_online_payment` when user confirms (dashboard command bar handoff)

- [x] **ai-guide-1.7.1** — Optional Zendesk / help-center article ids per `topicId` (**polish-2**)
- [x] **ai-guide-1.7.2** — “Still stuck?” — support handoff with `{ surface, route, topicId, locale }` snapshot (no PII)
- [x] **ai-guide-1.7.3** — Telemetry — guide topic opened, steps completed, handoff-to-action rate, grounding failures (**acc-1**)
- [x] **ai-guide-1.7.4** — Dashboard AI Ops — top unanswered guide topics for corpus expansion

### ai-guide-1 — Suggested implementation order

| Phase | IDs | Rationale |
|-------|-----|-----------|
| **A — Foundation** | **1.0**, **1.1**, **1.2** | Corpus + routing before UI |
| **B — Dashboard MVP** | **1.3**, **1.6** (dashboard slice) | Command bar guide on top 10 routes |
| **C — Mobile surfaces** | **1.4**, **1.5**, **1.6** (provider/customer/public) | Four-surface parity |
| **D — Polish** | **1.7**, compounds **1.6.6** | Support + “explain then do” |
| **E — Hardening** | **1.8** | Boundaries, session, failure fallback, maintenance CI |
| **F — Mobile guide UI** | **1.9** | Native guide screens in **consumer-app** + **provider-app** |

- [ ] **ai-guide-1** — Mark epic `[x]` only when **1.0**–**1.6** and **1.9** are green on **all applicable surfaces** per **feature-ai-prompt-coverage** + **feature-test-coverage**

### ai-guide-1.8 — Cross-cutting gaps (recommended before epic close)

> **Audit (2026-06):** **1.0**–**1.7** cover the happy path; these rows close boundaries with existing **`explain_*`** domain intents, pipe-1 clarify, plan gates, and maintenance.

| Gap | Why it matters | Close with |
|-----|----------------|------------|
| Domain vs app guide | **40+** existing `explain_*` intents (tax, checkout, tour, clinic…) answer *domain* questions — not “where in the UI?” | **1.8.1** routing table |
| Multi-turn flows | Step-by-step needs session carry (`guideFlowId`, `guideStepIndex`) across turns | **1.8.2** |
| Failed / confused user | After validator error, `unknown`, or low confidence — user asks “what now?” | **1.8.3**, **n99-1**, **acc-4** |
| Plan / module gates | **gap-6.2** hides AI Ops, integrations — guide must explain locked features without hallucinating access | **1.8.4** |
| Registry parity | Guide intents need matrix rows + validator params like every other action | **1.8.5** |
| All-surface dispatch | **1.2.2** lists dashboard only — provider/customer/public registry + handlers still open | **1.8.6** |
| Meta-AI help | Users ask about the assistant itself (chips, approval swipe, settings) | **1.8.7** |
| Corpus drift | UI/route changes without playbook updates → wrong guidance | **1.8.8** |

- [x] **ai-guide-1.8.1** — **`explain_*` vs `guide_*` routing** — document + enforce: domain explainers (tax, currency, checkout totals) stay on existing handlers; **`explain_app_feature` / `guide_user_flow`** only for navigation, setup flows, and UI semantics; shared rescue disambiguation fixtures
- [x] **ai-guide-1.8.2** — Multi-turn guide session — `guideFlowId`, `guideStepIndex`, `completedSteps[]` in dashboard + public + customer + provider session merge; “next step” / “go back” / “start over” prompts
- [x] **ai-guide-1.8.3** — Post-failure guide fallback — when classify → `unknown`, validator clarify, or handler `success: false`, append contextual guide snippet (“Here's how to … on this page”) — wire **acc-4.7**, **n99-1**
- [x] **ai-guide-1.8.4** — Tier / module-gated topics — playbook metadata `requiresPlan`, `requiresModule`; honest “not available on your plan” + upgrade path copy (**gap-6.2**, **gap-7.1**)
- [x] **ai-guide-1.8.5** — Registry + **`access-control.matrix.ts`** + **`command-completion.validator.ts`** rows for all guide intents; **`test:ai-cmd-ext`** handler coverage on four surfaces
- [x] **ai-guide-1.8.6** — Provider / customer / public **`AiProductGuideService`** dispatch — mirror **1.2.6** in `ProviderAiCommandService`, `CustomerAiCommandService`, `PublicBookingAssistantService` (surface-specific action names where verbs differ)
- [x] **ai-guide-1.8.7** — Meta-guide intents — **`explain_ai_settings`**, **`explain_ai_suggestions`**, **`explain_assistant_approval`** (dashboard diff preview + provider swipe confirm); map suggestion chip id → playbook step
- [x] **ai-guide-1.8.8** — Corpus maintenance CI — on `frontend` nav / guide page / mobile route change, fail **`test:ai-guide-corpus`** until playbook or `no-guide` updated (**parity-4** pattern)
- [x] **ai-guide-1.8.9** — Permission / empty-state guides — “Why can't I see …?”, “No services shown”, “Stripe not connected” — tie to live business settings + integration health, not static FAQ
- [x] **ai-guide-1.8.10** — AI unavailable / quota — when OpenAI disabled or over limit (**ai-0.2**), static fallback to native guide screen + section anchor (**1.9**) or dashboard `/dashboard/guide` — offline provider cache (**5.24.1**)

**Also wire (no new epic — cross-ref only):** **compliance-1** / **explain_data_rights** (privacy copy in guide), **fmt-1** / **tax-1** / **curr-1** (settings explainers stay domain handlers), **ai-cmd-ext-7** (customer read-only mirror when dashboard setting changes UX).

### ai-guide-1.9 — Native in-app guide UI (**consumer-app** + **provider-app**)

**Goal:** Ship scrollable **Help & guide** screens in both mobile apps — same `topicId`s as **`ai-guide-1.1`** corpus, readable **offline**, linked from profile/account and from AI `navigate` responses. Conversational guide (**1.4**, **1.5**) and static guide share one content source.

**Architecture:**

| Layer | Consumer app | Provider app |
|-------|--------------|--------------|
| Route | `/s/:slug/guide` (+ optional `?topicId=`) | `/tabs/profile/guide` (+ `?topicId=`) |
| Entry | Account tab · assistant chip · welcome CTA (**adopt-3**) | Profile · assistant chip · accept-invite footer |
| Content | `guide-flows/customer/*.json` (+ clinic vertical overlay) | `guide-flows/provider/*.json` (+ clinic / gift-card overlays) |
| i18n | `consumer-guide.copy.ts` or extend **`consumer-copy-catalog`** EN/HY/RU | **`provider-app-i18n.ts`** guide namespace |
| Offline | Bundle corpus in app build; no network required to read | Same |
| AI link | `navigate: { path: 'guide', query: { topicId } }` | Same |

**Consumer app — sections (minimum TOC):**

| `topicId` | Covers |
|-----------|--------|
| `consumer-getting-started` | Welcome, pick salon, first booking (**adopt-3.4**) |
| `consumer-tabs` | Home · Services · Account (+ Results / Lab when clinic) |
| `consumer-booking-flow` | Professional → service → slot → checkout → confirmation |
| `consumer-packages-gift-cards` | Packages, subscriptions, gift cards |
| `consumer-account` | Sign in, profile, manage booking, notifications |
| `consumer-assistant` | AI FAB, example prompts, feedback |
| `consumer-clinic` | Lab results, lab requests, preparation notes (vertical overlay) |

**Provider app — sections (minimum TOC):**

| `topicId` | Covers |
|-----------|--------|
| `provider-getting-started` | Login, accept invite, push permissions |
| `provider-today-calendar` | Today vs Calendar vs Schedule tabs |
| `provider-appointments` | Check-in, mark paid, running late, client notes |
| `provider-schedule-blocks` | Block my time vs block schedule vs time off (**5.23.4**) |
| `provider-team-manager` | Team view scope — manager-only section (**5.21.3**) |
| `provider-assistant` | AI chips, swipe to confirm, compounds, offline suggestions |
| `provider-gift-cards` | Fulfillment queue tabs (when enabled) |
| `provider-clinic` | Lab collection, results, patients (vertical overlay) |

- [ ] **ai-guide-1.9.1** — Shared mobile guide module — `guide-flows/` JSON schema (`topicId`, `titleKey`, `steps[]`, `navigateTarget?`, `verticals?`, `roles?`) consumed by backend corpus (**1.1.2**) and both apps (generate or import at build time)
- [ ] **ai-guide-1.9.2** — **consumer-app** — `GuidePage.tsx` at `/s/:slug/guide` — TOC sidebar or section list, anchor scroll to `topicId`, reuse step list UI pattern from dashboard guide
- [ ] **ai-guide-1.9.3** — **consumer-app** — Entry points — Account tab **Help & guide** row; `ConsumerBookingAssistant` chip “Open guide”; optional link from **WelcomePage** (**adopt-3**)
- [ ] **ai-guide-1.9.4** — **consumer-app** — EN/HY/RU copy for all consumer `topicId`s — parity gate in **`consumer-guide.copy.spec.ts`**
- [ ] **ai-guide-1.9.5** — **consumer-app** — Deep link + in-app `navigate` handler — `topicId` query opens guide scrolled to section; wire **`ConsumerBookingAssistant`** `navigate.path === 'guide'`
- [ ] **ai-guide-1.9.6** — **consumer-app** — Clinic vertical — show/hide **consumer-clinic** section from business metadata (same rules as Results / Lab tabs)
- [ ] **ai-guide-1.9.7** — **provider-app** — `GuidePage.tsx` at `/tabs/profile/guide` — same TOC + anchor pattern; Ionic back to Profile
- [ ] **ai-guide-1.9.8** — **provider-app** — Entry points — Profile **Help & guide**; `ProviderAiAssistant` chip; footer on **AcceptInvitePage** (**5.21.1**)
- [ ] **ai-guide-1.9.9** — **provider-app** — Role-filtered TOC — hide **provider-team-manager** for non-managers; clinic sections from **`useProviderClinicNav`**
- [ ] **ai-guide-1.9.10** — **provider-app** — EN/HY/RU guide namespace in **`provider-app-i18n.ts`** + locale parity spec
- [ ] **ai-guide-1.9.11** — **provider-app** — `navigate.path === 'guide'` from **`ProviderAiAssistant`** + push/deep-link `…/guide?topicId=`
- [ ] **ai-guide-1.9.12** — Offline bundle — embed latest `guide-flows/customer` + `guide-flows/provider` in app assets; refresh on app version bump (**1.8.10** fallback when AI down)
- [ ] **ai-guide-1.9.13** — CI — extend **`test:ai-guide-corpus`** — every consumer route in **`App.tsx`** tab/booking paths and provider **`/tabs/*`** route has playbook section or `no-guide`; fail on drift
- [ ] **ai-guide-1.9.14** — Component tests — **`GuidePage.spec.tsx`** (both apps): TOC render, `topicId` scroll, vertical gating, manager filter
- [ ] **ai-guide-1.9.15** — “Ask about this section” — each guide section CTA seeds assistant with `topicId` pre-filled prompt (bridges static ↔ conversational guide)

- [ ] **ai-guide-1.9** — Mark **1.9** `[x]` when both apps ship guide route, entry points, EN/HY/RU, offline bundle, and **1.9.13** corpus gate green

---

## ai-cmd-clinic-6-gap — Clinic ext-2.1–2.4 remaining DoD (dashboard)

**Context:** **`ai-cmd-ext-2.1`–`2.4`** / **`ai-cmd-clinic-6`** shipped EN dashboard MVP — rescue, handlers, 44 EN eval cases, gate **`npm run test:ai-clinic-test-results`** (142 tests). **Not** fully closed under per-action DoD (**lines 124–129**), **parity-2.4**, **acc-2.4**, or **ai-cmd-ext-gap-7**.

**Scope:** dashboard only — provider / customer / public out of scope for these four intents.

**Shipped today (no new work):**

| Intent | Handler | Behavior |
|--------|---------|----------|
| `upload_patient_result` | `handleUploadPatientResultLogic` | Requires `orderId`; guides to lab UI (no file attach via AI) |
| `explain_patient_results` | `handleExplainPatientResultsLogic` | Released results; `customerName` / `orderId` scope |
| `configure_test_reference_range` | `handleConfigureTestReferenceRangeLogic` | Requires `measurementCode`; guides to catalog UI |
| `list_abnormal_results` | `handleListAbnormalResultsLogic` | Flagged measurements; optional customer scope |

**Key paths:** `ai-clinic-test-result-ext.{fixtures,util,logic}.ts`, `ai-clinic-test-result.service.ts`, `eval/ai-command-eval.cases.ts` (`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES`).

**Closes with:** **parity-2.4**, **acc-2.4**, **ai-cmd-ext-gap-1** (capability matrix), **ai-cmd-ext-gap-5**–**7**, **vert-clinic-2.1.6** (product CRUD for reference ranges).

### ai-cmd-clinic-6-gap-1 — Locale parity (HY/RU) — **parity-2.4** / **acc-2.4**

> **enter_test_result** / **release_test_result** have **`ai-clinic-test-result-multilingual.fixtures.ts`** (**i18n-clinic-v2-ai-2**). Ext intents are EN-only.

- [ ] **ai-cmd-clinic-6-gap-1.1** — **`ai-clinic-test-result-ext-multilingual.fixtures.ts`** — ≥4 HY + ≥4 RU prompts per intent (`upload_patient_result`, `explain_patient_results`, `configure_test_reference_range`, `list_abnormal_results`); Latin measurement codes inside hy/ru sentences (mirror **i18n-clinic-v2-ai-2**)
- [ ] **ai-cmd-clinic-6-gap-1.2** — Extend **`CLINIC_TEST_RESULT_MULTILINGUAL_CLASSIFIER_RULES`** (or append ext block in **`ai-clinic-test-result-ext.util.ts`**) — hy/ru upload / explain / configure / abnormal-list verbs wired into dashboard **`INTENT_SCHEMA`** appendix
- [ ] **ai-cmd-clinic-6-gap-1.3** — **`MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS`** → **`eval/ai-command-eval.cases.ts`** — HY/RU rows with `surface: 'dashboard'`, `locale: 'hy' | 'ru'`, expected `rescuedAction` + `paramsPartial`; refresh baseline (**acc-2.9**)
- [ ] **ai-cmd-clinic-6-gap-1.4** — **`ai-clinic-test-result-ext-locale-parity.spec.ts`** — asserts every EN ext eval id has HY + RU equivalents (pattern: **`ai-provider-*-locale-parity.spec.ts`**)
- [ ] **ai-cmd-clinic-6-gap-1.5** — Unit **`it.each`** over multilingual fixtures in **`ai-clinic-test-result-ext.util.spec.ts`** + **`ai-clinic-test-result-multilingual.util.spec.ts`** extension if shared helpers added

- [ ] **ai-cmd-clinic-6-gap-2.1** — Add `surface: 'dashboard'` to all **`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES`** (and base **`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_*`** rows if missing)
- [ ] **ai-cmd-clinic-6-gap-2.2** — Add expected access **`tier`** (`M` / `R`) per ext intent in eval cases (cross-ref **`access-control.matrix.ts`**)
- [ ] **ai-cmd-clinic-6-gap-2.3** — Optional: classifier-without-rescue golden rows (misclassifiedAction omitted; assert direct `action` not only `rescuedAction`) for top EN/HY/RU prompts — extends **acc-2.6** ambiguity vs execution coverage

### ai-cmd-clinic-6-gap-3 — Integration & dispatch depth — **feature-test-coverage**

> Today **`ai-clinic-test-result.integration.spec.ts`** exercises **`AiIntentRescueService` only** — not Nest module → service → handler.

- [ ] **ai-cmd-clinic-6-gap-3.1** — Nest **`Test.createTestingModule`** integration — **`AiClinicTestResultService`** → `handleUploadPatientResult` / `handleExplainPatientResults` / `handleConfigureTestReferenceRange` / `handleListAbnormalResults` with mocked repos (mirror depth of other domain `*.integration.spec.ts` where service is wired)
- [ ] **ai-cmd-clinic-6-gap-3.2** — Dispatch smoke — `executeSingleIntent` `case` branches for ext intents return expected `CommandResult` shape (mock **`AiClinicTestResultService`** on **`AiCommandService`** or thin handler-coverage extension under **`test:ai-cmd-ext`**)

- [ ] **ai-cmd-clinic-6-gap-4.1** — **`ai-capability.matrix.ts`** — explicit rows for **`upload_patient_result`**, **`explain_patient_results`**, **`configure_test_reference_range`**, **`list_abnormal_results`** (`surfaces: ['dashboard']`, `tier`, `mutating`, sprint **54**)
- [ ] **ai-cmd-clinic-6-gap-4.2** — **`ai-command-entity-params.registry.ts`** + **`command-completion.validator.ts`** — required params per ext intent (`orderId`, `customerName`, `measurementCode`, `normalLow`/`normalHigh`, `limit`)
- [ ] **ai-cmd-clinic-6-gap-4.3** — **`ai-capability.matrix.spec.ts`** — registry ↔ matrix parity for clinic test-result intent family (ext + enter/release)

### ai-cmd-clinic-6-gap-5 — Product mutations (out of AI scope until vert ships)

> By design today: upload + configure are **UI handoffs**. Real mutations tracked under clinic vertical.

- [ ] **ai-cmd-clinic-6-gap-5.1** — **`vert-clinic-2.1.6`** — reference range entities + admin CRUD on test types; then wire **`configure_test_reference_range`** handler to persist ranges (replace catalog UI-only summary)
- [ ] **ai-cmd-clinic-6-gap-5.2** — File attach path — when lab UI supports API upload by `orderId`, extend **`handleUploadPatientResultLogic`** or return deep-link with pre-filled `orderId` (keep **`enter_test_result`** for manual values)

- [ ] **ai-cmd-clinic-6-gap-6.1** — Extend **`decomposeClinicCompoundPrompt`** — e.g. `list_abnormal_results` → `explain_patient_results` for flagged patient; document in **`ai-cmd-ext-4.2`** `clinic_lab_day_close` or new **`clinic_lab_review`** recipe
- [ ] **ai-cmd-clinic-6-gap-6.2** — Eval `compoundSteps` for clinic ext multi-step flows when recipes ship (**parity-3.2**)

### Exit criteria (close **ai-cmd-clinic-6** fully + **ai-cmd-ext-gap-7** for ext-2.1–2.4)

| Gate | Target |
|------|--------|
| **`npm run test:ai-clinic-test-results`** | green; ext util coverage thresholds maintained or raised |
| **`npm run test:ai-accuracy`** | all new HY/RU ext cases in baseline; no per-intent regression |
| **Locale parity spec** | 0 missing HY/RU pairs for ext EN eval ids |
| **Integration** | rescue + Nest service paths covered |
| **parity-2.4** | classifier rules + EN/HY/RU eval tagged `surface: dashboard` + `tier` |

- [ ] **ai-cmd-clinic-6-gap** — Mark **`ai-cmd-clinic-6`** DoD-complete only when **gap-1**–**4** exit criteria green (gap-5/6 optional product/compound follow-ups)

---

## ai-cmd-ext-2.13 — Per-service online payment on public booking (partial — 2026-06)

**Intent:** `configure_service_online_payment` → `AiPaymentsService` / `ai-service-online-payment.*`  
**Product:** Services page → “Accept online payment on public booking” (`prepaymentMode`: none | full | deposit; default 50% deposit when `depositAmount` null).  
**Surfaces:** **dashboard only** (admin catalog mutation). Customer/public consume checkout — no mutate there.


**Example prompts (accept):**
- Accept online payment on public booking for all services with 50% prepayment
- Require full prepayment on public booking for Massage
- Accept online payment for Haircut and Blowdry with half prepayment

**Example prompts (decline):**
- Decline online payment on public booking for all services
- Decline online payment on public booking for Massage
- Do not accept online payment for massage services

- [ ] **ai-cmd-ext-2.13.2** — HY/RU locale parity — `ai-service-online-payment-multilingual.fixtures.ts` + eval rows (**parity-2.4**, **acc-2.4**)
- [ ] **ai-cmd-ext-2.13.3** — `ai-capability.matrix.ts` explicit row (`surfaces: ['dashboard']`, tier `M`, sprint tag)
- [ ] **ai-cmd-ext-2.13.4** — Dashboard page suggestions — add accept/decline online-payment examples to `AI_PAGE_SUGGESTIONS['/dashboard/services']` + localized i18n keys
- [ ] **ai-cmd-ext-2.13.5** — Read companion **`explain_service_online_payment_setup`** — summarize which services have online payment + prepayment mode (Stripe Connect status); NOT `list_services` alone
- [ ] **ai-cmd-ext-2.13.6** — **`npm run test:ai-service-online-payment`** gate script in `package.json` (util + logic + integration slice)
- [ ] **ai-cmd-ext-gap-7** — Mark **ai-cmd-ext-2.13** DoD-complete when **2.13.2**–**2.13.6** green

---

## ai-cmd-ext-2.14+ — Dashboard command backlog (extend `AiCommandService`)

**Goal:** Cover high-traffic dashboard settings & catalog mutations that owners already do in UI but cannot say in the AI bar yet. Each row = new or extended intent; wire per **ai-cmd-ext** DoD (**registry → classifier → case/delegate → rescue → ≥10 NL fixtures → eval**).

**Priority legend:** **P0** = blocks onboarding/checkout; **P1** = weekly ops; **P2** = nice-to-have read/deep-link.

### P0 — Checkout & payments (Services + Billing + Settings)

| ID | Intent (proposed) | M/R | Handler home | Product UI | Notes |
|----|-------------------|-----|--------------|------------|-------|
| **ai-cmd-ext-2.14** | `explain_service_online_payment_setup` | R | `AiPaymentsService` | Services + Billing | Which services require prepayment; Stripe Connect ready?; cash still allowed? |
| **ai-cmd-ext-2.15** | `configure_stripe_connect` | M | `AiMarketingGrowthService` or billing module | Settings → Billing | Deep-link + explain steps; optional “open Stripe onboarding” — NOT raw OAuth in AI |
| **ai-cmd-ext-2.16** | `configure_checkout_defaults` | M | `AiPaymentsService` | Settings self-service + Services | Compound-friendly: cash at venue + default online prepayment policy for new services |
| **ai-cmd-ext-2.17** | `update_service_duration_buffer` | M | `AiCatalogService` / operations | Services form | Bulk: “Set all massage services to 60 minutes with 15 min buffer” |
| **ai-cmd-ext-2.18** | `configure_service_deposit_policy` | M | `AiPaymentsService` | Services | Alias/extension if split from **2.13**: fixed $ deposit vs % only (already partial in **2.13**) |

- [ ] **ai-cmd-ext-2.14** — `explain_service_online_payment_setup`
- [ ] **ai-cmd-ext-2.15** — `configure_stripe_connect`
- [ ] **ai-cmd-ext-2.16** — `configure_checkout_defaults`
- [ ] **ai-cmd-ext-2.17** — `update_service_duration_buffer`
- [ ] **ai-cmd-ext-2.18** — `configure_service_deposit_policy` (close any **2.13** gaps: tier metadata, featured services)

### P1 — Settings, notifications, growth (Settings / Integrations / Growth tabs)

| ID | Intent (proposed) | M/R | Handler home | Product UI | Notes |
|----|-------------------|-----|--------------|------------|-------|
| **ai-cmd-ext-2.19** | `configure_notification_settings` | M | new `ai-notification-settings.*` | Settings → Notifications | Email/SMS/WhatsApp toggles; reminder 24h/1h; **not** customer prefs |
| **ai-cmd-ext-2.20** | `configure_whatsapp_integration` | M | `AiIntegrationsService` | Settings → WhatsApp | Template names, connection mode; test send → `test_push` / webhook test pattern |
| **ai-cmd-ext-2.21** | `configure_openai_integration` | M | `AiIntegrationsService` | Settings → OpenAI | Platform vs custom API key — admin only |
| **ai-cmd-ext-2.22** | `explain_tenant_app_install` | R | `AiMarketingGrowthService` | Integrations → Growth QR | Per-tenant `/get-app/[slug]` landing + QR — **new product (2026-06)** |
| **ai-cmd-ext-2.23** | `regenerate_tenant_app_install_qr` | M | business / growth service | Growth tab | Regenerate slug QR assets; idempotent `ensureForBusiness` |
| **ai-cmd-ext-2.24** | `create_promo_code` | M | `AiMarketingGrowthService` | Marketing / promo admin | Admin CRUD — disjoint from customer `promo_code_help` |
| **ai-cmd-ext-2.25** | `configure_loyalty_settings` | M | `AiMarketingGrowthService` | Loyalty settings | Points rules, earn/redeem toggles — extend **`summarize_loyalty_program`** (read) |

- [ ] **ai-cmd-ext-2.19** — `configure_notification_settings`
- [ ] **ai-cmd-ext-2.20** — `configure_whatsapp_integration`
- [ ] **ai-cmd-ext-2.21** — `configure_openai_integration`
- [ ] **ai-cmd-ext-2.22** — `explain_tenant_app_install`
- [ ] **ai-cmd-ext-2.23** — `regenerate_tenant_app_install_qr`
- [ ] **ai-cmd-ext-2.24** — `create_promo_code`
- [ ] **ai-cmd-ext-2.25** — `configure_loyalty_settings`

### P1 — Catalog & packages (Services tab extensions)

| ID | Intent (proposed) | M/R | Handler home | Product UI | Notes |
|----|-------------------|-----|--------------|------------|-------|
| **ai-cmd-ext-2.26** | `configure_service_featured` | M | `AiCatalogService` | Services list | Mark/unmark featured; `serviceTier` / rank metadata (**rank-1** overlap) |
| **ai-cmd-ext-2.27** | `bulk_assign_services_category` | M | `AiCatalogService` | Categories tab | “Move all hair services under Hair category” — extend `update_service` compounds |
| **ai-cmd-ext-2.28** | `configure_package_online_payment` | M | `AiCatalogService` | Packages tab | Package-level prepayment if product adds it; else document out of scope |
| **ai-cmd-ext-2.29** | `explain_multi_service_settings` | R | `AiScheduleResourcesService` | Multi-service tab | Explain limits + scheduling mode — pairs with existing **`configure_multi_service_*`** |

- [ ] **ai-cmd-ext-2.26** — `configure_service_featured`
- [ ] **ai-cmd-ext-2.27** — `bulk_assign_services_category`
- [ ] **ai-cmd-ext-2.28** — `configure_package_online_payment` (product-dependent)
- [ ] **ai-cmd-ext-2.29** — `explain_multi_service_settings`

### P2 — Read-only “explain setup” helpers (reduce support load)

| ID | Intent (proposed) | M/R | Handler home | Notes |
|----|-------------------|-----|--------------|-------|
| **ai-cmd-ext-2.30** | `explain_public_booking_checkout` | R | `AiPaymentsService` | How cash + online + gift card interact on booking page |
| **ai-cmd-ext-2.31** | `explain_integration_health` | R | `AiIntegrationsService` | Extend **`list_integration_health`** with NL “is WhatsApp connected?” |
| **ai-cmd-ext-2.32** | `audit_services_missing_online_payment` | R | `AiPaymentsService` | “Which services still don't accept online payment?” |

- [ ] **ai-cmd-ext-2.30** — `explain_public_booking_checkout`
- [ ] **ai-cmd-ext-2.31** — `explain_integration_health`
- [ ] **ai-cmd-ext-2.32** — `audit_services_missing_online_payment`

---

## ai-cmd-ext-4.5+ — Dashboard compounds (checkout & onboarding)

Multi-step recipes in `buildCompoundCommandRecipes()` + `intent-decomposition.util.ts`. Each needs classifier compound rules, rescue, eval `compoundSteps`, and confirmation preview.

| ID | Recipe | Steps (high level) | Priority |
|----|--------|-------------------|----------|
| **ai-cmd-ext-4.5** | `setup_salon_checkout` | `configure_stripe_connect` (explain) → `configure_cash_payments` → `configure_service_online_payment` (all services, 50%) → `configure_online_booking` | **P0** |
| **ai-cmd-ext-4.6** | `configure_services_payment_matrix` | `update_service_prices` optional → `configure_service_online_payment` per category → `configure_cash_payments` | **P1** |
| **ai-cmd-ext-4.7** | `decline_online_payment_category` | `configure_service_online_payment` (prepaymentMode none) scoped — single-step today; compound when paired with “enable for others” | **P1** |
| **ai-cmd-ext-4.8** | `onboard_salon_notifications` | `configure_notification_settings` → `configure_whatsapp_integration` → `test_push` | **P2** |
| **ai-cmd-ext-4.9** | `launch_consumer_app_growth` | `explain_tenant_app_install` → `regenerate_tenant_app_install_qr` → `configure_marketing_registration_email` | **P2** |

- [ ] **ai-cmd-ext-4.5** — `setup_salon_checkout`
- [ ] **ai-cmd-ext-4.6** — `configure_services_payment_matrix`
- [ ] **ai-cmd-ext-4.7** — `decline_online_payment_category` (accept/decline split in one message)
- [ ] **ai-cmd-ext-4.8** — `onboard_salon_notifications`
- [ ] **ai-cmd-ext-4.9** — `launch_consumer_app_growth`

---

## ai-cmd-ext-5 — Param extensions on existing handlers (quick wins)

Extend **`ai-cmd-ext-1`** pattern — no new verb; enrich params + rescue on existing actions.

| ID | Action | New params | Handler | Example prompt |
|----|--------|------------|---------|----------------|
| **ai-cmd-ext-5.1** | `list_services` | `prepaymentMode`, `onlinePaymentEnabled` | `handleListServices` | “List services that require online payment” |
| **ai-cmd-ext-5.2** | `create_service` | `prepaymentMode`, `depositPercent` | catalog create | “Add massage $80 with 50% online prepayment” |
| **ai-cmd-ext-5.3** | `create_services` | same as **5.2** per row | bulk create | Menu import + payment policy |
| **ai-cmd-ext-5.4** | `update_service_prices` | `onlyWithOnlinePayment` filter | operations | “Raise prices 10% for services with online payment only” |
| **ai-cmd-ext-5.5** | `deactivate_service` | `categoryName`, `allInCategory` | catalog | “Deactivate all dental services” |
| **ai-cmd-ext-5.6** | `configure_cash_payments` | document pairing with **2.13** in classifier | payments | “Enable cash and decline online payment for all services” → compound **4.7** |

- [ ] **ai-cmd-ext-5.1** — `list_services` payment filters
- [ ] **ai-cmd-ext-5.2** — `create_service` prepayment on create
- [ ] **ai-cmd-ext-5.3** — `create_services` bulk prepayment
- [ ] **ai-cmd-ext-5.4** — `update_service_prices` scoped by online payment
- [ ] **ai-cmd-ext-5.5** — `deactivate_service` category scope
- [ ] **ai-cmd-ext-5.6** — cash + online compound classifier disambiguation

---

## ai-cmd-ext-6 — Orchestrator scale (parallel track)

Unblocks adding **2.14+** without growing `ai-command.service.ts` further (~11k LOC today).

- [ ] **ai-cmd-ext-6.1** — Extract payment/catalog/settings handlers from `AiCommandService` switch → `AiDashboardCoreService` / domain services (**extends ai-cmd-ext-0.4**)
- [ ] **ai-cmd-ext-6.2** — Registry-driven dispatch map (`Map<intent, handlerFn>`) for all `handler: 'AiPaymentsService'` intents first (**extends ai-cmd-ext-0.5**)
- [ ] **ai-cmd-ext-6.3** — Split `INTENT_SCHEMA` appendix into domain imports only (no inline prose) — one `*_CLASSIFIER_RULES` import per domain file
- [ ] **ai-cmd-ext-6.4** — `test:ai-cmd-ext` coverage report: list registry intents missing ≥10 NL fixtures (**ai-cmd-ext-gap-5** automation)

---

## ai-cmd-ext-7 — Cross-surface parity (when dashboard command is customer-visible)

Only when the configured setting affects public booking or consumer app UX:

| Dashboard intent | Customer/public read-only counterpart | Status |
|------------------|---------------------------------------|--------|
| `configure_service_online_payment` | `explain_why_stripe_required`, `explain_checkout_total` (existing) | Partial — add “why prepayment?” copy |
| `configure_cash_payments` | `pay_cash_at_visit`, `choose_payment_method` (existing) | OK |
| `configure_notification_settings` | `explain_my_notifications` (customer) | Gap |
| `explain_tenant_app_install` | `how_to_download_app` (customer) | Link copy alignment |

- [ ] **ai-cmd-ext-7.1** — Customer/public read prompts when prepayment enabled/disabled (no mutate on those surfaces)
- [ ] **ai-cmd-ext-7.2** — Public booking assistant: “Do I pay online for this service?” → explain service `prepaymentMode` from catalog context

---

## Suggested implementation order

| Phase | IDs | Rationale |
|-------|-----|-----------|
| **A — Finish in-flight** | **2.13.2**–**2.13.6**, **5.1**, **5.2** | Complete online payment AI + list/create parity |
| **B — Onboarding** | **2.15**, **4.5**, **2.14** | Stripe + checkout setup in one conversation |
| **C — Settings** | **2.19**–**2.21**, **4.8** | Notification + integration configuration |
| **D — Growth** | **2.22**–**2.25**, **4.9** | QR app install + promo/loyalty |
| **E — Scale** | **6.1**–**6.4**, **3.*** (provider wire) | Maintainability + provider matrix |

**Related sections:** **ai-cmd-ext-0** (hygiene), **ai-cmd-ext-3** (provider dispatch), **ai-cmd-h1**–**h4** (NLU quality), **parity-2.4**, **feature-ai-prompt-coverage** + **feature-test-coverage** skills.

**File map for implementers:**

| Layer | Path |
|-------|------|
| Intent union | `ai-command-intent-schema.build.ts` ← `DASHBOARD_INTENTS` |
| Registry | `ai-command-registry.build.ts` |
| Classifier rules | domain `*.fixtures.ts` → appended in `ai-command.service.ts` `INTENT_SCHEMA` |
| Execute | `ai-command.service.ts` `case` → `*.service.ts` → `*.logic.ts` |
| Rescue | `ai-intent-rescue.service.ts` + domain `rescue*Intent` |
| Eval | `eval/ai-command-eval.cases.ts` |
| Page chips | `frontend/src/lib/ai-orchestration.ts` `AI_PAGE_SUGGESTIONS` |

---

## ai-cmd-customer-4 — Customer ease-of-life commands (backlog)

**Goal:** Reduce friction for **anonymous public booking** + **logged-in consumer app** users — the questions people ask when they are stressed, on mobile, or booking as a guest. Every row needs **both surfaces where applicable** (see **ai-cmd-customer-0** parity) unless marked customer-only.

**Principle:** Prefer **read/explain + navigate** over mutate when the user is mid-checkout; compound “find → book → pay” only when session carry is explicit.

**Pain themes from product:** guest checkout contact confusion, deposit vs full price, rebook-after-success state, multi-service cart, clinic prep, “what do I owe today?”, tour group capacity, package visit vs single booking, lost manage links, Stripe failures mid-checkout, push/offline on mobile, lab-to-book after order, specialist vs “any provider”, post-visit review prompts.

---

### ai-cmd-customer-4.0 — Promote deferred registry intents (close **CUSTOMER_INTENT_COVERAGE_DEFERRED**)

Many customer-native intents exist in registry + handlers but lack ≥10 NL fixtures + eval — tracked in **`ai-customer-intent-coverage.util.ts`**. Promote to **`CUSTOMER_INTENT_COVERAGE_REQUIRED`** with full DoD per **ai-cmd-customer-gap-5**.

| Priority | Intent | Why it helps customers | Surfaces |
|----------|--------|------------------------|----------|
| **P0** | `cancel_my_booking` | Self-serve cancel without calling salon | customer |
| **P0** | `reschedule_my_booking` | Move visit without staff | customer |
| **P0** | `pay_online` | Finish Stripe after slot pick | customer (+ public handoff) |
| **P0** | `explain_why_stripe_required` | “Why must I pay now?” | customer + public |
| **P1** | `book_multi_service` / `check_multi_service_availability` | Spa day / multiple treatments | customer + public |
| **P1** | `use_subscription_credit` / `my_subscriptions` | Membership visits | customer |
| **P1** | `promo_code_help` | Checkout discount confusion | customer + public |
| **P1** | `loyalty_points_balance` | “How many points do I have?” | customer |
| **P2** | `privacy_export` / `privacy_delete` | GDPR self-service | customer |
| **P2** | `request_gift_card_cancel` | Post-purchase buyer regret | customer |
| **P2** | `cancel_package_visit` / `reschedule_package_visit` | Bundle visit self-serve | customer |
| **P2** | `list_my_package_visits` | “Visits left on my package” | customer |
| **P3** | `explain_tour_*` / `diagnose_tour_capacity` | Tour pax + day-slot UX | customer + public |
| **P3** | `explain_checkout_recommendations` | Product upsell on success | customer + public |
| **P3** | `refer_a_friend` / `share_salon_link` | Growth loops | customer |

- [ ] **ai-cmd-customer-4.0.1** — Audit **`CUSTOMER_INTENT_COVERAGE_DEFERRED`** → prioritize P0 table above
- [ ] **ai-cmd-customer-4.0.2** — For each promoted intent: ≥10 EN + HY/RU fixtures, rescue, eval `surface: customer|public`, integration spec row
- [ ] **ai-cmd-customer-4.0.3** — Extend **`npm run test:ai-customer-intent-coverage`** gate as intents graduate from deferred

---

### ai-cmd-customer-4.1 — Before booking (discovery & trust) — **public + customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.1.1** | `explain_service_price` | R | both | “How much is a haircut?”, “Is massage included in the $80?” | Service card price + tax badge + deposit note; extends **`list_services`** |
| **4.1.2** | `explain_payment_options_for_service` | R | both | “Do I pay online for color?”, “Can I pay cash for massage?” | Reads `prepaymentMode` + `acceptCashPayments`; ties **ai-cmd-ext-7.2** |
| **4.1.3** | `find_soonest_appointment` | R | both | “Who’s free soonest for a trim?”, “Earliest slot this week” | Thin wrapper on **`check_availability`** + **`bookingFirstAvailable`** |
| **4.1.4** | `compare_services` | R | both | “Haircut vs blowdry price and duration” | Read catalog; optional navigate |
| **4.1.5** | `explain_business_hours_and_location` | R | both | “When are you open Saturday?”, “Where are you located?” | Extend **`business_info`** with maps link + parking copy |
| **4.1.6** | `explain_provider_specialty` | R | both | “Who is best for curly hair?”, “Tell me about Anna” | Extend **`recommend_specialists`** / provider profile |
| **4.1.7** | `filter_services_no_prepayment` | R | both | “What can I book without paying online?” | **`list_services`** + filter `prepaymentMode=none` (**ai-cmd-ext-5.1**) |

- [ ] **ai-cmd-customer-4.1.1** — `explain_service_price`
- [ ] **ai-cmd-customer-4.1.2** — `explain_payment_options_for_service`
- [ ] **ai-cmd-customer-4.1.3** — `find_soonest_appointment`
- [ ] **ai-cmd-customer-4.1.4** — `compare_services`
- [ ] **ai-cmd-customer-4.1.5** — `explain_business_hours_and_location`
- [ ] **ai-cmd-customer-4.1.6** — `explain_provider_specialty`
- [ ] **ai-cmd-customer-4.1.7** — `filter_services_no_prepayment`

---

### ai-cmd-customer-4.2 — During checkout (highest customer pain) — **public + customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.2.1** | `explain_amount_due_now` | R | both | “How much do I pay today?”, “Is 50% deposit $40?” | **`prepaymentDue()`** semantics; NOT **`maxPrice`** |
| **4.2.2** | `explain_guest_checkout_fields` | R | both | “Why do you need my email?”, “Can I book without an account?” | Guest contact merge rules; reduce support tickets |
| **4.2.3** | `resume_pending_payment` | R | customer | “Continue my payment”, “I closed the app mid-checkout” | **`PendingCheckoutPayment`** / session restore |
| **4.2.4** | `choose_payment_method` | M | both | “Pay cash at visit”, “Pay online with card” | Exists — expand fixtures + compounds |
| **4.2.5** | `apply_promo_code_checkout` | M | both | “Apply code SAVE10 at checkout” | Extend **`promo_code_help`** with session **`promoCode`** |
| **4.2.6** | `explain_checkout_steps` | R | both | “Walk me through booking”, “What happens after I pick a time?” | Extend **`booking_help`** with step list |
| **4.2.7** | `fix_checkout_validation_error` | R | both | “It says enter email but I filled it in” | Explain guest/profile merge; link to field hints |

- [ ] **ai-cmd-customer-4.2.1** — `explain_amount_due_now`
- [ ] **ai-cmd-customer-4.2.2** — `explain_guest_checkout_fields`
- [ ] **ai-cmd-customer-4.2.3** — `resume_pending_payment`
- [ ] **ai-cmd-customer-4.2.4** — Harden **`choose_payment_method`** + **`pay_online`** deferred promotion
- [ ] **ai-cmd-customer-4.2.5** — `apply_promo_code_checkout`
- [x] **ai-cmd-customer-4.2.6** — `explain_checkout_steps`
- [ ] **ai-cmd-customer-4.2.7** — `fix_checkout_validation_error`

---

### ai-cmd-customer-4.3 — After booking (confirmation & next steps) — **customer-first, public read**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.3.1** | `confirm_my_booking_details` | R | both | “What time is my appointment?”, “Summarize my booking” | Read session / last booking |
| **4.3.2** | `add_booking_to_calendar` | R | both | “Add to my calendar”, “Send me an ICS” | Return calendar deep link / `.ics` URL if product supports |
| **4.3.3** | `get_directions_to_salon` | R | both | “Directions to the salon”, “Where do I park?” | Maps URL from business address |
| **4.3.4** | `explain_preparation_notes` | R | both | “Do I need to fast?”, “What should I bring?” | Clinic **`preparationNotes`**, tour meeting point |
| **4.3.5** | `explain_consumer_checkout_success` | R | customer | “What’s on the success screen?” | **Shipped** — extend HY/RU + public read-only sibling |
| **4.3.6** | `book_another_service` | R | both | “Book another service same day” | Navigate without stale success state (**BookPage** reset) |
| **4.3.7** | `share_my_booking` | R | customer | “Share my appointment with my partner” | **Shipped** in adoption — add eval coverage |

- [ ] **ai-cmd-customer-4.3.1** — `confirm_my_booking_details`
- [ ] **ai-cmd-customer-4.3.2** — `add_booking_to_calendar`
- [ ] **ai-cmd-customer-4.3.3** — `get_directions_to_salon`
- [ ] **ai-cmd-customer-4.3.4** — `explain_preparation_notes`
- [ ] **ai-cmd-customer-4.3.5** — HY/RU eval for **`explain_consumer_checkout_success`**
- [ ] **ai-cmd-customer-4.3.6** — `book_another_service` (guard against success-state bug on rebook)
- [ ] **ai-cmd-customer-4.3.7** — Full DoD for **`share_my_booking`**

---

### ai-cmd-customer-4.4 — Manage existing visits — **customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.4.1** | `list_my_upcoming_appointments` | R | customer | “What’s my next appointment?”, “Appointments this week” | Filter on **`list_my_appointments`** |
| **4.4.2** | `cancel_my_booking` | M | customer | “Cancel tomorrow’s massage” | Promote from deferred **4.0** |
| **4.4.3** | `reschedule_my_booking` | M | customer | “Move my visit to Friday 3pm” | Promote from deferred **4.0** |
| **4.4.4** | `explain_cancel_policy` | R | customer | “Can I cancel for free?” | **Shipped** — add fee/deposit forfeiture copy |
| **4.4.5** | `get_manage_link` | R | customer | “Send me a link to change my booking” | **Shipped** — guest email/SMS resend variant |
| **4.4.6** | `notify_running_late` | M | customer | “I’m 15 minutes late” | Optional SMS/staff ping if product supports |
| **4.4.7** | `join_waitlist` / `check_waitlist_status` | M/R | customer + public | “Notify me if something opens Friday” | Needs waitlist customer API parity with dashboard **offer_waitlist_slot** |
| **4.4.8** | `rebook_last_appointment` | R | customer | “Book the same as last time” | **Shipped** in adoption — wire navigate + eval |

- [ ] **ai-cmd-customer-4.4.1** — `list_my_upcoming_appointments`
- [ ] **ai-cmd-customer-4.4.2** — `cancel_my_booking` (full DoD)
- [ ] **ai-cmd-customer-4.4.3** — `reschedule_my_booking` (full DoD)
- [ ] **ai-cmd-customer-4.4.4** — Enrich **`explain_cancel_policy`** (deposit forfeiture)
- [ ] **ai-cmd-customer-4.4.5** — Guest **`get_manage_link`** via email/phone lookup
- [ ] **ai-cmd-customer-4.4.6** — `notify_running_late` (product-dependent)
- [ ] **ai-cmd-customer-4.4.7** — Customer waitlist join/status
- [ ] **ai-cmd-customer-4.4.8** — Full DoD for **`rebook_last_appointment`**

---

### ai-cmd-customer-4.5 — Account, loyalty, subscriptions — **customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.5.1** | `explain_loyalty_points` | R | customer | “How do I earn points?”, “What are my points worth?” | Extend **`loyalty_points_balance`** |
| **4.5.2** | `apply_loyalty_at_checkout` | M | customer | “Use my points on this booking” | Checkout mutation |
| **4.5.3** | `explain_my_subscription` | R | customer | “How many visits left on my plan?” | **`my_subscriptions`** + **`subscription_usage`** |
| **4.5.4** | `manage_notification_preferences` | M | customer | “Text me not email”, “Turn off reminders” | **Shipped** in adoption — eval HY/RU |
| **4.5.5** | `explain_my_notifications` | R | customer | “Will you WhatsApp me?” | **Shipped** — align with salon **`configure_notification_settings`** copy |
| **4.5.6** | `update_my_profile` | M | customer | “Change my phone number”, “Update my name” | **`my_profile`** read exists — mutate gap |
| **4.5.7** | `how_to_download_app` | R | customer + public | “Get the app”, “Install on my phone” | Link **`explain_tenant_app_install`** / QR slug |

- [ ] **ai-cmd-customer-4.5.1** — `explain_loyalty_points`
- [ ] **ai-cmd-customer-4.5.2** — `apply_loyalty_at_checkout`
- [ ] **ai-cmd-customer-4.5.3** — `explain_my_subscription`
- [ ] **ai-cmd-customer-4.5.4** — HY/RU for **`manage_notification_preferences`**
- [ ] **ai-cmd-customer-4.5.5** — HY/RU for **`explain_my_notifications`**
- [ ] **ai-cmd-customer-4.5.6** — `update_my_profile`
- [ ] **ai-cmd-customer-4.5.7** — Align app install prompts public ↔ customer

---

### ai-cmd-customer-4.6 — Multi-service, packages, gift cards — **both**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.6.1** | `explain_multi_service_cart` | R | customer | “How long is my spa day?”, “What’s in my cart?” | **`show_cart_total_duration`** exists — enrich |
| **4.6.2** | `book_package_with_nearest_slot` | M | both | “Book the spa package earliest available” | Compound **`discover_packages`** → **`book_package`** |
| **4.6.3** | `book_with_gift_card` | M | customer | “Use my gift card for this booking” | Promote deferred; disjoint from **`maxPrice`** |
| **4.6.4** | `track_gift_card_delivery` | R | customer | “Where is my physical gift card?” | **`track_physical_gift_card_order`** — eval |
| **4.6.5** | `explain_package_savings` | R | both | “Is the bundle cheaper than separate?” | Read package lines vs à la carte |

- [ ] **ai-cmd-customer-4.6.1** — `explain_multi_service_cart`
- [ ] **ai-cmd-customer-4.6.2** — `book_package_with_nearest_slot` compound
- [ ] **ai-cmd-customer-4.6.3** — `book_with_gift_card` full DoD
- [ ] **ai-cmd-customer-4.6.4** — Gift card delivery tracking eval
- [ ] **ai-cmd-customer-4.6.5** — `explain_package_savings`

---

### ai-cmd-customer-4.7 — Clinic & lab (consumer) — **customer + public**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.7.1** | `explain_lab_prep` | R | both | “Do I need to fast for blood work?” | Clinic service **`requiresFasting`** |
| **4.7.2** | `track_lab_order_status` | R | customer | “Are my results ready?” | Extend **`list_my_test_results`** / **`explain_result_status`** |
| **4.7.3** | `book_lab_collection_nearest` | M | both | “Book lab draw earliest slot” | Compound lab booking + **`bookingFirstAvailable`** |
| **4.7.4** | `explain_clinic_booking_fields` | R | both | “Why do you ask for my ID?” | Extend **`explain_clinic_booking`** |

- [ ] **ai-cmd-customer-4.7.1** — `explain_lab_prep`
- [ ] **ai-cmd-customer-4.7.2** — `track_lab_order_status`
- [ ] **ai-cmd-customer-4.7.3** — `book_lab_collection_nearest`
- [ ] **ai-cmd-customer-4.7.4** — `explain_clinic_booking_fields`

---

### ai-cmd-customer-4.8 — Customer compounds (one message, full job)

| ID | Recipe | Steps | Example prompt |
|----|--------|-------|----------------|
| **4.8.1** | `discover_book_and_pay` | budget/rank list → check availability → book → choose payment / pay online | “Book cheapest massage under $60 tomorrow and pay online” |
| **4.8.2** | `rebook_and_pay` | `rebook_last_appointment` → `choose_payment_method` | “Rebook my last visit and pay with card” |
| **4.8.3** | `cancel_and_rebook` | `cancel_my_booking` → `book_nearest_slot` | “Cancel Friday and book the next available slot” |
| **4.8.4** | `gift_card_checkout` | `check_gift_card_balance` → `apply_gift_card_code` → `book_nearest_slot` | “Use gift card GCM-XXX and book nearest haircut” |
| **4.8.5** | `multi_service_day` | `add_services_to_cart` → `check_multi_service_availability` → book | “Massage and facial same afternoon — find a time” |
| **4.8.6** | `guest_book_and_manage` | book as guest → `get_manage_link` | “Book as guest and email me the manage link” |

- [ ] **ai-cmd-customer-4.8.1** — `discover_book_and_pay`
- [ ] **ai-cmd-customer-4.8.2** — `rebook_and_pay`
- [ ] **ai-cmd-customer-4.8.3** — `cancel_and_rebook`
- [ ] **ai-cmd-customer-4.8.4** — `gift_card_checkout`
- [ ] **ai-cmd-customer-4.8.5** — `multi_service_day`
- [ ] **ai-cmd-customer-4.8.6** — `guest_book_and_manage`

---

### ai-cmd-customer-4.9 — Consumer app UI chips (quick wins)

Wire suggested prompts into **`AI_PAGE_SUGGESTIONS`** / localized consumer strings (mirror dashboard **ai-cmd-ext-2.13.4**).

| Page / route | Suggested AI chips |
|--------------|-------------------|
| **`BookPage`** | “How much do I pay today?”, “Pay cash at visit”, “Why do you need my email?” |
| **`ManageBookingPage`** | “Cancel this appointment”, “Reschedule to next week”, “Send manage link” |
| **`AccountPage`** | “My next appointment”, “Turn off reminders”, “Rebook last visit” |
| **`SalonHomePage`** | “What’s the cheapest service?”, “Who’s free tomorrow?” |
| **`MultiServicePickerPage`** | “How long will this take?”, “Find afternoon slot for all services” |
| **`GiftCardCheckoutPage`** | “Apply promo code”, “Explain total with tax” |
| **`MultiServiceCheckoutPage`** | “Use my subscription”, “Why is total $0?” |
| **`PackageConfirmPage`** | “How many visits in this package?”, “Book first visit now” |
| **`LabToBookPage`** | “Book my lab draw”, “Why do I need collection?” |
| **`MyResultsPage`** | “What does released mean?”, “Why is CBC still pending?” |
| **`ManageBookingPage`** (guest) | “Sign in to manage”, “Resend manage link” |
| **`WelcomePage`** | “Find my saved salons”, “How do I get the app?” |
| **Public booking web** | Same as **4.1**–**4.2** where anonymous |

- [ ] **ai-cmd-customer-4.9.1** — Consumer app page suggestion map in `frontend` + `consumer-app` i18n
- [ ] **ai-cmd-customer-4.9.2** — Public booking assistant starter chips on checkout + service list

---

### ai-cmd-customer-4.10 — Tours & group bookings — **public + customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.10.1** | `explain_tour_booking` | R | both | “How many people can join?”, “Is price per person?” | **Shipped** — extend HY/RU + eval |
| **4.10.2** | `explain_tour_day_slots` | R | both | “Why only one time per day?”, “How many spots left Friday?” | **Shipped** — `remainingSpots`, fully booked dates |
| **4.10.3** | `diagnose_tour_capacity` | R | both | “Checkout says not enough seats”, “Why can’t I book 4 people?” | **Shipped** — pax vs max group at checkout |
| **4.10.4** | `explain_tour_booking_record` | R | customer | “What’s my tour confirmation number?”, “Summarize my group booking” | Post-booking read |
| **4.10.5** | `book_tour_nearest_departure` | M | both | “Book the wine tour earliest date for 2 people” | Compound tour catalog → pax → slot |
| **4.10.6** | `explain_tour_meeting_point` | R | both | “Where do we meet?”, “What time should I arrive?” | Extend **`explain_preparation_notes`** for tours |

- [ ] **ai-cmd-customer-4.10.1** — HY/RU eval for **`explain_tour_booking`**
- [ ] **ai-cmd-customer-4.10.2** — HY/RU eval for **`explain_tour_day_slots`**
- [ ] **ai-cmd-customer-4.10.3** — Checkout error copy for **`diagnose_tour_capacity`**
- [ ] **ai-cmd-customer-4.10.4** — Full DoD for **`explain_tour_booking_record`**
- [ ] **ai-cmd-customer-4.10.5** — `book_tour_nearest_departure` compound
- [ ] **ai-cmd-customer-4.10.6** — `explain_tour_meeting_point`

---

### ai-cmd-customer-4.11 — Provider / specialist choice — **public + customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.11.1** | `explain_any_provider_option` | R | both | “What does Any stylist mean?”, “Will someone be assigned?” | **`ConsumerSlotSpecialistPicker`** / any-availability |
| **4.11.2** | `pick_provider_for_service` | M | both | “Book with Anna for color”, “I want the same stylist as last time” | Navigate with `providerId`; tie **`rebook_last_appointment`** |
| **4.11.3** | `explain_provider_availability` | R | both | “Is Marco working Saturday?”, “Who has openings tomorrow?” | Thin wrapper on **`check_availability`** + provider filter |
| **4.11.4** | `switch_provider_same_time` | M | both | “Keep 3pm but different stylist” | Re-run availability with same slot block |
| **4.11.5** | `explain_professional_profile` | R | both | “Show me Anna’s services”, “What does this stylist specialize in?” | **`ProviderProfilePage`** / **`ProfessionalsPage`** navigate |

- [ ] **ai-cmd-customer-4.11.1** — `explain_any_provider_option`
- [ ] **ai-cmd-customer-4.11.2** — `pick_provider_for_service`
- [ ] **ai-cmd-customer-4.11.3** — `explain_provider_availability`
- [ ] **ai-cmd-customer-4.11.4** — `switch_provider_same_time`
- [ ] **ai-cmd-customer-4.11.5** — `explain_professional_profile`

---

### ai-cmd-customer-4.12 — Post-visit reviews, satisfaction & support — **customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.12.1** | `leave_visit_review` | M | customer | “Rate my last visit”, “Leave a review for today’s haircut” | **`PostVisitReviewPrompt`** / store review flow |
| **4.12.2** | `explain_post_visit_review_prompt` | R | customer | “Why am I seeing a review popup?”, “Can I skip the rating?” | When prompt shows; dismiss behavior |
| **4.12.3** | `report_booking_problem` | M | customer | “Something went wrong with my visit”, “I was charged twice” | **`postBookingSupport*`** — staff ticket or support form |
| **4.12.4** | `explain_share_reward` | R | customer | “Do I get points for sharing?”, “What happens when I share my booking?” | **`shareBookingLinkWithReward`** / growth card |
| **4.12.5** | `sign_in_after_booking` | R | customer | “Save this booking to my account”, “Sign in with Google after booking” | **`postBookingSignIn*`** — guest → account merge |

- [ ] **ai-cmd-customer-4.12.1** — `leave_visit_review`
- [ ] **ai-cmd-customer-4.12.2** — `explain_post_visit_review_prompt`
- [ ] **ai-cmd-customer-4.12.3** — `report_booking_problem`
- [ ] **ai-cmd-customer-4.12.4** — `explain_share_reward`
- [ ] **ai-cmd-customer-4.12.5** — `sign_in_after_booking`

---

### ai-cmd-customer-4.13 — App health: push, offline, updates — **customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.13.1** | `enable_push_notifications` | M | customer | “Turn on push reminders”, “Notify me on my phone” | Distinct from **`manage_notification_preferences`** (channel prefs) |
| **4.13.2** | `explain_push_permission` | R | customer | “Why didn’t I get a notification?”, “Open notification settings” | iOS provisional / Android POST_NOTIFICATIONS / denied re-ask |
| **4.13.3** | `explain_offline_mode` | R | customer | “Why does it say offline?”, “Will my booking sync?” | **`offlineStatus*`** / queued mutations |
| **4.13.4** | `explain_app_update_required` | R | customer | “Why must I update the app?”, “Skip this update” | **`appGate*`** kill switch / nudge |
| **4.13.5** | `explain_analytics_consent` | R | customer | “Why are you asking about analytics?”, “Turn off usage tracking” | **`analyticsConsent*`** |
| **4.13.6** | `explain_home_screen_widget` | R | customer | “Add next appointment to home screen”, “What does the widget show?” | **`widgetNextAppointment*`** / quick rebook |

- [ ] **ai-cmd-customer-4.13.1** — `enable_push_notifications`
- [ ] **ai-cmd-customer-4.13.2** — `explain_push_permission`
- [ ] **ai-cmd-customer-4.13.3** — `explain_offline_mode`
- [ ] **ai-cmd-customer-4.13.4** — `explain_app_update_required`
- [ ] **ai-cmd-customer-4.13.5** — `explain_analytics_consent`
- [ ] **ai-cmd-customer-4.13.6** — `explain_home_screen_widget`

---

### ai-cmd-customer-4.14 — Clinic intake, documents & lab-to-book — **customer + public**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.14.1** | `explain_public_intake_form` | R | both | “Why these health questions?”, “Can I skip the form?” | **`publicIntakeCheckout*`** before booking |
| **4.14.2** | `complete_intake_and_book` | M | both | “Fill intake and book blood draw” | Compound intake → slot |
| **4.14.3** | `explain_patient_alert` | R | customer | “What is this red banner?”, “Results ready — what do I do?” | **`ConsumerPatientAlertsBanner`** released / intake / lab-book |
| **4.14.4** | `book_lab_from_order` | M | customer | “Book collection for my lab order”, “Schedule draw from Lab to book tab” | **`LabToBookPage`** / **`myLabToBook*`** |
| **4.14.5** | `list_my_documents` | R | customer | “Show my referral letter”, “Where are my imaging reports?” | **`myDocuments*`** — NOT **`list_my_test_results`** |
| **4.14.6** | `explain_abnormal_result_flag` | R | customer | “What does high mean on my CBC?”, “Is abnormal serious?” | Measurement flags — general FAQ, not medical advice |
| **4.14.7** | `notify_when_results_ready` | R | customer | “Text me when results are ready” | Read-only explain until **`notify_patient_result_ready`** customer path exists |

- [ ] **ai-cmd-customer-4.14.1** — `explain_public_intake_form`
- [ ] **ai-cmd-customer-4.14.2** — `complete_intake_and_book`
- [ ] **ai-cmd-customer-4.14.3** — `explain_patient_alert`
- [ ] **ai-cmd-customer-4.14.4** — `book_lab_from_order`
- [ ] **ai-cmd-customer-4.14.5** — `list_my_documents`
- [ ] **ai-cmd-customer-4.14.6** — `explain_abnormal_result_flag`
- [ ] **ai-cmd-customer-4.14.7** — `notify_when_results_ready` (read explain)

---

### ai-cmd-customer-4.15 — Package visits (multi-appointment bundles) — **customer**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.15.1** | `list_my_package_visits` | R | customer | “How many package visits left?”, “When is my next facial in the bundle?” | **`ConsumerPackageVisitActions`** / grouped account cards |
| **4.15.2** | `cancel_package_visit` | M | customer | “Cancel visit 2 of my package”, “Skip next package appointment” | Distinct from **`cancel_my_booking`** (single booking) |
| **4.15.3** | `reschedule_package_visit` | M | customer | “Move package visit 3 to next week” | **`reschedulePackageVisit*`** |
| **4.15.4** | `explain_package_visit_rules` | R | customer | “Can I cancel one visit and keep the package?”, “Do unused visits expire?” | Package T&C from catalog |

- [ ] **ai-cmd-customer-4.15.1** — `list_my_package_visits` full DoD
- [ ] **ai-cmd-customer-4.15.2** — `cancel_package_visit` / **`cancel_package_visit_self`**
- [ ] **ai-cmd-customer-4.15.3** — `reschedule_package_visit` / **`reschedule_package_visit_self`**
- [ ] **ai-cmd-customer-4.15.4** — `explain_package_visit_rules`

---

### ai-cmd-customer-4.16 — Recommendations & upsell — **customer + public**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.16.1** | `explain_checkout_recommendations` | R | both | “Why these product suggestions?”, “Shop the recommended serum” | **Shipped** — extend success-screen disambiguation vs **4.3.5** |
| **4.16.2** | `dismiss_recommendations` | M | customer | “Hide You might also like”, “Stop showing product cards” | Navigate/dismiss action — not cancel booking |
| **4.16.3** | `explain_subscription_vs_one_time` | R | both | “Subscribe and save vs one visit?”, “Which plan includes massage?” | **`checkoutUseSubscription`** / plan picker |
| **4.16.4** | `buy_gift_card_for_someone` | M | customer | “Buy a $100 gift card for my mom”, “Email a digital gift card” | **`GiftCardCatalogPage`** → checkout |

- [ ] **ai-cmd-customer-4.16.1** — HY/RU for **`explain_checkout_recommendations`**
- [ ] **ai-cmd-customer-4.16.2** — `dismiss_recommendations` (mutate navigate)
- [ ] **ai-cmd-customer-4.16.3** — `explain_subscription_vs_one_time`
- [ ] **ai-cmd-customer-4.16.4** — `buy_gift_card_for_someone`

---

### ai-cmd-customer-4.17 — Sign-in, recovery & manage-booking links — **both**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.17.1** | `explain_why_sign_in` | R | both | “Do I need an account?”, “What’s the benefit of signing in?” | Guest vs authed checkout + account history |
| **4.17.2** | `sign_in_to_manage_booking` | R | both | “Sign in to change my appointment”, “Manage link says sign in” | **`ManageBookingPage`** invalid link / sign-in hint |
| **4.17.3** | `recover_lost_manage_link` | R | both | “I lost my booking confirmation email”, “Resend manage link to john@…” | Extend **`get_manage_link`** with email/phone lookup |
| **4.17.4** | `switch_salon_tenant` | R | customer | “Go back to Salon X”, “Show salons I visited” | **`ConsumerTenantSwitcher`** + **`find_my_saved_salons`** |
| **4.17.5** | `explain_data_rights` | R | both | “Export my data”, “Delete my account” | **Shipped** — pair with **`privacy_export`** / **`privacy_delete`** mutate ( **4.0** P2) |

- [ ] **ai-cmd-customer-4.17.1** — `explain_why_sign_in`
- [ ] **ai-cmd-customer-4.17.2** — `sign_in_to_manage_booking`
- [ ] **ai-cmd-customer-4.17.3** — `recover_lost_manage_link`
- [ ] **ai-cmd-customer-4.17.4** — Full DoD for **`find_my_saved_salons`** + tenant switch navigate
- [ ] **ai-cmd-customer-4.17.5** — Promote **`privacy_export`** / **`privacy_delete`** from **4.0** P2

---

### ai-cmd-customer-4.18 — Payment & checkout failures — **both**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.18.1** | `diagnose_stripe_checkout_failure` | R | both | “Payment failed — what now?”, “Card declined at checkout” | Customer-facing slice of dashboard diagnose |
| **4.18.2** | `pay_at_venue_fallback` | M | both | “Pay at salon instead”, “Skip online payment” | **`activationPayAtVenue*`** when prepayment optional |
| **4.18.3** | `resume_booking_draft` | R | both | “Continue where I left off”, “Restore my half-finished booking” | **`bookingDraftResume*`** slot/service restore |
| **4.18.4** | `explain_slot_no_longer_available` | R | both | “That time disappeared”, “Someone took my slot” | Re-run **`check_availability`** + explain lock TTL |
| **4.18.5** | `explain_multi_service_payment_return` | R | customer | “I paid but booking not confirmed”, “Return from Stripe for spa day” | **`multiServicePaymentReturnHint`** |
| **4.18.6** | `retry_failed_network_action` | R | customer | “Booking didn’t save — retry?”, “Sync failed” | **`networkRetryAction`** / offline queue |

- [ ] **ai-cmd-customer-4.18.1** — `diagnose_stripe_checkout_failure` (customer/public)
- [ ] **ai-cmd-customer-4.18.2** — `pay_at_venue_fallback`
- [ ] **ai-cmd-customer-4.18.3** — `resume_booking_draft`
- [ ] **ai-cmd-customer-4.18.4** — `explain_slot_no_longer_available`
- [ ] **ai-cmd-customer-4.18.5** — `explain_multi_service_payment_return`
- [ ] **ai-cmd-customer-4.18.6** — `retry_failed_network_action`

---

### ai-cmd-customer-4.19 — Voice assistant & accessibility — **customer + public**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.19.1** | `explain_voice_input` | R | both | “How do I use voice?”, “Mic not working” | **`voiceStart`** / denied / no-speech errors |
| **4.19.2** | `speak_assistant_reply` | M | both | “Read that aloud”, “Speak the answer” | **`speakReply`** TTS |
| **4.19.3** | `give_ai_feedback` | M | both | “That was wrong”, “Wrong date picked” | **`feedbackUp`** / **`feedbackDown`** + reason chips |
| **4.19.4** | `explain_rtl_layout` | R | both | “Why is text on the right?” | RTL copy / **`adoption-a11y.css`** |

- [ ] **ai-cmd-customer-4.19.1** — `explain_voice_input`
- [ ] **ai-cmd-customer-4.19.2** — `speak_assistant_reply`
- [ ] **ai-cmd-customer-4.19.3** — `give_ai_feedback`
- [ ] **ai-cmd-customer-4.19.4** — `explain_rtl_layout`

---

### ai-cmd-customer-4.20 — Additional checkout & discovery edge cases — **both**

| ID | Intent (proposed) | R/M | Surfaces | Example prompts | Notes |
|----|-------------------|-----|----------|-----------------|-------|
| **4.20.1** | `explain_consumer_checkout_tax` | R | customer | “Why incl. VAT on services?”, “Tax line on confirmation” | **Shipped** — public sibling **`explain_checkout_tax`** |
| **4.20.2** | `explain_deposit_forfeiture` | R | both | “Do I lose my deposit if I cancel?”, “Is the 50% refundable?” | Tie **`explain_cancel_policy`** + `prepaymentMode=deposit` |
| **4.20.3** | `find_services_under_budget` | R | both | “Anything under $50?”, “Cheapest color treatment” | **`assistantDiscoverChipUnder50`** / budget discover |
| **4.20.4** | `find_evening_weekend_slots` | R | both | “Evening or weekend only”, “After 6pm Saturday” | **`assistantDiscoverChipEveningWeekend`** |
| **4.20.5** | `explain_salon_profile` | R | both | “Tell me about this salon”, “Show photos and reviews” | **`SalonProfilePage`** navigate |
| **4.20.6** | `claim_gift_card_balance` | M | customer | “Redeem gift card code GCM-…”, “Add gift card to account” | **`ConsumerGiftCardClaimSection`** |
| **4.20.7** | `explain_manage_booking_page` | R | both | “What can I do on this manage page?”, “Invalid manage link” | Guest **`ManageBookingPage`** UX |

- [ ] **ai-cmd-customer-4.20.1** — Public **`explain_checkout_tax`** parity with consumer tax intent
- [ ] **ai-cmd-customer-4.20.2** — `explain_deposit_forfeiture`
- [ ] **ai-cmd-customer-4.20.3** — Wire budget discover chips → classifier
- [ ] **ai-cmd-customer-4.20.4** — Wire evening/weekend discover chips → classifier
- [ ] **ai-cmd-customer-4.20.5** — `explain_salon_profile`
- [ ] **ai-cmd-customer-4.20.6** — `claim_gift_card_balance`
- [ ] **ai-cmd-customer-4.20.7** — `explain_manage_booking_page`

---

### ai-cmd-customer-4.21 — More customer compounds

| ID | Recipe | Steps | Example prompt |
|----|--------|-------|----------------|
| **4.21.1** | `intake_lab_book_pay` | intake → lab slot → pay online | “Complete health form, book earliest blood draw, pay deposit” |
| **4.21.2** | `tour_group_checkout` | tour pax → **`diagnose_tour_capacity`** → book | “Wine tour for 6 next Saturday — book if enough seats” |
| **4.21.3** | `provider_same_day_multi` | pick provider → multi-service afternoon block | “Anna — massage and facial same afternoon” |
| **4.21.4** | `subscription_first_visit` | explain plan → book with subscription credit | “Use my membership for today’s massage” |
| **4.21.5** | `results_then_rebook` | **`explain_result_status`** → **`rebook_last_appointment`** | “Results released — book follow-up like last time” |
| **4.21.6** | `guest_pay_cash_manage` | guest book → pay cash → email manage link | “Book as guest, pay at visit, email manage link” |
| **4.21.7** | `cancel_package_rebook_single` | cancel package visit → book single service | “Skip package visit 2 and book a trim instead” |

- [ ] **ai-cmd-customer-4.21.1** — `intake_lab_book_pay`
- [ ] **ai-cmd-customer-4.21.2** — `tour_group_checkout`
- [ ] **ai-cmd-customer-4.21.3** — `provider_same_day_multi`
- [ ] **ai-cmd-customer-4.21.4** — `subscription_first_visit`
- [ ] **ai-cmd-customer-4.21.5** — `results_then_rebook`
- [ ] **ai-cmd-customer-4.21.6** — `guest_pay_cash_manage`
- [ ] **ai-cmd-customer-4.21.7** — `cancel_package_rebook_single`

---

### ai-cmd-customer-4 — Suggested implementation order

| Phase | IDs | Customer outcome |
|-------|-----|------------------|
| **A — Checkout clarity** | **4.2.1**–**4.2.2**, **4.1.2**, **4.18.1**–**4.18.3**, **4.0** (`pay_online`, `explain_why_stripe_required`) | Less “how much do I pay?” / guest field / payment failure confusion |
| **B — Self-serve visits** | **4.4.2**–**4.4.3**, **4.4.5**, **4.17.3**, **4.8.3**, **4.20.7** | Cancel/reschedule / recover manage link without calling |
| **C — Faster rebooking** | **4.4.8**, **4.3.6**, **4.8.2**, **4.21.5** | One-tap repeat bookings + post-results follow-up |
| **D — Discovery** | **4.1.3**, **4.1.5**, **4.1.7**, **4.20.3**–**4.20.4**, **4.11.*** | Find affordable / soonest slot / stylist in one ask |
| **E — Loyalty & packages** | **4.5.***, **4.6.***, **4.15.***, **4.8.4**, **4.21.4** | Subscriptions, gift cards, spa packages, package visits |
| **F — Clinic & tours** | **4.7.***, **4.10.***, **4.14.***, **4.21.1**–**4.21.2** | Lab prep, results, intake, tour capacity |
| **G — App polish** | **4.9.***, **4.12.***, **4.13.***, **4.19.*** | Chips, reviews, push/offline, voice |
| **H — Upsell & growth** | **4.16.***, **4.12.4**, **4.5.7**, **4.17.4** | Recommendations, referrals, saved salons |

**Key files (customer):**

| Layer | Public web | Consumer mobile |
|-------|------------|-----------------|
| Classifier | `public-booking-classifier.schema.ts` | `customer-ai-command.util.ts` |
| Handler | `PublicBookingAssistantService` | `CustomerAiCommandService` → `customer-ai-command.logic.ts` |
| Rescue | `PublicBookingAssistantService.chat()` | `CustomerAiCommandService` + `rescueConsumerAdoptionIntent` |
| Fixtures | `surface: public \| both` in domain `*.fixtures.ts` | `surface: customer \| both` |
| Eval | `AI_COMMAND_EVAL_*` with `surface: public` | same harness with `surface: customer` |

**Cross-links:** **ai-cmd-customer-1**–**3** (discovery spine), **ai-cmd-ext-7** (payment explain parity with dashboard config), **ai-cmd-h1**–**h4** (NLU quality), **feature-ai-prompt-coverage** (both surfaces mandatory).

---

## ai-cmd-customer-6 — Customer public API ↔ AI coverage audit

**Audit (2026-06):** Map every customer/consumer/public REST call to an AI intent (or document intentional UI-only / no-AI). Sources: **`public-booking.controller.ts`**, **`gift-card-public.controller.ts`**, **`consumer-app/src/services/public-api.ts`**, **`frontend/src/lib/public-api.ts`**.

**Totals:** ~**95** HTTP operations → **~38 covered** (handler wired), **~32 partial** (deferred registry / read-only explain / navigate handoff), **~25 gaps** (no intent or API-only with no assistant path).

**Bulk note:** Customer public API has **no** dashboard-style `bulk_create` / `bulk_update` / `bulk_delete` routes. “Bulk” customer behavior is **array/batch semantics inside single endpoints** — multi-service cart, `book_multi_service`, package reschedule `lines[]`, GDPR export (single dump). New AI work should use **compounds** or **array params** on existing intents, not invent REST bulk routes unless product adds them.

---

### ai-cmd-customer-6.0 — Coverage legend

| Status | Meaning |
|--------|---------|
| **✅ Covered** | Intent in registry + handler in `customer-ai-command.logic.ts` or `PublicBookingAssistantService` |
| **🟡 Partial** | Intent exists but **deferred**, explain-only, or does not call the API mutate path |
| **🔴 Gap** | No intent; user cannot accomplish via assistant |
| **⚪ N/A** | Telemetry, static config, or auth bootstrap — no AI needed |

---

### ai-cmd-customer-6.1 — Discovery & catalog (read)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET /public/:slug` | 🟡 | `business_info` (public) | Extend profile fields (app install, privacy flags) |
| `GET …/services`, `…/providers`, slots, nearest-slot, for-slot | ✅ | `list_services`, `list_providers`, `check_availability`, `check_providers_for_service`, `book_nearest_slot` | Harden deferred |
| `GET …/packages`, suggest-*, block-slots, providers | 🟡 | `discover_packages`, `check_package_availability`, `check_package_line_availability` | **`suggest_package_block`** navigate gap |
| `GET …/multi-service/*` (settings, block-slots, suggest-*, providers) | 🟡 | `check_multi_service_availability`, `check_multi_service_block_availability`, `show_cart_total_duration` | **`preview_multi_service_cart`** → `POST multi-service/preview` **🔴** |
| `GET …/services/:id/subscription-plans` | 🟡 | `discover_subscription_plans`, `select_subscription_plan` | Read path OK; promote deferred |
| `GET …/promotions` | 🔴 | — | **`list_public_promotions`** |
| `GET …/providers/:id/reviews` | 🔴 | — | **`list_provider_reviews`** (read before book) |
| `GET …/app-install` | 🟡 | `how_to_download_app`, `switch_to_consumer_app` | Align copy with QR landing |

- [ ] **ai-cmd-customer-6.1.1** — `preview_multi_service_cart` → `POST …/multi-service/preview`
- [ ] **ai-cmd-customer-6.1.2** — `list_public_promotions` → `GET …/promotions`
- [ ] **ai-cmd-customer-6.1.3** — `list_provider_reviews` → `GET …/providers/:id/reviews`
- [ ] **ai-cmd-customer-6.1.4** — `suggest_package_block` navigate → package suggest-block/suggest-slots APIs

---

### ai-cmd-customer-6.2 — Booking checkout pipeline (mutate + quote)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/bookings/quote` | 🔴 | `promo_code_help` (explain only) | **`get_booking_quote`** — apply promo/loyalty in session |
| `POST …/bookings` | ✅ | `book_with_cash`, `book_nearest_slot`, `book_appointment` | — |
| `POST …/bookings/checkout` | 🟡 | `pay_online`, `choose_payment_method` | Promote **4.0 P0** |
| `POST …/bookings/confirm-payment` | 🟡 | `pay_online` | **`confirm_stripe_payment`** explicit post-return step **🔴** |
| `POST …/packages/quote` | 🔴 | — | **`get_package_quote`** |
| `POST …/packages/book`, `…/checkout` | ✅ | `book_package`, `pay_online` | — |
| `POST …/multi-service/quote` | 🔴 | — | **`get_multi_service_quote`** |
| `POST …/multi-service/book`, `…/checkout` | 🟡 | `book_multi_service`, `pay_online` | Promote deferred **4.0 P1** |

- [ ] **ai-cmd-customer-6.2.1** — `get_booking_quote` → `POST …/bookings/quote`
- [ ] **ai-cmd-customer-6.2.2** — `confirm_stripe_payment` → `POST …/bookings/confirm-payment`
- [ ] **ai-cmd-customer-6.2.3** — `get_package_quote` → `POST …/packages/quote`
- [ ] **ai-cmd-customer-6.2.4** — `get_multi_service_quote` → `POST …/multi-service/quote`

---

### ai-cmd-customer-6.3 — Manage booking (guest token + logged-in)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/me/bookings` | ✅ | `list_my_appointments`, `my_appointments` | — |
| `POST …/me/bookings/:id/cancel` | 🟡 | `cancel_my_booking` | Promote **4.0 P0** |
| `POST …/me/bookings/:id/reschedule` | 🟡 | `reschedule_my_booking`, `change_provider_on_reschedule` | Promote **4.0 P0** |
| `POST …/me/bookings/:id/package/cancel` | 🟡 | `cancel_package_visit_self` | Promote **4.0 P2** |
| `POST …/me/bookings/:id/package/reschedule` | 🟡 | `reschedule_package_visit_self` | **`reschedule_package_lines`** multi-line body **🟡** |
| `GET …/bookings/manage` | 🟡 | `get_manage_link` | **`explain_manage_booking_context`** read **4.20.7** |
| `POST …/bookings/manage/cancel` | 🔴 | — | **`cancel_booking_with_token`** (guest) |
| `POST …/bookings/manage/reschedule` | 🔴 | — | **`reschedule_booking_with_token`** (guest) |
| `POST …/bookings/manage/package/*` | 🔴 | — | **`cancel_package_visit_with_token`**, **`reschedule_package_visit_with_token`** |

- [ ] **ai-cmd-customer-6.3.1** — Guest manage-token mutates (**6.3** table) — public + customer classifier parity
- [ ] **ai-cmd-customer-6.3.2** — `reschedule_package_lines` — one NL command → `lines[]` on package reschedule API
- [ ] **ai-cmd-customer-6.3.3** — Compound **`guest_manage_visit`**: `get_manage_link` → cancel/reschedule with token

---

### ai-cmd-customer-6.4 — Pre-visit intake (full gap)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/checkout/pre-visit-intake/config` | 🟡 | `explain_public_intake_form` (**4.14.1** proposed) | Read |
| `POST …/me/pre-visit-intake/draft` | 🔴 | — | **`create_intake_draft`** |
| `GET …/me/pre-visit-intake/:id` | 🔴 | — | **`get_intake_flow_status`** |
| `POST …/…/start` | 🔴 | — | **`start_pre_visit_intake`** |
| `POST …/…/answers` | 🔴 | — | **`submit_intake_answers`** (single + **batch answers** in one session) |

- [ ] **ai-cmd-customer-6.4.1** — Intake mutate chain: draft → start → submit → continue booking (**4.14.2**, **4.21.1**)
- [ ] **ai-cmd-customer-6.4.2** — Compound **`complete_intake_and_book`** wired to real API handlers

---

### ai-cmd-customer-6.5 — Account, auth, locale, privacy

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/auth/google|apple|phone` | 🔴 | `explain_why_sign_in` (**4.17.1** proposed) | **`sign_in_with_google`** navigate/mutate handoff |
| `GET …/auth/me` | ✅ | `my_profile` | — |
| `GET/PATCH …/me/locale` | 🔴 | — | **`get_my_locale`**, **`update_my_locale`** |
| `GET/PATCH …/me/notification-preferences` | 🟡 | `manage_notification_preferences`, `explain_my_notifications` | Promote adoption intents |
| `GET/DELETE …/me/data` | 🟡 | `privacy_export`, `privacy_delete`, `explain_data_rights` | Promote **4.0 P2** |

- [ ] **ai-cmd-customer-6.5.1** — `update_my_locale` → `PATCH …/me/locale`
- [ ] **ai-cmd-customer-6.5.2** — Auth mutate handoff intents (Google/Apple/Phone) — explain + deep link, not store password via AI
- [ ] **ai-cmd-customer-6.5.3** — No **`PATCH …/me/profile`** API today — **`update_my_profile`** (**4.5.6**) blocked on product API or document UI-only

---

### ai-cmd-customer-6.6 — Loyalty, rewards, referrals, share

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/me/loyalty` | 🟡 | `loyalty_points_balance` | **`explain_loyalty_points`** **4.5.1** |
| `GET …/me/rewards` | 🔴 | — | **`explain_rewards_wallet`** (promos + points) |
| `GET …/me/referral` | 🟡 | `refer_a_friend` | Read OK |
| `POST …/me/referral/claim` | 🔴 | — | **`claim_referral_code`** |
| `GET …/me/share-rewards` | 🟡 | `share_my_booking`, `share_salon_link` | Explain share rewards **4.12.4** |
| `POST …/me/share-rewards/claim` | 🔴 | — | **`claim_share_reward`** |
| `GET …/me/subscriptions`, `…/active`, `…/usage` | 🟡 | `my_subscriptions`, `subscription_usage`, `use_subscription_credit` | Promote **4.5.3** |

- [ ] **ai-cmd-customer-6.6.1** — `explain_rewards_wallet` → `GET …/me/rewards`
- [ ] **ai-cmd-customer-6.6.2** — `claim_referral_code` → `POST …/me/referral/claim`
- [ ] **ai-cmd-customer-6.6.3** — `claim_share_reward` → `POST …/me/share-rewards/claim`

---

### ai-cmd-customer-6.7 — Gift cards

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/gift-cards/catalog` | 🟡 | `discover_gift_card_products`, `buy_gift_card` | — |
| `POST …/quote`, `checkout`, `purchase` | 🟡 | `buy_gift_card`, `buy_gift_card_physical`, `pay_online` | **`get_gift_card_quote`** **🔴** |
| `POST …/claim` | 🟡 | `apply_gift_card_code` | **`claim_gift_card_to_account`** distinct from checkout apply **4.20.6** |
| `GET …/orders`, `…/orders/:id` | 🟡 | `my_gift_cards`, `track_physical_gift_card_order` | **`explain_gift_card_order`** **🔴** |
| `POST …/cancel-request`, `modify-request` | 🟡 | `request_gift_card_cancel`, `request_gift_card_modify` | Promote **4.0 P2** |

- [ ] **ai-cmd-customer-6.7.1** — `get_gift_card_quote` → `POST …/gift-cards/quote`
- [ ] **ai-cmd-customer-6.7.2** — `claim_gift_card_to_account` → `POST …/gift-cards/claim`
- [ ] **ai-cmd-customer-6.7.3** — `explain_gift_card_order` → `GET …/gift-cards/orders/:id`

---

### ai-cmd-customer-6.8 — Clinic (results, documents, alerts, lab-to-book)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/me/clinic-test-results` | 🟡 | `list_my_test_results`, `explain_result_status` | Promote clinic deferred |
| `GET …/me/clinic-lab-booking-requests` | 🟡 | `list_my_lab_booking_requests`, `book_lab_collection` | **4.14.4** |
| `GET …/me/clinic-documents` | 🔴 | — | **`list_my_clinic_documents`** |
| `GET …/me/clinic-documents/:id` | 🔴 | — | **`open_clinic_document`** |
| `GET …/me/clinic-patient-alerts` | 🟡 | `explain_patient_alert` (**4.14.3** proposed) | Read |
| `POST …/…/dismiss` | 🔴 | — | **`dismiss_patient_alert`** |

- [ ] **ai-cmd-customer-6.8.1** — `list_my_clinic_documents` + `open_clinic_document`
- [ ] **ai-cmd-customer-6.8.2** — `dismiss_patient_alert` → `POST …/clinic-patient-alerts/…/dismiss`

---

### ai-cmd-customer-6.9 — Reviews & support

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/reviews/context`, `POST …/reviews` | 🔴 | — | **`submit_review_with_token`** (email link guest) |
| `POST …/providers/:id/reviews` | 🔴 | — | **`submit_provider_review`** |
| `GET/POST …/me/bookings/:id/review` | 🔴 | `leave_visit_review` (**4.12.1** proposed) | **`submit_my_booking_review`** |
| `POST …/me/support/ticket` | ✅ | `contact_support`, `open_ticket_for_order` | — |

- [ ] **ai-cmd-customer-6.9.1** — `submit_my_booking_review` → logged-in review API
- [ ] **ai-cmd-customer-6.9.2** — `submit_provider_review` → provider review API
- [ ] **ai-cmd-customer-6.9.3** — `submit_review_with_token` → guest email review flow

---

### ai-cmd-customer-6.10 — Checkout recommendations & upsell

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/checkout/recommendations` | 🟡 | `explain_checkout_recommendations` | Read |
| `POST …/checkout/recommendations/events` | ⚪ | — | Analytics — no AI |
| Dismiss UI (client-only) | 🔴 | `dismiss_recommendations` (**4.16.2** proposed) | Client state — navigate intent |

- [ ] **ai-cmd-customer-6.10.1** — `dismiss_recommendations` — client navigate + session flag (no REST)

---

### ai-cmd-customer-6.11 — Push, mobile config, analytics

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/me/push/register-native` | 🟡 | `enable_notifications`, `enable_push_notifications` | Provider has intent; **customer push register gap** **🔴** |
| `POST …/me/push/delivery-ack` | ⚪ | — | Background — no AI |
| `GET …/me/push/native-status` | 🔴 | — | **`explain_push_registration_status`** |
| `GET /mobile-app/config` | 🟡 | `explain_app_update_gate` (**4.13.4** proposed) | Consumer version gate |
| `POST /events/app` | ⚪ | — | Analytics consent UI — **`explain_analytics_consent`** **4.13.5** |
| `GET …/assistant/capabilities` | ⚪ | — | Meta — chips derive from parity file |
| `POST …/assistant` | ✅ | All customer/public intents | Gateway |

- [ ] **ai-cmd-customer-6.11.1** — **`register_customer_push`** → `POST …/me/push/register-native`
- [ ] **ai-cmd-customer-6.11.2** — `explain_push_registration_status` → `GET …/me/push/native-status`

---

### ai-cmd-customer-6.12 — “Bulk-like” batch semantics (no REST bulk routes)

Customer APIs encode **multi-record** work inside single calls — AI should mirror with **array params** or **compounds**, not dashboard `bulk_*` intents.

| Batch pattern | API shape | Current AI | Proposed |
|---------------|-----------|------------|----------|
| **Multi-add cart** | Client loops or single preview | `add_services_to_cart` (one service per call?) | **`add_services_to_cart`** accept **`serviceNames[]`** / **`serviceIds[]`** — one prompt → multiple cart lines |
| **Multi-service book** | `POST multi-service/book` one payload | `book_multi_service` deferred | Promote + compound with quote |
| **Package multi-line reschedule** | `lines[]` on package reschedule | `reschedule_package_visit_self` | **`reschedule_package_lines`** explicit array param |
| **Intake multi-answer** | Repeated `POST …/answers` | — | **`submit_intake_answers`** batch in one compound step |
| **Cancel all upcoming** | ❌ no API | — | **Out of scope** until `POST me/bookings/bulk-cancel` exists; do not fake via AI loop without confirm |
| **Export all data** | Single `GET me/data` dump | `privacy_export` | ✅ single-shot “bulk read” |
| **Delete account** | Single `DELETE me/data` | `privacy_delete` | ✅ single-shot “bulk delete” |

- [ ] **ai-cmd-customer-6.12.1** — Extend **`add_services_to_cart`** handler for **`serviceIds[]`** (true multi-add in one NL command)
- [ ] **ai-cmd-customer-6.12.2** — **`reschedule_package_lines`** — map NL “move visits 2 and 3 to next week” → `lines[]`
- [ ] **ai-cmd-customer-6.12.3** — Document **no customer bulk-delete bookings** in capability matrix; redirect to **`cancel_my_booking`** per visit or **`contact_support`**
- [ ] **ai-cmd-customer-6.12.4** — If product adds bulk APIs later, add rows to **`customer-public-api-ai-parity.fixtures.ts`** first

---

### ai-cmd-customer-6.13 — Parity gate (mirror **prov-exp-11**)

Automate this audit so new public endpoints cannot ship without an AI mapping row.

| ID | Task | Notes |
|----|------|-------|
| **6.13.1** | **`customer-public-api-ai-parity.fixtures.ts`** | One row per `public-api.ts` export → `{ kind: 'customer-ai' \| 'public-ai' \| 'dashboard-only' \| 'no-ai' }` |
| **6.13.2** | **`test:customer-api-ai-parity`** | Fails on new export without fixture row (like **`test:prov-exp-ai-parity`**) |
| **6.13.3** | Extend **`auditCustomerIntentCoverage()`** | Cross-check mutating intents have ≥1 API binding |
| **6.13.4** | **`ai-cmd-customer-gap-9`** | Block feature **done** until API row has intent or explicit **`no-ai`** reason |

- [ ] **ai-cmd-customer-6.13.1** — Create parity fixtures from this audit table
- [ ] **ai-cmd-customer-6.13.2** — Wire **`npm run test:customer-api-ai-parity`**
- [ ] **ai-cmd-customer-6.13.3** — Coverage util cross-check
- [ ] **ai-cmd-customer-6.13.4** — Document in **ai-cmd-customer-gap-8** checklist

---

### ai-cmd-customer-6 — Gap summary (new intents to register)

**P0 — checkout & visits (blocks booking completion):**

`get_booking_quote`, `confirm_stripe_payment`, `get_multi_service_quote`, `cancel_booking_with_token`, `reschedule_booking_with_token`, `preview_multi_service_cart`

**P1 — account growth & gifts:**

`claim_referral_code`, `claim_share_reward`, `claim_gift_card_to_account`, `get_gift_card_quote`, `explain_rewards_wallet`, `register_customer_push`

**P2 — clinic, intake, reviews:**

`create_intake_draft`, `start_pre_visit_intake`, `submit_intake_answers`, `list_my_clinic_documents`, `open_clinic_document`, `dismiss_patient_alert`, `submit_my_booking_review`

**P3 — read/helpers:**

`list_public_promotions`, `list_provider_reviews`, `explain_gift_card_order`, `update_my_locale`, `explain_push_registration_status`, guest package manage-token mutates

**Batch extensions (not new REST):**

`add_services_to_cart[]`, `reschedule_package_lines[]`, intake answer batch compound

---

### ai-cmd-customer-6 — Suggested implementation order

| Phase | IDs | Closes API gaps |
|-------|-----|-----------------|
| **A — Quote & pay** | **6.2.*** , **6.12.1** | Checkout quote + Stripe confirm + multi-add cart |
| **B — Guest manage** | **6.3.*** | Manage-token cancel/reschedule |
| **C — Intake + clinic** | **6.4.*** , **6.8.*** | Intake chain + documents + dismiss alert |
| **D — Growth** | **6.6.*** , **6.7.*** | Referral/share claim, gift quote/claim |
| **E — Reviews & push** | **6.9.*** , **6.11.*** | Submit review, push register |
| **F — Gate** | **6.13.*** | Parity CI so gaps don’t regress |

**Cross-links:** **ai-cmd-customer-4** (ease-of-life — many proposed intents overlap **6.x** rows), **ai-cmd-customer-gap-5** (eval/fixtures), **ai-cmd-ext-7** (payment explain), **feature-ai-prompt-coverage** (both surfaces).

---

### ai-cmd-customer-6.14 — Product blockers & out-of-scope (not AI-only work)

| ID | Item | Why it affects AI | Action |
|----|------|-------------------|--------|
| **6.14.1** | **Nearest-slot path mismatch** | Consumer app calls `GET /public/:slug/nearest-slot?serviceId=` but backend is `GET …/services/:serviceId/nearest-slot` — breaks **`book_nearest_slot`** / discovery from app | Fix **`consumer-app/src/services/public-api.ts`** `fetchNearestBookableSlot` |
| **6.14.2** | **Customer waitlist join** | **`join_waitlist`** (**4.4.7**) has **no public REST route** today (dashboard **`offer_waitlist_slot`** only) | Product API first, then intent |
| **6.14.3** | **Customer profile PATCH** | **`update_my_profile`** (**4.5.6**) — only `PATCH me/locale` exists; no name/phone API | Product API or UI-only |
| **6.14.4** | **Deep links / tab navigation** | Rebook, tenant switch, manage link open — client routes, not REST | Navigate intents only (**4.17.4**, **4.4.8**) |
| **6.14.5** | **Dashboard bulk ops** | `bulk_create_bookings`, `bulk_smart_cancel`, etc. — **staff only**, not customer surface | Track under **ai-cmd-dashboard-6**, not **6.x** |

- [ ] **ai-cmd-customer-6.14.1** — Fix nearest-slot URL in consumer app (unblocks **`book_nearest_slot`** E2E)
- [ ] **ai-cmd-customer-6.14.2** — Document waitlist customer API dependency in **4.4.7**

**Next audit:** see **`ai-cmd-provider-6`** (provider public API ↔ AI parity — full audit below **ai-cmd-provider-5**).

---

**Goal:** Make **`provider-app/`** the fastest path for stylists and floor managers between appointments — voice-friendly, one-sentence actions, minimal typing. **Provider mobile only** (`ProviderAiCommandService` / `PROVIDER_INTENT_SCHEMA`); dashboard admin stays under **ai-cmd-ext**.

**Principle:** Session context first (`bookingId` from open detail modal, `lastPush`, today’s timeline). Prefer **mutate + confirm** for irreversible actions (cancel, mark paid). Mirror every **prov-exp** UI action in **`PROVIDER_EXP_UI_AI_PARITY`** (`provider-exp-ai-parity.fixtures.ts`).

**Pain themes from product:** check-in while greeting client, “who’s next” on busy floor, mark paid at chair, fill cancellation gaps, retail upsell without leaving booking, running late SMS, offline queue after spotty Wi‑Fi, push confirm/mark paid from notification, clinic draw queue, end-of-day sweep, pending confirmations, in-progress vs complete status, multi-service spa days, gift card fulfillment queue, patient lookup before draw, tax line on payment breakdown, team view vs own calendar scope, hands-free voice between clients.

**Baseline (already wired — harden, don’t re-build):** `summarize_client`, `check_in_client`, `mark_running_late`, `mark_paid`, `payment_sweep`, `add_retail_to_booking`, `send_client_message`, `block_my_time`, `request_time_off`, `team_floor_status`, `team_whos_next`, `suggest_waitlist_for_gap`, `confirm_booking_from_push`, `explain_last_push`, clinic collection queue — see **`provider-ai-command.service.ts`** switch + **ai-cmd-ext-3**.

---

### ai-cmd-provider-5.0 — Harden existing intents (prov-exp parity + eval DoD)

Shipped handlers exist; gap is ≥10 EN + HY/RU fixtures, rescue, eval `surface: provider`, integration rows per **feature-ai-prompt-coverage**.

| Priority | Intent | Why it helps providers | prov-exp / notes |
|----------|--------|------------------------|------------------|
| **P0** | `mark_paid` | Close visit at chair without dashboard | push action **`mark_paid`** |
| **P0** | `check_in_client` | Arrival flow | **prov-exp-3.1** |
| **P0** | `summarize_client` | Pre-visit snapshot | **prov-exp-1.1** |
| **P0** | `show_appointments` / `summarize_my_appointments` | “What’s on today?” | **prov-exp-3.3** |
| **P1** | `payment_sweep` | End-of-day bulk mark paid | suggestions **`unpaid-today`** |
| **P1** | `reschedule_booking` | Move one appointment | push **`suggest_reschedule`** |
| **P1** | `cancel_bookings` | Client cancelled by phone | — |
| **P1** | `mark_no_shows` | Close missed slots | — |
| **P1** | `add_retail_to_booking` | POS at chair | **prov-exp-5.1** |
| **P1** | `send_client_message` | SMS/WhatsApp without copy-paste | **prov-exp-6.1** |
| **P2** | `team_floor_status` / `team_whos_next` | Manager floor | **prov-exp-4.1** / **4.3** |
| **P2** | `suggest_waitlist_for_gap` | Fill open shift | **prov-exp-7.3** |
| **P2** | `list_my_collection_queue` | Clinic draw list | clinic vertical |
| **P2** | `offline_queue_status` / `retry_offline_action` | Spotty salon Wi‑Fi | offline assistant |
| **P3** | `update_bookings` | Start service / in-progress without full reschedule | booking detail status picker |
| **P3** | `explain_appointment_tax` / `explain_payment_status` | “Why pending?” / VAT on breakdown | **`BookingPaymentBreakdown`** |
| **P3** | `list_my_multi_service_groups` | Spa-day sequence at chair | multi-service badge |
| **P3** | `configure_provider_push_date_format` | Push times look wrong | fmt-1.8 push bodies |

- [ ] **ai-cmd-provider-5.0.1** — Audit **`PROVIDER_EXP_UI_AI_PARITY`** → every `provider-ai` row has ≥10 NL fixtures + eval
- [ ] **ai-cmd-provider-5.0.2** — **`npm run test:prov-exp-ai-parity`** gate — fail on new UI action without intent mapping
- [ ] **ai-cmd-provider-5.0.3** — Promote P0 table through locale parity spec (pattern: **`ai-provider-*-locale-parity.spec.ts`**)

---

### ai-cmd-provider-5.1 — Start of day & schedule glance — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.1.1** | `summarize_day` | R | “How’s today looking?”, “Any no-shows yet?” | Status breakdown narrative — extend fixtures |
| **5.1.2** | `show_appointments` | R | “Who do I see at 2pm?”, “List my afternoon” | Filter by time/status; **5.0 P0** |
| **5.1.3** | `summarize_my_appointments` | R | “How many bookings tomorrow?” | Count-only — vs full list |
| **5.1.4** | `who_is_next` | R | “Who’s my next client?”, “Next appointment” | Thin alias → **`show_appointments`** + next slot |
| **5.1.5** | `explain_today_timeline` | R | “Walk me through my day”, “Gaps between clients?” | **`ProviderTodayTimeline`** + gap chips |
| **5.1.6** | `summarize_utilization` | R | “How full is my week?”, “Open hours this month?” | **`ProviderCalendarMonth`** bands |
| **5.1.7** | `end_of_day_summary` | R | “Wrap up today”, “Anything still unpaid?” | **Shipped** — extend unpaid + no-show copy |

- [ ] **ai-cmd-provider-5.1.1** — Full DoD **`summarize_day`**
- [ ] **ai-cmd-provider-5.1.2** — Full DoD **`show_appointments`** (time filters)
- [ ] **ai-cmd-provider-5.1.3** — Full DoD **`summarize_my_appointments`**
- [ ] **ai-cmd-provider-5.1.4** — `who_is_next` alias + navigate to booking detail
- [ ] **ai-cmd-provider-5.1.5** — `explain_today_timeline`
- [ ] **ai-cmd-provider-5.1.6** — Full DoD **`summarize_utilization`**
- [ ] **ai-cmd-provider-5.1.7** — Full DoD **`end_of_day_summary`**

---

### ai-cmd-provider-5.2 — At the chair (client in seat) — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.2.1** | `summarize_client` | R | “What should I know about Jane?”, “First visit?” | **Shipped** — badges, loyalty, intake summary |
| **5.2.2** | `show_client_history` | R | “Past visits for Maria”, “Last color formula note?” | **`CustomerVisitHistoryStrip`** |
| **5.2.3** | `add_client_note` | M | “Note: prefers silent appointment”, “Add allergy note” | **`BookingCustomerStaffNotesSection`** |
| **5.2.4** | `explain_client_intake` | R | “Summarize her health form”, “Any intake flags?” | **`BookingPreVisitIntakeSection`** read-only |
| **5.2.5** | `check_in_client` | M | “Check in Jane”, “Client arrived” | **Shipped** **5.0 P0** |
| **5.2.6** | `mark_running_late` | M | “I’m 10 minutes behind”, “Running late for 3pm” | **Shipped** — add **`mark_ready_now`** sibling |
| **5.2.7** | `mark_visit_complete` | M | “Mark done”, “Finish this appointment” | **`update_bookings`** status=completed — dedicated intent |
| **5.2.8** | `explain_package_visit_context` | R | “Which visit is this in her package?”, “2 of 6 facials” | **`BookingCheckoutContextBadges`** |
| **5.2.9** | `explain_multi_service_timeline` | R | “What’s next after this blowdry?”, “Spa day order” | **`list_my_multi_service_groups`** read |

- [ ] **ai-cmd-provider-5.2.1** — HY/RU eval **`summarize_client`**
- [ ] **ai-cmd-provider-5.2.2** — Full DoD **`show_client_history`**
- [ ] **ai-cmd-provider-5.2.3** — Full DoD **`add_client_note`**
- [ ] **ai-cmd-provider-5.2.4** — `explain_client_intake`
- [ ] **ai-cmd-provider-5.2.5** — Voice fixtures: “check in [name]”
- [ ] **ai-cmd-provider-5.2.6** — `mark_ready_now` (clears running-late flag)
- [ ] **ai-cmd-provider-5.2.7** — `mark_visit_complete` (disambiguate vs **`mark_paid`**)
- [ ] **ai-cmd-provider-5.2.8** — `explain_package_visit_context`
- [ ] **ai-cmd-provider-5.2.9** — `explain_multi_service_timeline`

---

### ai-cmd-provider-5.3 — Payments at the chair — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.3.1** | `mark_paid` | M | “Mark Jane paid cash”, “Mark this booking paid” | **Shipped** — push parity |
| **5.3.2** | `payment_sweep` | M | “Mark all today paid”, “Sweep unpaid from today” | Bulk — manager/own calendar scope |
| **5.3.3** | `explain_booking_payment_breakdown` | R | “Why does it say pending?”, “She prepaid online — show breakdown” | **`BookingPaymentBreakdown`** |
| **5.3.4** | `explain_provider_payment_currency` | R | “Why € on this booking?”, “Retail total currency” | **Shipped** read intent |
| **5.3.5** | `explain_deposit_balance_due` | R | “How much left at checkout?”, “50% deposit — rest due?” | Prepayment + retail lines |
| **5.3.6** | `collect_remaining_balance` | M | “Charge the balance on file”, “Collect rest at chair” | Product-dependent Stripe terminal / manual |

- [ ] **ai-cmd-provider-5.3.1** — Full DoD **`mark_paid`** + push **`mark_paid`** action eval
- [ ] **ai-cmd-provider-5.3.2** — Full DoD **`payment_sweep`**
- [ ] **ai-cmd-provider-5.3.3** — `explain_booking_payment_breakdown`
- [ ] **ai-cmd-provider-5.3.4** — HY/RU **`explain_provider_payment_currency`**
- [ ] **ai-cmd-provider-5.3.5** — `explain_deposit_balance_due`
- [ ] **ai-cmd-provider-5.3.6** — `collect_remaining_balance` (if product supports)

---

### ai-cmd-provider-5.4 — Retail upsell at chair — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.4.1** | `add_retail_to_booking` | M | “Add Olaplex 3 to this booking”, “Sell shampoo she uses” | **Shipped** **prov-exp-5.1** |
| **5.4.2** | `suggest_retail_upsell` | R | “What should I recommend after color?”, “Upsell ideas for this client” | Parity fixture — read suggestions |
| **5.4.3** | `explain_retail_cart` | R | “What’s on the retail tab?”, “Total with products” | **`BookingRetailPosSection`** |
| **5.4.4** | `remove_retail_from_booking` | M | “Remove the serum from cart”, “Undo product add” | Gap — today UI-only? |
| **5.4.5** | `search_retail_sku` | R | “Find SKU 12345”, “Do we carry bond builder?” | Navigate search — **`prov-exp-5.2** |

- [ ] **ai-cmd-provider-5.4.1** — Full DoD **`add_retail_to_booking`** (voice SKU)
- [ ] **ai-cmd-provider-5.4.2** — Full DoD **`suggest_retail_upsell`**
- [ ] **ai-cmd-provider-5.4.3** — `explain_retail_cart`
- [ ] **ai-cmd-provider-5.4.4** — `remove_retail_from_booking`
- [ ] **ai-cmd-provider-5.4.5** — `search_retail_sku` navigate

---

### ai-cmd-provider-5.5 — Client communications — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.5.1** | `send_client_message` | M | “Text Jane I’m running 10 late”, “WhatsApp reminder she’s next” | **Shipped** **prov-exp-6.1** |
| **5.5.2** | `send_canned_template` | M | “Send ‘running late’ template to Maria” | **`prov-exp-6.2`** template picker |
| **5.5.3** | `draft_waitlist_offer_message` | R | “Draft SMS for waitlist when gap opens”, “Message top waitlist client” | **prov-exp-8.2** — copy-only or handoff |
| **5.5.4** | `explain_message_templates` | R | “What templates can I send?”, “Edit canned messages?” | Read-only — edit stays dashboard |
| **5.5.5** | `notify_client_ready` | M | “Tell her chair is ready”, “Send ‘your turn’ message” | Optional template |

- [ ] **ai-cmd-provider-5.5.1** — Full DoD **`send_client_message`**
- [ ] **ai-cmd-provider-5.5.2** — `send_canned_template` (templateId param)
- [ ] **ai-cmd-provider-5.5.3** — `draft_waitlist_offer_message` (**prov-exp-8.2**)
- [ ] **ai-cmd-provider-5.5.4** — `explain_message_templates`
- [ ] **ai-cmd-provider-5.5.5** — `notify_client_ready`

---

### ai-cmd-provider-5.6 — Schedule self-service — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.6.1** | `block_my_time` | M | “Block lunch 1–2”, “Break until 3pm” | **Shipped** **prov-exp-7.1** |
| **5.6.2** | `fill_unused_slots` | M | “Block gap 4–5 as personal”, “Fill unused 2pm slot” | Open shift → block vs book |
| **5.6.3** | `request_time_off` | M | “Request off next Friday”, “Vacation Dec 20–27” | **Shipped** **prov-exp-7.2** |
| **5.6.4** | `list_my_time_off_requests` | R | “Status of my time off?”, “Was Friday approved?” | **Shipped** |
| **5.6.5** | `check_availability` | R | “Am I free Thursday 3pm?”, “Open slot today 5pm” | Own calendar |
| **5.6.6** | `extend_my_block` | M | “Extend lunch 30 minutes”, “Push break to 2:30” | Edit existing block |
| **5.6.7** | `explain_provider_date_display` | R | “Why dates look like DD/MM?”, “Time format on cards” | **Shipped** fmt-1.8 |

- [ ] **ai-cmd-provider-5.6.1** — Full DoD **`block_my_time`**
- [ ] **ai-cmd-provider-5.6.2** — Full DoD **`fill_unused_slots`**
- [ ] **ai-cmd-provider-5.6.3** — HY/RU **`request_time_off`**
- [ ] **ai-cmd-provider-5.6.4** — HY/RU **`list_my_time_off_requests`**
- [ ] **ai-cmd-provider-5.6.5** — Full DoD **`check_availability`**
- [ ] **ai-cmd-provider-5.6.6** — `extend_my_block`
- [ ] **ai-cmd-provider-5.6.7** — HY/RU **`explain_provider_date_display`**

---

### ai-cmd-provider-5.7 — Booking changes (cancel / move / no-show) — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.7.1** | `reschedule_booking` | M | “Move Jane to 4pm”, “Reschedule my 2pm to tomorrow” | **Shipped** — slot picker handoff |
| **5.7.2** | `cancel_bookings` | M | “Cancel Jane’s 2pm”, “Cancel all my afternoon” | **Shipped** — reason param |
| **5.7.3** | `mark_no_shows` | M | “Mark no-shows today”, “Jane didn’t show — no show” | **Shipped** bulk + single |
| **5.7.4** | `suggest_reschedule_from_push` | R | “Reschedule from this notification” | Push parity — opens AI |
| **5.7.5** | `reassign_booking_same_day` | M | “Give Jane’s 3pm to Marco” | **Gap** — **`BookingReassignSection`** UI only today |
| **5.7.6** | `explain_cancel_policy_for_client` | R | “Will she lose deposit?”, “Cancellation fee for this booking?” | Read salon policy for staff |

- [ ] **ai-cmd-provider-5.7.1** — Full DoD **`reschedule_booking`** + compounds with **`check_availability`**
- [ ] **ai-cmd-provider-5.7.2** — Full DoD **`cancel_bookings`**
- [ ] **ai-cmd-provider-5.7.3** — Full DoD **`mark_no_shows`**
- [ ] **ai-cmd-provider-5.7.4** — Push eval **`suggest_reschedule_from_push`**
- [ ] **ai-cmd-provider-5.7.5** — `reassign_booking_same_day` (**prov-exp-4.2** AI parity)
- [ ] **ai-cmd-provider-5.7.6** — `explain_cancel_policy_for_client`

---

### ai-cmd-provider-5.8 — Manager floor & team — **provider (manager/owner)**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.8.1** | `team_floor_status` | R | “Floor board”, “Who’s waiting vs in service?” | **Shipped** **prov-exp-4.1** |
| **5.8.2** | `team_whos_next` | R | “Who’s next across the team?”, “Next 2 hours queue” | **Shipped** **prov-exp-4.3** |
| **5.8.3** | `my_stats` | R | “My week stats”, “Team utilization this month” | **Shipped** scope=team |
| **5.8.4** | `summarize_my_revenue` | R | “How much did I earn this week?”, “Tips this month” | **Shipped** narrative |
| **5.8.5** | `list_team_unpaid_today` | R | “Anyone on the floor not paid yet?”, “Unpaid across team” | Manager **`payment_sweep`** preview |
| **5.8.6** | `explain_reviews_inbox` | R | “Bad review yesterday — show it”, “My rating this month” | **`ProviderReviewsInboxSection`** + **`my_stats`** |

- [ ] **ai-cmd-provider-5.8.1** — HY/RU **`team_floor_status`**
- [ ] **ai-cmd-provider-5.8.2** — HY/RU **`team_whos_next`**
- [ ] **ai-cmd-provider-5.8.3** — Full DoD **`my_stats`**
- [ ] **ai-cmd-provider-5.8.4** — Full DoD **`summarize_my_revenue`**
- [ ] **ai-cmd-provider-5.8.5** — `list_team_unpaid_today`
- [ ] **ai-cmd-provider-5.8.6** — `explain_reviews_inbox`

---

### ai-cmd-provider-5.9 — Waitlist & gap recovery — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.9.1** | `suggest_waitlist_for_gap` | R | “Who can fill my 3pm gap?”, “Waitlist for this open slot” | **Shipped** **prov-exp-7.3** |
| **5.9.2** | `list_waitlist_for_my_services` | R | “Show my waitlist”, “Who’s waiting for color?” | **prov-exp-8.1** panel |
| **5.9.3** | `coordinate_waitlist_offer` | M | “Offer gap to top waitlist”, “Text waitlist about 3pm opening” | Manager — ties dashboard **`offer_waitlist_slot`** |
| **5.9.4** | `list_rebooking_candidates` | R | “Who should I call after this cancel?”, “Regulars + waitlist” | **prov-exp-8.2** |
| **5.9.5** | `book_walk_in_gap` | M | “Book walk-in in the 2pm gap”, “Quick book 30 min trim now” | New booking into open shift |

- [ ] **ai-cmd-provider-5.9.1** — Full DoD **`suggest_waitlist_for_gap`**
- [ ] **ai-cmd-provider-5.9.2** — `list_waitlist_for_my_services` (**prov-exp-8.1**)
- [ ] **ai-cmd-provider-5.9.3** — Full DoD **`coordinate_waitlist_offer`**
- [ ] **ai-cmd-provider-5.9.4** — `list_rebooking_candidates` (**prov-exp-8.2**)
- [ ] **ai-cmd-provider-5.9.5** — `book_walk_in_gap`

---

### ai-cmd-provider-5.10 — Push notifications & deep links — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.10.1** | `confirm_booking_from_push` | M | “Confirm from notification”, “Accept new booking push” | **Shipped** push action |
| **5.10.2** | `open_booking_from_push` | R | “Open booking from alert”, “Show me that notification appointment” | **`ProviderPushBridge`** |
| **5.10.3** | `explain_last_push` | R | “What was that alert?”, “Explain my last notification” | **Shipped** **prov-exp-10.1** |
| **5.10.4** | `dismiss_push` | M | “Dismiss notification”, “Mark alert read” | **Shipped** |
| **5.10.5** | `explain_push_setup` | R | “How do push alerts work?”, “Enable booking notifications” | **Shipped** |
| **5.10.6** | `enable_push_notifications` | M | “Turn on push”, “Enable alerts in profile” | **Shipped** — **`PushToggle`** |
| **5.10.7** | `new_booking_push_actions` | R | “What can I do from a new booking push?” | Confirm / reschedule / mark paid menu |

- [ ] **ai-cmd-provider-5.10.1** — Push action eval **`confirm_booking_from_push`**
- [ ] **ai-cmd-provider-5.10.2** — Full DoD **`open_booking_from_push`**
- [ ] **ai-cmd-provider-5.10.3** — HY/RU **`explain_last_push`**
- [ ] **ai-cmd-provider-5.10.4** — Full DoD **`dismiss_push`**
- [ ] **ai-cmd-provider-5.10.5** — HY/RU **`explain_push_setup`**
- [ ] **ai-cmd-provider-5.10.6** — Full DoD **`enable_push_notifications`**
- [ ] **ai-cmd-provider-5.10.7** — Full DoD **`new_booking_push_actions`**

---

### ai-cmd-provider-5.11 — Clinic vertical (provider mobile) — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.11.1** | `list_my_collection_queue` | R | “Who do I draw today?”, “Specimen collection list” | **Shipped** **`LabCollectionPage`** |
| **5.11.2** | `mark_specimen_collected` | M | “Mark draw complete for Jane”, “Collected specimen order 123” | **Shipped** |
| **5.11.3** | `list_patient_pending_lab_requests` | R | “Patients who still need to book lab”, “Pending lab self-book” | **`list_patient_pending_lab_requests`** |
| **5.11.4** | `open_patient_chart` | R | “Open chart for Jane”, “Patient summary before draw” | **`PatientChartSummaryPage`** navigate |
| **5.11.5** | `explain_lab_result_on_booking` | R | “Any flagged results on this visit?”, “Show CBC from last time” | **`BookingLabResultsSection`** |
| **5.11.6** | `list_clinic_tasks` | R | “My tasks today”, “Outstanding clinic to-dos” | **`ClinicTasksPage`** |
| **5.11.7** | `complete_clinic_task` | M | “Mark task done”, “Complete follow-up call task” | **`ProviderClinicTasksList`** |
| **5.11.8** | `explain_provider_session_timeout` | R | “Why did I get logged out?”, “Session timeout on clinic app” | **Shipped** HIPAA clinic |

- [ ] **ai-cmd-provider-5.11.1** — HY/RU **`list_my_collection_queue`**
- [ ] **ai-cmd-provider-5.11.2** — Full DoD **`mark_specimen_collected`**
- [ ] **ai-cmd-provider-5.11.3** — Full DoD **`list_patient_pending_lab_requests`**
- [ ] **ai-cmd-provider-5.11.4** — `open_patient_chart`
- [ ] **ai-cmd-provider-5.11.5** — `explain_lab_result_on_booking`
- [ ] **ai-cmd-provider-5.11.6** — `list_clinic_tasks`
- [ ] **ai-cmd-provider-5.11.7** — `complete_clinic_task`
- [ ] **ai-cmd-provider-5.11.8** — HY/RU **`explain_provider_session_timeout`**

---

### ai-cmd-provider-5.12 — Gift cards & packages (provider) — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.12.1** | `list_package_appointments_today` | R | “Package visits today”, “Who’s on a bundle this afternoon?” | **Shipped** handler |
| **5.12.2** | `list_my_package_visits` | R | “Show Jane’s package progress”, “Visits left on her plan” | Provider read at chair |
| **5.12.3** | `explain_gift_card_redemption` | R | “She’s paying with gift card — balance?” | Checkout badge context |
| **5.12.4** | `list_gift_card_fulfillment_queue` | R | “Physical cards to fulfill”, “Gift card pickup queue” | **`GiftCardQueuesPage`** |

- [ ] **ai-cmd-provider-5.12.1** — Full DoD **`list_package_appointments_today`**
- [ ] **ai-cmd-provider-5.12.2** — Full DoD **`list_my_package_visits`**
- [ ] **ai-cmd-provider-5.12.3** — `explain_gift_card_redemption`
- [ ] **ai-cmd-provider-5.12.4** — `list_gift_card_fulfillment_queue`

---

### ai-cmd-provider-5.13 — Offline, app health & voice — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.13.1** | `offline_queue_status` | R | “What’s queued offline?”, “Did my check-in save?” | **`ProviderOfflineBanner`** |
| **5.13.2** | `retry_offline_action` | M | “Retry failed sync”, “Send queued actions now” | **Shipped** |
| **5.13.3** | `explain_offline_mode` | R | “Why offline?”, “Will changes sync when back?” | Provider app offline copy |
| **5.13.4** | `voice_check_in` | M | “Hey — check in Maria” | **`ProviderAiVoiceButton`** — hands-free |
| **5.13.5** | `voice_mark_paid` | M | “Mark paid cash” | Voice compound at chair |
| **5.13.6** | `explain_app_update_gate` | R | “Why must I update?”, “Skip update for now” | **`AppVersionGate`** |

- [ ] **ai-cmd-provider-5.13.1** — Full DoD **`offline_queue_status`**
- [ ] **ai-cmd-provider-5.13.2** — Full DoD **`retry_offline_action`**
- [ ] **ai-cmd-provider-5.13.3** — `explain_offline_mode`
- [ ] **ai-cmd-provider-5.13.4** — Voice fixture pack for chair actions
- [ ] **ai-cmd-provider-5.13.5** — `voice_mark_paid` eval
- [ ] **ai-cmd-provider-5.13.6** — `explain_app_update_gate`

---

### ai-cmd-provider-5.14 — Provider compounds (one message, full job)

| ID | Recipe | Steps | Example prompt |
|----|--------|-------|----------------|
| **5.14.1** | `chair_closeout` | `mark_visit_complete` → `mark_paid` → `add_retail_to_booking`? | “Finish Jane, mark paid cash, add Olaplex” |
| **5.14.2** | `running_late_notify` | `mark_running_late` → `send_client_message` | “I’m 15 late — text my next client” |
| **5.14.3** | `gap_waitlist_fill` | `suggest_waitlist_for_gap` → `draft_waitlist_offer_message` → `coordinate_waitlist_offer` | “Fill my 3pm gap from waitlist” |
| **5.14.4** | `cancel_and_recover` | `cancel_bookings` → `list_rebooking_candidates` → draft message | “Cancel 2pm and message waitlist” |
| **5.14.5** | `pre_visit_brief` | `summarize_client` → `show_client_history` → `explain_client_intake` | “Brief me before Jane at 2” |
| **5.14.6** | `end_of_day_close` | `end_of_day_summary` → `payment_sweep` → `mark_no_shows` | “Wrap today — mark paid and no-shows” |
| **5.14.7** | `reschedule_and_notify` | `reschedule_booking` → `send_client_message` | “Move Maria to 4pm and text her” |
| **5.14.8** | `clinic_draw_flow` | `list_my_collection_queue` → `open_patient_chart` → `mark_specimen_collected` | “Next draw — open chart and mark collected” |
| **5.14.9** | `push_confirm_check_in` | `confirm_booking_from_push` → `check_in_client` | “Confirm push booking and check in when she arrives” |

- [ ] **ai-cmd-provider-5.14.1** — `chair_closeout`
- [ ] **ai-cmd-provider-5.14.2** — `running_late_notify`
- [ ] **ai-cmd-provider-5.14.3** — `gap_waitlist_fill`
- [ ] **ai-cmd-provider-5.14.4** — `cancel_and_recover`
- [ ] **ai-cmd-provider-5.14.5** — `pre_visit_brief`
- [ ] **ai-cmd-provider-5.14.6** — `end_of_day_close`
- [ ] **ai-cmd-provider-5.14.7** — `reschedule_and_notify`
- [ ] **ai-cmd-provider-5.14.8** — `clinic_draw_flow`
- [ ] **ai-cmd-provider-5.14.9** — `push_confirm_check_in`

---

### ai-cmd-provider-5.15 — Provider app UI chips & contextual suggestions

Extend **`ProviderAiSuggestionsService`** + localized starter prompts on each screen (mirror **ai-cmd-customer-4.9**).

| Screen / route | Suggested AI chips |
|--------------|-------------------|
| **`TodayPage`** | “Who’s next?”, “Team floor status”, “Any unpaid today?” |
| **`BookingDetailModal`** | “Summarize this client”, “Check in”, “Mark paid cash”, “Add retail product” |
| **`SchedulePage`** | “Block lunch tomorrow”, “Request Friday off”, “My time off status” |
| **`CalendarPage`** | “Gaps this week”, “Who can fill 3pm gap?”, “How full am I?” |
| **`ProfilePage`** | “My stats this week”, “Enable push alerts”, “Explain notifications” |
| **`LabCollectionPage`** | “Collection queue today”, “Mark specimen collected” |
| **`PushNotificationsPage`** | “Explain last alert”, “Open booking from notification” |
| **Push action sheet** | “Confirm booking”, “Mark paid”, “Reschedule” |
| **`BookingDetailModal`** (open) | “Summarize client”, “Check in”, “Mark in progress”, “Mark paid cash” |
| **`PatientLookupPage`** | “Find patient Jane”, “Open chart for DOB …” |
| **`LabResultsPage`** | “Results waiting review”, “Open booking with abnormal CBC” |
| **`GiftCardQueuesPage`** | “Cards to create today”, “Mark gift card ready for pickup” |
| **`AcceptInvitePage`** | “What is this invite?”, “Help setting up my account” |
| **`ClinicTasksPage`** | “My tasks due today”, “Mark intake follow-up done” |

- [ ] **ai-cmd-provider-5.15.1** — Page → chip map in `provider-app` i18n + `ProviderAiSuggestionsService` context keys
- [ ] **ai-cmd-provider-5.15.2** — Booking-detail session injects `bookingId` into assistant placeholder hints
- [ ] **ai-cmd-provider-5.15.3** — Align suggestion **`prompt`** strings with classifier fixture ids for eval traceability
- [ ] **ai-cmd-provider-5.15.4** — Extend **`getProviderQuickChips`** routes: `calendar`, `clinic-tasks`, `lab-collection`, `gift-cards` fulfillment prompts (**ai-m6**)
- [ ] **ai-cmd-provider-5.15.5** — Manager vs stylist chip sets (`isManager`) for floor vs own-calendar wording

---

### ai-cmd-provider-5.16 — Visit status lifecycle — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.16.1** | `update_bookings` | M | “Start service”, “Mark in progress”, “Set confirmed” | **Shipped** generic status — disambiguate vs **`mark_visit_complete`** |
| **5.16.2** | `mark_visit_in_progress` | M | “Begin Jane’s color”, “Start appointment now” | Dedicated alias → status=`in_progress` |
| **5.16.3** | `mark_ready_now` | M | “Ready for next client”, “Clear running late” | **`markProviderBookingReadyNow`** metadata |
| **5.16.4** | `confirm_pending_booking` | M | “Confirm all pending today”, “Accept Maria’s booking” | Suggestion **`confirm-pending`** — bulk + single |
| **5.16.5** | `explain_booking_status_badge` | R | “What does pending mean?”, “Why in progress?” | Status colors on **`BookingDetailModal`** |
| **5.16.6** | `explain_floor_status` | R | “Waiting vs in service?”, “What’s checked in?” | Check-in floor strip + **`team_floor_status`** |

- [ ] **ai-cmd-provider-5.16.1** — Full DoD **`update_bookings`** status branches
- [ ] **ai-cmd-provider-5.16.2** — `mark_visit_in_progress`
- [ ] **ai-cmd-provider-5.16.3** — Full DoD **`mark_ready_now`** (pairs **5.2.6**)
- [ ] **ai-cmd-provider-5.16.4** — `confirm_pending_booking`
- [ ] **ai-cmd-provider-5.16.5** — `explain_booking_status_badge`
- [ ] **ai-cmd-provider-5.16.6** — `explain_floor_status`

---

### ai-cmd-provider-5.17 — Tax, payment status & cash — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.17.1** | `explain_appointment_tax` | R | “Why VAT on this breakdown?”, “Inclusive vs exclusive tax?” | **Shipped** handler via **`businessTax`** |
| **5.17.2** | `explain_payment_status` | R | “Why still pending after Stripe?”, “She paid online — why cash due?” | Provider slice of dashboard intent |
| **5.17.3** | `explain_prepaid_vs_balance_due` | R | “Deposit paid — what’s left?”, “Gift card covered service only” | Retail + prepayment lines together |
| **5.17.4** | `collect_cash_at_chair` | M | “Record cash collected $80”, “Mark cash payment received” | Distinct from **`mark_paid`** when partial |
| **5.17.5** | `explain_stripe_prepay_on_booking` | R | “Client prepaid online — do I charge again?” | Tie **`configure_service_online_payment`** read copy |

- [ ] **ai-cmd-provider-5.17.1** — HY/RU **`explain_appointment_tax`**
- [ ] **ai-cmd-provider-5.17.2** — Provider **`explain_payment_status`** fixtures + eval
- [ ] **ai-cmd-provider-5.17.3** — `explain_prepaid_vs_balance_due`
- [ ] **ai-cmd-provider-5.17.4** — `collect_cash_at_chair`
- [ ] **ai-cmd-provider-5.17.5** — `explain_stripe_prepay_on_booking` (**ai-cmd-ext-7** parity)

---

### ai-cmd-provider-5.18 — Multi-service, packages & tour groups — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.18.1** | `list_my_multi_service_groups` | R | “Spa day clients today”, “Who has massage + facial?” | **Shipped** handler |
| **5.18.2** | `explain_multi_service_order` | R | “Which service is first?”, “Gap between her two appointments?” | Sequence + duration on timeline |
| **5.18.3** | `mark_multi_service_step_done` | M | “Finish step 1 of spa day”, “Complete blowdry leg” | Per-leg status within group |
| **5.18.4** | `explain_tour_group_on_booking` | R | “How many pax on this tour?”, “Group booking details” | Tour metadata on booking card |
| **5.18.5** | `list_package_appointments_today` | R | “Package visits this afternoon” | **5.12.1** — group by bundle |

- [ ] **ai-cmd-provider-5.18.1** — Full DoD **`list_my_multi_service_groups`**
- [ ] **ai-cmd-provider-5.18.2** — `explain_multi_service_order`
- [ ] **ai-cmd-provider-5.18.3** — `mark_multi_service_step_done`
- [ ] **ai-cmd-provider-5.18.4** — `explain_tour_group_on_booking`
- [ ] **ai-cmd-provider-5.18.5** — Package + multi-service compound read

---

### ai-cmd-provider-5.19 — Clinic extended (lookup, results, recollect) — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.19.1** | `search_patient` | R | “Find patient Jane Doe”, “Lookup by phone ending 4521” | **`PatientLookupPage`** navigate |
| **5.19.2** | `list_lab_results_queue` | R | “Results needing review”, “Abnormal results today” | **`LabResultsPage`** / **`ProviderLabResultsList`** |
| **5.19.3** | `explain_specimen_recollect` | R | “Why recollect required?”, “Failed draw — what next?” | Collection queue **RecollectRequired** |
| **5.19.4** | `notify_patient_book_lab` | M | “Remind patient to book collection”, “Nudge pending lab self-book” | **`list_patient_pending_lab_requests`** → message |
| **5.19.5** | `explain_clinic_task` | R | “What is this follow-up task?”, “Who assigned it?” | **`ProviderClinicTasksList`** |
| **5.19.6** | `handoff_to_dashboard_phi` | R | “Open full intake on dashboard”, “Why can’t I edit intake here?” | **`preVisitIntakeOpenDashboard`** link explain |

- [ ] **ai-cmd-provider-5.19.1** — `search_patient`
- [ ] **ai-cmd-provider-5.19.2** — `list_lab_results_queue`
- [ ] **ai-cmd-provider-5.19.3** — `explain_specimen_recollect`
- [ ] **ai-cmd-provider-5.19.4** — `notify_patient_book_lab`
- [ ] **ai-cmd-provider-5.19.5** — `explain_clinic_task`
- [ ] **ai-cmd-provider-5.19.6** — `handoff_to_dashboard_phi`

---

### ai-cmd-provider-5.20 — Gift card fulfillment ops — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.20.1** | `list_gift_cards_to_create` | R | “Physical cards to print”, “Creation queue” | **`GiftCardQueuesPage`** creation tab |
| **5.20.2** | `mark_gift_card_ready` | M | “Mark card GC-123 ready for pickup”, “Card printed — ready” | **`markReadyMutation`** |
| **5.20.3** | `list_gift_cards_out_for_delivery` | R | “Cards to ship today”, “Delivery queue” | Delivery tab |
| **5.20.4** | `mark_gift_card_shipped` | M | “Shipped to Anna — out for delivery”, “Mark delivered” | **`outForDeliveryMutation`** |
| **5.20.5** | `explain_gift_card_order_details` | R | “What’s on this gift order?”, “Service credits on card” | Order card read |

- [ ] **ai-cmd-provider-5.20.1** — `list_gift_cards_to_create`
- [ ] **ai-cmd-provider-5.20.2** — `mark_gift_card_ready`
- [ ] **ai-cmd-provider-5.20.3** — `list_gift_cards_out_for_delivery`
- [ ] **ai-cmd-provider-5.20.4** — `mark_gift_card_shipped`
- [ ] **ai-cmd-provider-5.20.5** — `explain_gift_card_order_details`

---

### ai-cmd-provider-5.21 — New staff & app setup — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.21.1** | `explain_staff_invite` | R | “What is this invite link?”, “Join salon as stylist” | **`AcceptInvitePage`** |
| **5.21.2** | `explain_provider_app_tabs` | R | “What’s on Today vs Calendar?”, “Where is my schedule?” | Onboarding FAQ |
| **5.21.3** | `explain_team_view_scope` | R | “Why do I see everyone’s bookings?”, “Switch to my calendar only” | Manager vs employee scope |
| **5.21.4** | `explain_profile_settings` | R | “Change my title”, “Update avatar” | **`ProviderProfileSection`** — mutate stays UI |
| **5.21.5** | `configure_provider_push_date_format` | M | “Show push times in 24h”, “Fix date format in alerts” | **Shipped** fmt-1.8 |

- [x] **ai-cmd-provider-5.21.1** — `explain_staff_invite`
- [x] **ai-cmd-provider-5.21.2** — `explain_provider_app_tabs`
- [x] **ai-cmd-provider-5.21.3** — `explain_team_view_scope`
- [x] **ai-cmd-provider-5.21.4** — `explain_profile_settings`
- [ ] **ai-cmd-provider-5.21.5** — HY/RU **`configure_provider_push_date_format`**

---

### ai-cmd-provider-5.22 — Reviews & reputation — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.22.1** | `summarize_recent_reviews` | R | “Any bad reviews this week?”, “Latest 5-star reviews” | **`my_stats`** + inbox filter |
| **5.22.2** | `explain_request_review_flow` | R | “How do I ask for a review?”, “Can I request from Jane?” | **prov-exp-2.2** dashboard-only policy explain |
| **5.22.3** | `draft_review_response` | R | “Help reply to this review”, “Draft professional response” | Copy-only — publish stays dashboard |
| **5.22.4** | `request_review_for_client` | M | “Ask Jane for a review after visit” | Product gate — if mobile API added |

- [ ] **ai-cmd-provider-5.22.1** — `summarize_recent_reviews`
- [ ] **ai-cmd-provider-5.22.2** — `explain_request_review_flow`
- [ ] **ai-cmd-provider-5.22.3** — `draft_review_response`
- [ ] **ai-cmd-provider-5.22.4** — `request_review_for_client` (optional API)

---

### ai-cmd-provider-5.23 — Calendar, gaps & open shifts — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.23.1** | `list_gaps_today` | R | “Open slots this afternoon”, “Gaps between clients” | **`ProviderCalendarGapsPanel`** / **`fill_unused_slots`** read |
| **5.23.2** | `explain_calendar_utilization_bands` | R | “What do the green bands mean?”, “Fully booked day?” | **`ProviderCalendarMonth`** |
| **5.23.3** | `block_schedule` | M | “Block 2–3pm team meeting”, “Block schedule Friday AM” | **Shipped** — vs **`block_my_time`** (own break) |
| **5.23.4** | `explain_block_vs_time_off` | R | “Block vs request time off?”, “Which should I use for vacation?” | Self-service FAQ |
| **5.23.5** | `list_bookings_on_date` | R | “Who do I see next Tuesday?”, “Bookings on 12 June” | **`list_bookings`** + date filter |

- [ ] **ai-cmd-provider-5.23.1** — `list_gaps_today`
- [ ] **ai-cmd-provider-5.23.2** — `explain_calendar_utilization_bands`
- [ ] **ai-cmd-provider-5.23.3** — Disambiguate **`block_schedule`** vs **`block_my_time`** fixtures
- [ ] **ai-cmd-provider-5.23.4** — `explain_block_vs_time_off`
- [ ] **ai-cmd-provider-5.23.5** — Full DoD **`list_bookings`**

---

### ai-cmd-provider-5.24 — Assistant UX, offline & voice — **provider**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.24.1** | `explain_offline_suggestions` | R | “Why stale suggestions?”, “Refresh when online” | **`ProviderAiSuggestions`** offline cache |
| **5.24.2** | `explain_assistant_confirm_swipe` | R | “Why swipe to confirm?”, “What will change?” | Bulk mutate preview (**`assistantSwipeConfirm`**) |
| **5.24.3** | `give_provider_ai_feedback` | M | “Wrong client picked”, “That wasn’t my intent” | Mirror customer **4.19.3** |
| **5.24.4** | `explain_provider_compound_steps` | R | “Do these one at a time?”, “What happens next in compound?” | **`provider_booking_compound`** / **`provider_push_compound`** |
| **5.24.5** | `voice_summarize_next_client` | R | “Read me my next appointment” | TTS + **`show_appointments`** |
| **5.24.6** | `explain_accessibility_settings` | R | “Bigger text in app?”, “Larger tap targets” | **prov-exp-10.3** — local UI explain |

- [ ] **ai-cmd-provider-5.24.1** — `explain_offline_suggestions`
- [x] **ai-cmd-provider-5.24.2** — `explain_assistant_confirm_swipe`
- [ ] **ai-cmd-provider-5.24.3** — `give_provider_ai_feedback`
- [x] **ai-cmd-provider-5.24.4** — `explain_provider_compound_steps`
- [x] **ai-cmd-provider-5.24.5** — `voice_summarize_next_client`
- [ ] **ai-cmd-provider-5.24.6** — `explain_accessibility_settings`

---

### ai-cmd-provider-5.25 — Dashboard handoff (when mobile isn’t enough) — **provider read**

| ID | Intent (proposed) | R/M | Example prompts | Notes |
|----|-------------------|-----|-----------------|-------|
| **5.25.1** | `explain_dashboard_only_action` | R | “Adjust loyalty points”, “Edit message templates” | Map **`PROVIDER_EXP_UI_AI_PARITY`** dashboard-only rows |
| **5.25.2** | `explain_reassign_limit` | R | “Why can’t AI reassign multi-service?”, “Use reassign button” | **prov-exp-4.2** notes |
| **5.25.3** | `explain_time_off_approval` | R | “Who approves my time off?”, “Pending manager approval” | Manager action on dashboard |
| **5.25.4** | `open_dashboard_deep_link` | R | “Open CRM for Jane”, “Full intake on web” | Return URL when safe |

- [ ] **ai-cmd-provider-5.25.1** — Auto-generate from **`PROVIDER_EXP_UI_AI_PARITY`** dashboard-only reasons
- [ ] **ai-cmd-provider-5.25.2** — `explain_reassign_limit`
- [ ] **ai-cmd-provider-5.25.3** — `explain_time_off_approval`
- [ ] **ai-cmd-provider-5.25.4** — `open_dashboard_deep_link`

---

### ai-cmd-provider-5.26 — More provider compounds

| ID | Recipe | Steps | Example prompt |
|----|--------|-------|----------------|
| **5.26.1** | `pending_confirm_day` | `confirm_pending_booking` → `summarize_day` | “Confirm all pending then summarize today” |
| **5.26.2** | `check_in_start_complete` | `check_in_client` → `mark_visit_in_progress` → `mark_visit_complete` | “Check in Jane, start service, mark done” |
| **5.26.3** | `retail_closeout` | `suggest_retail_upsell` → `add_retail_to_booking` → `mark_paid` | “Recommend product and close with cash” |
| **5.26.4** | `gap_walk_in_book` | `list_gaps_today` → `book_walk_in_gap` → `check_in_client` | “Book walk-in in 2pm gap and check in” |
| **5.26.5** | `no_show_recover` | `mark_no_shows` → `list_rebooking_candidates` → `draft_waitlist_offer_message` | “No-show at 2 — who should I offer slot to?” |
| **5.26.6** | `multi_service_brief` | `list_my_multi_service_groups` → `explain_multi_service_order` → `summarize_client` | “Brief me on spa day client at 3” |
| **5.26.7** | `gift_card_fulfill` | `list_gift_cards_to_create` → `mark_gift_card_ready` | “Show creation queue and mark first ready” |
| **5.26.8** | `clinic_draw_patient` | `search_patient` → `open_patient_chart` → `mark_specimen_collected` | “Find Jane, open chart, mark draw done” |
| **5.26.9** | `push_mark_paid_close` | `open_booking_from_push` → `mark_paid` → `mark_visit_complete` | “From notification — mark paid and complete” |
| **5.26.10** | `manager_floor_sweep` | `team_floor_status` → `list_team_unpaid_today` → `payment_sweep` | “Floor status then sweep team unpaid” |

- [ ] **ai-cmd-provider-5.26.1** — `pending_confirm_day`
- [ ] **ai-cmd-provider-5.26.2** — `check_in_start_complete`
- [ ] **ai-cmd-provider-5.26.3** — `retail_closeout`
- [ ] **ai-cmd-provider-5.26.4** — `gap_walk_in_book`
- [ ] **ai-cmd-provider-5.26.5** — `no_show_recover`
- [ ] **ai-cmd-provider-5.26.6** — `multi_service_brief`
- [ ] **ai-cmd-provider-5.26.7** — `gift_card_fulfill`
- [ ] **ai-cmd-provider-5.26.8** — `clinic_draw_patient`
- [ ] **ai-cmd-provider-5.26.9** — `push_mark_paid_close`
- [ ] **ai-cmd-provider-5.26.10** — `manager_floor_sweep`

---

### ai-cmd-provider-5 — Suggested implementation order

| Phase | IDs | Provider outcome |
|-------|-----|------------------|
| **A — Chair essentials** | **5.0 P0**, **5.2.5**–**5.2.7**, **5.3.1**, **5.16.2**–**5.16.3**, **5.14.1**, **5.26.2** | Check in → in progress → complete → paid |
| **B — Day operations** | **5.1.*** , **5.3.2**, **5.7.*** , **5.16.4**, **5.14.6**, **5.26.1** | Today glance, pending confirm, cancel/reschedule, EOD sweep |
| **C — Floor & gaps** | **5.8.*** , **5.9.*** , **5.23.*** , **5.14.3**–**5.14.4**, **5.26.4**–**5.26.5** | Manager floor + waitlist + calendar gaps |
| **D — Client context** | **5.2.1**–**5.2.4**, **5.14.5**, **5.18.*** , **5.26.6** | Pre-visit brief, multi-service, packages |
| **E — Comms & retail** | **5.4.*** , **5.5.*** , **5.14.2**, **5.14.7**, **5.26.3** | Message clients, upsell, close with retail |
| **F — Clinic & gifts** | **5.11.*** , **5.19.*** , **5.20.*** , **5.14.8**, **5.26.7**–**5.26.8** | Draw queue, patient lookup, gift fulfillment |
| **G — Push & offline** | **5.10.*** , **5.13.*** , **5.24.*** , **5.15.*** , **5.26.9** | Notifications, voice, chips, assistant UX |
| **H — Money clarity** | **5.17.*** , **5.3.3**–**5.3.5** | Tax lines, pending vs paid, deposit balance |
| **I — Onboarding & handoff** | **5.21.*** , **5.25.*** , **5.22.2** | New staff, dashboard-only explains |
| **J — Manager compounds** | **5.26.10**, **5.8.5**, **5.14.6** | Team unpaid sweep + floor closeout |

**Key files (provider):**

| Layer | Path |
|-------|------|
| Classifier | `PROVIDER_MOBILE_CLASSIFIER_RULES` in `ai-provider-mobile.fixtures.ts` → `PROVIDER_INTENT_SCHEMA` in `provider-ai-command.service.ts` |
| Handler | `ProviderAiCommandService` switch → `AiProviderExp2Service` / `AiProviderExp3Service` / `provider-booking-*` |
| Rescue | `rescueProviderAiIntent` in `provider-ai-intent.util.ts` |
| UI parity gate | `provider-exp-ai-parity.fixtures.ts` + **`test:prov-exp-ai-parity`** |
| Suggestions | `provider-ai-suggestions.service.ts` + `provider-ai-suggestions.i18n.ts` |
| Eval | `eval/ai-command-eval.cases.ts` with `surface: provider` |
| Page chips | `ProviderAiSuggestions.tsx` + per-route chip config (**5.15**) |

**Cross-links:** **ai-cmd-ext-3** (registry dispatch), **prov-exp-1**–**11** (UI slices), **ai-cmd-customer-4** (customer-facing mirror — e.g. running late notify), **ai-cmd-customer-6** (customer API parity pattern), **feature-ai-prompt-coverage** (provider surface mandatory), **pipe-1.12.2** (provider pipeline adapter).

---

## ai-cmd-provider-6 — Provider app API ↔ AI coverage audit

**Audit (2026-06):** Map every **`provider-app/`** REST call to a provider AI intent (or document **`no-ai`**). Sources: **`provider-mobile.controller.ts`**, **`gift-cards.controller.ts`** (`GiftCardProviderController`), **`upload.controller.ts`**, **`POST /invitations/:token/accept`**, **`provider-app/src/**`** API wrappers.

**Totals:** ~**69** HTTP operations → **~32 covered** (handler in **`ProviderAiCommandService`** or delegated service), **~22 partial** (registry intent exists but dashboard-only handler or deferred eval), **~15 gaps** (no provider intent / no handler wire).

**Bulk note:** Provider has **no** REST paths named `bulk_*`. Bulk behavior is:

| Pattern | Where | AI today |
|---------|--------|----------|
| **Bulk cancel** | AI `cancel_bookings` matches N bookings → internal `executeCancel` | ✅ intent; uses service layer not `PUT …/cancel` per row |
| **Bulk status/paid** | AI `update_bookings`, `payment_sweep`, `mark_no_shows` | ✅ with **`BULK_CONFIRM_THRESHOLD=2`** swipe confirm |
| **Bulk retail replace** | `PUT …/bookings/:id/retail-sales` **`lines[]`** replaces full cart | 🟡 `add_retail_to_booking` adds one; no **`set_retail_lines[]`** |
| **Bulk push read** | `POST …/push/notifications/read-all` | 🔴 no intent |
| **Bulk gift queue** | List queues + mark one-by-one | 🟡 registry intents **`mark_card_ready`** etc. — **dashboard `AiCommandService` only**, not **`ProviderAiCommandService`** |

---

### ai-cmd-provider-6.0 — Coverage legend

Same as **ai-cmd-customer-6.0**: ✅ Covered · 🟡 Partial · 🔴 Gap · ⚪ N/A

---

### ai-cmd-provider-6.1 — AI gateway & suggestions

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/provider/ai/command` | ✅ | All provider intents | Gateway |
| `POST …/provider/ai/command/confirm` | 🟡 | Bulk confirm after swipe | **`explain_assistant_confirm_swipe`** **5.24.2** — meta only |
| `GET …/provider/ai/capabilities` | ⚪ | — | Meta |
| `GET …/provider/ai/suggestions` | 🔴 | — | **`explain_ai_suggestions`** — maps suggestion id → prompt |
| `GET …/provider/context` | 🔴 | — | **`explain_provider_context`** (team view, employee scope) |

- [ ] **ai-cmd-provider-6.1.1** — Wire suggestion **`prompt`** strings to classifier fixture ids (**5.15.3**)
- [ ] **ai-cmd-provider-6.1.2** — `explain_provider_context` → `GET …/context`

---

### ai-cmd-provider-6.2 — Today, floor & calendar (read)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/bookings/today` | 🟡 | `show_appointments`, `summarize_day` | **`get_today_bookings`** direct parity |
| `GET …/bookings/upcoming` | 🔴 | — | **`list_upcoming_bookings`** |
| `GET …/bookings/by-date` | 🟡 | `list_bookings`, `show_appointments` | Date filter fixtures |
| `GET …/calendar/month` | 🟡 | `summarize_utilization` | **`get_calendar_month`** → **5.23.2** |
| `GET …/floor/today` | ✅ | `team_floor_status` | — |
| `GET …/floor/whos-next` | ✅ | `team_whos_next` | — |
| `GET …/schedule/summary` | 🔴 | — | **`get_schedule_summary`** |
| `GET …/schedule/gaps` | 🟡 | `suggest_waitlist_for_gap`, `fill_unused_slots` | **`list_schedule_gaps`** read **5.23.1** |
| `GET …/stats` | ✅ | `my_stats`, `summarize_my_revenue` | — |

- [ ] **ai-cmd-provider-6.2.1** — `list_upcoming_bookings` → `GET …/bookings/upcoming`
- [ ] **ai-cmd-provider-6.2.2** — `get_schedule_summary` → `GET …/schedule/summary`

---

### ai-cmd-provider-6.3 — Booking detail & chair actions (single)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/bookings/:id` | 🔴 | — | **`open_booking_detail`** navigate |
| `PUT …/bookings/:id` | 🟡 | `update_bookings` | Single-booking status/payment/notes — disambiguate bulk |
| `PUT …/bookings/:id/cancel` | 🟡 | `cancel_bookings` | UI path; AI uses batch matcher — align |
| `POST …/bookings/:id/check-in` | ✅ | `check_in_client` | — |
| `POST …/bookings/:id/running-late` | ✅ | `mark_running_late` | — |
| `POST …/bookings/:id/ready-now` | 🔴 | — | **`mark_ready_now`** **5.16.3** |
| `POST …/bookings/:id/cancel/suggest-note` | 🔴 | — | **`suggest_cancel_note`** (AI draft cancel reason) |
| `POST …/bookings/:id/request-review` | 🔴 | — | **`request_client_review`** **5.22.4** |
| `GET …/bookings/:id/reassign/options` | 🔴 | — | **`list_reassign_options`** |
| `POST …/bookings/:id/reassign` | 🔴 | — | **`reassign_booking_same_day`** **5.7.5** |

- [ ] **ai-cmd-provider-6.3.1** — `mark_ready_now` → `POST …/ready-now`
- [ ] **ai-cmd-provider-6.3.2** — `reassign_booking_same_day` → reassign API
- [ ] **ai-cmd-provider-6.3.3** — `suggest_cancel_note` → cancel/suggest-note API
- [ ] **ai-cmd-provider-6.3.4** — `request_client_review` → request-review API
- [ ] **ai-cmd-provider-6.3.5** — Single-booking `update_bookings` → `PUT …/bookings/:id` (not only bulk matcher)

---

### ai-cmd-provider-6.4 — Bulk booking ops (AI-native — no dedicated REST bulk routes)

These intents **bulk-update** multiple bookings via **`ProviderAiCommandService`** internal `executeCancel` / `executeUpdate` (same outcome as repeated `PUT` calls).

| Intent | Bulk behavior | REST equivalent | Status |
|--------|---------------|-----------------|--------|
| `cancel_bookings` | Cancel all matching date/name/status | N× `PUT …/cancel` | ✅ — promote eval **5.0** |
| `update_bookings` | Set status/payment on all matching | N× `PUT …/bookings/:id` | ✅ |
| `payment_sweep` | Mark all unpaid matching as paid | N× `paymentStatus=paid` | ✅ |
| `mark_no_shows` | Mark missed as no-show | N× status update | ✅ |
| `mark_paid` | Single booking paid | `PUT …/bookings/:id` | ✅ |
| `reschedule_booking` | One booking move | Not bulk | ✅ |

- [ ] **ai-cmd-provider-6.4.1** — Document bulk intents in **`provider-public-api-ai-parity.fixtures.ts`** as **`kind: 'ai-bulk-internal'`** (no REST `bulk_*`)
- [ ] **ai-cmd-provider-6.4.2** — Eval: “cancel all afternoon”, “mark all today paid”, “no-shows today” with **`confirmed: true`** confirm path
- [ ] **ai-cmd-provider-6.4.3** — **`bulk_cancel_confirm_threshold`** — align **`BULK_CONFIRM_THRESHOLD=2`** with assistant swipe UX tests

---

### ai-cmd-provider-6.5 — Client context, intake & staff notes

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/bookings/:id/customer-context` | ✅ | `summarize_client` | Same data |
| `GET …/bookings/:id/pre-visit-intake-summary` | 🟡 | `summarize_client`, `explain_client_intake` **5.2.4** | Dedicated read |
| `GET …/bookings/:id/customer-staff-notes` | 🔴 | — | **`list_client_staff_notes`** |
| `POST …/bookings/:id/customer-staff-notes` | ✅ | `add_client_note` | — |
| `show_client_history` | 🟡 | Visit history via AI service | No dedicated GET — OK |

- [ ] **ai-cmd-provider-6.5.1** — `list_client_staff_notes` → GET staff-notes
- [ ] **ai-cmd-provider-6.5.2** — `explain_client_intake` → intake-summary GET

---

### ai-cmd-provider-6.6 — Retail POS (single add vs bulk lines replace)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/retail-pos/products` | 🟡 | `add_retail_to_booking`, `search_retail_sku` **5.4.5** | Product search |
| `GET …/bookings/:id/retail-sales` | 🟡 | `explain_retail_cart` **5.4.3** | Read cart |
| `PUT …/bookings/:id/retail-sales` | 🔴 | `add_retail_to_booking` adds one | **`set_retail_sales_lines`** — **`lines[]` bulk replace** |

- [ ] **ai-cmd-provider-6.6.1** — **`set_retail_sales_lines`** → `PUT retail-sales` with **`lines[]`** (bulk insert/update/delete cart in one call)
- [ ] **ai-cmd-provider-6.6.2** — Alias registry **`add_retail_to_my_booking`** ↔ **`add_retail_to_booking`** in provider switch
- [ ] **ai-cmd-provider-6.6.3** — Compound **`retail_cart_replace`**: list products → set lines → mark paid

---

### ai-cmd-provider-6.7 — Schedule blocks & time off

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/schedule/blocks` | ✅ | `block_my_time`, `block_schedule` | — |
| `POST …/time-off/requests` | ✅ | `request_time_off` | — |
| `GET …/time-off/requests` | ✅ | `list_my_time_off_requests` | — |
| `POST …/time-off/requests/:id/cancel` | 🔴 | — | **`cancel_time_off_request`** |
| `GET …/time-off-requests` (dashboard) | ⚪ | Manager approve/deny | Dashboard **`approve_time_off_request`** — **5.25.3** |

- [ ] **ai-cmd-provider-6.7.1** — `cancel_time_off_request` → provider cancel API

---

### ai-cmd-provider-6.8 — Push notifications (incl. bulk read)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/push/register-native` | 🟡 | `enable_push_notifications` | Wire to native register |
| `GET …/push/native-status` | 🔴 | — | **`explain_push_registration_status`** |
| `POST …/push/action` | ✅ | `confirm_booking_from_push`, `mark_paid`, `suggest_reschedule_from_push` | — |
| `GET …/push/notifications` | 🟡 | `explain_last_push` | **`list_push_notifications`** |
| `POST …/push/notifications/:id/read` | 🟡 | `dismiss_push` | Single read |
| `POST …/push/notifications/read-all` | 🔴 | — | **`mark_all_notifications_read`** — **bulk update** |
| `POST …/push/notifications/mark-booking-read` | 🔴 | — | **`mark_booking_notifications_read`** |
| `GET …/push/vapid-public-key` | ⚪ | — | Web push bootstrap |
| `POST/DELETE …/push/subscribe` | ⚪ | — | Web push — optional explain |

- [ ] **ai-cmd-provider-6.8.1** — **`mark_all_notifications_read`** → read-all API (**bulk**)
- [ ] **ai-cmd-provider-6.8.2** — `mark_booking_notifications_read` → mark-booking-read API
- [ ] **ai-cmd-provider-6.8.3** — `list_push_notifications` → GET notifications inbox

---

### ai-cmd-provider-6.9 — Clinic (collection, results, tasks, patients)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/lab-collection/today` | ✅ | `list_my_collection_queue` | — |
| `mark_specimen_collected` | ✅ | AI → clinic specimen service (no direct provider REST) | Internal |
| `GET …/lab-results` | 🔴 | — | **`list_lab_results_queue`** **5.19.2** |
| `GET …/clinic-tasks` | 🟡 | `list_clinic_tasks` **5.11.6** | — |
| `POST …/clinic-tasks/:id/claim` | 🔴 | — | **`claim_clinic_task`** |
| `POST …/clinic-tasks/:id/complete` | 🟡 | `complete_clinic_task` **5.11.7** | Wire handler |
| `GET …/patients/search` | 🟡 | `search_patient` **5.19.1** | — |
| `GET …/patients/:id/chart-summary` | 🟡 | `open_patient_chart` **5.11.4** | — |
| `GET …/clinic-test-results/bookings/:bookingId/summaries` | 🔴 | — | **`list_booking_lab_summaries`** / **`explain_lab_result_on_booking`** — **`BookingLabResultsSection.tsx`** (staff clinic module, not `…/provider/` prefix) |

- [ ] **ai-cmd-provider-6.9.1** — `list_lab_results_queue` → `GET …/lab-results`
- [ ] **ai-cmd-provider-6.9.2** — `claim_clinic_task` → claim API
- [ ] **ai-cmd-provider-6.9.3** — Wire **`complete_clinic_task`** to complete API
- [ ] **ai-cmd-provider-6.9.4** — `list_booking_lab_summaries` → `GET …/clinic-test-results/bookings/:id/summaries` (booking detail modal; PHI scoped to assigned provider)

---

### ai-cmd-provider-6.10 — Gift card fulfillment (registry ≠ provider handler)

Intents exist in **`PROVIDER_EXCLUSIVE_INTENTS`** but handlers live in **`AiCommandService`** (dashboard), **not** **`ProviderAiCommandService`**.

| API | Registry intent | Provider AI switch | Gap |
|-----|-----------------|-------------------|-----|
| `GET …/gift-cards/card-creation` | `gift_card_creation_queue` | 🔴 missing | Wire read |
| `PUT …/card-creation/:id/ready` | `mark_card_ready` | 🔴 missing | Wire mutate |
| `GET …/gift-cards/delivery` | `delivery_queue` | 🔴 missing | Wire read |
| `PUT …/delivery/:id/out-for-delivery` | `mark_out_for_delivery` | 🔴 missing | Wire mutate |
| `PUT …/delivery/:id/delivered` | `mark_delivered` | 🔴 missing | Wire mutate |
| — | `start_card_preparation`, `accept_delivery`, `capture_delivery_proof`, `notify_delay` | 🔴 | Product/API gap or dashboard-only |

- [ ] **ai-cmd-provider-6.10.1** — Dispatch gift fulfillment intents in **`ProviderAiCommandService`** → **`GiftCardFulfillmentService`** (mirror dashboard handlers)
- [ ] **ai-cmd-provider-6.10.2** — **`test:provider-gift-fulfillment-ai`** — provider surface eval for queue + mark ready/shipped/delivered
- [ ] **ai-cmd-provider-6.10.3** — Compound **`gift_card_fulfill_batch`**: list creation queue → mark first N ready (**bulk-like** one message)

---

### ai-cmd-provider-6.11 — Profile, reviews & stats

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/profile` | 🟡 | `explain_profile_settings` **5.21.4** | Read |
| `PUT …/profile` | 🔴 | — | **`update_provider_profile`** (title, avatar URL) |
| `POST …/uploads/avatar` | 🔴 | — | **`upload_provider_avatar`** — file handoff / navigate |
| `GET …/reviews` | 🟡 | `my_stats` | Summary |
| `GET …/reviews/inbox` | 🟡 | `explain_reviews_inbox` **5.8.6** | Filtered inbox |

- [ ] **ai-cmd-provider-6.11.1** — `update_provider_profile` → `PUT …/profile`
- [ ] **ai-cmd-provider-6.11.2** — Avatar upload explain (cannot attach binary via NL — navigate to picker)

---

### ai-cmd-provider-6.12 — Onboarding, auth & analytics

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST /invitations/:token/accept` | 🔴 | `explain_staff_invite` **5.21.1** | **`complete_staff_invite`** read-only vs mutate |
| `POST /auth/login`, `/auth/google`, `/forgot-password` | ⚪ | — | Staff auth — no AI |
| `POST /events/app` | ⚪ | — | Analytics — **`explain_analytics_consent`** optional |

- [ ] **ai-cmd-provider-6.12.1** — `explain_staff_invite` for AcceptInvitePage

---

### ai-cmd-provider-6.13 — Bulk insert / update / delete summary (provider)

| Operation type | REST | AI intent | Status |
|--------------|------|-----------|--------|
| **Bulk update** (bookings) | Internal via AI | `update_bookings`, `payment_sweep`, `mark_no_shows` | ✅ AI-native |
| **Bulk delete** (cancel) | Internal via AI | `cancel_bookings` | ✅ AI-native |
| **Bulk insert** (retail lines) | `PUT retail-sales` **`lines[]`** | — | 🔴 need **`set_retail_sales_lines`** |
| **Bulk update** (notifications) | `POST …/read-all` | — | 🔴 **`mark_all_notifications_read`** |
| **Bulk insert** (bookings) | ❌ no API | — | **Out of scope** — walk-in **`book_walk_in_gap`** **5.9.5** needs product API |
| **Bulk delete** (time off) | Single cancel | — | 🔴 **`cancel_time_off_request`** |

- [ ] **ai-cmd-provider-6.13.1** — Implement **`set_retail_sales_lines`** (bulk cart replace)
- [ ] **ai-cmd-provider-6.13.2** — Implement **`mark_all_notifications_read`** (bulk push read)
- [ ] **ai-cmd-provider-6.13.3** — Document AI-native bulk booking intents in parity fixtures (**6.4.1**)

---

### ai-cmd-provider-6.14 — Parity gate (mirror **ai-cmd-customer-6.13**)

| ID | Task | Notes |
|----|------|-------|
| **6.14.1** | **`provider-public-api-ai-parity.fixtures.ts`** | One row per provider-app API wrapper → intent or **`no-ai`** / **`ai-bulk-internal`** |
| **6.14.2** | **`test:provider-api-ai-parity`** | Extend **`test:prov-exp-ai-parity`** or sibling gate |
| **6.14.3** | Cross-check **`PROVIDER_EXCLUSIVE_INTENTS`** | Every provider-surface intent has handler in **`ProviderAiCommandService`** (gift gap **6.10**) |
| **6.14.4** | **`ai-cmd-provider-gap-1`** | Block prov-exp **done** until API row mapped |

- [ ] **ai-cmd-provider-6.14.1** — Create parity fixtures from this audit
- [ ] **ai-cmd-provider-6.14.2** — Wire **`npm run test:provider-api-ai-parity`**
- [ ] **ai-cmd-provider-6.14.3** — CI fails when registry adds provider intent without provider switch case
- [ ] **ai-cmd-provider-6.14.4** — Link **prov-exp-11** gate to API parity file

---

### ai-cmd-provider-6.15 — Product blockers & out-of-scope (not AI-only work)

| ID | Item | Why it affects AI | Action |
|----|------|-------------------|--------|
| **6.15.1** | **Gift fulfillment dispatch** | Registry intents exist; handlers only in dashboard **`AiCommandService`** | Wire **`ProviderAiCommandService`** (**6.10.1**) — not a new REST route |
| **6.15.2** | **Walk-in / bulk booking create** | No provider REST to create N bookings at once | Product API first; then **`book_walk_in_gap`** compounds (**5.9.5**) |
| **6.15.3** | **Avatar binary upload** | NL cannot attach file bytes | **`upload_provider_avatar`** → navigate to picker (**6.11.2**) |
| **6.15.4** | **Manager time-off approve/deny** | `GET …/time-off-requests` is dashboard staff flow | Dashboard **`approve_time_off_request`** — **5.25.3**, not provider-6 |
| **6.15.5** | **Dashboard bulk ops** | `bulk_smart_cancel`, retail admin, etc. | Track under **ai-cmd-dashboard-6**, not **provider-6** |

- [ ] **ai-cmd-provider-6.15.1** — Unblock gift queue AI by mirroring dashboard handlers on provider surface (**6.10**)

**Next audit:** see **`ai-cmd-dashboard-6`** (dashboard admin REST ↔ AI parity — full audit below **ai-cmd-ext-2.14+**).

---

### ai-cmd-provider-6 — Gap summary (new / wire intents)

**P0 — chair & booking (REST exists, AI missing):**

`mark_ready_now`, `reassign_booking_same_day`, `set_retail_sales_lines`, `mark_all_notifications_read`

**P1 — wire registry → provider handler:**

`gift_card_creation_queue`, `mark_card_ready`, `delivery_queue`, `mark_out_for_delivery`, `mark_delivered`, `add_retail_to_my_booking` alias

**P2 — read/navigate:**

`list_upcoming_bookings`, `list_lab_results_queue`, `list_booking_lab_summaries`, `list_push_notifications`, `list_client_staff_notes`, `list_reassign_options`, `suggest_cancel_note`, `request_client_review`, `cancel_time_off_request`

**P3 — profile & onboarding:**

`update_provider_profile`, `explain_staff_invite`, `explain_provider_context`

**Bulk (AI-native already — harden eval):**

`cancel_bookings`, `update_bookings`, `payment_sweep`, `mark_no_shows` + confirm swipe path

---

### ai-cmd-provider-6 — Suggested implementation order

| Phase | IDs | Closes API gaps |
|-------|-----|-----------------|
| **A — Wire gift + retail bulk** | **6.10.*** , **6.6.*** , **6.13.1** | Gift queues + cart **`lines[]`** |
| **B — Chair REST parity** | **6.3.*** , **6.4.2** | ready-now, reassign, single PUT update |
| **C — Bulk hardening** | **6.4.*** , **6.8.1** | payment sweep / cancel eval + push read-all |
| **D — Clinic & push inbox** | **6.9.*** , **6.8.2**–**6.8.3** | Lab results, tasks, notification list |
| **E — Gate** | **6.14.*** | **`test:provider-api-ai-parity`** |

**Cross-links:** **ai-cmd-provider-5** (ease-of-life scenarios), **ai-cmd-ext-3** (dispatch), **prov-exp-11**, **ai-cmd-customer-6** (audit pattern).

---

## ai-cmd-dashboard-6 — Dashboard admin API ↔ AI coverage audit

**Audit (2026-06):** Map every **`frontend/`** dashboard REST call to a dashboard AI intent (or document **`no-ai`** / UI-only). Sources: **`frontend/src/**`** (`api.get/post/put/patch/delete` via **`lib/api.ts`**), excluding **`public-api.ts`** (see **ai-cmd-customer-6**) and **`app/provider/*`** pages (see **ai-cmd-provider-6**). Backend route reference: controllers under **`backend/src/modules/**`**.

**Totals:** ~**229** HTTP operations → **~52 covered** (registry intent + handler in **`AiCommandService`** or delegated domain service), **~68 partial** (read/explain OK but mutate path missing, or intent exists without REST wire), **~58 gaps** (no intent), **~51 N/A** (auth bootstrap, file upload bytes, export downloads, analytics telemetry).

**Registry context:** **252** dashboard intents in **`DASHBOARD_INTENTS`** — many are **AI-native** (no 1:1 REST button): `bulk_smart_cancel`, `cancel_bookings`, `fill_unused_slots`, compounds. This audit is **REST → intent**, not intent count.

**Bulk note:** Dashboard has **no** REST paths named `bulk_*`. Bulk behavior is:

| Pattern | REST example | AI today |
|---------|--------------|----------|
| **Bulk cancel/update bookings** | Repeated `PUT …/bookings/:id` | ✅ `cancel_bookings`, `update_bookings`, `bulk_smart_cancel` (internal matcher) |
| **Bulk catalog seed** | `POST …/onboarding/apply-catalog`, playbook seed | 🟡 `bulk_create_catalog`, `apply_clinic_playbook` — not wired to CSV import |
| **Bulk schedule delete** | `DELETE …/schedules/templates` + `{ templateIds[] }` | 🔴 no **`delete_schedule_templates`** |
| **Bulk schedule apply** | `POST …/schedules/templates/apply` | ✅ `apply_schedule` |
| **Bulk agent rebook/undo** | `POST …/agents/tasks/:id/rebook-all`, `…/undo-latest` | 🔴 no intents |
| **Bulk retail cart replace** | `PUT …/bookings/:id/retail-sales` **`lines[]`** | 🟡 `add_retail_sale_to_booking` adds one line only |
| **Bulk product recommendations** | `PUT …/inventory/recommendations/…` + `{ productIds[] }` | 🔴 no intent |
| **Bulk locale strip** | (no REST — service layer) | ✅ `bulk_strip_disabled_locale_translations` |
| **Bulk service currency** | (no REST — service layer) | ✅ `bulk_update_service_currency` |

---

### ai-cmd-dashboard-6.0 — Coverage legend

Same as **ai-cmd-customer-6.0**: ✅ Covered · 🟡 Partial · 🔴 Gap · ⚪ N/A

---

### ai-cmd-dashboard-6.1 — AI gateway, agents & suggestions

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `POST …/ai/command`, `…/command/tasks/:id/approve`, `…/steps/:id/retry` | ✅ | All **`DASHBOARD_INTENTS`** via gateway | Meta-endpoint |
| `GET …/ai/suggestions`, `…/capabilities`, `…/settings`, `…/analytics`, `…/audit`, `…/briefing`, `…/weekly-report` | 🟡 | `explain_ai_settings`, suggestions chips | Read helpers sparse |
| `PUT …/ai/settings` | 🟡 | Autopilot/macros panels | **`configure_ai_autopilot`** **2.21** overlap |
| `GET …/agents/tasks`, `…/pending`, `…/:id/preview` | 🟡 | Agent ops read | **`list_agent_tasks`** |
| `POST …/agents/tasks/:id/rebook-all` | 🔴 | — | **`rebook_all_from_agent_task`** |
| `GET …/agents/tasks/undo-latest/preview`, `POST …/undo-latest` | 🔴 | — | **`undo_latest_agent_task`** |

- [ ] **ai-cmd-dashboard-6.1.1** — `rebook_all_from_agent_task` → rebook-all API (**ai-ops** page)
- [ ] **ai-cmd-dashboard-6.1.2** — `undo_latest_agent_task` → undo-latest API + preview read
- [ ] **ai-cmd-dashboard-6.1.3** — `list_agent_tasks` → GET tasks/pending

---

### ai-cmd-dashboard-6.2 — Business core, overview & onboarding

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/PUT …/businesses/:id`, `PUT …/profile` | 🟡 | `configure_online_booking`, business settings explains | **`update_business_profile`** |
| `GET …/dashboard/overview` | 🟡 | `summarize_day`, KPI reads | **`get_dashboard_overview`** |
| `GET …/onboarding/status`, `…/business-types`, `…/vertical-playbook` | 🟡 | Onboarding explain | Read |
| `POST …/onboarding/business-type`, `…/recommend-catalog`, `…/apply-catalog`, `…/apply-schedule`, `…/skip-schedule`, `…/apply-playbook`, `…/complete` | 🟡 | `bulk_create_catalog`, `apply_schedule`, playbooks | **`complete_onboarding`**, wire apply-catalog → **`bulk_create_catalog`** handler |
| `POST …/invitations` | ✅ | `invite_staff_member` | — |
| `POST /invitations/:token/accept` | ⚪ | — | Auth bootstrap |

- [ ] **ai-cmd-dashboard-6.2.1** — `complete_onboarding` → onboarding complete API
- [ ] **ai-cmd-dashboard-6.2.2** — Wire **`apply_onboarding_catalog`** alias → `POST …/apply-catalog` (same as **`bulk_create_catalog`**)

---

### ai-cmd-dashboard-6.3 — Bookings, appointments & retail POS

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/bookings`, `…/bookings/dashboard`, `…/bookings/:id` | 🟡 | `list_bookings`, `show_appointments` | **`open_booking_detail`** navigate |
| `GET …/bookings/availability` | ✅ | `check_availability` | — |
| `POST …/bookings`, `…/quote` | ✅ | `create_booking` | Quote step partial |
| `PUT …/bookings/:id`, `…/cancel` | ✅ | `update_bookings`, `cancel_bookings`, `bulk_smart_cancel` | Single vs bulk disambiguation |
| `GET/PUT …/bookings/:id/retail-sales` | 🟡 | `add_retail_sale_to_booking`, `remove_retail_line` | **`set_retail_sales_lines`** — **`lines[]` bulk replace** |
| `GET …/retail-pos/products` | 🟡 | `suggest_retail_upsell` | Product search read |
| `GET/POST …/bookings/:id/pre-visit-intake` | 🟡 | Intake assign flow | **`assign_pre_visit_intake_to_booking`** |

- [ ] **ai-cmd-dashboard-6.3.1** — **`set_retail_sales_lines`** → `PUT retail-sales` with **`lines[]`**
- [ ] **ai-cmd-dashboard-6.3.2** — Compound **`retail_checkout`**: add lines → mark paid via `update_bookings`
- [ ] **ai-cmd-dashboard-6.3.3** — `assign_pre_visit_intake_to_booking` → POST pre-visit-intake on booking

---

### ai-cmd-dashboard-6.4 — Services, categories, packages & multi-service

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/POST/PUT …/services`, `…/services/:id` | 🟡 | `create_service`, `update_service`, `configure_service_online_payment` | **`delete_service`** 🔴 |
| `GET/POST/PUT/DELETE …/service-categories` | 🟡 | `create_service_category` | **`update_service_category`**, **`delete_service_category`** 🔴 |
| `GET/POST/PUT/PATCH/DELETE …/packages`, activate/deactivate/duplicate | 🟡 | `create_package`, `deactivate_package`, `duplicate_package` | **`activate_package`**, **`update_package`** |
| `GET/PUT …/multi-service/settings` | 🟡 | `configure_multi_service_settings`, `explain_multi_service_settings` **2.29** | Wire mutate |

- [ ] **ai-cmd-dashboard-6.4.1** — `delete_service` → `DELETE …/services/:id`
- [ ] **ai-cmd-dashboard-6.4.2** — `delete_service_category`, `update_service_category` → category CRUD
- [ ] **ai-cmd-dashboard-6.4.3** — **`bulk_assign_services_category`** **2.27** → move many services under category (AI bulk, repeated PUT or new service API)
- [ ] **ai-cmd-dashboard-6.4.4** — `configure_service_featured` **2.26** → featured flag on services

---

### ai-cmd-dashboard-6.5 — Schedules, blocks & time off

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/schedules/templates`, `…/block-schedules`, `…/provider-calendar` | 🟡 | `list_templates`, schedule reads | — |
| `POST …/schedules/direct`, `…/templates`, `…/templates/:id/duplicate`, `…/templates/apply`, `…/block-schedules` | 🟡 | `create_schedule_template`, `apply_schedule`, `block_schedule`, `create_direct_schedule` | Duplicate template read |
| `PUT …/schedules/templates/:id` | 🟡 | `update_schedule_template` (implicit) | Explicit intent |
| `DELETE …/schedules/templates` + `{ templateIds[] }` | 🔴 | — | **`delete_schedule_templates`** — **bulk delete** |
| `DELETE …/schedules/block-schedules/:id` | 🔴 | — | **`delete_schedule_block`** |
| `GET …/time-off-requests`, `POST …/:id/approve`, `…/deny` | ✅ | `list_time_off_requests`, `approve_time_off_request`, `deny_time_off_request` | — |

- [ ] **ai-cmd-dashboard-6.5.1** — **`delete_schedule_templates`** → `DELETE …/templates` with **`templateIds[]`**
- [ ] **ai-cmd-dashboard-6.5.2** — `delete_schedule_block` → block-schedules DELETE
- [ ] **ai-cmd-dashboard-6.5.3** — Compound **`apply_and_fill`**: `apply_schedule` + `fill_unused_slots`

---

### ai-cmd-dashboard-6.6 — Staff, employees & team

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/POST/PUT/PATCH/DELETE …/employees`, `…/access-role`, `…/send-app-access` | 🟡 | `create_employee`, `deactivate_employee`, `list_employees` | **`update_employee`**, **`delete_employee`** (hard delete vs deactivate) |
| `GET/PATCH …/team-members`, `…/:id/role` | 🟡 | Team role reads | **`update_team_member_role`** |

- [ ] **ai-cmd-dashboard-6.6.1** — `update_employee` → PUT employees (name, services, schedule link)
- [ ] **ai-cmd-dashboard-6.6.2** — `update_team_member_role` → PATCH team-members role

---

### ai-cmd-dashboard-6.7 — Customers & patient chart

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/customers/dashboard`, `…/:id`, `…/detail` | 🟡 | `list_customers`, `summarize_client`, CRM reads | Search/filter fixtures |
| `PUT …/customers/:id`, `…/clinical-profile` | 🔴 | — | **`update_customer`**, **`update_clinical_profile`** |
| `GET/POST …/documents`, `PATCH …/release` | 🔴 | — | **`upload_patient_document`**, **`release_patient_document`** |
| `GET/PUT/POST …/encounters`, addenda, by-booking | 🟡 | `explain_patient_chart` | **`create_encounter_addendum`**, **`update_encounter_by_booking`** |
| `GET/POST …/pre-visit-intakes`, staff-notes | 🟡 | Staff notes partial | **`list_customer_staff_notes`**, **`add_customer_staff_note`** |
| `GET/POST …/patient-chart/alerts`, dismiss | 🔴 | — | **`dismiss_patient_alert`** |
| `GET …/orders`, `…/results` (chart) | 🟡 | `explain_patient_results`, clinic reads | — |
| `GET/DELETE …/me/data` (admin paths) | 🟡 | `export_customer_data`, `delete_customer_data`, `admin_delete_customer_data` | GDPR admin |

- [ ] **ai-cmd-dashboard-6.7.1** — Patient chart mutates: **`update_customer`**, **`update_clinical_profile`**, **`dismiss_patient_alert`**
- [ ] **ai-cmd-dashboard-6.7.2** — Documents: **`release_patient_document`** (binary upload → navigate; release via NL)
- [ ] **ai-cmd-dashboard-6.7.3** — Encounters: **`create_encounter_addendum`**, **`update_encounter_by_booking`**

---

### ai-cmd-dashboard-6.8 — Pre-visit intake & clinic questionnaires

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/POST …/pre-visit-intakes/:id`, `…/start`, `…/answers` | 🟡 | Intake flow (customer-side stronger) | **`staff_submit_intake_answers`** dashboard proxy |
| `GET/POST/PUT …/clinic-questionnaires`, `…/definition`, `…/publish` | 🔴 | — | **`create_questionnaire`**, **`update_questionnaire`**, **`publish_questionnaire`** |

- [ ] **ai-cmd-dashboard-6.8.1** — Questionnaire CRUD + publish intents → clinic-questionnaires API
- [ ] **ai-cmd-dashboard-6.8.2** — Staff intake answer batch → `POST …/answers` (array body)

---

### ai-cmd-dashboard-6.9 — Clinic test results & lab ops

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/clinic-test-results/orders`, `…/specimens`, booking orders/results/summaries | 🟡 | `list_test_orders`, `explain_patient_results`, **`upload_patient_result`** | Queue reads |
| `POST …/bookings/:id/orders`, `…/book-collection`, `…/push-to-patient` | 🟡 | `create_test_order`, `staff_book_lab_collection`, `push_lab_booking_to_patient` | Wire handlers |
| `POST …/results/:id/transition`, `…/specimens/:id/transition` | 🟡 | `enter_test_result`, specimen transitions | State machine parity |
| Catalog `test-types`/`panels` CRUD, `…/items` | 🔴 | `configure_test_reference_range` (guide only) | **`create_test_type`**, **`update_test_type`**, **`delete_test_type`**, panel CRUD |
| `POST …/catalog/import-csv`, `…/seed-playbook` | 🔴 / 🟡 | `apply_clinic_playbook` | **`import_clinic_catalog_csv`** → import-csv API |
| `GET …/specimens/:id/label`, change-history | 🟡 | Label print = UI | **`explain_lab_result_history`** read |

- [ ] **ai-cmd-dashboard-6.9.1** — **`import_clinic_catalog_csv`** → `POST …/catalog/import-csv` (**bulk insert**)
- [ ] **ai-cmd-dashboard-6.9.2** — Catalog CRUD intents → test-types/panels REST
- [ ] **ai-cmd-dashboard-6.9.3** — Wire **`create_test_order`** + transitions to REST (close **ai-cmd-clinic-6-gap**)

---

### ai-cmd-dashboard-6.10 — Gift cards

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/gift-cards`, `…/settings`, `POST …/gift-cards` | 🟡 | `list_gift_card_orders`, `configure_gift_card_products`, `create_gift_card_bundle` | Issue card mutate |
| `PUT …/settings`, `…/:id/expiration`, `…/expiration-audit` | 🟡 | `extend_gift_card_expiry`, product config | **`update_gift_card_settings`** |
| `GET …/fulfillment`, `…/fulfillment/:id`, `PUT …/ship` | 🔴 | Provider has registry; dashboard handlers sparse | **`ship_gift_card`**, **`list_gift_fulfillment_queue`** |
| `GET/PUT …/change-requests`, `…/resolve` | 🔴 | — | **`list_gift_card_change_requests`**, **`resolve_gift_card_change_request`** |
| Refund/cancel (via order detail) | 🟡 | `refund_gift_card_order`, `cancel_gift_card_order` | — |

- [ ] **ai-cmd-dashboard-6.10.1** — Fulfillment queue: **`ship_gift_card`**, **`mark_gift_card_ready`** (dashboard **`GiftCardFulfillmentService`**)
- [ ] **ai-cmd-dashboard-6.10.2** — Change requests: **`resolve_gift_card_change_request`** → resolve API
- [ ] **ai-cmd-dashboard-6.10.3** — Compound **`gift_fulfill_batch`**: list queue → ship first N

---

### ai-cmd-dashboard-6.11 — Subscriptions, loyalty & promos

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/POST/PUT/PATCH/DELETE …/subscriptions/plans`, activate/deactivate | 🟡 | `create_subscription_plan`, `deactivate_subscription_plan` | **`update_subscription_plan`**, **`activate_subscription_plan`** |
| `POST …/subscriptions/assign`, customer subscription CRUD | 🟡 | `assign_subscription_to_customer`, `list_customer_subscriptions`, `cancel_subscription_admin` | — |
| `GET/PATCH …/loyalty/settings`, `…/customer/:id`, `…/adjust` | 🟡 | `summarize_loyalty_program`, `adjust_loyalty_points` (if exists) | **`configure_loyalty_settings`** **2.25** |
| `GET/POST/PATCH …/promo-codes`, deactivate | 🔴 | — | **`create_promo_code`** **2.24**, **`deactivate_promo_code`** |

- [ ] **ai-cmd-dashboard-6.11.1** — `create_promo_code`, `deactivate_promo_code` → promo-codes API
- [ ] **ai-cmd-dashboard-6.11.2** — `configure_loyalty_settings` → loyalty settings PUT
- [ ] **ai-cmd-dashboard-6.11.3** — Subscription plan update/activate intents

---

### ai-cmd-dashboard-6.12 — Operations (inventory, locations, expenses, commissions, resources)

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/POST …/locations` | 🔴 | — | **`create_location`**, **`update_location`** |
| `GET/POST/PUT …/inventory/products` | 🟡 | `adjust_inventory` | **`create_inventory_product`**, **`update_inventory_product`**, **`delete_inventory_product`** |
| `GET/POST/DELETE …/inventory/service-links` | 🔴 | — | **`link_inventory_to_service`**, **`unlink_inventory_product`** |
| `PUT …/inventory/recommendations/services\|categories/:id` + `{ productIds[] }` | 🔴 | — | **`set_recommended_products`** — **bulk replace** |
| `GET/POST/DELETE …/expenses` | 🟡 | `record_expense`, `list_expenses` | **`delete_expense`** |
| `GET/POST/DELETE …/commissions` | 🟡 | `commission_report`, `export_commissions` | **`create_commission_rule`**, **`delete_commission_rule`** |
| `GET/POST/DELETE …/resources`, `PUT …/requirements` | 🟡 | `create_resource`, `assign_booking_resource` | **`delete_resource`**, **`set_service_resource_requirements`** |

- [ ] **ai-cmd-dashboard-6.12.1** — **`set_recommended_products`** → recommendations PUT with **`productIds[]`**
- [ ] **ai-cmd-dashboard-6.12.2** — Inventory product CRUD + service-links intents
- [ ] **ai-cmd-dashboard-6.12.3** — Locations + commission rule mutates

---

### ai-cmd-dashboard-6.13 — Billing, SaaS & business settings

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET /billing/plans`, `…/billing/subscription`, entitlements, checkout, portal | 🟡 | `open_billing_settings` | **`start_billing_checkout`**, navigate only |
| `GET/POST/PUT …/stripe-connect` (oauth, onboard, sync, login, disconnect) | 🔴 | — | **`configure_stripe_connect`** **2.15** |
| Settings tabs: currency, tax, language, date format, pay-at-venue, privacy, compliance fields on `PUT …/businesses/:id` | 🔴 | Partial explains | **`configure_currency`**, **`configure_tax_settings`**, **`configure_business_languages`**, **`configure_pay_at_venue`** |
| `GET/PUT …/provider/context` flags (open shifts, time off, self block, lab) | 🟡 | Provider settings explains | **`configure_provider_self_service_flags`** |

- [ ] **ai-cmd-dashboard-6.13.1** — Settings mutates batch (**6.13** table) — map each settings tab to intent (**ai-cmd-ext-2.14**–**2.25**)
- [ ] **ai-cmd-dashboard-6.13.2** — `configure_stripe_connect` → Stripe Connect REST (explain + deep link, not raw OAuth in NL)

---

### ai-cmd-dashboard-6.14 — Notifications, integrations & growth

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET/PUT …/notifications/settings`, whatsapp, email-templates, reset, custom-variables | 🔴 | `notification_history`, preview helpers | **`configure_notification_settings`** **2.19**, **`configure_whatsapp_integration`** **2.20** |
| `GET/POST/DELETE …/integrations/api-keys`, webhooks, events, docs | 🟡 | `create_webhook`, `delete_webhook`, `list_integration_health` | **`create_api_key`**, **`revoke_api_key`** |
| Zapier, accounting, distribution, google-reserve, openai, zendesk, app-install | 🔴 | `list_integration_health` partial | **`configure_zapier`**, **`configure_openai_integration`** **2.21**, **`explain_tenant_app_install`** **2.22** |
| `POST …/integrations/zendesk/support-ticket` | 🟡 | Support button | **`create_support_ticket`** explain |
| `GET/PUT …/marketing-automation/summary`, settings | 🔴 | — | **`configure_marketing_automation`** |

- [ ] **ai-cmd-dashboard-6.14.1** — Notification + WhatsApp settings intents (**2.19**, **2.20**)
- [ ] **ai-cmd-dashboard-6.14.2** — API keys + integration tab mutates
- [ ] **ai-cmd-dashboard-6.14.3** — Growth: app-install QR + distribution settings

---

### ai-cmd-dashboard-6.15 — Analytics, reports & reviews

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/analytics/staff`, services, heatmap, pl, adoption | 🟡 | `summarize_staff_performance`, analytics reads | — |
| `GET …/analytics/export.csv`, `export.pdf` | 🔴 | — | **`export_analytics_report`** (navigate/download — no binary via NL) |
| `GET …/reviews`, `…/summary` | 🟡 | Reviews page read | **`summarize_reviews`** |

- [ ] **ai-cmd-dashboard-6.15.1** — `export_analytics_report` → explain + open exports page
- [ ] **ai-cmd-dashboard-6.15.2** — `summarize_reviews` → reviews summary API

---

### ai-cmd-dashboard-6.16 — Compliance, enterprise trust & strategy eval

| API | Status | Intent(s) | Gap / action |
|-----|--------|-----------|--------------|
| `GET …/compliance/status`, breach-incidents, phi-access-audit | 🟡 | HIPAA session, compliance reads | — |
| `POST …/compliance/breach-incidents` | 🟡 | `send_breach_notification` | Wire create incident |
| Enterprise trust, strategy-eval, hipaa/marketplace frameworks | 🔴 | — | **`explain_enterprise_trust`**, **`update_strategy_eval`** — low-traffic admin |

- [ ] **ai-cmd-dashboard-6.16.1** — Breach incident create + notification compound
- [ ] **ai-cmd-dashboard-6.16.2** — Enterprise/strategy tabs — read-only explain intents (P3)

---

### ai-cmd-dashboard-6.17 — Auth, uploads & telemetry (out of scope)

| API | Status | Notes |
|-----|--------|-------|
| `POST /auth/login`, register, reset-password, forgot-password, switch-business | ⚪ | Staff auth — no AI |
| `PATCH /auth/preferences` | ⚪ | User prefs |
| `POST …/uploads/avatar`, `…/logo` | ⚪ | Binary — **`explain_upload_logo`** navigate only |
| `POST /events/app` | ⚪ | Analytics telemetry |

---

### ai-cmd-dashboard-6.18 — Bulk insert / update / delete summary (dashboard)

| Operation type | REST / mechanism | AI intent | Status |
|----------------|------------------|-----------|--------|
| **Bulk cancel/update bookings** | AI matcher (no `bulk_*` REST) | `cancel_bookings`, `update_bookings`, `bulk_smart_cancel`, `payment_sweep`, `mark_no_shows` | ✅ AI-native |
| **Bulk catalog create** | `POST onboarding/apply-catalog`, AI draft | `bulk_create_catalog`, playbooks | 🟡 wire apply-catalog |
| **Bulk catalog CSV import** | `POST …/catalog/import-csv` | — | 🔴 **`import_clinic_catalog_csv`** |
| **Bulk schedule delete** | `DELETE …/templates` + `templateIds[]` | — | 🔴 **`delete_schedule_templates`** |
| **Bulk schedule apply** | `POST …/templates/apply` | `apply_schedule` | ✅ |
| **Bulk agent rebook/undo** | `POST rebook-all`, `undo-latest` | — | 🔴 **`rebook_all_from_agent_task`**, **`undo_latest_agent_task`** |
| **Bulk retail cart replace** | `PUT retail-sales` `lines[]` | `add_retail_sale_to_booking` (single) | 🔴 **`set_retail_sales_lines`** |
| **Bulk product recommendations** | `PUT …/recommendations/…` `productIds[]` | — | 🔴 **`set_recommended_products`** |
| **Bulk locale strip** | Service layer | `bulk_strip_disabled_locale_translations` | ✅ AI-native |
| **Bulk service currency** | Service layer | `bulk_update_service_currency` | ✅ AI-native |
| **Bulk service category assign** | Repeated PUT or future API | **`bulk_assign_services_category`** **2.27** (proposed) | 🔴 |
| **Bulk gift fulfill** | List + ship one-by-one | — | 🔴 compound **`gift_fulfill_batch`** |

- [ ] **ai-cmd-dashboard-6.18.1** — Implement **`delete_schedule_templates`** (bulk delete)
- [ ] **ai-cmd-dashboard-6.18.2** — Implement **`set_retail_sales_lines`** + **`set_recommended_products`**
- [ ] **ai-cmd-dashboard-6.18.3** — Agent bulk: **`rebook_all_from_agent_task`**, **`undo_latest_agent_task`**
- [ ] **ai-cmd-dashboard-6.18.4** — **`import_clinic_catalog_csv`** (bulk insert)
- [ ] **ai-cmd-dashboard-6.18.5** — Document AI-native booking bulk in **`dashboard-api-ai-parity.fixtures.ts`** as **`kind: 'ai-bulk-internal'`**

---

### ai-cmd-dashboard-6.19 — Parity gate (mirror **ai-cmd-customer-6.13**)

| ID | Task | Notes |
|----|------|-------|
| **6.19.1** | **`dashboard-api-ai-parity.fixtures.ts`** | One row per `frontend/src/**` API wrapper → intent or **`no-ai`** / **`ai-bulk-internal`** |
| **6.19.2** | **`test:dashboard-api-ai-parity`** | Fails on new dashboard REST call without fixture row |
| **6.19.3** | Cross-check **`DASHBOARD_INTENTS`** | Every mutating intent maps to ≥1 REST path or **`ai-bulk-internal`** |
| **6.19.4** | **`ai-cmd-dashboard-gap-10`** | Block **parity-2.1** / **ai-cmd-ext-gap-7** until row mapped |

- [ ] **ai-cmd-dashboard-6.19.1** — Create parity fixtures from this audit
- [ ] **ai-cmd-dashboard-6.19.2** — Wire **`npm run test:dashboard-api-ai-parity`**
- [ ] **ai-cmd-dashboard-6.19.3** — Extend **`test:ai-cmd-ext`** handler coverage with REST binding column
- [ ] **ai-cmd-dashboard-6.19.4** — Link **parity-2.1** gate to parity file

---

### ai-cmd-dashboard-6.20 — Product blockers & overlaps

| ID | Item | Why it affects AI | Action |
|----|------|-------------------|--------|
| **6.20.1** | **Binary uploads** | Logo/avatar/document attach | Navigate intents only — cannot pass bytes via NL |
| **6.20.2** | **Export downloads** | CSV/PDF/commission export | **`export_*`** explain + open URL — not attach file |
| **6.20.3** | **Stripe OAuth** | Connect onboarding | Deep link only (**2.15**) — no token in chat |
| **6.20.4** | **Provider/mobile overlap** | Same business APIs on provider pages in `frontend/app/provider` | Audited in **ai-cmd-provider-6** — dashboard-6 excludes those wrappers |
| **6.20.5** | **Public booking overlap** | `public-api.ts` | **ai-cmd-customer-6** |

- [ ] **ai-cmd-dashboard-6.20.1** — Document upload/export rows as **`no-ai-binary`** in parity fixtures

---

### ai-cmd-dashboard-6.21 — Audit follow-up (rows added after first pass)

| API / mechanism | Status | Intent(s) | Gap / action |
|-----------------|--------|-----------|--------------|
| `POST …/billing/confirm-checkout` | 🔴 | — | **`confirm_billing_checkout`** — Stripe return handoff after SaaS checkout |
| `GET …/billing/entitlements` | 🟡 | Plan gating reads | **`explain_plan_entitlements`** |
| `PUT …/businesses/:id` + `settings.referralProgram` | 🔴 | — | **`configure_referral_program`** — **`dashboard-referral-program-tab.tsx`** |
| `PUT …/businesses/:id` + `settings.staffMessageTemplates` | 🔴 | — | **`configure_staff_message_templates`** — settings tab |
| `GET …/subscriptions/:id/usage` | 🟡 | `subscription_usage` (customer) | **`explain_subscription_usage`** dashboard admin read |
| `GET/POST/PUT …/external-doctors` | 🔴 | — | **`create_external_doctor`**, **`update_external_doctor`**, **`list_external_doctors`** |
| `GET …/clinic-test-results/bookings/:id/summaries` | 🟡 | `explain_patient_results` partial | Explicit **`list_booking_lab_summaries`** (same route as **provider-6.9.4**) |
| `POST …/ai/command/tasks/:id/approve`, `…/steps/:id/retry` | 🟡 | Agent gateway | **`approve_agent_task`**, **`retry_agent_step`** |
| `GET …/analytics/adoption` | 🟡 | Adoption dashboard panel | **`summarize_adoption_funnel`** read |
| Socket.IO `WS /events` | ⚪ | Realtime invalidation for bookings/AI | No REST — document **`no-ai-realtime`** in parity fixtures |

- [ ] **ai-cmd-dashboard-6.21.1** — Referral + staff message template intents → `PUT …/businesses/:id` settings blobs
- [ ] **ai-cmd-dashboard-6.21.2** — External doctors CRUD intents
- [ ] **ai-cmd-dashboard-6.21.3** — `confirm_billing_checkout` + `explain_plan_entitlements`

**Nothing else to REST-audit:** all four surfaces now have audit sections — **customer-6**, **provider-6**, **dashboard-6**; public routes live under **customer-6**. Remaining work is **implementation + parity CI gates**, not more inventory.

---

### ai-cmd-dashboard-6 — Gap summary (new / wire intents)

**P0 — daily ops (REST exists, AI missing or partial):**

`set_retail_sales_lines`, `delete_schedule_templates`, `delete_service`, `ship_gift_card`, `resolve_gift_card_change_request`, `rebook_all_from_agent_task`, `import_clinic_catalog_csv`

**P1 — settings & growth (ai-cmd-ext-2.14+ overlap):**

`configure_stripe_connect`, `configure_notification_settings`, `configure_whatsapp_integration`, `configure_loyalty_settings`, `create_promo_code`, `update_customer`, `create_questionnaire`

**P2 — operations & catalog:**

`delete_service_category`, `set_recommended_products`, `delete_expense`, `create_location`, inventory CRUD, subscription plan update, gift fulfillment queue reads

**P3 — enterprise / low traffic:**

Strategy eval, enterprise trust, marketing automation settings

**Bulk (AI-native already — harden eval + parity fixtures):**

`cancel_bookings`, `update_bookings`, `bulk_smart_cancel`, `bulk_create_catalog`, `bulk_update_service_currency`, `bulk_strip_disabled_locale_translations`, `apply_schedule`

**Bulk (REST batch — need new intents):**

`delete_schedule_templates`, `set_retail_sales_lines`, `set_recommended_products`, `import_clinic_catalog_csv`, `rebook_all_from_agent_task`, `undo_latest_agent_task`, `bulk_assign_services_category`

---

### ai-cmd-dashboard-6 — Suggested implementation order

| Phase | IDs | Closes API gaps |
|-------|-----|-----------------|
| **A — Bulk REST parity** | **6.18.*** , **6.5.1** , **6.3.1** , **6.12.1** | Templates delete, retail lines, recommendations |
| **B — Chair & booking hardening** | **6.3.*** , **6.18.5** | Retail compound + AI-native bulk fixtures |
| **C — Agent ops** | **6.1.*** | Rebook-all + undo-latest |
| **D — Gift + clinic CSV** | **6.10.*** , **6.9.1** | Fulfillment + catalog import |
| **E — Settings & growth** | **6.13.*** , **6.14.*** , **ai-cmd-ext-2.14+** | Stripe, notifications, promos |
| **F — Patient chart & questionnaires** | **6.7.*** , **6.8.*** | CRM depth |
| **G — Gate** | **6.19.*** | **`test:dashboard-api-ai-parity`** |

**Cross-links:** **ai-cmd-ext** (252 registry intents), **ai-cmd-ext-2.14+** (proposed verbs), **parity-2.1**, **ai-cmd-customer-6**, **ai-cmd-provider-6**, **feature-ai-prompt-coverage** (dashboard surface only).

---
