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
| **63** | Budget-aware service discovery | **budget-1**, **ai-cmd-budget** |
| **64** | Premium / best service discovery | **rank-1**, **ai-cmd-rank** |
| **65** | Flexible OR availability + budget compounds | **avail-1**, **ai-cmd-avail** |
| **—** | Unified service discovery (budget + rank + OR avail) | **discover-1**, **ai-cmd-discover** |
| **—** | Extend dashboard `AiCommandService` actions (orchestrator + registry parity) | **ai-cmd-ext** |
| **—** | Customer AI commands — public booking web + consumer mobile | **ai-cmd-customer** |

---

## ai-cmd-ext — Extend `AiCommandService` actions (plan)

**Goal:** Grow dashboard AI command coverage safely — every new product action gets a registry entry, classifier rule, handler (inline or delegated), rescue path, fixtures, and eval case — without letting `ai-command.service.ts` become an unmaintainable god-object.

**Baseline (today):**

| Metric | Value | Source |
|--------|-------|--------|
| Dashboard intents in registry | **234** (138 mutating) | `DASHBOARD_INTENTS` in `ai-command-registry.build.ts` |
| `executeSingleIntent` switch cases | **~337** (multi-surface + aliases) | `ai-command.service.ts` |
| LEGACY_CORE intents owned by `AiCommandService` | **~51 mutate + ~19 read** | `LEGACY_CORE_BINDINGS` in registry build |
| `INTENT_SCHEMA` action union | **234** (from `DASHBOARD_INTENTS`) | `ai-command-intent-schema.build.ts` → `INTENT_SCHEMA` in `ai-command.service.ts` |
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

> **Audit (2026-06):** not met globally for all **234** dashboard registry intents — see **ai-cmd-ext-gap** below. Public/customer discovery (Sprints **63–65**) meets the spirit of this checklist; dashboard **`ai-cmd-ext-1`** param rows and **`ai-cmd-ext-2`** new verbs do not.

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
| **ai-cmd-ext-gap-2** | `INTENT_SCHEMA` union + classifier rules | **Union synced** — **234** actions from `DASHBOARD_INTENTS` via **`ai-command-intent-schema.build.ts`**; appendix rules still separate per domain | Per-intent classifier rules for appendix-only gaps — **parity-2.4** |
| **ai-cmd-ext-gap-3** | `executeSingleIntent` case or delegation | **`ai-cmd-ext-0.2` shipped**; **`ai-cmd-ext-0.3` shipped** — registry-aware default branch in `executeSingleIntent` | — |
| **ai-cmd-ext-gap-4** | Handler + validator + entity params | **Shipped** — **`ai-cmd-ext-2.1`–`2.12`** registry + handlers + fixtures (`ai-staff-operations`, `ai-waitlist-dashboard`, `ai-clinic-test-result-ext`, billing/loyalty reads) | Extend validator/entity registry per new intent as needed |
| **ai-cmd-ext-gap-5** | Rescue + ≥10 NL fixtures | Done for major domains (booking, clinic, payments, discover); **not every registry id** | **parity-2.4** per new intent; extend domain `*.fixtures.ts` |
| **ai-cmd-ext-gap-6** | Eval golden cases | **`test:ai-accuracy`** — **2738/2738** deterministic cases (100%); baseline ratchet **acc-2.9** | **acc-2.4**–**2.6**, **parity-2.4** |

- [ ] **ai-cmd-ext-gap-7** — Mark per-action DoD checklist `[x]` only when **ai-cmd-ext-gap-1**–**6** are green for that table row (or row is explicitly out of scope with surface tag)

---

### ai-cmd-ext-0 — Orchestrator hygiene (do first)

> Blocks closing **ai-cmd-ext-gap-2**, **ai-cmd-ext-gap-3**. See audit table under **ai-cmd-ext-gap**.

| Task ID | Work | Why |
|---------|------|-----|
| **ai-cmd-ext-0.1** | Regenerate `INTENT_SCHEMA` action union from `DASHBOARD_INTENTS` (+ shared dashboard/provider reads) | Classifier cannot emit actions missing from the union — **shipped** (`ai-command-intent-schema.build.ts` + **`ai-command-handler-coverage.spec.ts`**) |
| **ai-cmd-ext-0.2** | Handler coverage gate — test fails when any `DASHBOARD_INTENTS` id lacks a `switch` case **or** a registry `handler !== 'AiCommandService'` with working dispatch on that service | Closes registry ↔ execution drift — **shipped** (`npm run test:ai-cmd-ext`) |
| **ai-cmd-ext-0.3** | Replace generic `default` summary with registry lookup ("action X is registered but handler Y is not wired") | Better telemetry + faster triage — **shipped** (`ai-command-unwired-intent.util.ts`) |
| **ai-cmd-ext-0.4** | Extract LEGACY_CORE inline methods → `AiDashboardCoreService` (booking, cancel, show, analytics, schedule mutate) — `AiCommandService` keeps classify + compound + dispatch only | Target orchestrator **< 5k LOC** |
| **ai-cmd-ext-0.5** | Optional: registry-driven dispatch table (`Map<intent, handlerFn>`) built at module init | Removes 300+ `case` branches over time |

---

### ai-cmd-ext-1 — Extend existing dashboard handlers (params, not new verbs)

These ship through **`AiCommandService`** by extending existing `handleListServices`, `handleCheckAvailability`, `handleCreateBooking`, etc.

| Task ID | Action(s) | Change type | Handler | Sprint | Depends on |
|---------|-----------|-------------|---------|--------|------------|
| **ai-cmd-ext-1.1** | `list_services` | Add param `maxPrice` | `handleListServices` | **63** / **budget-1.9** | **budget-1.1**–**1.4** |
| **ai-cmd-ext-1.2** | `list_services` | Add param `serviceRank` (`highest_price` \| `lowest_price` \| `most_popular`) | `handleListServices` | **64** / **rank-1.4** | **rank-1.1**–**1.3** |
| **ai-cmd-ext-1.3** ✅ | `check_availability` | Add param `availabilityWindows[]` + per-window `timeOfDay` | `handleCheckAvailability` | **65** / **avail-1.5** | **avail-1.1**–**1.4** — **shipped** (`ai-dashboard-availability-windows.logic.ts`) |
| **ai-cmd-ext-1.4** ✅ | `create_booking` | Budget/rank pre-filter + `bookingFirstAvailable` across OR windows | `handleCreateBooking` + compound utils | **65** / **avail-1.6**–**1.8** | **discover-1.1**–**1.3** — **shipped** (`ai-dashboard-create-booking.logic.ts`) |
| **ai-cmd-ext-1.5** ✅ | `lookup_service_assignment` | Optional `maxPrice` / `serviceRank` on team-wide "who can do X" | `handleLookupServiceAssignment` | **63**–**64** | **budget-1.1**, **rank-1.1** — **shipped** (`ai-dashboard-lookup-assignment.logic.ts`) |
| **ai-cmd-ext-1.6** ✅ | `summarize_bookings` | Revenue KPIs with tenant currency formatting | `handleSummarizeBookings` | **28** / **curr-1** | **shipped** (`ai-dashboard-summarize-bookings.logic.ts`) |

**Note:** `recommend_specialists`, `book_appointment`, `check_providers_for_service` extend on **public/customer** surfaces (`PublicBookingAssistantService`, `CustomerAiCommandService`) — track under **ai-cmd-budget** / **ai-cmd-rank** / **ai-cmd-avail**, not this file.

---

### ai-cmd-ext-2 — New dashboard actions (add `case` + delegate)

| Task ID | Action | R/W | Delegate handler | Sprint | Surfaces | Product link |
|---------|--------|-----|------------------|--------|----------|--------------|
| **ai-cmd-ext-2.1** ✅ | `upload_patient_result` | M | `AiClinicTestResultService` | **54** | dashboard | **ai-cmd-clinic-6** — **shipped** |
| **ai-cmd-ext-2.2** ✅ | `explain_patient_results` | R | `AiClinicTestResultService` | **54** | dashboard | **ai-cmd-clinic-6** — **shipped** |
| **ai-cmd-ext-2.3** ✅ | `configure_test_reference_range` | M | `AiClinicTestResultService` | **54** | dashboard | **vert-clinic-2.1.6** — **shipped** (guides to catalog UI) |
| **ai-cmd-ext-2.4** ✅ | `list_abnormal_results` | R | `AiClinicTestResultService` | **54** | dashboard | **vert-clinic-2.1.6** — **shipped** |
| **ai-cmd-ext-2.5** ✅ | `create_employee` | M | `AiOperationsService` | **55** / **parity-2.1** | dashboard | staff onboarding — **shipped** |
| **ai-cmd-ext-2.6** ✅ | `invite_staff_member` | M | `AiOperationsService` | **55** / **parity-2.1** | dashboard | team invite flow — **shipped** |
| **ai-cmd-ext-2.7** ✅ | `deactivate_employee` | M | `AiOperationsService` | **55** / **parity-2.1** | dashboard | staff lifecycle — **shipped** |
| **ai-cmd-ext-2.8** ✅ | `configure_online_booking` | M | `AiOperationsService` | **55** / **parity-2.1** | dashboard | public page settings — **shipped** |
| **ai-cmd-ext-2.9** ✅ | `open_billing_settings` | R | `AiMarketingGrowthService` | **55** / **parity-2.1** | dashboard | deep-link + explain plan — **shipped** |
| **ai-cmd-ext-2.10** ✅ | `summarize_loyalty_program` | R | `AiMarketingGrowthService` | **55** / **parity-2.1** | dashboard | loyalty module — **shipped** |
| **ai-cmd-ext-2.11** ✅ | `list_waitlist_entries` | R | `AiCommandService` | **62** / **prov-exp-8** | dashboard | waitlist panel — **shipped** (`ai-waitlist-dashboard.logic.ts`) |
| **ai-cmd-ext-2.12** ✅ | `offer_waitlist_slot` | M | `AiCommandService` | **62** / **prov-exp-8** | dashboard | manager offers gap — **shipped** |

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
| **ai-cmd-ext-4.1** ✅ | `onboard_new_provider` | `create_employee` → `assign_employee_services` → `onboard_provider_schedule` → `configure_online_booking` | **57** / **parity-3.2** | `decomposeProviderOnboardingCompoundPrompt` — stylist, therapist, barber, nail tech, etc. |
| **ai-cmd-ext-4.2** ✅ | `clinic_lab_day_close` | `list_test_orders` → `enter_test_result` → `release_test_result` → `notify_patient_result_ready` | **54** / **vert-clinic-2** | `decomposeClinicLabDayCloseCompoundPrompt` |
| **ai-cmd-ext-4.3** ✅ | `budget_discover_and_book` | filter catalog → `check_providers_for_service` → `create_booking` | **63**–**65** / **discover-1** | `decomposeBudgetDiscoverAndBookCompoundPrompt` |
| **ai-cmd-ext-4.4** ✅ | `rank_discover_and_book` | `list_services` (serviceRank) → `check_providers_for_service` → `create_booking` | **64**–**65** / **discover-1** | `decomposeRankDiscoverAndBookCompoundPrompt` |

Register each in `buildCompoundCommandRecipes()` + eval `compoundSteps` / `compoundStepParams`.

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

