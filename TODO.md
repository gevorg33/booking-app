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
| **40** | AI accuracy — classification engine | **acc-3** |
| **41** | AI accuracy — smart clarification & disambiguation | **acc-4** |
| **42** | AI accuracy — execution verification & rollback | **acc-5** |
| **43** | AI accuracy — continuous learning & escalation | **acc-6** |

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

---

## AI product commands — Sprints 1–13 feature coverage (planned)

**Goal:** Add AI command services for **every shipped product capability from Sprints 1–13** across three surfaces — **dashboard admin**, **service provider (mobile)**, and **customer (public web + consumer app)**. Target **~99.9% command coverage**: any reasonable NL request a user could make in the UI should map to a classified intent (or a clarify turn).

**Status:** Planned only — not implemented. Builds on AI baseline (Sprints 14–25). Existing intents cover single booking, schedule ops, and basic public assistant; this backlog closes gaps for **multi-service**, **packages**, **subscriptions**, **gift cards**, **cash pay**, **self-service**, **integrations**, **inventory/POS**, **marketing**, and **provider fulfillment**.

**Surfaces**

| Surface | Code | Users | Gateway today |
|---------|------|--------|-----------------|
| Dashboard admin | `dashboard` | Owner, manager, receptionist | `AiGatewayService` → `AiCommandService` |
| Service provider | `provider` | Stylists, card creators, delivery staff | `AiGatewayService` → `ProviderAiCommandService` |
| Customer | `customer` | Public booking + consumer app | `AiGatewayService` → `CustomerAiCommandService` (**ai-cmd-0.5** / **ai-e8**) |

**Command count target (planned intents)**

| Domain | Dashboard | Provider | Customer | Notes |
|--------|-------------|----------|----------|-------|
| Booking & appointments | 42 | 18 | 22 | incl. multi-service, package visit, subscription credit |
| Catalog & monetization | 38 | 4 | 14 | categories bulk, packages, plans, gift card products |
| Customer CRM & self-service | 16 | 6 | 18 | my appointments, GDPR, subscription/gift card account |
| Schedule & resources | 28 | 12 | 8 | templates, blocks, rooms/chairs (**gap-8.2**) |
| Payments & reconciliation | 14 | 8 | 10 | cash, gift card redeem, sweep, accounting export |
| Gift card fulfillment | 10 | 12 | 8 | purchase, redeem, physical queue (**gc-1**, Sprint 9) |
| Integrations & exports | 12 | 0 | 2 | webhooks, Zapier, Zendesk, CSV (**Sprints 2–3, 12**) |
| Inventory, POS, finance | 14 | 2 | 0 | retail at chair, expenses, commissions (**Sprints 4, 7**) |
| Marketing & growth | 10 | 0 | 4 | automation, registration alerts (**Sprints 6, 12**) |
| Push, offline, notifications | 6 | 10 | 4 | deep links, queue replay (**Sprints 1, 13, 20**) |
| Help & policy | 6 | 4 | 8 | cancel policy, cash rules, compatibility explain |
| **Total (unique intents)** | **~196** | **~76** | **~98** | **~270** after dedupe across surfaces |

### Sprint 1–13 → command mapping (feature themes)

| Sprint | Product shipped | AI command themes to add |
|--------|-----------------|---------------------------|
| **1** | Push delivery, offline queue | Provider: queue status, retry failed mutation; explain push notification |
| **2** | Webhooks, Zapier, commission CSV | Dashboard: configure webhook, list deliveries, export commissions |
| **3** | QuickBooks/Xero, Zendesk | Dashboard: run accounting export, open Zendesk ticket, sync customer |
| **4** | Inventory link UI, help center | Dashboard: link product to service; contextual help lookup |
| **5** | Resources, subscriptions, packages, multi-service | **Core gap** — see Booking + Catalog sections below |
| **6** | Marketing automation, vertical playbooks | Dashboard: apply salon/clinic playbook; summarize automation |
| **7** | Retail POS, DPA/SOC2 docs | Dashboard: attach retail to booking; list trust docs (read-only) |
| **8** | Strategy eval | Low priority — read-only compliance summaries |
| **9** | Gift cards (all types + physical fulfillment) | All surfaces — purchase, redeem, fulfillment queues |
| **10–12** | Billing upgrade, marketing alerts, subscription accounting | Dashboard: explain plan limits; configure marketing email on register |
| **11** | Consumer app | Customer: same intents as public web + tenant switch |
| **13** | Customer cancel/reschedule, staff push, cash pay | Customer self-service; provider mark paid; dashboard cash filter |

---

#### Phase H1 — NLU & classifier prompts

