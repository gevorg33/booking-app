# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

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
| **40** | AI accuracy — classification engine + semantic intent matching | **acc-3** |
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
| **63** | Budget-aware service discovery (planned) | **budget-1**, **ai-cmd-budget** |
| **64** | Premium / best service discovery (planned) | **rank-1**, **ai-cmd-rank** |
| **65** | Flexible OR availability + budget compounds (planned) | **avail-1**, **ai-cmd-avail** |
| **—** | Unified service discovery (budget + rank + OR avail) | **discover-1**, **ai-cmd-discover** |
| **—** | Extend dashboard `AiCommandService` actions (orchestrator + registry parity) | **ai-cmd-ext** |

---

## ai-cmd-ext — Extend `AiCommandService` actions (plan)

**Goal:** Grow dashboard AI command coverage safely — every new product action gets a registry entry, classifier rule, handler (inline or delegated), rescue path, fixtures, and eval case — without letting `ai-command.service.ts` become an unmaintainable god-object.

**Baseline (today):**

| Metric | Value | Source |
|--------|-------|--------|
| Dashboard intents in registry | **234** (138 mutating) | `DASHBOARD_INTENTS` in `ai-command-registry.build.ts` |
| `executeSingleIntent` switch cases | **~337** (multi-surface + aliases) | `ai-command.service.ts` |
| LEGACY_CORE intents owned by `AiCommandService` | **~51 mutate + ~19 read** | `LEGACY_CORE_BINDINGS` in registry build |
| `INTENT_SCHEMA` action union | **~52 core verbs** (stale) | top of `INTENT_SCHEMA` in `ai-command.service.ts` |
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

- [ ] Registry binding + access tier in `access-control.matrix.ts`
- [ ] `INTENT_SCHEMA` union entry + classifier rules wired
- [ ] `case` in `executeSingleIntent` **or** documented delegation to another surface service
- [ ] Handler + validator + entity params
- [ ] Rescue/heuristic + ≥10 NL variants in fixtures
- [ ] Eval golden cases (`npm run test:sprint14`; `test:ai-accuracy` when applicable)

---

### ai-cmd-ext-0 — Orchestrator hygiene (do first)

| Task ID | Work | Why |
|---------|------|-----|
| **ai-cmd-ext-0.1** | Regenerate `INTENT_SCHEMA` action union from `DASHBOARD_INTENTS` (+ shared dashboard/provider reads) | Classifier cannot emit actions missing from the union |
| **ai-cmd-ext-0.2** | Handler coverage gate — test fails when any `DASHBOARD_INTENTS` id lacks a `switch` case **or** a registry `handler !== 'AiCommandService'` with working dispatch on that service | Closes registry ↔ execution drift |
| **ai-cmd-ext-0.3** | Replace generic `default` summary with registry lookup ("action X is registered but handler Y is not wired") | Better telemetry + faster triage |
| **ai-cmd-ext-0.4** | Extract LEGACY_CORE inline methods → `AiDashboardCoreService` (booking, cancel, show, analytics, schedule mutate) — `AiCommandService` keeps classify + compound + dispatch only | Target orchestrator **< 5k LOC** |
| **ai-cmd-ext-0.5** | Optional: registry-driven dispatch table (`Map<intent, handlerFn>`) built at module init | Removes 300+ `case` branches over time |

---

### ai-cmd-ext-1 — Extend existing dashboard handlers (params, not new verbs)

These ship through **`AiCommandService`** by extending existing `handleListServices`, `handleCheckAvailability`, `handleCreateBooking`, etc.

| Task ID | Action(s) | Change type | Handler | Sprint | Depends on |
|---------|-----------|-------------|---------|--------|------------|
| **ai-cmd-ext-1.1** | `list_services` | Add param `maxPrice` | `handleListServices` | **63** / **budget-1.9** | **budget-1.1**–**1.4** |
| **ai-cmd-ext-1.2** | `list_services` | Add param `serviceRank` (`highest_price` \| `lowest_price` \| `most_popular`) | `handleListServices` | **64** / **rank-1.4** | **rank-1.1**–**1.3** |
| **ai-cmd-ext-1.3** | `check_availability` | Add param `availabilityWindows[]` + per-window `timeOfDay` | `handleCheckAvailability` | **65** / **avail-1.5** | **avail-1.1**–**1.4** |
| **ai-cmd-ext-1.4** | `create_booking` | Budget/rank pre-filter + `bookingFirstAvailable` across OR windows | `handleCreateBooking` + compound utils | **65** / **avail-1.6**–**1.8** | **discover-1.1**–**1.3** |
| **ai-cmd-ext-1.5** | `lookup_service_assignment` | Optional `maxPrice` / `serviceRank` on team-wide "who can do X" | `handleLookupServiceAssignment` | **63**–**64** | **budget-1.1**, **rank-1.1** |
| **ai-cmd-ext-1.6** | `summarize_bookings` | Revenue KPIs with tenant currency formatting | existing analytics handler | **28** / **curr-1** | shipped util reuse |

**Note:** `recommend_specialists`, `book_appointment`, `check_providers_for_service` extend on **public/customer** surfaces (`PublicBookingAssistantService`, `CustomerAiCommandService`) — track under **ai-cmd-budget** / **ai-cmd-rank** / **ai-cmd-avail**, not this file.

---

### ai-cmd-ext-2 — New dashboard actions (add `case` + delegate)

| Task ID | Action | R/W | Delegate handler | Sprint | Surfaces | Product link |
|---------|--------|-----|------------------|--------|----------|--------------|
| **ai-cmd-ext-2.1** | `upload_patient_result` | M | `AiClinicTestResultService` | **54** | dashboard | **ai-cmd-clinic-6** (legacy upload — skip if v2-only) |
| **ai-cmd-ext-2.2** | `explain_patient_results` | R | `AiClinicTestResultService` | **54** | dashboard | **ai-cmd-clinic-6** |
| **ai-cmd-ext-2.3** | `configure_test_reference_range` | M | `AiClinicTestResultService` (new) | **54** | dashboard | **vert-clinic-2.1.6** normal ranges |
| **ai-cmd-ext-2.4** | `list_abnormal_results` | R | `AiClinicTestResultService` (new) | **54** | dashboard | **vert-clinic-2.1.6** |
| **ai-cmd-ext-2.5** | `create_employee` | M | `AiOperationsService` (new) | **55** / **parity-2.1** | dashboard | staff onboarding |
| **ai-cmd-ext-2.6** | `invite_staff_member` | M | `AiOperationsService` (new) | **55** / **parity-2.1** | dashboard | team invite flow |
| **ai-cmd-ext-2.7** | `deactivate_employee` | M | `AiOperationsService` (new) | **55** / **parity-2.1** | dashboard | staff lifecycle |
| **ai-cmd-ext-2.8** | `configure_online_booking` | M | `AiOperationsService` (new) | **55** / **parity-2.1** | dashboard | public page settings |
| **ai-cmd-ext-2.9** | `open_billing_settings` | R | `AiMarketingGrowthService` or new `AiBillingSettingsService` | **55** / **parity-2.1** | dashboard | deep-link + explain plan |
| **ai-cmd-ext-2.10** | `summarize_loyalty_program` | R | `AiMarketingGrowthService` (extend) | **55** / **parity-2.1** | dashboard | loyalty module |
| **ai-cmd-ext-2.11** | `list_waitlist_entries` | R | new `AiWaitlistService` | **62** / **prov-exp-8** | dashboard (+ provider read) | waitlist panel API |
| **ai-cmd-ext-2.12** | `offer_waitlist_slot` | M | `AiWaitlistService` | **62** / **prov-exp-8** | dashboard | manager offers gap to waitlist |

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

### ai-cmd-ext-4 — Multi-step dashboard compounds (orchestration in `AiCommandService`)

| Task ID | Compound recipe | Step actions (ordered) | Sprint | Decompose util |
|---------|-----------------|------------------------|--------|----------------|
| **ai-cmd-ext-4.1** | `onboard_new_stylist` | `create_employee` → `assign_employee_services` → `onboard_provider_schedule` → `configure_online_booking` | **57** / **parity-3.2** | new `decomposeStaffOnboardingCompoundPrompt` |
| **ai-cmd-ext-4.2** | `clinic_lab_day_close` | `list_test_orders` → `enter_test_result` → `release_test_result` → `notify_patient_result_ready` | **54** / **vert-clinic-2** | extend `decomposeClinicCompoundPrompt` |
| **ai-cmd-ext-4.3** | `budget_discover_and_book` | filter catalog → `check_availability` → `create_booking` | **63**–**65** / **discover-1** | extend check-and-book (**ai-cmd-h1**) |
| **ai-cmd-ext-4.4** | `rank_discover_and_book` | `list_services` (rank) → `check_availability` → `create_booking` | **64**–**65** | **ai-cmd-discover** mega-prompts |

Register each in `buildCompoundCommandRecipes()` + eval `compoundSteps` / `compoundStepParams`.

---

### Implementation order

| Phase | Task IDs | Exit criteria |
|-------|----------|---------------|
| **0 — Hygiene** | **ai-cmd-ext-0.1**–**0.3** | CI gate: no registry intent without handler path; union synced |
| **1 — Param extensions** | **ai-cmd-ext-1.1**–**1.4** | **budget-1**, **rank-1**, **avail-1**, **discover-1** gates green |
| **2 — New dashboard verbs** | **ai-cmd-ext-2.*** per product sprint | Each row meets per-action DoD + **parity-2.4** locale eval |
| **3 — Provider dispatch** | **ai-cmd-ext-3.*** | Provider matrix 100% wired (**parity-1** inventory) |
| **4 — Compounds** | **ai-cmd-ext-4.*** | Labeled multi-step set ≥95% (**parity-3.2**) |
| **5 — Refactor** | **ai-cmd-ext-0.4**–**0.5** | `AiCommandService` LOC reduced; dispatch table optional |

**Related:** **ai-cmd-h1**–**h4** (NLU quality), **parity-1**–**parity-4** (role coverage matrix + CI), **acc-2** (eval expansion for every new action).

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

#### Store launch (consumer)

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

- [ ] **ai-cmd-clinic-6** — Dashboard: **`upload_patient_result`** / **`explain_patient_results`** — legacy file-upload path; **superseded for v2** by **`enter_test_result`** / **`release_test_result`** (**ai-cmd-clinic-v2-2**); keep open only if legacy metadata upload is still required

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---
- [ ] **vert-clinic-2.1.6** — Normal ranges — reference range entities + admin CRUD on test types; abnormal flags on result measurements (public My results + consumer My results + dashboard Results tab)
- [ ] **vert-clinic-2.1.6** — Normal ranges — reference ranges + abnormal flags on results (catalog admin + result display)