> **Audit (2026-06):** discovery (**ai-cmd-customer-1.1**–**1.8**) meets per-row DoD for spine + integration; **gap-5** acc-2.4 per deferred customer-only row remains — see **ai-cmd-customer-gap** below.

- [ ] Classifier rules in `*.fixtures.ts` wired into **both** `buildPublicClassifierSchema()` and `buildCustomerClassifierSchema()` when the action is public-assistant scoped (or customer-only appendix when not)
- [ ] Post-LLM rescue + `enrich*FromPrompt` on **both** entry paths (`PublicBookingAssistantService.chat()` rescue chain + `CustomerAiCommandService.rescueIntent()`)
- [ ] Handler logic in the correct service (see routing table) — **never** duplicate in consumer-app or public-booking frontend
- [ ] Session carry: `maxPrice`, `serviceRank`, `availabilityWindows`, booking context in `mergeSessionContext` (public) + `mergeCustomerCompoundContext` (customer)
- [ ] ≥10 NL variants per surface in fixtures; eval cases tagged `surface: public` **and** `surface: customer` (EN/HY/RU)
- [ ] Integration spec: `public-booking-assistant.*.spec.ts` + `customer-ai-command.integration.spec.ts`
- [x] Gate script covers both surfaces (e.g. **`npm run test:ai-budget`**, **`test:ai-service-discovery`**, **`test:ai-cmd-ext`**)

### ai-cmd-customer-gap — Audit gaps (customer per-row DoD)