- [~] **ai-cmd-h1** — **Check+book compound** — who is free/available + book nearest/soonest/ASAP; decomposition in `ai-payments.util`, fixtures in `ai-check-and-book.fixtures.ts`, integration specs (`ai-check-and-book.integration.spec.ts`)
- [~] **ai-cmd-h1.1** — **Classifier prompt parity** — shared `CHECK_AND_BOOK_CLASSIFIER_RULES` on dashboard `INTENT_SCHEMA`, customer `buildCustomerClassifierSchema()`, public `buildPublicClassifierSchema()`
- [~] **ai-cmd-h1.2** — **Post-LLM rescue** — `bookingFirstAvailable`, `check_and_book_compound`, `enrichBookingTimeHintsFromPrompt`, `rescuePaymentsIntent` on customer path
- [ ] **ai-cmd-h1.3** — **Eval golden cases** — add check+book and flexible-booking variants to `ai-command-eval.cases.ts` for live LLM regression (**gap-3.1** / `npm run test:sprint14`)
- [ ] **ai-cmd-h1.4** — **Intent disambiguation matrix** — document + enforce in classifiers: `check_availability` vs `lookup_service_assignment` vs `check_providers_for_service` vs `create_booking` / `book_appointment` (per surface action names)
- [ ] **ai-cmd-h1.5** — **Multilingual NL** — extend `CLASSIFIER_MULTILINGUAL_RULES` + eval cases for Armenian/Russian check+book and flexible-slot phrasing

#### Phase H2 — Handler execution & compound graphs

- [ ] **ai-cmd-h2** — **Compound context propagation** — `date`, `timeOfDay`, `notBeforeTime`, `serviceName`, `allProviders` shared across all steps; audit `buildSharedBookingContextFromPrompt`, `mergeCustomerCompoundContext`, `applyPromptEntityOverrides`
- [ ] **ai-cmd-h2.1** — **Handler error copy** — NL-aware summaries when no slots (e.g. no providers free tomorrow evening → suggest morning or another day) instead of generic validation errors
- [ ] **ai-cmd-h2.2** — **Check → book handoff** — `check_providers_for_service` availability summary forwarded into `book_nearest_slot` / `book_appointment` details on dashboard + customer
- [ ] **ai-cmd-h2.3** — **Public flexible booking** — `book_appointment` + `bookingFirstAvailable` uses same slot resolver path as customer `book_nearest_slot`
- [ ] **ai-cmd-h2.4** — **LangGraph compound paths** — `booking-command-graph` / `compound-command-graph` enrich booking hints on every sub-step when `LANGGRAPH_ENABLED=true`

#### Phase H3 — Per-domain handler hardening

- [ ] **ai-cmd-h3.1** — **Booking & reschedule** — first-available, provider fallback chains, possessive provider vs customer, `reschedule_booking` nearest-free-time
- [ ] **ai-cmd-h3.2** — **Schedule ops** — `clear_schedule` vs `hide_appointments_from_calendar`; template apply + fill-gaps follow-ups; multi-provider date ranges
- [ ] **ai-cmd-h3.3** — **Package & multi-service** — cart + per-line availability + checkout compound; staff-assisted `create_package_booking` / `create_multi_service_booking`
- [ ] **ai-cmd-h3.4** — **Gift card & payments** — book + apply gift card + choose payment method compounds; physical gift card order handoff
- [ ] **ai-cmd-h3.5** — **Provider mobile** — scoped handlers, push deep-link actions parity with NL commands (`ProviderAiCommandService`)

#### Phase H4 — Tests & observability

- [ ] **ai-cmd-h4.1** — **Integration spec families** — mirror `ai-check-and-book.integration.spec.ts` for package booking, multi-service, gift-card checkout compounds
- [ ] **ai-cmd-h4.2** — **Coverage thresholds** — extend `test:ai-providers` / `test:ai-payments` / `test:ai-cmd` for rescue, decomposition, enrichment utils
- [ ] **ai-cmd-h4.3** — **Validator audit** — `command-completion.validator.ts`: `bookingFirstAvailable` skips `timeSlot` on all surfaces; `timeOfDay` / `notBeforeTime` where applicable
- [ ] **ai-cmd-h4.4** — **Failure telemetry** — log `rescueReason`, compound step count, classifier confidence via `AiEventsService` for top mis-route prompts

**Key files:** `ai-command.service.ts`, `customer-ai-command.service.ts`, `public-booking-assistant.service.ts`, `ai-payments.util.ts`, `ai-payments.logic.ts`, `ai-intent-rescue.service.ts`, `ai-intent-heuristics.ts`, `ai-check-and-book.fixtures.ts`, `command-completion.validator.ts`, `ai-command-eval.cases.ts`

**Test commands:**
```bash
cd backend && npm run test:ai-providers
cd backend && npm run test:ai-payments
cd backend && npm run test:sprint14
```