## Sprint 63 — Budget-aware service discovery (planned)

**Goal:** When a visitor or logged-in customer says they have a fixed amount (e.g. *"I need a haircut, I have $50"*), the booking assistant **deterministically** lists or recommends catalog services with `price <= maxPrice` — never all matches regardless of price.

**Surfaces (AI coverage):**

| Surface | In scope | Primary actions |
|---------|----------|-----------------|
| Public booking web | Yes | `list_services`, `recommend_specialists`, compounds with `check_availability` / `book_appointment` |
| Customer mobile (consumer app) | Yes | Same public-assistant actions via `CustomerAiCommandService` |
| Dashboard admin | Optional v1 | `list_services` READ with `maxPrice` when owner asks "show services under $X" |
| Provider mobile | **Out of scope** | Providers do not budget-shop the catalog |

**Price semantics:** Compare against catalog **display price** (`service.price` in tenant default currency). Tax/deposit is checkout-only — assistant copy should say "from $X" when tax display is enabled (**tax-1**). Do not confuse with gift-card balance (**ai-payments**).

### budget-1 — Product & handler spine (planned)

- [ ] **budget-1.1** — Shared util `filterServicesByMaxPrice(services, maxPrice)` + `sortServicesByPriceAsc`; unit spec for edge cases (null price, equal prices, empty catalog)
- [ ] **budget-1.2** — Classifier param **`maxPrice`** (number) on public + customer schemas; wire **`BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [ ] **budget-1.3** — Post-LLM rescue: `enrichBudgetFromPrompt()` reuses `extractAmountFromPrompt()` + "under/below/at most/no more than X" patterns; set `maxPrice` when classifier missed it
- [ ] **budget-1.4** — **`handleListServices`** — after name/category filter, apply `maxPrice`; summary lists only matches sorted by price; **no-match** copy: cheapest option above budget + next-cheapest alternatives
- [ ] **budget-1.5** — **`handleRecommendSpecialists`** — restrict `serviceIds` to budget-filtered services before `recommendProviders`; if none, same no-match copy as list
- [ ] **budget-1.6** — Navigate hint — when exactly one match, `navigate: { path: 'services', query: { serviceId } }`; when multiple, services tab without pre-select
- [ ] **budget-1.7** — Compound decomposition — budget + book nearest / check availability (mirror **ai-cmd-h1** check-and-book): e.g. *"book a haircut under $50 tomorrow ASAP"* → filter → `book_appointment` with `bookingFirstAvailable`
- [ ] **budget-1.8** — Disambiguation — **`maxPrice` ≠ gift card** ("I have a $50 gift card" → promo/gift-card flow, not budget filter); **`maxPrice` ≠ package total** (route `discover_packages` only when user says package/bundle/deal)
- [ ] **budget-1.9** — Optional dashboard READ — extend admin `list_services` handler with same filter when `maxPrice` present (lower priority than customer surfaces)
- [ ] **budget-1.10** — Fixtures **`ai-budget-service-discovery.fixtures.ts`** — classifier rules + `SIMILAR_BUDGET_SERVICE_PROMPTS` (all scenario `id`s below); `it.each` in `*.util.spec.ts` + integration specs per surface
- [ ] **budget-1.11** — Eval cases in `eval/ai-command-eval.cases.ts` tagged `surface: public | customer` (+ dashboard if shipped); gate **`npm run test:ai-budget`**
- [ ] **budget-1.12** — Extended fixtures — sections **I–L** below (voice, session, currency, duration); ≥ **40** fixture `id`s total for budget domain

**Depends on:** **ai-cmd-h1** (list/recommend handlers), **curr-1** (currency display in summaries), **extractAmountFromPrompt** in `ai-payments.util.ts`.

### ai-cmd-budget — NL scenario matrix (fixtures — implement before handlers)

Add each row to `SIMILAR_BUDGET_SERVICE_PROMPTS` with `id`, `prompt`, `surface`, `expectedAction`, and expected params (`maxPrice`, `serviceName` / `serviceCategory`, etc.).

#### A — Happy path: service type + budget

| id | Example prompt | Expected action | Expected params |
|----|----------------|-----------------|-----------------|
| `budget-hair-50-en` | I need a haircut, I have $50 | `list_services` | `serviceCategory`: haircut, `maxPrice`: 50 |
| `budget-massage-under-80-en` | What massages can I get for under 80 dollars? | `list_services` | `serviceCategory`: massage, `maxPrice`: 80 |
| `budget-facial-budget-only-en` | What can I book with $30? | `list_services` | `maxPrice`: 30 (no service filter) |
| `budget-cheapest-hair-en` | What's the cheapest haircut you offer? | `list_services` | `serviceCategory`: haircut, sort asc (no `maxPrice` unless "cheapest under X") |
| `budget-provider-karo-en` | Does Karo have anything under $40? | `list_services` | `employeeName`: Karo, `maxPrice`: 40 |
| `budget-recommend-rated-en` | Best rated massage under $100 this week | `recommend_specialists` | `serviceCategory`: massage, `maxPrice`: 100, date range |

#### B — Match / no-match outcomes (handler assertions)

| id | Catalog setup (fixture) | Expected behavior |
|----|-------------------------|-------------------|
| `budget-multiple-matches` | 3 hair services @ $35, $45, $55 | List only $35 + $45; sorted ascending; show prices |
| `budget-exact-at-ceiling` | One service @ exactly $50, budget $50 | Include service (inclusive `<=`) |
| `budget-no-match-cheapest-hint` | All haircuts > $50 | Fail soft: "Nothing under $50"; name cheapest ($55) + duration |
| `budget-single-match-navigate` | One massage @ $40 under $50 | Summary + navigate pre-select that `serviceId` |
| `budget-filter-after-category` | Category "hair" matches 5, only 2 under budget | Category filter first, then price filter |

#### C — Compounds (multi-step)

| id | Example prompt | Steps |
|----|----------------|-------|
| `budget-book-nearest-en` | Book a haircut under $50 tomorrow, nearest slot | Filter by budget → `book_appointment`, `bookingFirstAvailable`: true |
| `budget-check-then-book-en` | Who's free for a facial under $60 tomorrow evening, book the soonest | Filter → check availability → book nearest |
| `budget-list-then-pick-en` | Show options under $40 then I'll pick (follow-up turn) | Turn 1: list; session keeps `maxPrice`; turn 2: user names service → availability |
| `budget-or-windows-en` | (full OR + budget matrix) | See **Sprint 65** / **ai-cmd-avail** — e.g. haircut tomorrow evening or Friday afternoon, I have $50 |

#### D — Amount extraction variants

| id | Example prompt | `maxPrice` |
|----|----------------|------------|
| `budget-dollar-sign-en` | I have $50 for a haircut | 50 |
| `budget-word-amount-en` | I have fifty dollars for massage | 50 |
| `budget-under-phrase-en` | Haircut below 50 bucks | 50 |
| `budget-decimal-en` | Anything under $49.99 | 49.99 |
| `budget-no-currency-word-en` | I only have 50 for styling | 50 (assume tenant currency) |

#### E — Multilingual (EN / HY / RU)

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-hy-dram` | Ես 5000 դրամ ունեմ մազակտման համար | `maxPrice`: 5000, AMD tenant |
| `budget-ru-ruble` | У меня 3000 рублей на стрижку | `maxPrice`: 3000, RUB tenant |
| `budget-euro-symbol-en` | Facials under €40 please | `maxPrice`: 40 |

#### F — Negative / rescue (must NOT budget-filter)

| id | Example prompt | Correct routing |
|----|----------------|-----------------|
| `budget-not-gift-card-en` | I have a $50 gift card for a haircut | Gift card / checkout flow — **no** `maxPrice` |
| `budget-not-package-en` | Any spa packages under $100? | `discover_packages` (package catalog, not per-service list) |
| `budget-not-deposit-en` | Is the $50 deposit enough for highlights? | `explain_checkout_currency` or booking help — deposit ≠ budget |
| `budget-stale-session-en` | (prior: haircut $50) user: "actually I have $30" | Fresh `maxPrice`: 30 overrides session |

#### G — Phase 2 (document now, ship later)

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-cart-total-en` | Two services under $100 total | Needs `maxTotalPrice` + multi-service cart validation (**gap-2.5** multi-select) |
| `budget-with-promo-en` | Haircut under $50 with code SAVE10 | Filter list first; promo applied at checkout only |
| `budget-subscription-en` | Can my plan cover a $80 massage? | Route subscription balance READ, not catalog `maxPrice` |

#### H — Voice / mobile phrasing (shorter, ASR quirks)

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-voice-short-en` | Haircut fifty bucks max | `maxPrice`: 50, mobile brevity |
| `budget-voice-no-verb-en` | Massage under 80 | Imperative omitted |
| `budget-voice-asr-en` | I have 50 dollars for her cut | ASR homophone "her cut" → haircut |
| `budget-voice-chip-en` | (tap suggest chip: "Services under $50") | Consumer assistant chip → `list_services`, `maxPrice`: 50 |
| `budget-question-en` | Can I get a facial for less than 40? | Question form → same as budget list |

#### I — Session / multi-turn

| id | Turn flow | Expected behavior |
|----|-----------|-------------------|
| `budget-session-raise-en` | T1: under $40 / T2: ok what about $60? | T2 replaces `maxPrice`; fresh list |
| `budget-session-service-switch-en` | T1: haircut $50 / T2: any massage in that budget? | Keep `maxPrice`: 50; switch category |
| `budget-session-after-list-en` | T1: options under $50 / T2: book the cheapest tomorrow | Compound from session `maxPrice` + rank pick |
| `budget-session-stale-service-en` | T1: haircut $50 / T2: actually nails | Override service category; keep budget |

#### J — Currency & amount edge cases

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-range-en` | Haircut between $40 and $60 | Phase 2: `minPrice` + `maxPrice`; v1 clarify or use `maxPrice`: 60 |
| `budget-round-number-en` | About 50 dollars for styling | `maxPrice`: 50; "about" = ceiling |
| `budget-tenant-amd-en` | (tenant currency AMD) under 15000 dram | Symbol-less amount + tenant default |
| `budget-zero-en` | Free consultation options? | `maxPrice`: 0 or route free-price services only |
| `budget-large-en` | Nothing over 500000 dram | Large integer parsing |

#### K — Provider / named service + budget

| id | Example prompt | Expected params |
|----|----------------|-----------------|
| `budget-named-service-en` | Is Swedish massage under $90? | `serviceName`: Swedish massage, `maxPrice`: 90 |
| `budget-any-provider-en` | Any stylist for a cut under $45? | `allProviders`: true, `maxPrice`: 45 |
| `budget-provider-no-match-en` | Karo — anything under $30? | Provider filter + budget; empty if none |

#### L — Duration + budget (phase 2 hook)

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-short-service-en` | Quick haircut under $40 | Prefer shorter `durationMinutes` within budget |
| `budget-long-massage-en` | 90-minute massage under $100 | May no-match if all 90m > $100 — honest copy |