| Gap ID | DoD criterion | Current state | Close with |
|--------|---------------|---------------|------------|
| **ai-cmd-customer-gap-1** | Classifier rules both schemas | **`ai-customer-public-parity.spec.ts`** — gate in **`npm run test:ai-cmd-ext`** | — **shipped** |
| **ai-cmd-customer-gap-2** | Rescue + enrich both paths | Discovery rescue/enrich on public + customer; customer-only domains rescue on customer path only — **documented in `CUSTOMER_PUBLIC_RESCUE_ROUTING`** | — **shipped** (matrix doc) |
| **ai-cmd-customer-gap-3** | Handler in correct service | **OK** — `PublicBookingAssistantService` + `runPublicAssistant()` delegation; no frontend handler dup | Keep regression in domain integration specs |
| **ai-cmd-customer-gap-4** | Session carry | **`serviceRank`** + OR windows in `SHARED_BOOKING_CONTEXT_KEYS`, `public-booking-assistant-session.util.ts`, compound merge | — **shipped** (2026-06) |
| **ai-cmd-customer-gap-5** | ≥10 NL variants + eval EN/HY/RU | Discovery + deferred slices — **`ai-customer-deferred-locale-parity.spec.ts`** (210 EN/HY/RU eval rows); provider push (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 (+24 HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+4 HY/RU); provider team whos next (+4 HY/RU); provider time-off list (+6 HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in **`ai-provider-*-locale-parity.spec.ts`** | **acc-2.4** remaining EN golden rows outside deferred/provider slices |
| **ai-cmd-customer-gap-6** | Integration specs both surfaces | Public handler tests in domain specs + **`public-booking-assistant.budget.integration.spec.ts`** (**3.3**) + **`customer-ai-command.integration.spec.ts`** (**3.4**) | — **shipped** |
| **ai-cmd-customer-gap-7** | Gate both surfaces | **`test:ai-service-discovery`** (1049 tests) + **`test:ai-cmd-ext`** | — **shipped** |

**Spine task status (audit):**

| Task | Status | Gap |
|------|--------|-----|
| **ai-cmd-customer-0.2** | Shipped | **`serviceRank`** in `SHARED_BOOKING_CONTEXT_KEYS` |
| **ai-cmd-customer-0.3** | Shipped | `public-booking-assistant-session.util.ts` + `attachSession` discovery fields |
| **ai-cmd-customer-0.4** | Shipped | `tryExecutePublicCompound` + `executePublicAssistantCompoundFromSteps` in `PublicBookingAssistantService.chat()` |
| **ai-cmd-customer-0.5** | Shipped | `ai-customer-public-parity.spec.ts` — **`npm run test:ai-cmd-ext`** |

**Tests task status (audit):**

| Task | Status | Notes |
|------|--------|-------|
| **ai-cmd-customer-3.1** | Shipped | Fixture `surface` tags in budget/rank/avail/discover fixtures |
| **ai-cmd-customer-3.5** | Shipped | `public-booking-assistant.schema.spec.ts`, `customer-ai-command.util.spec.ts` |
| **ai-cmd-customer-3.6** | Shipped | **`npm run test:ai-service-discovery`** green + CI workflow |
| **ai-cmd-customer-3.3** | Shipped | **`public-booking-assistant.budget.integration.spec.ts`** — wiring + handler pipeline |
| **ai-cmd-customer-3.4** | Shipped | Discovery block in `customer-ai-command.integration.spec.ts` — **`npm run test:ai-cmd-ext`** |

- [ ] **ai-cmd-customer-gap-8** — Mark customer DoD checklist `[x]` only when **ai-cmd-customer-gap-1**–**7** are green for that feature row (customer-only rows exempt from public-schema bullets)

---

### ai-cmd-customer-0 — Shared spine (public + mobile)

| Task ID | Work | Files | Blocks |
|---------|------|-------|--------|
| **ai-cmd-customer-0.1** | Document public-assistant action set vs customer-only intents (`PUBLIC_ONLY_ASSISTANT_ACTIONS` vs `CUSTOMER_INTENTS`) in capability matrix | `customer-ai-command.util.ts`, `ai-capability.matrix.ts` | **parity-1** — **shipped** |
| **ai-cmd-customer-0.2** | Add **`maxPrice`**, **`serviceRank`**, **`availabilityWindows`** to shared compound context keys | `ai-compound-booking-context.util.ts` (`SHARED_BOOKING_CONTEXT_KEYS`) | **budget-1.7**, **avail-1.8** — **shipped** |
| **ai-cmd-customer-0.3** | Persist budget/rank/avail params in public `sessionContext` + customer compound merge | `public-booking-assistant-session.util.ts`, `mergeCustomerCompoundContext` | multi-turn prompts — **shipped** |
| **ai-cmd-customer-0.4** | Public compound **execution** — execute decomposed steps before single-intent switch (mirror customer `tryCompound`) | `PublicBookingAssistantService.chat()` `tryExecutePublicCompound` | **budget-1.7**, **avail-1.8** — **shipped** |
| **ai-cmd-customer-0.5** | Parity gate — test fails when a public-assistant action is wired in public schema but missing from customer schema rules (and vice versa for shared actions) | `ai-customer-public-parity.spec.ts` | **parity-4** — **shipped** (`test:ai-cmd-ext`) |

---

### ai-cmd-customer-1 — Public-assistant actions (wire once → both surfaces)

Handler target: **`PublicBookingAssistantService`** (consumer mobile delegates via `runPublicAssistant()`).

| Task ID | Action(s) | Feature sprint | Public schema | Customer schema | Handler / util | Existing task refs |
|---------|-----------|----------------|---------------|-----------------|----------------|-------------------|
| **ai-cmd-customer-1.1** | `list_services` + **`maxPrice`** | **63** | `buildPublicClassifierSchema()` | `buildCustomerClassifierSchema()` | `handleListServices` + `ai-service-catalog-rank.util.ts` | **budget-1.2**–**1.4**, **1.6** |
| **ai-cmd-customer-1.2** | `recommend_specialists` + **`maxPrice`** | **63** | both schemas | both | `handleRecommendSpecialists` — budget-filter `serviceIds` before `recommendProviders` | **budget-1.5** |
| **ai-cmd-customer-1.3** | `list_services` + **`serviceRank`** | **64** | both | both | `handleListServices` — rank sort / single pick | **rank-1.2**–**1.6** |
| **ai-cmd-customer-1.4** | `check_availability` + **`availabilityWindows`** + optional **`maxPrice`** | **65** | both | both | `handleCheckAvailability` — per-window loop + budget intersection | **avail-1.2**–**1.7** |
| **ai-cmd-customer-1.5** | `book_appointment` + budget/rank pre-filter + **`bookingFirstAvailable`** | **63**–**65** | both | both | `handleBookAppointment` — pick service under budget before nearest slot | **budget-1.7**, **rank-1.7** |
| **ai-cmd-customer-1.6** | Check-then-book compounds | **63**–**65** | golden `public_*` patterns + **ai-cmd-customer-0.4** executor | golden `customer_*` + existing compound runner | public: `check_availability` → `book_appointment`; customer: `check_providers_for_service` → `book_nearest_slot` | **ai-cmd-h1**, **budget-1.7**, **avail-1.8** |
| **ai-cmd-customer-1.7** | Mobile check-and-book + budget | **63** | n/a (customer path) | rescue + compound | `handleCheckProvidersForServiceLogic` / `handleBookNearestSlotLogic` — respect `maxPrice` when resolving service | **budget-1.7** |
| **ai-cmd-customer-1.8** | Unified discovery mega-prompts | **discover-1** | both | both | shared `ai-service-catalog-rank.util.ts` + `ai-flexible-availability.util.ts` | **discover-1.1**–**1.6** |
| **ai-cmd-customer-1.9** | Negative routing (no budget filter) | **63** | both | both | rescue: gift card → payments; package → `discover_packages`; deposit → checkout explain | **budget-1.8** |
| **ai-cmd-customer-1.10** | Navigate hints after budget list | **63** | both | both | single match → `navigate: { path: 'services', query: { serviceId } }` | **budget-1.6** |
| **ai-cmd-customer-1.11** | Existing catalog/booking (baseline — keep green) | shipped | both | both | `list_providers`, `business_info`, `booking_help`, checkout/currency/tour/clinic explain paths | regression in `test:sprint14` |

---

### ai-cmd-customer-2 — Customer-only actions (consumer mobile + logged-in web)

Handler target: **`customer-ai-command.logic.ts`** → domain `Ai*Service` (not `PublicBookingAssistantService`).

| Task ID | Domain | Example actions | Classifier | Integration spec | Notes |
|---------|--------|-----------------|------------|------------------|-------|
| **ai-cmd-customer-2.1** | Self-service booking | `cancel_my_booking`, `reschedule_my_booking`, `list_my_appointments`, `book_package`, cart/checkout | `buildCustomerClassifierSchema()` | `customer-ai-command.integration.spec.ts` | Already shipped — extend when new checkout fields |
| **ai-cmd-customer-2.2** | Payments & gift cards | `book_with_gift_card`, `check_gift_card_balance`, `buy_gift_card`, … | customer schema + `rescuePaymentsIntent` | `ai-gift-card-payments.integration.spec.ts` | Must stay disjoint from **`maxPrice`** (**budget-1.8**) |
| **ai-cmd-customer-2.3** | Subscriptions & packages | `discover_packages`, `my_subscriptions`, `select_subscription_plan` | customer schema | package integration specs | Package budget ≠ service **`maxPrice`** |
| **ai-cmd-customer-2.4** | Clinic consumer | `list_my_test_results`, `book_lab_collection`, … | customer + public clinic appendices | `ai-clinic-lab-booking.integration.spec.ts` | Public clinic prompts overlap — keep surface tags |
| **ai-cmd-customer-2.5** | Adoption & growth | `how_to_download_app`, `switch_to_consumer_app`, deep-link resume | `CONSUMER_ADOPTION_CLASSIFIER_RULES` | `ai-consumer-adoption.*` | **adopt-2**–**adopt-4** |
| **ai-cmd-customer-2.6** | Parity audit | Shipped native intents (`CUSTOMER_INTENT_COVERAGE_REQUIRED`) have fixtures + customer eval — **`ai-customer-intent-coverage.util.ts`**, **`ai-customer-intent-coverage.spec.ts`**, **`ai-capability.matrix.integration.spec.ts`**; deferred rows in **`CUSTOMER_INTENT_COVERAGE_DEFERRED`** | — **shipped** (2026-06); feeds **parity-2.3** |

---

### ai-cmd-customer-3 — Tests & CI (both surfaces)

| Task ID | Work | Gate |
|---------|------|------|
| **ai-cmd-customer-3.1** | Fixtures **`ai-budget-service-discovery.fixtures.ts`** — tag each row `surface: public \| customer \| both` | **budget-1.10**, **1.12** — **shipped** |
| **ai-cmd-customer-3.2** | Shipped (discovery + shipped native audit) | EN + HY/RU multilingual eval duplicated for **public** and **customer** — **`ai-customer-public-eval-parity.spec.ts`**; **`ai-customer-intent-coverage.spec.ts`** gates **`CUSTOMER_INTENT_COVERAGE_REQUIRED`** via **`AI_COMMAND_EVAL_DETERMINISTIC_CASES`** |
| **ai-cmd-customer-3.3** | Shipped | **`public-booking-assistant.budget.integration.spec.ts`** — wiring + handler pipeline |
| **ai-cmd-customer-3.4** | Shipped | Discovery block in `customer-ai-command.integration.spec.ts` — **`npm run test:ai-cmd-ext`** |
| **ai-cmd-customer-3.5** | Schema specs — assert `maxPrice` / rules present in **both** `buildPublicClassifierSchema()` and `buildCustomerClassifierSchema()` | `public-booking-assistant.schema.spec.ts`, `customer-ai-command.util.spec.ts` — **shipped** |
| **ai-cmd-customer-3.6** | Merge gate **`npm run test:ai-service-discovery`** — budget + rank + avail + discover cross-sprint cases on public + customer | **discover-1.6** — **shipped** (CI: `ai-service-discovery-gate.yml`) |

---

### ai-cmd-customer — Implementation order

| Phase | Task IDs | Unlocks |
|-------|----------|---------|
| **0 — Spine** | **ai-cmd-customer-0.1**–**0.5** | Session carry, public compounds, parity gate |
| **1 — Budget (Sprint 63)** | **1.1**, **1.2**, **1.5**, **1.7**, **1.9**, **1.10** + **budget-1.2**–**1.3** | *"I have $50 for a haircut"* on web + app |
| **2 — Rank (Sprint 64)** | **1.3** + **rank-1.*** | Premium / cheapest service discovery |
| **3 — Avail (Sprint 65)** | **1.4**, **1.6** + **avail-1.*** | OR windows + budget compounds |
| **4 — Discover** | **1.8** + **discover-1.*** | Mega-prompt matrix + unified util |
| **5 — Customer-only audit** | **2.6** + **3.2** | Full mobile account coverage |

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

- [x] **ai-cmd-clinic-6** — Dashboard: **`upload_patient_result`** / **`explain_patient_results`** / **`configure_test_reference_range`** / **`list_abnormal_results`** — ext-2.1–2.4 shipped (`ai-clinic-test-result-ext.*`, rescue + eval); file-upload path guides to lab UI; value entry remains **`enter_test_result`** / **`release_test_result`** (**ai-cmd-clinic-v2-2**)

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

**Customer surface plan (public web + consumer mobile — shared handlers):** see **ai-cmd-customer-1** in the **ai-cmd-customer** section.

**Price semantics:** Compare against catalog **display price** (`service.price` in tenant default currency). Tax/deposit is checkout-only — assistant copy should say "from $X" when tax display is enabled (**tax-1**). Do not confuse with gift-card balance (**ai-payments**).

### budget-1 — Product & handler spine (planned)

- [x] **budget-1.1** — Shared util `filterServicesByMaxPrice(services, maxPrice)` + `sortServicesByPriceAsc`; unit spec for edge cases (null price, equal prices, empty catalog)
- [x] **budget-1.2** — Classifier param **`maxPrice`** (number) on public + customer schemas; wire **`BUDGET_SERVICE_DISCOVERY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [x] **budget-1.3** — Post-LLM rescue: `enrichBudgetFromPrompt()` reuses `extractAmountFromPrompt()` + "under/below/at most/no more than X" patterns; set `maxPrice` when classifier missed it
- [x] **budget-1.4** — **`handleListServices`** — after name/category filter, apply `maxPrice`; summary lists only matches sorted by price; **no-match** copy: cheapest option above budget + next-cheapest alternatives
- [x] **budget-1.5** — **`handleRecommendSpecialists`** — restrict `serviceIds` to budget-filtered services before `recommendProviders`; if none, same no-match copy as list
- [x] **budget-1.6** — Navigate hint — when exactly one match, `navigate: { path: 'services', query: { serviceId } }`; when multiple, services tab without pre-select
- [x] **budget-1.7** — Compound decomposition — budget + book nearest / check availability (mirror **ai-cmd-h1** check-and-book): e.g. *"book a haircut under $50 tomorrow ASAP"* → filter → `book_appointment` with `bookingFirstAvailable`
- [x] **budget-1.8** — Disambiguation — **`maxPrice` ≠ gift card** ("I have a $50 gift card" → promo/gift-card flow, not budget filter); **`maxPrice` ≠ package total** (route `discover_packages` only when user says package/bundle/deal)
- [x] **budget-1.9** — Optional dashboard READ — extend admin `list_services` handler with same filter when `maxPrice` present (lower priority than customer surfaces)
- [x] **budget-1.10** — Fixtures **`ai-budget-service-discovery.fixtures.ts`** — classifier rules + `SIMILAR_BUDGET_SERVICE_PROMPTS` (all scenario `id`s below); `it.each` in `*.util.spec.ts` + integration specs per surface
- [x] **budget-1.11** — Eval cases in `eval/ai-command-eval.cases.ts` tagged `surface: public | customer` (+ dashboard if shipped); gate **`npm run test:ai-budget`**
- [x] **budget-1.12** — Extended fixtures — sections **I–L** below (voice, session, currency, duration); ≥ **40** fixture `id`s total for budget domain

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
| `budget-voice-asr-en` | I have 50 dollars for her cut | [x] ASR homophone "her cut" → haircut, maxPrice: 50 |
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
| `budget-range-en` | Haircut between $40 and $60 | [x] `minPrice`: 40 + `maxPrice`: 60 inclusive band on list_services |
| `budget-round-number-en` | About 50 dollars for styling | `maxPrice`: 50; "about" = ceiling |
| `budget-tenant-amd-en` | (tenant currency AMD) under 15000 dram | Symbol-less amount + tenant default |
| `budget-zero-en` | Free consultation options? | `maxPrice`: 0 or route free-price services only |
| `budget-large-en` | Nothing over 500000 dram | Large integer parsing |

#### K — Provider / named service + budget

| id | Example prompt | Expected params |
|----|----------------|-----------------|
| `budget-named-service-en` | Is Swedish massage under $90? | [x] `serviceName`: Swedish massage, `maxPrice`: 90 |
| `budget-any-provider-en` | Any stylist for a cut under $45? | [x] `allProviders`: true, `maxPrice`: 45 — list_services not recommend_specialists |
| `budget-provider-no-match-en` | Karo — anything under $30? | [x] employeeName=Karo, maxPrice=30; empty catalog + closest-options hint |

#### L — Duration + budget (phase 2 hook)

| id | Example prompt | Notes |
|----|----------------|-------|
| `budget-short-service-en` | Quick haircut under $40 | [x] preferShortDuration=true; shortest duration first within maxPrice=40 |
| `budget-long-massage-en` | 90-minute massage under $100 | [x] minDurationMinutes=90 + maxPrice=100; honest no-match when all 90m exceed ceiling |

**Implementation order:** fixtures (**budget-1.10**, **1.12**) → util + rescue (**budget-1.1**, **1.3**) → classifier wiring (**1.2**) → list/recommend handlers (**1.4–1.6**) → compounds (**1.7**) → disambiguation (**1.8**) → eval + gate (**1.11**).

---

## Sprint 64 — Premium / best service discovery

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
| Most **popular** service (customer) | `list_services` + `serviceRank: most_popular` | Rolling 90-day booking count on public catalog API |
| Most popular service (owner) | `analyze_services` | Existing dashboard handler |

**Rank semantics:** Default tie-breakers: price desc/asc → longer duration → name A–Z. "Premium" / "luxury" / "deluxe" / "top-tier" → `serviceRank: highest_price` within `serviceCategory`. Optional phase 2: admin **`isFeatured`** / **`serviceTier`** on service entity overrides price heuristic when set.

### rank-1 — Product & handler spine (planned)

- [x] **rank-1.1** — Shared util `sortServicesByPriceDesc` / `sortServicesByPriceAsc` (reuse from **budget-1.1**); `pickRankedServices(catalog, { serviceRank, serviceCategory, limit })` — returns top N; unit spec for ties and empty catalog
- [x] **rank-1.2** — Classifier param **`serviceRank`**: `highest_price` \| `lowest_price` \| `most_popular` \| null on public + customer schemas; wire **`SERVICE_RANK_DISCOVERY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [x] **rank-1.3** — Post-LLM rescue: `enrichServiceRankFromPrompt()` — map premium/luxury/deluxe/top-tier/most expensive/priciest → `highest_price`; cheapest/lowest/affordable → `lowest_price`; most popular/best-selling → `most_popular` (when phase 2 ready)
- [x] **rank-1.4** — **`handleListServices`** — after category filter, apply `serviceRank`; when `limit: 1` (default for "the best/premium service"), summary highlights single top match + price/duration; when user asks "show all premium options", return top 3–5 ranked
- [x] **rank-1.5** — **`recommend_specialists` guard** — when prompt asks for best/**service** (not specialist/stylist/therapist), rescue to `list_services` + `serviceRank` before provider recommendation
- [x] **rank-1.6** — Navigate hint — single top match → `navigate: { path: 'services', query: { serviceId } }`
- [x] **rank-1.7** — Compound decomposition — e.g. *"book your most premium facial tomorrow nearest slot"* → rank pick → `book_appointment` with resolved `serviceName`
- [x] **rank-1.8** — Phase 2 catalog metadata — optional `service.isFeatured` or `serviceTier: standard | premium` on dashboard service editor; rank util prefers featured/tier over raw price
- [x] **rank-1.9** — Phase 2 **`most_popular`** — public catalog endpoint exposes rolling 90d booking count per service (or reuse dashboard aggregate read-only); rank by count desc within category
- [x] **rank-1.10** — Fixtures **`ai-service-rank-discovery.fixtures.ts`** — classifier rules + `SIMILAR_SERVICE_RANK_PROMPTS` (scenario `id`s below); share price-sort helpers with **budget-1** fixtures spec
- [x] **rank-1.11** — Eval cases in `eval/ai-command-eval.cases.ts` tagged `surface: public | customer`; gate **`npm run test:ai-rank`** (or merge with **`test:ai-budget`** as **`test:ai-service-discovery`**)
- [x] **rank-1.12** — Extended fixtures — sections **I–L** below; ≥ **35** fixture `id`s total for rank domain

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
| `rank-specialist-stays-en` | Who is the best rated lash specialist this week? | `recommend_specialists` | [x] providerRank; misroute rescue → rank_provider_specialists + serviceCategory=lash |
| `rank-best-service-explicit-en` | Best service in your spa menu for relaxation | `list_services` | "best service" keyword → catalog |
| `rank-best-for-me-en` | What's the best option for a first-time haircut? | `booking_help` | [x] subjectiveRank; no serviceRank; misroute rescue → rank_subjective_booking_help + serviceCategory=haircut |

#### D — Handler outcomes (fixture catalog assertions)

| id | Catalog setup | Expected behavior |
|----|---------------|-------------------|
| `rank-single-premium-tie-price` | 2 hair services @ $80, 1 @ $50 | Return $80 pair or both with tie-break (duration then name) |
| `rank-name-premium-fallback` | Services named "Premium Cut" ($45) and "Standard Cut" ($60) | Phase 1: rank by **price** ($60); Phase 2: `isFeatured` / name tier optional boost |
| `rank-one-in-category` | Only one massage in catalog | Return that service with "our massage option" copy |
| `rank-empty-category` | No facial services | [x] honest not-found + Available categories: haircut, massage |
| `rank-navigate-single` | One clear highest-price match | Navigate pre-select `serviceId` |

#### E — Compounds (multi-step)

| id | Example prompt | Steps |
|----|----------------|-------|
| `rank-book-premium-en` | Book your most premium facial tomorrow, nearest slot | `highest_price` pick → `book_appointment`, `bookingFirstAvailable`: true |
| `rank-list-then-book-en` | What's your best massage and book it Saturday | [x] rank compound list_services → book_appointment/book_nearest_slot; highest_price + massage + Saturday date |
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
| `rank-not-analyze-appt-en` | Most expensive appointment today | [x] dashboard analyze_appointments; blocks catalog rank; rescue rank_to_analyze_appointments |
| `rank-not-analyze-services-admin-en` | (dashboard) most booked service this month | [x] dashboard analyze_services; blocks catalog rank; rescue rank_to_analyze_services + serviceMetric=most_booked |
| `rank-not-package-en` | What's your premium spa package? | [x] discover_packages (customer) / booking_help (public); blocks catalog serviceRank; rescue discover_packages |
| `rank-rated-means-provider-en` | Best rated deep tissue massage | `recommend_specialists` — "rated" + no "service" noun |

#### H — Phase 2 (document now, ship later)

| id | Example prompt | Notes |
|----|----------------|-------|
| `rank-most-popular-en` | What's your most popular haircut? | [x] serviceRank=most_popular + serviceCategory=haircut; 90d booking count rank; rescue + eval + handler |
| `rank-featured-flag-en` | (catalog: `isFeatured` on mid-price service) | Featured wins over higher price |
| `rank-tier-metadata-en` | Premium tier services for color | [x] serviceTier=premium + serviceCategory=color; blocks serviceRank; tier filter handler + rescue rank_tier_filter |

#### I — Synonyms & marketing language

| id | Example prompt | Maps to |
|----|----------------|---------|
| `rank-vip-en` | VIP hair treatment options | `highest_price` in hair |
| `rank-signature-en` | What's your signature massage? | `highest_price` or featured (phase 2) |
| `rank-flagship-en` | Flagship facial service | `highest_price` |
| `rank-entry-level-en` | Entry-level manicure | `lowest_price` |
| `rank-budget-friendly-en` | Budget-friendly pedicure | `lowest_price` |
| `rank-mid-range-en` | Mid-range color service | [x] list_services serviceCategory=color limit=3 price-sorted; NO serviceRank; rescue rank_mid_range_list |

#### J — Voice / mobile + questions

| id | Example prompt | Notes |
|----|----------------|-------|
| `rank-voice-premium-en` | Premium cut? | [x] customer list_services highest_price + haircut; short voice limit=1 |
| `rank-voice-cheapest-en` | Cheapest facial you got | [x] customer list_services lowest_price + facial; colloquial "you got" |
| `rank-compare-en` | What's the difference between standard and premium haircut? | List top 2 by rank asc+desc or `booking_help` |
| `rank-recommend-not-provider-en` | Recommend your best spa service not a person | [x] list_services highest_price + spa; anti-provider rescue |

#### K — Session / multi-turn

| id | Turn flow | Expected behavior |
|----|-----------|-------------------|
| `rank-session-upgrade-en` | T1: cheapest haircut / T2: show premium instead | [x] lowest→highest rank switch; haircut category carry |
| `rank-session-then-budget-en` | T1: premium facial / T2: anything like that under $120? | [x] highest_price + facial carry; maxPrice=120 intersect |
| `rank-session-pick-one-en` | T1: top 3 premium massages / T2: book the second one | [x] rankedServiceIds session + ordinal pick → Relax massage |

#### L — Handler edge cases

| id | Catalog setup | Expected behavior |
|----|---------------|-------------------|
| `rank-all-same-price` | 4 massages all @ $70 | Tie-break duration then name; list all if user asked plural |
| `rank-inactive-excluded` | Highest price service inactive | [x] filterActiveCatalogServices; skip $150 inactive → massage-90 |
| `rank-zero-price` | Free consultation + paid consult | Free sorts `lowest_price`; premium excludes $0 unless asked |
| `rank-missing-price` | Service with null price | [x] Exclude from price rank; list copy uses "price on request" |

**Implementation order:** shared sort util with **budget-1.1** → fixtures (**rank-1.10**, **1.12**) → classifier + rescue (**rank-1.2**, **1.3**, **1.5**) → `handleListServices` rank (**1.4**, **1.6**) → compounds (**1.7**) → phase 2 metadata + popularity (**1.8**, **1.9**) → eval + gate (**rank-1.11**).

**Ship together with Sprint 63 when possible:** extract `ai-service-catalog-rank.util.ts` + single gate `npm run test:ai-service-discovery` covering budget + rank + intersection scenarios (`rank-premium-under-budget-en`).

---

## Sprint 65 — Flexible OR availability + budget compounds

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

- [x] **avail-1.1** — Shared util `parseAvailabilityWindowsFromPrompt()` + `normalizeAvailabilityWindows(params)` — detect "or", "either … or", comma-separated day+timeOfDay pairs; unit spec
- [x] **avail-1.2** — Classifier param **`availabilityWindows`** on public + customer schemas; wire **`FLEXIBLE_AVAILABILITY_CLASSIFIER_RULES`** into `buildPublicClassifierSchema()` + `buildCustomerClassifierSchema()`
- [x] **avail-1.3** — Post-LLM rescue: `enrichAvailabilityWindowsFromPrompt()` — split OR phrases; map tomorrow / weekday names + morning/afternoon/evening per clause
- [x] **avail-1.4** — **`resolvePublicAvailabilityDateKeys`** — accept per-window date keys (don't flatten OR into one `weekdays` list that loses timeOfDay pairing)
- [x] **avail-1.5** — **`handleCheckAvailability`** — loop windows; apply **`filterSlotsByTimeOfDay`** per window (parity with dashboard); merge day reports labeled by window (*Tomorrow evening*, *Friday afternoon*)
- [x] **avail-1.6** — **`findNearestBookableSlot`** / book path — try windows in order (or earliest-across-all); first bookable slot wins; handoff preserves chosen window in session
- [x] **avail-1.7** — **Budget intersection** — when `maxPrice` set, filter `matchedServices` before slot scan (**budget-1.4**); summary mentions price cap ("options under $50")
- [x] **avail-1.8** — Compound decomposition — *"I want a haircut tomorrow evening or Friday afternoon, I have $50"* → filter services → `check_availability` with windows; optional follow-up / auto `book_appointment` with `bookingFirstAvailable` on winning window
- [x] **avail-1.9** — Clarify path — when windows overlap (tomorrow **is** Friday) or budget excludes all services, honest clarify / merged single window
- [x] **avail-1.10** — Fixtures **`ai-flexible-availability.fixtures.ts`** — classifier rules + `SIMILAR_FLEXIBLE_AVAILABILITY_PROMPTS` (scenario `id`s below)
- [x] **avail-1.11** — Eval cases tagged `surface: public | customer`; extend gate **`npm run test:ai-service-discovery`** or add **`npm run test:ai-availability-flex`**
- [x] **avail-1.12** — Extended fixtures — sections **I–M** below; ≥ **45** fixture `id`s total for availability domain

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
| `avail-budget-under-or-en` | Massage under $80 tomorrow or Thursday evening | [x] `maxPrice`: 80, two OR windows |
| `avail-budget-no-match-or-en` | (all haircuts > $50) same prompt | [x] Soft fail: nothing under $50; closest options + budget clarify |
| `avail-budget-pick-service-first-en` | Two services under $50 — scan both for slots across windows | [x] Budget filter returns both services; OR window scan |

#### C — Single window (regression — must not break)

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-single-tomorrow-evening-en` | Who's free tomorrow evening for massage? | [x] Single window + **avail-1.5** timeOfDay filter on public |
| `avail-single-friday-afternoon-en` | Any slots Friday afternoon for a facial? | [x] `weekdays: [friday]`, `timeOfDay: afternoon`, `allProviders` |
| `avail-no-or-and-en` | Monday and Friday afternoon for color | **AND** two weekdays, **same** timeOfDay — not OR; expand date keys, single afternoon filter |

#### D — Handler outcomes

| id | Setup | Expected behavior |
|----|-------|-------------------|
| `avail-slots-window-a-only` | Slots only tomorrow evening | [x] Report window A; `No open slots` for window B |
| `avail-slots-window-b-only` | Slots only Friday afternoon | [x] Report window B; `No open slots` for window A |
| `avail-earliest-across-windows` | Both have slots | [x] `pickEarliest` + handler navigate pre-select earliest OR slot |
| `avail-overlap-tomorrow-is-friday` | Tomorrow is Friday | Merge/dedupe same calendar day; clarify if timeOfDay differs |
| `avail-public-timeofday-filter` | Afternoon window | Public handler applies `filterSlotsByTimeOfDay` — no morning slots in summary |

#### E — Compounds (multi-step)

| id | Example prompt | Steps |
|----|----------------|-------|
| `avail-check-then-book-or-en` | Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest | Budget filter → check both windows → book nearest |
| `avail-list-budget-then-or-en` | Show haircuts under $50, then check tomorrow evening or Friday | [x] Turn 1: `list_services` + `maxPrice`; Turn 2: availability with windows |
| `avail-rank-budget-or-en` | Best premium facial under $100 tomorrow or Saturday | [x] **rank-1** + **budget-1** + **avail-1** intersection |

#### F — Multilingual (EN / HY / RU)

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-hy` | Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ կեսօրին | [x] Two OR windows |
| `avail-or-ru` | Хочу стрижку завтра вечером или в пятницу днём, у меня 50 долларов | [x] Windows + `maxPrice`: 50 |
| `avail-or-translit-en` | Haircut vaghva yereko yan kam urbat kesorin | [x] Rescue OR from translit |

#### G — Negative / rescue

| id | Example prompt | Correct routing |
|----|----------------|-----------------|
| `avail-not-single-timeofday-en` | (classifier sets one timeOfDay for whole prompt) | Rescue must split — never drop Friday afternoon |
| `avail-not-gift-card-en` | $50 gift card, haircut tomorrow or Friday | [x] Gift card flow — not `maxPrice` or OR `availabilityWindows` |
| `avail-not-recommend-en` | Who is free tomorrow or Friday for massage? | [x] `check_availability` / `check_providers_for_service` with OR windows — not `recommend_specialists` |

#### H — Specific times & per-window providers

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-specific-times-en` | Tomorrow at 6pm or Friday at 2pm | [x] Per-window `timeSlot` instead of `timeOfDay` |
| `avail-or-with-provider-en` | Karo tomorrow evening or Mary Friday afternoon | [x] Named providers per window (`employeeName` on each OR entry) |
| `avail-dashboard-parity-en` | Who is free tomorrow evening or Friday afternoon for massage? | [x] Dashboard `check_providers_for_service` with OR `availabilityWindows` + `allProviders` (multi-window handler) |

#### I — Time-of-day & relative date variants

| id | Example prompt | Expected windows |
|----|----------------|------------------|
| `avail-tonight-or-tomorrow-en` | Haircut tonight or tomorrow morning | `[{timeOfDay: evening, date: today}, {date: tomorrow, timeOfDay: morning}]` |
| `avail-this-weekend-or-en` | Massage Saturday afternoon or Sunday morning | Weekend OR windows |
| `avail-next-week-or-en` | Color next Tuesday or next Thursday evening | Relative week + OR |
| `avail-after-work-en` | Facial after 5 tomorrow or Friday | [x] Per-window `timeFrom`: 17:00 (shared `after 5` applies to each OR clause) |
| `avail-lunch-or-en` | Manicure tomorrow lunch or Friday lunch | [x] `timeOfDay`: afternoon + narrow `timeFrom` 12:00 / `timeTo` 14:00 per window |

#### J — Voice / mobile phrasing

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-voice-short-en` | Haircut tomorrow eve or fri afternoon | Abbreviated weekday |
| `avail-voice-asap-or-en` | Lashes ASAP or Saturday if not | [x] `bookingFirstAvailable` + OR windows (`tomorrow` + Saturday afternoon fallback) |
| `avail-voice-chip-en` | (chip: "Evening or weekend slots") | [x] Consumer suggest chip → OR windows (`evening` + weekend weekdays) |
| `avail-imperative-en` | Need massage tomorrow PM or Sun AM | [x] "Need" + PM/AM shorthand → OR windows (`tomorrow` afternoon + Sunday morning) |

#### K — Session / multi-turn

| id | Turn flow | Expected behavior |
|----|-----------|-------------------|
| `avail-session-add-window-en` | T1: tomorrow evening / T2: or Friday afternoon works too | [x] Session append merges second OR window into `availabilityWindows[]` |
| `avail-session-drop-window-en` | T1: tomorrow or Friday / T2: Friday only | [x] Session drop replaces OR windows with single Friday afternoon window |
| `avail-session-after-budget-en` | T1: under $50 options / T2: tomorrow eve or Fri for those | [x] Session carries `maxPrice` + parses OR windows from budget follow-up |
| `avail-session-pick-slot-en` | T1: shows both windows / T2: book Friday 2pm one | Resolve slot from prior summary |

#### L — Provider preference + OR

| id | Example prompt | Notes |
|----|----------------|-------|
| `avail-or-any-provider-en` | Any stylist tomorrow evening or Friday afternoon | [x] `allProviders=true` + OR windows across team-wide scan |
| `avail-or-named-fallback-en` | Karo tomorrow or anyone Friday afternoon | [x] Window A `employeeName=Karo`; window B team-wide fallback (no top-level `allProviders`) |
| `avail-or-same-provider-en` | Same person tomorrow or Friday afternoon | [x] `sameProviderAcrossWindows=true`; reuse session `employeeName`; scan both windows |

#### M — No-slot / clarify outcomes

| id | Setup | Expected behavior |
|----|-------|-------------------|
| `avail-neither-window-en` | No slots in either window | [x] Grouped per-window no-slot labels; nearest alternative note when found |
| `avail-partial-one-window-en` | Only window B has slots | [x] Grouped OR sections label filled vs empty windows |
| `avail-budget-blocks-all-en` | Budget ok but no slots both windows | [x] Budget filter passes; per-window `availabilityWindowNoSlots` (not `budget_no_match`) |
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

- [x] **discover-1.1** — Extract **`ai-service-catalog-rank.util.ts`** — `filterServicesByMaxPrice`, `sortServicesByPriceAsc/Desc`, `pickRankedServices`, `resolveServiceDiscoveryParams()` (budget + rank intersection)
- [x] **discover-1.2** — Extract **`ai-flexible-availability.util.ts`** — `parseAvailabilityWindowsFromPrompt`, `normalizeAvailabilityWindows`, `scanWindowsForSlots()`, `pickEarliestSlotAcrossWindows()`
- [x] **discover-1.3** — Unified rescue pipeline: `enrichServiceDiscoveryFromPrompt()` (budget + rank) then `enrichAvailabilityWindowsFromPrompt()` — order documented in util spec
- [x] **discover-1.4** — Consumer assistant example chips — "Under $50", "Premium services", "Evening or weekend slots" wired to fixture prompts
- [x] **discover-1.5** — **`ai-service-discovery-multilingual.fixtures.ts`** — HY/RU/translit rows referencing budget/rank/avail `id`s
- [x] **discover-1.6** — Integration spec **`ai-service-discovery.integration.spec.ts`** — end-to-end public assistant for cross-sprint canonical cases below

### ai-cmd-discover — Cross-sprint mega-prompt matrix

Full-stack prompts combining **Sprint 63 + 64 + 65**. Each row → fixture + integration test + eval case.

#### A — Budget + rank (what to book)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-cheapest-under-en` | Cheapest haircut under $50 | `lowest_price` + `maxPrice`: 50 → list |
| `discover-premium-under-en` | Best premium facial under $120 | `highest_price` + `maxPrice`: 120 |
| `discover-value-or-premium-en` | Affordable or premium massage — what fits $80? | [x] List all ≤$80 sorted; `isValueOrPremiumBudgetListPrompt` blocks rank; highest-in-range note |
| `discover-no-premium-in-budget-en` | Premium haircut under $30 (none exist) | [x] `highest_price` + budget; `buildRankPremiumNoMatchInBudgetSummary` + closest above hint |

#### B — Budget + availability (when, single window)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-budget-tomorrow-eve-en` | Haircut under $50 tomorrow evening | Filter services → check availability one window |
| `discover-budget-asap-en` | Anything under $40 ASAP | [x] `maxPrice` + `bookingFirstAvailable` + ASAP `date`; `limit: 1` budget pick → `manicure-25`; `resolveDiscoverConstrainedService` in book handler |
| `discover-budget-weekend-en` | Massage under $70 this Saturday afternoon | [x] Budget filter → `massage-55`/`massage-65`; single Saturday afternoon window; `applyBudgetFilterForAvailabilityCheck` in check handler |

#### C — Rank + availability (premium when)

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-premium-tomorrow-en` | Book your most premium facial tomorrow nearest slot | [x] `highest_price` + category → `facial-120`; rank compound `list_services` → `book_appointment`; `resolveDiscoverConstrainedService` in book handler |
| `discover-cheapest-friday-en` | Cheapest manicure Friday afternoon if available | [x] `lowest_price` + category → `manicure-25`; single Friday afternoon window; rank pick in `handleCheckAvailability` |

#### D — Triple intersection (budget + rank + OR windows) — flagship cases

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-flagship-en` | I want a haircut tomorrow evening or Friday afternoon, I have $50 | **Canonical** — budget filter → OR window scan → grouped results |
| `discover-flagship-book-en` | Book cheapest massage under $80 tomorrow or Thursday evening, soonest | [x] Budget + `lowest_price` → `massage-55`; OR windows; flexible budget compound `check_availability` → `book_appointment`; `findNearestBookableSlotAcrossWindows` |
| `discover-flagship-premium-en` | Premium styling under $150 tomorrow or Saturday, whichever opens first | [x] Budget + `highest_price` → `style-140`; OR windows; flexible budget compound; earliest slot across windows |
| `discover-flagship-question-en` | Can I afford a deluxe facial tomorrow or Sunday under $100? | [x] `isAffordabilityListPrompt` blocks rank; budget list `facial-55`/`facial-95`; OR windows tomorrow + Sunday |

#### E — Triple + provider

| id | Example prompt | Expected pipeline |
|----|----------------|-------------------|
| `discover-provider-budget-or-en` | Karo or anyone — haircut under $50 tomorrow eve or Fri PM | [x] `stripLeadingProviderOrAnyoneBudgetLead`; Karo on window A only; budget filter `hair-35`/`hair-45`; OR tomorrow eve + Fri PM |
| `discover-best-provider-budget-en` | Best rated stylist for a cut under $60 this week | [x] `recommend_specialists` + `maxPrice: 60`; `for a cut` → `haircut`; budget filter `hair-35`/`hair-45`; no `serviceRank` |

#### F — Multi-turn full journey

| id | Turn flow | Expected pipeline |
|----|-----------|-------------------|
| `discover-journey-budget-list-book-en` | T1: what's under $50 for hair / T2: tomorrow evening or Friday / T3: book cheapest | [x] Session T1 list `hair-35`/`hair-45` → T2 OR windows + carried budget → T3 `lowest_price` pick `hair-35` |
| `discover-journey-premium-en` | T1: premium options / T2: too much — under $90? / T3: Saturday afternoon | [x] Session massage + `highest_price` → T2 `maxPrice: 90` (`massage-65`) → T3 Sat PM window |
| `discover-journey-clarify-en` | T1: haircut $50 tomorrow or Friday / T2: (assistant: which service?) / T2 user: basic cut | [x] Budget OR windows → T2 `basic cut` resolves `Haircut basic` (`hair-35`) |

#### G — Consumer vs public surface parity

| id | Surface | Example prompt | Same handler result |
|----|---------|----------------|----------------------|
| `discover-parity-budget-public` | public | Facials under €50? | [x] `maxPrice: 50` + `facial`; identical empty catalog vs customer (cheapest facial is €55) |
| `discover-parity-budget-customer` | customer | Facials under €50? | [x] Same enrichment + `composePublicListServicesBudgetResponse` as public |
| `discover-parity-or-public` | public | Massage tomorrow AM or Sat PM | [x] OR windows: tomorrow morning + Sat afternoon; identical enrich vs customer |
| `discover-parity-or-customer` | customer | Massage tomorrow AM or Sat PM | [x] Same `availabilityWindows` + `resolvePublicAvailabilityWindows` as public |
| `discover-parity-voice-customer` | customer | (voice) Haircut fifty bucks tomorrow or Friday | [x] ASR `fifty bucks` → `maxPrice: 50`; OR windows; identical enrich vs public |

#### H — Negative / must-not-break existing flows

| id | Example prompt | Must route to |
|----|----------------|---------------|
| `discover-not-gift-en` | $50 gift card, premium cut tomorrow | [x] Strips `maxPrice`/`serviceRank`; public → `booking_help`; customer → `apply_gift_card_code` |
| `discover-not-package-en` | Premium package under $200 | `discover_packages` |
| `discover-not-admin-en` | (dashboard) services under $50 | [x] Dashboard `list_services` READ + `maxPrice: 50`; no avail/rank/cart; rescue null |
| `discover-not-multi-cart-en` | Two services under $100 total tomorrow | [x] Phase 2: `maxTotalPrice` + `serviceCount` + `date`; no `maxPrice`; combo `hair-35`+`facial-55` |
| `discover-not-currency-explain-en` | Why is premium $120 in dram? | [x] Strips `maxPrice`/`serviceRank`; public + customer → `explain_checkout_currency` |

#### I — Multilingual cross-sprint (add to `discover-1.5`)

| id | Example prompt | Combines |
|----|----------------|----------|
| `discover-hy-budget-or-en` | Ցանկանում եմ մազակրտում վաղը երեկոյան կամ ուրբաթ, 5000 դրամ ունեմ | [x] `maxPrice: 5000` + haircut; OR: tomorrow evening + Friday; hy trailing dram strip |
| `discover-ru-premium-en` | Люксовый массаж до 8000 рублей завтра вечером | [x] `highest_price` + `maxPrice: 8000` + massage; single window tomorrow evening; catalog `massage-95` |
| `discover-hy-cheapest-en` | Ամենաէժան մանիկյուր $30-ից ցածր | [x] `lowest_price` + `maxPrice: 30` + manicure; catalog `manicure-25` |
| `discover-ru-or-book-en` | Стрижка завтра вечером или в субботу — забронируй | [x] `haircut` + OR tomorrow evening + Saturday; `bookingFirstAvailable: true`; ru `забронируй` + OR rescue |

**Exit criteria (all three sprints):**

- [x] **discover-exit-1** — ≥120 unique fixture `id`s across budget + rank + avail + cross-sprint; zero orphan prompts (every `id` in `it.each`)
- [x] **discover-exit-2** — Public `handleCheckAvailability` applies `filterSlotsByTimeOfDay`; OR windows ship in **avail-1.5**
- [x] **discover-exit-3** — **`npm run test:ai-service-discovery`** green in CI; eval harness includes ≥30 cross-sprint cases tagged `discover-*`
- [x] **discover-exit-4** — Consumer assistant chips documented in `consumer-copy-catalog.ts` matching fixture prompts

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

**Status (2026-06):** **`npm run test:ai-accuracy`** green — **2722/2722** deterministic cases (`AI_COMMAND_EVAL_DETERMINISTIC_CASES`).

### acc-2.8 — Deterministic accuracy gate
- [x] **acc-2.8** — **`npm run test:ai-accuracy`** — full deterministic eval + per-intent scorecard; zero failures required

### acc-2.9 — Baseline ratchet
- [x] **acc-2.9** — **`ai-command-eval.baseline.json`** snapshot + CI failure on stale case count or per-intent accuracy regression; refresh via **`npm run test:ai-accuracy:update-baseline`**

### acc-2.2 — Coverage parity & adversarial cases
- [ ] **acc-2.4** — **Locale parity** — every EN golden case has HY + RU equivalents — **partial (2026-06):** customer deferred in **`ai-customer-deferred-locale-parity.spec.ts`** (210 rows); provider push setup (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 retail/comms/schedule (+36 EN+HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+6 EN+HY/RU); provider team whos next (+6 EN+HY/RU); provider time-off list (+9 EN+HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in **`ai-provider-*-locale-parity.spec.ts`**; discovery multilingual in **`ai-customer-public-eval-parity.spec.ts`**; implication corpus HY/RU in **`ai-implication-corpus-locale-parity.spec.ts`** (+50 eval rows, **pipe-1.11.5**)
- [ ] **acc-2.5** — **Typo / fuzzy corpus** — auto-generate misspelled, abbreviated, lowercase, no-punctuation variants of top prompts — **partial (2026-06):** phase 1 lowercase/no-punctuation/double-spacing on 8 customer rescue seeds (+17 eval rows) in **`ai-typo-corpus.*`**; `hasConsumerAppContext` accepts flexible whitespace
- [x] **acc-2.6** — **Ambiguity corpus** — prompts that *should* trigger clarify (missing date, ambiguous provider name, two services match) with expected clarify field, not an execution — **phase 1 (2026-06):** 10 validation-clarify + 4 false-compound in **`ai-ambiguity-corpus.*`** (+14 eval cases → **2551**)

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

- [x] **acc-3.11** — **Embedding-based intent matcher** — new `AiSemanticIntentService`: embed the incoming prompt and cosine-match against a curated bank of canonical phrasings per intent (seeded from `ai-command-eval.cases.ts`); above a confidence threshold, resolve the intent without a regex match — runs as a rescue tier *before* falling back to `unknown` (reuse `AiRagService` index)
- [x] **acc-3.12** — **Canonical phrasing bank** — per-intent example utterances (EN/HY/RU) stored + embedded once (reuse `AiRagService` + `AiPromptNormalizationService`); eval pipeline can add new paraphrases without code changes
- [ ] **acc-3.13** — **Per-business paraphrase learning** — feed confirmed corrections and recurring phrasings into the matcher via `AiEntityMemoryService` (build on **acc-3.2**) so a business's own shorthand resolves on the first try
- [x] **acc-3.14** — **Heuristic → semantic migration** — paraphrase-sensitive resolvers migrated to semantic anchors: `isAnyProviderBookingPrompt`, `isRecommendSpecialistsPrompt`, metric resolvers in `ai-metric-resolvers.util.ts` → `*.semantic.util.ts` + phrasing bank `paramHints`; structural extraction in `ai-structural-extractors.ts` (**pipe-1.13.3**); `isFirstAvailableBookingPrompt` + `isTeamWideProviderAvailabilityQuery` (**pipe-1.13.1–1.13.2**); gate **`npm run test:pipe-acc-3.14`**
- [ ] **acc-3.15** — **Confidence + clarify fallback** — low semantic-match confidence routes to smart clarification (**acc-4**) instead of a wrong guess; wrong-execution guardrail stays < 1%
- [x] **acc-3.16** — **Eval coverage** — paraphrase corpus in `ai-semantic-intent.fixtures.ts` + implication corpus wired to `ai-command-eval.cases.ts`; each core semantic intent (`create_booking`, `book_nearest_slot`, `check_providers_for_service`, `create_direct_schedule`) has ≥5 lexically-distinct equivalents with EN/HY/RU; CI asserts semantic matcher resolves them via **`ai-semantic-paraphrase-corpus.*`** + **`npm run test:pipe-acc-3.16`** (extends **`npm run test:ai-accuracy`** / **acc-2.8**)

### pipe-1 — Confidence-gated command understanding pipeline

**Goal:** Handle semantically equivalent requests with different wording. Heuristics + primary LLM for obvious cases; low-confidence / `unknown` escalates to embedding semantic match → re-rank → rescue → self-verify → structural enrich → validate → execute. Anchors (not phrase whitelists); no entity names in bank. Dashboard first; provider / customer / public via adapters. Implements **acc-3.11**–**3.16**, **acc-3.4**, **acc-3.15**, **acc-4.7** incrementally.

**Target flow:** normalize → fast heuristics → LLM classify → confidence gate → (low: semantic + re-rank + optional narrow re-classify) → rescue → self-verify → structural enrich → validate → execute → telemetry.

**Examples:** "Book me a haircut tomorrow" (classifier 99% → skip semantic) · "My hair is getting pretty long" (unknown 20% → semantic → `create_booking`) · "I think I need a trim soon" (unknown 35% → semantic → `create_booking`).

- [ ] **pipe-1** — Confidence-gated command understanding pipeline

#### pipe-1.0 — Pipeline spine (dashboard)
- [x] **pipe-1.0.1** — Types: `IntentCandidate`, `ConfidenceGateResult`, `PipelineUnderstandResult` in `command-understanding.types.ts`; extend `PipelineStage` in `command-completion.types.ts`
- [x] **pipe-1.0.2** — `CommandUnderstandingPipelineService` — orchestrate stages with ordered `PipelineTrace[]`
- [x] **pipe-1.0.3** — Register in `ai.module.ts`
- [x] **pipe-1.0.4** — Refactor `executeSingleIntent` to delegate understand-phase to pipeline; keep execute / confirm / plan in `AiCommandService`
- [x] **pipe-1.0.5** — `command-understanding-pipeline.integration.spec.ts` — mocked classify + embed; assert stage order

#### pipe-1.1 — Normalize
- [x] **pipe-1.1.1** — Normalize runs first (reuse `AiPromptNormalizationService`); pass `normalized` + `classifierContext` through `PipelineContext`
- [x] **pipe-1.1.2** — Unit spec: HY/RU passthrough, empty prompt, cache hit

#### pipe-1.2 — Fast heuristics (obvious cases)
- [x] **pipe-1.2.1** — `fast-intent-heuristics.service.ts` — score read-only tier, compound detection; return `IntentCandidate[]` not boolean
- [x] **pipe-1.2.2** — High-confidence heuristic hits (≥0.90) feed re-rank; do not bypass LLM classify in phase 1
- [x] **pipe-1.2.3** — Boundary doc: fast heuristics = routing + structural hints only; no new paraphrase regex for intent meaning (**acc-3.14** guard)
- [x] **pipe-1.2.4** — `fast-intent-heuristics.service.spec.ts` — `it.each` over routing fixtures

#### pipe-1.3 — Primary LLM classify + confidence gate
- [x] **pipe-1.3.1** — Classify in pipeline; preserve parallel complexity routing (`runParallelRouteAndClassification`)
- [x] **pipe-1.3.2** — `confidence-gate.util.ts` — `shouldEscalateToSemantic`: true when `unknown` OR `confidence < 0.65`; false when `confidence >= 0.82`
- [x] **pipe-1.3.3** — Wire `aiConfig.confidence.low/high` from `AiSettingsService` as overrides
- [x] **pipe-1.3.4** — Unit spec: high-confidence skips semantic; unknown@0.20 escalates

#### pipe-1.4 — Semantic match + re-rank (low-confidence only)
- [x] **pipe-1.4.1** — `intent-anchor.bank.ts` — generic anchors per intent (EN first); seed from eval; **no entity names**
- [x] **pipe-1.4.2** — Restore `embedText()` on `openai-gateway.service.ts`; log via `ai-usage.service.ts`
- [x] **pipe-1.4.3** — `ai-semantic-intent.service.ts` — pre-embed anchors; cosine match prompt vs anchors
- [x] **pipe-1.4.4** — CI deterministic fallback in `ai-semantic-intent.util.ts` — token cosine when `NODE_ENV=test` or no API key
- [x] **pipe-1.4.5** — `intent-candidate-rerank.util.ts` — merge classifier + semantic + heuristic candidates
- [x] **pipe-1.4.6** — Restrict semantic `allowedActions` by surface + session `lastAction`
- [x] **pipe-1.4.7** — Narrow re-classify when top-2 within 0.08 — 10-intent shortlist (**acc-3.3**)
- [x] **pipe-1.4.8** — `ai-semantic-intent.util.spec.ts` — implication cases (hair long → `create_booking`; work time → `create_direct_schedule`)

#### pipe-1.5 — Rescue (after semantic)
- [x] **pipe-1.5.1** — Reorder `AiIntentRescueService.rescue`: domain rescues first; semantic is pipeline stage only (not inside rescue)
- [x] **pipe-1.5.2** — Pass semantic winner into rescue for param hints only
- [x] **pipe-1.5.3** — Regression: tour calendar, provider stats, recommendation prompts not stolen (**acc-2.8**)

#### pipe-1.6 — Self-verify
- [x] **pipe-1.6.1** — `ai-intent-self-verify.util.ts` — rule checks (schedule vocab, booking vs clear mismatch)
- [x] **pipe-1.6.2** — Fail + confidence <0.55 → `ai-unknown-intent.util.ts` targeted clarify (**acc-3.4**, **acc-4.7**)
- [x] **pipe-1.6.3** — `ai-intent-self-verify.util.spec.ts`

#### pipe-1.7 — Structural enrichment (after intent locked)
- [x] **pipe-1.7.1** — Move `enrichDateRangeFromPrompt`, `matchEmployeesInPrompt`, `inferDirectSchedulePeriods`, `applyAvailabilityFollowUpFromSession` to pipeline structural stage — **after** self-verify
- [x] **pipe-1.7.2** — Default work-time periods 09:00–19:00 when `create_direct_schedule` and no hours in prompt
- [x] **pipe-1.7.3** — Unit spec: structural enrich skipped when self-verify fails

#### pipe-1.8 — Validate + unknown guard
- [x] **pipe-1.8.1** — Block `unknown` from handler switch — clarify via `ai-unknown-intent.util.ts`
- [x] **pipe-1.8.2** — Hand off to existing `command-completion.validator.ts` / `CommandCompletionPipelineService`

#### pipe-1.9 — Execute
- [x] **pipe-1.9.1** — Ensure `create_direct_schedule` in mutating-actions when pipeline resolves schedule intents
- [x] **pipe-1.9.2** — ReAct fallback in `booking-command-graph.service.ts` only when still `unknown` after semantic + rescue

#### pipe-1.10 — Telemetry
- [x] **pipe-1.10.1** — `ai-command-trace.entity.ts` + `ai-command-trace.service.ts`
- [x] **pipe-1.10.2** — Extend `ai-misroute-telemetry.util.ts` with `semanticAction`, `semanticConfidence`, `pipelineStage`
- [x] **pipe-1.10.3** — Record trace on clarify, execute, misroute paths (**acc-1**)

#### pipe-1.11 — Eval + CI
- [x] **pipe-1.11.1** — `ai-implication-corpus.fixtures.ts` — ≥10 implication prompts per top intent (booking, schedule, availability)
- [x] **pipe-1.11.2** — `AI_COMMAND_EVAL_IMPLICATION_CASES` in `eval/ai-command-eval.cases.ts`
- [x] **pipe-1.11.3** — `npm run test:pipe-confidence` in `package.json`
- [x] **pipe-1.11.4** — Green `npm run test:ai-accuracy`; update baseline if case count grows (**acc-2.9**)
- [x] **pipe-1.11.5** — HY/RU implication anchors (**acc-2.4** partial) — **`intent-phrasing.bank.ts`** HY/RU implied anchors; **`ai-implication-corpus-multilingual.fixtures.ts`** (+50 HY/RU corpus rows); **`ai-implication-corpus-locale-parity.*`** parity gates; baseline **3270→3320** @ 100%

#### pipe-1.12 — Multi-surface adapters
- [x] **pipe-1.12.1** — Dashboard adapter (ships with **pipe-1.0**) — **`DashboardCommandUnderstandingAdapter`** + **`command-understanding-adapter.types.ts`**; **`AiCommandService`** delegates understand + route memoization; gate **`npm run test:pipe-dashboard-adapter`**
- [x] **pipe-1.12.2** — Provider mobile — `provider-ai-command.service.ts` — **`ProviderCommandUnderstandingAdapter`**; pipeline understand + central rescue; thin post-pipeline `rescueProviderAiIntent` / coordination / mobile disambiguation; gate **`npm run test:pipe-provider-adapter`**
- [x] **pipe-1.12.3** — Customer mobile — `customer-ai-command.service.ts` — **`CustomerCommandUnderstandingAdapter`**; pipeline understand + central rescue; thin post-pipeline budget/rank discovery rescue; gate **`npm run test:pipe-customer-adapter`**
- [x] **pipe-1.12.4** — Public booking — `public-booking-assistant.service.ts` — **`PublicCommandUnderstandingAdapter`**; pipeline understand + central rescue; thin post-pipeline budget/rank discovery rescue; gate **`npm run test:pipe-public-adapter`**
- [x] **pipe-1.12.5** — Per-surface implication eval cases (`surface: dashboard | provider | customer | public`) — **`ai-implication-corpus-surface-parity.*`** customer/public siblings from EN dashboard seeds; **`ai-implication-corpus-provider.fixtures.ts`** provider heuristic rows; eval runner **`useSurfaceProviderImplicationRescue`**; gates **`npm run test:pipe-implication-surface`** + **`test:pipe-implication-corpus`**; baseline **3320→3391** @ 100%

#### pipe-1.13 — Heuristic shrink (ongoing)
- [x] **pipe-1.13.1** — Migrate `isFirstAvailableBookingPrompt` meaning to semantic anchors; keep structural `bookingFirstAvailable` flag (**acc-3.14**) — **`booking-first-available.semantic.*`** + phrasing bank anchors (`en-nearest-free-time`, `en-compound-check-book-asap`, `ru-book-or-alternative`, `translit-book-nearest-slot`); `isFirstAvailableBookingPrompt` delegates to semantic util; gate **`npm run test:pipe-booking-first-available`**
- [x] **pipe-1.13.2** — Migrate `isTeamWideProviderAvailabilityQuery` paraphrase half to semantic anchors (**acc-3.14**) — **`team-wide-availability.semantic.*`** + phrasing bank `paramHints: { allProviders: true }` on team-wide `check_providers_for_service` anchors (`en-check-who-free`, `en-free-slots-for-service`, `translit-check-who-free`, HY/RU siblings); `isTeamWideProviderAvailabilityQuery` + `enrichBookingTimeHintsFromPrompt` / `isFlexibleAvailabilityTeamWidePrompt` delegate to semantic util; gate **`npm run test:pipe-team-wide-availability`**; baseline **3408→3425** @ 100%
- [x] **pipe-1.13.3** — Split `ai-intent-heuristics.ts` → `ai-structural-extractors.ts` (structural extraction) + `ai-booking-param-hints.util.ts` + `ai-metric-resolvers.util.ts`; semantic detectors in `*.semantic.util.ts` (**acc-3.14**); `ai-intent-heuristics.ts` thin `@deprecated` shim; gates **`npm run test:pipe-structural-extractors`**, **`npm run test:pipe-acc-3.14`**

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

**Inventory source:** **`ai-cmd-ext`** action tables + `ai-capability.matrix.ts` vs dashboard UI routes — close every gap in **parity-2.1**–**2.3** before **parity-4** CI gate. Cross-ref **ai-cmd-ext-gap-1**, **ai-cmd-ext-gap-4**–**6**, **ai-cmd-customer-gap-1**, **ai-cmd-customer-gap-5**.
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

- [ ] **prov-exp** — Provider app expansion (Sprints 59–62) — **AI command backlog:** **ai-cmd-provider-5** (ease-of-life intents, compounds, page chips)

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

- [x] **10. Budget-aware service discovery** — assistant filters catalog by user budget (`maxPrice`); public + consumer AI; scenario matrix **Sprint 63** / **ai-cmd-budget**; gate `npm run test:ai-budget`
- [x] **11. Premium / best service discovery** — assistant ranks catalog by premium/top-tier/highest price (and cheapest); disambiguate service vs specialist; **Sprint 64** / **ai-cmd-rank**; shared util with #10; gate `npm run test:ai-service-discovery`
- [x] **12. Flexible OR availability + budget compounds** — multi-window scheduling (tomorrow evening or Friday afternoon) + optional `maxPrice`; public `filterSlotsByTimeOfDay` parity; **Sprint 65** / **ai-cmd-avail**; canonical prompt in scenario **`avail-budget-or-en`**
- [x] **13. Unified service discovery program** — cross-sprint budget + rank + OR availability; shared utils **`discover-1`**, mega-prompt matrix **`ai-cmd-discover`**, ≥120 fixture ids, gate **`npm run test:ai-service-discovery`**, consumer assistant chips (**discover-1.4**)

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

### ai-cmd-clinic-6-gap-2 — Eval metadata & classifier path — **acc-2** / **parity-2.4**

- [ ] **ai-cmd-clinic-6-gap-2.1** — Add `surface: 'dashboard'` to all **`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES`** (and base **`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_*`** rows if missing)
- [ ] **ai-cmd-clinic-6-gap-2.2** — Add expected access **`tier`** (`M` / `R`) per ext intent in eval cases (cross-ref **`access-control.matrix.ts`**)
- [ ] **ai-cmd-clinic-6-gap-2.3** — Optional: classifier-without-rescue golden rows (misclassifiedAction omitted; assert direct `action` not only `rescuedAction`) for top EN/HY/RU prompts — extends **acc-2.6** ambiguity vs execution coverage

### ai-cmd-clinic-6-gap-3 — Integration & dispatch depth — **feature-test-coverage**

> Today **`ai-clinic-test-result.integration.spec.ts`** exercises **`AiIntentRescueService` only** — not Nest module → service → handler.

- [ ] **ai-cmd-clinic-6-gap-3.1** — Nest **`Test.createTestingModule`** integration — **`AiClinicTestResultService`** → `handleUploadPatientResult` / `handleExplainPatientResults` / `handleConfigureTestReferenceRange` / `handleListAbnormalResults` with mocked repos (mirror depth of other domain `*.integration.spec.ts` where service is wired)
- [ ] **ai-cmd-clinic-6-gap-3.2** — Dispatch smoke — `executeSingleIntent` `case` branches for ext intents return expected `CommandResult` shape (mock **`AiClinicTestResultService`** on **`AiCommandService`** or thin handler-coverage extension under **`test:ai-cmd-ext`**)

### ai-cmd-clinic-6-gap-4 — Registry, validator, capability matrix — **ai-cmd-ext-gap-1** / **ai-cmd-ext-gap-4**

- [ ] **ai-cmd-clinic-6-gap-4.1** — **`ai-capability.matrix.ts`** — explicit rows for **`upload_patient_result`**, **`explain_patient_results`**, **`configure_test_reference_range`**, **`list_abnormal_results`** (`surfaces: ['dashboard']`, `tier`, `mutating`, sprint **54**)
- [ ] **ai-cmd-clinic-6-gap-4.2** — **`ai-command-entity-params.registry.ts`** + **`command-completion.validator.ts`** — required params per ext intent (`orderId`, `customerName`, `measurementCode`, `normalLow`/`normalHigh`, `limit`)
- [ ] **ai-cmd-clinic-6-gap-4.3** — **`ai-capability.matrix.spec.ts`** — registry ↔ matrix parity for clinic test-result intent family (ext + enter/release)

### ai-cmd-clinic-6-gap-5 — Product mutations (out of AI scope until vert ships)

> By design today: upload + configure are **UI handoffs**. Real mutations tracked under clinic vertical.

- [ ] **ai-cmd-clinic-6-gap-5.1** — **`vert-clinic-2.1.6`** — reference range entities + admin CRUD on test types; then wire **`configure_test_reference_range`** handler to persist ranges (replace catalog UI-only summary)
- [ ] **ai-cmd-clinic-6-gap-5.2** — File attach path — when lab UI supports API upload by `orderId`, extend **`handleUploadPatientResultLogic`** or return deep-link with pre-filled `orderId` (keep **`enter_test_result`** for manual values)

### ai-cmd-clinic-6-gap-6 — Compounds (optional — **ai-cmd-ext-4**)

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

## ai-cmd-ext-2.5–2.8 — Dashboard staff operations (shipped)

**Intents:** `create_employee`, `invite_staff_member`, `deactivate_employee`, `configure_online_booking` → `AiOperationsService` / `ai-staff-operations.*`

| Gate | Status |
|------|--------|
| **`npm run test:ai-staff-operations`** | **217** tests — fixtures (44 EN + 88 HY/RU), util, logic, integration, locale parity |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_STAFF_OPERATIONS_*`) tagged `surface: dashboard` |
| **Rescue** | `tryRescueStaffOperations` in `AiIntentRescueService` + param enrich; disambiguated vs `lookup_customer` / `configure_privacy_retention` |
| **Validator** | `create_employee`, `invite_staff_member`, `deactivate_employee` in `command-completion.validator.ts` |
| **Classifier** | `STAFF_OPERATIONS_CLASSIFIER_RULES` + `STAFF_OPERATIONS_MULTILINGUAL_CLASSIFIER_RULES` in dashboard `INTENT_SCHEMA` |

- [x] **ai-cmd-ext-2.5** — `create_employee`
- [x] **ai-cmd-ext-2.6** — `invite_staff_member`
- [x] **ai-cmd-ext-2.7** — `deactivate_employee`
- [x] **ai-cmd-ext-2.8** — `configure_online_booking`

---

## ai-cmd-ext-2.9–2.12 — Dashboard billing, loyalty, waitlist (shipped)

**Intents:** `open_billing_settings`, `summarize_loyalty_program` → `AiMarketingGrowthService`; `list_waitlist_entries`, `offer_waitlist_slot` → `ai-waitlist-dashboard.logic.ts`

| Gate | Status |
|------|--------|
| **`npm run test:ai-billing-waitlist-dashboard`** | **237** tests — fixtures (44 EN + 88 HY/RU), util, logic, integration, locale parity |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_BILLING_LOYALTY_*`, `AI_COMMAND_EVAL_WAITLIST_*`) tagged `surface: dashboard` |
| **Rescue** | `tryRescueBillingLoyaltyDashboard` + `tryRescueWaitlistDashboard` in `AiIntentRescueService`; billing disambiguation vs `explain_plan_limits` / `summarize_client` |
| **Validator** | `offer_waitlist_slot` requires `employeeName`, `date`, `timeSlot`; billing/loyalty + `list_waitlist_entries` read-only |
| **Classifier** | EN + HY/RU rules in dashboard `INTENT_SCHEMA` |

- [x] **ai-cmd-ext-2.9** — `open_billing_settings`
- [x] **ai-cmd-ext-2.10** — `summarize_loyalty_program`
- [x] **ai-cmd-ext-2.11** — `list_waitlist_entries`
- [x] **ai-cmd-ext-2.12** — `offer_waitlist_slot`

---

## ai-cmd-ext-4.1 — Dashboard provider onboarding compound (shipped)

**Recipe:** `onboard_new_provider` — general service provider onboarding (stylist, therapist, barber, provider, nail tech, esthetician, etc.)

| Gate | Status |
|------|--------|
| **`npm run test:ai-provider-onboarding-compound`** | **69** tests — fixtures (11 EN + 22 HY/RU), util, integration, locale parity |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_PROVIDER_ONBOARDING_*`) tagged `surface: dashboard` |
| **Decompose** | `decomposeProviderOnboardingCompoundPrompt` in `intent-decomposition.util.ts`; golden pattern `dashboard_onboard_new_provider` |
| **Classifier** | `PROVIDER_ONBOARDING_COMPOUND_CLASSIFIER_RULES` in dashboard `INTENT_SCHEMA` |
| **Registry** | `onboard_new_provider` in `buildCompoundCommandRecipes()` |

- [x] **ai-cmd-ext-4.1** — `onboard_new_provider`

---

## ai-cmd-ext-4.2 — Dashboard clinic lab day close compound (shipped)

**Recipe:** `clinic_lab_day_close` — end-of-day lab workflow: list orders → enter results → release to patient → notify

| Gate | Status |
|------|--------|
| **`npm run test:ai-clinic-lab-day-close-compound`** | **71** tests — fixtures (11 EN + 22 HY/RU), util, integration, locale parity, rescue |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_CLINIC_LAB_DAY_CLOSE_*`) tagged `surface: dashboard` |
| **Decompose** | `decomposeClinicLabDayCloseCompoundPrompt`; golden pattern `dashboard_clinic_lab_day_close` |
| **Rescue** | `rescueClinicLabDayCloseCompoundIntent` in `AiIntentRescueService` (before order+notify clinic compound) |
| **Classifier** | `CLINIC_LAB_DAY_CLOSE_CLASSIFIER_RULES` in dashboard `INTENT_SCHEMA` |
| **Registry** | `clinic_lab_day_close` in `buildCompoundCommandRecipes()` |

- [x] **ai-cmd-ext-4.2** — `clinic_lab_day_close`

---

## ai-cmd-ext-4.3 — Dashboard budget discover and book compound (shipped)

**Recipe:** `budget_discover_and_book` — filter catalog by maxPrice → check providers → create booking (first available)

| Gate | Status |
|------|--------|
| **`npm run test:ai-budget-discover-and-book-compound`** | **71** tests — fixtures (11 EN + 22 HY/RU), util, integration, locale parity, rescue |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_BUDGET_DISCOVER_AND_BOOK_*`) tagged `surface: dashboard`; baseline **3177** cases |
| **Decompose** | `decomposeBudgetDiscoverAndBookCompoundPrompt`; golden pattern `dashboard_budget_discover_and_book` |
| **Rescue** | `rescueBudgetDiscoverAndBookCompoundIntent` in `AiIntentRescueService` (before package/multi disambiguation) |
| **Router** | `isBudgetDiscoverAndBookCompoundPrompt` early compound tier in `CommandComplexityRouterService` |
| **Classifier** | `BUDGET_DISCOVER_AND_BOOK_CLASSIFIER_RULES` in dashboard `INTENT_SCHEMA` |
| **Registry** | `budget_discover_and_book` in `buildCompoundCommandRecipes()` |

- [x] **ai-cmd-ext-4.3** — `budget_discover_and_book`

---

## ai-cmd-ext-4.4 — Dashboard rank discover and book compound (shipped)

**Recipe:** `rank_discover_and_book` — rank catalog by serviceRank → check providers → create booking (first available)

| Gate | Status |
|------|--------|
| **`npm run test:ai-rank-discover-and-book-compound`** | **72** tests — fixtures (11 EN + 22 HY/RU), util, integration, locale parity, rescue |
| **`npm run test:ai-accuracy`** | EN + HY/RU eval (`AI_COMMAND_EVAL_RANK_DISCOVER_AND_BOOK_*`) tagged `surface: dashboard`; baseline **3218** cases |
| **Decompose** | `decomposeRankDiscoverAndBookCompoundPrompt`; golden pattern `dashboard_rank_discover_and_book` |
| **Rescue** | `rescueRankDiscoverAndBookCompoundIntent` in `AiIntentRescueService` (after budget compound, before package/multi disambiguation) |
| **Router** | `isRankDiscoverAndBookCompoundPrompt` early compound tier in `CommandComplexityRouterService` |
| **Classifier** | `RANK_DISCOVER_AND_BOOK_CLASSIFIER_RULES` in dashboard `INTENT_SCHEMA` |
| **Registry** | `rank_discover_and_book` in `buildCompoundCommandRecipes()` |
| **2-step guard** | `isServiceRankDiscoveryCompoundPrompt` excludes check-step prompts (defers to 3-step dashboard recipe) |

- [x] **ai-cmd-ext-4.4** — `rank_discover_and_book`

---

## ai-cmd-ext-2.13 — Per-service online payment on public booking (partial — 2026-06)

**Intent:** `configure_service_online_payment` → `AiPaymentsService` / `ai-service-online-payment.*`  
**Product:** Services page → “Accept online payment on public booking” (`prepaymentMode`: none | full | deposit; default 50% deposit when `depositAmount` null).  
**Surfaces:** **dashboard only** (admin catalog mutation). Customer/public consume checkout — no mutate there.

| Gate | Status |
|------|--------|
| Registry + switch + rescue | **Shipped** — `DASHBOARD_PAYMENTS_MUTATE_INTENTS`, `ai-command.service.ts` case, `rescuePaymentsIntent`, staff/matrix disambiguation |
| EN fixtures + eval | **Shipped** — 19 EN prompts (accept + decline/disable); `AI_COMMAND_EVAL_SERVICE_ONLINE_PAYMENT_CASES` |
| Unit + integration tests | **Shipped** — `npm run test:ai-payments` / util spec (**97** tests in domain slice) |
| Stripe guard | **Shipped** — `ServiceService.update` → `assertOnlinePaymentAllowed` |
| Bulk confirm | **Shipped** — `allServices` in `bulkConfirmActions` |

**Example prompts (accept):**
- Accept online payment on public booking for all services with 50% prepayment
- Require full prepayment on public booking for Massage
- Accept online payment for Haircut and Blowdry with half prepayment

**Example prompts (decline):**
- Decline online payment on public booking for all services
- Decline online payment on public booking for Massage
- Do not accept online payment for massage services

- [x] **ai-cmd-ext-2.13.1** — `configure_service_online_payment` handler + accept/decline scope parsing (all / named / category / some)
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
- [ ] **ai-cmd-customer-4.2.6** — `explain_checkout_steps`
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

## ai-cmd-provider-5 — Provider ease-of-life commands (backlog)

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

- [ ] **ai-cmd-provider-5.21.1** — `explain_staff_invite`
- [ ] **ai-cmd-provider-5.21.2** — `explain_provider_app_tabs`
- [ ] **ai-cmd-provider-5.21.3** — `explain_team_view_scope`
- [ ] **ai-cmd-provider-5.21.4** — `explain_profile_settings`
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
- [ ] **ai-cmd-provider-5.24.2** — `explain_assistant_confirm_swipe`
- [ ] **ai-cmd-provider-5.24.3** — `give_provider_ai_feedback`
- [ ] **ai-cmd-provider-5.24.4** — `explain_provider_compound_steps`
- [ ] **ai-cmd-provider-5.24.5** — `voice_summarize_next_client`
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

**Cross-links:** **ai-cmd-ext-3** (registry dispatch), **prov-exp-1**–**11** (UI slices), **ai-cmd-customer-4** (customer-facing mirror — e.g. running late notify), **feature-ai-prompt-coverage** (provider surface mandatory), **pipe-1.12.2** (provider pipeline adapter).