**Already shipped (do not re-plan)** — schedule orchestration (Sprint 23), booking ops sweeps (Sprint 24), enterprise analytics (Sprint 25), dashboard/mobile baseline intents in `DASHBOARD_INTENTS` / `PROVIDER_INTENTS`, public `list_providers` / `check_availability` / `book_appointment`.

---

### AI success metrics (Sprints 13–24)

| Metric | Target |
|--------|--------|
| Command completion rate (no clarify) | >75% |
| Clarify → success on 2nd turn | >90% |
| Auto-execute rate (low-risk) | >60% |
| Approval → execute rate | >80% |
| Mobile AI adoption (DAU providers using AI) | >40% |
| Mean time to resolve conflict via AI | <2 min |

**AI baseline (already shipped):** command completion pipeline, schedule/booking/catalog intents on dashboard, narrow booking ops on mobile, proactive suggestions, conflict recovery, waitlist fill, autopilot rules, morning briefing.

---

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

---

### curr-1.4 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-curr-1** — Dashboard: **`configure_business_currency`** — "Set default currency to AMD", "Switch the salon to euros", "Use rubles for new services"
- [ ] **ai-cmd-curr-2** — Dashboard: **`explain_business_currency`** (READ) — current default, Stripe support flag, count of services still on a different code
- [ ] **ai-cmd-curr-3** — Dashboard: **`bulk_update_service_currency`** — optional migration: align existing catalog `service.currency` to business default (confirm before mutate)
- [ ] **ai-cmd-curr-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for currency configuration and explain phrasing (EN/HY/RU)
- [ ] **ai-cmd-curr-5** — Customer/public: **`explain_checkout_currency`** — READ when user asks why prices show € / ֏ / ₽ on booking page
- [ ] **ai-cmd-curr-6** — Consumer app: **`explain_tenant_currency`** — READ when customer asks why the salon app shows prices in a specific currency after profile load
- [ ] **ai-cmd-curr-7** — Public booking: **`explain_package_currency`** — READ when package or gift-card totals use business default vs legacy service currency
- [ ] **ai-cmd-curr-8** — Provider app: **`explain_provider_payment_currency`** — READ when provider asks why appointment payment breakdown or POS total shows € / ֏ / ₽ (business default vs legacy service code vs retail add-on)
- [ ] **ai-cmd-curr-9** — Notifications: **`explain_notification_currency`** — READ when customer asks why confirmation/reminder/gift-card email or WhatsApp shows a specific currency symbol (business default vs legacy service code vs paid amount)
- [ ] **ai-cmd-curr-10** — Dashboard: **`explain_stripe_currency_warning`** (READ) — why Settings shows Stripe Connect warning for current business currency; which ISO codes Stripe supports for online card payments vs cash/pay-at-venue
- [ ] **ai-cmd-curr-11** — Customer/public: **`explain_stripe_checkout_currency`** (READ) — why online checkout charged in € / ֏ / $; when `stripeCurrencySupported` is false and cash/pay-at-venue is the alternative
- [ ] **ai-cmd-curr-12** — Dashboard: **`diagnose_stripe_checkout_failure`** (READ) — common Stripe Connect currency mismatch causes when checkout session creation fails for tenant currency
- [ ] **ai-cmd-curr-13** — Dashboard: **`explain_reports_currency`** (READ) — why staff/service revenue and P&L KPIs show a specific currency code; clarify no FX conversion in v1
- [ ] **ai-cmd-curr-14** — Dashboard: **`summarize_revenue_kpis`** (READ) — natural-language summary of dashboard overview + reports revenue for current period in business currency

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---

### AI commands — language enablement (planned, not implemented)

- [ ] **ai-cmd-lang-1** — Dashboard: **`configure_business_languages`** — "Enable Armenian and Russian", "Turn off Russian for our salon", "Set default language to English"
- [ ] **ai-cmd-lang-2** — Dashboard: **`explain_business_languages`** (READ) — enabled locales, default locale, count of services/categories/packages with translations in disabled locales
- [ ] **ai-cmd-lang-3** — Dashboard: **`bulk_strip_disabled_locale_translations`** — optional cleanup: remove `localizedNames` (services, categories, packages) / `publicProfileLocales` keys for locales no longer enabled (confirm before mutate)
- [ ] **ai-cmd-lang-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for language configuration and explain phrasing (EN/HY/RU)
- [ ] **ai-cmd-lang-5** — Customer/public: **`explain_booking_languages`** — READ when user asks why they only see EN/HY on the booking page
- [ ] **ai-cmd-lang-6** — Dashboard: **`configure_package_localized_names`** — set or clear localized display names for a service package in enabled locales only ("Add Armenian name for Spa Day package")
- [ ] **ai-cmd-lang-7** — Dashboard/public: **`explain_package_display_name`** (READ) — which localized name public booking shows for a package given visitor locale; primary name fallback
- [ ] **ai-cmd-lang-8** — Classifier rules + eval cases for package localized-name configuration and explain phrasing (EN/HY/RU)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---