**Implementation order:** fixtures (**budget-1.10**, **1.12**) → util + rescue (**budget-1.1**, **1.3**) → classifier wiring (**1.2**) → list/recommend handlers (**1.4–1.6**) → compounds (**1.7**) → disambiguation (**1.8**) → eval + gate (**1.11**).

---

## Sprint 64 — Premium / best service discovery (planned)

**Goal:** When a visitor asks *"What is the best and premium {serviceType}?"* or *"What's your top-tier / most expensive massage?"*, the assistant **deterministically** picks or ranks catalog **services** (not specialists) — e.g. highest price in category, cheapest, or (phase 2) most popular — instead of dumping an unsorted list or misrouting to `recommend_specialists`.

**Today (gap):** `recommend_specialists` answers "best **rated** massage" with **providers**; `list_services` returns **all** category matches unsorted; no `premium` / `tier` field on `Service`; dashboard `analyze_services` (most booked) is admin-only.

**Surfaces (AI coverage):**

| Surface | In scope | Primary actions |
|---------|----------|-----------------|
| Public booking web | Yes | `list_services` with `serviceRank`; compounds with `book_appointment` |
| Customer mobile (consumer app) | Yes | Same public-assistant actions via `CustomerAiCommandService` |
| Dashboard admin | Partial (exists) | `analyze_services` (most booked / revenue) for ops; optional `list_services` + `serviceRank` parity |
| Provider mobile | **Out of scope** | — |

**Disambiguation (critical):**

| User says | Route | Returns |
|-----------|-------|---------|
| Best **rated** / top **specialist** / who is the best for {service} | `recommend_specialists` | Providers + ratings (existing) |
| Best / premium / top-tier / luxury / deluxe **service** | `list_services` + `serviceRank` | One or ranked **services** from catalog |
| Most **popular** service (customer) | `list_services` + `serviceRank: most_popular` | Phase 2 — needs booking-count aggregate on public catalog API |
| Most popular service (owner) | `analyze_services` | Existing dashboard handler |

**Rank semantics:** Default tie-breakers: price desc/asc → longer duration → name A–Z. "Premium" / "luxury" / "deluxe" / "top-tier" → `serviceRank: highest_price` within `serviceCategory`. Optional phase 2: admin **`isFeatured`** / **`serviceTier`** on service entity overrides price heuristic when set.

### rank-1 — Product & handler spine (planned)

