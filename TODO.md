# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress (completed items removed from this file)

**Build policy:** Ship **product features** first → **launch & consumer app** → **lifecycle & ops** → **AI expansion** → **onboarding, pricing & Stripe plans last**. Existing AI baseline stays.

---

## Sprint overview

~2-week sprints. Features **1–8** → Gift cards **9** → Launch & consumer **10–11** → Lifecycle & ops **12–13** → AI **14–25** → Monetization **26–27**.


| Sprint | Theme                                                                                | IDs                                                         |
| ------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **1**  | Mobile push & offline                                                                | gap-2.1, gap-2.3                                            |
| **2**  | Integrations — webhooks & Zapier                                                     | gap-4.3, gap-4.4, gap-4.5                                   |
| **3**  | Integrations — accounting & support                                                  | gap-4.1, gap-4.2                                            |
| **4**  | In-app polish                                                                        | gap-6.4, gap-6.5                                            |
| **5**  | Scheduling vertical depth                                                            | gap-8.2, **sub-1**, **gap-8.3**, **gap-8.7**                |
| **6**  | Growth & vertical playbooks                                                          | gap-8.1, gap-8.5                                            |
| **7**  | Retail POS & enterprise trust                                                        | gap-8.4, gap-5.4, gap-5.5                                   |
| **8**  | Strategy & compliance eval                                                           | gap-5.6, gap-1.6                                            |
| **—**  | Postgres RLS tenant isolation                                                        | **gap-5.7**                                                 |
| **9**  | Customer gift card purchase & delivery                                               | **gc-1**                                                    |
| **10** | Launch — billing & provider app store                                                | gap-7.5, gap-7.6, gap-1.5                                   |
| **11** | Consumer booking app                                                                 | **gap-2.5**                                                 |
| **12** | Marketing alerts & subscription accounting                                           | gap-4.6, gap-4.7                                            |
| **13** | Customer booking self-service & staff push                                           | gap-2.7, gap-2.8, **pay-2**                                 |
| **14** | AI reliability & regression ✅                                                        | gap-3.2, gap-3.7, gap-3.1                                   |
| **15** | AI platform & limits ✅                                                               | ai-0.1, ai-0.2, ai-0.10, gap-3.3, ai-i10                    |
| **16** | AI dashboard UX core                                                                 | ai-d4, ai-d22, ai-d7, ai-d3                                 |
| **17** | AI dashboard depth                                                                   | ai-d5, ai-d6, ai-d10, ai-d11, ai-d18, ai-d19                |
| **18** | AI page coverage & onboarding                                                        | ai-d21, ai-d24, ai-d25, gap-6.3, gap-6.6, gap-8.6           |
| **19** | AI mobile commands                                                                   | ai-m3, ai-m6, ai-m8, ai-m9, ai-m11, ai-m13                  |
| **20** | AI mobile push & voice                                                               | ai-m5, ai-m16, ai-m17, ai-m19, gap-2.2, gap-2.4, gap-2.6    |
| **21** | AI mobile offline                                                                    | ai-m20, ai-m21, ai-m22                                      |
| **22** | AI intelligence layer                                                                | ai-i2, ai-i3, ai-i6, ai-i8                                  |
| **23** | AI scheduling scenarios                                                              | ai-s2, ai-s3, ai-s4, ai-s5, ai-s6                           |
| **24** | AI booking & business ops                                                            | ai-b3, ai-b4, ai-b5, ai-o1–ai-o5                            |
| **25** | AI enterprise & analytics                                                            | ai-e1, ai-e3–ai-e8, gap-3.5                                 |
| **—**  | AI product commands — Sprints 1–13 coverage (planned)                                | **ai-cmd-0**, **ai-cmd-b1**–**ai-cmd-n1** (~270 intents)    |
| **—**  | AI command handlers & NLU quality (ongoing)                                          | **ai-cmd-h1**–**ai-cmd-h4**                                 |
| **26** | Onboarding & pricing UX                                                              | gap-6.1, gap-7.4                                            |
| **27** | Stripe plans & seats                                                                 | gap-7.1, gap-7.2, gap-7.3, gap-5.2, gap-6.2                 |
| **28** | Multi-currency support (core v1 shipped)                                             | **curr-1** ✅, **ai-cmd-curr**                               |
| **29** | Per-tenant language enablement (core v1 shipped)                                     | **lang-1**, **ai-cmd-lang**                                 |
| **30** | Tours vertical (core v1 shipped)                                                     | **vert-tour-1**, **ai-cmd-tour**                            |
| **31** | Clinic vertical (core v1 shipped)                                                    | **vert-clinic-1**, **ai-cmd-clinic**                        |
| **32** | Post-checkout product recommendations (core v1 shipped)                              | **rec-1**, **ai-cmd-rec**                                   |
| **33** | Ameria payment integration                                                           | **pay-ameria-1**                                            |
| **34** | Date format settings (admin-controlled, all apps) (core v1 shipped)                  | **fmt-1**, **ai-cmd-fmt**                                   |
| **35** | Additional payment gateways — PayPal, Tap, Payme, Wise                               | **pay-ext-1**                                               |
| **36** | Tax / VAT configuration (core v1 shipped)                                            | **tax-1**, **ai-cmd-tax**                                   |
| **37** | GDPR & HIPAA compliance hardening (core v1 shipped)                                  | **compliance-1**, **ai-cmd-compliance**                     |
| **38** | AI accuracy — telemetry & measurement                                                | **acc-1**                                                   |
| **39** | AI accuracy — eval set expansion & CI gate                                           | **acc-2**                                                   |
| **40** | AI accuracy — classification engine + semantic intent matching + confidence pipeline | **acc-3**, **pipe-1**                                       |
| **41** | AI accuracy — smart clarification & disambiguation                                   | **acc-4**                                                   |
| **42** | AI accuracy — execution verification & rollback                                      | **acc-5**                                                   |
| **43** | AI accuracy — continuous learning & escalation                                       | **acc-6**                                                   |
| **44** | Apps adoption — telemetry & funnel measurement                                       | **adopt-1**                                                 |
| **45** | Apps adoption — acquisition & install funnel                                         | **adopt-2**                                                 |
| **46** | Apps adoption — activation & onboarding                                              | **adopt-3**                                                 |
| **47** | Apps adoption — retention & re-engagement                                            | **adopt-4**                                                 |
| **48** | Apps adoption — performance, reliability & trust                                     | **adopt-5**                                                 |
| **49** | Apps adoption — growth loops, habit & exit criteria                                  | **adopt-6**                                                 |
| **50** | Near-99%: clarify → success on next turn                                             | **n99-1**                                                   |
| **51** | Near-99%: no-clarify completion rate                                                 | **n99-2**                                                   |
| **52** | Near-99%: install → activation (≤ 7d)                                                | **n99-3**                                                   |
| **53** | Near-99%: push opt-in / reachability                                                 | **n99-4**                                                   |
| **54** | Clinic vertical v2 — lab catalog, orders, results, light EMR                         | **vert-clinic-2**, **ai-cmd-clinic-v2**, **i18n-clinic-v2** |
| **55** | AI feature parity — inventory & per-role coverage matrix                             | **parity-1**                                                |
| **56** | AI feature parity — close coverage gaps to 100% per role                             | **parity-2**                                                |
| **57** | AI feature parity — role-scoped "do anything" agent                                  | **parity-3**                                                |
| **58** | AI feature parity — coverage CI gate & maintenance                                   | **parity-4**                                                |
| **59** | Provider app — customer context at chair                                             | **prov-exp-1**                                              |
| **60** | Provider app — stats, check-in & team floor                                          | **prov-exp-2**–**prov-exp-4**                               |
| **61** | Provider app — retail, comms & schedule                                              | **prov-exp-5**–**prov-exp-7**                               |
| **62** | Provider app — waitlist, growth & polish                                             | **prov-exp-8**–**prov-exp-11**                              |
| **63** | Budget-aware service discovery ✅                                                     | **budget-1**, **ai-cmd-budget**                             |
| **64** | Premium / best service discovery ✅                                                   | **rank-1**, **ai-cmd-rank**                                 |
| **65** | Flexible OR availability + budget compounds ✅                                        | **avail-1**, **ai-cmd-avail**                               |
| **—**  | Unified service discovery (budget + rank + OR avail) ✅                               | **discover-1**, **ai-cmd-discover**                         |
| **—**  | Extend dashboard `AiCommandService` actions (orchestrator + registry parity)         | **ai-cmd-ext**                                              |
| **—**  | Customer AI commands — public booking web + consumer mobile                          | **ai-cmd-customer**                                         |
| **66** | In-app AI Helper — product guide & contextual how-to                                 | **ai-guide-1**                                              |


---



## ai-cmd-ext — Extend `AiCommandService` actions (plan)

**Goal:** Grow dashboard AI command coverage safely — every new product action gets a registry entry, classifier rule, handler (inline or delegated), rescue path, fixtures, and eval case — without letting `ai-command.service.ts` become an unmaintainable god-object.

**Baseline (today):**


| Metric                                          | Value                                                     | Source                                                                           |
| ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Dashboard intents in registry                   | **252** (mutating subset in `DASHBOARD_MUTATING_INTENTS`) | `DASHBOARD_INTENTS` in `ai-command-registry.build.ts`                            |
| Dashboard REST ↔ AI audit                       | **~229** ops — **~58 gaps**                               | **ai-cmd-dashboard-6** (full table below **ai-cmd-provider-6**)                  |
| `executeSingleIntent` switch cases              | **~337** (multi-surface + aliases)                        | `ai-command.service.ts`                                                          |
| LEGACY_CORE intents owned by `AiCommandService` | **~51 mutate + ~19 read**                                 | `LEGACY_CORE_BINDINGS` in registry build                                         |
| `INTENT_SCHEMA` action union                    | **252** (from `DASHBOARD_INTENTS`)                        | `ai-command-intent-schema.build.ts` → `INTENT_SCHEMA` in `ai-command.service.ts` |
| Documented rules in schema appendix             | **~200+ actions**                                         | fixture constants appended to `INTENT_SCHEMA`                                    |
| Generic fallback on unknown handler             | still active                                              | `default` case → "don't know how to execute"                                     |


**Architecture policy (mandatory for every new action):**


| Layer          | Where to change                                                                              | Rule                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Registry       | `ai-command-registry.build.ts` + domain `*.util.ts` intent list                              | Add `id`, `surfaces`, `handler`, `mutating`, `sprint` **before** handler code                           |
| Classifier     | `INTENT_SCHEMA` union + `*_CLASSIFIER_RULES` in `*.fixtures.ts`                              | Extend action union; never rely on appendix-only rules                                                  |
| Dispatch       | `AiCommandService.executeSingleIntent` `switch`                                              | **One line:** `case 'x': result = await this.domain.handleX(...); break;` — no business logic inline    |
| Handler        | `Ai*Service` / `*.logic.ts` next to domain                                                   | All DB/API work lives here (match `AiCatalogService`, `AiSchedulingService`, …)                         |
| Validate       | `command-completion.validator.ts` + `ai-command-entity-params.registry.ts`                   | Required params per action                                                                              |
| Rescue         | `AiIntentRescueService` or domain `rescue*FromPrompt`                                        | Deterministic-first; regression-tested                                                                  |
| Tests          | `*.fixtures.ts` → `it.each` unit + `*.integration.spec.ts` + `eval/ai-command-eval.cases.ts` | EN/HY/RU; tag `surface: dashboard`                                                                      |
| Other surfaces | `ProviderAiCommandService`, `CustomerAiCommandService`, `PublicBookingAssistantService`      | Duplicate verbs where UI differs — **do not** route provider/customer/public through `AiCommandService` |


**Per-action definition of done** (every row in tables below):

> **Audit (2026-06):** not met globally for all **252** dashboard registry intents — see **ai-cmd-ext-gap** + REST audit **ai-cmd-dashboard-6**. Public/customer discovery (Sprints **63–65**) meets the spirit of this checklist; dashboard `ai-cmd-ext-1` param rows and `ai-cmd-ext-2` new verbs do not.

- [ ] Registry binding + access tier in `access-control.matrix.ts`
- [ ] `INTENT_SCHEMA` union entry + classifier rules wired
- [ ] `case` in `executeSingleIntent` **or** documented delegation to another surface service
- [ ] Handler + validator + entity params
- [ ] Rescue/heuristic + ≥10 NL variants in fixtures
- [ ] Eval golden cases (`npm run test:sprint14`; `test:ai-accuracy` when applicable)



### ai-cmd-ext-gap — Audit gaps (dashboard per-action DoD)


| Gap ID                      | DoD criterion                            | Current state                                                                                                                                 | Close with                                                                              |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **ai-cmd-ext-gap-1**        | Registry + access tier                   | Registry ↔ capability matrix tested; **uncovered UI actions remain**                                                                          | **parity-2.1**–**2.3**, explicit tier rows per new intent in `access-control.matrix.ts` |
| **ai-cmd-ext-gap-2**        | `INTENT_SCHEMA` union + classifier rules | **Union synced** — **252** actions from `DASHBOARD_INTENTS` via `ai-command-intent-schema.build.ts`; appendix rules still separate per domain | Per-intent classifier rules for appendix-only gaps — **parity-2.4**                     |
| **ai-cmd-ext-gap-5**        | Rescue + ≥10 NL fixtures                 | Done for major domains (booking, clinic, payments, discover); **not every registry id**                                                       | **parity-2.4** per new intent; extend domain `*.fixtures.ts`                            |
| **ai-cmd-ext-gap-6**        | Eval golden cases                        | `test:ai-accuracy` — **2738/2738** deterministic cases (100%); baseline ratchet **acc-2.9**                                                   | **acc-2.4**–**2.6**, **parity-2.4**                                                     |
| **ai-cmd-dashboard-gap-10** | Dashboard REST ↔ AI parity               | **~58 REST gaps** vs **252** registry intents — no `dashboard-api-ai-parity.fixtures.ts` yet                                                  | **ai-cmd-dashboard-6.19**, `test:dashboard-api-ai-parity`                               |


- [ ] **ai-cmd-ext-gap-7** — Mark per-action DoD checklist `[x]` only when **ai-cmd-ext-gap-1**–**6** are green for that table row (or row is explicitly out of scope with surface tag). REST binding: see **ai-cmd-dashboard-6.19**.
- [ ] **ai-cmd-dashboard-gap-10** — `dashboard-api-ai-parity.fixtures.ts` + gate — see **ai-cmd-dashboard-6.19**

---



### ai-cmd-ext-0 — Orchestrator hygiene (do first)

> Blocks closing **ai-cmd-ext-gap-2**, **ai-cmd-ext-gap-3**. See audit table under **ai-cmd-ext-gap**.


| Task ID            | Work                                                                                                                                                                             | Why                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **ai-cmd-ext-0.4** | Extract LEGACY_CORE inline methods → `AiDashboardCoreService` (booking, cancel, show, analytics, schedule mutate) — `AiCommandService` keeps classify + compound + dispatch only | Target orchestrator **< 5k LOC**       |
| **ai-cmd-ext-0.5** | Optional: registry-driven dispatch table (`Map<intent, handlerFn>`) built at module init                                                                                         | Removes 300+ `case` branches over time |


- [ ] **ai-cmd-ext-0.4** — Extract LEGACY_CORE → `AiDashboardCoreService`
- [ ] **ai-cmd-ext-0.5** — Registry-driven dispatch table

---



### ai-cmd-ext-3 — Registry-only intents → wire dispatch (handlers exist or stubbed elsewhere)

These are already in `ai-command-registry.build.ts` with `handler !== 'AiCommandService'` — work is **ProviderAiCommandService** (or sibling), not the dashboard switch. Listed here so dashboard extension plan stays aligned with full intent inventory.


| Task ID            | Action(s)                                                                           | Target service                   | Sprint                  | Wire in                         |
| ------------------ | ----------------------------------------------------------------------------------- | -------------------------------- | ----------------------- | ------------------------------- |
| **ai-cmd-ext-3.1** | `summarize_client`, `show_client_history`, `add_client_note`                        | `AiProviderClientContextService` | **59** / **prov-exp-1** | `ProviderAiCommandService`      |
| **ai-cmd-ext-3.2** | `my_stats`, `team_floor_status`, `check_in_client`, `mark_running_late`             | `AiProviderExp2Service`          | **60** / **prov-exp-2** | `ProviderAiCommandService`      |
| **ai-cmd-ext-3.3** | `summarize_my_appointments`, `summarize_my_revenue`                                 | `AiProviderEarningsService`      | **60** / **prov-exp-4** | `ProviderAiCommandService`      |
| **ai-cmd-ext-3.4** | `add_retail_to_booking`, `send_client_message`, `block_my_time`, `request_time_off` | `AiProviderExp3Service`          | **61** / **prov-exp-5** | `ProviderAiCommandService`      |
| **ai-cmd-ext-3.5** | `list_time_off_requests`, `approve_time_off_request`, `deny_time_off_request`       | `AiProviderTimeOffService`       | **61** / **prov-exp-7** | dashboard switch **+** provider |
| **ai-cmd-ext-3.6** | `suggest_waitlist_for_gap`                                                          | `AiProviderOpenShiftsService`    | **62** / **prov-exp-8** | `ProviderAiCommandService`      |


---



### Implementation order


| Phase                       | Task IDs                              | Exit criteria                                                                                |
| --------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| **0 — Hygiene**             | **ai-cmd-ext-0.1**–**0.3**            | CI gate: no registry intent without handler path; union synced                               |
| **1 — Param extensions**    | **ai-cmd-ext-1.1**–**1.4**            | **budget-1**, **rank-1**, **avail-1**, **discover-1** gates green                            |
| **2 — New dashboard verbs** | **ai-cmd-ext-2.*** per product sprint | Each row meets per-action DoD + **parity-2.4** locale eval                                   |
| **3 — Provider dispatch**   | **ai-cmd-ext-3.***                    | Provider matrix 100% wired (**parity-1** inventory) — **new intents:** **ai-cmd-provider-5** |
| **4 — Compounds**           | **ai-cmd-ext-4.***                    | Labeled multi-step set ≥95% (**parity-3.2**)                                                 |
| **5 — Refactor**            | **ai-cmd-ext-0.4**–**0.5**            | `AiCommandService` LOC reduced; dispatch table optional                                      |


**Related:** **ai-cmd-h1**–**h4** (NLU quality), **parity-1**–**parity-4** (role coverage matrix + CI), **acc-2** (eval expansion for every new action).

---



## ai-cmd-customer — Public booking web + consumer mobile AI commands (plan)

**Goal:** Every customer-visible AI feature works on **both** anonymous public booking and logged-in consumer mobile, with one backend implementation per action family — no duplicate handler logic in the apps.

**Not in scope:** Dashboard admin (`AiCommandService`), provider mobile (`ProviderAiCommandService`) — tracked under **ai-cmd-ext** / **prov-exp-***.

### Architecture (one change, two surfaces)


| Surface                | User               | API entry                                 | Classifier schema                 | Handler dispatch                            |
| ---------------------- | ------------------ | ----------------------------------------- | --------------------------------- | ------------------------------------------- |
| **Public booking web** | Anonymous visitor  | `POST /public/:slug/assistant`            | `buildPublicClassifierSchema()`   | `PublicBookingAssistantService.chat()`      |
| **Consumer mobile**    | Logged-in customer | Customer AI gateway (`surface: customer`) | `buildCustomerClassifierSchema()` | `CustomerAiCommandService.executeCommand()` |


**Routing rule:**


| Action family                                                                                                                                                         | Consumer mobile path                                                                                                         | Shared backend?                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Discovery & anonymous booking (`list_services`, `check_availability`, `recommend_specialists`, `book_appointment`, `list_providers`, `business_info`, `booking_help`) | `isPublicOnlyAssistantAction` → `runPublicAssistant()`                                                                       | **Yes** — wire once in `PublicBookingAssistantService`                              |
| Check-and-book compounds on mobile                                                                                                                                    | `decomposeDeterministicForSurface('customer')` → `check_providers_for_service` + `book_nearest_slot` via `AiPaymentsService` | **Shipped** — budget/rank/avail in shared compound context + `ai-payments.logic.ts` |
| Account & checkout (`book_package`, `cancel_my_booking`, `my_appointments`, gift card, promo, clinic self-service, …)                                                 | `dispatchCustomerIntent()` in `customer-ai-command.logic.ts`                                                                 | Customer-only — separate classifier rules + handlers                                |


**Definition of done (every customer feature row below):**

- [~] ≥10 NL variants per surface in fixtures; eval cases tagged `surface: public` **and** `surface: customer` (EN/HY/RU) — **partial** (**acc-2.4**)



### ai-cmd-customer-gap — Audit gaps (customer per-row DoD)


| Gap ID                    | DoD criterion                   | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Close with                                                            |
| ------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **ai-cmd-customer-gap-5** | ≥10 NL variants + eval EN/HY/RU | Discovery + deferred slices — `ai-customer-deferred-locale-parity.spec.ts` (210 EN/HY/RU eval rows); provider push (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 (+24 HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+4 HY/RU); provider team whos next (+4 HY/RU); provider time-off list (+6 HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in `ai-provider-*-locale-parity.spec.ts` | **acc-2.4** remaining EN golden rows outside deferred/provider slices |
| **ai-cmd-customer-gap-9** | Public API ↔ AI parity          | Every `public-api.ts` export maps to intent or `no-ai` — `test:customer-api-ai-parity`                                                                                                                                                                                                                                                                                                                                                                                                                                              | **ai-cmd-customer-6.13**                                              |


- [~] **ai-cmd-customer-gap-5** — ≥10 NL variants + eval EN/HY/RU — **partial** (**acc-2.4**)

- [ ] **ai-cmd-customer-gap-8** — Mark customer DoD checklist `[x]` only when **ai-cmd-customer-gap-1**–**7** are green for that feature row (customer-only rows exempt from public-schema bullets)
- [ ] **ai-cmd-customer-gap-9** — `customer-public-api-ai-parity.fixtures.ts` + gate — see **ai-cmd-customer-6.13**

---



### ai-cmd-customer-2 — Customer-only actions (consumer mobile + logged-in web)

Handler target: `customer-ai-command.logic.ts` → domain `Ai*Service` (not `PublicBookingAssistantService`).


| Task ID                 | Domain                   | Example actions                                                      | Classifier                               | Integration spec                            | Notes                                               |
| ----------------------- | ------------------------ | -------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------- | --------------------------------------------------- |
| **ai-cmd-customer-2.2** | Payments & gift cards    | `book_with_gift_card`, `check_gift_card_balance`, `buy_gift_card`, … | customer schema + `rescuePaymentsIntent` | `ai-gift-card-payments.integration.spec.ts` | Must stay disjoint from `maxPrice` (**budget-1.8**) |
| **ai-cmd-customer-2.3** | Subscriptions & packages | `discover_packages`, `my_subscriptions`, `select_subscription_plan`  | customer schema                          | package integration specs                   | Package budget ≠ service `maxPrice`                 |
| **ai-cmd-customer-2.4** | Clinic consumer          | `list_my_test_results`, `book_lab_collection`, …                     | customer + public clinic appendices      | `ai-clinic-lab-booking.integration.spec.ts` | Public clinic prompts overlap — keep surface tags   |
| **ai-cmd-customer-2.5** | Adoption & growth        | `how_to_download_app`, `switch_to_consumer_app`, deep-link resume    | `CONSUMER_ADOPTION_CLASSIFIER_RULES`     | `ai-consumer-adoption.`*                    | **adopt-2**–**adopt-4**                             |


---



### ai-cmd-customer — Implementation order


| Phase | Task IDs | Unlocks |
| ----- | -------- | ------- |


**Key files map:**


| Concern             | Public web                                                            | Consumer mobile                                                 | Shared                                             |
| ------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| Classifier          | `public-booking-assistant.service.ts` `buildPublicClassifierSchema()` | `customer-ai-command.util.ts` `buildCustomerClassifierSchema()` | `ai-budget-service-discovery.fixtures.ts` rules    |
| Rescue              | `PublicBookingAssistantService.chat()` rescue chain                   | `CustomerAiCommandService.rescueIntent()`                       | `ai-budget-service-discovery.util.ts`              |
| Catalog filter/sort | `handleListServices` / `handleRecommendSpecialists`                   | same (via `runPublicAssistant`)                                 | `ai-service-catalog-rank.util.ts` ✅ **budget-1.1** |
| Compounds           | `tryExecutePublicCompound` ✅ **ai-cmd-customer-0.4**                  | `tryCompound` + `executeCustomerCompoundFromSteps`              | `intent-decomposition.util.ts` golden patterns     |
| Eval                | `surface: public`                                                     | `surface: customer`                                             | `eval/ai-command-eval.cases.ts`                    |


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


| Stage            | No-clarify completion | What unlocks it                                                                                  |
| ---------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| Baseline (today) | ~75%                  | Shipped: classify + rescue + confidence routing (ai-i4), clarify (ai-d4), eval harness (gap-3.1) |
| **Stage 1**      | ~85%                  | Telemetry to *see* real failures (**acc-1**) + 10× eval set (**acc-2**)                          |
| **Stage 2**      | ~92%                  | Classification engine: few-shot + retrieval + self-verify (**acc-3**)                            |
| **Stage 3**      | ~96%                  | Smart clarification instead of wrong guesses (**acc-4**) + execution verification (**acc-5**)    |
| **Stage 4**      | **99%**               | Continuous learning loop + escalation for the last 1% (**acc-6**)                                |


**Why this order:** You cannot improve what you cannot measure. Telemetry (**acc-1**) and a large labeled eval set (**acc-2**) come first; every later sprint is measured against that eval set with a CI regression gate so accuracy never silently drops.

**Builds on existing infra (do not rebuild):** `AiGatewayService`, `classify_intent`, `AiIntentRescueService`, confidence routing (ai-i4), clarify-as-form (ai-d4), entity memory (ai-i2), conversation summaries (ai-i3), RAG (ai-i8), eval harness (gap-3.1 / ai-cmd-0.4), command outcome analytics (ai-e6), human-in-the-loop SLA (ai-e7), prompt security preflight.

---



## Sprint 39 — AI accuracy: eval set expansion & CI regression gate

**Goal:** Grow the golden eval set from hundreds to **thousands** of real, labeled prompts across all surfaces and locales; make accuracy a hard CI gate so no change can regress it.

**Status (2026-06):** `npm run test:ai-accuracy` green — **2722/2722** deterministic cases (`AI_COMMAND_EVAL_DETERMINISTIC_CASES`).

- [~] **acc-2.4** — **Locale parity** — every EN golden case has HY + RU equivalents — **partial (2026-06):** customer deferred in `ai-customer-deferred-locale-parity.spec.ts` (210 rows); provider push setup (+12 HY/RU); provider earnings (+28 HY/RU); provider exp-2 (+28 HY/RU); provider client context (+50 HY/RU); provider exp-3 retail/comms/schedule (+36 EN+HY/RU); provider session timeout (+8 HY/RU); provider open shifts (+6 EN+HY/RU); provider team whos next (+6 EN+HY/RU); provider time-off list (+9 EN+HY/RU); provider date format (+16 HY/RU for 8 remaining EN rows; 4 legacy via date-input) in `ai-provider-*-locale-parity.spec.ts`; discovery multilingual in `ai-customer-public-eval-parity.spec.ts`; implication corpus HY/RU in `ai-implication-corpus-locale-parity.spec.ts` (+50 eval rows, **pipe-1.11.5**)
- [~] **acc-2.5** — **Typo / fuzzy corpus** — auto-generate misspelled, abbreviated, lowercase, no-punctuation variants of top prompts — **partial (2026-06):** phase 1 lowercase/no-punctuation/double-spacing on 8 customer rescue seeds (+17 eval rows) in `ai-typo-corpus.`*; `hasConsumerAppContext` accepts flexible whitespace

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


| Metric                                                     | Baseline | Target    |
| ---------------------------------------------------------- | -------- | --------- |
| Accurate execution rate (correct exec **or** good clarify) | ~80%     | **≥ 99%** |
| No-clarify completion rate                                 | ~75%     | ≥ 90%     |
| Wrong-execution rate (undo / 👎 / corrected)               | unknown  | < 1%      |
| Clarify → success on next turn                             | ~??      | > 90%     |
| Per-locale accuracy spread (EN vs HY vs RU)                | unknown  | < 3 pts   |
| Escalation rate (human handoff)                            | n/a      | < 1%      |
| Eval set size (labeled golden cases)                       | hundreds | 2,000+    |


---



# Apps Adoption Program — near-99% adoption (Sprints 44–49)

**Goal:** Move the **customer (consumer app + public booking web) and mobile (consumer app + provider app)** experiences from "shipped" to "habitually used." Drive the full adoption funnel toward best-in-class, with the technically-bounded rates at **≥ 99%**: install→activation completion, push opt-in deliverability, crash-free sessions, and notification reach.

**Core principle:** Adoption = (they install) × (they activate) × (they come back) × (they invite others). Every drop-off is **measured before it is fixed**. A feature only counts as "adopted" when telemetry shows real users completing it — not when it ships.

### Adoption ladder (how we climb)


| Stage            | What it means                                                                                                              | What unlocks it                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Baseline (today) | Apps shipped: consumer app (**gap-2.5**), provider app (Sprints 19–22), deep links, Firebase auth, provider push + offline | —                                                                               |
| **Stage 1**      | We can *see* the funnel                                                                                                    | Adoption telemetry (**adopt-1**)                                                |
| **Stage 2**      | More installs that activate                                                                                                | Acquisition + attribution (**adopt-2**) + frictionless activation (**adopt-3**) |
| **Stage 3**      | Users come back                                                                                                            | Retention, **consumer push**, lifecycle (**adopt-4**)                           |
| **Stage 4**      | Fast, reliable, trusted                                                                                                    | Performance + crash-free + ratings (**adopt-5**)                                |
| **Stage 5**      | The funnel compounds                                                                                                       | Referral + habit loops; exit gate (**adopt-6**)                                 |


**Why this order:** like the AI Accuracy Program, you cannot improve what you cannot measure. Funnel telemetry (**adopt-1**) ships first; every later sprint is scored against the same funnel so adoption never silently drops.

**Builds on existing infra (do not rebuild):** consumer `deep-link.ts` / `customer-auth.ts` / `recent-salons.ts` / `branding.ts` / `tenant-locale.ts` / `product-recommendation-analytics.ts` / `google-auth.ts`; provider `provider-native-push.util.ts` / `provider-push-deep-link.util.ts` / `provider-push-foreground.util.ts` / `offline-queue.ts` / `use-online-status.ts`; backend `analytics` module + `AiEventsService` + event-store; marketing-automation + loyalty + promo-codes modules; store listings (**gap-1.5**, **gap-2.5.10**); push & offline (**gap-2.1**, **gap-2.3**); onboarding (**gap-6.1**).

> **Note (per** `.cursor/rules/feature-ai-prompt-coverage`**):** every adoption feature that is user-visible on the customer or provider surface also needs AI command coverage (classifier rules + eval cases, EN/HY/RU). See **adopt-6.6 / adopt-6.7**.

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


| Metric                                                       | Baseline                       | Target     |
| ------------------------------------------------------------ | ------------------------------ | ---------- |
| Install → activation (signed in + 1st booking ≤ 7d)          | unknown                        | ≥ 60%      |
| Push opt-in rate (after priming)                             | n/a (consumer app has no push) | ≥ 80%      |
| Crash-free sessions (both apps)                              | unknown                        | ≥ 99.5%    |
| Notification deliverability                                  | n/a                            | ≥ 99%      |
| D30 retention (booked again ≤ 30d)                           | unknown                        | trending ↑ |
| Referral K-factor                                            | 0                              | > 0.2      |
| Per-locale adoption spread (EN vs HY vs RU)                  | unknown                        | < 3 pts    |
| Adoption telemetry coverage (key funnel events instrumented) | ~0% (rec events only)          | 100%       |


---



# Near-99% Targets Program — clarify, completion, activation, push opt-in (Sprints 50–53)

**Goal:** Push four headline rates from their base-program targets to **near 99%**:


| Metric                                              | Base-program target   | This program |
| --------------------------------------------------- | --------------------- | ------------ |
| Clarify → success on next turn                      | > 90% (**acc-4**)     | **near 99%** |
| No-clarify completion rate                          | ≥ 90% (acc ladder)    | **near 99%** |
| Install → activation (signed in + 1st booking ≤ 7d) | ≥ 60% (**adopt-3**)   | **near 99%** |
| Push opt-in rate (after priming)                    | ≥ 80% (**adopt-3.5**) | **near 99%** |


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

**Inventory source:** `ai-cmd-dashboard-6` REST audit (below) + `ai-cmd-ext` action tables + `ai-capability.matrix.ts` vs dashboard UI routes — close every gap in **parity-2.1**–**2.3** before **parity-4** CI gate. Cross-ref **ai-cmd-ext-gap-1**, **ai-cmd-ext-gap-4**–**6**, **ai-cmd-customer-gap-1**, **ai-cmd-customer-gap-5**.

- [ ] **parity-2.1** — **Owner / manager dashboard gaps** — add intents for every uncovered owner/manager dashboard action (settings, integrations, billing, staff ops, reports, marketing, loyalty) with handlers, registry bindings, `tiers`, `surfaces`, and `mutating` / `executionMode` flags. **Linked to ai-cmd-dashboard-6.19**: REST-binding tracking now lives in `dashboard-api-ai-parity.fixtures.ts` (`npm run test:dashboard-api-ai-parity`) — the `ai-cmd-dashboard-6.1`–`6.18` audit closed the large majority of named gaps in this row (settings, integrations, billing, staff ops, reports, marketing, loyalty all now have dashboard-ai coverage), but this item stays open until every row in that fixtures file is cross-checked against the full `DASHBOARD_MUTATING_INTENTS` registry (165 intents), not just the ~84 rows sourced from the 6.1–6.18 audit tables — some older/pre-6.x-era mutate intents may still lack a parity row.
- [ ] **parity-2.2** — **Staff / provider gaps** — add uncovered provider-app + staff-scoped dashboard actions (own schedule, assigned bookings, check-in, notes, breaks), honoring `STAFF_SCOPED_INTENTS` so staff only act within their own scope
- [ ] **parity-2.3** — **Customer / public gaps** — add uncovered self-service + public actions (manage/reschedule/cancel own bookings, profile, payment methods, packages/subscriptions, loyalty, notification preferences, gift cards)

- [ ] **parity-2.4** — Each new intent ships classifier rules + **EN/HY/RU** eval cases in `eval/ai-command-eval.cases.ts`, tagged with `surface` + expected `tier`

- [ ] **parity-3.2** — **Goal → multi-step execution** — e.g. "set up my new stylist end-to-end" decomposes into `create employee → assign services → set schedule → enable online booking`, each a permission-checked intent under one preview/confirm



### AI feature parity success metrics (Sprints 55–58)


| Metric                                                 | Baseline                           | Target    |
| ------------------------------------------------------ | ---------------------------------- | --------- |
| Feature → intent coverage (per role / surface)         | partial (~270 intents, unmeasured) | **100%**  |
| Allow/deny divergence (UI vs AI)                       | unknown                            | **0**     |
| Multi-step role tasks completed by agent (labeled set) | n/a                                | **≥ 95%** |
| New feature shipped without an intent (CI escapes)     | occurs                             | **0**     |
| Per-locale parity on new intents (EN / HY / RU)        | —                                  | **100%**  |


---



# Provider App Expansion Program — richer data & at-chair features (Sprints 59–62)

**Goal:** Extend `provider-app/` from schedule-centric + AI into the primary **at-chair** and **floor** tool for stylists and managers — richer customer context, operational data, and lightweight actions staff need between appointments — **without** porting the full dashboard.

**Baseline (shipped today):**


| Area         | What exists                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Tabs**     | Today, Calendar, Schedule, Profile, Gift cards (+ clinic: lab collection, results, tasks, patients when vertical enabled) |
| **Bookings** | List + detail modal — status, payment, reschedule, cancel, payment breakdown; team vs own view for managers               |
| **Profile**  | Avatar, title, reviews summary, push toggle                                                                               |
| **AI**       | Floating assistant, suggestions, offline queue, voice, push deep-links + foreground actions                               |
| **Backend**  | `GET/PUT .../provider/bookings/`*, profile, reviews, schedule summary, push, clinic queues, AI command gateway            |


**Out of scope (stay on dashboard web):** full CRM admin, billing/plan settings, marketing automation config, inventory catalog editing, enterprise trust, strategy eval.

**Policy:** Every user-visible slice needs unit + integration tests (`feature-test-coverage.mdc`). Staff-facing AI needs `PROVIDER_INTENT_SCHEMA` rules + eval cases tagged `surface: provider` (`feature-ai-prompt-coverage.mdc`). UI copy EN/HY/RU in `provider-app-i18n.ts` + `frontend/src/i18n/messages/`* `provider.*` keys.

- [ ] **prov-exp** — Provider app expansion (Sprints 59–62) — **AI command backlog:** **ai-cmd-provider-5** + **API parity:** **ai-cmd-provider-6**



## Sprint 62 — Waitlist, growth visibility & polish

- [ ] **prov-exp-8.1** — **Waitlist panel** — staff-scoped list of waitlist entries for their services; tap offer slot when cancellation opens gap (reuse waitlist offer API from dashboard)
- [ ] **prov-exp-8.2** — **Rebooking candidates** — after cancel/no-show, show top 3 waitlist + last-regular clients; one-tap AI draft message (manager send or copy)



### Provider app expansion success metrics


| Metric                                         | Baseline            | Target                          |
| ---------------------------------------------- | ------------------- | ------------------------------- |
| Booking detail → customer context shown        | name + service only | loyalty, history, notes, badges |
| Check-in usage (providers with ≥1 booking/day) | 0%                  | ≥ 40%                           |
| Retail attach via provider app                 | 0%                  | ≥ 10% of retail lines           |
| Manager team-floor weekly active               | n/a                 | ≥ 50% of manager seats          |
| Provider AI intents for new slices             | partial             | 100% with eval EN/HY/RU         |


---



## ai-guide-1 — In-app AI Helper (product guide & contextual how-to)

**Goal:** Extend existing AI assistants into a **friendly in-app guide** that answers product questions, explains features, and walks users through flows **step by step** — using current screen, role, and business context. Guide responses are **read-only by default**; explicit “do it for me” phrasing may hand off to existing mutate intents.

**Product principles:**


| Principle         | Rule                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Context-first** | Prefer route / screen / onboarding step / checkout step / `screenContext` over generic FAQ        |
| **Accurate**      | Ground answers in guide corpus + capability matrix — no invented routes, settings, or permissions |
| **Concise**       | Short summary + numbered steps; optional deep link (`navigate`) per step                          |
| **Friendly**      | Conversational tone; locale-aware (EN/HY/RU)                                                      |
| **Safe**          | Guide mode must not mutate data unless user clearly requests an action                            |


**Baseline (today):**


| Asset               | Status                                                             | Gap                                                                               |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Static guide UI     | `/dashboard/guide` + `guide.*` i18n                                | Not conversational; not on mobile                                                 |
| Dashboard context   | `AiPageContext`, `AI_ROUTE_CONTEXT_HINTS` in `ai-orchestration.ts` | Biased toward **actions**, not explain/help                                       |
| Public booking      | `booking_help`, checkout explain intents (partial)                 | No step-aware flow guide across all booking steps                                 |
| Provider mobile     | `ProviderAiAssistant` + `screenContext`                            | Scattered `explain_*` proposed (**ai-cmd-provider-5.21**, **5.24**) — not unified |
| Customer mobile     | `how_to_download_app`, adoption copy                               | No general “how does this app work?” guide                                        |
| **Consumer app UI** | Tab shell + `ConsumerBookingAssistant`                             | **No native guide screen** — only activation onboarding + booking progress        |
| **Provider app UI** | `ProviderAiAssistant` + tab routes                                 | **No native guide screen** — FAQ only via AI (not shipped)                        |
| Knowledge source    | Ad hoc classifier rules + static strings                           | No shared retrieval corpus or grounding verifier                                  |


**Architecture (target):**

```
User question → normalize → isGuidePrompt? (heuristics)
  → yes: retrieve guide snippets (route + role + vertical)
       → LLM synthesize (grounded) → steps + navigate + relatedActions
  → no: existing pipe-1 classify → validate → execute (mutate/read ops)
```


| Layer   | Where                                                               | Notes                                                 |
| ------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Corpus  | `backend/src/modules/ai/guide/` + synced from `frontend` guide i18n | Topic ids stable across locales                       |
| Router  | `ai-product-guide.util.ts` — `isProductGuidePrompt`, topic extract  | pipe-1.2 deterministic-first                          |
| Service | `AiProductGuideService`                                             | Dashboard dispatch; provider/customer/public siblings |
| Intents | `explain_app_feature`, `guide_user_flow`, `explain_current_screen`  | Per-surface action names where UI differs             |
| UI      | Command bar / provider sheet / consumer assistant                   | Guide chip, step progress, “Do this for me” handoff   |
| Quality | `ai-product-guide.fixtures.ts`, eval, `test:ai-guide`               | All four surfaces mandatory                           |


**Related (do not duplicate — wire into this epic):** **ai-cmd-customer-4.2.6** (`explain_checkout_steps`), **ai-cmd-provider-5.21** / **5.24** (provider FAQ), **ai-cmd-ext-2.30**–**2.32** (explain setup), **adopt-3** (consumer onboarding), **gap-6.1** (dashboard onboarding), Sprint **18** (**ai-d21**, **ai-d24**, **ai-d25**), **polish-2** (optional Zendesk embed).

- [x] **ai-guide-1.0.1** — Guide vs action taxonomy — document `guide_`* / `explain_*` vs mutate intents; disambiguation table in `ai-product-guide.util.ts`
- [x] **ai-guide-1.0.2** — `isProductGuidePrompt` fast heuristics (pipe-1.2) — “how do I”, “where is”, “what does … mean”, “walk me through”, “help me with this page”
- [x] **ai-guide-1.0.3** — Optional request flag `assistantMode: 'guide' | 'act'` on all four assistant APIs; default infer from prompt when omitted
- [x] **ai-guide-1.0.4** — Shared `GuideResponse` shape — `{ summary, steps[], navigate?, relatedActions?, topicId?, sources[] }` in `command-completion.types.ts`
- [x] **ai-guide-1.0.5** — Misroute guard — question-shaped prompts must not hit bulk mutate intents (rescue → guide)

- [x] **ai-guide-1.1.1** — Structured corpus from `frontend/src/i18n/messages/*/guide.`* + dashboard guide page TOC — stable `topicId` per section
- [x] **ai-guide-1.1.2** — Per-route flow playbooks — `guide-flows/dashboard/*.json`, `guide-flows/provider/*.json`, `guide-flows/customer/*.json`, `guide-flows/public/*.json` (ordered steps + `navigate` targets)
- [x] **ai-guide-1.1.3** — Vertical overlays — clinic lab/EMR, tour checkout, retail POS — merge into corpus by `business.vertical`
- [x] **ai-guide-1.1.4** — Role overlays — owner vs receptionist vs provider vs customer; hide manager-only topics from employee scope
- [x] **ai-guide-1.1.5** — EN/HY/RU parity for every `topicId` — mirror **i18n-clinic-v2** / **lang-1** patterns (dashboard corpus — `ai-guide-corpus.spec.ts`)
- [x] **ai-guide-1.1.6** — CI gate `test:ai-guide-corpus` — every dashboard nav route in `AI_ROUTE_CONTEXT_HINTS` has ≥1 playbook or explicit `no-guide` tag

- [x] **ai-guide-1.2.1** — `AiProductGuideService` — retrieve + rank snippets by `{ route, role, vertical, locale, topicId? }`
- [x] **ai-guide-1.2.2** — Registry intents `explain_app_feature`, `guide_user_flow`, `explain_current_screen` — `surfaces: ['dashboard']`, tier **R**
- [x] **ai-guide-1.2.3** — Handlers in `ai-product-guide.logic.ts` — deterministic playbook steps first; LLM polish only when corpus match confidence ≥ threshold
- [x] **ai-guide-1.2.4** — Grounding verifier — reject / clarify when synthesized answer cites unknown route, setting, or intent id
- [x] **ai-guide-1.2.5** — “Do this for me” handoff — map final guide step → existing mutate intent + prefilled params (e.g. guide “enable online payment” → `configure_service_online_payment`)
- [x] **ai-guide-1.2.6** — Wire `AiCommandService` dispatch + `INTENT_SCHEMA` appendix rules

- [x] **ai-guide-1.3.1** — `AiCommandBar` — **Help** / guide mode chip; first-open suggestions mix guide + action examples per route
- [x] **ai-guide-1.3.2** — Extend `buildAiCommandBarExamples` — contextual “How do I … on this page?” variants from playbooks
- [x] **ai-guide-1.3.3** — Multi-step guide UI — numbered steps, “Next step” / “Open in app” using `navigate` from response
- [x] **ai-guide-1.3.4** — Cross-link `/dashboard/guide#…` anchors ↔ conversational `topicId`
- [x] **ai-guide-1.3.5** — Onboarding variant — when `variant="onboarding"`, prefer setup playbooks (**gap-6.1**, **ai-d21**)

- [x] **ai-guide-1.4.1** — Provider intents — ship **ai-cmd-provider-5.21.1**–**5.21.4**, **5.24.2**, **5.24.4** under unified guide handlers (not one-off strings)
- [x] **ai-guide-1.4.2** — Pass `screenContext` + `mobileRoute` into guide retrieval — Today vs Calendar vs Clients vs Profile
- [x] **ai-guide-1.4.3** — Contextual suggestion chips on `ProviderAiAssistant` — “What’s on Today?”, “How do I mark paid?”, “Block vs time off?” (guide-mode examples + chip; backend handlers **1.4.1** still open)
- [x] **ai-guide-1.4.4** — Voice-friendly step summaries (**5.24.5**) reuse guide playbooks

- [x] **ai-guide-1.5.1** — Extend `booking_help` → full booking funnel guide (**ai-cmd-customer-4.2.6**) — step-aware by public booking route / consumer screen
- [x] **ai-guide-1.5.2** — Customer intents `explain_app_feature`, `guide_user_flow` — tabs, profile, packages, subscriptions, gift cards (read-only)
- [x] **ai-guide-1.5.3** — Public assistant — checkout-step context (`professionals` → `services` → `checkout`) drives playbook selection
- [x] **ai-guide-1.5.4** — Consumer activation guide aligned with **adopt-3.4** — welcome → salon → service → slot → confirm
- [x] **ai-guide-1.5.5** — HY/RU guide corpus for top 20 customer/public flows

- [x] **ai-guide-1.6.1** — `ai-product-guide.fixtures.ts` — `APP_GUIDE_CLASSIFIER_RULES`, `PROVIDER_APP_GUIDE_CLASSIFIER_RULES`, `CUSTOMER_APP_GUIDE_CLASSIFIER_RULES`, `PUBLIC_APP_GUIDE_CLASSIFIER_RULES`
- [x] **ai-guide-1.6.2** — ≥10 NL prompt variants **per surface** per top-20 flows (`SIMILAR_APP_GUIDE_PROMPTS` with `id`, `surface`, `topicId`)
- [x] **ai-guide-1.6.3** — Rescue + enrich — `rescueProductGuideIntent`, `enrichGuideTopicFromPrompt` on each assistant entry path
- [x] **ai-guide-1.6.4** — Eval cases in `eval/ai-command-eval.cases.ts` — tag `surface: dashboard | provider | customer | public`; EN/HY/RU
- [x] **ai-guide-1.6.5** — Gate `npm run test:ai-guide` — unit + integration + corpus parity + eval slice (dashboard eval seeds; four-surface eval **1.6.4** still open)
- [x] **ai-guide-1.6.6** — Compound: “explain then do” — e.g. `guide_user_flow` → `configure_service_online_payment` when user confirms (dashboard command bar handoff)

- [x] **ai-guide-1.7.1** — Optional Zendesk / help-center article ids per `topicId` (**polish-2**)
- [x] **ai-guide-1.7.2** — “Still stuck?” — support handoff with `{ surface, route, topicId, locale }` snapshot (no PII)
- [x] **ai-guide-1.7.3** — Telemetry — guide topic opened, steps completed, handoff-to-action rate, grounding failures (**acc-1**)
- [x] **ai-guide-1.7.4** — Dashboard AI Ops — top unanswered guide topics for corpus expansion



### ai-guide-1 — Suggested implementation order


| Phase                   | IDs                                                  | Rationale                                                   |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| **A — Foundation**      | **1.0**, **1.1**, **1.2**                            | Corpus + routing before UI                                  |
| **B — Dashboard MVP**   | **1.3**, **1.6** (dashboard slice)                   | Command bar guide on top 10 routes                          |
| **C — Mobile surfaces** | **1.4**, **1.5**, **1.6** (provider/customer/public) | Four-surface parity                                         |
| **D — Polish**          | **1.7**, compounds **1.6.6**                         | Support + “explain then do”                                 |
| **E — Hardening**       | **1.8**                                              | Boundaries, session, failure fallback, maintenance CI       |
| **F — Mobile guide UI** | **1.9**                                              | Native guide screens in **consumer-app** + **provider-app** |


- [ ] **ai-guide-1** — Mark epic `[x]` only when **1.0**–**1.6** and **1.9** are green on **all applicable surfaces** per **feature-ai-prompt-coverage** + **feature-test-coverage**



### ai-guide-1.8 — Cross-cutting gaps (recommended before epic close)

> **Audit (2026-06):** **1.0**–**1.7** cover the happy path; these rows close boundaries with existing `explain_`* domain intents, pipe-1 clarify, plan gates, and maintenance.


| Gap                    | Why it matters                                                                                                         | Close with                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Domain vs app guide    | **40+** existing `explain_`* intents (tax, checkout, tour, clinic…) answer *domain* questions — not “where in the UI?” | **1.8.1** routing table         |
| Multi-turn flows       | Step-by-step needs session carry (`guideFlowId`, `guideStepIndex`) across turns                                        | **1.8.2**                       |
| Failed / confused user | After validator error, `unknown`, or low confidence — user asks “what now?”                                            | **1.8.3**, **n99-1**, **acc-4** |
| Plan / module gates    | **gap-6.2** hides AI Ops, integrations — guide must explain locked features without hallucinating access               | **1.8.4**                       |
| Registry parity        | Guide intents need matrix rows + validator params like every other action                                              | **1.8.5**                       |
| All-surface dispatch   | **1.2.2** lists dashboard only — provider/customer/public registry + handlers still open                               | **1.8.6**                       |
| Meta-AI help           | Users ask about the assistant itself (chips, approval swipe, settings)                                                 | **1.8.7**                       |
| Corpus drift           | UI/route changes without playbook updates → wrong guidance                                                             | **1.8.8**                       |


- [x] **ai-guide-1.8.1** — `explain_`* **vs** `guide_`* **routing** — document + enforce: domain explainers (tax, currency, checkout totals) stay on existing handlers; `explain_app_feature` **/** `guide_user_flow` only for navigation, setup flows, and UI semantics; shared rescue disambiguation fixtures
- [x] **ai-guide-1.8.2** — Multi-turn guide session — `guideFlowId`, `guideStepIndex`, `completedSteps[]` in dashboard + public + customer + provider session merge; “next step” / “go back” / “start over” prompts
- [x] **ai-guide-1.8.3** — Post-failure guide fallback — when classify → `unknown`, validator clarify, or handler `success: false`, append contextual guide snippet (“Here's how to … on this page”) — wire **acc-4.7**, **n99-1**
- [x] **ai-guide-1.8.4** — Tier / module-gated topics — playbook metadata `requiresPlan`, `requiresModule`; honest “not available on your plan” + upgrade path copy (**gap-6.2**, **gap-7.1**)
- [x] **ai-guide-1.8.5** — Registry + `access-control.matrix.ts` + `command-completion.validator.ts` rows for all guide intents; `test:ai-cmd-ext` handler coverage on four surfaces
- [x] **ai-guide-1.8.6** — Provider / customer / public `AiProductGuideService` dispatch — mirror **1.2.6** in `ProviderAiCommandService`, `CustomerAiCommandService`, `PublicBookingAssistantService` (surface-specific action names where verbs differ)
- [x] **ai-guide-1.8.7** — Meta-guide intents — `explain_ai_settings`, `explain_ai_suggestions`, `explain_assistant_approval` (dashboard diff preview + provider swipe confirm); map suggestion chip id → playbook step
- [x] **ai-guide-1.8.8** — Corpus maintenance CI — on `frontend` nav / guide page / mobile route change, fail `test:ai-guide-corpus` until playbook or `no-guide` updated (**parity-4** pattern)
- [x] **ai-guide-1.8.9** — Permission / empty-state guides — “Why can't I see …?”, “No services shown”, “Stripe not connected” — tie to live business settings + integration health, not static FAQ
- [x] **ai-guide-1.8.10** — AI unavailable / quota — when OpenAI disabled or over limit (**ai-0.2**), static fallback to native guide screen + section anchor (**1.9**) or dashboard `/dashboard/guide` — offline provider cache (**5.24.1**)

**Also wire (no new epic — cross-ref only):** **compliance-1** / **explain_data_rights** (privacy copy in guide), **fmt-1** / **tax-1** / **curr-1** (settings explainers stay domain handlers), **ai-cmd-ext-7** (customer read-only mirror when dashboard setting changes UX).

### ai-guide-1.9 — Native in-app guide UI (**consumer-app** + **provider-app**)

**Goal:** Ship scrollable **Help & guide** screens in both mobile apps — same `topicId`s as `ai-guide-1.1` corpus, readable **offline**, linked from profile/account and from AI `navigate` responses. Conversational guide (**1.4**, **1.5**) and static guide share one content source.

**Architecture:**


| Layer   | Consumer app                                                        | Provider app                                                  |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Route   | `/s/:slug/guide` (+ optional `?topicId=`)                           | `/tabs/profile/guide` (+ `?topicId=`)                         |
| Entry   | Account tab · assistant chip · welcome CTA (**adopt-3**)            | Profile · assistant chip · accept-invite footer               |
| Content | `guide-flows/customer/*.json` (+ clinic vertical overlay)           | `guide-flows/provider/*.json` (+ clinic / gift-card overlays) |
| i18n    | `consumer-guide.copy.ts` or extend `consumer-copy-catalog` EN/HY/RU | `provider-app-i18n.ts` guide namespace                        |
| Offline | Bundle corpus in app build; no network required to read             | Same                                                          |
| AI link | `navigate: { path: 'guide', query: { topicId } }`                   | Same                                                          |


**Consumer app — sections (minimum TOC):**


| `topicId`                      | Covers                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `consumer-getting-started`     | Welcome, pick salon, first booking (**adopt-3.4**)              |
| `consumer-tabs`                | Home · Services · Account (+ Results / Lab when clinic)         |
| `consumer-booking-flow`        | Professional → service → slot → checkout → confirmation         |
| `consumer-packages-gift-cards` | Packages, subscriptions, gift cards                             |
| `consumer-account`             | Sign in, profile, manage booking, notifications                 |
| `consumer-assistant`           | AI FAB, example prompts, feedback                               |
| `consumer-clinic`              | Lab results, lab requests, preparation notes (vertical overlay) |


**Provider app — sections (minimum TOC):**


| `topicId`                  | Covers                                                     |
| -------------------------- | ---------------------------------------------------------- |
| `provider-getting-started` | Login, accept invite, push permissions                     |
| `provider-today-calendar`  | Today vs Calendar vs Schedule tabs                         |
| `provider-appointments`    | Check-in, mark paid, running late, client notes            |
| `provider-schedule-blocks` | Block my time vs block schedule vs time off (**5.23.4**)   |
| `provider-team-manager`    | Team view scope — manager-only section (**5.21.3**)        |
| `provider-assistant`       | AI chips, swipe to confirm, compounds, offline suggestions |
| `provider-gift-cards`      | Fulfillment queue tabs (when enabled)                      |
| `provider-clinic`          | Lab collection, results, patients (vertical overlay)       |


- [x] **ai-guide-1.9.1** — Shared mobile guide module — `guide-flows/` JSON schema (`topicId`, `titleKey`, `steps[]`, `navigateTarget?`, `verticals?`, `roles?`) consumed by backend corpus (**1.1.2**) and both apps (generate or import at build time)
- [x] **ai-guide-1.9.2** — **consumer-app** — `GuidePage.tsx` at `/s/:slug/guide` — TOC sidebar or section list, anchor scroll to `topicId`, reuse step list UI pattern from dashboard guide
- [x] **ai-guide-1.9.3** — **consumer-app** — Entry points — Account tab **Help & guide** row; `ConsumerBookingAssistant` chip “Open guide”; optional link from **WelcomePage** (**adopt-3**)
- [x] **ai-guide-1.9.4** — **consumer-app** — EN/HY/RU copy for all consumer `topicId`s — parity gate in `consumer-guide.copy.spec.ts`
- [x] **ai-guide-1.9.5** — **consumer-app** — Deep link + in-app `navigate` handler — `topicId` query opens guide scrolled to section; wire `ConsumerBookingAssistant` `navigate.path === 'guide'`
- [x] **ai-guide-1.9.6** — **consumer-app** — Clinic vertical — show/hide **consumer-clinic** section from business metadata (same rules as Results / Lab tabs)
- [x] **ai-guide-1.9.7** — **provider-app** — `GuidePage.tsx` at `/tabs/profile/guide` — same TOC + anchor pattern; Ionic back to Profile
- [x] **ai-guide-1.9.8** — **provider-app** — Entry points — Profile **Help & guide**; `ProviderAiAssistant` chip; footer on **AcceptInvitePage** (**5.21.1**)
- [x] **ai-guide-1.9.9** — **provider-app** — Role-filtered TOC — hide **provider-team-manager** for non-managers; clinic sections from `useProviderClinicNav`
- [x] **ai-guide-1.9.10** — **provider-app** — EN/HY/RU guide namespace in `provider-app-i18n.ts` + locale parity spec
- [x] **ai-guide-1.9.11** — **provider-app** — `navigate.path === 'guide'` from `ProviderAiAssistant` + push/deep-link `…/guide?topicId=`
- [x] **ai-guide-1.9.12** — Offline bundle — embed latest `guide-flows/customer` + `guide-flows/provider` in app assets; refresh on app version bump (**1.8.10** fallback when AI down)
- [x] **ai-guide-1.9.13** — CI — extend `test:ai-guide-corpus` — every consumer route in `App.tsx` tab/booking paths and provider `/tabs/`* route has playbook section or `no-guide`; fail on drift
- [x] **ai-guide-1.9.14** — Component tests — `GuidePage.spec.tsx` (both apps): TOC render, `topicId` scroll, vertical gating, manager filter
- [x] **ai-guide-1.9.15** — “Ask about this section” — each guide section CTA seeds assistant with `topicId` pre-filled prompt (bridges static ↔ conversational guide)

- [x] **ai-guide-1.9** — Mark **1.9** `[x]` when both apps ship guide route, entry points, EN/HY/RU, offline bundle, and **1.9.13** corpus gate green

---



## ai-cmd-clinic-6-gap — Clinic ext-2.1–2.4 remaining DoD (dashboard) ✅ DoD-complete — 2026-06

**Context:** `ai-cmd-ext-2.1`**–**`2.4` / `ai-cmd-clinic-6` — dashboard ext intents closed under **gap-1**–**6** DoD (**parity-2.4**, **acc-2.4** for ext subset). Gate: `npm run test:ai-clinic-6-gap` (390+ tests in `test:ai-clinic-test-results` + exit/locale/integration specs). **ai-cmd-ext-gap-7** per-row checklist for all 252 intents remains global — not required to close this epic.

**Scope:** dashboard only — provider / customer / public out of scope for these four intents.

**Shipped intents (parent rows — resume after this block at** `ai-cmd-ext-2.13`**):**

- [x] **ai-cmd-ext-2.1** — `upload_patient_result` (M) → `AiClinicTestResultService` / `ai-clinic-test-result-ext.`*
- [x] **ai-cmd-ext-2.2** — `explain_patient_results` (R) → released-results read + `customerName` / `orderId` scope
- [x] **ai-cmd-ext-2.3** — `configure_test_reference_range` (M) → catalog UI handoff + range persist when `vert-clinic-2.1.6` product ships
- [x] **ai-cmd-ext-2.4** — `list_abnormal_results` (R) → flagged measurements list + optional customer scope
- [x] **ai-cmd-clinic-6** — Parent epic — four ext intents + `enter_test_result` / `release_test_result` base family

**Shipped today (no new work):**


| Intent                           | Handler                                  | Behavior                                                                                                                  |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `upload_patient_result`          | `handleUploadPatientResultLogic`         | Requires `orderId`; deep-link handoff to lab UI (`navigate` + `uploadHandoff`); use `enter_test_result` for manual values |
| `explain_patient_results`        | `handleExplainPatientResultsLogic`       | Released results; `customerName` / `orderId` scope                                                                        |
| `configure_test_reference_range` | `handleConfigureTestReferenceRangeLogic` | Requires `measurementCode`; guides to catalog UI                                                                          |
| `list_abnormal_results`          | `handleListAbnormalResultsLogic`         | Flagged measurements; optional customer scope                                                                             |


**Key paths:** `ai-clinic-test-result-ext.{fixtures,util,logic}.ts`, `ai-clinic-test-result.service.ts`, `eval/ai-command-eval.cases.ts` (`AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES`).

**Closes with:** **parity-2.4**, **acc-2.4**, **ai-cmd-ext-gap-1** (capability matrix), **ai-cmd-ext-gap-5**–**7**, **vert-clinic-2.1.6** (product CRUD for reference ranges).

### ai-cmd-clinic-6-gap-1 — Locale parity (HY/RU) — **parity-2.4** / **acc-2.4**

> **enter_test_result** / **release_test_result** have `ai-clinic-test-result-multilingual.fixtures.ts` (**i18n-clinic-v2-ai-2**). Ext intents are EN-only.

- [x] **ai-cmd-clinic-6-gap-1.1** — `ai-clinic-test-result-ext-multilingual.fixtures.ts` — ≥4 HY + ≥4 RU prompts per intent (`upload_patient_result`, `explain_patient_results`, `configure_test_reference_range`, `list_abnormal_results`); Latin measurement codes inside hy/ru sentences (mirror **i18n-clinic-v2-ai-2**)
- [x] **ai-cmd-clinic-6-gap-1.2** — Extend `CLINIC_TEST_RESULT_MULTILINGUAL_CLASSIFIER_RULES` (or append ext block in `ai-clinic-test-result-ext.util.ts`) — hy/ru upload / explain / configure / abnormal-list verbs wired into dashboard `INTENT_SCHEMA` appendix
- [x] **ai-cmd-clinic-6-gap-1.3** — `MULTILINGUAL_CLINIC_TEST_RESULT_EXT_EVAL_SCENARIOS` → `eval/ai-command-eval.cases.ts` — HY/RU rows with `surface: 'dashboard'`, `locale: 'hy' | 'ru'`, expected `rescuedAction` + `paramsPartial`; refresh baseline (**acc-2.9**)
- [x] **ai-cmd-clinic-6-gap-1.4** — `ai-clinic-test-result-ext-locale-parity.spec.ts` — asserts every EN ext eval id has HY + RU equivalents (pattern: `ai-provider-*-locale-parity.spec.ts`)
- [x] **ai-cmd-clinic-6-gap-1.5** — Unit `it.each` over multilingual fixtures in `ai-clinic-test-result-ext.util.spec.ts` + `ai-clinic-test-result-multilingual.util.spec.ts` extension if shared helpers added



### ai-cmd-clinic-6-gap-2 — Eval tagging + access tier — **acc-2.4** / **acc-2.6**

- [x] **ai-cmd-clinic-6-gap-2.1** — Add `surface: 'dashboard'` to all `AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_CASES` (and base `AI_COMMAND_EVAL_CLINIC_TEST_RESULT_`* rows if missing)
- [x] **ai-cmd-clinic-6-gap-2.2** — Add expected access `tier` (`M` / `R`) per ext intent in eval cases (cross-ref `access-control.matrix.ts`)
- [x] **ai-cmd-clinic-6-gap-2.3** — Optional: classifier-without-rescue golden rows (misclassifiedAction omitted; assert direct `action` not only `rescuedAction`) for top EN/HY/RU prompts — extends **acc-2.6** ambiguity vs execution coverage



### ai-cmd-clinic-6-gap-3 — Integration & dispatch depth — **feature-test-coverage**

> Today `ai-clinic-test-result.integration.spec.ts` exercises `AiIntentRescueService` **only** — not Nest module → service → handler.

- [x] **ai-cmd-clinic-6-gap-3.1** — Nest `Test.createTestingModule` integration — `AiClinicTestResultService` → `handleUploadPatientResult` / `handleExplainPatientResults` / `handleConfigureTestReferenceRange` / `handleListAbnormalResults` with mocked repos (mirror depth of other domain `*.integration.spec.ts` where service is wired)
- [x] **ai-cmd-clinic-6-gap-3.2** — Dispatch smoke — `executeSingleIntent` `case` branches for ext intents return expected `CommandResult` shape (mock `AiClinicTestResultService` on `AiCommandService` or thin handler-coverage extension under `test:ai-cmd-ext`)

- [x] **ai-cmd-clinic-6-gap-4.1** — `ai-capability.matrix.ts` — explicit rows for `upload_patient_result`, `explain_patient_results`, `configure_test_reference_range`, `list_abnormal_results` (`surfaces: ['dashboard']`, `tier`, `mutating`, sprint **54**)
- [x] **ai-cmd-clinic-6-gap-4.2** — `ai-command-entity-params.registry.ts` + `command-completion.validator.ts` — required params per ext intent (`orderId`, `customerName`, `measurementCode`, `normalLow`/`normalHigh`, `limit`)
- [x] **ai-cmd-clinic-6-gap-4.3** — `ai-capability.matrix.spec.ts` — registry ↔ matrix parity for clinic test-result intent family (ext + enter/release)



### ai-cmd-clinic-6-gap-5 — Product mutations (out of AI scope until vert ships)

> By design today: upload + configure are **UI handoffs**. Real mutations tracked under clinic vertical.

- [x] **ai-cmd-clinic-6-gap-5.1** — `vert-clinic-2.1.6` — reference range entities + admin CRUD on test types; then wire `configure_test_reference_range` handler to persist ranges (replace catalog UI-only summary)
- [x] **ai-cmd-clinic-6-gap-5.2** — File attach path — when lab UI supports API upload by `orderId`, extend `handleUploadPatientResultLogic` or return deep-link with pre-filled `orderId` (keep `enter_test_result` for manual values)

- [x] **ai-cmd-clinic-6-gap-6.1** — Extend `decomposeClinicCompoundPrompt` — e.g. `list_abnormal_results` → `explain_patient_results` for flagged patient; document in `ai-cmd-ext-4.2` `clinic_lab_day_close` or new `clinic_lab_review` recipe
- [x] **ai-cmd-clinic-6-gap-6.2** — Eval `compoundSteps` for clinic ext multi-step flows when recipes ship (**parity-3.2**)



### Exit criteria (close **ai-cmd-clinic-6** fully + **ai-cmd-ext-gap-7** for ext-2.1–2.4)


| Gate                                | Target                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run test:ai-clinic-6-gap`      | green — includes `test:ai-clinic-test-results` + exit/locale/integration specs     |
| **Ext eval subset (**`acc-2.4`**)** | 0 failures on `AI_COMMAND_EVAL_CLINIC_TEST_RESULT_EXT_`* (EN + HY/RU + classifier) |
| **Locale parity spec**              | 0 missing HY/RU pairs for ext EN eval ids                                          |
| **Integration**                     | rescue + Nest service paths covered                                                |
| **parity-2.4**                      | classifier rules + EN/HY/RU eval tagged `surface: dashboard` + `tier`              |


- [x] **ai-cmd-clinic-6-gap** — `ai-cmd-clinic-6` DoD-complete for **gap-1**–**6** (gate `npm run test:ai-clinic-6-gap`); parent **ai-cmd-ext-2.1**–**2.4** shipped

**Resume here →** `ai-cmd-ext-2.13` (online payment — done) · `ai-cmd-ext-2.14+` (settings/growth — done) · `ai-cmd-dashboard-6.9.3` (wire `create_test_order` REST — still open) · global `ai-cmd-ext-gap-7` per-intent DoD for all 252 registry rows

---



## ai-cmd-ext-2.13 — Per-service online payment on public booking (DoD-complete — 2026-06)

**Intent:** `configure_service_online_payment` → `AiPaymentsService` / `ai-service-online-payment.`*  
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

- [x] **ai-cmd-ext-2.13.2** — HY/RU locale parity — `ai-service-online-payment-multilingual.fixtures.ts` + eval rows (**parity-2.4**, **acc-2.4**)
- [x] **ai-cmd-ext-2.13.3** — `ai-capability.matrix.ts` explicit row (`surfaces: ['dashboard']`, tier `M`, sprint tag)
- [x] **ai-cmd-ext-2.13.4** — Dashboard page suggestions — add accept/decline online-payment examples to `AI_PAGE_SUGGESTIONS['/dashboard/services']` + localized i18n keys
- [x] **ai-cmd-ext-2.13.5** — Read companion `explain_service_online_payment_setup` — summarize which services have online payment + prepayment mode (Stripe Connect status); NOT `list_services` alone
- [x] **ai-cmd-ext-2.13.6** — `npm run test:ai-service-online-payment` gate script in `package.json` (util + logic + integration slice)
- [x] **ai-cmd-ext-2.13.7** — Fixed all 24 pre-existing failing eval cases across two sibling clusters — `service-online-payment-i18n-*` (12, all HY/RU) and `update-service-prices-online-payment-*` (12, all EN) — that regressed after **ai-cmd-customer-4.6.13** removed the over-broad `isListServicesPaymentFilterPrompt` collision (fixing pay-at-venue-fallback exposed that `list_services` had been silently absorbing ALL of these dashboard mutate prompts too; once that steal was narrowed, five *further*, previously-masked collisions surfaced one at a time). Root causes, in the order found: (1) `isListServicesPaymentFilterPrompt`'s `hasListFilterCue` still matched `services?\s+with\b`, and its accept/enable/configure exclusion was English-only, so it kept stealing HY/RU "Ընդունել/Միացնել/Принять/Включить online payment...for services with X%" prompts and EN "Raise/Lower/Adjust prices...for services with online payment" prompts — added the missing HY/RU verb roots (`ընդուն|միացն|պահանջ|կարգավոր|անջատ|դադարեցն|прин|включ|требов|настро|отключ|прекрат`) to the exclusion, plus a standalone raise/increase/lower/decrease/adjust/change+price (or `N%`+price) exclusion. (2) The umbrella `tryRescueOperations` (`ai-intent-rescue.service.ts`) hardcoded `rescueReason: 'operations_booking_ops'` for every action it rescued, discarding the specific reason (`update_service_prices_online_payment_filter`) that `rescueUpdateServicePricesOnlinePaymentFilterIntent` (`ai-update-service-prices-online-payment-filter.util.ts`) already correctly returned — widened `rescueOperationsIntent`'s return type with an optional `rescueReason` field and had the caller prefer it over the generic fallback. (3) `enrichUpdateServicePricesParamsFromPrompt` only ever merged `onlyWithOnlinePayment`, silently dropping `percentChange`/`categoryName` for both the online-payment-filter AND the plain pricing-adjustment paths in `ai-operations.util.ts` — merged in `parsePriceAdjustment`'s `percentChange`/`categoryHint` (as `categoryName`) at both call sites (same file, no new import, avoiding the circular-import risk a cross-file fix would've had). (4) `isExplainDepositForfeiturePrompt`'s `PAYMENT_SETUP_MUTATE_CUE` exclusion only recognized "for (all )?services" — not "for some services", "for Color service", "for every service", or non-English accept verbs — broadened the scope-word gap to `.{0,20}\bservices?\b` and added the same HY/RU verb roots from fix (1), plus its own raise/increase/lower+price exclusion for the one EN "offerings" prompt that reached it via a different word ("offerings" isn't "services", so fix (1)'s exclusion never even applied). (5) `isJoinWaitlistPrompt`'s bare Armenian `միաց` cue (meant for "միանալ" = to join) also matches as a bare substring of "միացնել" (a different verb — "to turn on/enable" — that happens to share the same "միա-" root morpheme) — added a narrow `online payment` + `public booking` exclusion rather than touching the shared root regex, since Armenian morphology makes the two verbs genuinely ambiguous at the substring level and the fixtures never combine "միացնել" with payment-setup context except in this one case. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-list-services-payment-filters`/`ai-update-service-prices-online-payment-filter`/`ai-service-online-payment`/`ai-filter-services-no-prepayment`/`ai-operations`/`ai-explain-deposit-forfeiture`/`ai-customer-waitlist` (591 tests): all pass. Confirmed via full golden-eval-set diff (319 → 295 failures) that exactly these 24 target ids disappeared with zero new ids added; confirmed the one surviving unrelated `ai-intent-rescue.service.spec.ts` failure (`reschedule_booking` vs `confirm_my_booking_details`) is pre-existing via `git stash` on all 5 touched files.
- [x] **ai-cmd-ext-2.13.8** — Fixed all 8 pre-existing failing `service-online-payment-setup-*` eval cases. The detector itself (`isExplainServiceOnlinePaymentSetupPrompt`, `ai-service-online-payment-setup.util.ts`) was already correct for every one of the 8 prompts (confirmed via a scoped debug spec) — every failure was a *different* sibling detector stealing the prompt first, six distinct root causes across six unrelated files, each following the same broad-generic-catchall shape seen repeatedly this session: (1) `isExplainStripeCheckoutCurrencyPrompt` (`ai-stripe-checkout-currency.util.ts`) — its `hasStripeCheckoutCurrencyContext` gate treats bare "online payment" as sufficient stripe-checkout-currency context, so any `explain/what/which` + "online payment" prompt (3 of 8) got misrouted; added an `isExplainServiceOnlinePaymentSetupPrompt` exclusion. (2) `isExplainStripeCurrencyWarningPrompt` (`ai-stripe-currency-warning.util.ts`) — its bare `\bstripe\s+connect\b` surface check stole "Stripe Connect status/ready" prompts; added the same exclusion, but had to *refine* it to `&& !/\b(currency|currencies|warning)\b/i.test(prompt)` after it broke 4 existing legitimate stripe-currency-warning fixtures that also happen to mention "Stripe Connect" (e.g. "Why does Settings show a Stripe Connect warning for our currency?") — the presence of an explicit currency/warning word is what actually distinguishes the two domains, not the bare "Stripe Connect" mention. (3) `isExplainIntegrationHealthPrompt` (`ai-explain-integration-health.util.ts`) stole "Is Stripe Connect ready for online payments?" via its own generic Stripe-readiness surface check — same exclusion added. (4) `isSummarizeClientPrompt` (`ai-provider-client-context.util.ts`) stole "Summarize online payment setup for all services" by hallucinating `customerName: "online payment"` — traced to a `clientCue` regex `/(?:for|about|on)\s+[A-Z][\w'.-]+/i` that was clearly meant to require a *capitalized* proper-noun name, but the whole regex carries the `/i` flag, which makes `[A-Z]` match lowercase too — so "for all" satisfied it. Scoped the fix to an `isExplainServiceOnlinePaymentSetupPrompt` exclusion rather than touching the deeper case-insensitivity bug, whose blast radius across the wider client-context domain was out of scope for this cluster. (5) `isBudgetDepositQuestion` (`ai-budget-service-discovery.util.ts`) had a bare `/\bdeposit\b/i` check with no online-payment-setup exclusion, stealing "Which services have full prepayment vs deposit?" — same exclusion added, which then exposed (6) a *second*-layer collision: `isCompareServicesPrompt` (`ai-compare-services.util.ts`) unconditionally treats any bare "vs"/"versus" as a compare-services trigger — "full prepayment VS deposit" — added the same exclusion there too. Separately, 2 of the 8 cases were pure params-enrichment gaps once routing was fixed (`params.categoryName`/`serviceName` never came through) — `rescueExplainServiceOnlinePaymentSetupIntent` only returns `{action, rescueReason}`, and the caller in `ai-intent-rescue.service.ts` never merged in `parseExplainServiceOnlinePaymentSetupFromPrompt`'s result at all — added a new merge branch mirroring the existing per-action `Object.assign(rescuedParams, enrichXParamsFromPrompt(...))` pattern already used for every other sibling action in that same function. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of all 10 touched/adjacent domains (927 tests): all pass. Confirmed via full golden-eval-set diff (264 → 256 failures) that exactly these 8 target ids disappeared with zero new ids added; confirmed via `git stash` on all 7 touched files that a newly-observed `provider-mark-paid` failure (`mark_paid` vs `confirm_my_booking_details`, `ai-cmd-eval.integration.spec.ts`) is pre-existing and completely unrelated (provider-domain action, no path through any of the 7 files touched here).
- [x] **ai-cmd-ext-gap-7** — Mark **ai-cmd-ext-2.13** DoD-complete when **2.13.2**–**2.13.6** green

---



## ai-cmd-ext-2.14+ — Dashboard command backlog (extend `AiCommandService`)

**Goal:** Cover high-traffic dashboard settings & catalog mutations that owners already do in UI but cannot say in the AI bar yet. Each row = new or extended intent; wire per **ai-cmd-ext** DoD (**registry → classifier → case/delegate → rescue → ≥10 NL fixtures → eval**).

**Priority legend:** **P0** = blocks onboarding/checkout; **P1** = weekly ops; **P2** = nice-to-have read/deep-link.

### P0 — Checkout & payments (Services + Billing + Settings)


| ID                  | Intent (proposed)                      | M/R | Handler home                                 | Product UI                       | Notes                                                                                               |
| ------------------- | -------------------------------------- | --- | -------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| **ai-cmd-ext-2.14** | `explain_service_online_payment_setup` | R   | `AiPaymentsService`                          | Services + Billing               | Which services require prepayment; Stripe Connect ready?; cash still allowed? **Shipped as 2.13.5** |
| **ai-cmd-ext-2.15** | `configure_stripe_connect`             | M   | `AiMarketingGrowthService` or billing module | Settings → Billing               | Deep-link + explain steps; optional “open Stripe onboarding” — NOT raw OAuth in AI                  |
| **ai-cmd-ext-2.16** | `configure_checkout_defaults`          | M   | `AiPaymentsService`                          | Settings self-service + Services | Compound-friendly: cash at venue + default online prepayment policy for new services                |
| **ai-cmd-ext-2.17** | `update_service_duration_buffer`       | M   | `AiCatalogService` / operations              | Services form                    | Bulk: “Set all massage services to 60 minutes with 15 min buffer”                                   |
| **ai-cmd-ext-2.18** | `configure_service_deposit_policy`     | M   | `AiPaymentsService`                          | Services                         | Alias/extension if split from **2.13**: fixed $ deposit vs % only (already partial in **2.13**)     |


- [x] **ai-cmd-ext-2.14** — `explain_service_online_payment_setup` (**duplicate of 2.13.5** — `ai-service-online-payment-setup.`*, gate `npm run test:ai-service-online-payment`)
- [x] **ai-cmd-ext-2.15** — `configure_stripe_connect` — `ai-stripe-connect.`*, deep-link `/dashboard/billing`, optional `onboardingUrl` via `startConnect`
- [x] **ai-cmd-ext-2.15.1** — Fixed all 4 pre-existing failing `stripe-connect-*` eval cases. Root cause #1 (3 of 4 cases): the now-familiar missing-params-merge gap in `tryRescueMarketingGrowth` (`ai-intent-rescue.service.ts`, the same private method extended twice already this session for `create_promo_code`/`configure_loyalty_settings`) — `rescueConfigureStripeConnectIntent` returns only `{action, rescueReason}`, and the already-correct `enrichConfigureStripeConnectParamsFromPrompt` (resolving `startOnboarding`/`mode`/`country`) existed but was never invoked; extended the if/else-if chain with a `configure_stripe_connect` branch. Root cause #2 (remaining case, "Connect Stripe to accept card payments on public booking"): independently satisfied `isConfigureStripeConnectPrompt`, but was stolen — twice, in sequence — first by `isExplainStripeCurrencyWarningPrompt`'s (`ai-stripe-currency-warning.util.ts`) bare `accept` word (part of a `warning|warn|support(?:ed)?|accept(?:s|ed)?|vs` alternative meant for "does Stripe support/accept this currency" questions, with zero distinction from "accept card payments" as a payment-setup phrase), then by `isExplainBusinessCurrencyPrompt`'s (`ai-business-currency.util.ts`) near-identical bare `support(?:ed)?|accept|take` alternative in the exact same shape. Fixed both with `isConfigureStripeConnectPrompt` exclusion guards (no circular imports either way — `ai-stripe-connect.util.ts` has zero imports of its own). **Landmine found and fixed**: the first attempt at guard #1 broke 2 existing `explain_stripe_currency_warning` fixtures that legitimately mention "Stripe Connect" as a product name ("Why does Settings show a Stripe Connect warning for our currency?", "Stripe Connect warning — what does it mean for our salon?") — traced to `isConfigureStripeConnectPrompt` itself being over-broad in a way not fixable here: its `CONFIGURE_STRIPE_VERB` bare `\bconnect\b` alternative matches the noun "Connect" inside the product name "Stripe Connect" as if it were the imperative verb "connect", so any sentence mentioning the product name trivially satisfies both the verb-check and the `STRIPE_CONNECT_SIGNAL` context-check. Rather than touching the shared `isConfigureStripeConnectPrompt` (broader blast radius, used elsewhere), narrowed the new guard with the same currency/warning-word carve-out already established in **ai-cmd-ext-2.13.8**/**ai-cmd-ext-2.30.1** for this identical file (`&& !/\b(currency|currencies|warning|mean|means)\b/i.test(prompt)`) — verified the target prompt (no currency/warning word) still gets excluded correctly while both legitimate fixtures (which do mention "currency"/"warning"/"mean") are now preserved. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-stripe-connect`/`ai-stripe-currency-warning`/`ai-business-currency`/`ai-marketing-growth`/`ai-intent-rescue` (263 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (56 → 52 failures) that exactly these 4 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.16** — `configure_checkout_defaults` — `ai-checkout-defaults.`*, business `publicBooking` defaults for cash + new-service prepayment
- [x] **ai-cmd-ext-2.16.1** — Fixed all 12 pre-existing failing `checkout-defaults-*` eval cases. Root cause #1 (9 of 12 cases): the now-familiar missing-params-merge gap — `rescueConfigureCheckoutDefaultsIntent` (`ai-checkout-defaults.util.ts`) returns only `{action, rescueReason}`, and the already-correct `parseConfigureCheckoutDefaultsFromPrompt` (resolving `acceptCashPayments`/`defaultServicePrepaymentMode`/`defaultServiceDepositPercent`) existed but was never invoked by its caller, `rescuePaymentsIntent`'s consumer in `ai-intent-rescue.service.ts` (a large if/else-chain of per-action merge branches for the payments/checkout domain). Added the missing `configure_checkout_defaults` branch, mirroring the existing sibling branches (`configure_service_deposit_policy`, `explain_service_online_payment_setup`, etc.) exactly, plus the new import (verified no circular imports — `ai-checkout-defaults.util.ts` only imports `PrepaymentMode` and `parseServiceOnlinePaymentConfig`, nothing from the rescue service). Root cause #2 (remaining 3 cases, all mentioning "deposit" — "Set default online payment for new services to 25% deposit", "Turn on pay at venue and set new service default to 50% deposit", "For newly added services default to online payment with 50% deposit"): all three independently satisfied `isConfigureCheckoutDefaultsPrompt`, but were stolen by `isBudgetDepositQuestion`'s (`ai-budget-service-discovery.util.ts`) bare `/\bdeposit\b/i` catch-all — the same over-broad detector previously implicated in an earlier `service-online-payment-setup` collision this session, now hitting a new domain. Fixed with a narrow `isConfigureCheckoutDefaultsPrompt` exclusion guard (verified no circular imports). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-checkout-defaults`/`ai-payments`/`ai-budget-service-discovery`/`ai-intent-rescue` (548 tests): 2 pre-existing unrelated failures remain (a stale hardcoded dispatch-map-size assertion in `ai-payments-dispatch.build.spec.ts`, and the known `reschedule_booking` vs `confirm_my_booking_details` case — both confirmed identical with and without this change via `git stash`). Confirmed via full golden-eval-set diff (173 → 161 failures) that exactly these 12 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.17** — `update_service_duration_buffer` — `ai-service-duration-buffer.`*, bulk duration/buffer on Services catalog
- [x] **ai-cmd-ext-2.17.1** — Fixed all 12 pre-existing failing `service-duration-buffer-*` eval cases (both the `-category` and `-single` sub-clusters, plus a few unsuffixed ids). All 12 failures shared the identical shape — action/rescueReason already correct, only `params` (`categoryName`/`serviceName`/`serviceNames`/`durationMinutes`/`bufferMinutes`/`allServices`) came back `undefined`. Root cause: `rescueUpdateServiceDurationBufferIntent` (`ai-service-duration-buffer.util.ts`) only ever returns `{action, rescueReason}` — no params — and its caller, `tryRescueCatalog` (`ai-intent-rescue.service.ts`, wrapping `rescueCatalogIntent` from `ai-catalog.util.ts`), already has an established per-action `if (rescued.action === 'X') { Object.assign(params, enrichXParamsFromPrompt(...)); }` merge-branch pattern for sibling catalog actions (`configure_service_featured`, `bulk_assign_services_category`, `configure_package_online_payment`, `deactivate_service`) but was simply missing the equivalent branch for `update_service_duration_buffer`, even though the matching enrich function (`enrichServiceDurationBufferParamsFromPrompt`) already existed and was fully correct — just never invoked. Added the missing branch, mirroring the existing ones exactly. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-service-duration-buffer`/`ai-catalog`/`ai-intent-rescue` (202 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (249 → 237 failures) that exactly these 12 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.18** — `configure_service_deposit_policy` (close any **2.13** gaps: tier metadata, featured services)



### P1 — Settings, notifications, growth (Settings / Integrations / Growth tabs)


| ID                  | Intent (proposed)                  | M/R | Handler home                     | Product UI               | Notes                                                                           |
| ------------------- | ---------------------------------- | --- | -------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| **ai-cmd-ext-2.19** | `configure_notification_settings`  | M   | new `ai-notification-settings.`* | Settings → Notifications | Email/SMS/WhatsApp toggles; reminder 24h/1h; **not** customer prefs             |
| **ai-cmd-ext-2.20** | `configure_whatsapp_integration`   | M   | `AiIntegrationsService`          | Settings → WhatsApp      | Template names, connection mode; test send → `test_push` / webhook test pattern |
| **ai-cmd-ext-2.21** | `configure_openai_integration`     | M   | `AiIntegrationsService`          | Settings → OpenAI        | Platform vs custom API key — admin only                                         |
| **ai-cmd-ext-2.22** | `explain_tenant_app_install`       | R   | `AiMarketingGrowthService`       | Integrations → Growth QR | Per-tenant `/get-app/[slug]` landing + QR — **new product (2026-06)**           |
| **ai-cmd-ext-2.23** | `regenerate_tenant_app_install_qr` | M   | business / growth service        | Growth tab               | Regenerate slug QR assets; idempotent `ensureForBusiness`                       |
| **ai-cmd-ext-2.24** | `create_promo_code`                | M   | `AiMarketingGrowthService`       | Marketing / promo admin  | Admin CRUD — disjoint from customer `promo_code_help`                           |
| **ai-cmd-ext-2.25** | `configure_loyalty_settings`       | M   | `AiMarketingGrowthService`       | Loyalty settings         | Points rules, earn/redeem toggles — extend `summarize_loyalty_program` (read)   |


- [x] **ai-cmd-ext-2.19** — `configure_notification_settings`
- [x] **ai-cmd-ext-2.19.1** — Fixed all 12 pre-existing failing `notification-settings-*` eval cases, plus 2 collision cases in adjacent domains (`manage_notification_preferences`, `explain_push_permission`) and 1 bonus fix, for 15 total. Root cause #1 (12 target cases): the now-familiar missing-params-merge gap in a "blanket empty params" private method (`tryRescuePushNotifications`, `ai-intent-rescue.service.ts`) — the already-correct `enrichNotificationSettingsParamsFromPrompt` (`ai-notification-settings.util.ts`, resolving `emailEnabled`/`smsEnabled`/`whatsappEnabled`/`sendConfirmationEmail`/`sendConfirmationWhatsapp`/`reminder24hEmail`/`reminder1hEmail`/`reminder24hSms`/`reminder1hSms`/`reminder24hWhatsapp`/`reminder1hWhatsapp`) existed but was never invoked. Added a conditional call for `configure_notification_settings`, plus the new import (verified no circular imports). Root cause #2 (2 collision cases, "Open my notification settings" and "Open notification settings", both customer-surface): both were swallowed by `isListPushNotificationsPrompt`'s (`ai-push-notifications.util.ts`) bare `/\b(show|open|list|view|check|see)\b.*\b(my\s+)?(notifications?|...)\b/` regex, which matches the substring "notification" inside "notification settings" with zero awareness that "settings" changes the intent entirely (to `manage_notification_preferences`/`explain_push_permission`, which were both being excluded upstream via the `isPushNotificationsDomainPrompt` guard in `isManageNotificationPreferencesPrompt`). Fixed with a narrow `if (/\bnotification\s+settings?\b/i.test(prompt)) return false;` guard added directly to `isListPushNotificationsPrompt` (verified against existing fixtures — none mention "notification settings" as a phrase). Discovering this also surfaced a second missing-params-merge gap in the same "blanket empty params" style (`tryRescueConsumerAdoption`) — the already-correct `parseExplainPushPermissionFromPrompt` (resolving `aspect`) existed but was never invoked; fixed with a conditional branch for `explain_push_permission` (needed a `{ ...(x ?? {}) }` spread rather than a bare `?? {}` to satisfy `Record<string, unknown>` typing, since the parse function returns a narrowly-typed interface). This incidentally also fixed a previously-unrelated failure, `explain-push-permission-rescue-misclassified-enable-push`, for free. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-notification-settings`/`ai-push-notifications`/`ai-consumer-adoption`/`ai-explain-push-permission`/`ai-manage-notification-preferences`/`ai-intent-rescue` (293 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (161 → 146 failures) that exactly these 15 ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.20** — `configure_whatsapp_integration`
- [x] **ai-cmd-ext-2.20.1** — Fixed all 9 pre-existing failing `whatsapp-integration-*` eval cases. Root cause #1 (8 of 9 cases): same "blanket empty params" private method (`tryRescuePushNotifications`, `ai-intent-rescue.service.ts`) whose `configure_notification_settings` branch was fixed in **ai-cmd-ext-2.19.1** — the already-correct `enrichWhatsappIntegrationParamsFromPrompt` (resolving `usePlatformDefault`/`templateConfirmation`/`templateReminder`/`templateLanguage`/`phoneNumberId`/`businessAccountId`/`fallbackTemplate`/`templateBodyParams`) existed but was never invoked. Extended the if/else-if chain with a `configure_whatsapp_integration` branch, plus the new import (verified no circular imports — the file already imports from `ai-whatsapp-integration.util.ts` for the non-parameterized rescue call, and that file has zero imports back). Root cause #2 (remaining case, "Configure WhatsApp templates — confirmation template booking_confirmed and reminder template appt_reminder_v2"): the whole prompt independently satisfied `isConfigureWhatsappIntegrationPrompt` as ONE atomic action, but `rescuePushNotificationsIntent`'s early compound-detection bail-out (`isPushNotificationsCompoundPrompt`) false-positived on the substring "and reminder" — its `COMPOUND_SPLIT` regex splits on `and\s+(?:...|reminder|...)`, treating what is actually a single WhatsApp-config command with two template params as if it were two sequential different-intent steps, causing the whole rescue to bail with `null` (not even a wrong action — a total miss). Fixed with a narrow `if (isConfigureWhatsappIntegrationPrompt(trimmed)) return false;` guard added directly to `isPushNotificationsCompoundPrompt` (verified against existing compound fixtures — none mention WhatsApp templates). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-whatsapp-integration`/`ai-push-notifications`/`ai-notification-settings`/`ai-intent-rescue` (202 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (127 → 118 failures) that exactly these 9 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.21** — `configure_openai_integration`
- [x] **ai-cmd-ext-2.21.1** — Fixed all 9 pre-existing failing `openai-integration-*` eval cases. Root cause #1 (8 of 9 cases): the now-familiar missing-params-merge gap — `rescueConfigureOpenaiIntegrationIntent` (`ai-openai-integration.util.ts`) returns only `{action, rescueReason}`, and the already-correct `enrichOpenaiIntegrationParamsFromPrompt` (resolving `usePlatformDefault`/`apiKey`) existed but was never invoked by its caller, `tryRescueIntegrations` in `ai-intent-rescue.service.ts` — the same private method whose "blanket empty params" gap for `explain_integration_health` was fixed in **ai-cmd-ext-2.31.1**; converted the single-action ternary there into an if/else-if chain and added the `configure_openai_integration` branch, plus the new import (verified no circular imports — the openai-integration file only imports a DTO type). Root cause #2 (remaining case, "Update OpenAI integration settings"): independently satisfied `isConfigureOpenaiIntegrationPrompt`, but was stolen by `isManageNotificationPreferencesPrompt`'s (`ai-manage-notification-preferences.util.ts`) `MANAGE_MUTATE_CUE` bare mutate-verb-near-"settings" regex — the identical generic catch-all pattern that stole a `configure_loyalty_settings` case in **ai-cmd-ext-2.25.1**, this time hitting the OpenAI-integration domain instead. Fixed with a narrow `isConfigureOpenaiIntegrationPrompt` exclusion guard (verified no circular imports). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-openai-integration`/`ai-integrations`/`ai-manage-notification-preferences`/`ai-intent-rescue` (174 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (136 → 127 failures) that exactly these 9 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.22** — `explain_tenant_app_install`
- [x] **ai-cmd-ext-2.22.1** — Fixed all 5 pre-existing failing `tenant-app-install-*` eval cases, plus 1 bonus fix for a `how_to_download_app` sibling regression, for 6 total. `isExplainTenantAppInstallPrompt` (`ai-tenant-app-install.util.ts`) was already correct for all 5 — every failure was a sibling detector's bare-word collision stealing the prompt first, three separate root causes. (1) 3 cases ("Where is the get-app link...", "Explain app install link on integrations growth tab", "What link do customers scan...") were stolen by `isExplainGuestCheckoutFieldsPrompt`'s bare `MERGE_TOPIC` regex, which includes the standalone word "link" as a guest-account-merge cue with zero domain qualifier — the same class of bare-word overreach fixed repeatedly this session, now hitting a fourth domain. Fixed with an exclusion guard. (2) "Where can I find the venue QR for the consumer app" was stolen by `isExplainOfflineModePrompt`'s (`ai-explain-offline-mode.util.ts`) bare `consumer\s+app` cue, intended for offline/sync topics but matching any mention of "the consumer app" regardless of subject. Fixed with an exclusion guard. (3) "Tell me about growth distribution app install QR" was stolen twice in sequence: first by `isExplainProviderSpecialtyPrompt`'s (`ai-explain-provider-specialty.util.ts`) bare "tell me about ANYTHING" phrase (fixed with an exclusion guard), which after that fix revealed a second, deeper collision with `isSummarizeClientPrompt`'s (`ai-provider-client-context.util.ts`) case-insensitive `about\s+[A-Za-z]...` capture-phrase regex (the `/i` flag silently making the intended-capitalized-name check match any lowercase word too) — the same file/pattern already implicated in **ai-cmd-ext-2.25.1**'s `configure_loyalty_settings` fix and **ai-cmd-customer-4.11.1.1**'s `explain_any_provider_option` investigations. Fixed with an exclusion guard (all 3 guards verified with zero circular-import risk against `ai-tenant-app-install.util.ts`, which itself imports nothing from this module tree). (4, bonus) Investigating this cluster also surfaced a related, structurally distinct bug: `rescueMarketingGrowthIntent`'s (`ai-marketing-growth.util.ts`) blanket `if (isMarketingGrowthIntent(action)) return null;` early-bail treats ANY already-in-domain action (including a wrong sibling like `explain_tenant_app_install` when the correct answer is `how_to_download_app`, a neighboring action in the same domain) as already correctly classified, permanently preventing within-domain re-classification — this broke the `how-to-download-app-rescue-misclassified-explain-tenant-app-install` eval case ("Get the consumer app" misclassified as `explain_tenant_app_install`, expecting rescue to `how_to_download_app`). Fixed by moving the existing `rescueRegenerateTenantAppInstallQrIntent` and `rescueHowToDownloadAppIntent` calls to run before the blanket bail (in their original relative order, to avoid a first-attempt regression where moving only the download-app check let it wrongly steal `regenerate_tenant_app_install_qr` prompts like "Recreate the get-app QR for the salon" — caught via targeted jest, fixed by preserving check order) and removing the now-dead duplicate calls further down. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-tenant-app-install`/`ai-explain-guest-checkout-fields`/`ai-explain-offline-mode`/`ai-explain-provider-specialty`/`ai-provider-client-context`/`ai-how-to-download-app`/`ai-marketing-growth`/`ai-intent-rescue` (637 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (71 → 65 failures) that exactly these 6 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.23** — `regenerate_tenant_app_install_qr`
- [x] **ai-cmd-ext-2.24** — `create_promo_code`
- [x] **ai-cmd-ext-2.24.1** — Fixed all 12 pre-existing failing `create-promo-code-*` eval cases. Root cause #1 (10 of 12 cases): `rescueCreatePromoCodeIntent` (`ai-create-promo-code.util.ts`) already returned the correct `{action, rescueReason}`, and a fully-correct `parseCreatePromoCodeFromPrompt` (extracting `code`/`discountType`/`discountValue`/`minOrderAmount`/`maxUses`) already existed — but its caller, the private `tryRescueMarketingGrowth` method in `ai-intent-rescue.service.ts`, used a "blanket empty params" architecture (`params: {}` hardcoded unconditionally for every marketing-growth action) rather than the if/else-chain per-action merge-branch pattern used elsewhere in the same file — a distinct variant of the now-familiar missing-params-merge gap. Fixed by replacing the hardcoded `{}` with a ternary computing `parseCreatePromoCodeFromPrompt(prompt) ?? {}` specifically for `create_promo_code`, plus the new import. Root cause #2 (remaining 2 cases, "Make coupon SUMMER25 with $10 off" and "Add a salon promo code SALONWELCOME with 20 dollars off"): both independently satisfied `isCreatePromoCodePrompt`, but were stolen by `rescueBudgetServiceDiscoveryIntent`'s (`ai-budget-service-discovery.util.ts`) final fallback branch, which unconditionally rescues `action === 'unknown'` to `list_services`/`budget_list_services` whenever ANY dollar amount is found in the prompt via `extractMaxPriceFromBudgetPrompt` (here, "$10 off"/"20 dollars off" parsed as a budget ceiling) — with zero awareness that the prompt was actually a promo-code creation command. Fixed with a narrow `isCreatePromoCodePrompt` exclusion guard added early in `rescueBudgetServiceDiscoveryIntent` (verified no circular imports — `ai-create-promo-code.util.ts` has zero local imports of its own). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-create-promo-code`/`ai-marketing-growth`/`ai-intent-rescue`/`ai-budget-service-discovery` (517 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains (confirmed via `git stash` A/B on the touched file). Confirmed via full golden-eval-set diff (219 → 207 failures) that exactly these 12 target ids disappeared with zero new ids added (a handful of apparent near-matches in the raw diff were a BSD-sed `\s` artifact — `\s` isn't a whitespace shorthand in BSD sed, so a stray `sed 's/\s*$//'` from an earlier saved baseline file had silently stripped trailing literal `s` characters off unrelated ids — not a real behavior change).
- [x] **ai-cmd-ext-2.25** — `configure_loyalty_settings`
- [x] **ai-cmd-ext-2.25.1** — Fixed all 12 pre-existing failing `configure-loyalty-settings-*` eval cases. Root cause #1 (10 of 12 cases): identical "blanket empty params" gap in the same `tryRescueMarketingGrowth` method (`ai-intent-rescue.service.ts`) touched for `create_promo_code` — the already-correct `parseConfigureLoyaltySettingsFromPrompt` (`ai-configure-loyalty-settings.util.ts`, resolving `earnPercentCashback`/`enabled`/`earnExcludedServiceIds`) existed but was never invoked. Converted the existing ternary to an if/else-if chain and added a `configure_loyalty_settings` branch calling it, plus the new import (verified no circular imports — the file has zero imports of its own). Root cause #2 (remaining 2 cases, both generic catch-all collisions — both prompts independently satisfied `isConfigureLoyaltySettingsPrompt`, confirmed via debug spec): "Turn on customer loyalty points" was stolen by `isSummarizeClientPrompt`'s (`ai-provider-client-context.util.ts`) `marketingSnapshot` check, which fires on the bare co-occurrence of any "marketing/opted in/referral/loyalty" word with any "client/customer/guest" word with zero awareness of mutate-vs-read intent; "Update loyalty settings: earn 12% on purchases" was stolen by `isManageNotificationPreferencesPrompt`'s (`ai-manage-notification-preferences.util.ts`) `MANAGE_MUTATE_CUE` regex, which fires on any mutate verb ("update"/"set"/"enable"/etc.) within 40 chars of the bare word "settings" — both are the now-familiar generic catch-all pattern hit repeatedly this session. Fixed both with narrow `isConfigureLoyaltySettingsPrompt` exclusion guards (verified no circular imports both ways). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-configure-loyalty-settings`/`ai-provider-client-context`/`ai-manage-notification-preferences`/`ai-marketing-growth`/`ai-intent-rescue`/`ai-consumer-adoption` (429 tests): 2 pre-existing unrelated failures remain (the known `reschedule_booking` vs `confirm_my_booking_details` case, and a pre-existing `ai-manage-notification-preferences.util.spec.ts` failure for "Open my notification settings" — both confirmed identical with and without this change via `git stash`). Confirmed via full golden-eval-set diff (185 → 173 failures) that exactly these 12 target ids disappeared with zero new ids added.



### P1 — Catalog & packages (Services tab extensions)


| ID                  | Intent (proposed)                  | M/R | Handler home                 | Product UI        | Notes                                                                              |
| ------------------- | ---------------------------------- | --- | ---------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| **ai-cmd-ext-2.26** | `configure_service_featured`       | M   | `AiCatalogService`           | Services list     | Mark/unmark featured; `serviceTier` / rank metadata (**rank-1** overlap)           |
| **ai-cmd-ext-2.27** | `bulk_assign_services_category`    | M   | `AiCatalogService`           | Categories tab    | “Move all hair services under Hair category” — extend `update_service` compounds   |
| **ai-cmd-ext-2.28** | `configure_package_online_payment` | M   | `AiCatalogService`           | Packages tab      | Package-level prepayment if product adds it; else document out of scope            |
| **ai-cmd-ext-2.29** | `explain_multi_service_settings`   | R   | `AiScheduleResourcesService` | Multi-service tab | Explain limits + scheduling mode — pairs with existing `configure_multi_service_`* |


- [x] **ai-cmd-ext-2.26** — `configure_service_featured`
- [x] **ai-cmd-ext-2.27** — `bulk_assign_services_category`
- [x] **ai-cmd-ext-2.28** — `configure_package_online_payment` (product-dependent)
- [x] **ai-cmd-ext-2.29** — `explain_multi_service_settings`



### P2 — Read-only “explain setup” helpers (reduce support load)


| ID                  | Intent (proposed)                       | M/R | Handler home            | Notes                                                             |
| ------------------- | --------------------------------------- | --- | ----------------------- | ----------------------------------------------------------------- |
| **ai-cmd-ext-2.30** | `explain_public_booking_checkout`       | R   | `AiPaymentsService`     | How cash + online + gift card interact on booking page            |
| **ai-cmd-ext-2.31** | `explain_integration_health`            | R   | `AiIntegrationsService` | Extend `list_integration_health` with NL “is WhatsApp connected?” |
| **ai-cmd-ext-2.32** | `audit_services_missing_online_payment` | R   | `AiPaymentsService`     | “Which services still don't accept online payment?”               |


- [x] **ai-cmd-ext-2.30** — `explain_public_booking_checkout`
- [x] **ai-cmd-ext-2.30.1** — Fixed all 7 pre-existing failing `explain-public-booking-checkout-*` eval cases. The detector (`isExplainPublicBookingCheckoutPrompt`, `ai-explain-public-booking-checkout.util.ts`) was already correct for all 7 prompts — every failure was a sibling detector stealing the prompt first, in six unrelated files, the same shape as **ai-cmd-ext-2.13.8**: (1) `isBookWithGiftCardPrompt` (`ai-book-with-gift-card.util.ts`) treated bare "checkout" as sufficient booking-intent evidence, stealing "How do gift cards work at public booking checkout?". (2) `isExplainStripeCheckoutCurrencyPrompt` (`ai-stripe-checkout-currency.util.ts`) stole "...cash, online payment, and gift cards interact on the booking page" — needed a *refined* exclusion (`&& !/\b(currency|currencies)\b/i.test(prompt)`) after the first attempt broke an existing legit fixture ("Can I pay cash at the venue if Stripe doesn't support this currency?") that also matches the public-booking-checkout surface but is genuinely about currency, not checkout mechanics. (3) `isChoosePaymentMethodPrompt`/`isAskPaymentOptionsPrompt`/`isExplicitPayCashAtVisitPrompt` (three separate functions across `ai-payments.util.ts` and `ai-cash-payment-checkout.util.ts`, since `rescueCashPaymentCheckoutIntent` calls `isAskPaymentOptionsPrompt`/`isExplicitPayCashAtVisitPrompt` directly rather than through `isChoosePaymentMethodPrompt`) collectively stole 3 of the 7 prompts. (4) `isCompareServicesPrompt` (`ai-compare-services.util.ts`) — same bare "vs" trigger as **2.13.8** — stole "When do visitors pay cash vs Stripe on the booking page?". (5) `isSummarizeMyAppointmentsPrompt` (`ai-provider-earnings.util.ts`) had a bare `total` in its `countCue` combined with a `selfCue = ... || countCue` bypass that defeated the intended "my/mine" self-reference requirement, plus bare `booking` in `appointmentCue` — together these hallucinated a match for "Do gift cards reduce the checkout total on public booking?". (6) `isExplainDepositForfeiturePrompt` (`ai-explain-deposit-forfeiture.util.ts`) stole the remaining prompt via its existing `PAYMENT_SETUP_MUTATE_CUE`/price gates not covering this phrasing. Fixed all 6 by adding `isExplainPublicBookingCheckoutPrompt` exclusion guards (verified no circular imports since the target file has zero imports of its own). Adding the guard to `isChoosePaymentMethodPrompt`/`isAskPaymentOptionsPrompt` then exposed a **second-order regression**: an existing legit `choose_payment_method` fixture, "Which payment options on public booking?" (surface `public`), also independently matches `isExplainPublicBookingCheckoutPrompt` — traced to `hasCheckoutPaymentInteractionContext`'s `payment options/methods/flow` branch having a bare `|| /\bpublic\s+booking\b/i` fallback alongside the stricter `hasPublicBookingCheckoutSurface` check; removed the bare fallback (kept only the stricter surface check), verified all 7 target prompts still match (they all satisfy the stricter surface check via "checkout" co-occurrence) while the ambiguous customer fixture now correctly returns false. tsc holds at known baseline (1362, no new-file diffs; note: `/tmp/tsc_671.log` was accidentally deleted during cleanup and immediately regenerated — reconfirmed identical 1362 count); targeted sweep of all 13 touched/adjacent domains (1165 tests): all pass. Confirmed via full golden-eval-set diff (256 → 249 failures) that exactly these 7 target ids disappeared with zero new ids added; full `modules/ai/` suite held at the same 112-failed-Tests baseline as the prior sweep (no jump).
- [x] **ai-cmd-ext-2.31** — `explain_integration_health`
- [x] **ai-cmd-ext-2.31.1** — Fixed all 10 pre-existing failing `explain-integration-health-*` eval cases. Root cause #1 (9 of 10 cases): the now-familiar missing-params-merge gap in a "blanket empty params" private method (`tryRescueIntegrations`, `ai-intent-rescue.service.ts`) — the already-correct `parseExplainIntegrationHealthFromPrompt` (`ai-explain-integration-health.util.ts`, resolving `integrationFocus` to `whatsapp`/`openai`/`stripe`/`zendesk`/`zapier`/`webhooks`/`apiKeys`/`accounting`) existed but was never invoked. Added a conditional call for `explain_integration_health`, plus the new import (verified no circular imports). Root cause #2 (remaining case, "Is accounting export configured?"): independently satisfied `isExplainIntegrationHealthPrompt`, but was stolen by `isExportAccountingPrompt`'s (`ai-payments.util.ts`) bare co-occurrence check (`/\b(export|generate|run|download)\b/` AND `/\b(accounting|books|ledger)\b/`), which matches "export" as a bare noun inside "accounting export" with zero distinction between an actual export command and a health-check question ("is X configured?"). Fixed with a narrow `isExplainIntegrationHealthPrompt` exclusion guard (verified no circular imports — the integration-health file doesn't import from `ai-payments.util.ts`). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-integration-health`/`ai-integrations`/`ai-payments`/`ai-intent-rescue` (173 tests): 2 pre-existing unrelated failures remain (the stale `ai-payments-dispatch.build.spec.ts` dispatch-map-size assertion, and the known `reschedule_booking` vs `confirm_my_booking_details` case). Confirmed via full golden-eval-set diff (146 → 136 failures) that exactly these 10 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-2.32** — `audit_services_missing_online_payment`
- [x] **ai-cmd-ext-2.32.1** — Fixed all 6 pre-existing failing `audit-services-missing-online-*` eval cases. The detector (`isAuditServicesMissingOnlinePaymentPrompt`, `ai-audit-services-missing-online-payment.util.ts`) was already correct for all 6 prompts — every failure was a sibling detector stealing the prompt first, the same two-collision shape hit repeatedly this session: `isExplainStripeCheckoutCurrencyPrompt` (4 cases: "Which services still don't accept online payment?", "...are missing online payment?", "Which massage services don't accept online payment?", "...are without online payment setup?") and `isFilterServicesNoPrepaymentPrompt` (2 cases: "List services with no online prepayment", "...are still cash-only on public booking?"). Fixed the currency collision with the now-standard `isAuditServicesMissingOnlinePaymentPrompt` exclusion guard in `ai-stripe-checkout-currency.util.ts` (verified no circular imports — the audit-payment file has zero imports of its own). The filter-services collision was trickier: `ai-filter-services-no-prepayment.util.ts` already had a narrow local `isDashboardPaymentGapAuditPrompt` reimplementation (not delegating to the real detector) used as its own exclusion gate — first tried replacing it with a direct call to `isAuditServicesMissingOnlinePaymentPrompt`, but that broke **18 tests** across the file's own `FILTER_SERVICES_NO_PREPAYMENT_PROMPTS` fixtures (the real audit detector is broad enough to also independently match many legitimate customer-facing "no prepayment" phrasings that only differ from the dashboard-audit fixtures by a missing "still"/"audit"/"missing" trigger word — a genuine text-level ambiguity between the two domains, not a bug in either detector alone). Reverted that broad delegation and instead extended the local narrow regex with three surgical, verified-unique-to-dashboard phrases: `no\s+online\s+prepayment` (bare, distinct from the customer fixtures' "without online prepayment"/"no online payment **required**" phrasing), `still\s+cash[\s-]?only`, and `without\s+online\s+payment\s+setup` (a dashboard-specific compound term never used in any customer fixture) — verified zero overlap against all 24 `FILTER_SERVICES_NO_PREPAYMENT_PROMPTS` fixtures via grep before applying. Also found and fixed a missing params-merge branch for `params.categoryName` in `ai-intent-rescue.service.ts` (the now-familiar per-action `Object.assign(rescuedParams, parseXFromPrompt(...))` pattern) — `parseAuditServicesMissingOnlinePaymentFromPrompt` already existed and was correct, just never invoked. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-audit-services-missing-online-payment`/`ai-filter-services-no-prepayment`/`ai-stripe-checkout-currency`/`ai-payments.util`/`ai-list-services-payment-filters` (200 tests): all pass. Confirmed via full golden-eval-set diff (225 → 219 failures) that exactly these 6 target ids disappeared with zero new ids added; a broader sweep surfaced 2 pre-existing unrelated failures (`ai-payments-dispatch.build.spec.ts`'s stale hardcoded dispatch-map-size assertion, and the known `reschedule_booking` vs `confirm_my_booking_details` case), both confirmed identical with and without this change via `git stash`.

---



## ai-cmd-ext-4.5+ — Dashboard compounds (checkout & onboarding)

Multi-step recipes in `buildCompoundCommandRecipes()` + `intent-decomposition.util.ts`. Each needs classifier compound rules, rescue, eval `compoundSteps`, and confirmation preview.


| ID                 | Recipe                              | Steps (high level)                                                                                                                                     | Priority |
| ------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **ai-cmd-ext-4.5** | `setup_salon_checkout`              | `configure_stripe_connect` (explain) → `configure_cash_payments` → `configure_service_online_payment` (all services, 50%) → `configure_online_booking` | **P0**   |
| **ai-cmd-ext-4.6** | `configure_services_payment_matrix` | `update_service_prices` optional → `configure_service_online_payment` per category → `configure_cash_payments`                                         | **P1**   |
| **ai-cmd-ext-4.7** | `decline_online_payment_category`   | `configure_service_online_payment` (prepaymentMode none) scoped — single-step today; compound when paired with “enable for others”                     | **P1**   |
| **ai-cmd-ext-4.8** | `onboard_salon_notifications`       | `configure_notification_settings` → `configure_whatsapp_integration` → `test_push`                                                                     | **P2**   |
| **ai-cmd-ext-4.9** | `launch_consumer_app_growth`        | `explain_tenant_app_install` → `regenerate_tenant_app_install_qr` → `configure_marketing_registration_email`                                           | **P2**   |


- [x] **ai-cmd-ext-4.5** — `setup_salon_checkout`
- [x] **ai-cmd-ext-4.6** — `configure_services_payment_matrix`
- [x] **ai-cmd-ext-4.7** — `decline_online_payment_category` (accept/decline split in one message)
- [x] **ai-cmd-ext-4.8** — `onboard_salon_notifications`
- [x] **ai-cmd-ext-4.9** — `launch_consumer_app_growth`

---



## ai-cmd-ext-5 — Param extensions on existing handlers (quick wins)

Extend `ai-cmd-ext-1` pattern — no new verb; enrich params + rescue on existing actions.


| ID                 | Action                    | New params                                   | Handler              | Example prompt                                                               |
| ------------------ | ------------------------- | -------------------------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| **ai-cmd-ext-5.1** | `list_services`           | `prepaymentMode`, `onlinePaymentEnabled`     | `handleListServices` | “List services that require online payment”                                  |
| **ai-cmd-ext-5.2** | `create_service`          | `prepaymentMode`, `depositPercent`           | catalog create       | “Add massage $80 with 50% online prepayment”                                 |
| **ai-cmd-ext-5.3** | `create_services`         | same as **5.2** per row                      | bulk create          | Menu import + payment policy                                                 |
| **ai-cmd-ext-5.4** | `update_service_prices`   | `onlyWithOnlinePayment` filter               | operations           | “Raise prices 10% for services with online payment only”                     |
| **ai-cmd-ext-5.5** | `deactivate_service`      | `categoryName`, `allInCategory`              | catalog              | “Deactivate all dental services”                                             |
| **ai-cmd-ext-5.6** | `configure_cash_payments` | document pairing with **2.13** in classifier | payments             | “Enable cash and decline online payment for all services” → compound **4.7** |


- [x] **ai-cmd-ext-5.1** — `list_services` payment filters
- [x] **ai-cmd-ext-5.2** — `create_service` prepayment on create
- [x] **ai-cmd-ext-5.2.1** — Fixed all 12 pre-existing failing `create-service-prepayment-add-*` eval cases. Root cause: `enrichCreateServicePrepaymentParamsFromPrompt` (`ai-create-service-prepayment.util.ts`) only ever populated the prepayment-specific fields (`prepaymentMode`/`depositPercent`/`depositAmount`) via `parseCreateServicePrepaymentFromPrompt` — it never extracted the base service-creation fields (`serviceName`/`durationMinutes`/`price`) at all, so every fixture like `"Add massage 60 minutes $80 with 50% online prepayment"` resolved the action/prepayment fields correctly but left the core fields `undefined`. Traced the call chain (`AiIntentRescueService.tryRescueCreateServicePrepayment` → this enrich function only, never the fuller `enrichCreateServiceParamsFromPrompt` from `ai-catalog.util.ts` that the *non-prepayment* create_service path uses) to confirm this was a real production gap, not just an eval-harness wiring issue (verified via a scoped debug spec calling the full `AiIntentRescueService.rescue()` pipeline directly). Considered reusing `ai-catalog.util.ts`'s `extractCreateServiceNameFromPrompt`, but it hard-requires a `service|offering|treatment` noun between the verb and the name (`"Create service Facemassage 60min $50"` works, but `"Add massage 60 minutes $80"` — no noun word — doesn't), so half the fixtures still wouldn't have resolved a name via that path anyway. Instead added a small, self-contained `extractCreateServiceLineFromPrompt` in `ai-create-service-prepayment.util.ts` mirroring `ai-catalog.util.ts`'s `SERVICE_LINE` "name duration price" regex shape, but with the noun word made optional (`(?:(?:service|offering|treatment)s?\s+(?:called\s+|named\s+)?)?`) so it matches both bare (`"Add massage 60 minutes $80"`) and noun-qualified (`"Create service Facemassage 60min $50"`) phrasings in one pattern — merged into the enrich function additively (`params.x ?? line.x`, never overwriting an already-set field). Updated one now-outdated unit assertion in `ai-create-service-prepayment.util.spec.ts` that used a strict `toEqual({ prepaymentMode: 'none' })` (pre-dating this fix, when the function intentionally only touched prepayment fields) to include the newly-and-correctly-extracted `serviceName`/`durationMinutes`/`price`. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-create-service-prepayment`/`ai-catalog`/`ai-service-online-payment`/`ai-intent-rescue` (407 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains (confirmed via prior `git stash` runs). Confirmed via full golden-eval-set diff (295 → 283 failures) that exactly these 12 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-5.3** — `create_services` bulk prepayment
- [x] **ai-cmd-ext-5.3.1** — Fixed all 6 pre-existing failing `create-services-prepayment-bulk-*` eval cases. Action/rescueReason already resolved correctly (`create_services`/`create_services_prepayment`), and each service row already carried its own correct `prepaymentMode`/`depositPercent` — the failure was purely that the GLOBAL, uniform-across-all-rows policy (e.g. "— all with 50% online prepayment") never got surfaced as a top-level `params.prepaymentMode`/`depositPercent` convenience field, only pushed down into each `services[]` entry. Root cause in `enrichCreateServicesPrepaymentParamsFromPrompt` (`ai-create-service-prepayment.util.ts`): the top-level merge guarded on `enrichedRows.every((row) => !row.prepaymentMode)` — i.e. "only expose the global field at the top level if none of the rows ended up with their own prepaymentMode" — but since the global policy is *also* propagated into every row a few lines earlier, that condition was structurally always false whenever a genuine uniform global policy existed, so the top-level field could never actually fire; `depositPercent`/`depositAmount` were missing from the top-level merge entirely, not even conditionally. Fixed by unconditionally propagating `globalParsed`'s `prepaymentMode`/`depositPercent`/`depositAmount` to the top level whenever present (mirroring the same fields already being pushed into each row) — verified safe against the file's own `bulk-per-row-mixed-en` fixture (genuinely mixed per-row policy, no `paramsPartial` assertion at all, so no expectation of top-level uniformity to conflict with). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-create-service-prepayment`/`ai-create-services-prepayment`/`ai-catalog`/`ai-intent-rescue` (222 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (237 → 231 failures) that exactly these 6 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-5.4** — `update_service_prices` scoped by online payment
- [x] **ai-cmd-ext-5.5** — `deactivate_service` category scope
- [x] **ai-cmd-ext-5.5.1** — Fixed 19 pre-existing failing eval cases across two sibling clusters, `deactivate-service-category-scope-*` (8) and `bulk-assign-services-category-*` (8), plus 3 bonus fixes discovered as the same bug's blast radius (`configure-service-featured-featured-massage-category`, `service-deposit-policy-deposit-policy-all-services`, `service-deposit-policy-premium-tier-all-25`). Root cause (shared by 16 of the 19): `isStaffServiceMatrixPrompt` (`ai-operations.util.ts`) had a bare catch-all alternative — `/\ball\b.+\b(?:services?|color|massage|stylist)/i` — that fired on ANY prompt containing "all" followed anywhere later by "services"/"color"/"massage"/"stylist", regardless of order or structure; since `isStaffServiceMatrixPrompt` is checked inside `rescueOperationsIntent`, which runs (via `tryRescueOperations`) *before* `tryRescueCatalog` — the phase that actually owns `deactivate_service_category_scope`/`bulk_assign_services_category`/`configure_service_featured` (`ai-catalog.util.ts`) — this stole all of those dashboard catalog prompts as `staff_service_matrix`/`operations_booking_ops` before the correct, already-implemented rescue functions ever got a chance. Verified via the function's own unit test (`ai-operations.util.spec.ts`) that every fixture asserting `true` (`"Assign all color services to senior stylists only"`, `"assign junior stylists only"`) was already covered by the OTHER, narrower alternative (`/\bassign\b.+\b(?:senior|junior|only|matrix)\b/i`) — the broad alternative was pure dead weight causing false positives, never actually load-bearing — so removed it outright rather than trying to patch around it. The remaining 3 of 19 (`deactivate-...-remove-all-skin-category`, `...-remove-all-nail-services`, `bulk-assign-...-from-spa-to-wellness`) were a *second*, unrelated collision surfaced once the first was fixed: `isUnassignServicesFromProviderPrompt` and `isTransferServicesBetweenProvidersPrompt` (`ai-category-assignment.util.ts`) both use generic "from/to `<Word> <Word>`" regexes meant to capture a provider's name (e.g. "from Gevorg Gasparyan"), which also matched non-person destinations like "from public booking" and "from Spa category to Wellness category" — added a narrow `from (the )?public booking` exclusion to the former, and a `category...to...category` (both sides) exclusion to the latter, verified safe against every existing provider-transfer/unassign fixture (all mention "category" only once per prompt, never twice around a `from...to...`). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-operations`/`ai-category-assignment`/`ai-deactivate-service-category-scope`/`ai-bulk-assign-services-category`/`ai-service-deposit-policy`/`ai-service-online-payment`/`ai-scheduling-dashboard-classifier` (638 tests): only the one already-known pre-existing, unrelated `reschedule_booking` vs `confirm_my_booking_details` failure remains. Confirmed via full golden-eval-set diff (283 → 264 failures) that exactly these 19 target ids disappeared with zero new ids added.
- [x] **ai-cmd-ext-5.6** — cash + online compound classifier disambiguation

---



## ai-cmd-ext-6 — Orchestrator scale (parallel track)

Unblocks adding **2.14+** without growing `ai-command.service.ts` further (~11k LOC today).

- [x] **ai-cmd-ext-6.1** — Extract payment/catalog/settings handlers from `AiCommandService` switch → `AiDashboardCoreService` / domain services (**extends ai-cmd-ext-0.4**)
- [x] **ai-cmd-ext-6.2** — Registry-driven dispatch map (`Map<intent, handlerFn>`) for all `handler: 'AiPaymentsService'` intents first (**extends ai-cmd-ext-0.5**)
- [x] **ai-cmd-ext-6.3** — Split `INTENT_SCHEMA` appendix into domain imports only (no inline prose) — one `*_CLASSIFIER_RULES` import per domain file
- [x] **ai-cmd-ext-6.4** — `test:ai-cmd-ext` coverage report: list registry intents missing ≥10 NL fixtures (**ai-cmd-ext-gap-5** automation)

---



## ai-cmd-ext-7 — Cross-surface parity (when dashboard command is customer-visible)

Only when the configured setting affects public booking or consumer app UX:


| Dashboard intent                   | Customer/public read-only counterpart                              | Status                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configure_service_online_payment` | `explain_why_stripe_required`, `explain_checkout_total` (existing) | **Shipped** — per-service prepayment copy on customer + public (**ai-cmd-ext-7.1**); public catalog-context “Do I pay online for this service?” (**ai-cmd-ext-7.2**) |
| `configure_cash_payments`          | `pay_cash_at_visit`, `choose_payment_method` (existing)            | **Shipped** — cash-at-venue copy on customer + public (**ai-cmd-ext-7.3**)                                                                                           |
| `configure_notification_settings`  | `explain_my_notifications` (customer)                              | **Shipped** — salon channel/reminder copy grounded in business settings (**ai-cmd-ext-7.4**)                                                                         |
| `explain_tenant_app_install`       | `how_to_download_app` (customer)                                   | **Shipped** — `/get-app/[slug]` link copy aligned with Growth QR (**ai-cmd-ext-7.5**)                                                                                |


- [x] **ai-cmd-ext-7.1** — Customer/public read prompts when prepayment enabled/disabled (no mutate on those surfaces)
- [x] **ai-cmd-ext-7.3** — Customer/public checkout cash options when `configure_cash_payments` toggles pay-at-venue
- [x] **ai-cmd-ext-7.4** — Customer `explain_my_notifications` copy aligned with salon `configure_notification_settings`
- [x] **ai-cmd-ext-7.5** — Customer `how_to_download_app` copy aligned with salon `/get-app/[slug]` Growth QR
- [x] **ai-cmd-ext-7.2** — Public booking assistant: “Do I pay online for this service?” → explain service `prepaymentMode` from catalog context

---



## Suggested implementation order


| Phase                    | IDs                                      | Rationale                                       |
| ------------------------ | ---------------------------------------- | ----------------------------------------------- |
| **A — Finish in-flight** | **2.13.2**–**2.13.6**, **5.1**, **5.2**  | Complete online payment AI + list/create parity |
| **B — Onboarding**       | **2.15**, **4.5**, **2.14**              | Stripe + checkout setup in one conversation     |
| **C — Settings**         | **2.19**–**2.21**, **4.8**               | Notification + integration configuration        |
| **D — Growth**           | **2.22**–**2.25**, **4.9**               | QR app install + promo/loyalty                  |
| **E — Scale**            | **6.1**–**6.4**, **3.*** (provider wire) | Maintainability + provider matrix               |


**Related sections:** **ai-cmd-ext-0** (hygiene), **ai-cmd-ext-3** (provider dispatch), **ai-cmd-h1**–**h4** (NLU quality), **parity-2.4**, **feature-ai-prompt-coverage** + **feature-test-coverage** skills.

**File map for implementers:**


| Layer            | Path                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| Intent union     | `ai-command-intent-schema.build.ts` ← `DASHBOARD_INTENTS`                    |
| Registry         | `ai-command-registry.build.ts`                                               |
| Classifier rules | domain `*.fixtures.ts` → appended in `ai-command.service.ts` `INTENT_SCHEMA` |
| Execute          | `ai-command.service.ts` `case` → `*.service.ts` → `*.logic.ts`               |
| Rescue           | `ai-intent-rescue.service.ts` + domain `rescue*Intent`                       |
| Eval             | `eval/ai-command-eval.cases.ts`                                              |
| Page chips       | `frontend/src/lib/ai-orchestration.ts` `AI_PAGE_SUGGESTIONS`                 |


---



## ai-cmd-customer-4 — Customer ease-of-life commands (backlog)

**Goal:** Reduce friction for **anonymous public booking** + **logged-in consumer app** users — the questions people ask when they are stressed, on mobile, or booking as a guest. Every row needs **both surfaces where applicable** (see **ai-cmd-customer-0** parity) unless marked customer-only.

**Principle:** Prefer **read/explain + navigate** over mutate when the user is mid-checkout; compound “find → book → pay” only when session carry is explicit.

**Pain themes from product:** guest checkout contact confusion, deposit vs full price, rebook-after-success state, multi-service cart, clinic prep, “what do I owe today?”, tour group capacity, package visit vs single booking, lost manage links, Stripe failures mid-checkout, push/offline on mobile, lab-to-book after order, specialist vs “any provider”, post-visit review prompts.

---



### ai-cmd-customer-4.0 — Promote deferred registry intents (close **CUSTOMER_INTENT_COVERAGE_DEFERRED**)

Many customer-native intents exist in registry + handlers but lack ≥10 NL fixtures + eval — tracked in `ai-customer-intent-coverage.util.ts`. Promote to `CUSTOMER_INTENT_COVERAGE_REQUIRED` with full DoD per **ai-cmd-customer-gap-5**.


| Priority | Intent                                                    | Why it helps customers                  | Surfaces                    |
| -------- | --------------------------------------------------------- | --------------------------------------- | --------------------------- |
| **P0**   | `cancel_my_booking`                                       | Self-serve cancel without calling salon | customer                    |
| **P0**   | `reschedule_my_booking`                                   | Move visit without staff                | customer                    |
| **P0**   | `pay_online`                                              | Finish Stripe after slot pick           | customer (+ public handoff) |
| **P0**   | `explain_why_stripe_required`                             | “Why must I pay now?”                   | customer + public           |
| **P1**   | `book_multi_service` / `check_multi_service_availability` | Spa day / multiple treatments           | customer + public           |
| **P1**   | `use_subscription_credit` / `my_subscriptions`            | Membership visits                       | customer                    |
| **P1**   | `promo_code_help`                                         | Checkout discount confusion             | customer + public           |
| **P1**   | `loyalty_points_balance`                                  | “How many points do I have?”            | customer                    |
| **P2**   | `privacy_export` / `privacy_delete`                       | GDPR self-service                       | customer                    |
| **P2**   | `request_gift_card_cancel`                                | Post-purchase buyer regret              | customer                    |
| **P2**   | `cancel_package_visit` / `reschedule_package_visit`       | Bundle visit self-serve                 | customer                    |
| **P2**   | `list_my_package_visits`                                  | “Visits left on my package”             | customer                    |
| **P3**   | `explain_tour_`* / `diagnose_tour_capacity`               | Tour pax + day-slot UX                  | customer + public           |
| **P3**   | `explain_checkout_recommendations`                        | Product upsell on success               | customer + public           |
| **P3**   | `refer_a_friend` / `share_salon_link`                     | Growth loops                            | customer                    |


- [x] **ai-cmd-customer-4.0.1** — Audit `CUSTOMER_INTENT_COVERAGE_DEFERRED` → prioritize P0 table above
- [x] **ai-cmd-customer-4.0.2** — For each promoted intent: ≥10 EN + HY/RU fixtures, rescue, eval `surface: customer|public`, integration spec row
- [x] **ai-cmd-customer-4.0.3** — Extend `npm run test:ai-customer-intent-coverage` gate as intents graduate from deferred

---



### ai-cmd-customer-4.1 — Before booking (discovery & trust) — **public + customer**


| ID        | Intent (proposed)                     | R/M | Surfaces | Example prompts                                             | Notes                                                                  |
| --------- | ------------------------------------- | --- | -------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| **4.1.1** | `explain_service_price`               | R   | both     | “How much is a haircut?”, “Is massage included in the $80?” | Service card price + tax badge + deposit note; extends `list_services` |
| **4.1.2** | `explain_payment_options_for_service` | R   | both     | “Do I pay online for color?”, “Can I pay cash for massage?” | Reads `prepaymentMode` + `acceptCashPayments`; ties **ai-cmd-ext-7.2** |
| **4.1.3** | `find_soonest_appointment`            | R   | both     | “Who’s free soonest for a trim?”, “Earliest slot this week” | Thin wrapper on `check_availability` + `bookingFirstAvailable`         |
| **4.1.4** | `compare_services`                    | R   | both     | “Haircut vs blowdry price and duration”                     | Read catalog; optional navigate                                        |
| **4.1.5** | `explain_business_hours_and_location` | R   | both     | “When are you open Saturday?”, “Where are you located?”     | Extend `business_info` with maps link + parking copy                   |
| **4.1.6** | `explain_provider_specialty`          | R   | both     | “Who is best for curly hair?”, “Tell me about Anna”         | Extend `recommend_specialists` / provider profile                      |
| **4.1.7** | `filter_services_no_prepayment`       | R   | both     | “What can I book without paying online?”                    | `list_services` + filter `prepaymentMode=none` (**ai-cmd-ext-5.1**)    |


- [x] **ai-cmd-customer-4.1.1** — `explain_service_price`
- [x] **ai-cmd-customer-4.1.2** — `explain_payment_options_for_service`
- [x] **ai-cmd-customer-4.1.3** — `find_soonest_appointment`
- [x] **ai-cmd-customer-4.1.4** — `compare_services`
- [x] **ai-cmd-customer-4.1.5** — `explain_business_hours_and_location`
- [x] **ai-cmd-customer-4.1.6** — `explain_provider_specialty`
- [x] **ai-cmd-customer-4.1.7** — `filter_services_no_prepayment`

---



### ai-cmd-customer-4.2 — During checkout (highest customer pain) — **public + customer**


| ID        | Intent (proposed)               | R/M | Surfaces | Example prompts                                                | Notes                                             |
| --------- | ------------------------------- | --- | -------- | -------------------------------------------------------------- | ------------------------------------------------- |
| **4.2.1** | `explain_amount_due_now`        | R   | both     | “How much do I pay today?”, “Is 50% deposit $40?”              | `prepaymentDue()` semantics; NOT `maxPrice`       |
| **4.2.2** | `explain_guest_checkout_fields` | R   | both     | “Why do you need my email?”, “Can I book without an account?”  | Guest contact merge rules; reduce support tickets |
| **4.2.3** | `resume_pending_payment`        | R   | customer | “Continue my payment”, “I closed the app mid-checkout”         | `PendingCheckoutPayment` / session restore        |
| **4.2.4** | `choose_payment_method`         | M   | both     | “Pay cash at visit”, “Pay online with card”                    | Exists — expand fixtures + compounds              |
| **4.2.5** | `apply_promo_code_checkout`     | M   | both     | “Apply code SAVE10 at checkout”                                | Extend `promo_code_help` with session `promoCode` |
| **4.2.6** | `explain_checkout_steps`        | R   | both     | “Walk me through booking”, “What happens after I pick a time?” | Extend `booking_help` with step list              |
| **4.2.7** | `fix_checkout_validation_error` | R   | both     | “It says enter email but I filled it in”                       | Explain guest/profile merge; link to field hints  |


- [x] **ai-cmd-customer-4.2.1** — `explain_amount_due_now`
- [x] **ai-cmd-customer-4.2.2** — `explain_guest_checkout_fields`
- [x] **ai-cmd-customer-4.2.2.1** — Fixed all 5 pre-existing failing `guest-checkout-fields-*` eval cases. `isExplainGuestCheckoutFieldsPrompt` (`ai-explain-guest-checkout-fields.util.ts`) was already correct for all 5 — every failure was a sibling detector's bare-word collision stealing the prompt first. (1) 3 cases ("Why is my phone required on the booking form?", "Why do you ask for contact details when I confirm my booking?", "Why do you need my email on this booking page?") were stolen by `isConfirmMyBookingDetailsPrompt`'s (`ai-confirm-my-booking-details.util.ts`) extremely broad `READ_CUE`/`BOOKING_CONTEXT` pair — the same over-broad detector already implicated in **ai-cmd-customer-4.4.3.1**'s `reschedule_my_booking` collision this session, now hitting a third domain. Fixed with an `isExplainGuestCheckoutFieldsPrompt` exclusion guard. (2) "Will my guest booking link if I sign in with the same email later?" was stolen by `isRecoverLostManageLinkPrompt`'s (`ai-recover-lost-manage-link.util.ts`) bare "guest" + "booking link" co-occurrence check — fixing this exposed a **second-order regression**: `isExplainGuestCheckoutFieldsPrompt` is ITSELF broad enough (via its own bare "guest" `GUEST_ACCOUNT_TOPIC` match) to also incorrectly swallow a legitimate `recover_lost_manage_link` fixture with real contact info ("I booked as a guest — email me the manage link at mia@salon.com"); a blanket cross-exclusion guard would have broken that fixture. Narrowed the guard to only fire when `extractGuestContactFromPrompt` finds no email/phone in the prompt (a genuine link-recovery request always carries delivery contact info; the guest-checkout-fields FAQ question never does) — verified both directions now resolve correctly. (3) The Armenian "Ինչու է հարկավոր էլ. փոստ checkout-ում" ("Why is email required at checkout") was stolen by `isExplainCheckoutTaxPrompt`'s (`ai-checkout-tax.util.ts`) bare Armenian `հարկ` (tax) substring check — a linguistic false-positive identical in shape to **ai-cmd-dashboard-6.13.2.1**'s "բաց" bug: Armenian "հարկավոր" (necessary/required) contains "հարկ" (tax) as its literal root. Fixed with the same negative-lookahead pattern, `հարկ(?!ավոր)` (verified against the one existing legitimate hy checkout-tax fixture, "Ինչու է հարկը ավելացվում checkout-ում", which still matches since "հարկը" is followed by the definite-article suffix "ը", not "ավոր"). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-confirm-my-booking-details`/`ai-recover-lost-manage-link`/`ai-checkout-tax`/`ai-explain-guest-checkout-fields`/`ai-intent-rescue` (314 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (88 → 83 failures) that exactly these 5 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.2.3** — `resume_pending_payment`
- [x] **ai-cmd-customer-4.2.4** — Harden `choose_payment_method` + `pay_online` deferred promotion
- [x] **ai-cmd-customer-4.2.5** — `apply_promo_code_checkout`
- [x] **ai-cmd-customer-4.2.6** — `explain_checkout_steps`
- [x] **ai-cmd-customer-4.2.7** — `fix_checkout_validation_error`

---



### ai-cmd-customer-4.3 — After booking (confirmation & next steps) — **customer-first, public read**


| ID        | Intent (proposed)                   | R/M | Surfaces | Example prompts                                        | Notes                                                      |
| --------- | ----------------------------------- | --- | -------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| **4.3.1** | `confirm_my_booking_details`        | R   | both     | “What time is my appointment?”, “Summarize my booking” | Read session / last booking                                |
| **4.3.2** | `add_booking_to_calendar`           | R   | both     | “Add to my calendar”, “Send me an ICS”                 | Return calendar deep link / `.ics` URL if product supports |
| **4.3.3** | `get_directions_to_salon`           | R   | both     | “Directions to the salon”, “Where do I park?”          | Maps URL from business address                             |
| **4.3.4** | `explain_preparation_notes`         | R   | both     | “Do I need to fast?”, “What should I bring?”           | Clinic `preparationNotes`, tour meeting point              |
| **4.3.5** | `explain_consumer_checkout_success` | R   | customer | “What’s on the success screen?”                        | **Shipped** — extend HY/RU + public read-only sibling      |
| **4.3.6** | `book_another_service`              | R   | both     | “Book another service same day”                        | Navigate without stale success state (**BookPage** reset)  |
| **4.3.7** | `share_my_booking`                  | R   | customer | “Share my appointment with my partner”                 | **Shipped** in adoption — add eval coverage                |


- [x] **ai-cmd-customer-4.3.1** — `confirm_my_booking_details`
- [x] **ai-cmd-customer-4.3.2** — `add_booking_to_calendar`
- [x] **ai-cmd-customer-4.3.3** — `get_directions_to_salon`
- [x] **ai-cmd-customer-4.3.4** — `explain_preparation_notes`
- [x] **ai-cmd-customer-4.3.5** — HY/RU eval for `explain_consumer_checkout_success`
- [x] **ai-cmd-customer-4.3.6** — `book_another_service` (guard against success-state bug on rebook)
- [x] **ai-cmd-customer-4.3.7** — Full DoD for `share_my_booking`

---



### ai-cmd-customer-4.4 — Manage existing visits — **customer**


| ID        | Intent (proposed)                         | R/M | Surfaces          | Example prompts                                         | Notes                                                                     |
| --------- | ----------------------------------------- | --- | ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| **4.4.1** | `list_my_upcoming_appointments`           | R   | customer          | “What’s my next appointment?”, “Appointments this week” | Filter on `list_my_appointments`                                          |
| **4.4.2** | `cancel_my_booking`                       | M   | customer          | “Cancel tomorrow’s massage”                             | Promote from deferred **4.0**                                             |
| **4.4.3** | `reschedule_my_booking`                   | M   | customer          | “Move my visit to Friday 3pm”                           | Promote from deferred **4.0**                                             |
| **4.4.4** | `explain_cancel_policy`                   | R   | customer          | “Can I cancel for free?”                                | **Shipped** — add fee/deposit forfeiture copy                             |
| **4.4.5** | `get_manage_link`                         | R   | customer          | “Send me a link to change my booking”                   | **Shipped** — guest email/SMS resend variant                              |
| **4.4.6** | `notify_running_late`                     | M   | customer          | “I’m 15 minutes late”                                   | Optional SMS/staff ping if product supports                               |
| **4.4.7** | `join_waitlist` / `check_waitlist_status` | M/R | customer + public | “Notify me if something opens Friday”                   | Needs waitlist customer API parity with dashboard **offer_waitlist_slot** |
| **4.4.8** | `rebook_last_appointment`                 | R   | customer          | “Book the same as last time”                            | **Shipped** in adoption — wire navigate + eval                            |


- [x] **ai-cmd-customer-4.4.1** — `list_my_upcoming_appointments`
- [x] **ai-cmd-customer-4.4.2** — `cancel_my_booking` (full DoD)
- [x] **ai-cmd-customer-4.4.3** — `reschedule_my_booking` (full DoD)
- [x] **ai-cmd-customer-4.4.3.1** — Fixed all 9 pre-existing failing `reschedule-my-booking-*` eval cases. Unlike most clusters this session, this was a PURE routing-collision cluster with zero params-merge gap — `isRescheduleMyBookingPrompt` (`ai-self-service-booking.util.ts`) already correctly matched all 9 prompts, but `rescueSelfServiceBookingIntent`'s own internal dispatch order (not `ai-intent-rescue.service.ts`, since these eval cases use the special `useSurfaceSelfServiceRescue` flag calling `rescueSelfServiceBookingIntent` directly) checks two broader, unrelated detectors earlier in its if-chain. Root cause #1 (7 cases, all using "move"/"change"/"shift" verbs — e.g. "Move my visit to Friday 3pm", "Change my appointment to tomorrow", "Shift my appointment to Friday at 11am"): `rescueConfirmMyBookingDetailsIntent` (`ai-confirm-my-booking-details.util.ts`) is checked first (line ~1161) and its `isConfirmMyBookingDetailsPrompt` detector has an extremely broad `READ_CUE` (bare word "my" is one of its alternatives) combined with an equally broad `BOOKING_CONTEXT` (`my|this|... .* booking|appointment|visit|...`) with **zero verb-type distinction** — any prompt mentioning "my appointment/visit/booking" matched regardless of whether the verb was a read ("what is") or a mutate ("move"/"change"/"shift"). The file already had a `BLOCK_TOPIC` bare-mutate-verb exclusion list including "cancel"/"reschedule", but was missing "move"/"shift" entirely and had no date-anchored carve-out for "change" (a much more generic word, so required co-occurrence with a date/time reference rather than a bare match). Fixed by extending `BLOCK_TOPIC` with bare `move`/`shift`, plus a separate `change ... (?:to|for) ... <date/time>` alternative for the narrower "change" case (verified zero overlap against all `ai-confirm-my-booking-details*fixtures.ts` prompts, none of which use move/change/shift). Root cause #2 (2 cases, "Move my upcoming visit" and "Reschedule my next appointment"): `isListMyUpcomingAppointmentsPrompt` (`ai-list-my-upcoming-appointments.util.ts`) is checked next and has bare `NEXT_CUE` (`next\s+appointment`) and `UPCOMING_CUE` (`upcoming.*visit`) alternatives with the same missing verb-type distinction. Fixed with a narrow `if (/\b(?:reschedule|move|shift)\b/i.test(prompt)) return false;` guard (an inline regex rather than a cross-file `isRescheduleMyBookingPrompt` import, since `ai-self-service-booking.util.ts` already imports FROM both of these two files — importing back would create a circular dependency; verified zero overlap against both `ai-list-my-upcoming-appointments*fixtures.ts` files). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-confirm-my-booking-details`/`ai-list-my-upcoming-appointments`/`ai-self-service-booking`/`ai-reschedule-my-booking`/`ai-intent-rescue` (255 tests): only the one already-known pre-existing `reschedule_booking` vs (now) `find_soonest_appointment` failure remains — same pre-existing unit test, still failing both before and after this change (confirmed via `git stash`), just landing on a different wrong action since this fix closed off the `confirm_my_booking_details` path it had been falling into. Confirmed via full golden-eval-set diff (118 → 109 failures) that exactly these 9 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.4.4** — Enrich `explain_cancel_policy` (deposit forfeiture)
- [x] **ai-cmd-customer-4.4.5** — Guest `get_manage_link` via email/phone lookup
- [x] **ai-cmd-customer-4.4.6** — `notify_running_late` (product-dependent)
- [x] **ai-cmd-customer-4.4.7** — Customer waitlist join/status
- [x] **ai-cmd-customer-4.4.8** — Full DoD for `rebook_last_appointment`

---



### ai-cmd-customer-4.5 — Account, loyalty, subscriptions — **customer**


| ID        | Intent (proposed)                 | R/M | Surfaces          | Example prompts                                      | Notes                                                                 |
| --------- | --------------------------------- | --- | ----------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| **4.5.1** | `explain_loyalty_points`          | R   | customer          | “How do I earn points?”, “What are my points worth?” | Extend `loyalty_points_balance`                                       |
| **4.5.2** | `apply_loyalty_at_checkout`       | M   | customer          | “Use my points on this booking”                      | Checkout mutation                                                     |
| **4.5.3** | `explain_my_subscription`         | R   | customer          | “How many visits left on my plan?”                   | `my_subscriptions` + `subscription_usage`                             |
| **4.5.4** | `manage_notification_preferences` | M   | customer          | “Text me not email”, “Turn off reminders”            | **Shipped** in adoption — eval HY/RU                                  |
| **4.5.5** | `explain_my_notifications`        | R   | customer          | “Will you WhatsApp me?”                              | **Shipped** — align with salon `configure_notification_settings` copy |
| **4.5.6** | `update_my_profile`               | M   | customer          | “Change my phone number”, “Update my name”           | `my_profile` read exists — mutate gap                                 |
| **4.5.7** | `how_to_download_app`             | R   | customer + public | “Get the app”, “Install on my phone”                 | Link `explain_tenant_app_install` / QR slug                           |


- [x] **ai-cmd-customer-4.5.1** — `explain_loyalty_points`
- [x] **ai-cmd-customer-4.5.2** — `apply_loyalty_at_checkout`
- [x] **ai-cmd-customer-4.5.3** — `explain_my_subscription`
- [x] **ai-cmd-customer-4.5.4** — HY/RU for `manage_notification_preferences`
- [x] **ai-cmd-customer-4.5.5** — HY/RU for `explain_my_notifications`
- [x] **ai-cmd-customer-4.5.6** — `update_my_profile`
- [x] **ai-cmd-customer-4.5.7** — Align app install prompts public ↔ customer
- [x] **ai-cmd-customer-4.5.8** — HY/RU `my_subscriptions` — fixed 6 pre-existing failing `promotion-i18n-my-subscriptions-*` eval cases, same "zero non-English coverage" shape as **ai-cmd-customer-4.6.6** (`request_gift_card_cancel`). Root cause: `isMySubscriptionsPrompt` (`ai-customer-crm.util.ts`) required literal English "subscription/membership/plan" words for its `mentionsMembership` gate — Armenian/Russian native words (`բաժանորդագրություն`/`պլան`, `подписка`/`план`) never satisfied it, so prompts with no English loanword at all (3 of 6 fixtures) returned "none" outright. Extended `mentionsMembership` with `բաժանորդագր|պլան` / `подписк|план`, and added the same broad "non-Latin script implies self-scope + read-intent" fallback used in **4.6.6**/**4.15.1** to the final return (safe for the identical reason: no dashboard-admin equivalent phrased in those scripts, and `hasDashboardCustomerReference` already screens out admin-tone asks). Verified the sibling `isExplainMySubscriptionPrompt` (checked as an early bail-out inside this function) doesn't falsely claim any of the 6 target prompts — its Armenian/Russian fuzzy "explain" cue requires `բացատր`/`объясн`-type words that none of the 6 contain. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-customer-crm`/`ai-explain-my-subscription` (92 tests) + eval spec: all pass except the same pre-existing eval-suite failure. Found (but did not fix, out of scope) a sibling gap in the same file: `explain_why_stripe_required` HY/RU cases (6) fail — HY misroutes to `diagnose_stripe_checkout_failure`, RU resolves to nothing at all; flagged separately.

---



### ai-cmd-customer-4.6 — Multi-service, packages, gift cards — **both**


| ID        | Intent (proposed)                | R/M | Surfaces | Example prompts                                 | Notes                                         |
| --------- | -------------------------------- | --- | -------- | ----------------------------------------------- | --------------------------------------------- |
| **4.6.1** | `explain_multi_service_cart`     | R   | customer | “How long is my spa day?”, “What’s in my cart?” | `show_cart_total_duration` exists — enrich    |
| **4.6.2** | `book_package_with_nearest_slot` | M   | both     | “Book the spa package earliest available”       | Compound `discover_packages` → `book_package` |
| **4.6.3** | `book_with_gift_card`            | M   | customer | “Use my gift card for this booking”             | Promote deferred; disjoint from `maxPrice`    |
| **4.6.4** | `track_gift_card_delivery`       | R   | customer | “Where is my physical gift card?”               | `track_physical_gift_card_order` — eval       |
| **4.6.5** | `explain_package_savings`        | R   | both     | “Is the bundle cheaper than separate?”          | Read package lines vs à la carte              |


- [x] **ai-cmd-customer-4.6.1** — `explain_multi_service_cart`
- [x] **ai-cmd-customer-4.6.2** — `book_package_with_nearest_slot` compound
- [x] **ai-cmd-customer-4.6.3** — `book_with_gift_card` full DoD
- [x] **ai-cmd-customer-4.6.4** — Gift card delivery tracking eval
- [x] **ai-cmd-customer-4.6.5** — `explain_package_savings`
- [x] **ai-cmd-customer-4.6.10** — Audited ~44 test/fixture files across `backend/src/modules/ai/` for hardcoded near-future dates used as "must be in the future" test inputs (the same time-bomb shape found in `ai-cancel-package-visit-self.util.spec.ts`/`ai-reschedule-package-visit-self.util.spec.ts`, see **4.6.8**). Ran the full targeted jest sweep across all ~44 candidate files plus a full `modules/ai/` suite run to find every case ACTUALLY failing right now (rather than guessing from the date string alone, since most such dates aren't compared against wall-clock time at all). Found and fixed 2 more genuine failures, both sharing one fixtures object: `ai-resume-booking-draft.fixtures.ts`'s `RESUME_BOOKING_DRAFT_HANDLER_FIXTURES` and a duplicated inline draft in `ai-resume-booking-draft.integration.spec.ts` both hardcoded `updatedAt: '2026-06-28T12:00:00.000Z'` as "recently saved" — `isBookingDraftStale` (`ai-resume-booking-draft.util.ts`) treats any draft older than ~7 days as expired, so once real time passed that window the tests started asserting `success: true` on a handler that now correctly returns `stale: true`. Fixed both to `new Date(Date.now() - 60 * 60 * 1000).toISOString()` (1 hour ago), so they can't rot again. No other files among the ~44 are currently failing — confirmed via a full `modules/ai/` run (111 failures/45 suites, down from the session-start baseline of 190/53, and none of the remaining failures are date-related). Left the other ~40 files untouched since their hardcoded dates aren't causing active failures and touching passing tests unnecessarily was explicitly out of scope for this pass. tsc holds at known baseline (1362, no new-file diffs).
- [x] **ai-cmd-customer-4.6.11** — HY/RU `pay_online` — fixed 6 pre-existing failing `promotion-i18n-pay-online-*` eval cases. Two distinct root causes in two files: (1) `isExplicitPayOnlinePrompt` (`ai-pay-online-checkout.util.ts`) had zero Armenian/Russian detection at all, so the plain "pay online"/"finish checkout by card" HY/RU prompts (4 of 6 fixtures) resolved to "none" outright — added `վճարել օնլայն`/`оплатить онлайн` plus (finish|continue)+(checkout|payment)+card word-triples for both languages, mirroring the existing English continue-branch structure. (2) `isResumePendingPaymentPrompt` (`ai-resume-pending-payment.util.ts`) had an HY/RU "continue + payment" cue (`շարունակ.{0,20}վճարում` / `продолжить оплату`) that fired unconditionally regardless of whether a card was mentioned — unlike its English sibling, which only treats bare "continue **my** payment" as a resume signal and lets "continue payment **by card**" fall through to `pay_online`. This mis-swallowed the 2 "-card" variant prompts (which legitimately contain "continue"/"продолжить" + payment, but also explicitly mention card) before `pay_online` ever got a chance, since the same substrings are also baked into the broader `RESUME_PAYMENT_CUE` regex used later in the function. Fixed by adding a `hasCardMention` guard (`քարտ|карт`) that (a) skips the direct HY/RU "continue+payment" early-return when a card is mentioned, and (b) added an explicit `if (hasCardMention && isExplicitPayOnlinePrompt(prompt)) return false;` bail-out before the `RESUME_PAYMENT_CUE` fallback path, so an explicit card mention always defers to `pay_online`. Verified via the existing `ai-resume-pending-payment-multilingual.fixtures.ts` scenarios (all 6, none of which mention card) still correctly resolve to `resume_pending_payment` — confirming the guard is card-presence-scoped and doesn't affect genuine resume cases. tsc holds at known baseline (1362, no new-file diffs). Confirmed via `git stash` A/B on both touched files that the full ~465-case golden eval set has the exact same failure list before and after except the 6 target `pay-online` ids disappearing — zero regressions anywhere else in the suite.
- [x] **ai-cmd-customer-4.6.12** — RU `use_subscription_credit` (see **4.16.3**) — fixed 2 pre-existing failing `self-service-i18n-use-subscription-credit-ru*` eval cases. Root cause was a shared, over-broad `HY_RU_SUBSCRIPTION_CHECKOUT_CUE` regex (`ai-explain-subscription-vs-one-time.util.ts`) that included bare noun roots `подписк` (subscription) and `абонемент` (membership) as "checkout compare" signals — not just genuine comparison markers like `разов`/`один визит` (one-time) or `մեկանգամյա`. This regex backs `hasSubscriptionCheckoutCompareCue`, which is imported and used as the **very first** bail-out guard in the *real* production `isUseSubscriptionCreditPrompt` (`ai-self-service-booking.util.ts`) — so any Russian prompt merely mentioning "подписке"/"подписки" (e.g. "Использовать кредит по подписке", "Применить кредит подписки при оплате") got short-circuited to "this is a compare-checkout prompt" and bailed out of `use_subscription_credit` before ever reaching its own (already-correct) RU-aware match branch, then fell through to `explain_subscription_vs_one_time`'s matching HY_RU cue as a false positive. Confirmed via a scoped debug spec that this was two bugs stacked, not one: initially patched the wrong layer (added RU coverage to `isExplainSubscriptionVsOneTimePrompt`'s local `isBareUseSubscriptionCreditMutatePrompt` exclusion helper) and found it had zero effect, because that helper *also* gates on the same `hasSubscriptionCheckoutCompareCue` first — dead code until the shared cue itself was narrowed. Real fix: removed the bare `подписк`/`абонемент` alternatives from `HY_RU_SUBSCRIPTION_CHECKOUT_CUE`, keeping only genuine comparison-signal roots. Verified safe via grep: all 6 `EXPLAIN_SUBSCRIPTION_VS_ONE_TIME_MULTILINGUAL_SCENARIOS` fixtures (including the one relying solely on bare "абонемент", `ru-subscribe-save-checkout`) are matched by exact-string lookup (`matchExplainSubscriptionVsOneTimeScenario`) before the cue regex is ever consulted, so narrowing it doesn't affect any known fixture — only the false-positive generic fallback path. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-subscription-vs-one-time`/`ai-self-service-booking`/`ai-explain-my-subscription`/`ai-subscription-first-visit-compound` (205 tests): 204/205 pass, the 1 remaining failure confirmed pre-existing and unrelated via `git stash` (an already-broken `isUseSubscriptionCreditPrompt('Use my subscription for today massage')` case, out of scope). Confirmed via full golden-eval-set diff (463 vs 465 prior failures) that exactly these 2 target ids disappeared with zero new regressions anywhere else.
- [x] **ai-cmd-customer-4.6.12.1** — Fixed all 4 pre-existing failing `subscription-membership-*` eval cases ("Apply my membership visit", "Apply my subscription to this booking", "I want to use a visit from my membership", "Redeem my membership at this visit"). `isUseSubscriptionCreditPrompt` (`ai-self-service-booking.util.ts`) was already correct for all 4 (confirmed independently true via debug spec) — the actual bug lived one layer up, in the wrapper `rescueMembershipCustomerIntent` (`ai-subscription-membership-customer.util.ts`), which calls `rescueSelfServiceBookingIntent` and then strictly filters `selfService.action === 'use_subscription_credit'`. But `rescueSelfServiceBookingIntent` internally checks `rescueConfirmMyBookingDetailsIntent` before ever reaching `isUseSubscriptionCreditPrompt` (the exact same dispatch-order landmine already hit for `reschedule_my_booking` in **ai-cmd-customer-4.4.3.1**), so all 4 prompts got hijacked to `confirm_my_booking_details` first — and since the wrapper's filter only recognizes an exact `use_subscription_credit` match, the wrong result was silently discarded as `null` rather than surfacing as a wrong-action mismatch, making this cluster read as a total miss ("got none") rather than a collision. Root cause: `isConfirmMyBookingDetailsPrompt`'s bare `READ_CUE`/`BOOKING_CONTEXT` pair (a fifth domain hit by this detector this session) had no exclusion for use/apply/redeem + membership/subscription phrasing. Since `ai-self-service-booking.util.ts` (home of `isUseSubscriptionCreditPrompt`) already imports FROM `ai-confirm-my-booking-details.util.ts`, a cross-file guard in the natural direction would have created a circular import (the same constraint hit for the `reschedule_my_booking` fix) — fixed with an inline `BLOCK_TOPIC` regex addition instead: `\b(?:use|apply|redeem)\b.{0,30}\b(?:membership|subscription)\b` (and its reverse word order), verified against existing fixtures with zero overlap. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-confirm-my-booking-details`/`ai-subscription-membership-customer`/`ai-self-service-booking`/`ai-intent-rescue` (249 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (60 → 56 failures) that exactly these 4 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.13** — `pay_at_venue_fallback` (see **4.18.2**) — fixed all 11 pre-existing failing `pay-at-venue-fallback-*` eval cases, all pure-English prompts (no i18n gap this time — `isPayAtVenueFallbackPrompt` itself, `ai-pay-at-venue-fallback.util.ts`, already matched every one of them correctly in isolation). The real bug was that `rescuePayAtVenueFallbackIntent` is only ever reached from deep inside the giant `rescuePaymentsIntent` dispatcher (`ai-payments.util.ts`), and three *earlier* checks in that same function stole the prompt first — three distinct root causes: (1) `isPaymentsCompoundPrompt` returned `true` for 7 of the 11 prompts (all containing "...and pay..." — e.g. "Confirm and pay at visit instead", "Skip Stripe and pay at the salon") purely because `COMPOUND_SPLIT.test(trimmed)` matched the textual split-point "and pay" (since "pay" is in the compound boundary word list) — but the ACTUAL decomposition (`decomposePaymentsCompoundPrompt`) returned `[]` (zero steps) for every one of them, meaning the "is this really 2+ actions" check was never honored; the function's `return (COMPOUND_SPLIT.test(trimmed) || decompose(trimmed).length > 1)` OR let the unreliable textual heuristic short-circuit the reliable structural one. Fixed by dropping the `COMPOUND_SPLIT.test()` branch entirely — `isPaymentsCompoundPrompt` now only trusts real decomposition. Verified safe against `ai-check-and-book`/`ai-gift-card-payments` compound fixtures, whose `isPaymentsCompoundPrompt(...) === true` assertions all correspond to prompts whose decomposition genuinely yields 2 steps. (2) `isExplicitPayCashAtVisitPrompt` (`ai-cash-payment-checkout.util.ts`) stole 2 more ("I'd rather pay at the venue than online", "Pay at venue, not online") because its online/stripe/card exclusion only recognized *adjacent* `rather\s+than` and `no\s+online`, missing "rather ... [words] ... than online" (gapped) and bare "not online" phrasing entirely — added a gapped `/\brather\b.{0,30}\bthan\b/` alternative and `not\s+online` to the exclusion, mirroring the same gap-tolerant style already used by `ai-pay-at-venue-fallback.util.ts`'s own `INSTEAD_CUE`. (3) `rescueFilterServicesNoPrepaymentIntent` stole "Book without online payment" because `hasCatalogBrowseCue`'s `\bbook\b.{0,30}\bwithout\b` branch (meant for questions like "What can I book without paying online?") also matched the bare imperative "Book without online payment" with no leading question word — narrowed that branch to require the prompt not literally start with "book" (`!/^\s*book\b/i`), which distinguishes the interrogative browse form from the imperative single-action form. **Landmine found and avoided**: first attempted (3) by adding `if (isPayAtVenueFallbackPrompt(prompt)) return false;` directly to `isFilterServicesNoPrepaymentPrompt` — this created infinite mutual recursion (`isPayAtVenueFallbackPrompt` → `isExplainWhyStripeRequiredPrompt` → `isExplainServiceOnlinePaymentSetupPrompt` → `isListServicesPaymentFilterPrompt` → `isFilterServicesNoPrepaymentPrompt` → back to `isPayAtVenueFallbackPrompt`), caught immediately via `RangeError: Maximum call stack size exceeded` in the targeted jest run; reverted in favor of the non-circular `hasCatalogBrowseCue` narrowing above. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-pay-at-venue-fallback`/`ai-cash-payment-checkout`/`ai-filter-services-no-prepayment`/`ai-payments.util`/`ai-check-and-book`/`ai-gift-card-payments` (373 tests): all pass. Confirmed via full golden-eval-set diff (463 → 452 failures) that exactly these 11 target ids disappeared with zero new ids added; full `modules/ai/` suite run dropped from 111 to 107 failing Tests (net improvement, no regressions).
- [x] **ai-cmd-customer-4.6.14** — `apply_promo_code_checkout` (see **4.2.5**) — fixed all 26 pre-existing failing `apply-promo-code-checkout-*` eval cases, all with the identical shape `params.promoCode: expected "X", got undefined` (action/rescueReason were already correct — only the extracted parameter was missing). Two distinct root causes: (1) **Eval-runner wiring gap, not a detector bug** — 22 of 26 (all English cases) failed purely because `ai-command-eval.runner.ts`'s `useSurfaceMarketingGrowthRescue` branch only special-cased param enrichment for `marketingGrowthRescued.action === 'promo_code_help'` (calling `enrichPromoCodeHelpParamsFromPrompt`); the sibling `apply_promo_code_checkout` action fell through to the bare `: {}` default, so the harness never called the already-correct production `enrichApplyPromoCodeCheckoutParamsFromPrompt` (`ai-apply-promo-code-checkout.util.ts`) at all — the real dispatch/handler code path was fine, only the eval harness's params-shaping branch was missing a case. Fixed by adding an `else if` branch calling `enrichApplyPromoCodeCheckoutParamsFromPrompt({}, prompt)` for that action, mirroring the existing `promo_code_help` branch. (2) The remaining 4 HY/RU multilingual cases (`apply-promo-checkout-{hy,ru}-{save10,welcome}`) then surfaced a genuine zero-coverage gap in `extractApplyPromoCodeFromPrompt` itself: Russian phrasing puts the label word before the code ("Применить промокод SAVE10", "Использовать код WELCOME на checkout" — same word-order shape as English, just Cyrillic "промокод"/"код"), while Armenian phrasing puts the code *before* the label ("Կիրառել SAVE10 promo code-ը checkout-ում", "Օգտագործել WELCOME կոդը checkout-ում") — neither shape was covered by the English-only `labeled`/`bare` regexes. Added a `(?:промокод|код)\s+([A-Z0-9_-]{3,})` RU pattern and a `([A-Z0-9_-]{3,})\s+(?:promo\s+code|կոդ)` HY pattern (code-then-label order) to `extractApplyPromoCodeFromPrompt`. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-apply-promo-code-checkout`/`ai-marketing-growth` (79 tests): all pass. Confirmed via full golden-eval-set diff (452 → 426 failures) that exactly these 26 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.15** — Consumer-adoption `params.aspect` wiring gap (see **4.13.3**) — fixed **107** pre-existing failing eval cases across 6 sibling clusters in one shot: `explain-app-update-required-*` (18), `explain-home-screen-widget-*` (18), `explain-analytics-consent-*` (18), `explain-offline-mode-*` (18), `explain-patient-alert-*` (17), `explain-push-permission-*` (18 of 20 — 2 unrelated pre-existing failures in that same domain untouched). Identical root cause to **4.6.14**'s eval-runner branch, but bigger blast radius: `ai-command-eval.runner.ts`'s `useSurfaceConsumerAdoptionRescue` branch hardcoded `params: {}` for **every** action sharing that rescue surface (`explain_app_update_required`, `explain_home_screen_widget`, `explain_analytics_consent`, `explain_patient_alert`, `explain_push_permission`, `explain_offline_mode`, plus a few others that don't carry an `aspect` param and so were unaffected) — none of their already-correct production `parseX...FromPrompt(prompt)` functions (each returning `{ aspect, ... }`, all in their respective `ai-explain-*.util.ts` files) were ever invoked by the harness. Fixed by adding a small `resolveConsumerAdoptionEvalParams(action, prompt)` switch-based helper (new function in `ai-command-eval.runner.ts`, right above `evaluateDeterministicEvalCase`) dispatching to the correct `parse...FromPrompt` per action, and wiring it into the `params:` slot in place of the hardcoded `{}`. Hit one TS structural-typing snag: returning the `Parsed*` interfaces directly failed `Record<string, unknown>` assignability (`error TS2322`) since they're plain interfaces without index signatures — fixed by spreading each into a fresh object literal (`{ ...(parseXFromPrompt(prompt) ?? {}) }`) before returning. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of the 6 `ai-explain-*`/`ai-consumer-adoption`/`ai-command-registry` domains (397 tests): only the 2 pre-existing, unrelated `explain_push_permission` detector failures remain (confirmed via `git stash` on `ai-command-eval.runner.ts` — identical failure before and after). Confirmed via full golden-eval-set diff (426 → 319 failures) that exactly these 107 target ids disappeared with zero new ids added — the single largest fix of this whole hardening pass.
- [x] **ai-cmd-customer-4.6.16** — Fixed all 4 pre-existing failing `apply-loyalty-at-checkout-*` eval cases. Three stacked root causes, in the order found. (1) **Missing-params-merge gap** in `tryRescueMarketingGrowth` (`ai-intent-rescue.service.ts`, the same private if/else-if chain extended for `configure_stripe_connect` in **ai-cmd-ext-2.15.1**): `rescueApplyLoyaltyAtCheckoutIntent` returns only `{action, rescueReason}`, while the already-correct `enrichApplyLoyaltyAtCheckoutParamsFromPrompt` (`ai-apply-loyalty-at-checkout.util.ts`, resolves `loyaltyPointsToRedeem`) existed but was never invoked — added an `apply_loyalty_at_checkout` branch calling it. (2) **Blanket-domain-bail-out** in `rescueMarketingGrowthIntent` (`ai-marketing-growth.util.ts`): the same structural bug first found for `how_to_download_app` (**ai-cmd-ext-2.22.1**) — its `if (isMarketingGrowthIntent(action)) return null;` blanket check assumed any already-marketing-growth-classified action must be correct, silently discarding the 3 "misclassified" rescue-scenario cases (prompts pre-classified as `loyalty_points_balance`/`explain_loyalty_points`/`apply_promo_code_checkout` that are actually `apply_loyalty_at_checkout`). Fixed by moving the `rescueApplyLoyaltyAtCheckoutIntent` call to run before the blanket bail-out, preserving the established relative order (`regenerateTenantQr` → `downloadApp` → `applyLoyalty`, all pre-bail-out), and removing the now-dead duplicate call further down the function. (3) **Collision**: `isConfirmMyBookingDetailsPrompt`'s bare `READ_CUE`/`BOOKING_CONTEXT` pair (`ai-confirm-my-booking-details.util.ts`) stole 2 of the 4 prompts — the **sixth** domain this exact detector has collided with this session (after `reschedule_my_booking`, `explain_guest_checkout_fields`, `explain_clinic_booking`, `use_subscription_credit` in **4.6.12.1**, and now this). Extended its `BLOCK_TOPIC` regex with `\b(?:use|apply|redeem)\b.{0,30}\b(?:membership|subscription|loyalty|reward|points?)\b` (and reverse word order); verified zero overlap with existing fixtures via grep. (4) **Eval-runner wiring gap** — after (1)-(3) fixed, `apply-loyalty-at-checkout-apply-10-points-customer` (`params.loyaltyPointsToRedeem: expected 10, got undefined`) still failed because this eval case uses `useSurfaceMarketingGrowthRescue: true`, which makes the eval RUNNER (`ai-command-eval.runner.ts`) call `rescueMarketingGrowthIntent` directly, bypassing `ai-intent-rescue.service.ts` (where fix (1) lives) entirely — the exact same class of bug as **4.6.14**/**4.6.15**. The runner's own params-shaping ternary for this surface only special-cased `promo_code_help`/`apply_promo_code_checkout`, falling through to a bare `{}` for every other action; added an `apply_loyalty_at_checkout` branch calling `enrichApplyLoyaltyAtCheckoutParamsFromPrompt({}, prompt)`, mirroring the existing `apply_promo_code_checkout` branch exactly. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-command-eval.runner`/`ai-apply-loyalty-at-checkout`/`ai-marketing-growth`/`ai-intent-rescue`/`ai-confirm-my-booking-details` (223 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (47 → 43 failures) that exactly these 4 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.17** — Fixed all 5 pre-existing failing `clinic-compound-book-*-ru`/`clinic-compound-reserve-lipid-results-ready-ru` eval cases (compound decomposition, second-step mismatch: expected `notify_when_results_ready`, got `explain_result_status`). Root cause: `NOTIFY_ME_CUE` (`ai-notify-when-results-ready.util.ts`), the regex gating both `isNotifyWhenResultsReadyPrompt` and the customer-surface branch of `classifyClinicCompoundSegment` (`ai-clinic-compound.util.ts`), only matched the Russian dative case `\s+мне` after уведом/напиши/сообщи/пришлите/отправьте/скажи — but all 5 failing fixtures use the grammatically-correct accusative "уведоми **меня**" (уведомить requires an accusative object, not dative), which the regex never matched. With `NOTIFY_ME_CUE` false, `isNotifyWhenResultsReadyPrompt` fell through to its `isExplainResultStatusPrompt(text) && !NOTIFY_ME_CUE.test(text)` guard, which then blocked the notify classification and let the segment fall through to the generic `explain_result_status` branch. Fixed by extending the regex to `\s+(?:мне|меня)`. Verified via grep that no existing fixture relies on the old "уведом...мне" (dative) shape being *rejected* — all dashboard-surface "уведоми её/пациента/его" (3rd-person, different action `notify_patient_result_ready`) fixtures are unaffected since they don't match `\s+меня` either. A sibling regex with the identical dative-only gap (`NOTIFY_WHEN_RESULTS_READY_BLOCK` in `ai-notify-when-results-ready.fixtures.ts`, used only by `ai-track-lab-order-status.util.ts`) was left untouched — out of scope, no failing eval case currently exercises it. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-notify-when-results-ready`/`ai-clinic-compound`/`ai-track-lab-order-status`/`ai-explain-my-notifications` (444 tests): all pass. Confirmed via full golden-eval-set diff (43 → 38 failures) that exactly these 5 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.18** — Fixed 7 pre-existing failing eval cases across 5 different domains (`package-currency-why-package-dram`, `provider-payment-currency-why-appointment-rubles`, `provider-payment-currency-why-collect-cash-currency`, `stripe-checkout-currency-what-currency-stripe-charge`, `stripe-checkout-currency-why-dollar-card-charge`, `booking-languages-why-no-russian`, `tour-consumer-hy-day-fully-booked`), all misclassified to `confirm_my_booking_details` — the **seventh** distinct domain this exact detector has collided with this session (after `reschedule_my_booking`, `explain_guest_checkout_fields`, `explain_clinic_booking`, `use_subscription_credit`, `apply_loyalty_at_checkout`, and now this 5-domain batch in one shot). All 5 target detectors (`isExplainPackageCurrencyPrompt`, `isExplainProviderPaymentCurrencyPrompt`, `isExplainStripeCheckoutCurrencyPrompt`, `isExplainBookingLanguagesPrompt`, `isExplainTourDaySlotsPrompt`) were already correct for their respective prompts (confirmed via debug spec) — `isConfirmMyBookingDetailsPrompt` (`ai-confirm-my-booking-details.util.ts`) simply never had exclusion guards for any of these 5 detectors, even though it already imported/excluded sibling currency detectors (`isExplainNotificationCurrencyPrompt`, `isExplainTenantCurrencyPrompt`) — the file had grown incrementally per-domain rather than covering the full currency/language/tour-slots "why"-question family at once. Its bare `READ_CUE`/`BOOKING_CONTEXT` pair matches any prompt combining a question word ("why"/"what") with "this"/"my" + "booking"/"appointment"/"service" — which every one of these 7 prompts does (e.g. "Why is this service package shown in dram?", "What currency does Stripe charge for my booking?"). Fixed by adding all 5 imports and 5 exclusion guards (right after the existing `isExplainTenantCurrencyPrompt` guard) — verified zero circular-import risk for all 5 target files (none import `ai-confirm-my-booking-details.util.ts` directly or transitively through their own import chains, checked via grep). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-confirm-my-booking-details`/`ai-package-currency`/`ai-provider-payment-currency`/`ai-stripe-checkout-currency`/`ai-booking-languages`/`ai-tour-day-slots` (222 tests): all pass. Confirmed via full golden-eval-set diff (38 → 31 failures) that exactly these 7 target ids disappeared with zero new ids added — the biggest single-detector collision batch fixed in one pass this session.
- [x] **ai-cmd-customer-4.6.19** — Fixed 3 pre-existing failing eval cases across 2 domains (`date-input-provider-format-hy-explain-typed-field-parse`, `date-input-provider-format-hy-preview-parse-0406`, `notification-currency-why-dram-reminder`), all misclassified to `explain_why_sign_in`. A new bare-word offender, structurally identical to `isConfirmMyBookingDetailsPrompt`'s recurring pattern but in a different detector: `isExplainWhySignInPrompt`'s (`ai-explain-why-sign-in.util.ts`) `hasExplainWhySignInCue` fallback (`ACCOUNT_SIGN_IN_TOPIC && READ_CUE`) has two independent bare-substring gaps — `ACCOUNT_SIGN_IN_TOPIC` includes bare Armenian `մուտք` (meaning both "login" and "data entry"), which substring-matched inside `մուտքագրվող`/`մուտքը` (unrelated "date-entry field" words) in the 2 HY date-input-format prompts; separately, its bare English `my\s+appointments?` alternative matched "on **my appointment** reminder" in the notification-currency prompt, even though that prompt is about currency display, not account/sign-in status. `READ_CUE`'s bare "how"/"why"/"ինչպես" then supplied the second half of the AND condition for all 3. All 3 target detectors (`isExplainDateInputFormatPrompt`, `isPreviewDateInputParsePrompt` in `ai-date-input-format.util.ts`, `isExplainNotificationCurrencyPrompt` in `ai-notification-currency.util.ts`) were already correct in isolation. Fixed by adding all 3 as exclusion guards in `isExplainWhySignInPrompt`, placed before the `matchExplainWhySignInScenario` exact-match fast path (mirroring the existing `isExplainProviderDateDisplayPrompt`/`isExplainTenantCurrencyPrompt` guards already in the same chain) — verified zero circular-import risk (neither target file imports `ai-explain-why-sign-in.util.ts`, directly or transitively). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-why-sign-in`/`ai-date-input-format`/`ai-notification-currency`/`ai-date-input-provider-format` (110 tests): all pass. Confirmed via full golden-eval-set diff (31 → 28 failures) that exactly these 3 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.20** — Fixed 4 pre-existing failing eval cases across 2 lab-booking clusters (`book-lab-from-order-book-order-ord-42`, `book-lab-from-order-rescue-misclassified-list`, `list-my-lab-booking-requests-my-lab-to-book`, `list-my-lab-booking-requests-account-lab-book`), plus navigated a self-inflicted regression along the way. Two independent, unrelated collisions in the customer clinic-lab-booking domain (`ai-clinic-lab-booking.util.ts` / `ai-book-lab-from-order.util.ts`), both already correctly diagnosed via `rescueConsumerClinicLabBookingIntent` in isolation but stolen upstream by two DIFFERENT generic detectors, neither of which is `isConfirmMyBookingDetailsPrompt` for once: (1) `isStaffBookLabCollectionPrompt` (`ai-clinic-lab-booking.util.ts`) — its `STAFF_BOOK_TARGET` alternative `collection\s+for` bare-matched "Book collection **for** lab order ord-42" as a dashboard-staff booking action (with zero signal distinguishing customer self-service from staff-assigns-a-slot), stealing it via `tryRescueDashboardClinicLabBooking`, which runs before the consumer check in the rescue pipeline. (2) `isPickProviderForServicePrompt` (`ai-pick-provider-for-service.util.ts`) — its generic "book X for Y" named-provider extractor parsed "Book collection **for my** lab order" as `providerName: "collection"`, `serviceName: "my lab order"`, stealing it via a much-later `tryRescueBusinessLanguages` catch-all in the classified-disambiguation phase. (3) A THIRD, structurally identical bug then surfaced in `isBookLabFromOrderPrompt` itself (`ai-book-lab-from-order.util.ts`): its `LAB_TO_BOOK_TAB_CUE`-based branch required only a bare "book/schedule/reserve/open" word ANYWHERE in the prompt, which trivially matched the word "book" embedded inside the tab name "lab to book" itself — so pure listing prompts like "My lab to book list" and "Lab to book on my account" (no genuine action verb, just naming the tab) were incorrectly classified as `book_lab_from_order` instead of falling through to the already-correct `list_my_lab_booking_requests` check. Fixed all three: (1) added a `BOOK_LAB_FROM_ORDER_BLOCK` exclusion to `isStaffBookLabCollectionPrompt`, but gated it on the ABSENCE of a genuine time/day cue (`STAFF_BOOK_LAB_ORDER_TIME_CUE` — tomorrow/today/weekday/AM-PM/HH:MM), since one legitimate dashboard fixture ("Schedule collection for lab order ord-88 at 9:30 tomorrow") also incidentally matches the same "book...lab order" shape but is a genuine staff scheduling action distinguished only by carrying an explicit time; (2) added an `isBookLabFromOrderPrompt` exclusion to `isPickProviderForServicePrompt` (zero circular-import risk, verified via grep); (3) added a new `LAB_TO_BOOK_LIST_REFERENCE_BLOCK` regex (anchored bare "(my) lab to book (list|tab|page)" / "lab to book on/in my account" patterns) as an exclusion in `isBookLabFromOrderPrompt`, gated on absence of `BOOK_LAB_ORDER_CUE` to preserve genuine booking-verb prompts. **Landmine hit and reverted**: my FIRST attempt at fix (1) was to reorder `runRescueUnknownPhase` in `ai-intent-rescue.service.ts` to run the consumer clinic-lab-booking check before the dashboard one (removing what looked like now-dead duplicate calls further down) — this fixed the 2 target `book-lab-from-order` cases but silently broke 11 OTHER previously-passing cases in the same file (`clinic-patient-chart-*`, `clinic-test-result-*`, `clinic-v2-dashboard-*`, `clinic-v2-public-explain-*`, `list-patient-pending-lab-*`, `staff-book-lab-collection-*`) because several intermediate checks between the dashboard and consumer calls (patient chart, test result entry, provider clinic collection, track lab order status, etc.) depended on dashboard running first for entirely unrelated dashboard-surface prompts that also happen to satisfy the consumer check's now-earlier match. Caught via full eval diff showing net +7 failures instead of -4; reverted the reorder and the duplicate-call removal completely, then re-diagnosed via `runRescueClassifiedPhase`/direct-call tracing to find the TRUE root cause (the `isStaffBookLabCollectionPrompt`/`isPickProviderForServicePrompt` collisions) without touching dispatch order at all. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-book-lab-from-order`/`ai-clinic-lab-booking`/`ai-pick-provider-for-service`/`ai-intent-rescue`/`ai-book-lab-collection-nearest`/`ai-clinic-patient-chart`/`ai-clinic-test-result`/`ai-clinic-v2` (1067 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (28 → 24 failures) that exactly these 4 target ids disappeared with zero new ids added (the 11 previously-regressed ids were re-confirmed passing after the revert). Note: `book-lab-collection-nearest-lab-collection-nearest-customer-hy` (a compound-decomposition case in the same domain) was investigated but found to have a genuinely different root cause (compound-recipe matching order, not a simple rescue collision) — left for a future cluster.
- [x] **ai-cmd-customer-4.6.21** — Fixed 2 pre-existing failing eval cases (`business-currency-ru-bulk-sync-default`, `tenant-currency-why-dollar-app-prices`), both misclassified to `explain_offline_mode`. Two independent bare-word overreaches in `isExplainOfflineModePrompt` (`ai-explain-offline-mode.util.ts`), one per prompt: (1) its Cyrillic bare-word branch required an "offline-signal" word (from a list including `синхрониз`) AND a "confusion/question" word (from a SECOND list that ALSO includes `синхрониз`) — since the same word appears in both alternations, any prompt containing "Синхронизировать" (to synchronize) trivially satisfied the AND condition using that one word alone, with zero genuine offline-mode context required; this misrouted "Синхронизировать валюту услуг с валютой по умолчанию" (sync service currency to the default — a legitimate `bulk_update_service_currency` action) away from its correct target. (2) `CONSUMER_OFFLINE_CUE`'s bare `consumer\s+app|this\s+app` alternative (meant for "why does consumer app say offline") matched ANY sentence merely mentioning "the consumer app", including "Why does the consumer app show dollar prices for this salon?" — a currency question with no offline/sync content at all. Both target detectors (`isBulkUpdateServiceCurrencyPrompt` in `ai-business-currency.util.ts`, `isExplainTenantCurrencyPrompt` in `ai-tenant-currency.util.ts`) were already correct in isolation. Fixed by adding both as exclusion guards in `isExplainOfflineModePrompt`, placed before the `matchExplainOfflineModeScenario` fast path (mirroring the established guard-ordering convention used throughout this file) — verified zero circular-import risk (neither target file imports `ai-explain-offline-mode.util.ts`). Did not touch the self-referential `синхрониз`-in-both-lists redundancy directly, since the added exclusion guard already neutralizes its only known false-positive trigger. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-offline-mode`/`ai-business-currency`/`ai-tenant-currency` (202 tests): all pass. Confirmed via full golden-eval-set diff (24 → 22 failures) that exactly these 2 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.22** — Fixed 3 pre-existing failing eval cases (`clinic-booking-hy-customer-fasting`, `clinic-booking-ru-customer-fasting`, `clinic-service-ru-explain-fasting-labs`) across a 3-way collision chain in the HY/RU clinic-fasting domain (`ai-clinic-booking.util.ts` / `ai-clinic-service.util.ts` / `ai-explain-preparation-notes.util.ts`). Root causes, in the order found: (1) **Blanket-domain-bail-out** (the same structural pattern as `how_to_download_app`/`apply_loyalty_at_checkout` earlier this session): `CONSUMER_LAB_PREP_EXPLAIN` in `isExplainClinicBookingPrompt` (`ai-clinic-booking.util.ts`) blanket-blocked ANY "do I need to fast for this test" style prompt, assuming it always belongs to a different domain (`explain_lab_prep`) — but the classifier rules for `explain_lab_prep` explicitly scope it to generic catalog-browsing questions, NOT "this test" booking-flow-specific questions (which belong to `explain_clinic_booking` per its own doc comment: "this blood draw on checkout"). Fixed by adding a `THIS_TEST_BOOKING_REFERENCE` exception (bare "this test/lab/blood draw", "այս թեստ/լաբ", "этим анализом/тестом") so the bail-out only fires for genuine generic-catalog phrasing, letting "this"-referencing prompts fall through to the already-correct `PREPARATION_TOPIC` branch further down the same function. (2) **Bare-word overreach, self-trivializing AND**: `hasClinicExplainSurface` (`ai-clinic-service.util.ts`, backing `isExplainClinicServicesPrompt`) had bare Armenian `ծոմավոր` and bare Russian `голод` in its catalog-signal word list — meaning ANY prompt merely mentioning fasting (regardless of catalog vs. personal-visit vs. checkout context) trivially satisfied `isExplainClinicServicesPrompt`, stealing both the `explain_clinic_booking` prompts above AND unrelated `explain_preparation_notes` fixtures ("Do I need to fast before my visit?"). Narrowed both bare words to require genuine catalog-interrogative co-occurrence (`(ինչ|որ)\s+(լաբ|ծառայ)...ծոմավոր` / `(какие|какой|который)\s+(лабораторн...|услуг...)...голод`), mirroring the already-correct English `(which|what)...fasting` structure in the same function — verified via grep that the sole existing fixture relying on the bare Russian match (`ru-explain-fasting-labs`, "Какие лабораторные тесты требуют голодания") is independently preserved by the pre-existing bare `лабораторн` alternative, so no fixture regressed. (3) **Missing exclusion guard** (the now-familiar pattern, 8th+ time this session): `isExplainPreparationNotesPrompt` (`ai-explain-preparation-notes.util.ts`) had no exclusion for `isExplainClinicServicesPrompt`, so it kept stealing the dashboard catalog-overview RU case (`clinic-service-ru-explain-fasting-labs`) that `explain_clinic_services` should have owned — added the guard (already imports `ai-clinic-service.util.ts` for `isConfigureClinicServicePrompt`, zero new circular-import risk). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-clinic-booking`/`ai-clinic-service`/`ai-explain-preparation-notes`/`ai-explain-lab-prep`/`ai-intent-rescue` (324 tests): 6 failures, all confirmed pre-existing and identical before/after via `git stash` (unrelated `ai-explain-preparation-notes.logic`/`ai-clinic-booking.logic`/`ai-clinic-booking-multilingual.util` fixture-drift failures, the known `reschedule_booking` case, and a static fixture-count assertion). Confirmed via full golden-eval-set diff (22 → 19 failures) that exactly these 3 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.23** — Fixed 2 pre-existing failing eval cases (`tour-consumer-en-capacity-wont-accept-10-city`, `tour-consumer-ru-capacity-reject-date`), both misclassified to `fix_checkout_validation_error` instead of `diagnose_tour_capacity`. Both target prompts ("Checkout won't accept 10 pax for City Tour — why?", "Почему checkout не принимает бронирование на 15/08/2026 для Mountain Trek?") independently satisfied `isDiagnoseTourCapacityPrompt` (`ai-tour-capacity.util.ts`) correctly, but `isFixCheckoutValidationErrorPrompt` (`ai-fix-checkout-validation-error.util.ts`) had no exclusion guard for it and ran first in dispatch order. First attempt at the fix (a bare `isDiagnoseTourCapacityPrompt` exclusion) broke 7 legitimate `fix_checkout_validation_error` fixtures — caught immediately via targeted jest (26 new failures) — because `isDiagnoseTourCapacityPrompt` is ITSELF over-broad: its `hasTourCapacityTopic` helper has a bare `\b(checkout|booking\s+page)\b` alternative that trivially matches ANY generic checkout-error prompt merely containing the word "checkout", combined with `hasCheckoutRejectionCue`'s equally generic "won't accept/error/doesn't let" cues — so blanket-excluding on it would silently steal every ordinary checkout-validation-error prompt too. Fixed by narrowing the new guard to only fire when the prompt ALSO carries a genuine tour-specific signal (`pax`, `group size`, `tour`/`trek`/`excursion`, or an explicit `DD/MM/YYYY`-style date) alongside `isDiagnoseTourCapacityPrompt` — distinguishing "this is really about tour capacity" from "this is a generic checkout error that happens to mention checkout." Verified the narrower guard preserves all 7 previously-broken fixtures (none reference pax/tour/trek/dates) while still correctly excluding both targets. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-fix-checkout-validation-error`/`ai-tour-capacity`/`ai-tour-consumer`/`ai-intent-rescue` (212 tests): only the one already-known pre-existing `fix-checkout-validation-error-profile-prefill-customer` failure remains (confirmed identical before/after via `git stash`). Confirmed via full golden-eval-set diff (19 → 17 failures) that exactly these 2 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.24** — Fixed 2 pre-existing failing eval cases (`configure-package-online-payment-all-packages-deposit`, `configure-package-online-payment-package-fixed-deposit`), both misclassified to `explain_checkout_currency`/`list_services` instead of `configure_package_online_payment`. Both target prompts ("Accept online prepayment on all packages with 50% deposit", "Require $25 deposit online for Spa Day package") were already correctly matched in isolation by `isConfigurePackageOnlinePaymentPrompt` (`ai-configure-package-online-payment.util.ts`), but stolen by the generic `tryRescueBudgetServiceDiscovery` wrapper (`ai-intent-rescue.service.ts` → `rescueBudgetServiceDiscoveryIntent`/`isBudgetDepositQuestion` in `ai-budget-service-discovery.util.ts`). Root cause: `isBudgetDepositQuestion` trivially returns true for ANY prompt merely containing the bare word "deposit" — its existing exclusion list already covered the SERVICE-level config variants (`isConfigureServiceOnlinePaymentPrompt`, `isConfigureServiceDepositPolicyPrompt`, `isExplainServiceOnlinePaymentSetupPrompt`, `isConfigureCheckoutDefaultsPrompt`) but was never extended to the sibling PACKAGE-level variant when `configure_package_online_payment` was added, so any package-deposit prompt fell through to the bare-word misroute. After adding that guard, the "$25 deposit" case still misrouted — to `list_services` this time — because `rescueBudgetServiceDiscoveryIntent`'s own top-level guard list had the same gap independently (it extracts a bare `$N` as `maxPrice` and returns a budget `list_services` rescue once the deposit-question misroute no longer short-circuits it first). Fixed both call sites by adding `isConfigurePackageOnlinePaymentPrompt` (`ai-configure-package-online-payment.util.ts`) as an exclusion guard — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-budget-service-discovery`/`ai-configure-package-online-payment`/`ai-checkout-currency`/`ai-intent-rescue` (493 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (17 → 15 failures) that exactly these 2 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.25** — Fixed 2 pre-existing failing eval cases (`configure-service-featured-remove-featured-massage`, `configure-service-featured-clear-premium-haircut`), both misclassified to `unassign_employee_services`. Both target prompts ("Remove featured from Massage", "Clear premium tier from Haircut") were already correctly matched by `isConfigureServiceFeaturedPrompt` (`ai-configure-service-featured.util.ts`) in isolation, but stolen by `isUnassignServicesFromProviderPrompt` (`ai-category-assignment.util.ts`) — a bare-word overreach: its `hasScope` check includes a generic `/\b(?:unassign|remove|strip|drop|revoke|clear)\s+.+\s+from\b/i` alternative that trivially matches ANY "remove/clear X from Y" sentence regardless of domain, and its `hasFromProvider` check equally-trivially treats the word after "from" as a provider name (misreading "Massage"/"Haircut" as employee names). Fixed by adding an `isConfigureServiceFeaturedPrompt` exclusion guard to `isUnassignServicesFromProviderPrompt`, placed alongside the existing `isRemoveRetailLinePrompt` exclusion (same bare-"remove" collision class) — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-category-assignment`/`ai-configure-service-featured`/`ai-intent-rescue` (296 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (15 → 13 failures) that exactly these 2 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.26** — Fixed 2 pre-existing failing eval cases (`service-online-payment-stripe-all-half`, `list-services-payment-filter-list-massage-online-payment-en`), both in the `ai-list-services-payment-filters.util.ts` / `ai-service-online-payment.util.ts` domain pair, distinct root causes. (1) **Asymmetric EN/RU verb-exclusion gap** (the same class of bug fixed for other verbs in **ai-cmd-ext-2.13.7**): "Require Stripe checkout on public booking for every service with half prepayment" was misrouted from `configure_service_online_payment` to `list_services` because `isListServicesPaymentFilterPrompt`'s mutate-verb exclusion list included the Russian root `требов` (require) but never the English word "require" itself — added it to the English alternation. That immediately exposed a second, narrower bug: the exclusion's own `!/\b(?:list|show)\s+services?\b/i` guard (meant to mean "unless this is genuinely a list/show request") only matched BARE "list services", not "list `<category>` services" — so adding "require" also broke the legitimate `list-massage-online-payment-en` fixture ("List massage services that require online prepayment"), which contains "require" but is a genuine list request with a category noun in between. Broadened that negative-guard to `\b(?:list|show)\b.{0,40}\bservices?\b` (mirroring the already-correct `hasListFilterCue` pattern in the same file) so category-qualified list requests are recognized too. Also added a `what\s+services?\s+require\b` carve-out so the interrogative "what services require X" form (a genuine list query already covered by its own `hasListFilterCue` alternative) isn't caught by the new bare "require" mutate-verb check. (2) **Missing feature, not a collision**: `ParsedListServicesPaymentFilter` never had a `serviceCategory` field at all, despite the file's own classifier-rules doc comment explicitly documenting `serviceCategory=massage` as expected output for that exact fixture — the extraction was simply never implemented. Added `serviceCategory` to the type plus a new `extractServiceCategoryFromListPaymentFilterPrompt` helper (`\b(?:list|show)\s+(?!our\b|the\b|all\b|my\b|services?\b)([a-z][\w-]{2,30}?)\s+services?\b`, with a determiner exclusion so "List our service catalog" doesn't misfire on "our") and wired it into both `parseListServicesPaymentFilterFromPrompt` and `enrichListServicesPaymentFilterParamsFromPrompt`. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-list-services-payment-filters`/`ai-service-online-payment`/`ai-filter-services-no-prepayment`/`ai-audit-services-missing-online-payment`/`ai-intent-rescue` (372 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (13 → 11 failures) that exactly these 2 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.27** — Fixed 1 pre-existing failing eval case (`explain-public-intake-form-skip-form-customer`, "Can I skip the form?"), misclassified to `explain_post_visit_review_prompt` (aspect `skip_dismiss`) instead of `explain_public_intake_form` (aspect `skip_form`). Root cause: `EXPLAIN_POST_VISIT_REVIEW_CUE` (`ai-explain-post-visit-review-prompt.util.ts`) had a bare `can i skip` alternative meant to catch "Can I skip the rating?" (the post-visit star-rating popup), but with zero requirement that "rating"/"review" actually follow — so it trivially matched any "can I skip `<anything>`" sentence, including a public-intake-form question with no relation to post-visit reviews at all. `isExplainPublicIntakeFormPrompt` already correctly matched the target prompt in isolation; the bare cue in the sibling detector just ran first and won. Fixed by narrowing the alternative to `can i skip the rating|can i skip the review` (matching the exact fixture wording and its documented classifier-rule trigger "can I skip the rating") — verified via grep that the file's only fixture using "can i skip" phrasing ("Can I skip the rating?") is independently and primarily matched by the exact-string `matchExplainPostVisitReviewScenario` fast path anyway, so narrowing the fallback regex doesn't affect it. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-post-visit-review-prompt`/`ai-explain-public-intake-form`/`ai-intent-rescue` (121 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (11 → 10 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.28** — Fixed 1 pre-existing failing eval case (`tour-calendar-hy-span-clipped-week`, "Ինչու է մի քանի օրյա տուրը կտրվում շաբաթվա սահմաններում օրացույցում" — "why is a multi-day tour clipped at week boundaries in the calendar"), misclassified to `explain_abnormal_result_flag` (aspect `reference_range`) instead of `explain_tour_calendar_span` (aspect `clippedWeek`). Root cause: both `FLAG_CUE` and `REFERENCE_RANGE_CUE` (`ai-explain-abnormal-result-flag.util.ts`) include bare Armenian `սահմաններ` ("boundaries"/"limits") as a lab-reference-range signal — but that word is a generic Armenian noun for "boundaries," also used for the unrelated tour-calendar-week-boundary concept in the target prompt ("շաբաթվա սահմաններում" = "at week boundaries"), so it trivially satisfied the flag-cue check with zero medical-result context; combined with `ինչու` ("why") satisfying `EXPLAIN_QUERY`, the whole function returned true for a prompt with no relation to lab results. `isExplainTourCalendarSpanPrompt` (`ai-tour-calendar-span.util.ts`) already matched the target prompt correctly in isolation. Fixed by adding an `isExplainTourCalendarSpanPrompt` exclusion guard to `isExplainAbnormalResultFlagPrompt`, placed alongside the existing `STAFF_CHART_BLOCK` guard — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-abnormal-result-flag`/`ai-tour-calendar-span`/`ai-intent-rescue` (126 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (10 → 9 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.29** — Fixed 1 pre-existing failing eval case (`explain-result-status-pending-meaning`, "What does pending mean for test results?"), misclassified to `list_lab_results_queue` (a provider-dashboard action) instead of `explain_result_status`. Root cause: `isListLabResultsQueuePrompt` (`ai-provider-clinic-tasks-and-results.util.ts`) already had an `isExplainResultStatusPrompt` exclusion guard — but it was ordered AFTER the bare-word queue-detection block (`show|list|what's|any|check|see` + `lab/test results` + `queue|waiting|pending|review|assigned|inbox`), which trivially matched "What" + "test results" + "pending" and returned true before the guard was ever reached (the same dead-guard-ordering pattern fixed repeatedly this session). First attempt reordered the guard to run first — this fixed the target but broke a genuine `list_lab_results_queue` fixture ("Any lab results waiting for my review?") that ALSO independently satisfies `isExplainResultStatusPrompt`'s own over-broad fallback matching, caught immediately via targeted jest (2 new failures). Reverted the reorder in favor of a narrower fix: added a `!/\b(?:mean|means)\b/` exclusion directly to the queue-detection block itself, since "what does X **mean**" is the one distinguishing signal present in the explain-style target prompt but absent from every genuine queue-check fixture — kept the original guard ordering intact. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-provider-clinic-tasks-and-results`/`ai-consumer-clinic-test-results`/`ai-intent-rescue` (154 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (9 → 8 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.30** — Fixed 1 pre-existing failing eval case (`push-lab-booking-send-lipid-draw`, "Send patient John the lipid panel collection booking link"), misclassified to `get_manage_link` instead of `push_lab_booking_to_patient`. Root cause: `MANAGE_LINK_CUE` (`ai-get-manage-link.util.ts`) has a bare `booking\s+link` alternative that trivially matched the target prompt's trailing "...collection **booking link**" phrase, with zero clinic/patient-specific context required. First attempt added a blanket `isPushLabBookingToPatientPrompt` exclusion guard to `isGetManageLinkPrompt` — this immediately broke 4 genuine `get_manage_link` fixtures ("Send me my booking manage link", "Send me a link to change my booking", the HY equivalent, and a misclassification-rescue scenario), caught via targeted jest (9 new failures), because `isPushLabBookingToPatientPrompt` (`ai-clinic-lab-booking.util.ts`) is ITSELF over-broad in the opposite direction — its `PUSH_VERB`/`PUSH_TARGET` pair matches bare "send" + bare "link"/"booking link" with no patient-specific noun required, so it also claimed the generic manage-link prompts. Narrowed the new guard to only fire when the prompt additionally contains the word "patient" (or հիվանդ/пациент) — the one signal present in the genuine push-to-patient target ("Send **patient** John...") but absent from all 4 broken generic manage-link fixtures. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-get-manage-link`/`ai-clinic-lab-booking`/`ai-intent-rescue` (304 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (8 → 7 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.31** — Fixed 1 pre-existing failing eval case (`flexible-booking-ru-book-nearest-massage`, "Запиши ближайшее свободное время для массажа завтра вечером" — "book the nearest available time for massage tomorrow evening"), misclassified to `list_my_upcoming_appointments` instead of `book_nearest_slot`. Root cause: `UPCOMING_CUE` (`ai-list-my-upcoming-appointments.util.ts`) had a bare Russian `ближайш` ("nearest") root with zero co-occurrence requirement (unlike its English/Armenian sibling alternatives, which all require an "appointment/visit/booking" noun nearby) — so it trivially matched "ближайшее свободное время" (nearest available *time*, a booking action) even though the word has no inherent connection to "listing upcoming appointments." `isBookNearestSlotPrompt` (`ai-payments.util.ts`) already matched the target prompt correctly in isolation. Verified via grep across every fixture file in the repo that NO `list_my_upcoming_appointments` fixture relies on the bare `ближайш` match — every single occurrence of that root across all fixtures belongs to `book_nearest_slot`/`book_lab_collection_nearest`/`book_package_with_nearest_slot`/`book_tour_nearest_departure`-style booking actions, confirming it was pure dead-weight overreach rather than a needed signal — removed it outright rather than narrowing it. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-list-my-upcoming-appointments`/`ai-payments.util`/`ai-check-and-book`/`ai-intent-rescue` (191 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (7 → 6 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.32** — Fixed 1 pre-existing failing eval case (`disambig-dashboard-dashboard-staff-lookup-assignment`, "who is doing facemassage today"), misclassified to `explain_provider_specialty` (nonsense `providerName: "doing facemassage today"`) instead of `lookup_service_assignment`. Root cause: `hasNamedProviderCue` (`ai-explain-provider-specialty.util.ts`) has a `who is\s+(?!...)` pattern with a negative-lookahead exclusion list (`best|good|the best|the expert|free|available|open|working|busy`) meant to avoid stealing availability-style "who is free/available" questions — but "doing" (as in "who is **doing** X today," a staff-assignment lookup) was missing from that list, so the regex matched and the whole trailing clause got captured as a bogus provider name. `isLookupServiceAssignmentPrompt` (`ai-intent-disambiguation.util.ts`) already correctly matched the target prompt in isolation (requires `doing|performing|giving|working|assigned|scheduled` + a team-wide-availability structure). Rather than patch the negative-lookahead list piecemeal (risking the same gap for "performing"/"giving"/"assigned"/"scheduled"), added a direct `isLookupServiceAssignmentPrompt` exclusion guard to `isExplainProviderSpecialtyPrompt` — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-provider-specialty`/`ai-intent-disambiguation`/`ai-intent-rescue` (119 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (6 → 5 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.33** — Fixed 1 pre-existing failing eval case (`explain-multi-service-settings-max-services`, "What is the max number of services per visit?"), a multi-hop whack-a-mole collision that required 3 rounds of fix-verify before stabilizing. Round 1: expected `explain_multi_service_settings`, got `summarize_my_appointments` — `isSummarizeMyAppointmentsPrompt` (`ai-provider-earnings.util.ts`) has a `countCue`/`appointmentCue`/`selfCue` triple-AND check where `selfCue` falls back to `|| countCue`, defeating its own "self" requirement — "number of" (countCue) + "visit" (appointmentCue) trivially satisfied all three. Added an `isExplainMultiServiceSettingsPrompt` exclusion guard. Round 2: this exposed the SAME target prompt now stolen by `explain_multi_service_cart` (`ai-explain-multi-service-cart.util.ts`) — its own bare `what is...cart|basket|visit` OR-pattern matched "What **is**...per **visit**" independent of any cart context. Added the same exclusion guard there. Round 3: exposed a THIRD collision, `explain_subscription_vs_one_time`. First attempt fixed this with a single blanket `isExplainMultiServiceSettingsPrompt` exclusion at the top of the whole `rescueSelfServiceBookingIntent` umbrella (`ai-self-service-booking.util.ts`) to stop the apparent whack-a-mole in one shot — but `isExplainMultiServiceSettingsPrompt` was ITSELF over-broad (`hasMultiServiceSettingsSurface`'s bare `\bmulti[\s-]?service\b` with zero context requirement), so the blanket guard collaterally broke an unrelated legitimate compound case, `multi-service-open-blocks-color-blowdry-public` ("Show open multi-service blocks for color and blowdry" → `check_multi_service_availability`), caught via full eval diff (1 new regression). Reverted the blanket guard; narrowed `hasMultiServiceSettingsSurface`'s bare multi-service match with a negative lookahead `(?!\s+(?:cart|basket|visit))` (the two words that caused the cart collision, verified safe against all 12 dashboard-settings fixtures — 5 of which depend on the bare match and would've broken if removed outright rather than narrowed); then added a final, narrowly-scoped `isExplainMultiServiceSettingsPrompt` exclusion to `isExplainSubscriptionVsOneTimePrompt` (`ai-explain-subscription-vs-one-time.util.ts`) for the specific 3rd collision, leaving the rest of the umbrella dispatcher's sequential checks untouched. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-multi-service-settings`/`ai-provider-earnings`/`ai-explain-multi-service-cart`/`ai-explain-subscription-vs-one-time`/`ai-self-service-booking`/`ai-multi-service-customer-public`/`ai-intent-rescue` (406 tests): 2 pre-existing failures remain, both confirmed identical before/after via `git stash` (the known `reschedule_booking` case and an already-broken `isUseSubscriptionCreditPrompt('Use my subscription for today massage')` case documented since **4.6.12**). Confirmed via full golden-eval-set diff (5 → 4 failures) that exactly this 1 target id disappeared with zero new ids added on the final pass.
- [x] **ai-cmd-customer-4.6.34** — Fixed 1 pre-existing failing eval case (`fix-checkout-validation-error-profile-prefill-customer`, "My profile email shows but booking says contact details missing"), misclassified to `recover_lost_manage_link` instead of `fix_checkout_validation_error`. Root cause: `hasRecoverLostManageLinkCue` (`ai-recover-lost-manage-link.util.ts`) has a branch requiring `GUEST_RESEND_CUE.test(prompt) && /\b(?:booking|appointment|visit|manage|link)\b/i.test(prompt)` — but `GUEST_RESEND_CUE` includes the bare word `missing` (meant for "confirmation email missing"), and the second half trivially matches the bare word "booking" present in almost any checkout-related sentence, so the target prompt (which merely says a form field shows "missing" alongside the word "booking") satisfied both halves with zero genuine "guest lost their manage link" context. `isFixCheckoutValidationErrorPrompt` (`ai-fix-checkout-validation-error.util.ts`) already matched the target prompt correctly in isolation. Fixed by adding an `isFixCheckoutValidationErrorPrompt` exclusion guard to `isRecoverLostManageLinkPrompt`, alongside the existing `isExplainGuestCheckoutFieldsPrompt`/`isConfigureNotificationSettingsPrompt` guards — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-recover-lost-manage-link`/`ai-fix-checkout-validation-error`/`ai-intent-rescue` (172 tests): only the one already-known pre-existing `reschedule_booking` failure remains. Confirmed via full golden-eval-set diff (4 → 3 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.35** — Fixed 1 pre-existing failing eval case (`book-package-with-nearest-slot-bundle-first-available-public`, "Get the deluxe package first available slot"), a compound-recipe matching-order collision (a different bug class from this session's usual bare-word detector overreach — this one is about which entry in the recipe-matching ARRAY wins, not which boolean detector). Both `isBookPackageWithNearestSlotCompoundPrompt` (`ai-book-package-with-nearest-slot.util.ts`) and `isServiceRankDiscoveryCompoundPrompt` (`ai-service-rank-discovery-compound.util.ts`) independently matched the target prompt, but `GOLDEN_COMPOUND_PATTERNS`/recipe array in `intent-decomposition.util.ts` checks `public_service_rank_discovery_compound` (registered earlier in the array) before `public_book_package_with_nearest_slot` (registered much later) — so rank-discovery won regardless of which was semantically more specific, losing the `packageName: "Deluxe"` param in the process (rank-discovery's param builder has no package-name extraction). Fixed by adding an `isBookPackageWithNearestSlotCompoundPrompt` exclusion guard to `isServiceRankDiscoveryCompoundPrompt` rather than reordering the recipe array (array-position reordering risks the same multi-hop whack-a-mole seen in **4.6.33**, since many other recipes share the array and their relative order is load-bearing elsewhere) — verified zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-service-rank-discovery-compound`/`ai-book-package-with-nearest-slot`/`ai-service-rank-discovery`/`intent-decomposition`/`ai-intent-rescue` (710 tests): 2 pre-existing failures remain, both confirmed identical before/after via `git stash` (the known `reschedule_booking` case and an unrelated `intent-decomposition.schema` recipe-id-listing gap for `customer_book_with_gift_card_compound`, untouched by this change). Confirmed via full golden-eval-set diff (3 → 2 failures) that exactly this 1 target id disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.6.36** — Fixed the final fixable eval failure, `book-lab-collection-nearest-lab-collection-nearest-customer-hy` ("Ամրագրիր իմ լաբ հավաքումը ամենամոտ հասանելի slot-ով" — "book my lab collection at the nearest available slot"), the same compound-recipe array-order bug class as **4.6.35**. `isBookLabCollectionNearestCompoundPrompt` (`ai-book-lab-collection-nearest.util.ts`) already matched the target prompt correctly, but the `customer_check_and_book_nearest` golden pattern (`intent-decomposition.util.ts`, `matches: isCheckProvidersForServicePrompt && isBookNearestSlotPrompt && ...`) is registered earlier in `GOLDEN_COMPOUND_PATTERNS` than the `book_lab_collection_nearest` recipe, and both `isCheckProvidersForServicePrompt`/`isBookNearestSlotPrompt` independently also matched the same prompt — so the generic check-and-book-nearest pattern won first, decomposing into the wrong 2-step recipe (`check_providers_for_service` + `book_nearest_slot` instead of `list_my_lab_booking_requests` + `book_lab_collection`) with zero lab-specific params. Fixed by adding an `isBookLabCollectionNearestCompoundPrompt` exclusion to the `customer_check_and_book_nearest` pattern's `matches` function, alongside its existing `!isBudgetServiceDiscoveryCompoundPrompt`/`!isDiscoverBookAndPayCompoundPrompt` exclusions (the array already imports `isBookLabCollectionNearestCompoundPrompt`, used elsewhere in the same file — no new import needed). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `intent-decomposition`/`ai-book-lab-collection-nearest`/`ai-payments.util`/`ai-intent-rescue` (416 tests): only the 2 already-known pre-existing failures remain (`reschedule_booking` and the unrelated `intent-decomposition.schema` recipe-id-listing gap, both untouched by this change). Confirmed via full golden-eval-set run: **only 1 failure remains in the entire eval suite** — `meta-guide-rescue-provider-swipe-approval`, the genuinely ambiguous fixture conflict documented and left as-is after investigation (two golden fixtures expect opposite actions for near-identical "swipe to confirm" phrasing on the same surface, with no reliable text signal to disambiguate — fixing one breaks the other). This closes out the full ai-cmd-customer-6 eval-hardening pass: **starting count 47 failures → 1 remaining**, all others fixed across **4.6.16** through **4.6.36** (21 clusters/entries, ~46 target ids, zero net regressions at any step after landmines were caught and reverted).
- [x] **ai-cmd-customer-4.6.9** — HY/RU `explain_why_stripe_required` — fixed 6 pre-existing failing `promotion-i18n-explain-why-stripe-*` eval cases. Two distinct root causes: (1) `isConsumerDiagnoseStripeCheckoutFailurePrompt` (`ai-diagnose-stripe-checkout-failure.util.ts`) had a bare `ինչ` (what) substring in its Armenian failure-cue OR-list, which false-matched inside `Ինչու` (why) — misrouting all 3 HY prompts to `diagnose_stripe_checkout_failure` before `explain_why_stripe_required` ever got a chance; the file's own `WHAT_NOW` constant already used a properly-scoped `ինչ\s+ան(?:եմ|ել)` ("what should I do") phrase for the legitimate case, so the bare fallback was both redundant and unsafe — removed it (confirmed via grep that no existing fixture relies on it, and the one real HY failure fixture uses "ի՞նչ" with an embedded diacritic that never matched the bare substring anyway). (2) `isExplainWhyPrepaymentPrompt` (`ai-explain-prepayment.util.ts`) had zero Armenian/Russian detection at all, so the 3 RU prompts (which don't collide with the checkout-failure detector) resolved to "none" outright — added `ինչու`+(`վճար`/`պահանջ`/`deposit`) and `почему`/`зачем`+(`плат`/`треб`/`депозит`) checks. Also found and fixed an unrelated fixture bug while re-verifying: all 6 fixtures expected `rescueReason: 'explain_prepayment'`, a value no production code path ever actually returns (the real reason string is `'why_prepayment'`, confirmed by tracing the full `rescuePaymentsIntent` → `rescueExplainPrepaymentIntent` chain) — corrected the fixture's expected value rather than adding a fake reason string to match a typo. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-prepayment`/`ai-diagnose-stripe-checkout-failure`/`ai-payments.util`/`ai-customer-intent-promotion` (230 tests) + eval spec: 240/241 pass, only the same pre-existing unrelated failure remains.
- [x] **ai-cmd-customer-4.6.8** — Fixed `matchCustomerOwnedPackageVisit` bookingId-lookup test failure in `ai-cancel-package-visit-self.util.spec.ts`/`ai-reschedule-package-visit-self.util.spec.ts`. Not a real logic bug: `matchCustomerOwnedPackageVisit` (`ai-cancel-package-visit-self.util.ts`) correctly filters candidates to `startTime >= now`, but the shared test fixture hardcoded `startTime: '2026-07-01T10:00:00Z'` for booking `b1` — a genuine future date when originally authored, now in the past relative to the current date, so `b1` silently dropped out of the candidate pool and the bookingId lookup returned `null`. Fixed by switching both spec files' fixture to relative dates (`new Date(Date.now() + 7|14 days).toISOString()`), so the test can't rot again. tsc holds at known baseline (1362, no new-file diffs); both spec files now pass in full (81/81 combined). While investigating, found ~40 other spec/fixture files across `backend/src/modules/ai/` with the same hardcoded-near-future-date pattern — flagged as a separate audit task since fixing all of them is out of scope here.
- [x] **ai-cmd-customer-4.6.7** — Fixed `book_nearest_slot` false-negative: `isBookNearestSlotPrompt('find nearest haircut')` (and any "find/get nearest/soonest/next/earliest <service>" phrasing) incorrectly returned `false`. Root cause: the sibling `isFindSoonestAppointmentPrompt` (`ai-find-soonest-appointment.util.ts`) has an early bail-out in `isBookNearestSlotPrompt` (`if (isFindSoonestAppointmentPrompt(prompt)) return false;`), but that sibling's final catch-all branch (`find` + soonest-cue + no book/reserve/schedule verb) claimed the prompt too broadly — it didn't check whether a concrete service name ("haircut") was present, so it mis-swallowed booking requests that should defer to `book_nearest_slot` (mutate) instead of resolving as `find_soonest_appointment` (read-only availability check). Fixed by adding the same service-word exclusion (`haircut|massage|facial|cut|color|service`) already trusted in `isBookNearestSlotPrompt` itself, keeping the two functions' boundaries symmetric. Confirmed via grep that none of the 22 existing `FIND_SOONEST_APPOINTMENT_PROMPTS` fixtures use the literal word "find" (they all use "who's free"/"earliest"/"nearest opening"/"first available" phrasing instead), so the added exclusion has zero blast radius on that fixture set — verified via a full targeted run (135/135 pass across `ai-find-soonest-appointment`/`ai-payments.util`/`ai-schedule-resources`). tsc holds at known baseline (1362, no new-file diffs). Confirmed (via `git stash`) two adjacent, unrelated pre-existing failure clusters in the same eval-spec run (`promotion-i18n-pay-online-*`, `promotion-i18n-explain-why-stripe-*`) — untouched by this fix, already tracked separately.
- [x] **ai-cmd-customer-4.6.6** — HY/RU `request_gift_card_cancel` — fixed 6 pre-existing failing `promotion-i18n-gift-card-cancel-*` eval cases. Root cause: `isRequestGiftCardCancelPrompt` (`ai-customer-crm.util.ts`) had zero Armenian/Russian detection — all 12 shipped fixtures were EN-only. Added Armenian `չեղարկ`/`վերադարձ` (cancel/refund) and Russian `отмен`/`верну` to `cancelIntent`; Russian native `подарочн`+`карт` (gift card, no English loanword) to `giftTarget`; and the same broad "Armenian/Cyrillic script implies self-scope" fallback used for **ai-cmd-customer-4.15.1** to `selfScope` (safe here for the identical reason — this domain has no dashboard-admin equivalent phrased in those scripts, and `hasDashboardCustomerReference` already screens out admin-tone asks). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-customer-crm`/`ai-gift-card-cancel-customer` (85 tests) + eval spec: all pass except the same pre-existing eval-suite failure. Found (but did not fix, out of scope) a sibling gap in the same file: `isMySubscriptionsPrompt`'s `promotion-i18n-my-subscriptions-*` HY/RU cases (6) fail identically — confirmed pre-existing via `git stash`, same "zero non-English coverage" shape as this fix, worth doing as a follow-up in the same style.

---



### ai-cmd-customer-4.7 — Clinic & lab (consumer) — **customer + public**


| ID        | Intent (proposed)               | R/M | Surfaces | Example prompts                     | Notes                                                   |
| --------- | ------------------------------- | --- | -------- | ----------------------------------- | ------------------------------------------------------- |
| **4.7.1** | `explain_lab_prep`              | R   | both     | “Do I need to fast for blood work?” | Clinic service `requiresFasting`                        |
| **4.7.2** | `track_lab_order_status`        | R   | customer | “Are my results ready?”             | Extend `list_my_test_results` / `explain_result_status` |
| **4.7.3** | `book_lab_collection_nearest`   | M   | both     | “Book lab draw earliest slot”       | Compound lab booking + `bookingFirstAvailable`          |
| **4.7.4** | `explain_clinic_booking_fields` | R   | both     | “Why do you ask for my ID?”         | Extend `explain_clinic_booking`                         |


- [x] **ai-cmd-customer-4.7.1** — `explain_lab_prep`
- [x] **ai-cmd-customer-4.7.2** — `track_lab_order_status`
- [x] **ai-cmd-customer-4.7.2.1** — Fixed all 7 pre-existing failing `clinic-v2-*` eval cases (`ai-clinic-v2-6.fixtures.ts`/`ai-clinic-v2-6-multilingual.fixtures.ts`, `list_my_test_results`/`explain_result_status` targets), plus 1 bonus fix. A mix of genuine detector gaps and routing collisions, all in `ai-consumer-clinic-test-results.util.ts`/`ai-track-lab-order-status.util.ts`/`ai-provider-clinic-tasks-and-results.util.ts`/`ai-sign-in-after-booking.util.ts`. (1) Detector gap: `TRACK_LAB_ORDER_STATUS_BLOCK`'s Russian "готовы ли ... результат" alternative in `isListMyTestResultsPrompt` blocked ANY such phrasing unconditionally, with no exception for app/booking-site surface context — 3 RU cases ("Готовы ли результаты тестов в приложении", "...на сайте записи", "...с моего визита здесь") were being reserved for `track_lab_order_status` when they should list in-app/on-site instead; added an `!APP_SURFACE && !PUBLIC_SURFACE` carve-out. (2) The same-shaped bug existed in the OTHER direction in `ai-track-lab-order-status.util.ts`'s own `PUBLIC_SURFACE` regex — it recognized page/site/booking words but not "app"/"приложени"/"հավելված", so the RU "in the app" case slipped past its surface check too; extended that regex to include app-surface words. (3) Collision: "Check my lab results on this booking site" (EN) was stolen by `isListBookingLabSummariesPrompt`'s (`ai-provider-clinic-tasks-and-results.util.ts`) bare `this\s+booking` match, which doesn't distinguish "this booking['s results]" (a specific visit) from "booking site" (the public website) — added a `booking\s+(?:site|page|portal|website)` exclusion. (4) Collision: the Armenian "Can I see test results here after signing in?" was stolen by `isSignInAfterBookingPrompt`'s bare "մուտք" (sign in) + "հետո" (after) co-occurrence check — added an `isListMyTestResultsPrompt` exclusion guard. (5) Collision: two RU "why are results still waiting" `explain_result_status` prompts were stolen by `isListLabResultsQueuePrompt`'s bare Cyrillic "результат"+"ожида" check (its English branch already correctly requires a list-verb qualifier, but the RU/HY branches didn't) — added an `isExplainResultStatusPrompt` guard (ordered AFTER the English list-verb branch, not before, since an initial blanket-first-position attempt broke the legitimate English fixture "Any lab results waiting for my review?" — confirmed via `git stash` this was a real regression, reordered + added explicit "почему"/"ինչու" exclusions to the RU/HY branches directly instead of relying solely on the cross-file guard). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-consumer-clinic-test-results`/`ai-provider-clinic-tasks-and-results`/`ai-sign-in-after-booking`/`ai-track-lab-order-status`/`ai-intent-rescue` (262 tests): 2 pre-existing unrelated failures remain (the known `reschedule_booking` vs `find_soonest_appointment` case, and a newly-noticed pre-existing `ai-consumer-clinic-test-results.integration.spec.ts` failure — "What does pending mean for test results?" incorrectly matches `isListLabResultsQueuePrompt`'s bare English `what` + `pending` + `results` combination — confirmed identical with and without this change via `git stash`, left unfixed as out of scope for this cluster). Confirmed via full golden-eval-set diff (102 → 94 failures) that exactly these 7 target ids disappeared, plus 1 bonus (`consumer-clinic-test-results-ru-public-booking-ready`), with zero new ids added.
- [x] **ai-cmd-customer-4.7.3** — `book_lab_collection_nearest`
- [x] **ai-cmd-customer-4.7.4** — `explain_clinic_booking_fields`
- [x] **ai-cmd-customer-4.7.4.1** — Fixed all 5 pre-existing failing `explain-clinic-booking-*` eval cases (a mix of `explain_clinic_booking` and `explain_clinic_booking_fields` targets). Both `isExplainClinicBookingPrompt` (`ai-clinic-booking.util.ts`) and `isExplainClinicBookingFieldsPrompt` (`ai-explain-clinic-booking-fields.util.ts`) were already correct for all 5 — every failure was a collision, two root causes. (1) 2 cases ("What is the reason for visit field for on this booking page?", "Does CBC require fasting on this booking page?") were stolen by `isConfirmMyBookingDetailsPrompt`'s broad `READ_CUE`/`BOOKING_CONTEXT` pair — the SAME over-broad detector now hit for a fourth distinct domain this session (previously `reschedule_my_booking` in **ai-cmd-customer-4.4.3.1**, `explain_guest_checkout_fields` in **ai-cmd-customer-4.2.2.1**). Fixed with an `isExplainClinicBookingPrompt` exclusion guard (verified no circular imports). (2) 3 cases (2 EN/public + 1 hy/customer, all about a "pre-visit questionnaire"/"pre-visit intake" asking for insurance/ID/personal details) were stolen by `isExplainPublicIntakeFormPrompt`'s (`ai-explain-public-intake-form.util.ts`) bare `pre-visit (?:intake|questionnaire)` structural match, which has zero distinction between "generic intake flow" (its own domain) and "why do you need THIS SPECIFIC FIELD" (the more specific `explain_clinic_booking_fields` domain) — `isExplainClinicBookingFieldsPrompt` already correctly deferred to `isExplainPublicIntakeFormPrompt` when ambiguous (one-way dependency), so a reverse cross-file guard would have created a circular import; instead extended the file's own existing `IDENTITY_FIELD_CUE` exclusion regex with bare `insurance`/`personal details` (previously required the narrower `insurance policy`) for the 2 EN cases, and its existing `HY_RU_ID_CUE`-style pattern with an "why...ID/passport-loanword" hy/ru alternative for the third (mirroring an identical pattern that already exists in the sibling `ai-explain-clinic-booking-fields.util.ts` file, `HY_RU_ID_CUE`) — verified zero overlap against existing `ai-explain-public-intake-form*fixtures.ts` prompts. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-confirm-my-booking-details`/`ai-clinic-booking`/`ai-explain-public-intake-form`/`ai-explain-clinic-booking-fields`/`ai-intent-rescue` (250 tests): 3 pre-existing unrelated failures remain (the known `reschedule_booking` vs `find_soonest_appointment` case, plus 2 newly-noticed pre-existing `ai-clinic-booking*` lab-prep test failures for "Lipid panel" — all confirmed identical with and without this change via `git stash`). Confirmed via full golden-eval-set diff (65 → 60 failures) that exactly these 5 target ids disappeared with zero new ids added.

---



### ai-cmd-customer-4.8 — Customer compounds (one message, full job)


| ID        | Recipe                  | Steps                                                                      | Example prompt                                            |
| --------- | ----------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| **4.8.1** | `discover_book_and_pay` | budget/rank list → check availability → book → choose payment / pay online | “Book cheapest massage under $60 tomorrow and pay online” |
| **4.8.2** | `rebook_and_pay`        | `rebook_last_appointment` → `choose_payment_method`                        | “Rebook my last visit and pay with card”                  |
| **4.8.3** | `cancel_and_rebook`     | `cancel_my_booking` → `book_nearest_slot`                                  | “Cancel Friday and book the next available slot”          |
| **4.8.4** | `gift_card_checkout`    | `check_gift_card_balance` → `apply_gift_card_code` → `book_nearest_slot`   | “Use gift card GCM-XXX and book nearest haircut”          |
| **4.8.5** | `multi_service_day`     | `add_services_to_cart` → `check_multi_service_availability` → book         | “Massage and facial same afternoon — find a time”         |
| **4.8.6** | `guest_book_and_manage` | book as guest → `get_manage_link`                                          | “Book as guest and email me the manage link”              |


- [x] **ai-cmd-customer-4.8.1** — `discover_book_and_pay`
- [x] **ai-cmd-customer-4.8.2** — `rebook_and_pay`
- [x] **ai-cmd-customer-4.8.3** — `cancel_and_rebook`
- [x] **ai-cmd-customer-4.8.4** — `gift_card_checkout`
- [x] **ai-cmd-customer-4.8.5** — `multi_service_day`
- [x] **ai-cmd-customer-4.8.6** — `guest_book_and_manage`

---



### ai-cmd-customer-4.9 — Consumer app UI chips (quick wins)

Wire suggested prompts into `AI_PAGE_SUGGESTIONS` / localized consumer strings (mirror dashboard **ai-cmd-ext-2.13.4**).


| Page / route                | Suggested AI chips                                                           |
| --------------------------- | ---------------------------------------------------------------------------- |
| `BookPage`                  | “How much do I pay today?”, “Pay cash at visit”, “Why do you need my email?” |
| `ManageBookingPage`         | “Cancel this appointment”, “Reschedule to next week”, “Send manage link”     |
| `AccountPage`               | “My next appointment”, “Turn off reminders”, “Rebook last visit”             |
| `SalonHomePage`             | “What’s the cheapest service?”, “Who’s free tomorrow?”                       |
| `MultiServicePickerPage`    | “How long will this take?”, “Find afternoon slot for all services”           |
| `GiftCardCheckoutPage`      | “Apply promo code”, “Explain total with tax”                                 |
| `MultiServiceCheckoutPage`  | “Use my subscription”, “Why is total $0?”                                    |
| `PackageConfirmPage`        | “How many visits in this package?”, “Book first visit now”                   |
| `LabToBookPage`             | “Book my lab draw”, “Why do I need collection?”                              |
| `MyResultsPage`             | “What does released mean?”, “Why is CBC still pending?”                      |
| `ManageBookingPage` (guest) | “Sign in to manage”, “Resend manage link”                                    |
| `WelcomePage`               | “Find my saved salons”, “How do I get the app?”                              |
| **Public booking web**      | Same as **4.1**–**4.2** where anonymous                                      |


- [x] **ai-cmd-customer-4.9.1** — Consumer app page suggestion map in `frontend` + `consumer-app` i18n
- [x] **ai-cmd-customer-4.9.2** — Public booking assistant starter chips on checkout + service list

---



### ai-cmd-customer-4.10 — Tours & group bookings — **public + customer**


| ID         | Intent (proposed)             | R/M | Surfaces | Example prompts                                                     | Notes                                              |
| ---------- | ----------------------------- | --- | -------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| **4.10.1** | `explain_tour_booking`        | R   | both     | “How many people can join?”, “Is price per person?”                 | **Shipped** — extend HY/RU + eval                  |
| **4.10.2** | `explain_tour_day_slots`      | R   | both     | “Why only one time per day?”, “How many spots left Friday?”         | **Shipped** — `remainingSpots`, fully booked dates |
| **4.10.3** | `diagnose_tour_capacity`      | R   | both     | “Checkout says not enough seats”, “Why can’t I book 4 people?”      | **Shipped** — pax vs max group at checkout         |
| **4.10.4** | `explain_tour_booking_record` | R   | customer | “What’s my tour confirmation number?”, “Summarize my group booking” | Post-booking read                                  |
| **4.10.5** | `book_tour_nearest_departure` | M   | both     | “Book the wine tour earliest date for 2 people”                     | Compound tour catalog → pax → slot                 |
| **4.10.6** | `explain_tour_meeting_point`  | R   | both     | “Where do we meet?”, “What time should I arrive?”                   | Extend `explain_preparation_notes` for tours       |


- [x] **ai-cmd-customer-4.10.1** — HY/RU eval for `explain_tour_booking`
- [x] **ai-cmd-customer-4.10.2** — HY/RU eval for `explain_tour_day_slots`
- [x] **ai-cmd-customer-4.10.3** — Checkout error copy for `diagnose_tour_capacity`
- [x] **ai-cmd-customer-4.10.4** — Full DoD for `explain_tour_booking_record`
- [x] **ai-cmd-customer-4.10.5** — `book_tour_nearest_departure` compound
- [x] **ai-cmd-customer-4.10.6** — `explain_tour_meeting_point`

---



### ai-cmd-customer-4.11 — Provider / specialist choice — **public + customer**


| ID         | Intent (proposed)               | R/M | Surfaces | Example prompts                                                    | Notes                                                     |
| ---------- | ------------------------------- | --- | -------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| **4.11.1** | `explain_any_provider_option`   | R   | both     | “What does Any stylist mean?”, “Will someone be assigned?”         | `ConsumerSlotSpecialistPicker` / any-availability         |
| **4.11.2** | `pick_provider_for_service`     | M   | both     | “Book with Anna for color”, “I want the same stylist as last time” | Navigate with `providerId`; tie `rebook_last_appointment` |
| **4.11.3** | `explain_provider_availability` | R   | both     | “Is Marco working Saturday?”, “Who has openings tomorrow?”         | Thin wrapper on `check_availability` + provider filter    |
| **4.11.4** | `switch_provider_same_time`     | M   | both     | “Keep 3pm but different stylist”                                   | Re-run availability with same slot block                  |
| **4.11.5** | `explain_professional_profile`  | R   | both     | “Show me Anna’s services”, “What does this stylist specialize in?” | `ProviderProfilePage` / `ProfessionalsPage` navigate      |


- [x] **ai-cmd-customer-4.11.1** — `explain_any_provider_option`
- [x] **ai-cmd-customer-4.11.1.1** — Fixed all 22 pre-existing failing `any-provider-option-*` eval cases (across `customer`/`public` surfaces and en/hy/ru fixtures). All 22 shared the identical shape: `action`/`rescueReason` already correct, only `params.aspect` came back `undefined`. Root cause: `rescueExplainAnyProviderOptionIntent` (`ai-explain-any-provider-option.util.ts`) returns only `{action, rescueReason}` — no params — and the fully-correct `parseExplainAnyProviderOptionFromPrompt` (resolving `aspect` to `what_it_means`/`assignment`/`picker`/`all` via scenario matching + `inferAnyProviderOptionAspect` fallback) already existed but was never invoked. Unusually, this call site appears **three separate times** in `ai-intent-rescue.service.ts` (lines ~1621, ~1760, ~3858 — one per distinct dispatch branch/context), and all three independently hardcoded `params: {}`, so all three needed the identical fix: replaced with `parseExplainAnyProviderOptionFromPrompt(prompt) ?? {}`, plus one shared new import. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-any-provider-option`/`ai-intent-rescue`/`ai-pick-provider-for-service`/`customer-ai-command` (1891 tests): 3 pre-existing unrelated failures remain (`manage_notification_preferences`/`explain_push_permission` rescue misses via `rescueConsumerAdoptionIntent`, and the known `reschedule_booking` vs `confirm_my_booking_details` case), all confirmed identical with and without this change via `git stash`. Confirmed via full golden-eval-set diff (207 → 185 failures) that exactly these 22 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.11.2** — `pick_provider_for_service`
- [x] **ai-cmd-customer-4.11.3** — `explain_provider_availability`
- [x] **ai-cmd-customer-4.11.4** — `switch_provider_same_time`
- [x] **ai-cmd-customer-4.11.5** — `explain_professional_profile`

---



### ai-cmd-customer-4.12 — Post-visit reviews, satisfaction & support — **customer**


| ID         | Intent (proposed)                  | R/M | Surfaces | Example prompts                                                         | Notes                                                |
| ---------- | ---------------------------------- | --- | -------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| **4.12.1** | `leave_visit_review`               | M   | customer | “Rate my last visit”, “Leave a review for today’s haircut”              | `PostVisitReviewPrompt` / store review flow          |
| **4.12.2** | `explain_post_visit_review_prompt` | R   | customer | “Why am I seeing a review popup?”, “Can I skip the rating?”             | When prompt shows; dismiss behavior                  |
| **4.12.3** | `report_booking_problem`           | M   | customer | “Something went wrong with my visit”, “I was charged twice”             | `postBookingSupport`* — staff ticket or support form |
| **4.12.4** | `explain_share_reward`             | R   | customer | “Do I get points for sharing?”, “What happens when I share my booking?” | `shareBookingLinkWithReward` / growth card           |
| **4.12.5** | `sign_in_after_booking`            | R   | customer | “Save this booking to my account”, “Sign in with Google after booking”  | `postBookingSignIn`* — guest → account merge         |


- [x] **ai-cmd-customer-4.12.1** — `leave_visit_review`
- [x] **ai-cmd-customer-4.12.2** — `explain_post_visit_review_prompt`
- [x] **ai-cmd-customer-4.12.3** — `report_booking_problem`
- [x] **ai-cmd-customer-4.12.4** — `explain_share_reward`
- [x] **ai-cmd-customer-4.12.5** — `sign_in_after_booking`

---



### ai-cmd-customer-4.13 — App health: push, offline, updates — **customer**


| ID         | Intent (proposed)             | R/M | Surfaces | Example prompts                                                     | Notes                                                           |
| ---------- | ----------------------------- | --- | -------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| **4.13.1** | `enable_push_notifications`   | M   | customer | “Turn on push reminders”, “Notify me on my phone”                   | Distinct from `manage_notification_preferences` (channel prefs) |
| **4.13.2** | `explain_push_permission`     | R   | customer | “Why didn’t I get a notification?”, “Open notification settings”    | iOS provisional / Android POST_NOTIFICATIONS / denied re-ask    |
| **4.13.3** | `explain_offline_mode`        | R   | customer | “Why does it say offline?”, “Will my booking sync?”                 | `offlineStatus`* / queued mutations                             |
| **4.13.4** | `explain_app_update_required` | R   | customer | “Why must I update the app?”, “Skip this update”                    | `appGate`* kill switch / nudge                                  |
| **4.13.5** | `explain_analytics_consent`   | R   | customer | “Why are you asking about analytics?”, “Turn off usage tracking”    | `analyticsConsent`*                                             |
| **4.13.6** | `explain_home_screen_widget`  | R   | customer | “Add next appointment to home screen”, “What does the widget show?” | `widgetNextAppointment`* / quick rebook                         |


- [x] **ai-cmd-customer-4.13.1** — `enable_push_notifications`
- [x] **ai-cmd-customer-4.13.2** — `explain_push_permission`
- [x] **ai-cmd-customer-4.13.3** — `explain_offline_mode`
- [x] **ai-cmd-customer-4.13.4** — `explain_app_update_required`
- [x] **ai-cmd-customer-4.13.5** — `explain_analytics_consent`
- [x] **ai-cmd-customer-4.13.6** — `explain_home_screen_widget`

---



### ai-cmd-customer-4.14 — Clinic intake, documents & lab-to-book — **customer + public**


| ID         | Intent (proposed)              | R/M | Surfaces | Example prompts                                                          | Notes                                                                      |
| ---------- | ------------------------------ | --- | -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **4.14.1** | `explain_public_intake_form`   | R   | both     | “Why these health questions?”, “Can I skip the form?”                    | `publicIntakeCheckout`* before booking                                     |
| **4.14.2** | `complete_intake_and_book`     | M   | both     | “Fill intake and book blood draw”                                        | Compound intake → slot                                                     |
| **4.14.3** | `explain_patient_alert`        | R   | customer | “What is this red banner?”, “Results ready — what do I do?”              | `ConsumerPatientAlertsBanner` released / intake / lab-book                 |
| **4.14.4** | `book_lab_from_order`          | M   | customer | “Book collection for my lab order”, “Schedule draw from Lab to book tab” | `LabToBookPage` / `myLabToBook`*                                           |
| **4.14.5** | `list_my_documents`            | R   | customer | “Show my referral letter”, “Where are my imaging reports?”               | `myDocuments`* — NOT `list_my_test_results`                                |
| **4.14.6** | `explain_abnormal_result_flag` | R   | customer | “What does high mean on my CBC?”, “Is abnormal serious?”                 | Measurement flags — general FAQ, not medical advice                        |
| **4.14.7** | `notify_when_results_ready`    | R   | customer | “Text me when results are ready”                                         | Read-only explain until `notify_patient_result_ready` customer path exists |


- [x] **ai-cmd-customer-4.14.1** — `explain_public_intake_form`
- [x] **ai-cmd-customer-4.14.2** — `complete_intake_and_book`
- [x] **ai-cmd-customer-4.14.3** — `explain_patient_alert`
- [x] **ai-cmd-customer-4.14.4** — `book_lab_from_order`
- [x] **ai-cmd-customer-4.14.5** — `list_my_documents`
- [x] **ai-cmd-customer-4.14.6** — `explain_abnormal_result_flag`
- [x] **ai-cmd-customer-4.14.7** — `notify_when_results_ready` (read explain)

---



### ai-cmd-customer-4.15 — Package visits (multi-appointment bundles) — **customer**


| ID         | Intent (proposed)             | R/M | Surfaces | Example prompts                                                            | Notes                                                 |
| ---------- | ----------------------------- | --- | -------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| **4.15.1** | `list_my_package_visits`      | R   | customer | “How many package visits left?”, “When is my next facial in the bundle?”   | `ConsumerPackageVisitActions` / grouped account cards |
| **4.15.2** | `cancel_package_visit`        | M   | customer | “Cancel visit 2 of my package”, “Skip next package appointment”            | Distinct from `cancel_my_booking` (single booking)    |
| **4.15.3** | `reschedule_package_visit`    | M   | customer | “Move package visit 3 to next week”                                        | `reschedulePackageVisit`*                             |
| **4.15.4** | `explain_package_visit_rules` | R   | customer | “Can I cancel one visit and keep the package?”, “Do unused visits expire?” | Package T&C from catalog                              |


- [x] **ai-cmd-customer-4.15.1** — `list_my_package_visits` full DoD — 6 pre-existing failing `promotion-i18n-list-package-visits-*` eval cases (all HY/RU) fixed: `isListMyPackageVisitsCustomerPrompt` (`ai-self-service-booking.util.ts`) had zero Armenian/Russian detection at all — the DoD had shipped EN-only. Added HY/RU package+visit-word regexes (`այց`+bundle loanword, `визит`+`пакет`/bundle loanword) to `packageContext`; HY quantity words (`մնաց`/`Քանի`), Russian `осталось`/`сколько`, and a broad "any Armenian/Cyrillic script implies self-scope" fallback (safe here since this domain has no dashboard-admin equivalent phrased in those scripts, and the earlier `hasDashboardCustomerReference` bail-out already screens out admin-tone asks) to `selfScope`; HY `ցույց`/`մնաց` and Russian `покажи`/`показать`/`осталось` to `readCue`. Hit one classic JS regex pitfall mid-fix: `\b` word-boundary assertions don't work reliably adjacent to non-Latin scripts (Cyrillic/Armenian aren't part of `\w`), so a `/мо[ийя]\b/i` "my" check silently never matched — dropped the trailing `\b` to match this codebase's established convention of boundary-free literal-word regexes for non-Latin scripts. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-self-service-booking`/`ai-list-my-package-visits-customer`/sibling package-visit domains + eval spec: 212/215 pass (only the known pre-existing eval-suite failure and 2 pre-existing, unrelated `matchCustomerOwnedPackageVisit` bookingId-matching failures remain, confirmed via `git stash` and flagged separately).
- [x] **ai-cmd-customer-4.15.2** — `cancel_package_visit` / `cancel_package_visit_self`
- [x] **ai-cmd-customer-4.15.3** — `reschedule_package_visit` / `reschedule_package_visit_self`
- [x] **ai-cmd-customer-4.15.4** — `explain_package_visit_rules`

---



### ai-cmd-customer-4.16 — Recommendations & upsell — **customer + public**


| ID         | Intent (proposed)                  | R/M | Surfaces | Example prompts                                                    | Notes                                                           |
| ---------- | ---------------------------------- | --- | -------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| **4.16.1** | `explain_checkout_recommendations` | R   | both     | “Why these product suggestions?”, “Shop the recommended serum”     | **Shipped** — extend success-screen disambiguation vs **4.3.5** |
| **4.16.2** | `dismiss_recommendations`          | M   | customer | “Hide You might also like”, “Stop showing product cards”           | Navigate/dismiss action — not cancel booking                    |
| **4.16.3** | `explain_subscription_vs_one_time` | R   | both     | “Subscribe and save vs one visit?”, “Which plan includes massage?” | `checkoutUseSubscription` / plan picker                         |
| **4.16.4** | `buy_gift_card_for_someone`        | M   | customer | “Buy a $100 gift card for my mom”, “Email a digital gift card”     | `GiftCardCatalogPage` → checkout                                |


- [x] **ai-cmd-customer-4.16.1** — HY/RU for `explain_checkout_recommendations`
- [x] **ai-cmd-customer-4.16.2** — `dismiss_recommendations` (mutate navigate)
- [x] **ai-cmd-customer-4.16.3** — `explain_subscription_vs_one_time`
- [x] **ai-cmd-customer-4.16.4** — `buy_gift_card_for_someone`

---



### ai-cmd-customer-4.17 — Sign-in, recovery & manage-booking links — **both**


| ID         | Intent (proposed)           | R/M | Surfaces | Example prompts                                                        | Notes                                                                            |
| ---------- | --------------------------- | --- | -------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **4.17.1** | `explain_why_sign_in`       | R   | both     | “Do I need an account?”, “What’s the benefit of signing in?”           | Guest vs authed checkout + account history                                       |
| **4.17.2** | `sign_in_to_manage_booking` | R   | both     | “Sign in to change my appointment”, “Manage link says sign in”         | `ManageBookingPage` invalid link / sign-in hint                                  |
| **4.17.3** | `recover_lost_manage_link`  | R   | both     | “I lost my booking confirmation email”, “Resend manage link to john@…” | Extend `get_manage_link` with email/phone lookup                                 |
| **4.17.4** | `switch_salon_tenant`       | R   | customer | “Go back to Salon X”, “Show salons I visited”                          | `ConsumerTenantSwitcher` + `find_my_saved_salons`                                |
| **4.17.5** | `explain_data_rights`       | R   | both     | “Export my data”, “Delete my account”                                  | **Shipped** — pair with `privacy_export` / `privacy_delete` mutate ( **4.0** P2) |


- [x] **ai-cmd-customer-4.17.1** — `explain_why_sign_in`
- [x] **ai-cmd-customer-4.17.1.1** — Fixed all 7 pre-existing failing `why-sign-in-*` eval cases. `isExplainWhySignInPrompt` (`ai-explain-why-sign-in.util.ts`) was already correct for all 7 — every failure was a stealing detector with a self-defeating or mis-ordered guard, not a missing exclusion. (1) 3 EN/customer/public cases ("Why should I sign in before booking?", "Why sign in on the booking page?", "Do I need to log in to manage my appointments?") were stolen by `isSignInToManageBookingPrompt` (`ai-sign-in-to-manage-booking.util.ts`), whose own `isBareExplainWhySignInPrompt` exclusion helper ALREADY listed the first phrase verbatim but then re-validated it against `!SIGN_IN_MANAGE_ACTION_CUE.test(prompt)` — a check that necessarily fails for phrases containing "sign in"..."booking", the exact phrases the helper exists to exclude, making the guard self-defeating. Removed the redundant `SIGN_IN_MANAGE_ACTION_CUE` re-check (kept the narrower `MANAGE_PAGE_CUE`/`INVALID_MANAGE_LINK_CUE` exclusions) and added the 2 previously-uncovered literal phrases to the list. (2) 3 hy/ru cases ("Կարո՞ղ եմ ամրագրել առանց հաշվի", "Нужен ли аккаунт для записи?", "Можно ли записаться без аккаунта?") plus 1 bonus (the same prompt via a different misclassified-action entry point) were stolen by `isSignInAfterBookingPrompt` (`ai-sign-in-after-booking.util.ts`) — this file already imported and called `isExplainWhySignInPrompt` as an exclusion guard, but placed it AFTER a bare Armenian/Cyrillic "account"+"booking"-root co-occurrence branch that returns `true` early, so the guard was already present in the code but unreachable for exactly these prompts. Moved the `isExplainWhySignInPrompt` check to run before that early-return branch instead of after it. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-sign-in-after-booking`/`ai-sign-in-to-manage-booking`/`ai-explain-why-sign-in`/`ai-intent-rescue` (182 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (78 → 71 failures) that exactly these 7 target ids disappeared with zero new ids added.
- [x] **ai-cmd-customer-4.17.2** — `sign_in_to_manage_booking`
- [x] **ai-cmd-customer-4.17.3** — `recover_lost_manage_link`
- [x] **ai-cmd-customer-4.17.4** — Full DoD for `find_my_saved_salons` + tenant switch navigate
- [x] **ai-cmd-customer-4.17.5** — Promote `privacy_export` / `privacy_delete` from **4.0** P2

---



### ai-cmd-customer-4.18 — Payment & checkout failures — **both**


| ID         | Intent (proposed)                      | R/M | Surfaces | Example prompts                                                      | Notes                                            |
| ---------- | -------------------------------------- | --- | -------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| **4.18.1** | `diagnose_stripe_checkout_failure`     | R   | both     | “Payment failed — what now?”, “Card declined at checkout”            | Customer-facing slice of dashboard diagnose      |
| **4.18.2** | `pay_at_venue_fallback`                | M   | both     | “Pay at salon instead”, “Skip online payment”                        | `activationPayAtVenue`* when prepayment optional |
| **4.18.3** | `resume_booking_draft`                 | R   | both     | “Continue where I left off”, “Restore my half-finished booking”      | `bookingDraftResume`* slot/service restore       |
| **4.18.4** | `explain_slot_no_longer_available`     | R   | both     | “That time disappeared”, “Someone took my slot”                      | Re-run `check_availability` + explain lock TTL   |
| **4.18.5** | `explain_multi_service_payment_return` | R   | customer | “I paid but booking not confirmed”, “Return from Stripe for spa day” | `multiServicePaymentReturnHint`                  |
| **4.18.6** | `retry_failed_network_action`          | R   | customer | “Booking didn’t save — retry?”, “Sync failed”                        | `networkRetryAction` / offline queue             |


- [x] **ai-cmd-customer-4.18.1** — `diagnose_stripe_checkout_failure` (customer/public)
- [x] **ai-cmd-customer-4.18.2** — `pay_at_venue_fallback`
- [x] **ai-cmd-customer-4.18.3** — `resume_booking_draft`
- [x] **ai-cmd-customer-4.18.4** — `explain_slot_no_longer_available`
- [x] **ai-cmd-customer-4.18.5** — `explain_multi_service_payment_return`
- [x] **ai-cmd-customer-4.18.6** — `retry_failed_network_action`

---



### ai-cmd-customer-4.19 — Voice assistant & accessibility — **customer + public**


| ID         | Intent (proposed)       | R/M | Surfaces | Example prompts                          | Notes                                        |
| ---------- | ----------------------- | --- | -------- | ---------------------------------------- | -------------------------------------------- |
| **4.19.1** | `explain_voice_input`   | R   | both     | “How do I use voice?”, “Mic not working” | `voiceStart` / denied / no-speech errors     |
| **4.19.2** | `speak_assistant_reply` | M   | both     | “Read that aloud”, “Speak the answer”    | `speakReply` TTS                             |
| **4.19.3** | `give_ai_feedback`      | M   | both     | “That was wrong”, “Wrong date picked”    | `feedbackUp` / `feedbackDown` + reason chips |
| **4.19.4** | `explain_rtl_layout`    | R   | both     | “Why is text on the right?”              | RTL copy / `adoption-a11y.css`               |


- [x] **ai-cmd-customer-4.19.1** — `explain_voice_input`
- [x] **ai-cmd-customer-4.19.2** — `speak_assistant_reply`
- [x] **ai-cmd-customer-4.19.3** — `give_ai_feedback`
- [x] **ai-cmd-customer-4.19.4** — `explain_rtl_layout`

---



### ai-cmd-customer-4.20 — Additional checkout & discovery edge cases — **both**


| ID         | Intent (proposed)               | R/M | Surfaces | Example prompts                                               | Notes                                                  |
| ---------- | ------------------------------- | --- | -------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| **4.20.1** | `explain_consumer_checkout_tax` | R   | customer | “Why incl. VAT on services?”, “Tax line on confirmation”      | **Shipped** — public sibling `explain_checkout_tax`    |
| **4.20.2** | `explain_deposit_forfeiture`    | R   | both     | “Do I lose my deposit if I cancel?”, “Is the 50% refundable?” | Tie `explain_cancel_policy` + `prepaymentMode=deposit` |
| **4.20.3** | `find_services_under_budget`    | R   | both     | “Anything under $50?”, “Cheapest color treatment”             | `assistantDiscoverChipUnder50` / budget discover       |
| **4.20.4** | `find_evening_weekend_slots`    | R   | both     | “Evening or weekend only”, “After 6pm Saturday”               | `assistantDiscoverChipEveningWeekend`                  |
| **4.20.5** | `explain_salon_profile`         | R   | both     | “Tell me about this salon”, “Show photos and reviews”         | `SalonProfilePage` navigate                            |
| **4.20.6** | `claim_gift_card_balance`       | M   | customer | “Redeem gift card code GCM-…”, “Add gift card to account”     | `ConsumerGiftCardClaimSection`                         |
| **4.20.7** | `explain_manage_booking_page`   | R   | both     | “What can I do on this manage page?”, “Invalid manage link”   | Guest `ManageBookingPage` UX                           |


- [x] **ai-cmd-customer-4.20.1** — Public `explain_checkout_tax` parity with consumer tax intent
- [x] **ai-cmd-customer-4.20.2** — `explain_deposit_forfeiture`
- [x] **ai-cmd-customer-4.20.3** — Wire budget discover chips → classifier
- [x] **ai-cmd-customer-4.20.4** — Wire evening/weekend discover chips → classifier
- [x] **ai-cmd-customer-4.20.5** — `explain_salon_profile`
- [x] **ai-cmd-customer-4.20.6** — `claim_gift_card_balance`
- [x] **ai-cmd-customer-4.20.7** — `explain_manage_booking_page`

---



### ai-cmd-customer-4.21 — More customer compounds


| ID         | Recipe                         | Steps                                               | Example prompt                                                |
| ---------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------- |
| **4.21.1** | `intake_lab_book_pay`          | intake → lab slot → pay online                      | “Complete health form, book earliest blood draw, pay deposit” |
| **4.21.2** | `tour_group_checkout`          | tour pax → `diagnose_tour_capacity` → book          | “Wine tour for 6 next Saturday — book if enough seats”        |
| **4.21.3** | `provider_same_day_multi`      | pick provider → multi-service afternoon block       | “Anna — massage and facial same afternoon”                    |
| **4.21.4** | `subscription_first_visit`     | explain plan → book with subscription credit        | “Use my membership for today’s massage”                       |
| **4.21.5** | `results_then_rebook`          | `explain_result_status` → `rebook_last_appointment` | “Results released — book follow-up like last time”            |
| **4.21.6** | `guest_pay_cash_manage`        | guest book → pay cash → email manage link           | “Book as guest, pay at visit, email manage link”              |
| **4.21.7** | `cancel_package_rebook_single` | cancel package visit → book single service          | “Skip package visit 2 and book a trim instead”                |


- [x] **ai-cmd-customer-4.21.1** — `intake_lab_book_pay`
- [x] **ai-cmd-customer-4.21.1.1** — Fixed all 6 pre-existing failing `intake-lab-book-pay-*` eval cases. Action/ordering already correct in every case — the sole failure was `compoundStepParams[0].params.serviceName`, extracted by `extractLabServiceNameFromIntakeBookPrompt` (`ai-complete-intake-and-book.util.ts`). Two distinct gaps: (1) EN "Complete health questions, book earliest lab draw, pay with card" fell through the bare `\bblood\b`/`\blab\b` fallback checks — no "blood" word present, so it hit the generic bare-`lab` branch and returned the generic `'lab test'` instead of the semantically-specific `'blood draw'` the fixture expects for "lab draw" phrasing; added a `\blab\s+draw\b` check (ordered before the bare `lab` fallback) that maps directly to `'blood draw'`. (2) All 4 HY/RU multilingual cases returned `undefined` — zero non-English coverage in this function at all; added Armenian `արյան` (blood) → `'blood draw'` and `լաբ` (lab loanword) → `'lab test'`, and Russian `кров` (blood root, covers `крови`/`кровь`) → `'blood draw'` and `лаб` (lab loanword) → `'lab test'`, ordered after the English checks so blood-specific matches take priority over the generic lab fallback in both scripts, mirroring the established EN precedence. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-complete-intake-and-book`/`ai-intake-lab-book-pay-compound`/`ai-book-lab-collection` (161 tests): all pass. Confirmed via full golden-eval-set diff (231 → 225 failures) that exactly these 6 target ids disappeared with zero new ids added; a broader `ai-clinic`/`ai-pre-visit-intake`/`ai-explain-lab-prep` sweep showed 12 pre-existing unrelated failures (`ai-clinic-v2-6-multilingual` domain) confirmed identical with and without this change via `git stash`.
- [x] **ai-cmd-customer-4.21.2** — `tour_group_checkout`
- [x] **ai-cmd-customer-4.21.3** — `provider_same_day_multi`
- [x] **ai-cmd-customer-4.21.4** — `subscription_first_visit`
- [x] **ai-cmd-customer-4.21.5** — `results_then_rebook`
- [x] **ai-cmd-customer-4.21.6** — `guest_pay_cash_manage`
- [x] **ai-cmd-customer-4.21.7** — `cancel_package_rebook_single`

---



### ai-cmd-customer-4 — Suggested implementation order


| Phase                      | IDs                                                                                                          | Customer outcome                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **A — Checkout clarity**   | **4.2.1**–**4.2.2**, **4.1.2**, **4.18.1**–**4.18.3**, **4.0** (`pay_online`, `explain_why_stripe_required`) | Less “how much do I pay?” / guest field / payment failure confusion |
| **B — Self-serve visits**  | **4.4.2**–**4.4.3**, **4.4.5**, **4.17.3**, **4.8.3**, **4.20.7**                                            | Cancel/reschedule / recover manage link without calling             |
| **C — Faster rebooking**   | **4.4.8**, **4.3.6**, **4.8.2**, **4.21.5**                                                                  | One-tap repeat bookings + post-results follow-up                    |
| **D — Discovery**          | **4.1.3**, **4.1.5**, **4.1.7**, **4.20.3**–**4.20.4**, **4.11.***                                           | Find affordable / soonest slot / stylist in one ask                 |
| **E — Loyalty & packages** | **4.5.***, **4.6.***, **4.15.***, **4.8.4**, **4.21.4**                                                      | Subscriptions, gift cards, spa packages, package visits             |
| **F — Clinic & tours**     | **4.7.***, **4.10.***, **4.14.***, **4.21.1**–**4.21.2**                                                     | Lab prep, results, intake, tour capacity                            |
| **G — App polish**         | **4.9.***, **4.12.***, **4.13.***, **4.19.***                                                                | Chips, reviews, push/offline, voice                                 |
| **H — Upsell & growth**    | **4.16.***, **4.12.4**, **4.5.7**, **4.17.4**                                                                | Recommendations, referrals, saved salons                            |


**Key files (customer):**


| Layer      | Public web                                         | Consumer mobile                                             |
| ---------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Classifier | `public-booking-classifier.schema.ts`              | `customer-ai-command.util.ts`                               |
| Handler    | `PublicBookingAssistantService`                    | `CustomerAiCommandService` → `customer-ai-command.logic.ts` |
| Rescue     | `PublicBookingAssistantService.chat()`             | `CustomerAiCommandService` + `rescueConsumerAdoptionIntent` |
| Fixtures   | `surface: public | both` in domain `*.fixtures.ts` | `surface: customer | both`                                  |
| Eval       | `AI_COMMAND_EVAL_*` with `surface: public`         | same harness with `surface: customer`                       |


**Cross-links:** **ai-cmd-customer-1**–**3** (discovery spine), **ai-cmd-ext-7** (payment explain parity with dashboard config), **ai-cmd-h1**–**h4** (NLU quality), **feature-ai-prompt-coverage** (both surfaces mandatory).

---



## ai-cmd-customer-6 — Customer public API ↔ AI coverage audit

**Audit (2026-06):** Map every customer/consumer/public REST call to an AI intent (or document intentional UI-only / no-AI). Sources: `public-booking.controller.ts`, `gift-card-public.controller.ts`, `consumer-app/src/services/public-api.ts`, `frontend/src/lib/public-api.ts`.

**Totals:** ~~**95** HTTP operations → **~~38 covered** (handler wired), **~32 partial** (deferred registry / read-only explain / navigate handoff), **~25 gaps** (no intent or API-only with no assistant path).

**Bulk note:** Customer public API has **no** dashboard-style `bulk_create` / `bulk_update` / `bulk_delete` routes. “Bulk” customer behavior is **array/batch semantics inside single endpoints** — multi-service cart, `book_multi_service`, package reschedule `lines[]`, GDPR export (single dump). New AI work should use **compounds** or **array params** on existing intents, not invent REST bulk routes unless product adds them.

---



### ai-cmd-customer-6.0 — Coverage legend


| Status         | Meaning                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **✅ Covered**  | Intent in registry + handler in `customer-ai-command.logic.ts` or `PublicBookingAssistantService` |
| **🟡 Partial** | Intent exists but **deferred**, explain-only, or does not call the API mutate path                |
| **🔴 Gap**     | No intent; user cannot accomplish via assistant                                                   |
| **⚪ N/A**      | Telemetry, static config, or auth bootstrap — no AI needed                                        |


---



### ai-cmd-customer-6.1 — Discovery & catalog (read)


| API                                                                   | Status | Intent(s)                                                                                                                              | Gap / action                                       |
| --------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `GET /public/:slug`                                                   | 🟡     | `business_info` (public)                                                                                                               | Extend profile fields (app install, privacy flags) |
| `GET …/services`, `…/providers`, slots, nearest-slot, for-slot        | ✅      | `list_services`, `list_providers`, `check_availability`, `check_providers_for_service`, `book_nearest_slot`                            | Harden deferred                                    |
| `GET …/packages`, suggest-*, block-slots, providers                   | ✅      | `discover_packages`, `check_package_availability`, `check_package_line_availability`, `suggest_package_block`                          | —                                                  |
| `GET …/multi-service/*` (settings, block-slots, suggest-*, providers) | ✅      | `check_multi_service_availability`, `check_multi_service_block_availability`, `show_cart_total_duration`, `preview_multi_service_cart` | —                                                  |
| `GET …/services/:id/subscription-plans`                               | 🟡     | `discover_subscription_plans`, `select_subscription_plan`                                                                              | Read path OK; promote deferred                     |
| `GET …/promotions`                                                    | ✅      | `list_public_promotions`                                                                                                               | —                                                  |
| `GET …/providers/:id/reviews`                                         | ✅      | `list_provider_reviews` (read before book)                                                                                             | —                                                  |
| `GET …/app-install`                                                   | 🟡     | `how_to_download_app`, `switch_to_consumer_app`                                                                                        | Align copy with QR landing                         |


- [x] **ai-cmd-customer-6.1.1** — `preview_multi_service_cart` → `POST …/multi-service/preview`
- [x] **ai-cmd-customer-6.1.2** — `list_public_promotions` → `GET …/promotions`
- [x] **ai-cmd-customer-6.1.3** — `list_provider_reviews` → `GET …/providers/:id/reviews`
- [x] **ai-cmd-customer-6.1.4** — `suggest_package_block` navigate → package suggest-block/suggest-slots APIs

---



### ai-cmd-customer-6.2 — Booking checkout pipeline (mutate + quote)


| API                                       | Status | Intent(s)                                                 | Gap / action                |
| ----------------------------------------- | ------ | --------------------------------------------------------- | --------------------------- |
| `POST …/bookings/quote`                   | ✅      | `get_booking_quote`, `promo_code_help` (explain only)     | —                           |
| `POST …/bookings`                         | ✅      | `book_with_cash`, `book_nearest_slot`, `book_appointment` | —                           |
| `POST …/bookings/checkout`                | 🟡     | `pay_online`, `choose_payment_method`                     | Promote **4.0 P0**          |
| `POST …/bookings/confirm-payment`         | ✅      | `confirm_stripe_payment`                                  | —                           |
| `POST …/packages/quote`                   | ✅      | `get_package_quote`                                       | —                           |
| `POST …/packages/book`, `…/checkout`      | ✅      | `book_package`, `pay_online`                              | —                           |
| `POST …/multi-service/quote`              | ✅      | `get_multi_service_quote`                                 | —                           |
| `POST …/multi-service/book`, `…/checkout` | 🟡     | `book_multi_service`, `pay_online`                        | Promote deferred **4.0 P1** |


- [x] **ai-cmd-customer-6.2.1** — `get_booking_quote` → `POST …/bookings/quote`
- [x] **ai-cmd-customer-6.2.2** — `confirm_stripe_payment` → `POST …/bookings/confirm-payment`
- [x] **ai-cmd-customer-6.2.3** — `get_package_quote` → `POST …/packages/quote`
- [x] **ai-cmd-customer-6.2.4** — `get_multi_service_quote` → `POST …/multi-service/quote`

---



### ai-cmd-customer-6.3 — Manage booking (guest token + logged-in)


| API                                         | Status | Intent(s)                                                                | Gap / action                                                                |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `GET …/me/bookings`                         | ✅      | `list_my_appointments`, `my_appointments`                                | —                                                                           |
| `POST …/me/bookings/:id/cancel`             | 🟡     | `cancel_my_booking`                                                      | **Shipped** — customer self-serve cancel (**ai-cmd-customer-4.4.2**)        |
| `POST …/me/bookings/:id/reschedule`         | 🟡     | `reschedule_my_booking`, `change_provider_on_reschedule`                 | Promote **4.0 P0**                                                          |
| `POST …/me/bookings/:id/package/cancel`     | 🟡     | `cancel_package_visit_self`                                              | Promote **4.0 P2**                                                          |
| `POST …/me/bookings/:id/package/reschedule` | ✅      | `reschedule_package_visit_self`                                          | Auto-builds `lines[]` from parsed NL date/time (`reschedule_package_lines`) |
| `GET …/bookings/manage`                     | 🟡     | `get_manage_link`                                                        | `explain_manage_booking_context` read **4.20.7**                            |
| `POST …/bookings/manage/cancel`             | ✅      | `cancel_booking_with_token` (guest)                                      | —                                                                           |
| `POST …/bookings/manage/reschedule`         | ✅      | `reschedule_booking_with_token` (guest)                                  | —                                                                           |
| `POST …/bookings/manage/package/*`          | ✅      | `cancel_package_visit_with_token`, `reschedule_package_visit_with_token` | —                                                                           |


- [x] **ai-cmd-customer-6.3.1** — Guest manage-token mutates (**6.3** table) — customer classifier parity (customer surface only, matching `get_manage_link`)
- [x] **ai-cmd-customer-6.3.2** — `reschedule_package_lines` — one NL command → `lines[]` on package reschedule API
- [x] **ai-cmd-customer-6.3.3** — Compound `guest_manage_visit`: `get_manage_link` → cancel/reschedule with token

---



### ai-cmd-customer-6.4 — Pre-visit intake (full gap)


| API                                      | Status | Intent(s)                                                                           | Gap / action |
| ---------------------------------------- | ------ | ----------------------------------------------------------------------------------- | ------------ |
| `GET …/checkout/pre-visit-intake/config` | 🟡     | `explain_public_intake_form` (**4.14.1** proposed)                                  | Read         |
| `POST …/me/pre-visit-intake/draft`       | ✅      | `create_intake_draft`                                                               | —            |
| `GET …/me/pre-visit-intake/:id`          | ✅      | `get_intake_flow_status`                                                            | —            |
| `POST …/…/start`                         | ✅      | `start_pre_visit_intake`                                                            | —            |
| `POST …/…/answers`                       | ✅      | `submit_intake_answers` (single + batch answers walked sequentially in one session) | —            |


- [x] **ai-cmd-customer-6.4.1** — Intake mutate chain: draft → start → submit → continue booking (**4.14.2**, **4.21.1**)
- [x] **ai-cmd-customer-6.4.2** — Compound `complete_intake_and_book` wired to real API handlers (now calls `ensureCustomerDraft`, returns real `intakeId`)

---



### ai-cmd-customer-6.5 — Account, auth, locale, privacy


| API                                       | Status | Intent(s)                                                     | Gap / action             |
| ----------------------------------------- | ------ | ------------------------------------------------------------- | ------------------------ |
| `POST …/auth/google                       | apple  | phone`                                                        | ✅                        |
| `GET …/auth/me`                           | ✅      | `my_profile`                                                  | —                        |
| `GET/PATCH …/me/locale`                   | ✅      | `get_my_locale`, `update_my_locale`                           | —                        |
| `GET/PATCH …/me/notification-preferences` | 🟡     | `manage_notification_preferences`, `explain_my_notifications` | Promote adoption intents |
| `GET/DELETE …/me/data`                    | 🟡     | `privacy_export`, `privacy_delete`, `explain_data_rights`     | Promote **4.0 P2**       |


- [x] **ai-cmd-customer-6.5.1** — `update_my_locale` → `PATCH …/me/locale` (+ `get_my_locale` read)
- [x] **ai-cmd-customer-6.5.2** — Auth mutate handoff intents (Google/Apple/Phone) — explain + deep link, not store password via AI
- [x] **ai-cmd-customer-6.5.3** — AI-side `update_my_profile` navigate handoff already shipped (returns `apiBlockedReason`); `PATCH …/me/profile` confirmed absent everywhere in the backend (checked customer/auth/provider-mobile/business modules) — genuinely blocked on product API, not an AI-wiring gap

---



### ai-cmd-customer-6.6 — Loyalty, rewards, referrals, share


| API                                             | Status | Intent(s)                                                           | Gap / action                       |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------- | ---------------------------------- |
| `GET …/me/loyalty`                              | 🟡     | `loyalty_points_balance`                                            | `explain_loyalty_points` **4.5.1** |
| `GET …/me/rewards`                              | ✅      | `explain_rewards_wallet` (promos + points)                          | —                                  |
| `GET …/me/referral`                             | 🟡     | `refer_a_friend`                                                    | Read OK                            |
| `POST …/me/referral/claim`                      | ✅      | `claim_referral_code`                                               | —                                  |
| `GET …/me/share-rewards`                        | 🟡     | `share_my_booking`, `share_salon_link`                              | Explain share rewards **4.12.4**   |
| `POST …/me/share-rewards/claim`                 | ✅      | `claim_share_reward`                                                | —                                  |
| `GET …/me/subscriptions`, `…/active`, `…/usage` | 🟡     | `my_subscriptions`, `subscription_usage`, `use_subscription_credit` | Promote **4.5.3**                  |


- [x] **ai-cmd-customer-6.6.1** — `explain_rewards_wallet` → `GET …/me/rewards`
- [x] **ai-cmd-customer-6.6.2** — `claim_referral_code` → `POST …/me/referral/claim`
- [x] **ai-cmd-customer-6.6.3** — `claim_share_reward` → `POST …/me/share-rewards/claim`

---



### ai-cmd-customer-6.7 — Gift cards


| API                                       | Status | Intent(s)                                                                      | Gap / action                                                                                                                                  |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET …/gift-cards/catalog`                | ✅      | `discover_gift_card_products`, `buy_gift_card`                                 | —                                                                                                                                             |
| `POST …/quote`, `checkout`, `purchase`    | ✅      | `buy_gift_card`, `buy_gift_card_physical`, `pay_online`, `get_gift_card_quote` | Shipped `get_gift_card_quote` (any cardType, shipping-aware)                                                                                  |
| `POST …/claim`                            | ✅      | `apply_gift_card_code`, `claim_gift_card_balance`                              | Already covered — `claim_gift_card_balance` (**4.20.6**) calls the same `claimByCode`; no separate `claim_gift_card_to_account` intent needed |
| `GET …/orders`, `…/orders/:id`            | ✅      | `my_gift_cards`, `track_physical_gift_card_order`, `explain_gift_card_order`   | Shipped `explain_gift_card_order` (single-order detail incl. cancel/modify policy)                                                            |
| `POST …/cancel-request`, `modify-request` | 🟡     | `request_gift_card_cancel`, `request_gift_card_modify`                         | Promote **4.0 P2**                                                                                                                            |


- [x] **ai-cmd-customer-6.7.1** — `get_gift_card_quote` → `POST …/gift-cards/quote`
- [x] **ai-cmd-customer-6.7.2** — `claim_gift_card_to_account` → already covered by shipped `claim_gift_card_balance` (**4.20.6**), same `POST …/gift-cards/claim` route; no new intent added
- [x] **ai-cmd-customer-6.7.3** — `explain_gift_card_order` → `GET …/gift-cards/orders/:id`

---



### ai-cmd-customer-6.8 — Clinic (results, documents, alerts, lab-to-book)


| API                                    | Status | Intent(s)                                             | Gap / action                                                                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET …/me/clinic-test-results`         | 🟡     | `list_my_test_results`, `explain_result_status`       | Promote clinic deferred                                                                                            |
| `GET …/me/clinic-lab-booking-requests` | 🟡     | `list_my_lab_booking_requests`, `book_lab_collection` | **4.14.4**                                                                                                         |
| `GET …/me/clinic-documents`            | ✅      | `list_my_documents`                                   | Already covered — generic (no category required)                                                                   |
| `GET …/me/clinic-documents/:id`        | ✅      | `open_clinic_document`                                | Shipped — single-document detail incl. downloadUrl                                                                 |
| `GET …/me/clinic-patient-alerts`       | 🟡     | `explain_patient_alert` (**4.14.3** proposed)         | Read                                                                                                               |
| `POST …/…/dismiss`                     | ✅      | `dismiss_patient_alert`                               | Shipped — calls `dismissAlertForCustomerAccount`, distinct from `explain_patient_alert`'s client-side-only dismiss |


- [x] **ai-cmd-customer-6.8.1** — `open_clinic_document` (`list_my_clinic_documents` already covered by shipped `list_my_documents`, no new intent needed)
- [x] **ai-cmd-customer-6.8.2** — `dismiss_patient_alert` → `POST …/clinic-patient-alerts/…/dismiss`

---



### ai-cmd-customer-6.9 — Reviews & support


| API                                       | Status | Intent(s)                                  | Gap / action                                                                                     |
| ----------------------------------------- | ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `GET …/reviews/context`, `POST …/reviews` | ✅      | `submit_review_with_token`                 | Shipped — guest email-link flow (bookingId+token, no session)                                    |
| `POST …/providers/:id/reviews`            | ✅      | `submit_provider_review`                   | Shipped — customer + public surfaces, optional Google idToken for anon                           |
| `GET/POST …/me/bookings/:id/review`       | ✅      | `leave_visit_review` (**4.12.1**)          | Already covered — same `submitCustomerReview` API; no separate `submit_my_booking_review` needed |
| `POST …/me/support/ticket`                | ✅      | `contact_support`, `open_ticket_for_order` | —                                                                                                |


- [x] **ai-cmd-customer-6.9.1** — `submit_my_booking_review` → already covered by shipped `leave_visit_review` (**4.12.1**), same logged-in review API; no new intent added
- [x] **ai-cmd-customer-6.9.2** — `submit_provider_review` → provider review API
- [x] **ai-cmd-customer-6.9.3** — `submit_review_with_token` → guest email review flow

---



### ai-cmd-customer-6.10 — Checkout recommendations & upsell


| API                                      | Status | Intent(s)                                       | Gap / action                   |
| ---------------------------------------- | ------ | ----------------------------------------------- | ------------------------------ |
| `GET …/checkout/recommendations`         | 🟡     | `explain_checkout_recommendations`              | Read                           |
| `POST …/checkout/recommendations/events` | ⚪      | —                                               | Analytics — no AI              |
| Dismiss UI (client-only)                 | 🔴     | `dismiss_recommendations` (**4.16.2** proposed) | Client state — navigate intent |


- [x] **ai-cmd-customer-6.10.1** — `dismiss_recommendations` — client navigate + session flag (no REST)

---



### ai-cmd-customer-6.11 — Push, mobile config, analytics


| API                              | Status | Intent(s)                                             | Gap / action                                                  |
| -------------------------------- | ------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| `POST …/me/push/register-native` | ✅      | `enable_push_notifications`, `register_customer_push` | Shipped — token registration + analyticsAnonId linking        |
| `POST …/me/push/delivery-ack`    | ⚪      | —                                                     | Background — no AI                                            |
| `GET …/me/push/native-status`    | ✅      | `explain_push_registration_status`                    | Shipped                                                       |
| `GET /mobile-app/config`         | 🟡     | `explain_app_update_gate` (**4.13.4** proposed)       | Consumer version gate                                         |
| `POST /events/app`               | ⚪      | —                                                     | Analytics consent UI — `explain_analytics_consent` **4.13.5** |
| `GET …/assistant/capabilities`   | ⚪      | —                                                     | Meta — chips derive from parity file                          |
| `POST …/assistant`               | ✅      | All customer/public intents                           | Gateway                                                       |


- [x] **ai-cmd-customer-6.11.1** — `register_customer_push` → `POST …/me/push/register-native`
- [x] **ai-cmd-customer-6.11.2** — `explain_push_registration_status` → `GET …/me/push/native-status`

---



### ai-cmd-customer-6.12 — “Bulk-like” batch semantics (no REST bulk routes)

Customer APIs encode **multi-record** work inside single calls — AI should mirror with **array params** or **compounds**, not dashboard `bulk_`* intents.


| Batch pattern                     | API shape                             | Current AI                                                             | Proposed                                                                                                                               |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-add cart**                | Client loops or single preview        | `add_services_to_cart` accepts `serviceNames[]`/`serviceIds[]` already | ✅ Already covered — `resolveServices` + `extractServiceNamesFromPrompt` resolve multiple names from one prompt ("add X and Y to cart") |
| **Multi-service book**            | `POST multi-service/book` one payload | `book_multi_service` deferred                                          | Promote + compound with quote                                                                                                          |
| **Package multi-line reschedule** | `lines[]` on package reschedule       | `reschedule_package_visit_self`, `reschedule_package_lines`            | ✅ Shipped — `reschedule_package_lines` parses "visits N and M" into an explicit `lines[]` array                                        |
| **Intake multi-answer**           | Repeated `POST …/answers`             | —                                                                      | `submit_intake_answers` batch in one compound step                                                                                     |
| **Cancel all upcoming**           | ❌ no API                              | —                                                                      | **Out of scope** until `POST me/bookings/bulk-cancel` exists; do not fake via AI loop without confirm                                  |
| **Export all data**               | Single `GET me/data` dump             | `privacy_export`                                                       | ✅ single-shot “bulk read”                                                                                                              |
| **Delete account**                | Single `DELETE me/data`               | `privacy_delete`                                                       | ✅ single-shot “bulk delete”                                                                                                            |


- [x] **ai-cmd-customer-6.12.1** — `add_services_to_cart` already accepted `serviceIds[]`/`serviceNames[]` for true multi-add in one NL command; no code change needed
- [x] **ai-cmd-customer-6.12.2** — `reschedule_package_lines` — maps NL “move visits 2 and 3 to next week” → `lines[]`
- [x] **ai-cmd-customer-6.12.3** — Documented: no customer bulk-delete bookings API exists; redirect to `cancel_my_booking` per visit or `contact_support`
- [x] **ai-cmd-customer-6.12.4** — Documented: if product adds bulk APIs later, add rows to `customer-public-api-ai-parity.fixtures.ts` first

---



### ai-cmd-customer-6.13 — Parity gate (mirror **prov-exp-11**)

Automate this audit so new public endpoints cannot ship without an AI mapping row.


| ID         | Task                                              | Notes                                                                                                                                                               |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6.13.1** | `customer-public-api-ai-parity.fixtures.ts`       | ✅ Shipped — ~85 rows covering every tracked web-widget + consumer-app `public-api.ts` export → `{ kind: 'customer-ai' | 'public-ai' | 'dashboard-only' | 'no-ai' }` |
| **6.13.2** | `customer-public-api-ai-parity.util.spec.ts` gate | ✅ Shipped — mirrors `provider-exp-ai-parity.util.spec.ts`; fails on unknown intent, missing reason, or duplicate id                                                 |
| **6.13.3** | Extend `auditCustomerIntentCoverage()`            | ✅ Shipped — `hasApiBinding` field + `listMutatingCustomerIntentsMissingApiBinding()`; found 2 real gaps (see notes)                                                 |
| **6.13.4** | `ai-cmd-customer-gap-9`                           | ✅ Documented below — block feature **done** until API row has intent or explicit `no-ai` reason                                                                     |


- [x] **ai-cmd-customer-6.13.1** — Created `customer-public-api-ai-parity.fixtures.ts` + `.util.ts` from this audit table
- [x] **ai-cmd-customer-6.13.2** — Wired the parity gate as `customer-public-api-ai-parity.util.spec.ts` (jest, mirrors `test:prov-exp-ai-parity`'s pattern — no separate npm script exists for the provider gate either)
- [x] **ai-cmd-customer-6.13.3** — Extended `auditCustomerIntentCoverage()`/`CustomerIntentCoverageRow` with `hasApiBinding`; added `listMutatingCustomerIntentsMissingApiBinding()`. Found 2 genuine, documented gaps: `join_waitlist` and `notify_running_late` have real backend routes (`POST me/waitlist`, `POST me/bookings/:id/running-late`) but **no** `public-api.ts` **client export in either the web widget or consumer app yet** — a real product gap, tracked as an exception in the gate test rather than faked. `add_services_to_cart`/`remove_service_from_cart` are correctly REST-less (pure client cart session state)
- [x] **ai-cmd-customer-6.13.4** — This audit table (**ai-cmd-customer-6.1**–**6.12**) is the `ai-cmd-customer-gap-9` parity source; new customer/public endpoints should get a row in `customer-public-api-ai-parity.fixtures.ts` before being marked done

---



### ai-cmd-customer-6 — Gap summary (new intents to register)

**Status: all of 6.1–6.13 shipped.** Several of the intents originally planned as new below turned out to already be covered by an existing intent under a different name (`claim_gift_card_to_account`→`claim_gift_card_balance`, `list_my_clinic_documents`→`list_my_documents`, `submit_my_booking_review`→`leave_visit_review`) — see each subsection's table for the final mapping. This bucket list is kept for historical planning context.

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


| Phase                   | IDs                    | Closes API gaps                                  |
| ----------------------- | ---------------------- | ------------------------------------------------ |
| **A — Quote & pay**     | **6.2.*** , **6.12.1** | Checkout quote + Stripe confirm + multi-add cart |
| **B — Guest manage**    | **6.3.***              | Manage-token cancel/reschedule                   |
| **C — Intake + clinic** | **6.4.*** , **6.8.***  | Intake chain + documents + dismiss alert         |
| **D — Growth**          | **6.6.*** , **6.7.***  | Referral/share claim, gift quote/claim           |
| **E — Reviews & push**  | **6.9.*** , **6.11.*** | Submit review, push register                     |
| **F — Gate**            | **6.13.***             | Parity CI so gaps don’t regress                  |


**Cross-links:** **ai-cmd-customer-4** (ease-of-life — many proposed intents overlap **6.x** rows), **ai-cmd-customer-gap-5** (eval/fixtures), **ai-cmd-ext-7** (payment explain), **feature-ai-prompt-coverage** (both surfaces).

---



### ai-cmd-customer-6.14 — Product blockers & out-of-scope (not AI-only work)


| ID         | Item                                                    | Why it affects AI                                                                                                                                                                                                                                                                                                                     | Action                                                                   |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **6.14.1** | **Nearest-slot path mismatch**                          | Consumer app calls `GET /public/:slug/nearest-slot?serviceId=` but backend is `GET …/services/:serviceId/nearest-slot` — breaks `book_nearest_slot` / discovery from app                                                                                                                                                              | ✅ done — fixed `consumer-app/src/services/public-api.ts` `fetchNearestBookableSlot` |
| **6.14.2** | **Customer waitlist join / running-late client export** | Backend routes exist (`POST/GET me/waitlist`, `POST me/waitlist/leave`, `POST me/bookings/:id/running-late`) and `join_waitlist`/`notify_running_late` intents are shipped, but neither the web widget nor consumer-app `public-api.ts` exports a client wrapper yet (found via **ai-cmd-customer-6.13.3**'s API-binding cross-check) | ✅ done — added the 4 missing client exports (see **6.14.2** below)      |
| **6.14.3** | **Customer profile PATCH**                              | `update_my_profile` (**4.5.6**) — only `PATCH me/locale` exists; no name/phone API                                                                                                                                                                                                                                                    | Product API or UI-only                                                   |
| **6.14.4** | **Deep links / tab navigation**                         | Rebook, tenant switch, manage link open — client routes, not REST                                                                                                                                                                                                                                                                     | Navigate intents only (**4.17.4**, **4.4.8**)                            |
| **6.14.5** | **Dashboard bulk ops**                                  | `bulk_create_bookings`, `bulk_smart_cancel`, etc. — **staff only**, not customer surface                                                                                                                                                                                                                                              | Track under **ai-cmd-dashboard-6**, not **6.x**                          |


- [x] **ai-cmd-customer-6.14.1** — Fixed the nearest-slot URL in `consumer-app/src/services/public-api.ts`'s `fetchNearestBookableSlot`: was calling `GET /public/:slug/nearest-slot?serviceId=X` (a route that doesn't exist) and expecting a `{ nearest: {...} } | null` response wrapper; the real backend route is `GET /public/:slug/services/:serviceId/nearest-slot?employeeId=` (`public-booking.controller.ts`, `@Controller('public/:slug')` + `@Get('services/:serviceId/nearest-slot')`) and returns the slot object directly (`NearestBookableSlot | null`, no `.nearest` wrapper — confirmed by reading the one caller, `BookPage.tsx`, which already expected the unwrapped shape). Fixed both the URL path and the double-unwrap bug in one edit; no caller changes needed since the function's external return type was unchanged. Verified: `npx tsc --noEmit` in `consumer-app/` is clean (0 errors), full `vitest run` suite green (728 tests passing).
- [x] **ai-cmd-customer-6.14.2** — Rather than just documenting the dependency, implemented the missing client exports directly (backend + AI-intent sides were already fully shipped, so this closes the loop end-to-end): added `joinMyWaitlist`, `fetchMyWaitlistStatus`, `leaveMyWaitlist` (wrapping `POST/GET me/waitlist`, `POST me/waitlist/leave`) and `notifyBookingRunningLate` (wrapping `POST me/bookings/:id/running-late`) to `consumer-app/src/services/public-api.ts`, matching the file's existing `publicConfig(slug)`-authenticated-call convention (mirrors `fetchMyReferralProgram`/`claimReferralCode`) and the exact DTO/response shapes from `PublicJoinWaitlistDto`/`PublicCustomerNotifyRunningLateDto`/`PublicCustomerWaitlistStatus` on the backend. These are plain API-client exports for the consumer-app's own UI to call directly (a separate, non-AI code path) — no new UI screens/buttons were built, matching this item's original scope (unblock the client dependency, not design a new waitlist UI). Verified: `npx tsc --noEmit` clean, full `vitest run` suite green (728 tests passing, same as **6.14.1**'s verification run).

**Next audit:** see `ai-cmd-provider-6` (provider public API ↔ AI parity — full audit below **ai-cmd-provider-5**).

---

**Goal:** Make `provider-app/` the fastest path for stylists and floor managers between appointments — voice-friendly, one-sentence actions, minimal typing. **Provider mobile only** (`ProviderAiCommandService` / `PROVIDER_INTENT_SCHEMA`); dashboard admin stays under **ai-cmd-ext**.

**Principle:** Session context first (`bookingId` from open detail modal, `lastPush`, today’s timeline). Prefer **mutate + confirm** for irreversible actions (cancel, mark paid). Mirror every **prov-exp** UI action in `PROVIDER_EXP_UI_AI_PARITY` (`provider-exp-ai-parity.fixtures.ts`).

**Pain themes from product:** check-in while greeting client, “who’s next” on busy floor, mark paid at chair, fill cancellation gaps, retail upsell without leaving booking, running late SMS, offline queue after spotty Wi‑Fi, push confirm/mark paid from notification, clinic draw queue, end-of-day sweep, pending confirmations, in-progress vs complete status, multi-service spa days, gift card fulfillment queue, patient lookup before draw, tax line on payment breakdown, team view vs own calendar scope, hands-free voice between clients.

**Baseline (already wired — harden, don’t re-build):** `summarize_client`, `check_in_client`, `mark_running_late`, `mark_paid`, `payment_sweep`, `add_retail_to_booking`, `send_client_message`, `block_my_time`, `request_time_off`, `team_floor_status`, `team_whos_next`, `suggest_waitlist_for_gap`, `confirm_booking_from_push`, `explain_last_push`, clinic collection queue — see `provider-ai-command.service.ts` switch + **ai-cmd-ext-3**.

---



### ai-cmd-provider-5.0 — Harden existing intents (prov-exp parity + eval DoD)

Shipped handlers exist; gap is ≥10 EN + HY/RU fixtures, rescue, eval `surface: provider`, integration rows per **feature-ai-prompt-coverage**.


| Priority | Intent                                               | Why it helps providers                              | prov-exp / notes             |
| -------- | ---------------------------------------------------- | --------------------------------------------------- | ---------------------------- |
| **P0**   | `mark_paid`                                          | Close visit at chair without dashboard              | push action `mark_paid`      |
| **P0**   | `check_in_client`                                    | Arrival flow                                        | **prov-exp-3.1**             |
| **P0**   | `summarize_client`                                   | Pre-visit snapshot                                  | **prov-exp-1.1**             |
| **P0**   | `show_appointments` / `summarize_my_appointments`    | “What’s on today?”                                  | **prov-exp-3.3**             |
| **P1**   | `payment_sweep`                                      | End-of-day bulk mark paid                           | suggestions `unpaid-today`   |
| **P1**   | `reschedule_booking`                                 | Move one appointment                                | push `suggest_reschedule`    |
| **P1**   | `cancel_bookings`                                    | Client cancelled by phone                           | —                            |
| **P1**   | `mark_no_shows`                                      | Close missed slots                                  | —                            |
| **P1**   | `add_retail_to_booking`                              | POS at chair                                        | **prov-exp-5.1**             |
| **P1**   | `send_client_message`                                | SMS/WhatsApp without copy-paste                     | **prov-exp-6.1**             |
| **P2**   | `team_floor_status` / `team_whos_next`               | Manager floor                                       | **prov-exp-4.1** / **4.3**   |
| **P2**   | `suggest_waitlist_for_gap`                           | Fill open shift                                     | **prov-exp-7.3**             |
| **P2**   | `list_my_collection_queue`                           | Clinic draw list                                    | clinic vertical              |
| **P2**   | `offline_queue_status` / `retry_offline_action`      | Spotty salon Wi‑Fi                                  | offline assistant            |
| **P3**   | `update_bookings`                                    | Start service / in-progress without full reschedule | booking detail status picker |
| **P3**   | `explain_appointment_tax` / `explain_payment_status` | “Why pending?” / VAT on breakdown                   | `BookingPaymentBreakdown`    |
| **P3**   | `list_my_multi_service_groups`                       | Spa-day sequence at chair                           | multi-service badge          |
| **P3**   | `configure_provider_push_date_format`                | Push times look wrong                               | fmt-1.8 push bodies          |


- [ ] **ai-cmd-provider-5.0.1** — Audit `PROVIDER_EXP_UI_AI_PARITY` → every `provider-ai` row has ≥10 NL fixtures + eval
- [ ] **ai-cmd-provider-5.0.2** — `npm run test:prov-exp-ai-parity` gate — fail on new UI action without intent mapping
- [ ] **ai-cmd-provider-5.0.3** — Promote P0 table through locale parity spec (pattern: `ai-provider-*-locale-parity.spec.ts`)
- [x] **ai-cmd-provider-5.0.4** — Fixed 16 pre-existing failing `provider-exp-2-*` eval cases (Tier-2 hardening pass, `ai-provider-exp-2.fixtures.ts`/`.util.ts`). All were real dispatch bugs where a broad generic catch-all rescue function ran earlier in the `AiIntentRescueService` pipeline and stole the prompt before `tryRescueProviderExp2` (or a sibling detector) ever ran, or a param-extraction gap. Root causes fixed: (1) `isExplainProviderSpecialtyPrompt`'s `who is <not best/good/free/...>` catch-all didn't exclude "who is waiting"/"who is in service" (team_floor_status) — added `isTeamFloorStatusPrompt` exclusion; (2) `isNotifyRunningLatePrompt`'s `CUSTOMER_OWNERSHIP_CUE` "for my" match fired on provider phrasing like "for my 2pm client", and its HY/RU script-based catches had no named-third-party exclusion — extended `PROVIDER_RUNNING_LATE_CUE` (added `for my...client`, `հաճախորդ`, `клиент`) and added a capitalized-Latin-name-alongside-Armenian/Cyrillic-script exclusion; (3) `extractBookingActionCustomerName` had no pattern for "mark X ready now" / "ask X for a review" — added both; (4) `isShareMyBookingPrompt` and `isAddBookingToCalendarPrompt` both had generic `send`/`booking` catch-alls stealing "send a review request for this booking" — added shared `isRequestClientReviewPrompt` exclusion to both; (5) `extractMaxPriceFromBudgetPrompt`'s "who is free" exclusion required exact adjacency and missed "who ELSE is free" — broadened the lookahead; (6) `isConfirmMyBookingDetailsPrompt`'s generic `BOOKING_CONTEXT` catch-all stole `list_reassign_options`, `request_client_review`, and (via a fragile 2-character Armenian substring heuristic in `isMyStatsPrompt`) a legitimate `my_stats` HY prompt — added `isListReassignOptionsPrompt`/`isRequestClientReviewPrompt` exclusions, and extracted a narrower `hasMyStatsKeywordCue` (real stats vocabulary only, no substring heuristics) for the `my_stats` exclusion instead of the fragile full `isMyStatsPrompt`. Verified via full `modules/ai/` sweep against a `git stash` baseline: pre-existing baseline was 190 failing tests/53 suites; after these fixes, 135 failing/50 suites — net improvement, zero new regressions. tsc holds at known baseline (1362, no new-file diffs).
- [x] **ai-cmd-provider-5.0.5** — Fixed 14 pre-existing failing `provider-earnings-*` eval cases (`ai-provider-earnings.fixtures.ts`, all RU + 1 HY). Root causes, all in shared generic detectors with dangerously broad Russian substring matches: (1) `hasHoursCue` (`ai-explain-business-hours-and-location.util.ts`) included bare `сколько` (how much/many) and `когда` (when) as standalone "hours" triggers — both are extremely common Russian question words used across unrelated domains (confirmed via grep: dozens of unrelated clinic-compound fixtures use `когда` for "notify me when results are ready"); narrowed to just `часы|открыт|работаете|закрыва`, which still covers both real business-hours RU fixtures ("Когда вы открыты" / "Во сколько вы закрываетесь" both also contain `открыт`/`закрыва`); (2) `hasRebookLastAppointmentCoreCue` (`ai-rebook-last-appointment.util.ts`) matched bare `прошл` (root of "last/past") as a rebook signal, colliding with any RU sentence mentioning "last week/last month" — replaced with `повтор` (repeat, broadened from `повторн` to also catch verb form `повторить`) plus a scoped `прошл...визит` pairing so "last visit" still matches but "last week" (revenue/appointment count context) doesn't; (3) `isConfirmMyBookingDetailsPrompt` was still stealing the HY `revenue-net` case (same generic-catch-all pattern as **5.0.4**) — added `isSummarizeMyRevenuePrompt` exclusion (`ai-provider-earnings.util.ts`). Found and fixed a genuine regression during verification: broadening `повторн`→`повтор` alone lost the existing "Прошлый визит — повторить" (via bare `повторить` matching, no `н`) — the added pairing pattern covers it independently. Verified via `git stash` A/B: baseline pre-existing failure count for `ai-command-eval.spec.ts` unchanged structurally (still exactly 1 failing test, "runs all deterministic golden cases without failures") on both sides, confirming the huge unrelated failure list (largely dashboard/staff-ops/service-payment cases) inside that one test is pre-existing and untouched by these fixes. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of the 4 touched domains + eval spec: 336/337 pass (only the same pre-existing failing suite remains).
- [x] **ai-cmd-provider-5.0.7** — Fixed 1 pre-existing failing `ai-cmd-catalog-notify-*` eval case: "Update Glow package discount to 20% and push an announcement to clients" resolved to `manage_notification_preferences` instead of `update_package` (with `notifyCustomers: true`). Root cause: `isManageNotificationPreferencesPrompt`'s `MANAGE_MUTATE_CUE` regex matches any `update...push` pairing within ~40 chars, without distinguishing "push" as a notification channel from "push" as the verb "to broadcast/send" — and this detector runs earlier than `tryRescueCatalog` in `AiIntentRescueService`'s dispatch order (`tryRescueConsumerAdoption` at line ~1825 vs `tryRescueCatalog` at ~1997 in the unknown phase). Fixed by adding `isCreatePackagePrompt`/`isUpdatePackagePrompt`/`isCreateSubscriptionPlanPrompt`/`isUpdateSubscriptionPlanPrompt` exclusions to `isManageNotificationPreferencesPrompt` (`ai-manage-notification-preferences.util.ts`), matching `CATALOG_NOTIFY_MUTATE_ACTIONS`'s exact scope (`ai-catalog-notify.util.ts`). Found (but did not fix, out of scope, flagged separately) a genuinely pre-existing, unrelated bug in the same file: `isManageNotificationPreferencesPrompt('Open my notification settings')` incorrectly returns `false` — confirmed via `git stash` to already fail identically before this session's edit. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-manage-notification-preferences`/`ai-catalog`/`ai-catalog-notify`/`ai-consumer-adoption` (196 tests) + eval spec: 194 pass, only the pre-existing "Open my notification settings" bug and the same pre-existing eval-suite failure remain.
- [x] **ai-cmd-provider-5.0.9** — Fixed 1 pre-existing failing `ai-cmd-payments-gift-card-balance` eval case (customer surface): "Check gift card balance by code GCM-ABCD" resolved to `promo_code_help` instead of `check_gift_card_balance`. Root cause: `isPromoCodeHelpPrompt` (`ai-marketing-growth.util.ts`) has a bare `code\s+[A-Z0-9_-]{3,}` pattern meant to catch promo-code mentions like "code SAVE10", which also matched gift-card codes ("code GCM-ABCD") combined with the word "check" satisfying its generic checkout-help cue — despite the function's own classifier-rule doc already stating "NOT apply_gift_card_code (gift card)", no actual guard existed for gift-card phrasing. Fixed with a one-line `if (/\bgift\s*card\b/i.test(prompt)) return false;` guard (no existing promo-code fixture mentions "gift card", confirmed via grep, so zero collision risk). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-marketing-growth`/`ai-claim-gift-card-balance` (91 tests) + eval spec: all pass except the same pre-existing unrelated failure. Also found (but did not fix, out of scope, flagged separately) a pre-existing, unrelated bug in `ai-payments.util.ts`: `isBookNearestSlotPrompt('find nearest haircut')` incorrectly returns `false` — confirmed via `git stash` to already fail identically before this session's edit.
- [x] **ai-cmd-provider-5.0.8** — Fixed 1 pre-existing failing `ai-cmd-retail-upsell` eval case: "Suggest retail upsell for this booking" (surface: provider) resolved to `confirm_my_booking_details` instead of `suggest_retail_upsell`. Root cause: same `isConfirmMyBookingDetailsPrompt` generic catch-all as **5.0.4**–**5.0.6** — its final fallback (`if (!READ_CUE.test && !BOOKING_CONTEXT.test) return false; return BOOKING_CONTEXT.test(prompt);`) only requires `BOOKING_CONTEXT` to match (bare "this"/"my" + "booking"/"appointment"), with no requirement that `READ_CUE` also matched — so any prompt mentioning "this booking" from an unrelated domain falls through to `confirm_my_booking_details` unless explicitly excluded. Fixed by adding an `isSuggestRetailUpsellPrompt` exclusion (`ai-provider-earnings.util.ts` → `ai-retail-finance.util.ts` import) to `ai-confirm-my-booking-details.util.ts`, the sixth instance of this same root-cause pattern this hardening pass has hit. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-retail-finance`/`ai-confirm-my-booking-details` (142 tests) + eval spec: all pass except the same pre-existing unrelated failure.
- [x] **ai-cmd-provider-5.4.2** — Full DoD `suggest_retail_upsell` — the one failing eval case is now fixed; see **ai-cmd-provider-5.0.8**.
- [x] **ai-cmd-provider-5.1.3** — Full DoD `summarize_my_appointments` — all RU appointment-count eval cases (6 scenarios) now pass; see **ai-cmd-provider-5.0.5**.
- [x] **ai-cmd-provider-5.8.4** — Full DoD `summarize_my_revenue` — all RU/HY revenue eval cases (7 scenarios) now pass; see **ai-cmd-provider-5.0.5**.
- [x] **ai-cmd-provider-5.0.6** — Fixed 1 pre-existing failing `provider-client-context-*` eval case: "Show Jane's pre-visit intake answers" (`explain_client_intake`) resolved the correct action but with `params.customerName` undefined. Root cause: `extractCustomerNameFromClientPrompt` (`ai-provider-client-context.util.ts`) had patterns for "about/for/on NAME", "client/customer NAME", "note/history/visits for NAME", etc., but no pattern for the common English possessive "NAME's X" construction — added `/\b([A-Z][a-z]+)'s\b/` as a new pattern (checked first). This function is shared by `add_client_note`/`show_client_history`/`mark_ready_now`/etc. via `AiIntentRescueService`'s `buildProviderClientContextRescueResult`, so the fix benefits customer-name extraction across the whole client-context domain, not just `explain_client_intake` — see **ai-cmd-provider-5.2.4** (still open for the rest of that intent's DoD). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-provider-exp-2`/`ai-provider-client-context` (488 tests) + eval spec: all pass except the same pre-existing unrelated failure.

---



### ai-cmd-provider-5.1 — Start of day & schedule glance — **provider**


| ID        | Intent (proposed)           | R/M | Example prompts                                   | Notes                                        |
| --------- | --------------------------- | --- | ------------------------------------------------- | -------------------------------------------- |
| **5.1.1** | `summarize_day`             | R   | “How’s today looking?”, “Any no-shows yet?”       | Status breakdown narrative — extend fixtures |
| **5.1.2** | `show_appointments`         | R   | “Who do I see at 2pm?”, “List my afternoon”       | Filter by time/status; **5.0 P0**            |
| **5.1.3** | `summarize_my_appointments` | R   | “How many bookings tomorrow?”                     | Count-only — vs full list                    |
| **5.1.4** | `who_is_next`               | R   | “Who’s my next client?”, “Next appointment”       | Thin alias → `show_appointments` + next slot |
| **5.1.5** | `explain_today_timeline`    | R   | “Walk me through my day”, “Gaps between clients?” | `ProviderTodayTimeline` + gap chips          |
| **5.1.6** | `summarize_utilization`     | R   | “How full is my week?”, “Open hours this month?”  | `ProviderCalendarMonth` bands                |
| **5.1.7** | `end_of_day_summary`        | R   | “Wrap up today”, “Anything still unpaid?”         | **Shipped** — extend unpaid + no-show copy   |


- [x] **ai-cmd-provider-5.1.1** — Full DoD `summarize_day` — was zero-coverage (no fixtures/rescue/eval, only a runtime dispatch case). Added `ai-provider-summarize-day.fixtures.ts` (14 EN/HY/RU prompt scenarios), `ai-provider-summarize-day.util.ts` (`isSummarizeDayPrompt`/`rescueSummarizeDayIntent`, exact-match-first then regex fallback), wired into `AiIntentRescueService` (`tryRescueSummarizeDay`, called first in both `runRescueClassifiedPhase`/`runRescueUnknownPhase` — ordering matters because the pre-existing `hasHoursCue` Armenian regex in `ai-explain-business-hours-and-location.util.ts` false-positives on "բացակայողներ" (no-shows) via substring "բաց" (open) and would otherwise shadow it), wired global `rescueProviderAiIntent` in `provider-ai-intent.util.ts` for runtime dispatch, added `AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_DAY_CASES` to `ai-command-eval.cases.ts`, and unit specs (`ai-provider-summarize-day.util.spec.ts`, extended `provider-ai-intent.util.spec.ts`). All 14 eval cases pass; tsc holds at known baseline (1362, no new-file diffs).
- [ ] **ai-cmd-provider-5.1.2** — Full DoD `show_appointments` (time filters)
- [ ] **ai-cmd-provider-5.1.3** — Full DoD `summarize_my_appointments`
- [ ] **ai-cmd-provider-5.1.4** — `who_is_next` alias + navigate to booking detail
- [ ] **ai-cmd-provider-5.1.5** — `explain_today_timeline`
- [x] **ai-cmd-provider-5.1.6** — Full DoD `summarize_utilization` — intent/handler/runtime-regex already shipped but zero fixtures/eval/rescue coverage. Added `ai-provider-summarize-utilization.fixtures.ts` (14 EN/HY/RU scenarios), `ai-provider-summarize-utilization.util.ts` (`isSummarizeUtilizationPrompt`/`rescueSummarizeUtilizationIntent`), replaced the old inline regex in `provider-ai-intent.util.ts` with a call to the shared util, wired `tryRescueSummarizeUtilization` into `AiIntentRescueService` (first in both dispatch phases, same as `summarize_day`), added `AI_COMMAND_EVAL_PROVIDER_SUMMARIZE_UTILIZATION_CASES`, and unit specs. Two false-positive regressions found and fixed during verification: (1) generic `utilization` match was stealing `my_stats` cases like "My utilization and revenue this week" — fixed by excluding prompts containing revenue/stats/performance keywords; (2) the Armenian "տոկոս" (percent) keyword was too generic and stole unrelated tax-rate prompts (GST/VAT %) — narrowed to only `զբաղված`/`լրացվածութ` (busy/occupancy words). All 14 eval cases pass; tsc holds at known baseline (1362, no new-file diffs); no regressions in the pre-existing eval suite.
- [ ] **ai-cmd-provider-5.1.7** — Full DoD `end_of_day_summary`

---



### ai-cmd-provider-5.2 — At the chair (client in seat) — **provider**


| ID        | Intent (proposed)                | R/M | Example prompts                                         | Notes                                                 |
| --------- | -------------------------------- | --- | ------------------------------------------------------- | ----------------------------------------------------- |
| **5.2.1** | `summarize_client`               | R   | “What should I know about Jane?”, “First visit?”        | **Shipped** — badges, loyalty, intake summary         |
| **5.2.2** | `show_client_history`            | R   | “Past visits for Maria”, “Last color formula note?”     | `CustomerVisitHistoryStrip`                           |
| **5.2.3** | `add_client_note`                | M   | “Note: prefers silent appointment”, “Add allergy note”  | `BookingCustomerStaffNotesSection`                    |
| **5.2.4** | `explain_client_intake`          | R   | “Summarize her health form”, “Any intake flags?”        | `BookingPreVisitIntakeSection` read-only              |
| **5.2.5** | `check_in_client`                | M   | “Check in Jane”, “Client arrived”                       | **Shipped** **5.0 P0**                                |
| **5.2.6** | `mark_running_late`              | M   | “I’m 10 minutes behind”, “Running late for 3pm”         | **Shipped** — add `mark_ready_now` sibling            |
| **5.2.7** | `mark_visit_complete`            | M   | “Mark done”, “Finish this appointment”                  | `update_bookings` status=completed — dedicated intent |
| **5.2.8** | `explain_package_visit_context`  | R   | “Which visit is this in her package?”, “2 of 6 facials” | `BookingCheckoutContextBadges`                        |
| **5.2.9** | `explain_multi_service_timeline` | R   | “What’s next after this blowdry?”, “Spa day order”      | `list_my_multi_service_groups` read                   |


- [ ] **ai-cmd-provider-5.2.1** — HY/RU eval `summarize_client`
- [ ] **ai-cmd-provider-5.2.2** — Full DoD `show_client_history`
- [ ] **ai-cmd-provider-5.2.3** — Full DoD `add_client_note`
- [ ] **ai-cmd-provider-5.2.4** — `explain_client_intake`
- [ ] **ai-cmd-provider-5.2.5** — Voice fixtures: “check in [name]”
- [ ] **ai-cmd-provider-5.2.6** — `mark_ready_now` (clears running-late flag)
- [ ] **ai-cmd-provider-5.2.7** — `mark_visit_complete` (disambiguate vs `mark_paid`)
- [ ] **ai-cmd-provider-5.2.8** — `explain_package_visit_context`
- [ ] **ai-cmd-provider-5.2.9** — `explain_multi_service_timeline`

---



### ai-cmd-provider-5.3 — Payments at the chair — **provider**


| ID        | Intent (proposed)                   | R/M | Example prompts                                                   | Notes                                      |
| --------- | ----------------------------------- | --- | ----------------------------------------------------------------- | ------------------------------------------ |
| **5.3.1** | `mark_paid`                         | M   | “Mark Jane paid cash”, “Mark this booking paid”                   | **Shipped** — push parity                  |
| **5.3.2** | `payment_sweep`                     | M   | “Mark all today paid”, “Sweep unpaid from today”                  | Bulk — manager/own calendar scope          |
| **5.3.3** | `explain_booking_payment_breakdown` | R   | “Why does it say pending?”, “She prepaid online — show breakdown” | `BookingPaymentBreakdown`                  |
| **5.3.4** | `explain_provider_payment_currency` | R   | “Why € on this booking?”, “Retail total currency”                 | **Shipped** read intent                    |
| **5.3.5** | `explain_deposit_balance_due`       | R   | “How much left at checkout?”, “50% deposit — rest due?”           | Prepayment + retail lines                  |
| **5.3.6** | `collect_remaining_balance`         | M   | “Charge the balance on file”, “Collect rest at chair”             | Product-dependent Stripe terminal / manual |


- [ ] **ai-cmd-provider-5.3.1** — Full DoD `mark_paid` + push `mark_paid` action eval
- [ ] **ai-cmd-provider-5.3.2** — Full DoD `payment_sweep`
- [ ] **ai-cmd-provider-5.3.3** — `explain_booking_payment_breakdown`
- [ ] **ai-cmd-provider-5.3.4** — HY/RU `explain_provider_payment_currency`
- [ ] **ai-cmd-provider-5.3.5** — `explain_deposit_balance_due`
- [ ] **ai-cmd-provider-5.3.6** — `collect_remaining_balance` (if product supports)

---



### ai-cmd-provider-5.4 — Retail upsell at chair — **provider**


| ID        | Intent (proposed)            | R/M | Example prompts                                                        | Notes                               |
| --------- | ---------------------------- | --- | ---------------------------------------------------------------------- | ----------------------------------- |
| **5.4.1** | `add_retail_to_booking`      | M   | “Add Olaplex 3 to this booking”, “Sell shampoo she uses”               | **Shipped** **prov-exp-5.1**        |
| **5.4.2** | `suggest_retail_upsell`      | R   | “What should I recommend after color?”, “Upsell ideas for this client” | Parity fixture — read suggestions   |
| **5.4.3** | `explain_retail_cart`        | R   | “What’s on the retail tab?”, “Total with products”                     | `BookingRetailPosSection`           |
| **5.4.4** | `remove_retail_from_booking` | M   | “Remove the serum from cart”, “Undo product add”                       | Gap — today UI-only?                |
| **5.4.5** | `search_retail_sku`          | R   | “Find SKU 12345”, “Do we carry bond builder?”                          | Navigate search — **`prov-exp-5.2** |


- [ ] **ai-cmd-provider-5.4.1** — Full DoD `add_retail_to_booking` (voice SKU)
- [ ] **ai-cmd-provider-5.4.2** — Full DoD `suggest_retail_upsell`
- [ ] **ai-cmd-provider-5.4.3** — `explain_retail_cart`
- [ ] **ai-cmd-provider-5.4.4** — `remove_retail_from_booking`
- [ ] **ai-cmd-provider-5.4.5** — `search_retail_sku` navigate

---



### ai-cmd-provider-5.5 — Client communications — **provider**


| ID        | Intent (proposed)              | R/M | Example prompts                                                        | Notes                                   |
| --------- | ------------------------------ | --- | ---------------------------------------------------------------------- | --------------------------------------- |
| **5.5.1** | `send_client_message`          | M   | “Text Jane I’m running 10 late”, “WhatsApp reminder she’s next”        | **Shipped** **prov-exp-6.1**            |
| **5.5.2** | `send_canned_template`         | M   | “Send ‘running late’ template to Maria”                                | `prov-exp-6.2` template picker          |
| **5.5.3** | `draft_waitlist_offer_message` | R   | “Draft SMS for waitlist when gap opens”, “Message top waitlist client” | **prov-exp-8.2** — copy-only or handoff |
| **5.5.4** | `explain_message_templates`    | R   | “What templates can I send?”, “Edit canned messages?”                  | Read-only — edit stays dashboard        |
| **5.5.5** | `notify_client_ready`          | M   | “Tell her chair is ready”, “Send ‘your turn’ message”                  | Optional template                       |


- [ ] **ai-cmd-provider-5.5.1** — Full DoD `send_client_message`
- [ ] **ai-cmd-provider-5.5.2** — `send_canned_template` (templateId param)
- [ ] **ai-cmd-provider-5.5.3** — `draft_waitlist_offer_message` (**prov-exp-8.2**)
- [ ] **ai-cmd-provider-5.5.4** — `explain_message_templates`
- [ ] **ai-cmd-provider-5.5.5** — `notify_client_ready`

---



### ai-cmd-provider-5.6 — Schedule self-service — **provider**


| ID        | Intent (proposed)               | R/M | Example prompts                                      | Notes                        |
| --------- | ------------------------------- | --- | ---------------------------------------------------- | ---------------------------- |
| **5.6.1** | `block_my_time`                 | M   | “Block lunch 1–2”, “Break until 3pm”                 | **Shipped** **prov-exp-7.1** |
| **5.6.2** | `fill_unused_slots`             | M   | “Block gap 4–5 as personal”, “Fill unused 2pm slot”  | Open shift → block vs book   |
| **5.6.3** | `request_time_off`              | M   | “Request off next Friday”, “Vacation Dec 20–27”      | **Shipped** **prov-exp-7.2** |
| **5.6.4** | `list_my_time_off_requests`     | R   | “Status of my time off?”, “Was Friday approved?”     | **Shipped**                  |
| **5.6.5** | `check_availability`            | R   | “Am I free Thursday 3pm?”, “Open slot today 5pm”     | Own calendar                 |
| **5.6.6** | `extend_my_block`               | M   | “Extend lunch 30 minutes”, “Push break to 2:30”      | Edit existing block          |
| **5.6.7** | `explain_provider_date_display` | R   | “Why dates look like DD/MM?”, “Time format on cards” | **Shipped** fmt-1.8          |


- [ ] **ai-cmd-provider-5.6.1** — Full DoD `block_my_time`
- [ ] **ai-cmd-provider-5.6.2** — Full DoD `fill_unused_slots`
- [ ] **ai-cmd-provider-5.6.3** — HY/RU `request_time_off`
- [ ] **ai-cmd-provider-5.6.4** — HY/RU `list_my_time_off_requests`
- [ ] **ai-cmd-provider-5.6.5** — Full DoD `check_availability`
- [ ] **ai-cmd-provider-5.6.6** — `extend_my_block`
- [x] **ai-cmd-provider-5.6.7** — HY/RU `explain_provider_date_display` — the HY case ("Ինչ salon dateFormat են provider booking cards-ը login-ից օգտագործում") was being stolen by `isExplainWhySignInPrompt`'s generic `ACCOUNT_SIGN_IN_TOPIC` regex, which includes a bare `log[\s-]?in` alternative that matched the Latin loanword "login" embedded mid-sentence (with an Armenian ablative suffix, "login-ից") — combined with the Armenian "ինչ" (what) satisfying its `READ_CUE`, this false-triggered `explain_why_sign_in`. Fixed by adding an `isExplainProviderDateDisplayPrompt` exclusion to `isExplainWhySignInPrompt` (`ai-explain-why-sign-in.util.ts`), the same generic-catch-all-defers-to-specific-domain pattern used throughout this hardening pass — see **ai-cmd-provider-5.0.4**–**5.0.6**. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-why-sign-in`/`ai-provider-date-format` (151 tests) + eval spec: all pass except the same pre-existing unrelated failure.

---



### ai-cmd-provider-5.7 — Booking changes (cancel / move / no-show) — **provider**


| ID        | Intent (proposed)                  | R/M | Example prompts                                                | Notes                                            |
| --------- | ---------------------------------- | --- | -------------------------------------------------------------- | ------------------------------------------------ |
| **5.7.1** | `reschedule_booking`               | M   | “Move Jane to 4pm”, “Reschedule my 2pm to tomorrow”            | **Shipped** — slot picker handoff                |
| **5.7.2** | `cancel_bookings`                  | M   | “Cancel Jane’s 2pm”, “Cancel all my afternoon”                 | **Shipped** — reason param                       |
| **5.7.3** | `mark_no_shows`                    | M   | “Mark no-shows today”, “Jane didn’t show — no show”            | **Shipped** bulk + single                        |
| **5.7.4** | `suggest_reschedule_from_push`     | R   | “Reschedule from this notification”                            | Push parity — opens AI                           |
| **5.7.5** | `reassign_booking_same_day`        | M   | “Give Jane’s 3pm to Marco”                                     | **Gap** — `BookingReassignSection` UI only today |
| **5.7.6** | `explain_cancel_policy_for_client` | R   | “Will she lose deposit?”, “Cancellation fee for this booking?” | Read salon policy for staff                      |


- [ ] **ai-cmd-provider-5.7.1** — Full DoD `reschedule_booking` + compounds with `check_availability`
- [ ] **ai-cmd-provider-5.7.2** — Full DoD `cancel_bookings`
- [ ] **ai-cmd-provider-5.7.3** — Full DoD `mark_no_shows`
- [ ] **ai-cmd-provider-5.7.4** — Push eval `suggest_reschedule_from_push`
- [ ] **ai-cmd-provider-5.7.5** — `reassign_booking_same_day` (**prov-exp-4.2** AI parity)
- [ ] **ai-cmd-provider-5.7.6** — `explain_cancel_policy_for_client`

---



### ai-cmd-provider-5.8 — Manager floor & team — **provider (manager/owner)**


| ID        | Intent (proposed)        | R/M | Example prompts                                           | Notes                                      |
| --------- | ------------------------ | --- | --------------------------------------------------------- | ------------------------------------------ |
| **5.8.1** | `team_floor_status`      | R   | “Floor board”, “Who’s waiting vs in service?”             | **Shipped** **prov-exp-4.1**               |
| **5.8.2** | `team_whos_next`         | R   | “Who’s next across the team?”, “Next 2 hours queue”       | **Shipped** **prov-exp-4.3**               |
| **5.8.3** | `my_stats`               | R   | “My week stats”, “Team utilization this month”            | **Shipped** scope=team                     |
| **5.8.4** | `summarize_my_revenue`   | R   | “How much did I earn this week?”, “Tips this month”       | **Shipped** narrative                      |
| **5.8.5** | `list_team_unpaid_today` | R   | “Anyone on the floor not paid yet?”, “Unpaid across team” | Manager `payment_sweep` preview            |
| **5.8.6** | `explain_reviews_inbox`  | R   | “Bad review yesterday — show it”, “My rating this month”  | `ProviderReviewsInboxSection` + `my_stats` |


- [x] **ai-cmd-provider-5.8.1** — HY/RU `team_floor_status` — HY/RU fixtures already existed and passed; the 2 EN cases ("who is waiting"/"who is in service") were being stolen by `explain_provider_specialty`'s generic `who is <not free/available/...>` catch-all — fixed (see **ai-cmd-provider-5.0.4**). Full EN+HY+RU set now passes.
- [ ] **ai-cmd-provider-5.8.2** — HY/RU `team_whos_next`
- [x] **ai-cmd-provider-5.8.3** — Full DoD `my_stats` — the HY case ("Ամփոփիր իմ աշխատանքի ցուցանիշները...") was being stolen by `confirm_my_booking_details`'s fragile Armenian substring heuristic — fixed (see **ai-cmd-provider-5.0.4**). Full EN+HY+RU set now passes.
- [ ] **ai-cmd-provider-5.8.4** — Full DoD `summarize_my_revenue`
- [ ] **ai-cmd-provider-5.8.5** — `list_team_unpaid_today`
- [ ] **ai-cmd-provider-5.8.6** — `explain_reviews_inbox`

---



### ai-cmd-provider-5.9 — Waitlist & gap recovery — **provider**


| ID        | Intent (proposed)               | R/M | Example prompts                                                | Notes                                          |
| --------- | ------------------------------- | --- | -------------------------------------------------------------- | ---------------------------------------------- |
| **5.9.1** | `suggest_waitlist_for_gap`      | R   | “Who can fill my 3pm gap?”, “Waitlist for this open slot”      | **Shipped** **prov-exp-7.3**                   |
| **5.9.2** | `list_waitlist_for_my_services` | R   | “Show my waitlist”, “Who’s waiting for color?”                 | **prov-exp-8.1** panel                         |
| **5.9.3** | `coordinate_waitlist_offer`     | M   | “Offer gap to top waitlist”, “Text waitlist about 3pm opening” | Manager — ties dashboard `offer_waitlist_slot` |
| **5.9.4** | `list_rebooking_candidates`     | R   | “Who should I call after this cancel?”, “Regulars + waitlist”  | **prov-exp-8.2**                               |
| **5.9.5** | `book_walk_in_gap`              | M   | “Book walk-in in the 2pm gap”, “Quick book 30 min trim now”    | New booking into open shift                    |


- [ ] **ai-cmd-provider-5.9.1** — Full DoD `suggest_waitlist_for_gap`
- [ ] **ai-cmd-provider-5.9.2** — `list_waitlist_for_my_services` (**prov-exp-8.1**)
- [ ] **ai-cmd-provider-5.9.3** — Full DoD `coordinate_waitlist_offer`
- [ ] **ai-cmd-provider-5.9.4** — `list_rebooking_candidates` (**prov-exp-8.2**)
- [ ] **ai-cmd-provider-5.9.5** — `book_walk_in_gap`

---



### ai-cmd-provider-5.10 — Push notifications & deep links — **provider**


| ID         | Intent (proposed)           | R/M | Example prompts                                                    | Notes                                 |
| ---------- | --------------------------- | --- | ------------------------------------------------------------------ | ------------------------------------- |
| **5.10.1** | `confirm_booking_from_push` | M   | “Confirm from notification”, “Accept new booking push”             | **Shipped** push action               |
| **5.10.2** | `open_booking_from_push`    | R   | “Open booking from alert”, “Show me that notification appointment” | `ProviderPushBridge`                  |
| **5.10.3** | `explain_last_push`         | R   | “What was that alert?”, “Explain my last notification”             | **Shipped** **prov-exp-10.1**         |
| **5.10.4** | `dismiss_push`              | M   | “Dismiss notification”, “Mark alert read”                          | **Shipped**                           |
| **5.10.5** | `explain_push_setup`        | R   | “How do push alerts work?”, “Enable booking notifications”         | **Shipped**                           |
| **5.10.6** | `enable_push_notifications` | M   | “Turn on push”, “Enable alerts in profile”                         | **Shipped** — `PushToggle`            |
| **5.10.7** | `new_booking_push_actions`  | R   | “What can I do from a new booking push?”                           | Confirm / reschedule / mark paid menu |


- [ ] **ai-cmd-provider-5.10.1** — Push action eval `confirm_booking_from_push`
- [x] **ai-cmd-provider-5.10.2** — Full DoD `open_booking_from_push` — handler + EN-only regex (`isOpenBookingFromPushPrompt` in `ai-push-notifications.util.ts`) already shipped and wired into `rescuePushNotificationsIntent`/`tryRescuePushNotifications` (already called in both dispatch phases, no new `AiIntentRescueService` wiring needed), but zero fixtures/HY-RU/eval coverage. Added `ai-provider-open-booking-from-push.fixtures.ts` (14 EN/HY/RU scenarios, including the TODO-sanctioned examples "Open booking from alert" / "Show me that notification appointment"), extended `isOpenBookingFromPushPrompt` with an exact-fixture-match check before the regex (same safe pattern as the prior 3 intents). Found and fixed 2 pre-existing false-positive collisions surfaced by the new paraphrase fixtures: the broad catch-all `isConfirmMyBookingDetailsPrompt` (`ai-confirm-my-booking-details.util.ts`) was claiming "View/show my appointment from the notification" (matches its generic `my`+`appointment` `BOOKING_CONTEXT` regex), and `isGetDirectionsToSalonPrompt` (`ai-get-directions-to-salon.util.ts`) was claiming "Navigate to the booking from the push" (its `DIRECTIONS_CUE` regex matches bare "navigate") — fixed both by adding `if (isOpenBookingFromPushPrompt(prompt)) return false;` at the top of each, matching the codebase's established generic-catch-all-defers-to-specific-domain exclusion convention (no circular imports). Added `AI_COMMAND_EVAL_PROVIDER_OPEN_BOOKING_FROM_PUSH_CASES` (`rescueReason: 'open_from_push'`) and extended `ai-push-notifications.util.spec.ts`. All 14 eval cases pass; tsc holds at known baseline (1362, no new-file diffs); no regressions (230/231 tests pass across the 3 touched domains + eval suite, only the pre-existing unrelated failure remains).
- [ ] **ai-cmd-provider-5.10.3** — HY/RU `explain_last_push`
- [x] **ai-cmd-provider-5.10.4** — Full DoD `dismiss_push` — handler + EN-only regex (`isDismissPushPrompt` in `ai-push-notifications.util.ts`) already shipped and wired into `rescuePushNotificationsIntent`/`tryRescuePushNotifications` (already called in both dispatch phases, no new `AiIntentRescueService` wiring needed), but zero fixtures/HY-RU/eval coverage. Note: the TODO-listed example "Mark alert read" does NOT match the shipped design — `isDismissPushPrompt` intentionally excludes any prompt containing "read" (`!/\bread\b/i`) so it doesn't collide with `mark_all_notifications_read`/`mark_booking_notifications_read`; treated as documentation drift, not a functional gap, and excluded from the fixture set in favor of the other TODO example ("Dismiss notification") plus safe dismiss/clear/ignore/close paraphrases. Added `ai-provider-dismiss-push.fixtures.ts` (14 EN/HY/RU scenarios), extended `isDismissPushPrompt` with an exact-fixture-match check before the regex (same safe pattern as the prior intents — no regex broadening, no new collisions found this time), added `AI_COMMAND_EVAL_PROVIDER_DISMISS_PUSH_CASES` (`rescueReason: 'dismiss_push'`), and extended `ai-push-notifications.util.spec.ts`. All 14 eval cases pass; tsc holds at known baseline (1362, no new-file diffs); no regressions (71/72 tests pass, only the pre-existing unrelated failure remains). This closes out the Tier-1 zero-coverage intent list (`summarize_day`, `summarize_utilization`, `list_my_multi_service_groups`, `open_booking_from_push`, `dismiss_push`) from the provider-5.x hardening audit.
- [ ] **ai-cmd-provider-5.10.5** — HY/RU `explain_push_setup`
- [ ] **ai-cmd-provider-5.10.6** — Full DoD `enable_push_notifications`
- [ ] **ai-cmd-provider-5.10.7** — Full DoD `new_booking_push_actions`

---



### ai-cmd-provider-5.11 — Clinic vertical (provider mobile) — **provider**


| ID         | Intent (proposed)                   | R/M | Example prompts                                                 | Notes                               |
| ---------- | ----------------------------------- | --- | --------------------------------------------------------------- | ----------------------------------- |
| **5.11.1** | `list_my_collection_queue`          | R   | “Who do I draw today?”, “Specimen collection list”              | **Shipped** `LabCollectionPage`     |
| **5.11.2** | `mark_specimen_collected`           | M   | “Mark draw complete for Jane”, “Collected specimen order 123”   | **Shipped**                         |
| **5.11.3** | `list_patient_pending_lab_requests` | R   | “Patients who still need to book lab”, “Pending lab self-book”  | `list_patient_pending_lab_requests` |
| **5.11.4** | `open_patient_chart`                | R   | “Open chart for Jane”, “Patient summary before draw”            | `PatientChartSummaryPage` navigate  |
| **5.11.5** | `explain_lab_result_on_booking`     | R   | “Any flagged results on this visit?”, “Show CBC from last time” | `BookingLabResultsSection`          |
| **5.11.6** | `list_clinic_tasks`                 | R   | “My tasks today”, “Outstanding clinic to-dos”                   | `ClinicTasksPage`                   |
| **5.11.7** | `complete_clinic_task`              | M   | “Mark task done”, “Complete follow-up call task”                | `ProviderClinicTasksList`           |
| **5.11.8** | `explain_provider_session_timeout`  | R   | “Why did I get logged out?”, “Session timeout on clinic app”    | **Shipped** HIPAA clinic            |


- [ ] **ai-cmd-provider-5.11.1** — HY/RU `list_my_collection_queue`
- [ ] **ai-cmd-provider-5.11.2** — Full DoD `mark_specimen_collected`
- [ ] **ai-cmd-provider-5.11.3** — Full DoD `list_patient_pending_lab_requests`
- [ ] **ai-cmd-provider-5.11.4** — `open_patient_chart`
- [ ] **ai-cmd-provider-5.11.5** — `explain_lab_result_on_booking`
- [ ] **ai-cmd-provider-5.11.6** — `list_clinic_tasks`
- [ ] **ai-cmd-provider-5.11.7** — `complete_clinic_task`
- [ ] **ai-cmd-provider-5.11.8** — HY/RU `explain_provider_session_timeout`

---



### ai-cmd-provider-5.12 — Gift cards & packages (provider) — **provider**


| ID         | Intent (proposed)                  | R/M | Example prompts                                             | Notes                  |
| ---------- | ---------------------------------- | --- | ----------------------------------------------------------- | ---------------------- |
| **5.12.1** | `list_package_appointments_today`  | R   | “Package visits today”, “Who’s on a bundle this afternoon?” | **Shipped** handler    |
| **5.12.2** | `list_my_package_visits`           | R   | “Show Jane’s package progress”, “Visits left on her plan”   | Provider read at chair |
| **5.12.3** | `explain_gift_card_redemption`     | R   | “She’s paying with gift card — balance?”                    | Checkout badge context |
| **5.12.4** | `list_gift_card_fulfillment_queue` | R   | “Physical cards to fulfill”, “Gift card pickup queue”       | `GiftCardQueuesPage`   |


- [ ] **ai-cmd-provider-5.12.1** — Full DoD `list_package_appointments_today`
- [ ] **ai-cmd-provider-5.12.2** — Full DoD `list_my_package_visits`
- [ ] **ai-cmd-provider-5.12.3** — `explain_gift_card_redemption`
- [ ] **ai-cmd-provider-5.12.4** — `list_gift_card_fulfillment_queue`

---



### ai-cmd-provider-5.13 — Offline, app health & voice — **provider**


| ID         | Intent (proposed)         | R/M | Example prompts                                   | Notes                                |
| ---------- | ------------------------- | --- | ------------------------------------------------- | ------------------------------------ |
| **5.13.1** | `offline_queue_status`    | R   | “What’s queued offline?”, “Did my check-in save?” | `ProviderOfflineBanner`              |
| **5.13.2** | `retry_offline_action`    | M   | “Retry failed sync”, “Send queued actions now”    | **Shipped**                          |
| **5.13.3** | `explain_offline_mode`    | R   | “Why offline?”, “Will changes sync when back?”    | Provider app offline copy            |
| **5.13.4** | `voice_check_in`          | M   | “Hey — check in Maria”                            | `ProviderAiVoiceButton` — hands-free |
| **5.13.5** | `voice_mark_paid`         | M   | “Mark paid cash”                                  | Voice compound at chair              |
| **5.13.6** | `explain_app_update_gate` | R   | “Why must I update?”, “Skip update for now”       | `AppVersionGate`                     |


- [ ] **ai-cmd-provider-5.13.1** — Full DoD `offline_queue_status`
- [ ] **ai-cmd-provider-5.13.2** — Full DoD `retry_offline_action`
- [ ] **ai-cmd-provider-5.13.3** — `explain_offline_mode`
- [ ] **ai-cmd-provider-5.13.4** — Voice fixture pack for chair actions
- [ ] **ai-cmd-provider-5.13.5** — `voice_mark_paid` eval
- [ ] **ai-cmd-provider-5.13.6** — `explain_app_update_gate`

---



### ai-cmd-provider-5.14 — Provider compounds (one message, full job)


| ID         | Recipe                  | Steps                                                                                     | Example prompt                                       |
| ---------- | ----------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **5.14.1** | `chair_closeout`        | `mark_visit_complete` → `mark_paid` → `add_retail_to_booking`?                            | “Finish Jane, mark paid cash, add Olaplex”           |
| **5.14.2** | `running_late_notify`   | `mark_running_late` → `send_client_message`                                               | “I’m 15 late — text my next client”                  |
| **5.14.3** | `gap_waitlist_fill`     | `suggest_waitlist_for_gap` → `draft_waitlist_offer_message` → `coordinate_waitlist_offer` | “Fill my 3pm gap from waitlist”                      |
| **5.14.4** | `cancel_and_recover`    | `cancel_bookings` → `list_rebooking_candidates` → draft message                           | “Cancel 2pm and message waitlist”                    |
| **5.14.5** | `pre_visit_brief`       | `summarize_client` → `show_client_history` → `explain_client_intake`                      | “Brief me before Jane at 2”                          |
| **5.14.6** | `end_of_day_close`      | `end_of_day_summary` → `payment_sweep` → `mark_no_shows`                                  | “Wrap today — mark paid and no-shows”                |
| **5.14.7** | `reschedule_and_notify` | `reschedule_booking` → `send_client_message`                                              | “Move Maria to 4pm and text her”                     |
| **5.14.8** | `clinic_draw_flow`      | `list_my_collection_queue` → `open_patient_chart` → `mark_specimen_collected`             | “Next draw — open chart and mark collected”          |
| **5.14.9** | `push_confirm_check_in` | `confirm_booking_from_push` → `check_in_client`                                           | “Confirm push booking and check in when she arrives” |


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

Extend `ProviderAiSuggestionsService` + localized starter prompts on each screen (mirror **ai-cmd-customer-4.9**).


| Screen / route              | Suggested AI chips                                                          |
| --------------------------- | --------------------------------------------------------------------------- |
| `TodayPage`                 | “Who’s next?”, “Team floor status”, “Any unpaid today?”                     |
| `BookingDetailModal`        | “Summarize this client”, “Check in”, “Mark paid cash”, “Add retail product” |
| `SchedulePage`              | “Block lunch tomorrow”, “Request Friday off”, “My time off status”          |
| `CalendarPage`              | “Gaps this week”, “Who can fill 3pm gap?”, “How full am I?”                 |
| `ProfilePage`               | “My stats this week”, “Enable push alerts”, “Explain notifications”         |
| `LabCollectionPage`         | “Collection queue today”, “Mark specimen collected”                         |
| `PushNotificationsPage`     | “Explain last alert”, “Open booking from notification”                      |
| **Push action sheet**       | “Confirm booking”, “Mark paid”, “Reschedule”                                |
| `BookingDetailModal` (open) | “Summarize client”, “Check in”, “Mark in progress”, “Mark paid cash”        |
| `PatientLookupPage`         | “Find patient Jane”, “Open chart for DOB …”                                 |
| `LabResultsPage`            | “Results waiting review”, “Open booking with abnormal CBC”                  |
| `GiftCardQueuesPage`        | “Cards to create today”, “Mark gift card ready for pickup”                  |
| `AcceptInvitePage`          | “What is this invite?”, “Help setting up my account”                        |
| `ClinicTasksPage`           | “My tasks due today”, “Mark intake follow-up done”                          |


- [ ] **ai-cmd-provider-5.15.1** — Page → chip map in `provider-app` i18n + `ProviderAiSuggestionsService` context keys
- [ ] **ai-cmd-provider-5.15.2** — Booking-detail session injects `bookingId` into assistant placeholder hints
- [ ] **ai-cmd-provider-5.15.3** — Align suggestion `prompt` strings with classifier fixture ids for eval traceability
- [ ] **ai-cmd-provider-5.15.4** — Extend `getProviderQuickChips` routes: `calendar`, `clinic-tasks`, `lab-collection`, `gift-cards` fulfillment prompts (**ai-m6**)
- [ ] **ai-cmd-provider-5.15.5** — Manager vs stylist chip sets (`isManager`) for floor vs own-calendar wording

---



### ai-cmd-provider-5.16 — Visit status lifecycle — **provider**


| ID         | Intent (proposed)              | R/M | Example prompts                                       | Notes                                                              |
| ---------- | ------------------------------ | --- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| **5.16.1** | `update_bookings`              | M   | “Start service”, “Mark in progress”, “Set confirmed”  | **Shipped** generic status — disambiguate vs `mark_visit_complete` |
| **5.16.2** | `mark_visit_in_progress`       | M   | “Begin Jane’s color”, “Start appointment now”         | Dedicated alias → status=`in_progress`                             |
| **5.16.3** | `mark_ready_now`               | M   | “Ready for next client”, “Clear running late”         | `markProviderBookingReadyNow` metadata                             |
| **5.16.4** | `confirm_pending_booking`      | M   | “Confirm all pending today”, “Accept Maria’s booking” | Suggestion `confirm-pending` — bulk + single                       |
| **5.16.5** | `explain_booking_status_badge` | R   | “What does pending mean?”, “Why in progress?”         | Status colors on `BookingDetailModal`                              |
| **5.16.6** | `explain_floor_status`         | R   | “Waiting vs in service?”, “What’s checked in?”        | Check-in floor strip + `team_floor_status`                         |


- [ ] **ai-cmd-provider-5.16.1** — Full DoD `update_bookings` status branches
- [ ] **ai-cmd-provider-5.16.2** — `mark_visit_in_progress`
- [ ] **ai-cmd-provider-5.16.3** — Full DoD `mark_ready_now` (pairs **5.2.6**)
- [ ] **ai-cmd-provider-5.16.4** — `confirm_pending_booking`
- [ ] **ai-cmd-provider-5.16.5** — `explain_booking_status_badge`
- [ ] **ai-cmd-provider-5.16.6** — `explain_floor_status`

---



### ai-cmd-provider-5.17 — Tax, payment status & cash — **provider**


| ID         | Intent (proposed)                  | R/M | Example prompts                                                      | Notes                                            |
| ---------- | ---------------------------------- | --- | -------------------------------------------------------------------- | ------------------------------------------------ |
| **5.17.1** | `explain_appointment_tax`          | R   | “Why VAT on this breakdown?”, “Inclusive vs exclusive tax?”          | **Shipped** handler via `businessTax`            |
| **5.17.2** | `explain_payment_status`           | R   | “Why still pending after Stripe?”, “She paid online — why cash due?” | Provider slice of dashboard intent               |
| **5.17.3** | `explain_prepaid_vs_balance_due`   | R   | “Deposit paid — what’s left?”, “Gift card covered service only”      | Retail + prepayment lines together               |
| **5.17.4** | `collect_cash_at_chair`            | M   | “Record cash collected $80”, “Mark cash payment received”            | Distinct from `mark_paid` when partial           |
| **5.17.5** | `explain_stripe_prepay_on_booking` | R   | “Client prepaid online — do I charge again?”                         | Tie `configure_service_online_payment` read copy |


- [ ] **ai-cmd-provider-5.17.1** — HY/RU `explain_appointment_tax`
- [ ] **ai-cmd-provider-5.17.2** — Provider `explain_payment_status` fixtures + eval
- [ ] **ai-cmd-provider-5.17.3** — `explain_prepaid_vs_balance_due`
- [ ] **ai-cmd-provider-5.17.4** — `collect_cash_at_chair`
- [ ] **ai-cmd-provider-5.17.5** — `explain_stripe_prepay_on_booking` (**ai-cmd-ext-7** parity)

---



### ai-cmd-provider-5.18 — Multi-service, packages & tour groups — **provider**


| ID         | Intent (proposed)                 | R/M | Example prompts                                                | Notes                           |
| ---------- | --------------------------------- | --- | -------------------------------------------------------------- | ------------------------------- |
| **5.18.1** | `list_my_multi_service_groups`    | R   | “Spa day clients today”, “Who has massage + facial?”           | **Shipped** handler             |
| **5.18.2** | `explain_multi_service_order`     | R   | “Which service is first?”, “Gap between her two appointments?” | Sequence + duration on timeline |
| **5.18.3** | `mark_multi_service_step_done`    | M   | “Finish step 1 of spa day”, “Complete blowdry leg”             | Per-leg status within group     |
| **5.18.4** | `explain_tour_group_on_booking`   | R   | “How many pax on this tour?”, “Group booking details”          | Tour metadata on booking card   |
| **5.18.5** | `list_package_appointments_today` | R   | “Package visits this afternoon”                                | **5.12.1** — group by bundle    |


- [x] **ai-cmd-provider-5.18.1** — Full DoD `list_my_multi_service_groups` — handler + EN-only literal regex (`isListMyMultiServiceGroupsPrompt` in `ai-provider-booking.util.ts`) already shipped, wired into `rescueProviderBookingIntent`/`tryRescueProviderBooking` (called first thing in `runRescueProviderPhase`, so no new `AiIntentRescueService` wiring needed), but zero fixtures/HY-RU/eval coverage. Added `ai-provider-list-my-multi-service-groups.fixtures.ts` (14 EN/HY/RU scenarios, including the TODO-sanctioned paraphrases "Spa day clients today" / "Who has massage + facial?" that don't fit the existing narrow regex), extended `isListMyMultiServiceGroupsPrompt` with an exact-fixture-match check before the regex (same safe pattern as `summarize_day`/`summarize_utilization` — avoids broadening the regex itself, which was the source of 2 false-positive regressions in the previous two intents), added `AI_COMMAND_EVAL_PROVIDER_LIST_MY_MULTI_SERVICE_GROUPS_CASES` (`rescueReason: 'my_multi_groups'`, matching the existing `rescueProviderBookingIntent` reason string), and extended `ai-provider-booking.util.spec.ts`. All 14 eval cases pass; tsc holds at known baseline (1362, no new-file diffs); no regressions in `ai-provider-booking` suite (51/52 tests pass, only the pre-existing unrelated failure remains).
- [ ] **ai-cmd-provider-5.18.2** — `explain_multi_service_order`
- [ ] **ai-cmd-provider-5.18.3** — `mark_multi_service_step_done`
- [ ] **ai-cmd-provider-5.18.4** — `explain_tour_group_on_booking`
- [ ] **ai-cmd-provider-5.18.5** — Package + multi-service compound read

---



### ai-cmd-provider-5.19 — Clinic extended (lookup, results, recollect) — **provider**


| ID         | Intent (proposed)            | R/M | Example prompts                                                    | Notes                                         |
| ---------- | ---------------------------- | --- | ------------------------------------------------------------------ | --------------------------------------------- |
| **5.19.1** | `search_patient`             | R   | “Find patient Jane Doe”, “Lookup by phone ending 4521”             | `PatientLookupPage` navigate                  |
| **5.19.2** | `list_lab_results_queue`     | R   | “Results needing review”, “Abnormal results today”                 | `LabResultsPage` / `ProviderLabResultsList`   |
| **5.19.3** | `explain_specimen_recollect` | R   | “Why recollect required?”, “Failed draw — what next?”              | Collection queue **RecollectRequired**        |
| **5.19.4** | `notify_patient_book_lab`    | M   | “Remind patient to book collection”, “Nudge pending lab self-book” | `list_patient_pending_lab_requests` → message |
| **5.19.5** | `explain_clinic_task`        | R   | “What is this follow-up task?”, “Who assigned it?”                 | `ProviderClinicTasksList`                     |
| **5.19.6** | `handoff_to_dashboard_phi`   | R   | “Open full intake on dashboard”, “Why can’t I edit intake here?”   | `preVisitIntakeOpenDashboard` link explain    |


- [ ] **ai-cmd-provider-5.19.1** — `search_patient`
- [ ] **ai-cmd-provider-5.19.2** — `list_lab_results_queue`
- [ ] **ai-cmd-provider-5.19.3** — `explain_specimen_recollect`
- [ ] **ai-cmd-provider-5.19.4** — `notify_patient_book_lab`
- [ ] **ai-cmd-provider-5.19.5** — `explain_clinic_task`
- [ ] **ai-cmd-provider-5.19.6** — `handoff_to_dashboard_phi`

---



### ai-cmd-provider-5.20 — Gift card fulfillment ops — **provider**


| ID         | Intent (proposed)                  | R/M | Example prompts                                             | Notes                             |
| ---------- | ---------------------------------- | --- | ----------------------------------------------------------- | --------------------------------- |
| **5.20.1** | `list_gift_cards_to_create`        | R   | “Physical cards to print”, “Creation queue”                 | `GiftCardQueuesPage` creation tab |
| **5.20.2** | `mark_gift_card_ready`             | M   | “Mark card GC-123 ready for pickup”, “Card printed — ready” | `markReadyMutation`               |
| **5.20.3** | `list_gift_cards_out_for_delivery` | R   | “Cards to ship today”, “Delivery queue”                     | Delivery tab                      |
| **5.20.4** | `mark_gift_card_shipped`           | M   | “Shipped to Anna — out for delivery”, “Mark delivered”      | `outForDeliveryMutation`          |
| **5.20.5** | `explain_gift_card_order_details`  | R   | “What’s on this gift order?”, “Service credits on card”     | Order card read                   |


- [ ] **ai-cmd-provider-5.20.1** — `list_gift_cards_to_create`
- [ ] **ai-cmd-provider-5.20.2** — `mark_gift_card_ready`
- [ ] **ai-cmd-provider-5.20.3** — `list_gift_cards_out_for_delivery`
- [ ] **ai-cmd-provider-5.20.4** — `mark_gift_card_shipped`
- [ ] **ai-cmd-provider-5.20.5** — `explain_gift_card_order_details`

---



### ai-cmd-provider-5.21 — New staff & app setup — **provider**


| ID         | Intent (proposed)                     | R/M | Example prompts                                                   | Notes                                      |
| ---------- | ------------------------------------- | --- | ----------------------------------------------------------------- | ------------------------------------------ |
| **5.21.1** | `explain_staff_invite`                | R   | “What is this invite link?”, “Join salon as stylist”              | `AcceptInvitePage`                         |
| **5.21.2** | `explain_provider_app_tabs`           | R   | “What’s on Today vs Calendar?”, “Where is my schedule?”           | Onboarding FAQ                             |
| **5.21.3** | `explain_team_view_scope`             | R   | “Why do I see everyone’s bookings?”, “Switch to my calendar only” | Manager vs employee scope                  |
| **5.21.4** | `explain_profile_settings`            | R   | “Change my title”, “Update avatar”                                | `ProviderProfileSection` — mutate stays UI |
| **5.21.5** | `configure_provider_push_date_format` | M   | “Show push times in 24h”, “Fix date format in alerts”             | **Shipped** fmt-1.8                        |


- [x] **ai-cmd-provider-5.21.1** — `explain_staff_invite`
- [x] **ai-cmd-provider-5.21.2** — `explain_provider_app_tabs`
- [x] **ai-cmd-provider-5.21.3** — `explain_team_view_scope`
- [x] **ai-cmd-provider-5.21.4** — `explain_profile_settings`
- [ ] **ai-cmd-provider-5.21.5** — HY/RU `configure_provider_push_date_format`

---



### ai-cmd-provider-5.22 — Reviews & reputation — **provider**


| ID         | Intent (proposed)             | R/M | Example prompts                                            | Notes                                          |
| ---------- | ----------------------------- | --- | ---------------------------------------------------------- | ---------------------------------------------- |
| **5.22.1** | `summarize_recent_reviews`    | R   | “Any bad reviews this week?”, “Latest 5-star reviews”      | `my_stats` + inbox filter                      |
| **5.22.2** | `explain_request_review_flow` | R   | “How do I ask for a review?”, “Can I request from Jane?”   | **prov-exp-2.2** dashboard-only policy explain |
| **5.22.3** | `draft_review_response`       | R   | “Help reply to this review”, “Draft professional response” | Copy-only — publish stays dashboard            |
| **5.22.4** | `request_review_for_client`   | M   | “Ask Jane for a review after visit”                        | Product gate — if mobile API added             |


- [ ] **ai-cmd-provider-5.22.1** — `summarize_recent_reviews`
- [ ] **ai-cmd-provider-5.22.2** — `explain_request_review_flow`
- [ ] **ai-cmd-provider-5.22.3** — `draft_review_response`
- [ ] **ai-cmd-provider-5.22.4** — `request_review_for_client` (optional API)

---



### ai-cmd-provider-5.23 — Calendar, gaps & open shifts — **provider**


| ID         | Intent (proposed)                    | R/M | Example prompts                                                  | Notes                                                  |
| ---------- | ------------------------------------ | --- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **5.23.1** | `list_gaps_today`                    | R   | “Open slots this afternoon”, “Gaps between clients”              | `ProviderCalendarGapsPanel` / `fill_unused_slots` read |
| **5.23.2** | `explain_calendar_utilization_bands` | R   | “What do the green bands mean?”, “Fully booked day?”             | `ProviderCalendarMonth`                                |
| **5.23.3** | `block_schedule`                     | M   | “Block 2–3pm team meeting”, “Block schedule Friday AM”           | **Shipped** — vs `block_my_time` (own break)           |
| **5.23.4** | `explain_block_vs_time_off`          | R   | “Block vs request time off?”, “Which should I use for vacation?” | Self-service FAQ                                       |
| **5.23.5** | `list_bookings_on_date`              | R   | “Who do I see next Tuesday?”, “Bookings on 12 June”              | `list_bookings` + date filter                          |


- [ ] **ai-cmd-provider-5.23.1** — `list_gaps_today`
- [ ] **ai-cmd-provider-5.23.2** — `explain_calendar_utilization_bands`
- [ ] **ai-cmd-provider-5.23.3** — Disambiguate `block_schedule` vs `block_my_time` fixtures
- [ ] **ai-cmd-provider-5.23.4** — `explain_block_vs_time_off`
- [ ] **ai-cmd-provider-5.23.5** — Full DoD `list_bookings`

---



### ai-cmd-provider-5.24 — Assistant UX, offline & voice — **provider**


| ID         | Intent (proposed)                 | R/M | Example prompts                                             | Notes                                                  |
| ---------- | --------------------------------- | --- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **5.24.1** | `explain_offline_suggestions`     | R   | “Why stale suggestions?”, “Refresh when online”             | `ProviderAiSuggestions` offline cache                  |
| **5.24.2** | `explain_assistant_confirm_swipe` | R   | “Why swipe to confirm?”, “What will change?”                | Bulk mutate preview (`assistantSwipeConfirm`)          |
| **5.24.3** | `give_provider_ai_feedback`       | M   | “Wrong client picked”, “That wasn’t my intent”              | Mirror customer **4.19.3**                             |
| **5.24.4** | `explain_provider_compound_steps` | R   | “Do these one at a time?”, “What happens next in compound?” | `provider_booking_compound` / `provider_push_compound` |
| **5.24.5** | `voice_summarize_next_client`     | R   | “Read me my next appointment”                               | TTS + `show_appointments`                              |
| **5.24.6** | `explain_accessibility_settings`  | R   | “Bigger text in app?”, “Larger tap targets”                 | **prov-exp-10.3** — local UI explain                   |


- [ ] **ai-cmd-provider-5.24.1** — `explain_offline_suggestions`
- [x] **ai-cmd-provider-5.24.2** — `explain_assistant_confirm_swipe`
- [ ] **ai-cmd-provider-5.24.3** — `give_provider_ai_feedback`
- [x] **ai-cmd-provider-5.24.4** — `explain_provider_compound_steps`
- [x] **ai-cmd-provider-5.24.5** — `voice_summarize_next_client`
- [ ] **ai-cmd-provider-5.24.6** — `explain_accessibility_settings`

---



### ai-cmd-provider-5.25 — Dashboard handoff (when mobile isn’t enough) — **provider read**


| ID         | Intent (proposed)               | R/M | Example prompts                                               | Notes                                               |
| ---------- | ------------------------------- | --- | ------------------------------------------------------------- | --------------------------------------------------- |
| **5.25.1** | `explain_dashboard_only_action` | R   | “Adjust loyalty points”, “Edit message templates”             | Map `PROVIDER_EXP_UI_AI_PARITY` dashboard-only rows |
| **5.25.2** | `explain_reassign_limit`        | R   | “Why can’t AI reassign multi-service?”, “Use reassign button” | **prov-exp-4.2** notes                              |
| **5.25.3** | `explain_time_off_approval`     | R   | “Who approves my time off?”, “Pending manager approval”       | Manager action on dashboard                         |
| **5.25.4** | `open_dashboard_deep_link`      | R   | “Open CRM for Jane”, “Full intake on web”                     | Return URL when safe                                |


- [ ] **ai-cmd-provider-5.25.1** — Auto-generate from `PROVIDER_EXP_UI_AI_PARITY` dashboard-only reasons
- [ ] **ai-cmd-provider-5.25.2** — `explain_reassign_limit`
- [ ] **ai-cmd-provider-5.25.3** — `explain_time_off_approval`
- [ ] **ai-cmd-provider-5.25.4** — `open_dashboard_deep_link`

---



### ai-cmd-provider-5.26 — More provider compounds


| ID          | Recipe                    | Steps                                                                               | Example prompt                               |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------- |
| **5.26.1**  | `pending_confirm_day`     | `confirm_pending_booking` → `summarize_day`                                         | “Confirm all pending then summarize today”   |
| **5.26.2**  | `check_in_start_complete` | `check_in_client` → `mark_visit_in_progress` → `mark_visit_complete`                | “Check in Jane, start service, mark done”    |
| **5.26.3**  | `retail_closeout`         | `suggest_retail_upsell` → `add_retail_to_booking` → `mark_paid`                     | “Recommend product and close with cash”      |
| **5.26.4**  | `gap_walk_in_book`        | `list_gaps_today` → `book_walk_in_gap` → `check_in_client`                          | “Book walk-in in 2pm gap and check in”       |
| **5.26.5**  | `no_show_recover`         | `mark_no_shows` → `list_rebooking_candidates` → `draft_waitlist_offer_message`      | “No-show at 2 — who should I offer slot to?” |
| **5.26.6**  | `multi_service_brief`     | `list_my_multi_service_groups` → `explain_multi_service_order` → `summarize_client` | “Brief me on spa day client at 3”            |
| **5.26.7**  | `gift_card_fulfill`       | `list_gift_cards_to_create` → `mark_gift_card_ready`                                | “Show creation queue and mark first ready”   |
| **5.26.8**  | `clinic_draw_patient`     | `search_patient` → `open_patient_chart` → `mark_specimen_collected`                 | “Find Jane, open chart, mark draw done”      |
| **5.26.9**  | `push_mark_paid_close`    | `open_booking_from_push` → `mark_paid` → `mark_visit_complete`                      | “From notification — mark paid and complete” |
| **5.26.10** | `manager_floor_sweep`     | `team_floor_status` → `list_team_unpaid_today` → `payment_sweep`                    | “Floor status then sweep team unpaid”        |


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


| Phase                        | IDs                                                                                       | Provider outcome                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **A — Chair essentials**     | **5.0 P0**, **5.2.5**–**5.2.7**, **5.3.1**, **5.16.2**–**5.16.3**, **5.14.1**, **5.26.2** | Check in → in progress → complete → paid                    |
| **B — Day operations**       | **5.1.*** , **5.3.2**, **5.7.*** , **5.16.4**, **5.14.6**, **5.26.1**                     | Today glance, pending confirm, cancel/reschedule, EOD sweep |
| **C — Floor & gaps**         | **5.8.*** , **5.9.*** , **5.23.*** , **5.14.3**–**5.14.4**, **5.26.4**–**5.26.5**         | Manager floor + waitlist + calendar gaps                    |
| **D — Client context**       | **5.2.1**–**5.2.4**, **5.14.5**, **5.18.*** , **5.26.6**                                  | Pre-visit brief, multi-service, packages                    |
| **E — Comms & retail**       | **5.4.*** , **5.5.*** , **5.14.2**, **5.14.7**, **5.26.3**                                | Message clients, upsell, close with retail                  |
| **F — Clinic & gifts**       | **5.11.*** , **5.19.*** , **5.20.*** , **5.14.8**, **5.26.7**–**5.26.8**                  | Draw queue, patient lookup, gift fulfillment                |
| **G — Push & offline**       | **5.10.*** , **5.13.*** , **5.24.*** , **5.15.*** , **5.26.9**                            | Notifications, voice, chips, assistant UX                   |
| **H — Money clarity**        | **5.17.*** , **5.3.3**–**5.3.5**                                                          | Tax lines, pending vs paid, deposit balance                 |
| **I — Onboarding & handoff** | **5.21.*** , **5.25.*** , **5.22.2**                                                      | New staff, dashboard-only explains                          |
| **J — Manager compounds**    | **5.26.10**, **5.8.5**, **5.14.6**                                                        | Team unpaid sweep + floor closeout                          |


**Key files (provider):**


| Layer          | Path                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Classifier     | `PROVIDER_MOBILE_CLASSIFIER_RULES` in `ai-provider-mobile.fixtures.ts` → `PROVIDER_INTENT_SCHEMA` in `provider-ai-command.service.ts` |
| Handler        | `ProviderAiCommandService` switch → `AiProviderExp2Service` / `AiProviderExp3Service` / `provider-booking-*`                          |
| Rescue         | `rescueProviderAiIntent` in `provider-ai-intent.util.ts`                                                                              |
| UI parity gate | `provider-exp-ai-parity.fixtures.ts` + `test:prov-exp-ai-parity`                                                                      |
| Suggestions    | `provider-ai-suggestions.service.ts` + `provider-ai-suggestions.i18n.ts`                                                              |
| Eval           | `eval/ai-command-eval.cases.ts` with `surface: provider`                                                                              |
| Page chips     | `ProviderAiSuggestions.tsx` + per-route chip config (**5.15**)                                                                        |


**Cross-links:** **ai-cmd-ext-3** (registry dispatch), **prov-exp-1**–**11** (UI slices), **ai-cmd-customer-4** (customer-facing mirror — e.g. running late notify), **ai-cmd-customer-6** (customer API parity pattern), **feature-ai-prompt-coverage** (provider surface mandatory), **pipe-1.12.2** (provider pipeline adapter).

---



## ai-cmd-provider-6 — Provider app API ↔ AI coverage audit

**Audit (2026-06):** Map every `provider-app/` REST call to a provider AI intent (or document `no-ai`). Sources: `provider-mobile.controller.ts`, `gift-cards.controller.ts` (`GiftCardProviderController`), `upload.controller.ts`, `POST /invitations/:token/accept`, `provider-app/src/`** API wrappers.

**Totals:** ~~**69** HTTP operations → **~~32 covered** (handler in `ProviderAiCommandService` or delegated service), **~22 partial** (registry intent exists but dashboard-only handler or deferred eval), **~15 gaps** (no provider intent / no handler wire).

**Bulk note:** Provider has **no** REST paths named `bulk_`*. Bulk behavior is:


| Pattern                 | Where                                                              | AI today                                                                                                               |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Bulk cancel**         | AI `cancel_bookings` matches N bookings → internal `executeCancel` | ✅ intent; uses service layer not `PUT …/cancel` per row                                                                |
| **Bulk status/paid**    | AI `update_bookings`, `payment_sweep`, `mark_no_shows`             | ✅ with `BULK_CONFIRM_THRESHOLD=2` swipe confirm                                                                        |
| **Bulk retail replace** | `PUT …/bookings/:id/retail-sales` `lines[]` replaces full cart     | 🟡 `add_retail_to_booking` adds one; no `set_retail_lines[]`                                                           |
| **Bulk push read**      | `POST …/push/notifications/read-all`                               | 🔴 no intent                                                                                                           |
| **Bulk gift queue**     | List queues + mark one-by-one                                      | 🟡 registry intents `mark_card_ready` etc. — **dashboard** `AiCommandService` **only**, not `ProviderAiCommandService` |


---



### ai-cmd-provider-6.0 — Coverage legend

Same as **ai-cmd-customer-6.0**: ✅ Covered · 🟡 Partial · 🔴 Gap · ⚪ N/A

---



### ai-cmd-provider-6.1 — AI gateway & suggestions


| API                                  | Status | Intent(s)                  | Gap / action                                                                                                                                                                                                                 |
| ------------------------------------ | ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST …/provider/ai/command`         | ✅      | All provider intents       | Gateway                                                                                                                                                                                                                      |
| `POST …/provider/ai/command/confirm` | 🟡     | Bulk confirm after swipe   | `explain_assistant_confirm_swipe` **5.24.2** — meta only                                                                                                                                                                     |
| `GET …/provider/ai/capabilities`     | ⚪      | —                          | Meta                                                                                                                                                                                                                         |
| `GET …/provider/ai/suggestions`      | ✅      | `explain_ai_suggestions`   | Already covered — chip `id`s (confirm-pending, unpaid-today, gaps-today, next-up, empty-today) already map to playbook steps in `ai-meta-product-guide.fixtures.ts`; suggestion objects also carry their own `prompt` string |
| `GET …/provider/context`             | ✅      | `explain_provider_context` | Shipped — live read of role/view-mode/employee/feature flags                                                                                                                                                                 |


- [x] **ai-cmd-provider-6.1.1** — Suggestion `prompt` strings already wired to classifier fixture ids (**5.15.3**); no gap found
- [x] **ai-cmd-provider-6.1.2** — `explain_provider_context` → `GET …/context`

---



### ai-cmd-provider-6.2 — Today, floor & calendar (read)


| API                       | Status | Intent(s)                                       | Gap / action                         |
| ------------------------- | ------ | ----------------------------------------------- | ------------------------------------ |
| `GET …/bookings/today`    | 🟡     | `show_appointments`, `summarize_day`            | `get_today_bookings` direct parity   |
| `GET …/bookings/upcoming` | ✅      | `list_upcoming_bookings`                        | Shipped                              |
| `GET …/bookings/by-date`  | 🟡     | `list_bookings`, `show_appointments`            | Date filter fixtures                 |
| `GET …/calendar/month`    | 🟡     | `summarize_utilization`                         | `get_calendar_month` → **5.23.2**    |
| `GET …/floor/today`       | ✅      | `team_floor_status`                             | —                                    |
| `GET …/floor/whos-next`   | ✅      | `team_whos_next`                                | —                                    |
| `GET …/schedule/summary`  | ✅      | `get_schedule_summary`                          | Shipped                              |
| `GET …/schedule/gaps`     | 🟡     | `suggest_waitlist_for_gap`, `fill_unused_slots` | `list_schedule_gaps` read **5.23.1** |
| `GET …/stats`             | ✅      | `my_stats`, `summarize_my_revenue`              | —                                    |


- [x] **ai-cmd-provider-6.2.1** — `list_upcoming_bookings` → `GET …/bookings/upcoming`
- [x] **ai-cmd-provider-6.2.2** — `get_schedule_summary` → `GET …/schedule/summary`

---



### ai-cmd-provider-6.3 — Booking detail & chair actions (single)


| API                                       | Status | Intent(s)                   | Gap / action                                                                               |
| ----------------------------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------ |
| `GET …/bookings/:id`                      | 🔴     | —                           | `open_booking_detail` navigate                                                             |
| `PUT …/bookings/:id`                      | ✅      | `update_bookings`           | Single-booking status/payment via explicit `bookingId` param, bulk matcher still available |
| `PUT …/bookings/:id/cancel`               | ✅      | `cancel_bookings`           | Single-booking cancel via explicit `bookingId` param, bulk matcher still available         |
| `POST …/bookings/:id/check-in`            | ✅      | `check_in_client`           | —                                                                                          |
| `POST …/bookings/:id/running-late`        | ✅      | `mark_running_late`         | —                                                                                          |
| `POST …/bookings/:id/ready-now`           | ✅      | `mark_ready_now`            | **5.16.3**                                                                                 |
| `POST …/bookings/:id/cancel/suggest-note` | ✅      | `suggest_cancel_note`       | AI draft cancel reason                                                                     |
| `POST …/bookings/:id/request-review`      | ✅      | `request_client_review`     | **5.22.4**                                                                                 |
| `GET …/bookings/:id/reassign/options`     | ✅      | `list_reassign_options`     | —                                                                                          |
| `POST …/bookings/:id/reassign`            | ✅      | `reassign_booking_same_day` | **5.7.5**                                                                                  |


- [x] **ai-cmd-provider-6.3.1** — `mark_ready_now` → `POST …/ready-now`
- [x] **ai-cmd-provider-6.3.2** — `reassign_booking_same_day` → reassign API
- [x] **ai-cmd-provider-6.3.3** — `suggest_cancel_note` → cancel/suggest-note API
- [x] **ai-cmd-provider-6.3.4** — `request_client_review` → request-review API
- [x] **ai-cmd-provider-6.3.5** — Single-booking `update_bookings`/`cancel_bookings` → `PUT …/bookings/:id` / `PUT …/bookings/:id/cancel` via explicit `bookingId` param (not only bulk matcher)

---



### ai-cmd-provider-6.4 — Bulk booking ops (AI-native — no dedicated REST bulk routes)

These intents **bulk-update** multiple bookings via `ProviderAiCommandService` internal `executeCancel` / `executeUpdate` (same outcome as repeated `PUT` calls).


| Intent               | Bulk behavior                        | REST equivalent         | Status                   |
| -------------------- | ------------------------------------ | ----------------------- | ------------------------ |
| `cancel_bookings`    | Cancel all matching date/name/status | N× `PUT …/cancel`       | ✅ — promote eval **5.0** |
| `update_bookings`    | Set status/payment on all matching   | N× `PUT …/bookings/:id` | ✅                        |
| `payment_sweep`      | Mark all unpaid matching as paid     | N× `paymentStatus=paid` | ✅                        |
| `mark_no_shows`      | Mark missed as no-show               | N× status update        | ✅                        |
| `mark_paid`          | Single booking paid                  | `PUT …/bookings/:id`    | ✅                        |
| `reschedule_booking` | One booking move                     | Not bulk                | ✅                        |


- [x] **ai-cmd-provider-6.4.1** — Document bulk intents in `provider-public-api-ai-parity.fixtures.ts` as `kind: 'ai-bulk-internal'` (no REST `bulk_`*)
- [x] **ai-cmd-provider-6.4.2** — Eval: “cancel all afternoon”, “mark all today paid”, “no-shows today” with `confirmed: true` confirm path — added `context.confirmed` bypass to `handleCancelBookings`/`handleUpdateBookings`/`handleMarkNoShows`/`handlePaymentSweep` (previously these 4 handlers had **no way to ever execute** once matched bookings hit `BULK_CONFIRM_THRESHOLD` — a real gap, not just a test gap); also fixed `rescueProviderAiIntent` missing the bare "no-shows today" phrasing (only "no-shows **for** today" matched before)
- [x] **ai-cmd-provider-6.4.3** — `bulk_cancel_confirm_threshold` — verified `BULK_CONFIRM_THRESHOLD=2`: 1 matched booking auto-executes, ≥2 requires `confirmed: true` (swipe UX round-trip)

---



### ai-cmd-provider-6.5 — Client context, intake & staff notes


| API                                           | Status | Intent(s)                         | Gap / action          |
| --------------------------------------------- | ------ | --------------------------------- | --------------------- |
| `GET …/bookings/:id/customer-context`         | ✅      | `summarize_client`                | Same data             |
| `GET …/bookings/:id/pre-visit-intake-summary` | ✅      | `explain_client_intake` **5.2.4** | Dedicated read        |
| `GET …/bookings/:id/customer-staff-notes`     | ✅      | `list_client_staff_notes`         | —                     |
| `POST …/bookings/:id/customer-staff-notes`    | ✅      | `add_client_note`                 | —                     |
| `show_client_history`                         | 🟡     | Visit history via AI service      | No dedicated GET — OK |


- [x] **ai-cmd-provider-6.5.1** — `list_client_staff_notes` → GET staff-notes
- [x] **ai-cmd-provider-6.5.2** — `explain_client_intake` → intake-summary GET

---



### ai-cmd-provider-6.6 — Retail POS (single add vs bulk lines replace)


| API                               | Status | Intent(s)                                              | Gap / action           |
| --------------------------------- | ------ | ------------------------------------------------------ | ---------------------- |
| `GET …/retail-pos/products`       | 🟡     | `add_retail_to_booking`, `search_retail_sku` **5.4.5** | Product search         |
| `GET …/bookings/:id/retail-sales` | 🟡     | `explain_retail_cart` **5.4.3**                        | Read cart              |
| `PUT …/bookings/:id/retail-sales` | ✅      | `set_retail_sales_lines`                               | `lines[]` bulk replace |


- [x] **ai-cmd-provider-6.6.1** — `set_retail_sales_lines` → `PUT retail-sales` with `lines[]` (bulk insert/update/delete cart in one call) — new intent in `ai-provider-exp-3`/`AiRetailFinanceService`, resolves product names or ids, full cart replace (not merge)
- [x] **ai-cmd-provider-6.6.2** — Alias registry `add_retail_to_my_booking` ↔ `add_retail_to_booking` in provider switch — was a real gap (dashboard-style action name silently failed on provider surface); now normalized before dispatch
- [x] **ai-cmd-provider-6.6.3** — Compound `retail_cart_replace`: set lines → mark paid (via the existing provider-mobile compound dispatcher, reusing `set_retail_sales_lines` + `mark_paid`; an unrecognized leading "list products" clause is safely dropped rather than failing the compound)

---



### ai-cmd-provider-6.7 — Schedule blocks & time off


| API                                   | Status | Intent(s)                         | Gap / action                                      |
| ------------------------------------- | ------ | --------------------------------- | ------------------------------------------------- |
| `POST …/schedule/blocks`              | ✅      | `block_my_time`, `block_schedule` | —                                                 |
| `POST …/time-off/requests`            | ✅      | `request_time_off`                | —                                                 |
| `GET …/time-off/requests`             | ✅      | `list_my_time_off_requests`       | —                                                 |
| `POST …/time-off/requests/:id/cancel` | ✅      | `cancel_time_off_request`         | —                                                 |
| `GET …/time-off-requests` (dashboard) | ⚪      | Manager approve/deny              | Dashboard `approve_time_off_request` — **5.25.3** |


- [x] **ai-cmd-provider-6.7.1** — `cancel_time_off_request` → provider cancel API — auto-resolves the employee's single pending request when no `requestId` given; clarifies if 0 or 2+ pending requests exist

---



### ai-cmd-provider-6.8 — Push notifications (incl. bulk read)


| API                                           | Status | Intent(s)                                                                | Gap / action                       |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------ | ---------------------------------- |
| `POST …/push/register-native`                 | 🟡     | `enable_push_notifications`                                              | Wire to native register            |
| `GET …/push/native-status`                    | 🔴     | —                                                                        | `explain_push_registration_status` |
| `POST …/push/action`                          | ✅      | `confirm_booking_from_push`, `mark_paid`, `suggest_reschedule_from_push` | —                                  |
| `GET …/push/notifications`                    | ✅      | `list_push_notifications`                                                | —                                  |
| `POST …/push/notifications/:id/read`          | 🟡     | `dismiss_push`                                                           | Single read                        |
| `POST …/push/notifications/read-all`          | ✅      | `mark_all_notifications_read`                                            | bulk update                        |
| `POST …/push/notifications/mark-booking-read` | ✅      | `mark_booking_notifications_read`                                        | —                                  |
| `GET …/push/vapid-public-key`                 | ⚪      | —                                                                        | Web push bootstrap                 |
| `POST/DELETE …/push/subscribe`                | ⚪      | —                                                                        | Web push — optional explain        |


- [x] **ai-cmd-provider-6.8.1** — `mark_all_notifications_read` → read-all API (**bulk**)
- [x] **ai-cmd-provider-6.8.2** — `mark_booking_notifications_read` → mark-booking-read API
- [x] **ai-cmd-provider-6.8.3** — `list_push_notifications` → GET notifications inbox

---



### ai-cmd-provider-6.9 — Clinic (collection, results, tasks, patients)


| API                                                       | Status | Intent(s)                                              | Gap / action                                                                        |
| --------------------------------------------------------- | ------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `GET …/lab-collection/today`                              | ✅      | `list_my_collection_queue`                             | —                                                                                   |
| `mark_specimen_collected`                                 | ✅      | AI → clinic specimen service (no direct provider REST) | Internal                                                                            |
| `GET …/lab-results`                                       | ✅      | `list_lab_results_queue`                               | —                                                                                   |
| `GET …/clinic-tasks`                                      | 🟡     | `list_clinic_tasks` **5.11.6**                         | —                                                                                   |
| `POST …/clinic-tasks/:id/claim`                           | ✅      | `claim_clinic_task`                                    | —                                                                                   |
| `POST …/clinic-tasks/:id/complete`                        | ✅      | `complete_clinic_task`                                 | —                                                                                   |
| `GET …/patients/search`                                   | 🟡     | `search_patient` **5.19.1**                            | —                                                                                   |
| `GET …/patients/:id/chart-summary`                        | 🟡     | `open_patient_chart` **5.11.4**                        | —                                                                                   |
| `GET …/clinic-test-results/bookings/:bookingId/summaries` | ✅      | `list_booking_lab_summaries`                           | PHI-scoped to assigned provider via `ClinicLabAccessService.assertBookingLabAccess` |


- [x] **ai-cmd-provider-6.9.1** — `list_lab_results_queue` → `GET …/lab-results`
- [x] **ai-cmd-provider-6.9.2** — `claim_clinic_task` → claim API
- [x] **ai-cmd-provider-6.9.3** — Wire `complete_clinic_task` to complete API — genuinely new (no prior handler existed anywhere despite the 🟡 marking)
- [x] **ai-cmd-provider-6.9.4** — `list_booking_lab_summaries` → `GET …/clinic-test-results/bookings/:id/summaries` (booking detail modal; PHI scoped to assigned provider)

---



### ai-cmd-provider-6.10 — Gift card fulfillment (registry ≠ provider handler)

Intents exist in `PROVIDER_EXCLUSIVE_INTENTS` but handlers previously lived only in `AiCommandService` (dashboard), **not** `ProviderAiCommandService`. Found `AiGiftFulfillmentService` (a shared, surface-agnostic service already used by the dashboard) had all 9 handler methods plus compound support fully implemented — the gap was purely that it wasn't exported from `AiModule` or injected/dispatched in `ProviderAiCommandService`.


| API                                   | Registry intent                                                                       | Provider AI switch | Gap                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `GET …/gift-cards/card-creation`      | `gift_card_creation_queue`                                                            | ✅ wired            | —                                                                                             |
| `PUT …/card-creation/:id/ready`       | `mark_card_ready`                                                                     | ✅ wired            | —                                                                                             |
| `GET …/gift-cards/delivery`           | `delivery_queue`                                                                      | ✅ wired            | —                                                                                             |
| `PUT …/delivery/:id/out-for-delivery` | `mark_out_for_delivery`                                                               | ✅ wired            | —                                                                                             |
| `PUT …/delivery/:id/delivered`        | `mark_delivered`                                                                      | ✅ wired            | —                                                                                             |
| —                                     | `start_card_preparation`, `accept_delivery`, `capture_delivery_proof`, `notify_delay` | ✅ wired            | Handlers already existed in `AiGiftFulfillmentService`; just needed provider-surface dispatch |


- [x] **ai-cmd-provider-6.10.1** — Dispatch gift fulfillment intents in `ProviderAiCommandService` → `AiGiftFulfillmentService` (exported from `AiModule`, injected via `forwardRef`, 9 switch cases + enum entries added)
- [x] **ai-cmd-provider-6.10.2** — Provider-surface test coverage for queue + mark ready/out-for-delivery/delivered — `ai-provider-gift-fulfillment.integration.spec.ts` (10 harness tests: all 9 dispatch cases + compound short-circuit)
- [x] **ai-cmd-provider-6.10.3** — Compound flow wired via existing `isFulfillmentCompound`/`handleFulfillmentCompound` (pre-classification check, mirrors push-notifications/booking compound pattern). Scope note: this reuses the existing single-target 2-step compound (e.g. "list creation queue → mark ready"), not a new "mark first N ready" batch-loop primitive — no compound engine in the codebase currently supports repeat-step-N-times semantics, and building one was out of scope for this wiring pass.

---



### ai-cmd-provider-6.11 — Profile, reviews & stats


| API                     | Status | Intent(s)                             | Gap / action                                       |
| ----------------------- | ------ | ------------------------------------- | -------------------------------------------------- |
| `GET …/profile`         | 🟡     | `explain_profile_settings` **5.21.4** | Read                                               |
| `PUT …/profile`         | ✅     | `update_provider_profile`             | MUTATE — set title and/or avatar URL |
| `POST …/uploads/avatar` | ✅     | `explain_profile_settings`            | Binary upload has no NL path by design — existing `provider-profile-settings` playbook (step 2) already tells the user to open Edit profile and change avatar photo, navigates to `/tabs/profile` |
| `GET …/reviews`         | 🟡     | `my_stats`                            | Summary                                            |
| `GET …/reviews/inbox`   | 🟡     | `explain_reviews_inbox` **5.8.6**     | Filtered inbox                                     |


- [x] **ai-cmd-provider-6.11.1** — `update_provider_profile` → `PUT …/profile` (dispatched directly via `this.providerMobile.updateProviderProfile()` in `ProviderAiCommandService`; clarifies when neither `title` nor `avatarUrl` is given). Fixed a real collision found while wiring: the pre-classification `explain_profile_settings` guide-rescue regex matched bare "update avatar"/"change my title" even when the user supplied an actual new value ("update my avatar to `<url>`"), stealing the prompt before the LLM classifier ever ran — added negative lookaheads so the guide rescue only fires for how-to questions, not imperative sets, in `ai-provider-product-guide.fixtures.ts`.
- [x] **ai-cmd-provider-6.11.2** — Avatar upload explain — already covered by the existing `explain_profile_settings` playbook (no new intent needed, binary uploads cannot go through NL by design, documented in the table above)

---



### ai-cmd-provider-6.12 — Onboarding, auth & analytics


| API                                                    | Status | Intent(s)                         | Gap / action                                     |
| ------------------------------------------------------ | ------ | --------------------------------- | ------------------------------------------------ |
| `POST /invitations/:token/accept`                      | ✅     | `explain_staff_invite` **5.21.1** | Read-only FAQ already wired (playbook `provider-staff-invite`, dispatched via product guide). `complete_staff_invite` mutate is **out of scope**: `PublicInvitationsController.accept` is unauthenticated and requires `firstName`/`lastName`/`password` — it's a plain account-creation signup form reached *before* any provider session exists, so no AI surface is available at that step |
| `POST /auth/login`, `/auth/google`, `/forgot-password` | ⚪      | —                                 | Staff auth — no AI                               |
| `POST /events/app`                                     | ⚪      | —                                 | Confirmed no provider-app analytics-consent banner UI exists (only the customer/consumer app has one, via `explain_analytics_consent`, `surfaces: ['customer']`) — nothing to explain on the provider surface, so left out of scope |


- [x] **ai-cmd-provider-6.12.1** — `explain_staff_invite` for AcceptInvitePage — already implemented, verified working (no code change needed)

---



### ai-cmd-provider-6.13 — Bulk insert / update / delete summary (provider)


| Operation type                  | REST                         | AI intent                                           | Status                                                                    |
| ------------------------------- | ---------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| **Bulk update** (bookings)      | Internal via AI              | `update_bookings`, `payment_sweep`, `mark_no_shows` | ✅ AI-native                                                               |
| **Bulk delete** (cancel)        | Internal via AI              | `cancel_bookings`                                   | ✅ AI-native                                                               |
| **Bulk insert** (retail lines)  | `PUT retail-sales` `lines[]` | `set_retail_sales_lines` | ✅ implemented in **6.6** — single native bulk REST call (no internal loop) |
| **Bulk update** (notifications) | `POST …/read-all`            | `mark_all_notifications_read` | ✅ implemented in **6.8** — single native bulk REST call (no internal loop) |
| **Bulk insert** (bookings)      | ❌ no API                     | —                                                   | **Out of scope** — walk-in `book_walk_in_gap` **5.9.5** needs product API |
| **Bulk delete** (time off)      | Single cancel                | `cancel_time_off_request` | ✅ implemented in **6.7** — not actually bulk (providers hold at most one open request); excluded from the bulk-parity fixtures below since it isn't a bulk operation |


- [x] **ai-cmd-provider-6.13.1** — `set_retail_sales_lines` (bulk cart replace) — already implemented in **6.6**, confirmed registered end-to-end (`PROVIDER_EXP_3_INTENTS`/`MUTATE_INTENTS` → registry)
- [x] **ai-cmd-provider-6.13.2** — `mark_all_notifications_read` (bulk push read) — already implemented in **6.8**, confirmed registered end-to-end (`PROVIDER_PUSH_NOTIFICATIONS_MUTATE_INTENTS` → registry)
- [x] **ai-cmd-provider-6.13.3** — Documented AI-native bulk booking intents in parity fixtures (**6.4.1**) — extended `provider-public-api-ai-parity.fixtures.ts` with a new `'ai-bulk-native'` coverage kind (single REST call that natively accepts an array, vs `'ai-bulk-internal'`'s per-item loop) and added entries for `set_retail_sales_lines` + `mark_all_notifications_read`; extended the accompanying spec to assert both kinds

---



### ai-cmd-provider-6.14 — Parity gate (mirror **ai-cmd-customer-6.13**)


| ID         | Task                                        | Notes                                                                                       |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **6.14.1** | `provider-public-api-ai-parity.fixtures.ts` | One row per provider-app API wrapper → intent or `no-ai` / `ai-bulk-internal` / `ai-bulk-native` — done in **6.4.1**/**6.13.3** |
| **6.14.2** | `test:provider-api-ai-parity`               | Extend `test:prov-exp-ai-parity` or sibling gate                                            |
| **6.14.3** | Cross-check `PROVIDER_EXCLUSIVE_INTENTS`    | Every provider-surface intent has handler in `ProviderAiCommandService` (gift gap **6.10**) |
| **6.14.4** | `ai-cmd-provider-gap-1`                     | Block prov-exp **done** until API row mapped                                                |


- [x] **ai-cmd-provider-6.14.1** — Parity fixtures already created from this audit in **6.4.1**, extended in **6.13.3**
- [x] **ai-cmd-provider-6.14.2** — Wired `npm run test:provider-api-ai-parity` (`backend/package.json`) running the parity fixtures spec + the new handler-coverage gate + the existing `provider-exp-ai-parity` gate together
- [x] **ai-cmd-provider-6.14.3** — Added `provider-command-handler-coverage.spec.ts`: reads `PROVIDER_INTENTS` from the registry and asserts every one resolves to a literal `case '<id>':` in `ProviderAiCommandService`, with a small documented exception list (alias-handled + known-unwired). Fixed 2 real bugs this gate discovered:
  - **Registry surfaces bug**: `RETAIL_FINANCE_INTENTS` (11 intents) was declared `surfaces: ['dashboard', 'provider']` as one row, but 9 of them (`create_product`, `list_products`, `adjust_inventory`, `add_retail_sale_to_booking`, `remove_retail_line`, `record_expense`, `payout_export`, `list_expenses`, `summarize_pl`, `commission_report`) are dashboard-admin-only with zero provider dispatch — `AiRetailFinanceService` wasn't even injected into `ProviderAiCommandService`. Split into two registry rows (dashboard gets all 11, provider gets only `PROVIDER_RETAIL_FINANCE_INTENTS`), mirroring the existing time-off dashboard/provider split pattern. Also fixed `suggest_retail_upsell` being mis-tagged as a mutate intent (it's read-only).
  - **`suggest_retail_upsell` had a full handler (`AiRetailFinanceService.handleSuggestRetailUpsell`) but was never dispatched from the provider surface** — exported `AiRetailFinanceService` from `AiModule` (was in `providers` but not `exports`, same bug pattern found in **6.10**), injected it into `ProviderAiCommandService`, added the enum entry, classifier rule, and dispatch case. New test: `ai-provider-suggest-retail-upsell.integration.spec.ts`.
  - Remaining exceptions, tracked not silently dropped: `add_retail_to_my_booking` is handled via pre-switch alias normalization (not a literal case, by design from **6.6**). `block_resource_unavailable`, `my_resource_assignments`, `explain_payment_status`, `collect_cash_confirm` are registered in `PROVIDER_EXCLUSIVE_INTENTS` with **zero backing implementation anywhere** (no logic function, no service method) — these are deep, undeveloped gaps (a resource/room-scheduling domain doesn't exist yet; cash-collection-confirm has no service either), out of scope for a wiring-only gate pass. Flagged here for a future dedicated task.
- [x] **ai-cmd-provider-6.14.4** — `test:provider-api-ai-parity` runs the `provider-exp-ai-parity` gate together with the new parity fixtures + handler-coverage specs in one command, linking them

---



### ai-cmd-provider-6.15 — Product blockers & out-of-scope (not AI-only work)


| ID         | Item                              | Why it affects AI                                                     | Action                                                              |
| ---------- | --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **6.15.1** | **Gift fulfillment dispatch**     | Registry intents exist; handlers only in dashboard `AiCommandService` | ✅ done in **6.10.1** — wired `ProviderAiCommandService` → `AiGiftFulfillmentService` |
| **6.15.2** | **Walk-in / bulk booking create** | No provider REST to create N bookings at once                         | Product API first; then `book_walk_in_gap` compounds (**5.9.5**)    |
| **6.15.3** | **Avatar binary upload**          | NL cannot attach file bytes                                           | ✅ done in **6.11.2** — already covered by the `explain_profile_settings` playbook, navigates to picker |
| **6.15.4** | **Manager time-off approve/deny** | `GET …/time-off-requests` is dashboard staff flow                     | Dashboard `approve_time_off_request` — **5.25.3**, not provider-6   |
| **6.15.5** | **Dashboard bulk ops**            | `bulk_smart_cancel`, retail admin, etc.                               | Track under **ai-cmd-dashboard-6**, not **provider-6**              |
| **6.15.6** | **Resource scheduling + payment-status explainers** | `block_resource_unavailable`, `my_resource_assignments`, `explain_payment_status`, `collect_cash_confirm` registered in `PROVIDER_EXCLUSIVE_INTENTS` with zero backing implementation (discovered by the **6.14.3** parity gate) | ✅ done — see **6.15.7** below; the "no domain yet" premise was stale, resource scheduling (`ai-schedule-resources.*`) and payment-status explaining (`ai-payments.*`) were both built in the interim by `ai-cmd-dashboard-6.12`/earlier payments work |


- [x] **ai-cmd-provider-6.15.1** — Unblock gift queue AI by mirroring dashboard handlers on provider surface (**6.10**)
- [x] **ai-cmd-provider-6.15.7** — Re-audited **6.15.6** and found the blocker was stale: `AiScheduleResourcesService.handleMyResourceAssignmentsLogic`/`.handleBlockResourceUnavailableLogic` already exist (dashboard-dispatched) and `handleMyResourceAssignmentsLogic` was ALREADY built with a `sessionEmployeeId`-first param, meaning it was designed with provider-mobile compatibility in mind from the start. `AiPaymentsService.dispatchIntent(ctx)` (a generic `{businessId, action, params, prompt?, userId?, catalogServices?}` dispatcher, `catalogServices` optional) already backs `explain_payment_status`/`collect_cash_confirm` for the dashboard surface. Injected both `AiScheduleResourcesService` and `AiPaymentsService` into `ProviderAiCommandService` (both via `forwardRef`, matching the file's existing convention for cross-cutting AI services) and added 4 new dispatch cases: `my_resource_assignments`/`block_resource_unavailable` call the schedule-resources handlers directly (auto-resolving the calling provider's own `scopedEmployeeId` for the "my" resource-assignments case); `explain_payment_status`/`collect_cash_confirm` route through `payments.dispatchIntent(...)` (mirroring `ai-dashboard-core.logic.ts`'s exact call shape). Had to export `AiScheduleResourcesService` from `AiModule` (it was a provider but not an export — `AiPaymentsService` was already exported). Updated `provider-command-handler-coverage.spec.ts`'s `KNOWN_UNWIRED_PROVIDER_INTENTS` exception list to remove all 4 (now empty), since the gate itself confirmed they're wired. No tier gating added — none of these 4 intents have any existing precedent in `PROVIDER_DENIED_BY_TIER`, matching the "no gating unless sibling precedent exists" rule. New `ai-provider-resource-payment-status.integration.spec.ts` (5 tests, using the standard `createProviderAiCommandHarness` pattern) covers all 4 dispatch paths plus the `dispatchIntent` null-fallback case. Fixed the resulting constructor-arg-count cascade in `provider-ai-command.integration.harness.ts`. Verified: `npx tsc --noEmit` holds at the same pre-existing error delta; targeted jest sweep (all 17 provider-mobile integration specs using the harness, `provider-command-handler-coverage`, `ai-command-registry`, `access-control.matrix`, `ai-schedule-resources`, `ai-payments`) is green except the 2 known dashboard-side baseline failures plus 2 confirmed-pre-existing, unrelated provider-payments failures (`ai-payments-dispatch.build.spec.ts`, `ai-payments.util.spec.ts` — both verified via `git stash` to fail identically on the clean tree).

**Next audit:** see `ai-cmd-dashboard-6` (dashboard admin REST ↔ AI parity — full audit below **ai-cmd-ext-2.14+**).

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


| Phase                           | IDs                                 | Closes API gaps                             |
| ------------------------------- | ----------------------------------- | ------------------------------------------- |
| **A — Wire gift + retail bulk** | **6.10.*** , **6.6.*** , **6.13.1** | Gift queues + cart `lines[]`                |
| **B — Chair REST parity**       | **6.3.*** , **6.4.2**               | ready-now, reassign, single PUT update      |
| **C — Bulk hardening**          | **6.4.*** , **6.8.1**               | payment sweep / cancel eval + push read-all |
| **D — Clinic & push inbox**     | **6.9.*** , **6.8.2**–**6.8.3**     | Lab results, tasks, notification list       |
| **E — Gate**                    | **6.14.***                          | `test:provider-api-ai-parity`               |


**Cross-links:** **ai-cmd-provider-5** (ease-of-life scenarios), **ai-cmd-ext-3** (dispatch), **prov-exp-11**, **ai-cmd-customer-6** (audit pattern).

---



## ai-cmd-dashboard-6 — Dashboard admin API ↔ AI coverage audit

**Audit (2026-06):** Map every `frontend/` dashboard REST call to a dashboard AI intent (or document `no-ai` / UI-only). Sources: `frontend/src/`** (`api.get/post/put/patch/delete` via `lib/api.ts`), excluding `public-api.ts` (see **ai-cmd-customer-6**) and `app/provider/*` pages (see **ai-cmd-provider-6**). Backend route reference: controllers under `backend/src/modules/`**.

**Totals:** ~~**229** HTTP operations → **~~52 covered** (registry intent + handler in `AiCommandService` or delegated domain service), **~68 partial** (read/explain OK but mutate path missing, or intent exists without REST wire), **~58 gaps** (no intent), **~51 N/A** (auth bootstrap, file upload bytes, export downloads, analytics telemetry).

**Registry context:** **252** dashboard intents in `DASHBOARD_INTENTS` — many are **AI-native** (no 1:1 REST button): `bulk_smart_cancel`, `cancel_bookings`, `fill_unused_slots`, compounds. This audit is **REST → intent**, not intent count.

**Bulk note:** Dashboard has **no** REST paths named `bulk_`*. Bulk behavior is:


| Pattern                          | REST example                                             | AI today                                                                       |
| -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Bulk cancel/update bookings**  | Repeated `PUT …/bookings/:id`                            | ✅ `cancel_bookings`, `update_bookings`, `bulk_smart_cancel` (internal matcher) |
| **Bulk catalog seed**            | `POST …/onboarding/apply-catalog`, playbook seed         | 🟡 `bulk_create_catalog`, `apply_clinic_playbook` — not wired to CSV import    |
| **Bulk schedule delete**         | `DELETE …/schedules/templates` + `{ templateIds[] }`     | 🔴 no `delete_schedule_templates`                                              |
| **Bulk schedule apply**          | `POST …/schedules/templates/apply`                       | ✅ `apply_schedule`                                                             |
| **Bulk agent rebook/undo**       | `POST …/agents/tasks/:id/rebook-all`, `…/undo-latest`    | 🔴 no intents                                                                  |
| **Bulk retail cart replace**     | `PUT …/bookings/:id/retail-sales` `lines[]`              | 🟡 `add_retail_sale_to_booking` adds one line only                             |
| **Bulk product recommendations** | `PUT …/inventory/recommendations/…` + `{ productIds[] }` | 🔴 no intent                                                                   |
| **Bulk locale strip**            | (no REST — service layer)                                | ✅ `bulk_strip_disabled_locale_translations`                                    |
| **Bulk service currency**        | (no REST — service layer)                                | ✅ `bulk_update_service_currency`                                               |


---



### ai-cmd-dashboard-6.0 — Coverage legend

Same as **ai-cmd-customer-6.0**: ✅ Covered · 🟡 Partial · 🔴 Gap · ⚪ N/A

---



### ai-cmd-dashboard-6.1 — AI gateway, agents & suggestions


| API                                                                                                               | Status | Intent(s)                                | Gap / action                              |
| ----------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------- | ----------------------------------------- |
| `POST …/ai/command`, `…/command/tasks/:id/approve`, `…/steps/:id/retry`                                           | ✅      | All `DASHBOARD_INTENTS` via gateway      | Meta-endpoint                             |
| `GET …/ai/suggestions`, `…/capabilities`, `…/settings`, `…/analytics`, `…/audit`, `…/briefing`, `…/weekly-report` | 🟡     | `explain_ai_settings`, suggestions chips | Read helpers sparse                       |
| `PUT …/ai/settings`                                                                                               | 🟡     | Autopilot/macros panels                  | `configure_ai_autopilot` **2.21** overlap |
| `GET …/agents/tasks`, `…/pending`, `…/:id/preview`                                                                | ✅      | `list_agent_tasks`                       | Read: all tasks, pending-only (scope=pending), or a single task preview (taskId) |
| `POST …/agents/tasks/:id/rebook-all`                                                                              | ✅      | `rebook_all_from_agent_task`              | MUTATE — requires taskId                  |
| `GET …/agents/tasks/undo-latest/preview`, `POST …/undo-latest`                                                    | ✅      | `undo_latest_agent_task`                  | Preview by default; MUTATE only once `confirmed: true` |


- [x] **ai-cmd-dashboard-6.1.1** — `rebook_all_from_agent_task` → rebook-all API (**ai-ops** page). New `AiAgentOpsService` triplet (`ai-agent-ops.util/logic/service.ts`) wired into `AiCommandService`. Extracted the plan-building logic that previously lived inline in `AgentController.rebookAll` into a new `AgentOrchestratorService.rebookAllFromTask()` method so both the REST controller and the AI dispatch path share one implementation (controller is now a thin wrapper).
- [x] **ai-cmd-dashboard-6.1.2** — `undo_latest_agent_task` → undo-latest API + preview read. Without `confirmed: true` returns `AgentTaskUndoService.getLatestUndoPreview()` (read-only, `details.requiresConfirmation: true`); with `confirmed: true` calls `undoLatest()` (executes the reversal).
- [x] **ai-cmd-dashboard-6.1.3** — `list_agent_tasks` → GET tasks/pending, plus per-task preview (taskId param) and full list (scope param). Manager/owner only — added to `DASHBOARD_DENIED_BY_TIER` for `client`/`staff` tiers alongside `bulk_smart_cancel`, matching the risk profile of other autonomous bulk actions.

---



### ai-cmd-dashboard-6.2 — Business core, overview & onboarding


| API                                                                                                                                                  | Status | Intent(s)                                              | Gap / action                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `GET/PUT …/businesses/:id`, `PUT …/profile`                                                                                                          | ✅      | `update_business_profile`                              | MUTATE — name/description/phone/email/address (branding/social/location stay dashboard-UI-only) |
| `GET …/dashboard/overview`                                                                                                                           | ✅      | `get_dashboard_overview`                                | Confirmed genuinely distinct from `summarize_day` (which is a single-day appointment list, no revenue/tax/utilization%/customer-count) |
| `GET …/onboarding/status`, `…/business-types`, `…/vertical-playbook`                                                                                 | ✅      | `explain_onboarding_status`                             | Single read combining all 3 endpoints (step, business type, catalog/schedule state, available types, playbook preview) |
| `POST …/onboarding/business-type`, `…/recommend-catalog`, `…/apply-catalog`, `…/apply-schedule`, `…/skip-schedule`, `…/apply-playbook`, `…/complete` | ✅      | `set_business_type`, `recommend_catalog`, `apply_onboarding_catalog`, `apply_onboarding_schedule`, `skip_onboarding_schedule`, `apply_onboarding_playbook`, `complete_onboarding` | All 7 routes now individually wired — see note below on why `bulk_create_catalog`/`apply_schedule` were a false equivalence |
| `POST …/invitations`                                                                                                                                 | ✅      | `invite_staff_member`                                  | —                                                                         |
| `POST /invitations/:token/accept`                                                                                                                    | ⚪      | —                                                      | Auth bootstrap                                                            |


- [x] **ai-cmd-dashboard-6.2.1** — `complete_onboarding` → onboarding complete API. New `AiOnboardingService` triplet (`ai-onboarding.util/logic/service.ts`) wiring all 7 `OnboardingService` mutation methods (`setBusinessType`, `recommendCatalog`, `applyCatalog`, `applyDefaultSchedule`, `applyVerticalPlaybook`, `skipScheduleStep`, `completeOnboarding`) plus one combined read (`explain_onboarding_status` covering `getStatus`/`getBusinessTypes`/`getVerticalPlaybookPreview`).
- [x] **ai-cmd-dashboard-6.2.2** — Investigated the checklist's proposed `bulk_create_catalog`/`apply_schedule` reuse and found it was a **false equivalence**: `bulk_create_catalog`'s handler calls `categoryService`/`serviceService` directly and never touches `OnboardingService.applyCatalog`; `apply_schedule` dispatches through `AiScheduleHandlersService` (template-to-calendar), never `OnboardingService.applyDefaultSchedule`. Wired `apply_onboarding_catalog` as its own real intent instead — auto-fetches `recommendCatalog()`'s suggestion when no explicit `categories[]` is given, otherwise applies the given categories directly.
- Also implemented (found during research, not on the original checklist): `update_business_profile` and `get_dashboard_overview` — new `AiBusinessProfileService` triplet injecting `BusinessService`/`DashboardService` (both already imported into `AiModule` via `BusinessModule`, so no module-wiring changes needed). All 10 new intents gated to manager/owner only in `access-control.matrix.ts` (added to `client`/`staff` denial sets), matching the risk profile of other business-configuration mutations.

---



### ai-cmd-dashboard-6.3 — Bookings, appointments & retail POS


| API                                                        | Status | Intent(s)                                                 | Gap / action                                          |
| ---------------------------------------------------------- | ------ | --------------------------------------------------------- | ----------------------------------------------------- |
| `GET …/bookings`, `…/bookings/dashboard`, `…/bookings/:id` | ⚪     | `list_bookings`, `show_appointments`                      | Out of scope — `open_booking_detail` navigate is UI-only, satisfied by IDs already returned in `list_bookings`/`show_appointments`; identical gap note at **ai-cmd-provider-5.1**/**5.11** was never itemized there either |
| `GET …/bookings/availability`                              | ✅      | `check_availability`                                      | —                                                     |
| `POST …/bookings`, `…/quote`                               | ✅      | `create_booking`                                          | Quote step partial                                    |
| `PUT …/bookings/:id`, `…/cancel`                           | ✅      | `update_bookings`, `cancel_bookings`, `bulk_smart_cancel` | Single vs bulk disambiguation                         |
| `GET/PUT …/bookings/:id/retail-sales`                      | ✅     | `add_retail_sale_to_booking`, `remove_retail_line`, `set_retail_sales_lines` | Bulk replace now wired — same handler as provider (`AiRetailFinanceService.handleSetRetailSalesLines`, dual-registered per-surface via `SURFACE_HANDLER_OVERRIDES`) |
| `GET …/retail-pos/products`                                | ⚪     | `suggest_retail_upsell`                                   | Out of scope — confirmed false gap: the REST endpoint has no text-search param at all (`RetailPosService.listSellableProducts(businessId)` takes only businessId); `suggest_retail_upsell` already calls the exact same method and is a superset (adds service-link ranking) |
| `GET/POST …/bookings/:id/pre-visit-intake`                 | ✅     | `assign_pre_visit_intake_to_booking`                       | New `AiClinicPreVisitIntakeService` triplet, distinct from the customer-facing draft-intake chain (`create_intake_draft`/`start_pre_visit_intake`/etc. from **ai-cmd-customer-6.4**) |


- [x] **ai-cmd-dashboard-6.3.1** — `set_retail_sales_lines` → `PUT retail-sales` with `lines[]`. The handler already existed (`AiRetailFinanceService.handleSetRetailSalesLines`, built for provider in **ai-cmd-provider-6.6**) — just needed a dashboard dispatch case + registry wiring. Added `'set_retail_sales_lines'` to `DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS`, and a `SURFACE_HANDLER_OVERRIDES` entry (`{ dashboard: 'AiRetailFinanceService', provider: 'AiProviderExp3Service' }`, mirroring the existing `mark_paid` precedent) since the same intent name now resolves to different handlers per surface.
- [x] **ai-cmd-dashboard-6.3.2** — Compound `retail_checkout`: add lines → mark paid. Extended the existing retail-finance compound infra (`decomposeRetailFinanceCompoundPrompt`/`handleRetailFinanceCompoundLogic`) with `set_retail_sales_lines` and `mark_paid` step types (added "set"/"replace"/"mark"/"paid" to the compound-split verb alternation). Injected `AiBookingDepthService` into `AiRetailFinanceService` (no circular dependency — `AiBookingDepthService` doesn't depend on any AI-layer service) so the compound can call `bookingDepth.handleMarkPaid` directly for the second step; `bookingId` flows from step 1 to step 2 automatically via the existing `mergeRetailFinanceCompoundContext` (already generic on `details.bookingId`, no changes needed there).
- [x] **ai-cmd-dashboard-6.3.3** — `assign_pre_visit_intake_to_booking` → `POST bookings/:id/pre-visit-intake`. New `AiClinicPreVisitIntakeService` triplet injecting `ClinicPreVisitIntakeService` (auto-picks the default questionnaire when `questionnaireId` is omitted, matching the underlying service's own behavior).

---



### ai-cmd-dashboard-6.4 — Services, categories, packages & multi-service


| API                                                                   | Status | Intent(s)                                                                     | Gap / action                                            |
| --------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| `GET/POST/PUT …/services`, `…/services/:id`                           | ✅     | `create_service`, `update_service`, `deactivate_service`, `configure_service_online_payment` | `DELETE …/services/:id` already covered — `ServiceService.remove()` is a soft-delete (`isActive: false`), the exact same operation the existing `deactivate_service` intent already calls; no separate `delete_service` intent needed |
| `GET/POST/PUT/DELETE …/service-categories`                            | ✅     | `create_service_category`, `update_service_category`, `delete_service_category` | Both new — same soft-delete pattern as services (`ServiceCategoryService.remove()` sets `isActive: false`) |
| `GET/POST/PUT/PATCH/DELETE …/packages`, activate/deactivate/duplicate | ✅     | `create_package`, `update_package`, `deactivate_package`, `activate_package`, `duplicate_package` | `update_package` was already wired (stale row) — only `activate_package` was a real gap, added mirroring `deactivate_package` exactly |
| `GET/PUT …/multi-service/settings`                                    | ✅     | `configure_multi_service_settings`, `explain_multi_service_settings` **2.29** | Already wired as mutate (`handleConfigureMultiServiceSettingsLogic`, dispatched in `ai-dashboard-core.logic.ts`) — the "Wire mutate" note was stale |


- [x] **ai-cmd-dashboard-6.4.1** — `delete_service` — confirmed already covered: the REST `DELETE` route and the existing `deactivate_service` intent both call `ServiceService.remove()`, which is a soft-delete, not a hard delete. No new intent implemented (would have been a pure duplicate).
- [x] **ai-cmd-dashboard-6.4.2** — `delete_service_category`, `update_service_category` → category CRUD. Both genuinely new — added `handleUpdateServiceCategoryLogic`/`handleDeleteServiceCategoryLogic` to `ai-catalog.logic.ts` (mirroring `handleCreateServiceCategoryLogic`'s resolve-by-name pattern), wired into `ai-catalog.service.ts` + `ai-dashboard-core.logic.ts` dispatch + `CATALOG_MUTATE_INTENTS`/`command-pipeline-mutating-actions.util.ts`. Also closed a real gap found in passing: `activate_package` had zero AI coverage despite `ServicePackagesService.activatePackage()` existing — added `handleActivatePackageLogic` mirroring `handleDeactivatePackageLogic` exactly.
- [x] **ai-cmd-dashboard-6.4.3** — `bulk_assign_services_category` **2.27** → move many services under category (AI bulk, repeated PUT or new service API)
- [x] **ai-cmd-dashboard-6.4.4** — `configure_service_featured` **2.26** → featured flag on services

---



### ai-cmd-dashboard-6.5 — Schedules, blocks & time off


| API                                                                                                             | Status | Intent(s)                                                                                | Gap / action                                  |
| --------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `GET …/schedules/templates`, `…/block-schedules`, `…/provider-calendar`                                         | 🟡     | `list_templates`, schedule reads                                                         | —                                             |
| `POST …/schedules/direct`, `…/templates`, `…/templates/:id/duplicate`, `…/templates/apply`, `…/block-schedules` | ✅     | `create_schedule_template`, `apply_schedule`, `block_schedule`, `create_direct_schedule`, `duplicate_schedule_template` | Duplicate-template gap closed — genuinely missing, not "implicit" |
| `PUT …/schedules/templates/:id`                                                                                 | ✅     | `update_schedule_template`                                                                | Was genuinely unwired despite "(implicit)" label — confirmed zero prior references, implemented fresh (rename only, matches simple-field-scope precedent from other CRUD sections) |
| `DELETE …/schedules/templates` + `{ templateIds[] }`                                                            | ✅     | `delete_schedule_templates`                                                               | Bulk delete by name(s) → `templateIds[]`      |
| `DELETE …/schedules/block-schedules/:id`                                                                        | ✅     | `delete_schedule_block`                                                                   | Resolves by employee + optional date (auto-picks when exactly one block matches) |
| `GET …/time-off-requests`, `POST …/:id/approve`, `…/deny`                                                       | ✅      | `list_time_off_requests`, `approve_time_off_request`, `deny_time_off_request`            | —                                             |


- [x] **ai-cmd-dashboard-6.5.1** — `delete_schedule_templates` → `DELETE …/templates` with `templateIds[]`. Injected `ScheduleService`/`BlockScheduleService` into `AiScheduleHandlersService` (imported `ScheduleModule` into `AiModule`, previously unwired) — used direct service calls rather than the domain's usual `OperationalPlanBuilderService`/policy-risk-plan pattern, since these are template *metadata* operations with no live-booking conflict risk (unlike `block_schedule`/`clear_schedule`, which affect live availability and warrant policy gating).
- [x] **ai-cmd-dashboard-6.5.2** — `delete_schedule_block` → block-schedules DELETE. Resolves the target block by employee (+ optional date when the employee has more than one); auto-resolves when exactly one block matches, mirroring the auto-resolve-if-single convention used throughout this audit.
- [x] **ai-cmd-dashboard-6.5.3** — Compound `apply_and_fill`: `apply_schedule` + `fill_unused_slots`. Implemented as a plain dispatched intent (not the early pre-classification compound-detector pattern used by retail-finance/gift-fulfillment) since both underlying handlers already live on the same `AiScheduleHandlersService` and need `employees`/`services` catalog data that isn't available until after classification — simpler to sequence the two existing calls directly in the dispatch case.
- Also implemented in passing: `duplicate_schedule_template` (real gap found during research, not on the original checklist but flagged in the table's "Duplicate template read" note) — mirrors the other template-CRUD handlers.

---



### ai-cmd-dashboard-6.6 — Staff, employees & team


| API                                                                           | Status | Intent(s)                                                  | Gap / action                                                     |
| ----------------------------------------------------------------------------- | ------ | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `GET/POST/PUT/PATCH/DELETE …/employees`, `…/access-role`, `…/send-app-access` | ✅     | `create_employee`, `update_employee`, `deactivate_employee`, `list_employees` | `delete_employee` confirmed a false gap (soft-delete, same as `deactivate_employee`); `update_employee` was already wired but silently dropped `serviceIds` — extended it |
| `GET/PATCH …/team-members`, `…/:id/role`                                      | ✅     | `update_team_member_role`                                   | New intent, owner-only (matches `TeamMembersService.updateRole`'s `ensureOwner` gate)                                        |


- [x] **ai-cmd-dashboard-6.6.1** — `update_employee` → PUT employees (name, services, schedule link). Turned out to already be fully wired (`ai-staff-operations.logic.ts`/`ai-operations.service.ts`/`ai-command.service.ts`) — but the existing handler silently ignored `serviceNames`/`serviceIds` despite `UpdateEmployeeDto`/`EmployeeService.update` fully supporting it. Extended `handleUpdateEmployeeLogic` to resolve `serviceNames` → `serviceIds` (reusing the same `resolveServiceIds` helper `create_employee` already uses) and pass them through — this **replaces** the employee's full skill list, matching `EmployeeService.update`'s own replace (not merge) semantics. No "schedule link" field exists on the `Employee` entity — closest concept is `userId` (dashboard/app access), which is a separate flow (`invite_staff_member`/`send-app-access`), correctly out of scope for this PUT.
  - `delete_employee` (flagged in the table, not on the checklist) — confirmed a false gap identical to `delete_service`/`delete_service_category` from 6.4: `EmployeeController.remove` → `EmployeeService.remove` is a soft-delete (`isActive: false`), the exact same call `deactivate_employee`'s handler already makes. No new intent needed.
- [x] **ai-cmd-dashboard-6.6.2** — `update_team_member_role` → PATCH team-members role. Genuinely new — injected `TeamMembersService` into `AiOperationsService`/`ai-staff-operations.logic.ts` (already exported from `BusinessModule`, already imported into `AiModule`, no new module wiring needed). Resolves the employee by name then calls `updateRoleByEmployeeId`, which internally enforces `ensureOwner` (owner role can't be reassigned, can't change your own role) — also gated owner-only in `access-control.matrix.ts` (denied for `manager`/`staff`/`client`) so non-owners get a clean AI-level rejection rather than relying on the service throwing.
- [x] **ai-cmd-dashboard-6.6.3** — Fixed all 7 pre-existing failing `staff-operations-*` eval cases (both plain-English and hy/ru i18n variants). Both `isCreateEmployeePrompt`/`isConfigureOnlineBookingPrompt` (`ai-staff-operations.util.ts`) were already correct for all 7 prompts — every failure was a sibling detector's bare-word collision stealing the prompt first. (1) "Register team member David as a provider" was stolen by `isExplainGuestCheckoutFieldsPrompt`'s (`ai-explain-guest-checkout-fields.util.ts`) `GUEST_ACCOUNT_TOPIC` regex, which includes the bare word "register" as a guest-signup cue with zero distinction from staff onboarding ("register team member X"). Fixed with an `isCreateEmployeePrompt` exclusion guard. (2) 6 cases ("Activate book online on the booking link", "Hide public booking link from customers", plus their hy/ru multilingual variants) were stolen by `isGetManageLinkPrompt`'s (`ai-get-manage-link.util.ts`) bare `MANAGE_LINK_CUE` regex, which matches the phrase "booking link" with zero distinction between a customer asking to get/send their manage link and a dashboard admin toggling online-booking visibility. Fixed with an `isConfigureOnlineBookingPrompt` exclusion guard. Both guards verified with zero circular-import risk. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-staff-operations`/`ai-get-manage-link`/`ai-explain-guest-checkout-fields`/`ai-intent-rescue` (408 tests): only the one already-known pre-existing `reschedule_booking` vs (now) `find_soonest_appointment` failure remains (still failing before and after — confirmed via `git stash`). Confirmed via full golden-eval-set diff (109 → 102 failures) that exactly these 7 target ids disappeared with zero new ids added.

---



### ai-cmd-dashboard-6.7 — Customers & patient chart


| API                                              | Status | Intent(s)                                                                    | Gap / action                                               |
| ------------------------------------------------ | ------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `GET …/customers/dashboard`, `…/:id`, `…/detail` | 🟡     | `list_customers`, `summarize_client`, CRM reads                              | Search/filter fixtures                                     |
| `PUT …/customers/:id`, `…/clinical-profile`      | ✅     | `update_customer`, `update_clinical_profile`                                  | —                                                           |
| `GET/POST …/documents`, `PATCH …/release`        | ✅     | `release_patient_document`                                                    | Binary upload stays a navigate action (no AI file upload)   |
| `GET/PUT/POST …/encounters`, addenda, by-booking | ✅     | `explain_patient_chart`, `create_encounter_addendum`, `update_encounter_by_booking` | —                                                      |
| `GET/POST …/pre-visit-intakes`, staff-notes      | ✅     | `list_customer_staff_notes`, `add_customer_staff_note`                        | —                                                           |
| `GET/POST …/patient-chart/alerts`, dismiss       | ✅     | `dismiss_patient_alert`                                                       | —                                                           |
| `GET …/orders`, `…/results` (chart)              | 🟡     | `explain_patient_results`, clinic reads                                      | —                                                            |
| `GET/DELETE …/me/data` (admin paths)             | 🟡     | `export_customer_data`, `delete_customer_data`, `admin_delete_customer_data` | GDPR admin                                                  |


- [x] **ai-cmd-dashboard-6.7.1** — Patient chart mutates: `update_customer` (name/email/phone/VIP — `ai-customer-crm.logic.ts`), `update_clinical_profile` (allergies/chronicProblems/emergencyContact*/bloodType/referringExternalDoctorId — `PatientClinicalProfilesService.upsertProfileForCustomer`, gated by `PatientClinicalProfileAccessService`), `dismiss_patient_alert` (dashboard staff-scoped dismiss via `PatientClinicalAlertsService.dismissAlert`, distinct from the customer-account-scoped `dismissAlertForCustomerAccount` already used by the customer surface). All three new to `ai-patient-clinical-mutations.{util,logic,service}.ts` (except `update_customer`, added to the existing `ai-customer-crm.*` files since it reuses the same `CustomerService` already injected there for `tag_customer`).
- [x] **ai-cmd-dashboard-6.7.2** — Documents: `release_patient_document` → `PatientDocumentsService.updateDocumentReleaseForCustomer(businessId, customerId, documentId, access, releasedToPatient)`; binary upload intentionally stays a client navigate action (no backend method takes a raw file buffer from an AI param, and there's no product ask for AI-driven file uploads).
- [x] **ai-cmd-dashboard-6.7.3** — Encounters: `create_encounter_addendum` (`PatientEncountersService.appendAddendum`; resolves `encounterId` from a given `bookingId` via `listEncountersForCustomer` when not provided directly — fails clearly if the booking has no visit note yet, since addenda require an existing note), `update_encounter_by_booking` (`PatientEncountersService.upsertEncounterForBooking`, writes/replaces the visit note for a booking).
- [x] **ai-cmd-dashboard-6.7.4** — Staff notes (flagged in the table, not on the original checklist): `list_customer_staff_notes` (READ) / `add_customer_staff_note` (MUTATE) → `PatientStaffNotesService` gated by the separate `PatientStaffNoteAccessService` (confirmed distinct from provider-mobile's `list_client_staff_notes`/`add_client_note`, which don't touch the `PatientStaffNote` entity at all — genuinely new backend surface, not a rename).
- Tier gating: all 7 new mutate/read intents (`update_clinical_profile`, `dismiss_patient_alert`, `release_patient_document`, `create_encounter_addendum`, `update_encounter_by_booking`, `list_customer_staff_notes`, `add_customer_staff_note`) added to `access-control.matrix.ts`'s `client` deny-set (PHI access — `client` tier is customer accounts, never staff), mirroring the existing `enter_test_result`/`release_test_result` precedent. `staff`/`manager`/`owner` are left ungated at the AI layer since each underlying service enforces its own assigned-booking-or-manager+ permission check already (same precedent). The 6 mutate intents also added to `command-pipeline-mutating-actions.util.ts`.
- New files: `ai-patient-clinical-mutations.util.ts` (customer resolver + alert-type guard), `.logic.ts` (7 handler functions), `.service.ts` (NestJS passthrough, injects the 7 patient-clinical-profiles services/access-services — all already exported by `PatientClinicalProfilesModule`, already imported into `AiModule`), `.fixtures.ts` (classifier rules, interpolated into `ai-command-intent-schema.appendix.build.ts`). Registered as a new row in `ai-command-registry.build.ts` reusing the existing `apiModule: 'patient-clinical-profiles'` string (no new `CommandApiModule` union member needed).
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline (no new errors); targeted jest sweep across the touched files passes except the 2 known pre-existing baseline failures (`access-control.matrix › allows product guide intents on their surfaces`, `ai-command-registry integration › aligns registry with capability matrix and sprint bindings`).

---



### ai-cmd-dashboard-6.8 — Pre-visit intake & clinic questionnaires


| API                                                                 | Status | Intent(s)                            | Gap / action                                                            |
| ------------------------------------------------------------------- | ------ | ------------------------------------ | ----------------------------------------------------------------------- |
| `GET/POST …/pre-visit-intakes/:id`, `…/start`, `…/answers`          | ✅     | `assign_pre_visit_intake_to_booking`, `staff_submit_intake_answers` | —                                       |
| `GET/POST/PUT …/clinic-questionnaires`, `…/definition`, `…/publish` | ✅     | `create_questionnaire`, `update_questionnaire`, `publish_questionnaire` | `…/definition` (full question-array replace) stays a form-builder UI action, not NL |


- [x] **ai-cmd-dashboard-6.8.1** — Questionnaire CRUD + publish intents → new `ai-clinic-questionnaire.{util,logic,service,fixtures}.ts`, delegating to `ClinicQuestionnairesService.createQuestionnaire`/`updateQuestionnaire`/`publishQuestionnaire` (manager+ only — `assertManageAccess` internally checks `canManageExternalDoctorsRegistry`). `update_questionnaire`/`publish_questionnaire` resolve the target via `questionnaireId` or `questionnaireCode`/`questionnaireName` (matched against `code`/`internalName`/`title` from `listQuestionnaires`). `PUT …/:id/definition` (replacing the full question/constraint array) intentionally has **no** AI intent — it's a rich form-builder action, not something a single NL command can populate; staff still use the dashboard question-builder UI for that. New `apiModule: 'clinic-questionnaires'` registry entry; `ClinicQuestionnairesModule` added to `AiModule`'s imports (previously only reachable transitively through `ClinicPreVisitIntakesModule`, which doesn't re-export it).
- [x] **ai-cmd-dashboard-6.8.2** — `staff_submit_intake_answers` → extended the existing `ai-clinic-pre-visit-intake.{util,logic,service}.ts` (already covering `assign_pre_visit_intake_to_booking`) with a handler that resolves the intake from `bookingId` via `ClinicPreVisitIntakeService.getForBooking`, then calls `submitAnswers(businessId, userId, intakeId, { questionId, values })` — one question's answer per call (the REST body's `values` is an array of answer strings for a single question, e.g. multi-select, not a batch of different questions).
- Tier gating: `create_questionnaire`/`update_questionnaire`/`publish_questionnaire` added to both `client` and `staff` deny-sets in `access-control.matrix.ts` (manager+ only, mirroring the existing `update_team_member_role` precedent); `staff_submit_intake_answers` added to `client` only (PHI-gated via `assertCustomerClinicalProfileAccess`, staff-with-assigned-booking or manager+ allowed, same precedent as **6.7**). All 4 new mutate intents added to `command-pipeline-mutating-actions.util.ts`.
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline; targeted jest sweep passes except the 2 known pre-existing baseline failures.

---



### ai-cmd-dashboard-6.9 — Clinic test results & lab ops


| API                                                                                 | Status  | Intent(s)                                                                       | Gap / action                                                           |
| ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET …/clinic-test-results/orders`, `…/specimens`, booking orders/results/summaries | ✅      | `list_test_orders`, `explain_patient_results`, `upload_patient_result`          | —                                                                       |
| `POST …/bookings/:id/orders`, `…/book-collection`, `…/push-to-patient`              | ✅      | `create_test_order`, `staff_book_lab_collection`, `push_lab_booking_to_patient` | Already wired in an earlier sprint — confirmed, no gap                 |
| `POST …/results/:id/transition`, `…/specimens/:id/transition`                       | ✅      | `enter_test_result`, `release_test_result`, `transition_specimen`               | —                                                                       |
| Catalog `test-types`/`panels` CRUD, `…/items`                                       | ✅      | `create_test_type`, `update_test_type`, `delete_test_type`, `create_test_panel`, `update_test_panel`, `set_test_panel_items` | —                                          |
| `POST …/catalog/import-csv`, `…/seed-playbook`                                      | ✅      | `apply_clinic_playbook`, `import_clinic_catalog_csv`                            | —                                                                       |
| `GET …/specimens/:id/label`, change-history                                         | ✅      | `explain_lab_result_history` (label print stays UI — no AI value)               | —                                                                       |


- [x] **ai-cmd-dashboard-6.9.1** — `import_clinic_catalog_csv` → `ClinicTestCatalogService.importFromCsv(businessId, csv, role)`, new `ai-clinic-test-catalog.{util,logic,service,fixtures}.ts` (manager+ only).
- [x] **ai-cmd-dashboard-6.9.2** — Catalog CRUD: `create_test_type`/`update_test_type`/`delete_test_type` (delete = soft-deactivate, mirrors `deactivateTestType`) and `create_test_panel`/`update_test_panel`/`set_test_panel_items` (replaces a panel's full test-type list) — same new service, resolving test types/panels by id, code, or name via `listTestTypes`/`listPanels`.
- [x] **ai-cmd-dashboard-6.9.3** — Audited the table's other rows first and found most were **false gaps**: `create_test_order`, `staff_book_lab_collection`, `push_lab_booking_to_patient`, `enter_test_result`, `release_test_result`, `configure_test_reference_range` were already fully wired from earlier sprints (the table was stale). The one **genuine** remaining gap was specimen state-machine transitions (`POST …/specimens/:id/transition`) — dashboard had zero AI intent for it (only provider-mobile's self-scoped `mark_specimen_collected` existed). Added `transition_specimen` (resolves the specimen by `specimenId`, `orderId`, or `customerName`; requires `toStatus` — Collected/ReadyForTransport/InTransit/ReceivedInLab/Completed/RecollectRequired/RetestRequired/Rejected) and `explain_lab_result_history` (read, `ClinicLabChangeHistoryService.listResultChangeHistory`) as new read/mutate handlers on the existing `ai-clinic-test-result-ext.logic.ts`/`AiClinicTestResultService` (kept deliberately **outside** the closed `CLINIC_TEST_RESULT_EXT_INTENTS` family from **ai-cmd-clinic-6-gap** — that family has its own locale-parity/eval DoD infra that shouldn't be reopened for two small additions; instead added directly to `CLINIC_TEST_RESULT_MUTATE_INTENTS`/`READ_INTENTS` in `ai-clinic-test-result.util.ts`).
- Extended `ai-capability.matrix.ts`'s `CLINIC_TEST_RESULT_CAPABILITY_ROWS` from 6→8 explicit rows (added `transition_specimen`/`explain_lab_result_history` at the correct positions) and `ai-clinic-test-result-ext.eval.util.ts`'s `resolveClinicTestResultAccessTier` to recognize the two new intents (both are CI/doc-parity guards from the closed gap family — extending them, not touching their locale/eval scope).
- Tier gating: catalog CRUD + CSV import denied for both `client` and `staff` (manager+ only, mirroring `update_team_member_role`); `transition_specimen`/`explain_lab_result_history` denied for `client` only (staff-with-assigned-booking or manager+, same precedent as `enter_test_result`/`release_test_result`). All 7 mutate intents added to `command-pipeline-mutating-actions.util.ts`.
- Fixed a constructor-arg-count cascade in `ai-clinic-test-result.service.integration.spec.ts` (3 new deps: `ClinicLabChangeHistoryService`, `ClinicSpecimenService`, `ClinicSpecimenStatusService`).
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline; targeted jest sweep across every touched file is green except the 2 known pre-existing baseline failures. A full `src/modules/ai/` sweep also surfaces ~132 unrelated pre-existing failures (confirmed via `git stash` that they exist on the clean tree too, and none reference any file touched in this session).

---



### ai-cmd-dashboard-6.10 — Gift cards


| API                                                        | Status | Intent(s)                                                                          | Gap / action                                                         |
| ---------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET …/gift-cards`, `…/settings`, `POST …/gift-cards`      | ✅     | `list_gift_card_orders`, `configure_gift_card_products`, `create_gift_card_bundle` | —                                                                     |
| `PUT …/settings`, `…/:id/expiration`, `…/expiration-audit` | ✅     | `extend_gift_card_expiry`, product config, `update_gift_card_settings`             | —                                                                     |
| `GET …/fulfillment`, `…/fulfillment/:id`, `PUT …/ship`     | ✅     | `mark_shipped` (= ship), `list_gift_card_orders`/`filter_awaiting_creation` (= queue), `mark_card_ready` (now dashboard+provider), `gift_fulfill_batch` | —                                        |
| `GET/PUT …/change-requests`, `…/resolve`                   | ✅     | `list_gift_card_change_requests`, `resolve_gift_card_change_request`                | —                                                                     |
| Refund/cancel (via order detail)                           | 🟡     | `refund_gift_card_order`, `cancel_gift_card_order`                                 | —                                                                    |


- [x] **ai-cmd-dashboard-6.10.1** — Fulfillment queue: audited first and found `ship_gift_card`/`list_gift_fulfillment_queue` were **false gaps** — already fully wired as `mark_shipped` (`PUT fulfillment/:id/ship`) and `list_gift_card_orders`/`filter_awaiting_creation` (`GET fulfillment`) via the existing `AiGiftFulfillmentService`. The one genuine gap was `mark_gift_card_ready`: the handler (`handleMarkCardReadyLogic`) and dashboard dispatch case already existed (built for provider-mobile) but the registry row (`PROVIDER_GIFT_FULFILLMENT_INTENTS`) only listed `surfaces: ['provider']` — added `'dashboard'` to that row's surfaces (one-line fix) so managers can also see the creation/delivery queues and mark cards ready without the provider mobile app. Confirmed safe: `command-pipeline-mutating-actions.util.ts`'s `DASHBOARD_PIPELINE_MUTATING_ACTIONS` already listed all 8 of these intents (half-done wiring from an earlier sprint), and none of the 8 are tier-gated in `access-control.matrix.ts` (consistent with the rest of this domain, which relies on `businessService.ensureMember` only).
- [x] **ai-cmd-dashboard-6.10.2** — `list_gift_card_change_requests` (read) / `resolve_gift_card_change_request` (mutate, resolution: approve/deny/needs_info) → `GiftCardOrderService.listChangeRequests`/`resolveChangeRequest`, added directly to the existing `ai-gift-fulfillment.{util,logic,service}.ts` (both `GiftCardOrderService` and `businessRepo` were already in `GiftFulfillmentLogicDeps`, no new deps needed). Also added `update_gift_card_settings` (mutate) for the generic `GiftCardBusinessSettings` fields `configure_gift_card_products` doesn't touch — `defaultExpiryMonths`, `digitalDeliveryEnabled`, `physicalDeliveryEnabled`, `cancelModifyEnabled`, `physicalCancelBeforeReady` (staff-id-array fields stay covered by the existing dedicated `assign_card_creator`/`assign_delivery_staff` intents).
- [x] **ai-cmd-dashboard-6.10.3** — `gift_fulfill_batch`: lists orders in `ready_for_delivery` status via `listDashboardOrders`, ships the first N (default 5, capped at 25) with auto-generated tracking numbers via `markShipped`, reporting per-order shipped/failed results.
- No classifier-rules fixtures file exists for this whole gift-fulfillment domain (confirmed — it relies entirely on `rescueGiftFulfillmentIntent` prompt-regex detection, not an LLM appendix block); followed the same precedent for the new intents rather than inventing one.
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline; targeted jest sweep (gift-fulfillment, registry, capability matrix, access-control, mutating-actions, gift-cards module, and the full provider-mobile/gift-fulfillment provider suite) is green except the 2 known pre-existing baseline failures — confirmed via `git stash` that a handful of unrelated provider-mobile failures (time-off/self-block/customer-context/sprint22) already exist on the clean tree.

---



### ai-cmd-dashboard-6.11 — Subscriptions, loyalty & promos


| API                                                                    | Status | Intent(s)                                                                                     | Gap / action                                             |
| ---------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `GET/POST/PUT/PATCH/DELETE …/subscriptions/plans`, activate/deactivate | ✅     | `create_subscription_plan`, `update_subscription_plan`, `deactivate_subscription_plan`, `activate_subscription_plan` | —                                          |
| `POST …/subscriptions/assign`, customer subscription CRUD              | 🟡     | `assign_subscription_to_customer`, `list_customer_subscriptions`, `cancel_subscription_admin` | —                                                        |
| `GET/PATCH …/loyalty/settings`, `…/customer/:id`, `…/adjust`           | ✅     | `summarize_loyalty_program`, `configure_loyalty_settings`                                      | —                                                          |
| `GET/POST/PATCH …/promo-codes`, deactivate                             | ✅     | `create_promo_code`, `deactivate_promo_code`                                                   | —                                                          |


- [x] **ai-cmd-dashboard-6.11.1** — Audited first and found `create_promo_code` and `configure_loyalty_settings` (6.11.2) were already fully wired from earlier sprints (**2.24**/**2.25**) — the table was stale. The genuine gap was `deactivate_promo_code`: added `handleDeactivatePromoCodeLogic` to the existing `ai-create-promo-code.logic.ts` (resolves the promo by `code` or `promoId` via `PromoCodesService.list`, then calls the already-existing `PromoCodesService.deactivate(businessId, id)`), wired through `AiMarketingGrowthService`/`ai-command.service.ts` (same dispatch path as `create_promo_code`). Added a symmetric `rescueDeactivatePromoCodeIntent`/`isDeactivatePromoCodePrompt` next to the existing create-side rescue (which already explicitly excluded "deactivate" prompts — this codebase had anticipated the pairing).
- [x] **ai-cmd-dashboard-6.11.2** — Documented above as an already-shipped false gap; no code change needed.
- [x] **ai-cmd-dashboard-6.11.3** — Found `update_subscription_plan` was a "silent" gap: `handleUpdateSubscriptionPlanLogic` and its `AiCatalogService.handleUpdateSubscriptionPlan` passthrough were both fully built but never wired into the dashboard dispatcher (`ai-dashboard-core.logic.ts`'s big intent-router, which is where `ai-command.service.ts` actually delegates catalog/subscription-plan intents — not its own switch). Added the missing one-line `case 'update_subscription_plan':` there. `activate_subscription_plan` was genuinely new: `ServiceSubscriptionsService.activatePlan(businessId, planId)` already existed on the underlying service (mirrors `deactivatePlan`), so added `handleActivateSubscriptionPlanLogic` to `ai-catalog.logic.ts` mirroring `handleDeactivateSubscriptionPlanLogic` exactly, plus a symmetric `isActivateSubscriptionPlanPrompt` rescue.
- Registry/mutating-actions: `activate_subscription_plan` added to `CATALOG_MUTATE_INTENTS` (auto-flows into the registry row) and `command-pipeline-mutating-actions.util.ts`; `deactivate_promo_code` added to `DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS` and the same mutating-actions list. No tier gating needed for either — confirmed none of the sibling intents in these two domains (`create_promo_code`, `create_subscription_plan`, `deactivate_subscription_plan`, etc.) are gated in `access-control.matrix.ts` either; this whole area relies on `businessService.ensureMember` only.
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline; targeted jest sweep (catalog, promo-code, marketing-growth, dashboard-core, registry, capability matrix, access-control, mutating-actions, promo-codes/service-subscriptions modules) is green except the 2 known pre-existing baseline failures. Fixed one incidental regression: `ai-marketing-growth.util.spec.ts`'s hardcoded `MARKETING_GROWTH_INTENTS.length` assertion bumped from 22 to 23.

---



### ai-cmd-dashboard-6.12 — Operations (inventory, locations, expenses, commissions, resources)


| API                                                                            | Status | Intent(s)                                    | Gap / action                                                                       |
| ------------------------------------------------------------------------------ | ------ | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET/POST …/locations`                                                         | ✅     | `create_location`, `update_location`         | —                                                                                   |
| `GET/POST/PUT …/inventory/products`                                            | ✅     | `adjust_inventory`, `create_product` (= create_inventory_product), `update_inventory_product`, `delete_inventory_product` | — |
| `GET/POST/DELETE …/inventory/service-links`                                    | ✅     | `link_product_to_service` (= link_inventory_to_service), `unlink_inventory_product` | —                             |
| `PUT …/inventory/recommendations/services|categories/:id` + `{ productIds[] }` | ✅     | `set_recommended_products` — **bulk replace** | —                                                                                   |
| `GET/POST/DELETE …/expenses`                                                   | ✅     | `record_expense`, `list_expenses`, `delete_expense` | —                                                                            |
| `GET/POST/DELETE …/commissions`                                                | ✅     | `commission_report`, `export_commissions`, `create_commission_rule`, `delete_commission_rule` | —                              |
| `GET/POST/DELETE …/resources`, `PUT …/requirements`                            | ✅     | `create_resource`, `assign_booking_resource`, `deactivate_resource` (= delete_resource), `set_service_resource_requirements` | — |


- [x] **ai-cmd-dashboard-6.12.1** — `set_recommended_products` → new handler in the existing `ai-retail-finance.{util,logic,service}.ts` calling `ProductRecommendationService.setServiceRecommendations`/`setCategoryRecommendations` (bulk-replace, resolves target by serviceName/categoryId, products by productIds or productNames). `ProductRecommendationService` newly injected into `AiRetailFinanceService`.
- [x] **ai-cmd-dashboard-6.12.2** — Inventory product CRUD + service-links: audited first and found `create_inventory_product`/`link_inventory_to_service` were **false gaps** — already fully wired under the names `create_product`/`link_product_to_service`. Added the genuinely missing pieces: `update_inventory_product`, `delete_inventory_product` (soft — `updateProduct(...,{isActive:false})`, same deactivate-not-delete pattern used everywhere else in this audit), and `unlink_inventory_product` (resolves the link by `linkId`, or by productName+serviceName via `listServiceLinks`).
- [x] **ai-cmd-dashboard-6.12.3** — Locations: new `ai-locations.{util,logic,service,fixtures}.ts` domain for `create_location`/`update_location` (`LocationsService`, newly imported into `AiModule`). Commission rules: `create_commission_rule`/`delete_commission_rule` added to `ai-retail-finance.logic.ts` (`CommissionsService.create`/`.remove` already existed, just never had AI handlers — resolves employee/service by name, rule by `ruleId` or employee/service match). Also audited `delete_resource`: **false gap**, already covered by the existing `deactivate_resource`; the one real gap there was `set_service_resource_requirements` — a proper multi-resource bulk-replace, distinct from the existing single-resource `assign_resource_hours` (which silently wipes other requirements when given only one resource — confirmed by reading `setServiceRequirements`'s delete-then-recreate implementation).
- No tier gating added — confirmed none of the sibling intents in inventory/expenses/commissions (`create_product`, `record_expense`, `commission_report`, etc.) are gated in `access-control.matrix.ts` either; `create_resource`/`assign_resource_hours` (which are gated in `command-pipeline-mutating-actions.util.ts`) got `set_service_resource_requirements` added alongside them for consistency; `create_location`/`update_location` also added there.
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline (fixed one constructor-arg-count cascade in `ai-retail-finance.service.spec.ts`/`.integration.spec.ts` from the new `ProductRecommendationService` dependency, and one hardcoded `RETAIL_FINANCE_INTENTS.length` assertion bumped from 14 to 21). Targeted jest sweep across every touched file and module is green except the 2 known pre-existing baseline failures.

---



### ai-cmd-dashboard-6.13 — Billing, SaaS & business settings


| API                                                                                                                     | Status | Intent(s)                  | Gap / action                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /billing/plans`, `…/billing/subscription`, entitlements, checkout, portal                                          | ✅     | `open_billing_settings`, `start_billing_checkout` | —                                                                                   |
| `GET/POST/PUT …/stripe-connect` (oauth, onboard, sync, login, disconnect)                                               | ✅     | `configure_stripe_connect`                        | —                                                                                   |
| Settings tabs: currency, tax, language, date format, pay-at-venue, privacy, compliance fields on `PUT …/businesses/:id` | ✅     | `configure_business_currency`, `configure_business_tax`, `configure_business_languages`, `configure_business_date_format`, `configure_cash_payments`, `configure_privacy_retention`, `configure_granular_consent` | —          |
| `GET/PUT …/provider/context` flags (open shifts, time off, self block, lab)                                             | 🔴     | Provider settings explains (read-only)          | **Product blocker** — no `PUT` route exists to persist these flags at all (see 6.13.1 note)               |


- [x] **ai-cmd-dashboard-6.13.1** — Audited the whole settings-tabs row first and found it was **entirely a false gap** — every named checklist intent already existed under its real name: `configure_currency`≡`configure_business_currency`, `configure_tax_settings`≡`configure_business_tax`, `configure_business_languages` (exact match), `configure_pay_at_venue`≡`configure_cash_payments` (toggles `acceptCashPayments`, which is exactly the pay-at-venue setting). `configure_provider_self_service_flags` is a genuine **product blocker**, not an AI gap: traced `selfBlockEnabled`/`timeOffEnabled`/`openShiftsEnabled` (read via `GET provider/context`) back to `business.settings.providerSelfBlock` / `.providerTimeOff` / `.providerOpenShifts` — none of these keys are ever written anywhere in the backend (no `PUT` route, no service method). There is nothing for an AI intent to call yet; documented as blocked pending a backend settings-write endpoint, same pattern as the customer-side blockers tracked in **ai-cmd-customer-6.14**.
- [x] **ai-cmd-dashboard-6.13.2** — `configure_stripe_connect` audited and confirmed **already fully shipped** (**2.15**, dispatched from `ai-command.service.ts` via `AiMarketingGrowthService`/`ai-stripe-connect.logic.ts`) — the checklist was stale. The one genuine gap in this whole section was `start_billing_checkout`: added to `ai-marketing-growth.{util,logic,service}.ts`, resolving the target plan by `planName`/`planId` against `getActivePlans()`/`getPlan()` and calling the already-existing `BillingService.createCheckoutSession(businessId, planId, business.email, billingInterval)`, returning the Stripe-hosted checkout URL as a navigate action (mirrors the existing navigate-only pattern already used by `open_billing_settings`'s portal link).
- Tier gating: `start_billing_checkout` added to `access-control.matrix.ts`'s `client` and `staff` deny-sets (manager+ only), mirroring the existing `open_billing_settings` precedent (billing is the one domain in this whole audit where the sibling read intent IS already tier-gated). Also added to `command-pipeline-mutating-actions.util.ts` next to `configure_stripe_connect`/`toggle_annual_billing`.
- Verified: `npx tsc --noEmit` holds at the 1347-error baseline; targeted jest sweep (marketing-growth, billing, registry, capability matrix, access-control, mutating-actions) is green except the 2 known pre-existing baseline failures. Fixed one hardcoded `MARKETING_GROWTH_INTENTS.length` assertion (23→24).
- [x] **ai-cmd-dashboard-6.13.2.1** — Fixed all 5 pre-existing failing `billing-loyalty-i18n-*` eval cases, plus 1 bonus fix, for 6 total. All 5 target prompts were Armenian (hy) imperatives — "Բացիր billing settings" (open), "Բացիր invoice և payment method settings", "Բացիր subscription settings", "Բացատրիր loyalty program settings-ը" (explain), "Բացատրիր loyalty points-ը այստեղ" — and all 5 were being swallowed by `hasHoursCue` in `ai-explain-business-hours-and-location.util.ts`, which had a bare, unqualified `բաց` (meaning "open") substring check intended to catch phrases like "Երբ եք բաց" ("when are you open"). The bug: Armenian "բացիր" (imperative "open [it]") and "բացատրիր" ("explain") BOTH contain "բաց" as their literal word root — a linguistic false-positive, not a copy-paste collision like the rest of this session's fixes. Fixed with a negative lookahead, `բաց(?!իր|ատրիր)`, so the cue still matches standalone "բաց" (open, adjective) but not when it's the root of these two unrelated derived verbs (verified against the one existing hy business-hours fixture, "Երբ եք բաց շաբաթ օրը", which still matches correctly since "բաց" there is followed by a space, not "իր"/"ատրիր"). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-explain-business-hours-and-location`/`ai-billing-loyalty-dashboard`/`ai-intent-rescue` (208 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (94 → 88 failures) that exactly these 5 target ids disappeared, plus 1 bonus (`business-currency-hy-explain-settings`, the identical "բացատրիր" root collision hitting a different domain), with zero new ids added.

---



### ai-cmd-dashboard-6.14 — Notifications, integrations & growth


| API                                                                                    | Status | Intent(s)                                                     | Gap / action                                                                                       |
| -------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET/PUT …/notifications/settings`, whatsapp, email-templates, reset, custom-variables | ✅     | `notification_history`, `configure_notification_settings`, `configure_whatsapp_integration`, `configure_push_recipients`, `test_push` | Already fully shipped — false gap, see notes below |
| `GET/POST/DELETE …/integrations/api-keys`, webhooks, events, docs                      | ✅     | `create_webhook`, `delete_webhook`, `toggle_webhook`, `list_webhooks`, `test_webhook`, `rotate_api_key`, `create_api_key`, `revoke_api_key` | `create_api_key`/`revoke_api_key` newly added this pass |
| Zapier, accounting, distribution, google-reserve, openai, zendesk, app-install         | ✅     | `list_integration_health`, `configure_zapier`, `configure_openai_integration`, `run_accounting_export`, `configure_zendesk`, `configure_distribution_channels`, `regenerate_tenant_app_install_qr`, `explain_tenant_app_install` | `configure_distribution_channels` newly added this pass; rest already shipped |
| `POST …/integrations/zendesk/support-ticket`                                           | ✅     | `create_support_ticket`, `sync_customer_to_zendesk`            | Already fully shipped — false gap |
| `GET/PUT …/marketing-automation/summary`, settings                                     | ✅     | `configure_marketing_automation`                               | Already fully shipped — false gap |


- [x] **ai-cmd-dashboard-6.14.1** — Notification + WhatsApp settings intents (**2.19**, **2.20**). **False gap**: `configure_notification_settings`, `configure_whatsapp_integration`, `configure_push_recipients`, `test_push`, `notification_history`, `toggle_business_email_on_customer_change` are all already implemented and dispatched (see `ai-notifications*` / `ai-integrations*` files); the table's "🔴" status was stale. No new code needed.
- [x] **ai-cmd-dashboard-6.14.2** — API keys + integration tab mutates. Genuine gap found: `rotate_api_key` (create-and-optionally-revoke compound) already existed, but standalone `create_api_key` (mint a new key without revoking) and `revoke_api_key` (revoke only, no new key) did not. Added both as new handlers in `ai-integrations.logic.ts`/`.service.ts`, dispatched from `ai-command.service.ts`, registered in `DASHBOARD_INTEGRATIONS_MUTATE_INTENTS` (`ai-integrations.util.ts`), classifier rules added to `ai-integrations-dashboard-classifier.fixtures.ts`, and added to `DASHBOARD_PIPELINE_MUTATING_ACTIONS`. All other integration-tab intents (`configure_zapier`, `configure_openai_integration`, `run_accounting_export`, `configure_zendesk`, `create_support_ticket`, `sync_customer_to_zendesk`, `list_integration_health`) were already shipped — false gap for the rest of the row.
  - ⚠️ Note: `ApiKeyService.createKey`/`.revokeKey` do not self-enforce the admin-only role check (the REST controller enforces it via `assertAdminRole` before calling the service, but the service methods themselves don't) — the pre-existing `rotate_api_key` AI handler already had this gap, and the new `create_api_key`/`revoke_api_key` AI handlers necessarily inherit it since they call the same service methods directly without membership context. Flagged via a separate follow-up task (not part of this section's scope) to enforce the role check inside `ApiKeyService` itself so all callers (REST + AI) are covered uniformly.
- [x] **ai-cmd-dashboard-6.14.3** — Growth: app-install QR + distribution settings. `regenerate_tenant_app_install_qr` and `explain_tenant_app_install` were already shipped — false gap. Genuine gap found: `DistributionIntegrationService.updateSettings` (Google Reserve, Meta booking button, Telegram, WhatsApp booking distribution channels — `PUT businesses/:id/integrations/distribution`) had zero AI wiring. Added `configure_distribution_channels` as a single flexible-field mutate intent mirroring `UpdateDistributionIntegrationDto`'s shape, wired the same way as 6.14.2's new intents.

---



### ai-cmd-dashboard-6.15 — Analytics, reports & reviews


| API                                                      | Status | Intent(s)                                      | Gap / action                                                     |
| -------------------------------------------------------- | ------ | ---------------------------------------------- | ---------------------------------------------------------------- |
| `GET …/analytics/staff`, services, heatmap, pl, adoption | ✅     | `summarize_pl`, `commission_report`, analytics reads | Already covered by existing `ai-retail-finance` analytics intents |
| `GET …/analytics/export.csv`, `export.pdf`               | ✅     | `export_analytics_report`                      | Newly added — both `exportCsv`/`exportPdfHtml` return text (CSV/HTML), not real binaries, so full content is deliverable via NL |
| `GET …/reviews`, `…/summary`                             | ✅     | `summarize_reviews`                            | Newly added — overall + per-employee rating summary plus recent reviews |


- [x] **ai-cmd-dashboard-6.15.1** — `export_analytics_report` → explain + open exports page. **Correction**: the table's assumption that this needs a "navigate/download, no binary via NL" fallback was wrong — `AnalyticsService.exportCsv` returns a plain CSV string and `exportPdfHtml` returns an HTML string (not a real PDF binary), so both are fully deliverable as AI response content. Added `handleExportAnalyticsReportLogic` to `ai-retail-finance.logic.ts` (sibling of `handleSummarizePlLogic`/`handlePayoutExportLogic`, reusing the already-injected `analyticsService`), with optional `format=csv|pdf` (default csv), `from`/`to`, `locationId` params. Wired as `export_analytics_report` in `DASHBOARD_RETAIL_FINANCE_MUTATE_INTENTS` (matches `payout_export` precedent of being classified MUTATE despite being a report), dispatched from `ai-command.service.ts`, classifier rule added.
- [x] **ai-cmd-dashboard-6.15.2** — `summarize_reviews` → reviews summary API. Added `ReviewsService` (`summary`/`list` methods) as a new dependency on `ai-retail-finance.logic.ts`/`.service.ts` (same domain file — no dedicated reviews AI file existed for dashboard-facing summaries; the only prior review-related AI intent, `list_provider_reviews`, is a public/provider-surface per-provider review list, a different method (`listPublicProviderReviews`) and a different concern). New `handleSummarizeReviewsLogic` computes an overall weighted-average rating + total count from `ReviewsService.summary()`, optionally scoped by `employeeId`, plus up to 5 recent reviews from `.list()`. Registered as a READ intent in `DASHBOARD_RETAIL_FINANCE_READ_INTENTS`.
- No tier gating added for either intent — the `ai-retail-finance` domain has no tier gating precedent for any of its existing intents (`summarize_pl`, `payout_export`, etc. are ungated), and neither is added to `DASHBOARD_PIPELINE_MUTATING_ACTIONS` for the same reason (no sibling intent in this domain participates in that gate).

---



### ai-cmd-dashboard-6.16 — Compliance, enterprise trust & strategy eval


| API                                                           | Status | Intent(s)                       | Gap / action                                                           |
| ------------------------------------------------------------- | ------ | ------------------------------- | ---------------------------------------------------------------------- |
| `GET …/compliance/status`, breach-incidents, phi-access-audit | ✅     | `explain_compliance_status`, `list_breach_incidents`, `view_phi_access_audit` | Already fully shipped — false gap |
| `POST …/compliance/breach-incidents`                          | ✅     | `report_data_breach`, `send_breach_notification` | Already fully shipped — false gap (both create-incident and notify-customers were already wired) |
| Enterprise trust, strategy-eval, hipaa/marketplace frameworks | ✅     | `explain_enterprise_trust`, `explain_strategy_eval`, `update_strategy_eval` | Newly added — both are real backend modules (`EnterpriseTrustModule`, `StrategyEvalModule`), not placeholders |


- [x] **ai-cmd-dashboard-6.16.1** — Breach incident create + notification compound. **False gap**: `report_data_breach` (creates a `DataBreachIncident` with GDPR 72-hour deadline and a draft notification) and `send_breach_notification` (emails affected customers using that draft) were already fully implemented and dispatched in `ai-business-compliance.logic.ts`/`.service.ts`, alongside `list_breach_incidents`. The table's "🟡 wire create incident" note was stale.
- [x] **ai-cmd-dashboard-6.16.2** — Enterprise/strategy tabs — read-only explain intents (P3). Both `enterprise-trust` (`EnterpriseTrustService`: legal business name/address/DPO email/EU rep settings, rendered DPA/EU-privacy-policy documents, security one-pager) and `strategy-eval` (`StrategyEvalService`: HIPAA readiness checklist eval, marketplace positioning eval) are real, fully-built NestJS modules with their own controllers — not stubs. Added `explain_enterprise_trust` (aspect=settings|documents|security) and `explain_strategy_eval` (aspect=hipaa|marketplace|all) as READ intents, plus `update_strategy_eval` (evalType=hipaa with answers/decision, or evalType=marketplace with criterionWeights/decision) as a MUTATE intent — all three added to `ai-business-compliance.logic.ts`/`.service.ts` (reusing that file's existing owner-gated convention: `userId` + `ensureOwner` check, `isXPrompt`/`parseXFromPrompt` gate) rather than a new domain file, since this is the same compliance/trust/legal admin surface. Wired `EnterpriseTrustModule`/`StrategyEvalModule` into `ai.module.ts`. Tier-gated (staff-denied, matching sibling compliance intents `report_data_breach`/`enable_hipaa_mode`/etc.) and `update_strategy_eval` added to `DASHBOARD_PIPELINE_MUTATING_ACTIONS` (matching its mutate siblings in this domain).

---



### ai-cmd-dashboard-6.17 — Auth, uploads & telemetry (out of scope)


| API                                                                            | Status | Notes                                        |
| ------------------------------------------------------------------------------ | ------ | -------------------------------------------- |
| `POST /auth/login`, register, reset-password, forgot-password, switch-business | ⚪      | Staff auth — no AI                           |
| `PATCH /auth/preferences`                                                      | ⚪      | User prefs                                   |
| `POST …/uploads/avatar`, `…/logo`                                              | ⚪      | Binary — `explain_upload_logo` navigate only |
| `POST /events/app`                                                             | ⚪      | Analytics telemetry                          |


---



### ai-cmd-dashboard-6.18 — Bulk insert / update / delete summary (dashboard)


| Operation type                   | REST / mechanism                          | AI intent                                                                                   | Status                                                    |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Bulk cancel/update bookings**  | AI matcher (no `bulk_`* REST)             | `cancel_bookings`, `update_bookings`, `bulk_smart_cancel`, `payment_sweep`, `mark_no_shows` | ✅ AI-native                                               |
| **Bulk catalog create**          | `POST onboarding/apply-catalog`, AI draft | `bulk_create_catalog`, `apply_onboarding_catalog`, playbooks                                | ✅ already wired                                          |
| **Bulk catalog CSV import**      | `POST …/catalog/import-csv`               | `import_clinic_catalog_csv`                                                                | ✅ already wired                                          |
| **Bulk schedule delete**         | `DELETE …/templates` + `templateIds[]`    | `delete_schedule_templates`                                                                | ✅ already wired                                          |
| **Bulk schedule apply**          | `POST …/templates/apply`                  | `apply_schedule`                                                                            | ✅                                                         |
| **Bulk agent rebook/undo**       | `POST rebook-all`, `undo-latest`          | `rebook_all_from_agent_task`, `undo_latest_agent_task`                                      | ✅ already wired                                          |
| **Bulk retail cart replace**     | `PUT retail-sales` `lines[]`              | `set_retail_sales_lines`                                                                    | ✅ already wired                                          |
| **Bulk product recommendations** | `PUT …/recommendations/…` `productIds[]`  | `set_recommended_products`                                                                 | ✅ already wired                                          |
| **Bulk locale strip**            | Service layer                             | `bulk_strip_disabled_locale_translations`                                                   | ✅ AI-native                                               |
| **Bulk service currency**        | Service layer                             | `bulk_update_service_currency`                                                              | ✅ AI-native                                               |
| **Bulk service category assign** | Repeated PUT or future API                | `bulk_assign_services_category`                                                             | ✅ already wired (own domain file)                        |
| **Bulk gift fulfill**            | List + ship one-by-one                    | `gift_fulfill_batch`                                                                        | ✅ already wired                                          |


- [x] **ai-cmd-dashboard-6.18.1** — Implement `delete_schedule_templates` (bulk delete). **False gap**: already fully implemented in `ai-schedule-handlers.service.ts`, dispatched, registered, and tier-gated.
- [x] **ai-cmd-dashboard-6.18.2** — Implement `set_retail_sales_lines` + `set_recommended_products`. **False gap**: both already implemented in `ai-retail-finance.logic.ts`/`.service.ts` (`set_recommended_products` was added earlier this session in **ai-cmd-dashboard-6.12**).
- [x] **ai-cmd-dashboard-6.18.3** — Agent bulk: `rebook_all_from_agent_task`, `undo_latest_agent_task`. **False gap**: both already implemented in `ai-agent-ops.logic.ts`/`.util.ts`, dispatched, and tier-gated.
- [x] **ai-cmd-dashboard-6.18.4** — `import_clinic_catalog_csv` (bulk insert). **False gap**: already implemented in `ai-clinic-test-catalog.logic.ts`/`.util.ts` (added earlier this session in **ai-cmd-dashboard-6.9**), dispatched and tier-gated.
- [x] **ai-cmd-dashboard-6.18.5** — Document AI-native booking bulk in `dashboard-api-ai-parity.fixtures.ts` as `kind: 'ai-bulk-internal'`. Completed as part of **ai-cmd-dashboard-6.19.1**, which created the file: see `dapi-bulk-ai-native` (covers `cancel_bookings`, `update_bookings`, `bulk_smart_cancel`, `payment_sweep`, `mark_no_shows`, `bulk_strip_disabled_locale_translations`, `bulk_update_service_currency` — all resolved via repeated single-item calls inside the AI handler, no dedicated bulk REST route).

---



### ai-cmd-dashboard-6.19 — Parity gate (mirror **ai-cmd-customer-6.13**)


| ID         | Task                                  | Notes                                                                              |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------- |
| **6.19.1** | `dashboard-api-ai-parity.fixtures.ts` | One row per dashboard REST path (from the **6.1**–**6.18** audit tables) → intent(s) or `no-ai` / `ai-bulk-internal` — 84 rows |
| **6.19.2** | `test:dashboard-api-ai-parity`        | Fails on unknown/duplicate/malformed fixture rows and unregistered intents         |
| **6.19.3** | Cross-check `DASHBOARD_INTENTS`       | Every intent named in the fixtures file verified against the real registry (jest gate itself caught 2 wrong names — see notes) |
| **6.19.4** | `ai-cmd-dashboard-gap-10`             | Linked **parity-2.1** to the new parity file (still open — see note there)         |


- [x] **ai-cmd-dashboard-6.19.1** — Created `dashboard-api-ai-parity.fixtures.ts` + `.util.ts` from the **ai-cmd-dashboard-6.1**–**6.18** audit tables (this session's own prior work), mirroring `customer-public-api-ai-parity.fixtures.ts`'s structure. Since the dashboard frontend has no single centralized `public-api.ts` (REST calls are scattered across ~130 page files, confirmed via research), each row keys off a `restPath` description (matching each audit table's "API" column) instead of a frontend export name. Coverage union is `dashboard-ai` (intents), `ai-bulk-internal` (AI-native bulk via repeated single calls, no dedicated bulk REST route — e.g. `cancel_bookings`, `bulk_smart_cancel`), or `no-ai` (with a required reason — covers **6.17**'s out-of-scope auth/upload/telemetry rows and the one genuine product blocker, `configure_provider_self_service_flags`'s missing PUT route from **6.13**). 84 rows total, one per audit-table row across all 18 subsections.
- [x] **ai-cmd-dashboard-6.19.2** — Wired `npm run test:dashboard-api-ai-parity` in `backend/package.json` (mirrors `test:provider-api-ai-parity`'s pattern exactly: runs the new parity-fixtures spec together with the pre-existing `ai-command-handler-coverage.spec.ts`, which independently checks the *other* half of the gate — dispatch coverage, i.e. does every registered intent resolve to actual dispatch code — a distinct, complementary check from REST-binding coverage). Also added `dashboard-api-ai-parity` to `test:ai-cmd-ext`'s pattern list (closing **6.19.3**'s "extend test:ai-cmd-ext" note).
- [x] **ai-cmd-dashboard-6.19.3** — The gate's own structural validation (mirrors the customer/provider gates — no frontend file scanning, just internal consistency + registry cross-checks) caught 2 real mistakes on the first run: `list_customers` and `summarize_client` aren't real dashboard intents (the audit table's own wording was imprecise) — the actual registered intents are `summarize_customers` (customer rankings/segments by metric) and `lookup_customer` (single profile lookup); `summarize_client` turned out to be a **provider-mobile-only** intent (pre-visit client snapshot), not a dashboard one at all. Fixed and all 91 gate assertions pass. Also added 2 cross-check tests (mirroring the customer gate's `listMutateIntentsMissingApiBinding` pattern) confirming known retail-finance and business-compliance mutate intents from this session's work have parity rows.
- [x] **ai-cmd-dashboard-6.19.4** — Added a linking note to **parity-2.1** (line ~801) pointing to `dashboard-api-ai-parity.fixtures.ts`/`npm run test:dashboard-api-ai-parity` as its REST-binding tracking mechanism. **parity-2.1** itself stays open (not closed by this task) — the 84-row fixtures file covers exactly the REST paths audited in **6.1**–**6.18**, but `DASHBOARD_MUTATING_INTENTS` (165 intents total) spans the entire historical registry, including older pre-6.x-era intents never itemized in this session's audit tables; a full 165-intent cross-check would need a separate follow-up pass, not assumed complete here.

**Note on scope vs. the original 6.19 spec**: the original table's phrasing ("one row per `frontend/src/` API wrapper", "cross-check every mutating intent") implied an exhaustive scan of dashboard frontend source files. Given the dashboard has no centralized API-client file (unlike customer/provider) and spans ~130 scattered REST calls, this pass instead sourced rows directly from the **6.1**–**6.18** audit tables (which already enumerate every REST path this whole `ai-cmd-dashboard-6` epic reviewed) — a faithful, verified parity file for everything this audit covered, while being explicit that it is not yet a 100%-exhaustive scan of the entire dashboard frontend or the entire historical intent registry.

---



### ai-cmd-dashboard-6.20 — Product blockers & overlaps


| ID         | Item                        | Why it affects AI                                               | Action                                                                 |
| ---------- | --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **6.20.1** | **Binary uploads**          | Logo/avatar/document attach                                     | Navigate intents only — cannot pass bytes via NL — tagged `no-ai-binary` |
| **6.20.2** | **Export downloads**        | CSV/PDF/commission export                                       | **Corrected**: not a blocker — `export_analytics_report`/`payout_export`/`run_accounting_export` already deliver full CSV/HTML/text content via NL (see **6.14**/**6.15**), since none of these backend export methods return real binaries |
| **6.20.3** | **Stripe OAuth**            | Connect onboarding                                              | Deep link only (**2.15**) — no token in chat — already covered as `configure_stripe_connect` (dashboard-ai), which returns the connect URL, not a token |
| **6.20.4** | **Provider/mobile overlap** | Same business APIs on provider pages in `frontend/app/provider` | Audited in **ai-cmd-provider-6** — dashboard-6 excludes those wrappers |
| **6.20.5** | **Public booking overlap**  | `public-api.ts`                                                 | **ai-cmd-customer-6**                                                  |


- [x] **ai-cmd-dashboard-6.20.1** — Document upload/export rows as `no-ai-binary` in parity fixtures. Added a distinct `no-ai-binary` coverage kind to `dashboard-api-ai-parity.fixtures.ts`'s `DashboardApiAiParityCoverage` union (separate from the general `no-ai`, which covers non-binary reasons like auth flows or product blockers) and applied it to the two genuinely binary-constrained rows: `dapi-uploads` (logo/avatar) and the newly-split-out `dapi-patient-documents-upload` (the document-upload half of what was previously one combined `dapi-patient-documents` row — the release/PATCH half stays `dashboard-ai` since `release_patient_document` is a real, already-shipped intent). **Correction found while auditing this row**: 6.20.2's "export downloads" was NOT actually a blocker needing a `no-ai-binary` tag — **6.14**/**6.15** (earlier this session) already established that `export_analytics_report`, `payout_export`, and `run_accounting_export` all deliver full text content (CSV/HTML strings, not real binaries) directly via NL, so those rows correctly stay `dashboard-ai` in the parity file, not `no-ai-binary`. 6.20.3 (Stripe OAuth) is likewise already covered as a real `dashboard-ai` row (`configure_stripe_connect`) — the "deep link only" caveat just means the intent returns a URL rather than a raw OAuth token, which is exactly how it's implemented. Updated `dashboard-api-ai-parity.util.ts`'s validation/formatting to handle the new kind, extended `.util.spec.ts` with a `no-ai-binary` missing-reason test case (92 assertions total, up from 91). Verified: `npx tsc --noEmit` holds at the same pre-existing delta (no new-file errors); jest sweep clean except the 2 known pre-existing baseline failures.

---



### ai-cmd-dashboard-6.21 — Audit follow-up (rows added after first pass)


| API / mechanism                                            | Status | Intent(s)                             | Gap / action                                                                |
| ---------------------------------------------------------- | ------ | ------------------------------------- | --------------------------------------------------------------------------- |
| `POST …/billing/confirm-checkout`                          | ✅     | `confirm_billing_checkout`            | Newly added — Stripe return handoff after SaaS checkout, syncs subscription |
| `GET …/billing/entitlements`                               | ✅     | `explain_plan_entitlements`           | Newly added — portal-free plan limits/usage/flags read                     |
| `PUT …/businesses/:id` + `settings.referralProgram`        | ✅     | `configure_referral_program`          | Newly added — real runtime feature (`ReferralProgramService`), just had no typed admin write route; reused `mergeReferralProgramSettings` normalizer |
| `PUT …/businesses/:id` + `settings.staffMessageTemplates`  | ✅     | `configure_staff_message_templates`   | Newly added — same pattern, reused `normalizeStaffMessageTemplatesSettings` normalizer |
| `GET …/subscriptions/:id/usage`                            | ✅     | `subscription_usage_history`          | **False gap** — already fully covered, calls the identical `SubscriptionsService.getUsageHistory` the REST route uses |
| `GET/POST/PUT …/external-doctors`                          | ✅     | `create_external_doctor`, `update_external_doctor`, `list_external_doctors` | Newly added — new `ai-external-doctors.{util,logic,service,fixtures}.ts` domain (clinic vertical only) |
| `GET …/clinic-test-results/bookings/:id/summaries`         | ✅     | `list_booking_lab_summaries`          | Newly added to the dashboard surface — reused the existing provider-mobile handler/service call as-is (no provider-session scoping in the underlying service) |
| `POST …/ai/command/tasks/:id/approve`, `…/steps/:id/retry` | ✅     | `approve_agent_task`, `retry_agent_step` | Newly added — extended existing `ai-agent-ops.{util,logic,service}.ts`, calling `AgentOrchestratorService.approveAndExecute`/`.retryFailedStep` directly |
| `GET …/analytics/adoption`                                 | ✅     | `summarize_adoption_funnel`           | Newly added — extended `ai-retail-finance.logic.ts` with a new `AppEventService` dependency |
| Socket.IO `WS /events`                                     | ⚪      | Realtime invalidation for bookings/AI | Documented as `kind: 'no-ai-realtime'` in `dashboard-api-ai-parity.fixtures.ts` (new coverage-kind variant) |


- [x] **ai-cmd-dashboard-6.21.1** — Referral + staff message template intents → `PUT …/businesses/:id` settings blobs. Both `settings.referralProgram` (`ReferralProgramService`: claim codes, reward payout, hooked into `booking-completed.listener.ts`) and `settings.staffMessageTemplates` (used by provider-mobile's `send_client_message`) are real, working, tested backend features — only their *admin write path* was missing a typed route (just an untyped generic `PUT businesses/:id`, with `BusinessService.update()` never validating either blob). Built a new `ai-referral-staff-templates.{util,logic,service,fixtures}.ts` domain reusing the existing `mergeReferralProgramSettings`/`normalizeStaffMessageTemplatesSettings` normalizer utilities (same merge-then-validate-then-save pattern as `configure_business_languages`) rather than requiring a new backend route. Tier-gated manager+ only (staff+client denied), matching `configure_business_languages`'s precedent.
- [x] **ai-cmd-dashboard-6.21.2** — External doctors CRUD intents. `ExternalDoctorsService` (full CRUD, clinic-vertical-gated via `assertClinicLabFeaturesEnabled`, permission-gated via the shared `canManageExternalDoctorsRegistry`/`canListExternalDoctorsRegistry` utils also used by clinic-questionnaires) had zero AI coverage. Built a new `ai-external-doctors.{util,logic,service,fixtures}.ts` domain: `create_external_doctor` (requires name + full address), `update_external_doctor` (resolves by `doctorId` or fuzzy `doctorName` search), `list_external_doctors` (search/paginate). Tier-gated manager+ only for the two mutates (list stays ungated, matching the underlying service's own `canListExternalDoctorsRegistry` which currently allows all staff).
- [x] **ai-cmd-dashboard-6.21.3** — `confirm_billing_checkout` + `explain_plan_entitlements`. Both added to the existing `ai-marketing-growth.{util,logic,service}.ts` (already home to `start_billing_checkout`/`open_billing_settings`, with `billingService`/`planEntitlementsService` already injected). `confirm_billing_checkout` calls `BillingService.confirmCheckoutSession(businessId, sessionId)` — the exact Stripe-return-handoff method the REST route uses. `explain_plan_entitlements` is a portal-free sibling of `open_billing_settings` (same `getEntitlements()` call, reusing `formatEntitlementsSummary`, but without creating a new Stripe portal session each time). Tier-gated manager+ only, matching `start_billing_checkout`/`open_billing_settings`'s existing precedent (billing is the one domain in this whole audit where sibling reads are already gated).
- Also implemented beyond the 3 checklist items (found during research, matching the table's other flagged rows): **`list_booking_lab_summaries` dashboard parity** — the provider-mobile handler (`ai-provider-clinic-tasks-and-results.logic.ts`) already called a business/booking-scoped (not provider-session-scoped) service method, so it was safely reusable; injected `AiProviderClinicTasksAndResultsService` into `AiCommandService` too, added a dashboard dispatch case, and split the registry row so only this one intent (not the other 3 genuinely provider-session-scoped ones — `claim_clinic_task`/`complete_clinic_task`/`list_lab_results_queue`) gained `surfaces: ['provider', 'dashboard']`. **`approve_agent_task`/`retry_agent_step`** — extended `ai-agent-ops.*` (already injects `AgentOrchestratorService`, which already has `approveAndExecute`/`retryFailedStep`); tier-gated manager+ only alongside the existing 3 agent-ops intents. **`summarize_adoption_funnel`** — extended `ai-retail-finance.logic.ts` with a new `AppEventService` dependency (already transitively available via `AnalyticsModule`, already imported into `AiModule` — no new module wiring needed), calling `getAdoptionDashboard()` and narrating the funnel step counts/conversion. **`explain_subscription_usage`** confirmed a **false gap** — `subscription_usage_history` (already shipped, in `ai-customer-crm.logic.ts`) calls the identical `SubscriptionsService.getUsageHistory` method the proposed intent would have. **WS `/events`** documented as `no-ai-realtime` (new coverage-kind variant added to `dashboard-api-ai-parity.fixtures.ts`, alongside `no-ai-binary` from **6.20**) — a pure push-transport channel with no request/response shape for an AI intent to call.
- ⚠️ **Security finding, not fixed in this pass**: `AgentOrchestratorService.approveAndExecute(taskId, userId)` (called by the new `approve_agent_task` intent, and by the pre-existing REST `POST .../ai/command/tasks/:id/approve` route) never validates that `taskId` belongs to the caller's business — unlike its sibling `retryFailedStep`, which already checks `task.businessId !== businessId`. This is a pre-existing gap (not introduced by this session), inherited by the new AI intent because it necessarily calls the same underlying method. Flagged via a separate follow-up task to add the missing businessId check consistently across the whole call chain (REST + AI), rather than silently expanding it further or attempting an out-of-scope fix here.
- All 9 new intents added to `dashboard-api-ai-parity.fixtures.ts` (`ai-cmd-dashboard-6.19`'s parity gate) — verified via `npm run test:dashboard-api-ai-parity` (102 assertions passing, up from 92; the gate itself caught 0 new mistakes in this batch, unlike **6.19**'s original build).
- Verified: `npx tsc --noEmit` holds at the same pre-existing error delta (no new-file diffs). Targeted jest sweep (all 9 new/extended files, `dashboard-api-ai-parity`, `ai-command-handler-coverage`, `ai-command-registry`, `access-control.matrix`, `ai-command-intent-schema`, `ai-capability.matrix`, `command-pipeline-mutating-actions`, `external-doctors`, `app-event`) is green — 407 passing, only the 2 known pre-existing baseline failures plus the 1 confirmed-pre-existing `ai-capability.matrix` failure remain. Fixed constructor-arg-count cascades in `ai-retail-finance.service.spec.ts`/`.integration.spec.ts` and `ai-marketing-growth.logic.spec.ts` (new `AppEventService`/`confirmCheckoutSession` mocks); bumped hardcoded `RETAIL_FINANCE_INTENTS.length` (23→24) and `MARKETING_GROWTH_INTENTS.length` (24→26) assertions.

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


| Phase                                  | IDs                                             | Closes API gaps                                 |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **A — Bulk REST parity**               | **6.18.*** , **6.5.1** , **6.3.1** , **6.12.1** | Templates delete, retail lines, recommendations |
| **B — Chair & booking hardening**      | **6.3.*** , **6.18.5**                          | Retail compound + AI-native bulk fixtures       |
| **C — Agent ops**                      | **6.1.***                                       | Rebook-all + undo-latest                        |
| **D — Gift + clinic CSV**              | **6.10.*** , **6.9.1**                          | Fulfillment + catalog import                    |
| **E — Settings & growth**              | **6.13.*** , **6.14.*** , **ai-cmd-ext-2.14+**  | Stripe, notifications, promos                   |
| **F — Patient chart & questionnaires** | **6.7.*** , **6.8.***                           | CRM depth                                       |
| **G — Gate**                           | **6.19.***                                      | `test:dashboard-api-ai-parity`                  |


**Cross-links:** **ai-cmd-ext** (252 registry intents), **ai-cmd-ext-2.14+** (proposed verbs), **parity-2.1**, **ai-cmd-customer-6**, **ai-cmd-provider-6**, **feature-ai-prompt-coverage** (dashboard surface only).

---

- [x] **ai-cmd-tour-eval-hardening.1** — Fixed all 5 pre-existing failing `tour-service-*` eval cases (**ai-cmd-tour**, `configure_tour_service`/`explain_tour_services`). Both `isConfigureTourServicePrompt`/`isExplainTourServicesPrompt` (`ai-tour-service.util.ts`) were already correct for all 5 hy/ru prompts — every failure was a sibling detector's bare-word/root collision stealing the prompt first, four separate root causes: (1) 2 cases ("Change City Tour's meeting point to Main hotel lobby" in hy and ru) were stolen by `isExplainTourMeetingPointPrompt`'s (`ai-tour-meeting-point.util.ts`) bare meeting-point-topic match, which already excluded English "set/configure/update meeting point" but had no equivalent hy/ru mutate-verb exclusion; added `փոխ`/`измени` ("change") checks. (2) The Armenian "Update 3-Day Mountain Trek's max group to 8 guests" was stolen by `isExplainGuestCheckoutFieldsPrompt`'s bare Armenian `հյուր` ("guest") word — the number "8 հյուր" (8 guests) in a group-size context triggered the same guest-account bare-word cue already implicated in **ai-cmd-customer-4.2.2.1**'s fix this session; added an `isConfigureTourServicePrompt` exclusion guard (verified no circular imports). (3) "Show tour services by group size" (hy) was stolen by `isExplainProfessionalProfilePrompt`'s (`ai-explain-professional-profile.util.ts`) named-provider-extraction regex, which misparsed the Armenian noun "էքսկուրսիաների" (tour services, genitive plural) as if it were a person's name; added an `isExplainTourServicesPrompt` exclusion guard. (4) "What tours do we offer" (hy) was stolen by `isExplainCheckoutRecommendationsPrompt`'s (`ai-checkout-recommendations.util.ts`) bare Armenian `առաջարկ` ("offer/recommend") root — "առաջարկում" ("we offer") shares this root, an identical linguistic-false-positive shape to the "բաց"/"հարկ" bugs fixed earlier this session; added an `isExplainTourServicesPrompt` exclusion guard. Fixing (4) surfaced a **second-order regression**: `isExplainTourServicesPrompt` was ITSELF broad enough (via its own bare Russian `бронирован`/"booking" root in `hasTourExplainSurface`) to swallow an unrelated legitimate `explain_checkout_recommendations` fixture ("Which products show up on the success screen in consumer app after booking") — narrowed that alternative to require `тур`/`экскурс` co-occurrence within 20 chars of `бронирован`, rather than a bare match (verified no existing tour-service fixture relied on the bare form). tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-tour-service`/`ai-tour-meeting-point`/`ai-explain-guest-checkout-fields`/`ai-explain-professional-profile`/`ai-checkout-recommendations`/`ai-recover-lost-manage-link`/`ai-confirm-my-booking-details`/`ai-checkout-tax`/`ai-intent-rescue` (754 tests): only the one already-known pre-existing `reschedule_booking` vs `find_soonest_appointment` failure remains. Confirmed via full golden-eval-set diff (83 → 78 failures) that exactly these 5 target ids disappeared with zero new ids added.

- [x] **ai-cmd-clinic-eval-hardening.1** — Fixed all 4 pre-existing failing `clinic-service-hy-*` eval cases (**ai-cmd-clinic**, `configure_clinic_service`/`explain_clinic_services`), plus 1 bonus (`clinic-service-ru-configure-lipid-prep`). Both `isConfigureClinicServicePrompt`/`isExplainClinicServicesPrompt` (`ai-clinic-service.util.ts`) were already correct for all 4 hy prompts — two distinct root causes. (1) 3 configure-side cases ("Mark CBC as lab test with fasting", "Set lipid panel's prep points: 12h fasting", "Remove fasting requirement from CBC") were stolen by `isExplainPreparationNotesPrompt`'s (`ai-explain-preparation-notes.util.ts`) bare Armenian `ծոմավոր` ("fasting") root match with zero read-vs-mutate distinction — the file's existing `CATALOG_LAB_PREP_BLOCK` guard only covered narrower CBC-adjacency/ordering patterns that didn't match these 3 phrasings. Rather than extend that narrow regex further, added a direct `isConfigureClinicServicePrompt` exclusion guard (verified no circular imports — neither file imports the other). (2) The remaining case ("Which lab tests require fasting", read/catalog-overview phrasing) turned out to be a **genuine ambiguous-fixture bug, not a detector bug**: the exact same Armenian sentence "Որ լաբ թեստերն են ծոմավոր պահանջող" was hardcoded as a golden fixture in BOTH `ai-clinic-service-multilingual.fixtures.ts` (expecting `explain_clinic_services`, a dashboard catalog-overview read) AND `ai-explain-lab-prep-multilingual.fixtures.ts` (expecting `explain_lab_prep`, a public/patient single-visit prep question) — `isExplainLabPrepPrompt`'s exact-string-match fast path (`matchExplainLabPrepScenario`, checked before any collision guard, including its own already-correct `isExplainClinicServicesPrompt` exclusion at line 116) trivially "won" for byte-identical input regardless of which fixture file's intent was actually correct for the calling context; since none of this codebase's prompt-detector functions take a `surface` parameter, true disambiguation isn't structurally possible without a larger refactor — reworded the `ai-explain-lab-prep-multilingual.fixtures.ts` entry to a non-colliding but still on-topic Armenian phrasing (first-person "do I need to fast for my lab tests" instead of third-person catalog-style "which lab tests require fasting"), removing the byte-identical collision at its source rather than patching either detector. tsc holds at known baseline (1362, no new-file diffs); targeted sweep of `ai-clinic-service`/`ai-explain-preparation-notes`/`ai-explain-lab-prep`/`ai-intent-rescue` (289 tests): 3 pre-existing unrelated failures remain (the known `reschedule_booking` vs `find_soonest_appointment` case, plus 2 newly-noticed pre-existing `ai-explain-preparation-notes` failures — a "City Tour" service-resolution test and a customer-surface fixture-count assertion — both confirmed identical with and without this change via `git stash`). Confirmed via full golden-eval-set diff (52 → 47 failures) that exactly these 4 target ids disappeared, plus 1 bonus, with zero new ids added.