### vert-tour-1.5 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-tour-1** — Dashboard: **`configure_tour_service`** — "Mark City Tour as a tour with max 12 people", "Set difficulty to moderate for the mountain trek"
- [ ] **ai-cmd-tour-2** — Dashboard: **`explain_tour_services`** (READ) — list tour services, group sizes, cover images, upcoming tour bookings with pax / `tourStartDate`–`tourEndDate`
- [ ] **ai-cmd-tour-3** — Dashboard: **`apply_tour_playbook`** — shortcut to apply tour vertical playbook (catalog + 08:00–18:00 schedule) for `tour_operator` tenants
- [ ] **ai-cmd-tour-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for tour configuration and explain phrasing (EN/HY/RU)
- [ ] **ai-cmd-tour-5** — Customer/public: **`explain_tour_booking`** — READ when user asks about group size, per-person pricing, or tour duration on booking page
- [ ] **ai-cmd-tour-6** — Customer/public: **`explain_tour_day_slots`** (READ) — why multi-day tours show one departure per day, `remainingSpots`, and when a date is fully booked (links **vert-tour-1.6** deferred date-only picker)
- [ ] **ai-cmd-tour-7** — Dashboard: **`explain_tour_booking_record`** (READ) — `paxCount`, `tourStartDate`, `tourEndDate`, special requirements on a booking; link provider calendar tour spans (**vert-tour-1.10** shipped)
- [ ] **ai-cmd-tour-8** — Dashboard: **`list_upcoming_tour_departures`** (READ) — summarize confirmed tour bookings by departure date, pax, and remaining capacity
- [ ] **ai-cmd-tour-9** — Customer/public: **`diagnose_tour_capacity`** (READ) — why checkout rejected pax count or date (max group, fully booked, clamped pax)
- [ ] **ai-cmd-tour-10** — Classifier rules + eval cases for day-level slots, tour booking metadata, and capacity phrasing (EN/HY/RU)
- [ ] **ai-cmd-tour-11** — Dashboard: **`explain_tour_calendar_span`** (READ) — why a tour appears across multiple days on the provider calendar, service colors, clipped weeks, stacked departures (**vert-tour-1.10**)
- [ ] **ai-cmd-tour-12** — Dashboard: **`list_tour_calendar_week`** (READ) — summarize tour departures visible in the current calendar week for a provider (dates, pax, service)
- [ ] **ai-cmd-tour-13** — Classifier rules + eval cases for tour calendar span phrasing and week-navigation intents (EN/HY/RU)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---

### vert-clinic-1.3 — Lab / test results
- [ ] **vert-clinic-1.5** — DB schema — `patient_test_results` table (**deferred**)
- [ ] **vert-clinic-1.6** — Result upload API (**deferred**)
- [ ] **vert-clinic-1.7** — Dashboard booking detail Results tab (**deferred**)
- [ ] **vert-clinic-1.8** — Customer My results in public account (**deferred**)
- [ ] **vert-clinic-1.9** — Consumer app My results tab (**deferred**)
- [ ] **vert-clinic-1.10** — Provider app results tab (**deferred**)
- [ ] **vert-clinic-1.11** — Result ready notification (**deferred**)
- [ ] **vert-clinic-1.12** — Privacy guard for results API (**deferred**)

### vert-clinic-1.4 — Clinic-only UI gating
- [~] **vert-clinic-1.13** — Results tab gating by `businessType` (**deferred** until vert-clinic-1.5–1.7); `isClinicVerticalBusinessType` util ready
- [x] **vert-clinic-1.14** — Clinic booking form — optional `referralNotes` and `symptoms` on public checkout for clinic services; stored in booking metadata

**Tests (Sprint 31):**
```bash
cd backend && npm run test:sprint31
cd frontend && npm run test:sprint31
```
- Backend unit: `clinic-service.util.spec.ts` (100% util coverage)
- Backend unit: `vertical-playbooks.constants.spec.ts` (polyclinic/clinic mapping, extended playbook)
- Backend unit: `service.clinic.spec.ts` (create/update clinic metadata, tour/clinic switch)
- Backend integration: `onboarding-vertical-playbook.spec.ts` (clinic/polyclinic preview, catalog metadata)
- Backend integration: `public-booking-clinic.integration.spec.ts` (service mapping, referral/symptoms metadata, trim/omit, non-clinic guard, disabled booking)
- Frontend unit: `clinic-service.spec.ts` (100% util coverage)
- Frontend integration: `clinic-booking.integration.spec.ts` (clinic vs standard services, badges, fasting/prep, checkout payloads)