- [ ] **rank-1.1** — Shared util `sortServicesByPriceDesc` / `sortServicesByPriceAsc` (reuse from **budget-1.1**); `pickRankedServices(catalog, { serviceRank, serviceCategory, limit })` — returns top N; unit spec for ties and empty catalog
- [ ] **rank-1.2** — Classifier param **`serviceRank`**: `highest_price` \| `lowest_price` \| `most_popular` \| null on public + customer schemas; wire **`SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [ ] **rank-1.3** — Post-LLM rescue: `enrichServiceRankFromPrompt()` — map premium/luxury/deluxe/top-tier/most expensive/priciest → `highest_price`; cheapest/lowest/affordable → `lowest_price`; most popular/best-selling → `most_popular` (when phase 2 ready)
- [ ] **rank-1.4** — **`handleListServices`** — after category filter, apply `serviceRank`; when `limit: 1` (default for "the best/premium service"), summary highlights single top match + price/duration; when user asks "show all premium options", return top 3–5 ranked
- [ ] **rank-1.5** — **`recommend_specialists` guard** — when prompt asks for best/**service** (not specialist/stylist/therapist), rescue to `list_services` + `serviceRank` before provider recommendation
- [ ] **rank-1.6** — Navigate hint — single top match → `navigate: { path: 'services', query: { serviceId } }`
- [ ] **rank-1.7** — Compound decomposition — e.g. *"book your most premium facial tomorrow nearest slot"* → rank pick → `book_appointment` with resolved `serviceName`
- [ ] **rank-1.8** — Phase 2 catalog metadata — optional `service.isFeatured` or `serviceTier: standard | premium` on dashboard service editor; rank util prefers featured/tier over raw price
- [ ] **rank-1.9** — Phase 2 **`most_popular`** — public catalog endpoint exposes rolling 90d booking count per service (or reuse dashboard aggregate read-only); rank by count desc within category
- [ ] **rank-1.10** — Fixtures **`ai-service-rank-discovery.fixtures.ts`** — classifier rules + `SIMILAR_SERVICE_RANK_PROMPTS` (scenario `id`s below); share price-sort helpers with **budget-1** fixtures spec
- [ ] **rank-1.11** — Eval cases in `eval/ai-command-eval.cases.ts` tagged `surface: public | customer`; gate **`npm run test:ai-rank`** (or merge with **`test:ai-budget`** as **`test:ai-service-discovery`**)
- [ ] **rank-1.12** — Extended fixtures — sections **I–L** below; ≥ **35** fixture `id`s total for rank domain

**Depends on:** **ai-cmd-h1** (`list_services`, `recommend_specialists`), **budget-1.1** (shared sort utils — ship together or extract to `ai-service-catalog-rank.util.ts`).

### ai-cmd-rank — NL scenario matrix (fixtures — implement before handlers)

Add each row to `SIMILAR_SERVICE_RANK_PROMPTS` with `id`, `prompt`, `surface`, `expectedAction`, and expected params (`serviceRank`, `serviceCategory`, `limit`, etc.).

#### A — Premium / top-tier (highest price in category)

| id | Example prompt | Expected action | Expected params |
|----|----------------|-----------------|-----------------|
| `rank-premium-hair-en` | What is the best and premium haircut service? | `list_services` | `serviceCategory`: haircut, `serviceRank`: highest_price, `limit`: 1 |
| `rank-luxury-massage-en` | What's your luxury massage option? | `list_services` | `serviceCategory`: massage, `serviceRank`: highest_price |
| `rank-deluxe-facial-en` | Do you have a deluxe facial? | `list_services` | `serviceCategory`: facial, `serviceRank`: highest_price |
| `rank-most-expensive-en` | Which is your most expensive styling service? | `list_services` | `serviceCategory`: styling, `serviceRank`: highest_price |
| `rank-top-tier-en` | Show me your top-tier hair color services | `list_services` | `serviceCategory`: hair color, `serviceRank`: highest_price, `limit`: 3 |

#### B — Cheapest / value (lowest price — overlaps budget Sprint 63)

| id | Example prompt | Expected action | Expected params |
|----|----------------|-----------------|-----------------|
| `rank-cheapest-hair-en` | What's the cheapest haircut you offer? | `list_services` | `serviceCategory`: haircut, `serviceRank`: lowest_price, `limit`: 1 |
| `rank-most-affordable-en` | Most affordable massage option | `list_services` | `serviceCategory`: massage, `serviceRank`: lowest_price |

#### C — Best service vs best specialist (disambiguation)

| id | Example prompt | Expected action | Why |
|----|----------------|-----------------|-----|
| `rank-not-specialist-en` | What's the best premium service for lashes? | `list_services` | **Service** catalog rank — not `recommend_specialists` |
| `rank-specialist-stays-en` | Who is the best rated lash specialist this week? | `recommend_specialists` | **Provider** rank — existing behavior |
| `rank-best-service-explicit-en` | Best service in your spa menu for relaxation | `list_services` | "best service" keyword → catalog |
| `rank-best-for-me-en` | What's the best option for a first-time haircut? | `list_services` or clarify | May need `booking_help` if subjective — document clarify path |

#### D — Handler outcomes (fixture catalog assertions)

| id | Catalog setup | Expected behavior |
|----|---------------|-------------------|
| `rank-single-premium-tie-price` | 2 hair services @ $80, 1 @ $50 | Return $80 pair or both with tie-break (duration then name) |
| `rank-name-premium-fallback` | Services named "Premium Cut" ($45) and "Standard Cut" ($60) | Phase 1: rank by **price** ($60); Phase 2: `isFeatured` / name tier optional boost |
| `rank-one-in-category` | Only one massage in catalog | Return that service with "our massage option" copy |
| `rank-empty-category` | No facial services | Same not-found copy as today + suggest available categories |
| `rank-navigate-single` | One clear highest-price match | Navigate pre-select `serviceId` |

#### E — Compounds (multi-step)

| id | Example prompt | Steps |
|----|----------------|-------|
| `rank-book-premium-en` | Book your most premium facial tomorrow, nearest slot | `highest_price` pick → `book_appointment`, `bookingFirstAvailable`: true |
| `rank-list-then-book-en` | What's your best massage and book it Saturday | Turn 1: rank pick; Turn 2: availability + book (or compound auto) |
| `rank-premium-under-budget-en` | Best premium haircut I can get under $80 | **Both** `serviceRank`: highest_price + `maxPrice`: 80 (**Sprint 63** + **64** intersection) |

#### F — Multilingual (EN / HY / RU)

| id | Example prompt | Notes |
|----|----------------|-------|
| `rank-premium-hy` | Որն է ձեր ամենապրեմիում մազակրտումը | `serviceRank`: highest_price |
| `rank-luxury-ru` | Какой у вас люксовый массаж? | `serviceRank`: highest_price |
| `rank-cheapest-hy` | Ամենաէժան մազակրտումը | `serviceRank`: lowest_price |

#### G — Negative / rescue (must NOT misroute)

| id | Example prompt | Correct routing |
|----|----------------|-----------------|
| `rank-not-analyze-appt-en` | Most expensive appointment today | Dashboard `analyze_appointments` — not catalog rank |
| `rank-not-analyze-services-admin-en` | (dashboard) most booked service this month | `analyze_services` — admin analytics |
| `rank-not-package-en` | What's your premium spa package? | `discover_packages` when user says package/bundle |
| `rank-rated-means-provider-en` | Best rated deep tissue massage | `recommend_specialists` — "rated" + no "service" noun |

#### H — Phase 2 (document now, ship later)

| id | Example prompt | Notes |
|----|----------------|-------|
| `rank-most-popular-en` | What's your most popular haircut? | `serviceRank`: most_popular — needs booking-count on catalog API |
| `rank-featured-flag-en` | (catalog: `isFeatured` on mid-price service) | Featured wins over higher price |
| `rank-tier-metadata-en` | Premium tier services for color | `serviceTier: premium` filter on service entity |

#### I — Synonyms & marketing language

| id | Example prompt | Maps to |
|----|----------------|---------|
| `rank-vip-en` | VIP hair treatment options | `highest_price` in hair |
| `rank-signature-en` | What's your signature massage? | `highest_price` or featured (phase 2) |
| `rank-flagship-en` | Flagship facial service | `highest_price` |
| `rank-entry-level-en` | Entry-level manicure | `lowest_price` |
| `rank-budget-friendly-en` | Budget-friendly pedicure | `lowest_price` |
| `rank-mid-range-en` | Mid-range color service | Phase 2: percentile rank — v1 list sorted by price |

#### J — Voice / mobile + questions

| id | Example prompt | Notes |
|----|----------------|-------|
| `rank-voice-premium-en` | Premium cut? | Short mobile; `limit`: 1 |
| `rank-voice-cheapest-en` | Cheapest facial you got | Colloquial |
| `rank-compare-en` | What's the difference between standard and premium haircut? | List top 2 by rank asc+desc or `booking_help` |
| `rank-recommend-not-provider-en` | Recommend your best spa service not a person | Force `list_services` + `highest_price` |

#### K — Session / multi-turn

| id | Turn flow | Expected behavior |
|----|-----------|-------------------|
| `rank-session-upgrade-en` | T1: cheapest haircut / T2: show premium instead | Switch `serviceRank` lowest → highest |
| `rank-session-then-budget-en` | T1: premium facial / T2: anything like that under $120? | Rank pick then filter or intersect |
| `rank-session-pick-one-en` | T1: top 3 premium massages / T2: book the second one | Session list index → `serviceName` |

#### L — Handler edge cases

| id | Catalog setup | Expected behavior |
|----|---------------|-------------------|
| `rank-all-same-price` | 4 massages all @ $70 | Tie-break duration then name; list all if user asked plural |
| `rank-inactive-excluded` | Highest price service inactive | Skip inactive; next highest |
| `rank-zero-price` | Free consultation + paid consult | Free sorts `lowest_price`; premium excludes $0 unless asked |
| `rank-missing-price` | Service with null price | Exclude from price rank or sort last with "price on request" copy |

**Implementation order:** shared sort util with **budget-1.1** → fixtures (**rank-1.10**, **1.12**) → classifier + rescue (**rank-1.2**, **1.3**, **1.5**) → `handleListServices` rank (**1.4**, **1.6**) → compounds (**1.7**) → phase 2 metadata + popularity (**1.8**, **1.9**) → eval + gate (**rank-1.11**).

**Ship together with Sprint 63 when possible:** extract `ai-service-catalog-rank.util.ts` + single gate `npm run test:ai-service-discovery` covering budget + rank + intersection scenarios (`rank-premium-under-budget-en`).

---

## Sprint 65 — Flexible OR availability + budget compounds (planned)

**Goal:** Handle natural flexible scheduling prompts like *"I want a {serviceType} tomorrow evening or Friday afternoon, I have $50"* — multiple **alternative** date/time windows (OR, not AND), optional **budget** filter, and optional auto-book — instead of collapsing to a single `date` + single `timeOfDay`.

**Today (gap):**

| Piece | Status |
|-------|--------|
| Service category extraction | Works |
| Single `date` + single `timeOfDay` | Classifier supports; public `check_availability` does **not** apply `filterSlotsByTimeOfDay` on results |
| **OR** between windows (tomorrow evening **or** Friday afternoon) | **Not supported** — one `timeOfDay` only |
| Budget `$50` | **Not supported** — **Sprint 63** |
| Compound *I want …* → check + book | Partial — **ai-cmd-h1** check-and-book for single window only |

**Example canonical prompt:** *"I want a haircut tomorrow evening or Friday afternoon, I have $50"*

**Surfaces (AI coverage):**

| Surface | In scope | Primary actions |
|---------|----------|-----------------|
| Public booking web | Yes | `check_availability`, `book_appointment`, compounds |
| Customer mobile (consumer app) | Yes | Same via `CustomerAiCommandService` / public assistant |
| Dashboard admin | **Out of scope** v1 | Staff scheduling uses different availability model |
| Provider mobile | **Out of scope** | — |

**Param model (new):**

```json
"availabilityWindows": [
  { "date": "DD/MM/YYYY", "timeOfDay": "evening" },
  { "weekdays": ["friday"], "timeOfDay": "afternoon" }
]
```

- Each window is an **OR** alternative — scan all, merge slot results grouped by window, surface earliest match across windows.
- Legacy single `date` / `weekdays` / `timeOfDay` still works; rescue expands to one-element `availabilityWindows[]` when OR detected in prompt.
- Combine with **`maxPrice`** from **Sprint 63** — filter services before slot scan.

### avail-1 — Product & handler spine (planned)

- [ ] **avail-1.1** — Shared util `parseAvailabilityWindowsFromPrompt()` + `normalizeAvailabilityWindows(params)` — detect "or", "either … or", comma-separated day+timeOfDay pairs; unit spec
- [ ] **avail-1.2** — Classifier param **`availabilityWindows`** on public + customer schemas; wire **`FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [ ] **avail-1.3** — Post-LLM rescue: `enrichAvailabilityWindowsFromPrompt()` — split OR phrases; map tomorrow / weekday names + morning/afternoon/evening per clause
- [ ] **avail-1.4** — **`resolvePublicAvailabilityDateKeys`** — accept per-window date keys (don't flatten OR into one `weekdays` list that loses timeOfDay pairing)
- [ ] **avail-1.5** — **`handleCheckAvailability`** — loop windows; apply **`filterSlotsByTimeOfDay`** per window (parity with dashboard); merge day reports labeled by window (*Tomorrow evening*, *Friday afternoon*)
- [ ] **avail-1.6** — **`findNearestBookableSlot`** / book path — try windows in order (or earliest-across-all); first bookable slot wins; handoff preserves chosen window in session
- [ ] **avail-1.7** — **Budget intersection** — when `maxPrice` set, filter `matchedServices` before slot scan (**budget-1.4**); summary mentions price cap ("options under $50")
- [ ] **avail-1.8** — Compound decomposition — *"I want a haircut tomorrow evening or Friday afternoon, I have $50"* → filter services → `check_availability` with windows; optional follow-up / auto `book_appointment` with `bookingFirstAvailable` on winning window
- [ ] **avail-1.9** — Clarify path — when windows overlap (tomorrow **is** Friday) or budget excludes all services, honest clarify / merged single window
- [ ] **avail-1.10** — Fixtures **`ai-flexible-availability.fixtures.ts`** — classifier rules + `SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS` (scenario `id`s below)
- [ ] **avail-1.11** — Eval cases tagged `surface: public | customer`; extend gate **`npm run test:ai-service-discovery`** or add **`npm run test:ai-availability-flex`**
- [ ] **avail-1.12** — Extended fixtures — sections **I–M** below; ≥ **45** fixture `id`s total for availability domain

**Depends on:** **ai-cmd-h1** (check-and-book, `filterSlotsByTimeOfDay`, `resolvePublicAvailabilityDateKeys`), **budget-1** (`maxPrice` filter), **rank-1** optional (pick service when multiple under budget).

### ai-cmd-avail — NL scenario matrix (fixtures — implement before handlers)

Add each row to `SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS` with `id`, `prompt`, `surface`, `expectedAction`, and expected `availabilityWindows` + optional `maxPrice`.

#### A — OR windows (core)

| id | Example prompt | Expected action | Expected windows |
|----|----------------|-----------------|------------------|
| `avail-or-tomorrow-friday-en` | I want a haircut tomorrow evening or Friday afternoon | `check_availability` | `[{date: tomorrow, timeOfDay: evening}, {weekdays: [friday], timeOfDay: afternoon}]` |
| `avail-either-morning-en` | Massage Monday morning or Wednesday morning | `check_availability` | Two windows, both `timeOfDay: morning` |
| `avail-or-book-en` | Book lashes tomorrow evening or Saturday afternoon, whichever is sooner | `book_appointment` | Same windows + `bookingFirstAvailable`: true, pick earliest across windows |
| `avail-three-way-or-en` | Facial tomorrow, Friday afternoon, or Saturday morning | `check_availability` | Three OR windows |

#### B — Budget + OR (Sprint 63 ∩ 65)

| id | Example prompt | Expected params |
|----|----------------|-----------------|
| `avail-budget-or-en` | I want a haircut tomorrow evening or Friday afternoon, I have $50 | `serviceCategory`: haircut, `maxPrice`: 50, two OR windows |
| `avail-budget-under-or-en` | Massage under $80 tomorrow or Thursday evening | `maxPrice`: 80, two windows |
| `avail-budget-no-match-or-en` | (all haircuts > $50) same prompt | Soft fail: nothing under $50; show cheapest + ask to raise budget or pick another service |
| `avail-budget-pick-service-first-en` | Two services under $50 — scan both for slots across windows | List matching services or pick cheapest under budget then availability |

#### C — Single window (regression — must not break)

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-single-tomorrow-evening-en` | Who's free tomorrow evening for massage? | One window; existing **ai-cmd-h1** behavior + **avail-1.5** timeOfDay filter on public |
| `avail-single-friday-afternoon-en` | Any slots Friday afternoon for a facial? | `weekdays: [friday]`, `timeOfDay: afternoon` |
| `avail-no-or-and-en` | Monday and Friday afternoon for color | **AND** two weekdays, **same** timeOfDay — not OR; expand date keys, single afternoon filter |

#### D — Handler outcomes

| id | Setup | Expected behavior |
|----|-------|-------------------|
| `avail-slots-window-a-only` | Slots only tomorrow evening | Report window A; note window B empty |
| `avail-slots-window-b-only` | Slots only Friday afternoon | Report window B |
| `avail-earliest-across-windows` | Both have slots | Highlight earliest slot across OR options |
| `avail-overlap-tomorrow-is-friday` | Tomorrow is Friday | Merge/dedupe same calendar day; clarify if timeOfDay differs |
| `avail-public-timeofday-filter` | Afternoon window | Public handler applies `filterSlotsByTimeOfDay` — no morning slots in summary |

#### E — Compounds (multi-step)

| id | Example prompt | Steps |
|----|----------------|-------|
| `avail-check-then-book-or-en` | Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest | Budget filter → check both windows → book nearest |
| `avail-list-budget-then-or-en` | Show haircuts under $50, then check tomorrow evening or Friday | Turn 1: `list_services` + `maxPrice`; Turn 2: availability with windows |
| `avail-rank-budget-or-en` | Best premium facial under $100 tomorrow or Saturday | **rank-1** + **budget-1** + **avail-1** intersection |

#### F — Multilingual (EN / HY / RU)

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-hy` | Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ կեսօրին | Two OR windows |
| `avail-or-ru` | Хочу стрижку завтра вечером или в пятницу днём, у меня 50 долларов | Windows + `maxPrice`: 50 |
| `avail-or-translit-en` | Haircut vaghva yereko yan kam urbat kesorin | Rescue OR from translit (optional) |

#### G — Negative / rescue

| id | Example prompt | Correct routing |
|----|----------------|-----------------|
| `avail-not-single-timeofday-en` | (classifier sets one timeOfDay for whole prompt) | Rescue must split — never drop Friday afternoon |
| `avail-not-gift-card-en` | $50 gift card, haircut tomorrow or Friday | Gift card flow — not `maxPrice` |
| `avail-not-recommend-en` | Best specialist tomorrow or Friday for massage | `recommend_specialists` if "best rated" + provider focus; OR windows if availability ask |

#### H — Phase 2

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-specific-times-en` | Tomorrow at 6pm or Friday at 2pm | Per-window `timeSlot` instead of `timeOfDay` |
| `avail-or-with-provider-en` | Karo tomorrow evening or Mary Friday afternoon | Named providers per window |
| `avail-dashboard-parity-en` | (dashboard) same OR pattern for staff | Optional staff `check_availability` multi-window |

#### I — Time-of-day & relative date variants

| id | Example prompt | Expected windows |
|----|----------------|------------------|
| `avail-tonight-or-tomorrow-en` | Haircut tonight or tomorrow morning | `[{timeOfDay: evening, date: today}, {date: tomorrow, timeOfDay: morning}]` |
| `avail-this-weekend-or-en` | Massage Saturday afternoon or Sunday morning | Weekend OR windows |
| `avail-next-week-or-en` | Color next Tuesday or next Thursday evening | Relative week + OR |
| `avail-after-work-en` | Facial after 5 tomorrow or Friday | Per-window `timeFrom`: 17:00 |
| `avail-lunch-or-en` | Manicure tomorrow lunch or Friday lunch | `timeOfDay`: afternoon + narrow `timeFrom`/`timeTo` phase 2 |

#### J — Voice / mobile phrasing

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-voice-short-en` | Haircut tomorrow eve or fri afternoon | Abbreviated weekday |
| `avail-voice-asap-or-en` | Lashes ASAP or Saturday if not | `bookingFirstAvailable` + fallback window |
| `avail-voice-chip-en` | (chip: "Evening or weekend slots") | Consumer suggest chip → OR windows |
| `avail-imperative-en` | Need massage tomorrow PM or Sun AM | "Need" = check/book intent |

#### K — Session / multi-turn

| id | Turn flow | Expected behavior |
|----|-----------|-------------------|
| `avail-session-add-window-en` | T1: tomorrow evening / T2: or Friday afternoon works too | Append second window to session |
| `avail-session-drop-window-en` | T1: tomorrow or Friday / T2: Friday only | Replace with single window |
| `avail-session-after-budget-en` | T1: under $50 options / T2: tomorrow eve or Fri for those | Carry `maxPrice` + add windows |
| `avail-session-pick-slot-en` | T1: shows both windows / T2: book Friday 2pm one | Resolve slot from prior summary |

#### L — Provider preference + OR

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-any-provider-en` | Any stylist tomorrow evening or Friday afternoon | `allProviders`: true across windows |
| `avail-or-named-fallback-en` | Karo tomorrow or anyone Friday afternoon | Window A named provider; B fallback any |
| `avail-or-same-provider-en` | Same person tomorrow or Friday afternoon | Single `employeeName`; scan both windows |

#### M — No-slot / clarify outcomes

| id | Setup | Expected behavior |
|----|-------|-------------------|
| `avail-neither-window-en` | No slots in either window | Suggest nearest alternative day/time |
| `avail-partial-one-window-en` | Only window B has slots | Clear label which option worked |
| `avail-budget-blocks-all-en` | Budget ok but no slots both windows | Separate budget vs availability messaging |
| `avail-clarify-overlap-en` | Tomorrow is Friday, different timeOfDay | Merge day; show evening vs afternoon sections |

**Implementation order:** fixtures (**avail-1.10**, **1.12**) → window parse + rescue (**avail-1.1**, **1.3**) → classifier (**1.2**) → date-key resolver (**1.4**) → public check + timeOfDay filter (**1.5**) → nearest/book across windows (**1.6**) → budget intersection (**1.7**) → compounds (**1.8**) → eval + gate (**1.11**).

**Ship with Sprints 63–64 when possible:** shared gate **`npm run test:ai-service-discovery`** includes budget + rank + OR-window scenarios; canonical e2e case: **`avail-budget-or-en`**.

---

## Sprints 63–65 — Unified service discovery & flexible booking (cross-sprint)

**Program goal:** Customer can describe **what** they want (service type, budget, premium/value tier), **when** (single or OR windows), and **book** — in one message or two — on **public booking web** + **consumer app**, with deterministic handlers (not LLM prose-only).

**Coverage policy (mandatory per `feature-ai-prompt-coverage` + `feature-test-coverage`):**

| Requirement | Target |
|-------------|--------|
| Fixture `id`s per domain | Budget ≥40, Rank ≥35, Avail ≥45, Cross-sprint ≥25 |
| NL variants per applicable surface | ≥10 each for **public** + **customer** per domain |
| Locales | EN + ≥4 HY + ≥4 RU per domain (extend `ai-*-multilingual.fixtures.ts`) |
| Eval cases | Every fixture `id` → `eval/ai-command-eval.cases.ts` with `surface` tag |
| CI gate | **`npm run test:ai-service-discovery`** — union of budget + rank + avail unit + integration specs |

**Shared module (ship once):**

- [ ] **discover-1.1** — Extract **`ai-service-catalog-rank.util.ts`** — `filterServicesByMaxPrice`, `sortServicesByPriceAsc/Desc`, `pickRankedServices`, `resolveServiceDiscoveryParams()` (budget + rank intersection)
- [ ] **discover-1.2** — Extract **`ai-flexible-availability.util.ts`** — `parseAvailabilityWindowsFromPrompt`, `normalizeAvailabilityWindows`, `scanWindowsForSlots()`, `pickEarliestSlotAcrossWindows()`
- [ ] **discover-1.3** — Unified rescue pipeline: `enrichServiceDiscoveryFromPrompt()` (budget + rank) then `enrichAvailabilityWindowsFromPrompt()` — order documented in util spec
- [ ] **discover-1.4** — Consumer assistant example chips — "Under $50", "Premium services", "Evening or weekend slots" wired to fixture prompts
- [ ] **discover-1.5** — **`ai-service-discovery-multilingual.fixtures.ts`** — HY/RU/translit rows referencing budget/rank/avail `id`s
- [ ] **discover-1.6** — Integration spec **`ai-service-discovery.integration.spec.ts`** — end-to-end public assistant for cross-sprint canonical cases below

### ai-cmd-discover — Cross-sprint mega-prompt matrix

Full-stack prompts combining **Sprint 63 + 64 + 65**. Each row → fixture + integration test + eval case.

#### A — Budget + rank (what to book)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-cheapest-under-en` | Cheapest haircut under $50 | `lowest_price` + `maxPrice`: 50 → list |
| `discover-premium-under-en` | Best premium facial under $120 | `highest_price` + `maxPrice`: 120 |
| `discover-value-or-premium-en` | Affordable or premium massage — what fits $80? | List all ≤$80 sorted; note highest in range |
| `discover-no-premium-in-budget-en` | Premium haircut under $30 (none exist) | No premium in range; cheapest above budget hint |

#### B — Budget + availability (when, single window)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-budget-tomorrow-eve-en` | Haircut under $50 tomorrow evening | Filter services → check availability one window |
| `discover-budget-asap-en` | Anything under $40 ASAP | `maxPrice` + `bookingFirstAvailable` |
| `discover-budget-weekend-en` | Massage under $70 this Saturday afternoon | Budget + single weekend window |

#### C — Rank + availability (premium when)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-premium-tomorrow-en` | Book your most premium facial tomorrow nearest slot | Rank pick → book single day |
| `discover-cheapest-friday-en` | Cheapest manicure Friday afternoon if available | Rank pick → check Friday afternoon |

#### D — Triple intersection (budget + rank + OR windows) — flagship cases

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-flagship-en` | I want a haircut tomorrow evening or Friday afternoon, I have $50 | **Canonical** — budget filter → OR window scan → grouped results |
| `discover-flagship-book-en` | Book cheapest massage under $80 tomorrow or Thursday evening, soonest | Budget + lowest_price + OR + book nearest |
| `discover-flagship-premium-en` | Premium styling under $150 tomorrow or Saturday, whichever opens first | Highest in budget + OR + earliest slot |
| `discover-flagship-question-en` | Can I afford a deluxe facial tomorrow or Sunday under $100? | Affordability list + availability both windows |

#### E — Triple + provider

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-provider-budget-or-en` | Karo or anyone — haircut under $50 tomorrow eve or Fri PM | Provider fallback + budget + OR |
| `discover-best-provider-budget-en` | Best rated stylist for a cut under $60 this week | `recommend_specialists` + `maxPrice` on serviceIds |

#### F — Multi-turn full journey

| id | Turn flow | Expected pipeline |
|----|-----------|-------------------|
| `discover-journey-budget-list-book-en` | T1: what's under $50 for hair / T2: tomorrow evening or Friday / T3: book cheapest | list → avail → book |
| `discover-journey-premium-en` | T1: premium options / T2: too much — under $90? / T3: Saturday afternoon | rank → budget pivot → avail |
| `discover-journey-clarify-en` | T1: haircut $50 tomorrow or Friday / T2: (assistant: which service?) / T2 user: basic cut | Clarify service when multiple under budget |

#### G — Consumer vs public surface parity

| id | Surface | Example prompt | Same handler result |
|----|---------|----------------|----------------------|
| `discover-parity-budget-public` | public | Facials under €50? | Identical service list |
| `discover-parity-budget-customer` | customer | Facials under €50? | Identical service list |
| `discover-parity-or-public` | public | Massage tomorrow AM or Sat PM | Same window parse |
| `discover-parity-or-customer` | customer | Massage tomorrow AM or Sat PM | Same window parse |
| `discover-parity-voice-customer` | customer | (voice) Haircut fifty bucks tomorrow or Friday | ASR + mobile context |

#### H — Negative / must-not-break existing flows

| id | Example prompt | Must route to |
|----|----------------|---------------|
| `discover-not-gift-en` | $50 gift card, premium cut tomorrow | Gift card — not discovery pipeline |
| `discover-not-package-en` | Premium package under $200 | `discover_packages` |
| `discover-not-admin-en` | (dashboard) services under $50 | Admin `list_services` READ |
| `discover-not-multi-cart-en` | Two services under $100 total tomorrow | Phase 2 multi-service cart |
| `discover-not-currency-explain-en` | Why is premium $120 in dram? | `explain_checkout_currency` |

#### I — Multilingual cross-sprint (add to `discover-1.5`)

| id | Example prompt | Combines |
|----|----------------|----------|
| `discover-hy-budget-or-en` | Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ, 5000 դրամ ունեմ | budget + OR |
| `discover-ru-premium-en` | Люксовый массаж до 8000 рублей завтра вечером | rank + budget + single window |
| `discover-hy-cheapest-en` | Ամենաէժան մանիկյուր $30-ից ցածր | rank + budget |
| `discover-ru-or-book-en` | Стрижка завтра вечером или в субботу — забронируй | OR + book |

**Exit criteria (all three sprints):**

- [ ] **discover-exit-1** — ≥120 unique fixture `id`s across budget + rank + avail + cross-sprint; zero orphan prompts (every `id` in `it.each`)
- [ ] **discover-exit-2** — Public `handleCheckAvailability` applies `filterSlotsByTimeOfDay`; OR windows ship in **avail-1.5**
- [ ] **discover-exit-3** — **`npm run test:ai-service-discovery`** green in CI; eval harness includes ≥30 cross-sprint cases tagged `discover-*`
- [ ] **discover-exit-4** — Consumer assistant chips documented in `consumer-copy-catalog.ts` matching fixture prompts

---

## Sprint 33 — Ameria payment integration

**Goal:** Add Ameriabank (Armenia) as a payment gateway option alongside Stripe; admin enables it in settings; public booking checkout routes to Ameria when Stripe is disabled or Ameria is selected.

- [ ] **pay-ameria-1** — Ameria payment gateway integration

### pay-ameria-1.1 — Admin settings
- [ ] **pay-ameria-1.1** — `Settings → Payments`: **Ameria** section — enable toggle, `clientId`, `username`, `password` (encrypted at rest, same pattern as WhatsApp token encryption); test connection button; warning if both Stripe and Ameria disabled
- [ ] **pay-ameria-1.2** — Gateway priority — admin sets preferred gateway (Stripe / Ameria / both with customer choice); stored in `business.settings.paymentGateways`
- [ ] **pay-ameria-1.3** — Public API — expose `availablePaymentGateways[]` on `/public/{slug}/profile` so checkout knows which options to render

### pay-ameria-1.2 — Backend integration
- [ ] **pay-ameria-1.4** — `AmeriaPaymentService` — initiate payment (`POST` to Ameria API → get `paymentId` + redirect URL), verify payment (`GET` payment status by `paymentId`), refund (`POST` refund)
- [ ] **pay-ameria-1.5** — Ameria checkout flow — `POST /public/{slug}/bookings/checkout/ameria` → create pending booking → call Ameria initiate → return redirect URL; customer redirected to Ameria hosted page
- [ ] **pay-ameria-1.6** — Callback handler — `GET /public/{slug}/payments/ameria/callback?paymentId=&orderId=` — verify status with Ameria API; on success: confirm booking + mark paid; on failure: cancel pending booking + return error
- [ ] **pay-ameria-1.7** — Idempotency — store `ameriaPaymentId` on booking; prevent duplicate confirmation on callback retry
- [ ] **pay-ameria-1.8** — Refund — extend booking cancel flow: if `paymentGateway: ameria` and paid, call Ameria refund API; same cancel UX as Stripe path

### pay-ameria-1.3 — Checkout UX
- [ ] **pay-ameria-1.9** — Payment method selector — when both Stripe and Ameria enabled: show **"Pay by card (Visa/MC)"** (Stripe) vs **"Pay via Ameriabank"** (Ameria) at checkout; when only Ameria: skip selector, go direct
- [ ] **pay-ameria-1.10** — Consumer app — same gateway selector; Ameria flow opens in-app browser (`capacitor-browser`) → return deep link after payment
- [ ] **pay-ameria-1.11** — Ameria return page — `/book/{slug}/payments/ameria/return` — shows success or failure; on success redirect to booking confirmation; on failure show retry option

### pay-ameria-1.4 — Subscriptions & gift cards
- [ ] **pay-ameria-1.12** — Subscription purchase via Ameria — single-charge flow (no recurring; Ameria does not support subscriptions natively); treat as one-time payment for plan price
- [ ] **pay-ameria-1.13** — Gift card purchase via Ameria — same single-charge redirect flow as booking checkout

### pay-ameria-1.5 — Reporting & reconciliation
- [ ] **pay-ameria-1.14** — Booking + payment records — store `paymentGateway: 'ameria'`, `ameriaPaymentId`, `ameriaOrderId` on payment metadata
- [ ] **pay-ameria-1.15** — Accounting export — Ameria payments included in QuickBooks / Xero / CSV export with gateway column
- [ ] **pay-ameria-1.16** — Dashboard payments list — show gateway badge (Stripe / Ameria / Cash) per transaction

---

## Sprint 35 — Additional payment gateways (PayPal, Tap Payments, Payme, Wise)

**Goal:** Expand payment options to cover more countries and use cases; each gateway is opt-in per business; existing Stripe + Ameria flows unaffected.

- [ ] **pay-ext-1** — Additional payment gateway integrations

### pay-ext-1.1 — Shared gateway abstraction
- [ ] **pay-ext-1.1** — Extract `PaymentGatewayAdapter` interface — `initiatePayment`, `verifyPayment`, `refund`, `getRedirectUrl`; Stripe, Ameria, and all new gateways implement this interface; `PaymentGatewayRouter` selects adapter from `business.settings.paymentGateways`
- [ ] **pay-ext-1.2** — Gateway selector UI — `Settings → Payments`: enable/disable each gateway independently; credentials per gateway stored encrypted; test connection per gateway; warning if no gateway enabled

### pay-ext-1.2 — PayPal
- [ ] **pay-ext-1.3** — Admin settings — `clientId`, `clientSecret`; sandbox vs live toggle; supported currencies
- [ ] **pay-ext-1.4** — Backend — PayPal Orders API v2: create order → redirect to PayPal → capture on return; `PayPalPaymentAdapter` implementing shared interface
- [ ] **pay-ext-1.5** — Callback / return — `GET /public/{slug}/payments/paypal/return` — capture + confirm booking; cancel URL returns to checkout with error
- [ ] **pay-ext-1.6** — Refund — PayPal refund API on booking cancel; partial refund support (deposit scenario)
- [ ] **pay-ext-1.7** — Consumer app — opens PayPal in `capacitor-browser`; deep link return after payment

### pay-ext-1.3 — Tap Payments (MENA region)
- [ ] **pay-ext-1.8** — Admin settings — `secretKey`, `publishableKey`; supported currencies (AED, SAR, KWD, BHD, QAR, OMR, EGP, etc.)
- [ ] **pay-ext-1.9** — Backend — Tap Charges API: create charge → hosted payment page redirect; `TapPaymentAdapter`
- [ ] **pay-ext-1.10** — Callback — `POST /public/{slug}/payments/tap/webhook` — verify HMAC signature; confirm booking on `CAPTURED`; cancel on `DECLINED`
- [ ] **pay-ext-1.11** — Refund — Tap refund API on cancel

### pay-ext-1.4 — Payme (Uzbekistan / Central Asia)
- [ ] **pay-ext-1.12** — Admin settings — `merchantId`, `secretKey`; UZS currency support
- [ ] **pay-ext-1.13** — Backend — Payme JSONRPC API: `CreateTransaction` → `PerformTransaction` → `CheckTransaction`; `PaymePaymentAdapter`
- [ ] **pay-ext-1.14** — Webhook — `POST /public/{slug}/payments/payme/webhook` — handle `PerformTransaction` confirmation; update booking payment status
- [ ] **pay-ext-1.15** — Refund — `CancelTransaction` on booking cancel within allowed window

### pay-ext-1.5 — Wise (international bank transfer / payouts)
- [ ] **pay-ext-1.16** — Use case: **staff payouts only** (not customer checkout) — Wise is a payout/transfer tool, not a checkout gateway
- [ ] **pay-ext-1.17** — Admin settings — Wise API token, profile ID; target currencies for payouts
- [ ] **pay-ext-1.18** — Payout flow — from Payroll / Commissions dashboard: "Pay via Wise" button per staff member; create Wise transfer for calculated payout amount; store `wiseTransferId` on payout record
- [ ] **pay-ext-1.19** — Status sync — poll or webhook: `transfer.state_changed` → update payout status (outgoing_payment_sent / funds_converted / bounced_back)
- [ ] **pay-ext-1.20** — Dashboard — payout history shows Wise transfer ID + status + estimated delivery

### pay-ext-1.6 — Checkout UX (all gateways)
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

### acc-2.2 — Coverage parity & adversarial cases
- [ ] **acc-2.4** — **Locale parity** — every EN golden case has HY + RU equivalents (translate + transliterate variants, incl. Armenian/Russian mixed-script and Latin transliteration)
- [ ] **acc-2.5** — **Typo / fuzzy corpus** — auto-generate misspelled, abbreviated, lowercase, no-punctuation variants of top prompts
- [ ] **acc-2.6** — **Ambiguity corpus** — prompts that *should* trigger clarify (missing date, ambiguous provider name, two services match) with expected clarify field, not an execution

---

## Sprint 40 — AI accuracy: classification engine

**Goal:** Make the core classify step dramatically more accurate via few-shot retrieval, self-verification, and layered fallback — measured against the **acc-2** eval set every step.

- [ ] **acc-3** — Classification accuracy engine

### acc-3.1 — Retrieval-augmented classification
- [ ] **acc-3.2** — **Per-business phrasing memory** — learn each business's recurring phrasings (build on entity memory ai-i2): "the usual", staff nicknames, service shorthand → bias classification
- [ ] **acc-3.3** — **Dynamic intent shortlist** — pre-filter the ~270-intent registry to the most plausible 10–15 for the prompt before the LLM call (cheaper + more accurate than offering all intents)

### acc-3.2 — Self-verification & consensus
- [ ] **acc-3.4** — **Self-check pass** — after classify, a cheap second LLM/rule pass verifies "does action + params actually satisfy this prompt?"; on mismatch → lower confidence → clarify
- [ ] **acc-3.5** — **Disagreement → escalate model** — when deterministic router and LLM classify disagree on a mutating intent, run a stronger model (e.g. escalate to a higher-tier model) as tie-breaker before acting
- [ ] **acc-3.6** — **Field-level confidence** — structured output returns confidence per param (action, date, provider, service); low-confidence *fields* (not whole command) drive targeted clarify (**acc-4**)

### acc-3.3 — Robustness (typos, mixed language, long tail)
- [ ] **acc-3.7** — **Normalization upgrade** — extend `AiPromptNormalizationService`: spell-correction, abbreviation expansion, number/date word normalization, mixed-script splitting before classify
- [ ] **acc-3.8** — **Rescue rule expansion** — convert top recurring `suspected_miss` patterns from telemetry into deterministic rescues (no LLM cost), regression-tested in eval
- [ ] **acc-3.9** — **Multi-intent precision** — improve compound detection so "do X and Y" reliably decomposes; reduce false-compound on single-intent prompts (measured on ambiguity corpus)
- [ ] **acc-3.10** — **A/B prompt harness** — test system-prompt / few-shot variants against the eval set; promote the variant with best accuracy (ties into ai-e5 A/B infra)

### acc-3.4 — Semantic intent matching (replace brittle regex heuristics)

**Problem:** Context/paraphrase failures — when a user phrases a request with different words that convey the same meaning (e.g. "whoever has a gap soonest" vs "first available"), the deterministic rescue layer (`ai-intent-heuristics.ts`, `ai-intent-rescue.service.ts`) misses it because every phrasing must be anticipated by a hardcoded regex. Today this is handled by literal keyword/pattern heuristics; the better approach is matching by *meaning* instead.

- [ ] **acc-3.11** — **Embedding-based intent matcher** — new `AiSemanticIntentService`: embed the incoming prompt and cosine-match against a curated bank of canonical phrasings per intent (seeded from `ai-command-eval.cases.ts`); above a confidence threshold, resolve the intent without a regex match — runs as a rescue tier *before* falling back to `unknown` (reuse `AiRagService` index)
- [ ] **acc-3.12** — **Canonical phrasing bank** — per-intent example utterances (EN/HY/RU) stored + embedded once (reuse `AiRagService` + `AiPromptNormalizationService`); eval pipeline can add new paraphrases without code changes
- [ ] **acc-3.13** — **Per-business paraphrase learning** — feed confirmed corrections and recurring phrasings into the matcher via `AiEntityMemoryService` (build on **acc-3.2**) so a business's own shorthand resolves on the first try
- [ ] **acc-3.14** — **Heuristic → semantic migration** — incrementally replace the most paraphrase-sensitive regex resolvers (`isFirstAvailableBookingPrompt`, `isTeamWideProviderAvailabilityQuery`, metric resolvers in `ai-intent-heuristics.ts`) with semantic matches; keep regex only for structured extraction (dates, times, numbers), not for intent meaning
- [ ] **acc-3.15** — **Confidence + clarify fallback** — low semantic-match confidence routes to smart clarification (**acc-4**) instead of a wrong guess; wrong-execution guardrail stays < 1%
- [ ] **acc-3.16** — **Eval coverage** — paraphrase corpus in `ai-command-eval.cases.ts`: each intent gets 5+ lexically-distinct equivalents (EN/HY/RU); CI asserts the semantic matcher resolves them (extends `npm run test:ai-accuracy` / **acc-2.8**)

---

## Sprint 41 — AI accuracy: smart clarification & disambiguation

**Goal:** When uncertain, ask the **right** question instead of guessing wrong. A perfect clarify counts as an accurate outcome.

- [ ] **acc-4** — Smart clarification & disambiguation

### acc-4.1 — Targeted slot-filling
- [ ] **acc-4.1** — **Ask only what's missing** — drive clarify from field-level confidence (**acc-3.6**) + completion validator; never re-ask known fields; render as form (extends ai-d4)
- [ ] **acc-4.2** — **Top-2 intent disambiguation** — when two intents are close, show a 2-choice chip ("Did you mean *cancel booking* or *reschedule booking*?") instead of a generic "rephrase"
- [ ] **acc-4.3** — **Entity disambiguation** — ambiguous person/service ("book with Anna" but 2 Annas; "massage" matches 3 services) → show specific options, not free-text re-ask

### acc-4.2 — Context carry & memory
- [ ] **acc-4.4** — **Answer reuse** — clarification answers persist for the session and feed entity memory (ai-i2) so the same question is never asked twice
- [ ] **acc-4.5** — **Cross-turn slot merge** — merge clarify answers into the original intent without losing earlier params (extends session merge stage)
- [ ] **acc-4.6** — **Proactive confirm on high-risk** — for bulk/destructive intents, always preview + confirm with a plain-language summary ("This cancels 12 bookings and notifies 12 customers — proceed?")

### acc-4.3 — Honest failure
- [ ] **acc-4.7** — **"I'm not sure" over wrong action** — when confidence stays low after one clarify, return an honest "I didn't fully understand — here's what I can do" with 2–3 suggested valid commands, rather than executing a guess
- [ ] **acc-4.8** — **Clarify quality metric** — track clarify→success-on-next-turn rate (target >90%); bad clarifies (led to abandon) feed back into **acc-2** labeling

---

## Sprint 42 — AI accuracy: execution verification & rollback

**Goal:** Correct intent ≠ correct result. Verify parameter resolution and execution, and auto-rollback when the result doesn't match the request.

- [ ] **acc-5** — Execution verification & rollback

### acc-5.1 — Pre-execution correctness
- [ ] **acc-5.1** — **Resolution accuracy guard** — verify fuzzy-resolved entities (name→employeeId, service text→serviceId, date phrase→ISO) cleared a confidence threshold; ambiguous resolution → clarify, never silently pick
- [ ] **acc-5.2** — **Plan-vs-prompt check** — before executing a workflow plan, a verification pass confirms the plan's steps actually match the user's prompt (catches "right intent, wrong scope")
- [ ] **acc-5.3** — **Preview diff for mutations** — show the calendar/catalog diff before commit on medium-risk ops (extends ai-d9 plan diff), not just high-risk

### acc-5.2 — Post-execution verification
- [ ] **acc-5.4** — **Post-exec assertion** — after execution, assert the world matches intent (e.g. booking exists at requested time with requested provider); mismatch → auto-flag + offer rollback
- [ ] **acc-5.5** — **Auto-rollback on assertion failure** — reuse undo/workflow execution log (ai-d7 / gap-3.7) to revert when post-exec assertion fails; surface clear error to user
- [ ] **acc-5.6** — **Idempotency + conflict re-validation** — re-check schedule conflicts and duplicates at execute time (not just classify time); reject stale plans rather than double-book

### acc-5.3 — Safety rails
- [ ] **acc-5.7** — **Blast-radius cap** — hard limits on a single AI command (max N bookings cancelled, max N providers, max date range); over cap → force explicit confirm or split
- [ ] **acc-5.8** — **Dry-run mode for new intents** — newly added intents ship in "propose-only" until they hit an accuracy bar on real traffic, then graduate to auto-execute (ties to ai-e5 thresholds)

---

## Sprint 43 — AI accuracy: continuous learning loop & escalation

**Goal:** Close the loop so the system keeps improving toward 99% automatically, and the last 1% escalates gracefully to a human instead of acting wrongly.

- [ ] **acc-6** — Continuous learning loop & escalation

### acc-6.1 — Learning loop
- [ ] **acc-6.1** — **Weekly accuracy review job** — auto-compile: new failures, regressions, top confused intents, locales below target → posted to an internal review (email / dashboard)
- [ ] **acc-6.2** — **Failure → eval → fix pipeline** — every triaged failure becomes (a) a new eval case (**acc-2**) and (b) either a rescue rule (**acc-3.8**), a few-shot example (**acc-3.1**), or a prompt fix — tracked to closure
- [ ] **acc-6.3** — **Auto-alias suggestions** — recurring entity corrections become suggested aliases for admin one-click approval into entity memory (ai-i2)
- [ ] **acc-6.4** — **Accuracy ratchet** — each release raises the CI accuracy floor (**acc-2.9**) toward 99%; dashboard tracks progress on the accuracy ladder

### acc-6.2 — Graceful escalation (the last 1%)
- [ ] **acc-6.5** — **Human handoff on repeated failure** — after 2 failed clarifies on the same task, offer "Get help" → routes to staff/owner (dashboard) or support ticket (customer, reuses Zendesk gap-4.2); ties to human-in-the-loop SLA (ai-e7)
- [ ] **acc-6.6** — **Suggested-action fallback** — when classification truly fails, show the closest valid commands as one-tap chips so the user still completes the task
- [ ] **acc-6.7** — **Escalation analytics** — track escalation rate as the inverse of accuracy; target < 1% of prompts escalate; review escalations weekly for new eval cases

### acc-6.3 — Program exit criteria
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

### adopt-1.1 — Client event SDK (both apps + web)
- [ ] **adopt-1.1** — Lightweight `analytics` client in consumer + provider apps (extend the existing `product-recommendation-analytics.ts` pattern): typed `track(event, props)` → batched `POST /events/app`; events: `app_installed`, `app_opened`, `signed_in`, `viewed_salon`, `started_booking`, `completed_booking`, `rebooked`, `referral_sent`. Consent-gated (GDPR **compliance-1**) — no PII, businessId + anonymous deviceId only
- [ ] **adopt-1.2** — Session + device context — platform (iOS/Android/web), app version, locale, tenant slug, cold vs warm start, first-open vs returning; attach to every event
- [ ] **adopt-1.3** — Backend `app_event` sink — table + ingest endpoint (reuse event-store / `ai_command_trace` migration pattern); indexes on `(businessId, event, createdAt)`, `(platform)`, `(anonId)`; redact + rate-limit

### adopt-1.2 — Funnel & cohort metrics
- [ ] **adopt-1.4** — Funnel builder — install→open→sign-in→first-booking→repeat conversion per step; drop-off attribution per platform/locale/tenant
- [ ] **adopt-1.5** — Retention cohorts — D1/D7/D30 return rate; "booked again within 30/60/90 days"; resurrection (win-back) cohort
- [ ] **adopt-1.6** — Activation definition — "activated user" = installed + signed in + ≥1 completed in-app booking within 7 days; track activation rate as the north-star sub-metric
- [ ] **adopt-1.7** — Adoption dashboard — extend backend `analytics` module + a dashboard page (mirror the AI-ops accuracy dashboard): funnel, cohorts, push opt-in rate, crash-free %, referral K-factor; alert when weekly activation drops > 2 pts

---

## Sprint 45 — Apps adoption: acquisition & install funnel

**Goal:** Turn intent into installs that attribute correctly, and make the web→app handoff seamless so customers land in the right salon on the first try.

- [ ] **adopt-2** — Acquisition & install funnel

### adopt-2.1 — Store presence (ASO)
- [ ] **adopt-2.1** — App Store / Play Store optimization — localized titles, keywords, screenshots, preview video per locale (EN/HY/RU); build on listings (**gap-1.5**, **gap-2.5.10**)
- [ ] **adopt-2.2** — Ratings & reviews flow — in-app prompt at peak-happiness (after a completed booking); route happy → store review, unhappy → support (Zendesk **gap-4.2**); never prompt mid-task

### adopt-2.2 — Web → app handoff & attribution
- [ ] **adopt-2.3** — Smart app banner on public booking web — "Open in app" / "Get the app" carrying a deferred deep link to the same salon + service
- [ ] **adopt-2.4** — Deferred deep links + install attribution — capture intended salon/service before install, restore on first open (extend consumer `deep-link.ts`); attribute install source (QR / link / referral / ad)
- [ ] **adopt-2.5** — QR at venue / on receipts & confirmations — per-tenant QR → install or open app pre-scoped to that salon
- [ ] **adopt-2.6** — Universal Links + Android App Links verification — https links open the app directly (no chooser), graceful web fallback

### adopt-2.3 — Multi-tenant discovery
- [ ] **adopt-2.7** — Recent / saved salons home (extend `recent-salons.ts`) — one-tap return to previously-booked salons
- [ ] **adopt-2.8** — Low-friction tenant switch — remembered tenants list, switch without re-login (build on `customer-auth.ts` + `tenant-locale.ts`)

---

## Sprint 46 — Apps adoption: activation & onboarding

**Goal:** Get a new install to its first completed booking in the fewest taps; remove sign-in friction; earn the push opt-in.

- [ ] **adopt-3** — Activation & onboarding

### adopt-3.1 — Frictionless sign-in
- [ ] **adopt-3.1** — One-tap social / passwordless — Apple + Google sign-in parity on both apps (build on Firebase auth + `google-auth.ts`); phone-OTP fallback; **guest → account merge** so a guest booking is never lost on sign-up
- [ ] **adopt-3.2** — Prefill & autofill — name/email/phone autofill, SMS-OTP autofill, saved payment where available; minimize keyboard entry

### adopt-3.2 — First-run value
- [ ] **adopt-3.3** — First-run value screen — skip generic carousels; land on the intended salon (from deep link) or recent salons; show "book in 3 taps"
- [ ] **adopt-3.4** — Time-to-first-booking guided flow — Welcome→Salon→Service→Slot→Confirm with nearest-available pre-selected and a progress indicator
- [ ] **adopt-3.5** — Push opt-in priming — soft pre-prompt explaining value (reminders, "your slot is confirmed") before the OS dialog; ask only after the first booking; track opt-in rate (target ≥ 80%)

### adopt-3.3 — Activation instrumentation
- [ ] **adopt-3.6** — Wire activation events into the funnel (**adopt-1**); A/B onboarding variants; abandonment recovery — resume an unfinished booking on next open

---

## Sprint 47 — Apps adoption: retention & re-engagement

**Goal:** Bring customers back. The consumer app currently has **no push** — add the full consumer push lifecycle, plus lifecycle campaigns and home-screen presence.

- [ ] **adopt-4** — Retention & re-engagement

### adopt-4.1 — Consumer push (new — consumer app lacks push today)
- [ ] **adopt-4.2** — Transactional push — booking confirmed, reminder (24h / 2h), rescheduled/cancelled, result-ready (clinic), gift-card received; deep-link into the right screen (extend `deep-link.ts`)
- [ ] **adopt-4.3** — Push deep-link + foreground handling parity with the provider app (`provider-push-deep-link.util.ts`, `provider-push-foreground.util.ts`)

### adopt-4.2 — Lifecycle campaigns
- [ ] **adopt-4.4** — Rebooking nudges — "time for your next appointment" based on service cadence; build on the marketing-automation module
- [ ] **adopt-4.5** — Win-back — lapsed-customer campaign (no booking in N days) with optional incentive (loyalty / promo)
- [ ] **adopt-4.6** — Loyalty + offers surfacing — show points/rewards and active promos in-app (loyalty + promo-codes modules) to create a reason to return

### adopt-4.3 — Home-screen presence
- [ ] **adopt-4.7** — Home-screen widgets — next appointment + quick rebook (iOS WidgetKit / Android App Widget)

- [ ] **adopt-5.6** — Accessibility & localization QA — VoiceOver/TalkBack, dynamic type, RTL-safe, full EN/HY/RU coverage on every adoption surface

---

## Sprint 49 — Apps adoption: growth loops, habit & exit criteria

**Goal:** Make adoption compound through referrals and habit, add AI command coverage for the new surfaces, and lock the program's exit gate.

- [ ] **adopt-6** — Growth loops, habit & exit criteria

### adopt-6.1 — Referral & sharing
- [ ] **adopt-6.3** — Review solicitation loop — post-visit review prompt feeding tenant reputation; route to store review at peak-happiness (ties **adopt-2.2**)

### adopt-6.4 — Program exit criteria
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

### n99-1.1 — Make the answer un-missable (tap, don't type)
- [ ] **n99-1.1** — Structured clarify controls — render every clarify as the right input, not free text: date picker, provider chips, service chips, time-slot list (extend clarify-as-form `ai-command-wizard.tsx`, ai-d4); a tap resolves deterministically
- [ ] **n99-1.2** — Pre-resolved option sets — for entity ambiguity (2 Annas, 3 "massage" services) show the concrete catalog candidates, never a "type the name again" re-ask (**acc-4.3**)

- [ ] **n99-1.6** — Localized + voice/typo-tolerant answers — parse EN/HY/RU and voice-to-text answers ("tomrw", "2pm", "Աննա" all resolve); extend normalization **acc-3.7**


## Sprint 51 — Near-99%: no-clarify completion rate

**Lever thesis:** the best clarify is the one you didn't need — resolve correctly *without asking* by inferring high-confidence defaults, while **never** raising wrong-execution.

- [ ] **n99-2** — No-clarify completion → near 99%

### n99-2.1 — Infer instead of ask (confidence-gated)
- [ ] **n99-2.1** — High-confidence auto-fill — when a missing param is strongly inferable (last provider, "the usual" service, business default duration, current-screen context), fill it and proceed instead of clarifying; gated by field confidence (**acc-3.6**) and risk tier
- [ ] **n99-2.2** — Screen/context grounding — pass the current app context (the booking/customer/service on screen) into the command so "book this", "cancel it", "remind her" resolve without asking

---

## Sprint 52 — Near-99%: install → activation

**Lever thesis:** an install that arrived *to book a specific salon* should almost always reach a completed first booking — by restoring intent and removing every step between open and confirm.

**Reality / denominator:** 99% is meaningful on **intent-qualified installs** (deferred deep link carrying a target salon/service, **adopt-2.4**). Cold / ad / curiosity installs get a separate, lower bar — don't average them into this number.

- [ ] **n99-3** — Install → activation (intent-qualified, ≤ 7d) → near 99%

### n99-3.1 — Restore intent, kill steps
- [ ] **n99-3.1** — Deferred deep-link resume — after install, land directly on the intended salon→service→slot→**confirm** (extend `deep-link.ts` + **adopt-2.4**); no re-navigation, no re-search
- [ ] **n99-3.2** — One-tap sign-in + guest→account merge — Apple/Google one-tap (**adopt-3.1**); a guest can complete the booking and the account merges after, so sign-in is never a wall before activation
- [ ] **n99-3.3** — Pre-filled, payment-optional booking — slot pre-selected; pay-at-venue / pay-later fallback so a payment hiccup never blocks the first booking (activation ≠ payment)

### n99-3.2 — Recover the stragglers
- [ ] **n99-3.4** — Abandonment resume — reopen an unfinished booking exactly where it was left on next app open (**adopt-3.6**)
- [ ] **n99-3.5** — Activation concierge nudges — if not activated within 24h / 72h, a single well-timed push/email with a one-tap resume link (consumer push **adopt-4.1** + marketing-automation module)
- [ ] **n99-3.6** — Dead-end audit — instrument every step of the qualified-install funnel (**adopt-1.4**); any step with > 1% drop gets a fix ticket

### parity-2.1 — Gap closure by module

**Inventory source:** **`ai-cmd-ext`** action tables + `ai-capability.matrix.ts` vs dashboard UI routes — close every gap in **parity-2.1**–**2.3** before **parity-4** CI gate.
- [ ] **parity-2.1** — **Owner / manager dashboard gaps** — add intents for every uncovered owner/manager dashboard action (settings, integrations, billing, staff ops, reports, marketing, loyalty) with handlers, registry bindings, `tiers`, `surfaces`, and `mutating` / `executionMode` flags
- [ ] **parity-2.2** — **Staff / provider gaps** — add uncovered provider-app + staff-scoped dashboard actions (own schedule, assigned bookings, check-in, notes, breaks), honoring `STAFF_SCOPED_INTENTS` so staff only act within their own scope
- [ ] **parity-2.3** — **Customer / public gaps** — add uncovered self-service + public actions (manage/reschedule/cancel own bookings, profile, payment methods, packages/subscriptions, loyalty, notification preferences, gift cards)

### parity-2.2 — Quality bar per intent (per `feature-ai-prompt-coverage`)
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

- [ ] **prov-exp** — Provider app expansion (Sprints 59–62)

## Sprint 62 — Waitlist, growth visibility & polish

### prov-exp-8 — Waitlist & recovery
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

## Reference — early MVP build order (historical)

1. comms-1 — Email reminders  
2. comms-2 — SMS reminders  
3. pay-1 — Stripe prepay at booking (optional in dashboard settings)  
4. analytics-1 — Dashboard KPIs  
5. crm-1 + crm-2 — Customer history + no-shows  

<!-- - [ ] **polish-2** — Help center / in-app docs + support contact flow (Zendesk Help Center embed optional) -->

- [ ] **10. Budget-aware service discovery** — assistant filters catalog by user budget (`maxPrice`); public + consumer AI; scenario matrix **Sprint 63** / **ai-cmd-budget**; gate `npm run test:ai-budget`
- [ ] **11. Premium / best service discovery** — assistant ranks catalog by premium/top-tier/highest price (and cheapest); disambiguate service vs specialist; **Sprint 64** / **ai-cmd-rank**; shared util with #10; gate `npm run test:ai-service-discovery`
- [ ] **12. Flexible OR availability + budget compounds** — multi-window scheduling (tomorrow evening or Friday afternoon) + optional `maxPrice`; public `filterSlotsByTimeOfDay` parity; **Sprint 65** / **ai-cmd-avail**; canonical prompt in scenario **`avail-budget-or-en`**
- [ ] **13. Unified service discovery program** — cross-sprint budget + rank + OR availability; shared utils **`discover-1`**, mega-prompt matrix **`ai-cmd-discover`**, ≥120 fixture ids, gate **`npm run test:ai-service-discovery`**, consumer assistant chips (**discover-1.4**)