### vert-clinic-1.5 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-clinic-1** — Dashboard: **`configure_clinic_service`** — "Mark CBC as a lab test requiring fasting", "Set lipid panel prep instructions"
- [ ] **ai-cmd-clinic-2** — Dashboard: **`explain_clinic_services`** (READ) — departments, consultation vs lab vs procedure counts, fasting requirements
- [ ] **ai-cmd-clinic-3** — Dashboard: **`apply_clinic_playbook`** — shortcut to apply clinic vertical playbook for `clinic` / `polyclinic` tenants
- [ ] **ai-cmd-clinic-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for clinic configuration and explain phrasing (EN/HY/RU)
- [ ] **ai-cmd-clinic-5** — Customer/public: **`explain_clinic_booking`** — READ when user asks about symptoms/referral fields or lab prep on booking page
- [ ] **ai-cmd-clinic-6** — Dashboard: **`upload_patient_result`** / **`explain_patient_results`** — when vert-clinic-1.5–1.7 ship (lab results)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---

### rec-1.4 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-rec-1** — Dashboard: **`configure_recommendation_product`** — "Add a shampoo product for post-checkout with image and link"
- [ ] **ai-cmd-rec-2** — Dashboard: **`link_recommended_products`** — "Recommend shampoo and conditioner after haircut service"
- [ ] **ai-cmd-rec-3** — Dashboard: **`explain_recommendation_setup`** (READ) — linked products per service/category, max count, active products
- [ ] **ai-cmd-rec-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for recommendation configuration phrasing (EN/HY/RU)
- [ ] **ai-cmd-rec-5** — Customer/public: **`explain_checkout_recommendations`** — READ when user asks about "You might also like" products on success screen (web + consumer app **rec-1.6**)
- [ ] **ai-cmd-rec-6** — Consumer app: **`explain_consumer_checkout_success`** (READ) — confirmed booking summary, view appointments / book another, and when product cards appear
- [ ] **ai-cmd-rec-7** — Classifier rules + eval cases for consumer-app checkout success and recommendation dismiss phrasing (EN)
- [ ] **ai-cmd-rec-8** — Dashboard: **`explain_recommendation_analytics`** (READ) — impression vs click counts from `product_recommendation.shown` / `.clicked` events, top products, surfaces (web vs consumer app)
- [ ] **ai-cmd-rec-9** — Dashboard: **`summarize_recommendation_performance`** (READ) — CTR by product/service, bookings with recommendations shown, period filter
- [ ] **ai-cmd-rec-10** — Classifier rules + eval cases for recommendation analytics phrasing (EN/HY/RU)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

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

### fmt-1.6 — AI commands (planned)
- [ ] **ai-cmd-fmt-1** — Dashboard: **`configure_business_date_format`** — "Use US date format", "Switch to 12-hour time", "Set ISO dates for our salon"
- [ ] **ai-cmd-fmt-2** — Dashboard: **`explain_business_date_format`** (READ) — current date/time format, example of today's date in each format
- [ ] **ai-cmd-fmt-3** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for date format configuration phrasing (EN/HY/RU)
- [ ] **ai-cmd-fmt-4** — Customer/public: **`explain_booking_date_format`** — READ when user asks why dates show as DD/MM vs MM/DD on booking page
- [ ] **ai-cmd-fmt-5** — Dashboard: **`preview_business_date_format`** (READ) — sample booking date/time in current vs alternate formats before saving settings
- [ ] **ai-cmd-fmt-6** — Dashboard: **`audit_dashboard_date_surfaces`** (READ) — list pages/components still using locale/`toLocaleString` vs business format cache (deferred fmt-1.6 sweep)
- [ ] **ai-cmd-fmt-7** — Dashboard: **`migrate_dashboard_date_display`** — guided sweep to replace remaining raw `Intl`/`toLocale*` calls with `formatDateDisplay` / `formatTimeDisplay` (deferred surfaces)
- [ ] **ai-cmd-fmt-8** — Classifier rules + eval cases for dashboard date-format preview and audit phrasing (EN/HY/RU)
- [ ] **ai-cmd-fmt-9** — Dashboard: **`explain_notification_date_format`** (READ) — how booking confirmation/reminder emails and WhatsApp messages format dates vs dashboard display
- [ ] **ai-cmd-fmt-10** — Dashboard: **`preview_notification_datetime`** (READ) — sample confirmation/reminder/gift-card message with current business date/time format
- [ ] **ai-cmd-fmt-11** — Dashboard: **`notify_patient_result_ready`** — when **vert-clinic-1.7** ships; uses `formatResultReadyNotificationWhen` in result-ready email/WhatsApp
- [ ] **ai-cmd-fmt-12** — Classifier rules + eval cases for notification date-format and result-ready phrasing (EN/HY/RU)
- [ ] **ai-cmd-fmt-13** — Dashboard: **`explain_date_input_format`** (READ) — how typed date fields parse input for current business `dateFormat` vs calendar picker
- [ ] **ai-cmd-fmt-14** — Dashboard: **`preview_date_input_parse`** (READ) — sample typed date strings → parsed ISO day for current format (DD/MM vs MM/DD disambiguation)
- [ ] **ai-cmd-fmt-15** — Provider app: **`explain_provider_date_display`** (READ) — how schedule/booking cards format dates from auth business settings
- [ ] **ai-cmd-fmt-16** — Provider app: **`configure_provider_push_date_format`** — when push notification bodies ship; format booking times in FCM payload using business `timeFormat` (deferred fmt-1.8 push)
- [ ] **ai-cmd-fmt-17** — Classifier rules + eval cases for date-input parse preview and provider date-format phrasing (EN/HY/RU)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

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

### tax-1.5 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-tax-1** — Dashboard: **`configure_business_tax`** — "Enable 20% VAT", "Switch to tax-inclusive pricing", "Set our GST rate to 5%"
- [ ] **ai-cmd-tax-2** — Dashboard: **`set_service_tax_rate`** — "Make massage services tax-exempt", "Apply 10% tax to medical consultations only"
- [ ] **ai-cmd-tax-3** — Dashboard: **`explain_business_tax`** (READ) — current tax name, rate, model, tax number; example breakdown on a sample price
- [ ] **ai-cmd-tax-4** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for tax configuration phrasing (EN/HY/RU)
- [ ] **ai-cmd-tax-5** — Customer/public: **`explain_checkout_tax`** — READ when user asks why tax was added or what "incl. VAT" means on service cards
- [ ] **ai-cmd-tax-6** — Dashboard: **`configure_stacked_tax_rules`** — "Add 5% GST and 8% PST", "Stack federal and state sales tax", "Remove the state tax rule"
- [ ] **ai-cmd-tax-7** — Dashboard: **`explain_stacked_tax`** (READ) — list each stacked rule, combined effective rate, example breakdown on a sample price (exclusive vs inclusive)
- [ ] **ai-cmd-tax-8** — Classifier rules + eval cases for stacked-tax phrasing (EN/HY/RU): "GST plus PST", "federal and provincial tax"
- [ ] **ai-cmd-tax-9** — Dashboard: **`explain_stripe_tax_charge`** (READ) — why Stripe charged X (inclusive gross vs exclusive net+tax); link to booking `metadata.pricing` tax fields
- [ ] **ai-cmd-tax-10** — Support: **`lookup_booking_tax_metadata`** (READ) — retrieve tax breakdown from booking metadata after Stripe checkout (for disputes/receipts)
- [ ] **ai-cmd-tax-11** — Provider app: **`explain_appointment_tax`** (READ) — tax lines on booking detail, inclusive vs exclusive, amount collected when marked paid
- [ ] **ai-cmd-tax-12** — Dashboard: **`quote_staff_booking_tax`** (READ) — preview tax on a service before staff creates a booking; explain stacked rules vs service override
- [ ] **ai-cmd-tax-13** — Dashboard: **`summarize_customer_tax_paid`** (READ) — total tax paid across customer appointment history from profile metadata
- [ ] **ai-cmd-tax-14** — Consumer app: **`explain_consumer_checkout_tax`** (READ) — checkout/confirmation tax breakdown, inclusive badge on service list
- [ ] **ai-cmd-tax-15** — Classifier rules + eval cases for provider/dashboard/consumer tax display phrasing (EN)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---
- [~] **compliance-1.6** — **DPA (Data Processing Agreement)** — DPA template exists (**gap-5.4** ✅ / Enterprise Trust tab); e-sign step + signed DPA storage deferred

### compliance-1.4 — AI commands (planned — link to **ai-cmd-h** / implement later)

- [ ] **ai-cmd-compliance-1** — Dashboard: **`configure_privacy_retention`** — "Keep customer data for 3 years", "Enable cookie banner on our booking page"
- [ ] **ai-cmd-compliance-2** — Dashboard: **`configure_granular_consent`** — "Require AI processing consent at checkout", "Ask for third-party integration consent"
- [ ] **ai-cmd-compliance-3** — Dashboard: **`enable_hipaa_mode`** (clinic only) — "Enable HIPAA safeguards", "Set 15-minute session timeout for HIPAA"
- [ ] **ai-cmd-compliance-4** — Dashboard: **`explain_compliance_status`** (READ) — GDPR checklist, HIPAA/BAA status, retention periods, sub-processors
- [ ] **ai-cmd-compliance-5** — Dashboard: **`admin_delete_customer_data`** — "Forget this customer" / anonymize PII from customer profile
- [ ] **ai-cmd-compliance-6** — Classifier rules + eval cases in `ai-command-eval.cases.ts` for compliance configuration phrasing (EN/HY/RU)
- [ ] **ai-cmd-compliance-7** — Customer/public: **`explain_data_rights`** — READ when user asks about export, delete, or cookie banner
- [ ] **ai-cmd-compliance-8** — Dashboard (owner): **`report_data_breach`** — "Report a data breach", "Log security incident affecting customer emails"
- [ ] **ai-cmd-compliance-9** — Dashboard (owner, READ): **`list_breach_incidents`** — "Show breach incidents", "What is our GDPR 72-hour deadline?"
- [ ] **ai-cmd-compliance-10** — Dashboard (owner, READ): **`view_phi_access_audit`** — "Who accessed patient notes?", "Show HIPAA PHI audit log for last week"
- [ ] **ai-cmd-compliance-11** — Dashboard (clinic, READ): **`explain_phi_encryption_status`** — "Is HIPAA encryption on?", "Are referral notes encrypted at rest?"
- [ ] **ai-cmd-compliance-12** — Dashboard (READ): **`explain_minimum_necessary_phi_access`** — "Who can see patient notes?", "What PHI can staff access?"
- [ ] **ai-cmd-compliance-13** — Dashboard (clinic, READ): **`explain_hipaa_session_timeout`** — "When will I be logged out?", "What is our HIPAA session timeout?"
- [ ] **ai-cmd-compliance-14** — Dashboard: **`configure_hipaa_session_timeout`** — "Set HIPAA timeout to 10 minutes", "Require 15-minute auto logout"
- [ ] **ai-cmd-compliance-15** — Classifier + eval: block/redact prompts that embed PHI field payloads in AI context when HIPAA on (extends **compliance-1.15**)
- [ ] **ai-cmd-compliance-16** — Dashboard (owner): **`accept_hipaa_baa`** — "Accept the HIPAA business associate agreement", "Sign BAA to enable HIPAA mode"
- [ ] **ai-cmd-compliance-17** — Dashboard (owner, READ): **`list_sub_processors`** — "Who are our data sub-processors?", "Show Article 28 processor list"
- [ ] **ai-cmd-compliance-18** — Dashboard (owner, READ): **`explain_gdpr_checklist`** — "Are we GDPR compliant?", "What privacy items are still missing?"
- [ ] **ai-cmd-compliance-19** — Dashboard (owner): **`send_breach_notification`** — "Email affected customers about breach BR-42", "Send draft breach notice for incident X"
- [ ] **ai-cmd-compliance-20** — Provider app (clinic): **`explain_provider_session_timeout`** (READ) — "When will the provider app log me out?" (**compliance-1.13** provider deferred)
- [ ] **ai-cmd-compliance-21** — Dashboard (owner, READ): **`open_compliance_dashboard`** — "Open compliance settings", "Take me to breach log" (**compliance-1.16** dedicated page deferred → deep-link into Settings → Compliance panels)

**Depends on:** **ai-cmd-h1** classifier parity; registry entry in `ai-command-registry.build.ts` when implemented.

---

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

## Sprint 38 — AI accuracy: telemetry & measurement

**Goal:** Capture every prompt, classification, and outcome in production so real accuracy is measurable and failures are discoverable. **Nothing else in this program works without this.**

- [ ] **acc-1** — AI accuracy telemetry & measurement foundation

### acc-1.1 — Prompt + outcome logging
- [ ] **acc-1.1** — `ai_command_trace` table — per command: `businessId`, `surface`, `userId`, `role`, raw `prompt`, normalized prompt, detected `locale`, classified `action`, `confidence`, `params` (redacted), routing tier, deterministic-vs-LLM source, `outcome` (executed / clarified / approval / failed / security_blocked), latency, model used, token cost; migration + indexes
- [ ] **acc-1.2** — Hook into `AiGatewayService` — write trace on every command across dashboard / provider / customer surfaces; PII-redact params before storage (reuse compliance redaction); respect HIPAA AI guard (**compliance-1.15**)
- [ ] **acc-1.3** — Correlation id — thread a `traceId` through classify → resolve → validate → execute so each pipeline stage's contribution is attributable

### acc-1.2 — Failure signal capture (implicit + explicit)
- [ ] **acc-1.4** — **Retry/rephrase detection** — same user, same surface, similar prompt (embedding similarity > 0.8) within 2 min after a clarify/fail → flag prior command as `suspected_miss`
- [ ] **acc-1.5** — **Abandon detection** — clarify shown but user never answered / closed assistant → flag as `clarify_abandoned`
- [ ] **acc-1.6** — **Undo/rollback as failure signal** — user hit Undo (ai-d7) within 1 min of execution → flag as `wrong_execution`
- [ ] **acc-1.7** — **Explicit thumbs up/down** — tiny 👍/👎 on each AI result (dashboard + provider + customer); 👎 opens optional "what went wrong" one-tap reasons (wrong action / wrong date / wrong person / wrong service / didn't understand)

### acc-1.3 — Accuracy dashboard (owner/admin analytics)
- [ ] **acc-1.8** — Extend **ai-e6** analytics — real metrics from `ai_command_trace`: no-clarify completion rate, clarify rate, misclassification rate (from retry/undo/👎), per-intent accuracy, per-locale accuracy, per-surface accuracy
- [ ] **acc-1.9** — **Confusion matrix** — which intent was classified vs corrected-to (from retry/undo signals); surfaces the top intent pairs that get confused
- [ ] **acc-1.10** — **Worst-prompts feed** — ranked list of failing/low-confidence prompts (anonymized) for triage; export to eval pipeline (**acc-2**)
- [ ] **acc-1.11** — **Accuracy SLO widget** — current rolling 7-day accuracy vs 99% target; trend line; alert when weekly accuracy drops > 2 points

---

## Sprint 39 — AI accuracy: eval set expansion & CI regression gate

**Goal:** Grow the golden eval set from hundreds to **thousands** of real, labeled prompts across all surfaces and locales; make accuracy a hard CI gate so no change can regress it.

- [ ] **acc-2** — Eval set expansion & regression gate

### acc-2.1 — Mine real prompts into eval cases
- [ ] **acc-2.1** — **Production prompt harvester** — weekly job pulls anonymized prompts from `ai_command_trace` (esp. `suspected_miss` / low-confidence / 👎) into a labeling queue
- [ ] **acc-2.2** — **Labeling tool** — internal admin UI: review harvested prompt → confirm/correct expected `action` + key params + expected clarify; one click adds it to the golden eval fixtures (extends `ai-command-eval.cases.ts`)
- [ ] **acc-2.3** — **Target: 2,000+ labeled cases** — balanced across booking / catalog / schedule / payments / gift cards / CRM / integrations; tagged by surface, locale, difficulty

### acc-2.2 — Coverage parity & adversarial cases
- [ ] **acc-2.4** — **Locale parity** — every EN golden case has HY + RU equivalents (translate + transliterate variants, incl. Armenian/Russian mixed-script and Latin transliteration)
- [ ] **acc-2.5** — **Typo / fuzzy corpus** — auto-generate misspelled, abbreviated, lowercase, no-punctuation variants of top prompts
- [ ] **acc-2.6** — **Ambiguity corpus** — prompts that *should* trigger clarify (missing date, ambiguous provider name, two services match) with expected clarify field, not an execution
- [ ] **acc-2.7** — **Adversarial corpus** — prompt-injection, scope-escalation, out-of-policy requests with expected `security_blocked` (extends existing preflight tests)

### acc-2.3 — CI regression gate
- [ ] **acc-2.8** — **`npm run test:ai-accuracy`** — runs full deterministic eval suite; reports accuracy %, per-intent breakdown, and diff vs last baseline
- [ ] **acc-2.9** — **Accuracy floor gate** — CI fails if deterministic accuracy drops below committed floor (start at current %, ratchet up each sprint); blocks merge on regression
- [ ] **acc-2.10** — **Nightly LLM eval** — cases marked `requiresLlm` run nightly against the real model (cost-bounded); track LLM-path accuracy separately from deterministic; alert on drift
- [ ] **acc-2.11** — **Per-intent scorecards** — eval report shows each intent's precision/recall so weak intents are obvious before they ship

---

## Sprint 40 — AI accuracy: classification engine

**Goal:** Make the core classify step dramatically more accurate via few-shot retrieval, self-verification, and layered fallback — measured against the **acc-2** eval set every step.

- [ ] **acc-3** — Classification accuracy engine

### acc-3.1 — Retrieval-augmented classification
- [ ] **acc-3.1** — **Few-shot retriever** — embed the incoming prompt, retrieve top-K most-similar labeled eval cases (from **acc-2**) as in-context examples for `classify_intent`; per-business + global corpus
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

## Reference — early MVP build order (historical)

1. comms-1 — Email reminders  
2. comms-2 — SMS reminders  
3. pay-1 — Stripe prepay at booking (optional in dashboard settings)  
4. analytics-1 — Dashboard KPIs  
5. crm-1 + crm-2 — Customer history + no-shows  

<!-- - [ ] **polish-2** — Help center / in-app docs + support contact flow (Zendesk Help Center embed optional) -->
