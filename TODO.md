# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

**Build policy:** Ship **product features** first → **launch & consumer app** → **lifecycle & ops** → **AI expansion** → **onboarding, pricing & Stripe plans last**. Existing AI baseline stays.

---

## Sprint overview

~2-week sprints. Features **1–8** → Launch & consumer **9–10** → Lifecycle & ops **11–12** → AI **13–24** → Monetization **25–26**.

| Sprint | Theme | IDs |
|--------|--------|-----|
| **1** | Mobile push & offline | gap-2.1, gap-2.3 |
| **2** | Integrations — webhooks & Zapier | gap-4.3, gap-4.4, gap-4.5 |
| **3** | Integrations — accounting & support | gap-4.1, gap-4.2 |
| **4** | In-app polish | gap-6.4, gap-6.5 |
| **5** | Scheduling vertical depth | gap-8.2, **sub-1** |
| **6** | Growth & vertical playbooks | gap-8.1, gap-8.5 |
| **7** | Retail POS & enterprise trust | gap-8.4, gap-5.4, gap-5.5 |
| **8** | Strategy & compliance eval | gap-5.6, gap-1.6 |
| **9** | Launch — billing & provider app store | gap-7.5, gap-7.6, gap-1.5 |
| **10** | Consumer booking app | **gap-2.5** |
| **11** | Marketing alerts & subscription accounting | gap-4.6, gap-4.7 |
| **12** | Customer booking self-service & staff push | gap-2.7, gap-2.8 |
| **13** | AI reliability & regression | gap-3.2, gap-3.7, gap-3.1 |
| **14** | AI platform & limits | ai-0.1, ai-0.2, ai-0.10, gap-3.3, ai-i10 |
| **15** | AI dashboard UX core | ai-d4, ai-d22, ai-d7, ai-d3 |
| **16** | AI dashboard depth | ai-d5, ai-d6, ai-d10, ai-d11, ai-d18, ai-d19 |
| **17** | AI page coverage & onboarding | ai-d21, ai-d24, ai-d25, gap-6.3, gap-6.6, gap-8.6 |
| **18** | AI mobile commands | ai-m3, ai-m6, ai-m8, ai-m9, ai-m11, ai-m13 |
| **19** | AI mobile push & voice | ai-m5, ai-m16, ai-m17, ai-m19, gap-2.2, gap-2.4, gap-2.6 |
| **20** | AI mobile offline | ai-m20, ai-m21, ai-m22 |
| **21** | AI intelligence layer | ai-i2, ai-i3, ai-i6, ai-i8 |
| **22** | AI scheduling scenarios | ai-s2, ai-s3, ai-s4, ai-s5, ai-s6 |
| **23** | AI booking & business ops | ai-b3, ai-b4, ai-b5, ai-o1–ai-o5 |
| **24** | AI enterprise & analytics | ai-e1, ai-e3–ai-e8, gap-3.5 |
| **25** | Onboarding & pricing UX | gap-6.1, gap-7.4 |
| **26** | Stripe plans & seats | gap-7.1, gap-7.2, gap-7.3, gap-5.2, gap-6.2 |

---

## Sprint 1 — Mobile push & offline

**Goal:** Reliable push delivery and offline-safe mutations on provider mobile.

- [x] **gap-2.1** — Finish FCM/APNs push delivery for provider app (see **comms-4**)
- [x] **gap-2.3** — Offline-safe mutations on mobile — queue + replay

---

## Sprint 2 — Integrations: webhooks & Zapier, Zendesk

**Goal:** Outbound automation for ops teams without custom code.

- [x] **gap-4.3** — Commission / payout CSV export aligned with accounting workflows
- [x] **gap-4.4** — Pre-built integration docs + “Connect in 5 min” templates (webhooks, API keys)
- [x] **gap-4.5** — Zapier and Zendesk triggers: `booking.created`, `booking.cancelled`, `payment.received`, 'review.received'

---

## Sprint 3 — Integrations: accounting & support

**Goal:** Deeper back-office sync and in-app support handoff.

- [x] **gap-4.1** — Accounting export — QuickBooks / Xero (see **int-4**)
- [x] **gap-4.2** — Zendesk — widget, support form → ticket, customer sync (see **int-5**–**int-8**)

---

## Sprint 4 — In-app polish

**Goal:** Finish rough edges in inventory and self-serve help.

- [x] **gap-6.4** — Inventory → service linking UI (replace “coming soon” copy)
- [x] **gap-6.5** — In-app help center + contextual “?” on Schedule, Calendar, Employees

---

## Sprint 5 — Scheduling vertical depth

**Goal:** Multi-resource appointments and customer service subscriptions.

- [x] **gap-8.2** — Resource / room / chair scheduling (multi-resource appointments)
- [x] **sub-1** — Service subscription management — plans, customer subscriptions, booking credit consumption (see spec below)

### sub-1 — Service subscription management (Dashboard Admin)

**User story:** As a Dashboard Admin, I want to create subscription plans for customers so they can prepay for a fixed number of appointments on a service at a discounted rate. As a customer on the public booking app, I want to see which services offer plans, choose **one-time** or **subscription** when booking, and view **my subscriptions** in my profile (expiration date and appointments left).

#### Plan configuration (admin)

- [ ] **sub-1.1** — Subscription plan CRUD — name, associated service(s), duration (3 / 6 / 12 months or custom), included appointment count, start/expiration rules, pricing model, discount (fixed amount or % vs pay-per-appointment)
- [ ] **sub-1.2** — Multiple plans per service — same service, different durations/discounts (e.g. Nail Care: 6 appts @ 5%, 12 @ 10%, 24 @ 20%)
- [ ] **sub-1.3** — Pricing preview — show regular total (single price × appointments), subscription price after discount, total customer savings

#### Customer subscription lifecycle

- [ ] **sub-1.4** — DB schema — `subscription_plans`, `customer_subscriptions`, `subscription_usage` (or equivalent); migration + indexes
- [ ] **sub-1.5** — Activation & expiration — enforce period boundaries; status: active / expired / exhausted / cancelled
- [ ] **sub-1.6** — Remaining balance — track appointments left; block booking when balance is 0
- [ ] **sub-1.7** — Usage history — audit log per subscription (booking consumed, date, service, remaining after)

#### Booking & validation

- [ ] **sub-1.8** — API — plan management, assign/purchase subscription for customer, balance lookup, usage endpoints
- [ ] **sub-1.9** — Booking flow integration — eligible bookings consume subscription credits before charging standard service fee; show active subscription + remaining count in UI
- [ ] **sub-1.10** — Validation — prevent over-booking beyond remaining balance; handle cancellation/refund credit policy (define: restore credit on cancel or not)

#### Dashboard UI

- [ ] **sub-1.11** — Admin UI — list/create/edit subscription plans under Services or Monetization
- [ ] **sub-1.12** — Dashboard customer profile — staff view of customer subscriptions: plan name, service, status, **expiration date**, **appointments remaining / included**, usage history

#### Public booking app (consumer)

**User story:** As a customer booking online, I want to see when a service offers subscription plans and choose between a one-time visit or subscribing to a plan.

- [ ] **sub-1.13** — Service list/detail badge — if a service has active subscription plans, show indicator (e.g. “Plans available”, “Subscribe & save”) on service card and service detail
- [ ] **sub-1.14** — Purchase type selector — after selecting a service with plans, offer **One-time appointment** vs **Subscription** (side-by-side or segmented control); default to one-time; hide subscription option when service has no plans
- [ ] **sub-1.15** — Plan picker — when **Subscription** is selected, list available plans for that service (duration, included appointments, discount, regular vs subscription price, savings); customer selects one plan before continuing
- [ ] **sub-1.16** — Subscribe & book checkout — new subscription purchase flow: pay subscription price (Stripe), create `customer_subscription`, then book first appointment (or prompt to book now vs later per start rules)
- [ ] **sub-1.17** — Existing subscription path — if customer already has an active subscription for the service, show remaining appointments + **Use subscription** vs **Pay one-time**; pre-select subscription when balance > 0
- [ ] **sub-1.18** — Booking step copy — throughout flow show what they’re paying (one-time service price vs plan price vs $0 when using remaining credit) and appointments left after booking
- [ ] **sub-1.19** — **My subscriptions** (user profile) — logged-in customer sees all subscriptions: plan name, linked service, **expiration date**, **appointments remaining** (and total included), status (active / expired / exhausted); tap through to usage history or book next visit

*(Integrates with **gap-2.5** consumer app — Sprint 10.)*

#### Future-ready

- [ ] **sub-1.20** — Schema & API design — support future multi-service subscription bundles (don't ship bundles yet; avoid rework)

**Example (Nail Care @ $25/visit):**

| Plan | Duration | Appointments | Discount | Regular | Subscription | Savings |
|------|----------|--------------|----------|---------|--------------|---------|
| Short | 3 mo | 6 | 5% | $150 | $142.50 | $7.50 |
| Medium | 6 mo | 12 | 10% | $300 | $270 | $30 |
| Annual | 12 mo | 24 | 20% | $600 | $480 | $120 |

---

## Sprint 6 — Growth & vertical playbooks

**Goal:** Retention automation and faster vertical setup.

- [ ] **gap-8.1** — Marketing automation — re-engage inactive customers, post-visit follow-ups
- [ ] **gap-8.5** — Vertical playbooks — pre-built services + schedule templates for “salon” vs “clinic”

---

## Sprint 7 — Retail POS & enterprise trust

**Goal:** Chair-side retail and enterprise sales collateral.

- [ ] **gap-8.4** — Retail POS at chair — sell products during checkout (deeper than inventory module)
- [ ] **gap-5.4** — Data processing agreement (DPA) + privacy policy templates for EU customers
- [ ] **gap-5.5** — SOC 2 / security questionnaire one-pager (encryption, backups, access control)

---

## Sprint 8 — Strategy & compliance eval

**Goal:** Decide medical vertical and marketplace positioning before building either.

- [ ] **gap-5.6** — Clinic/health vertical — evaluate HIPAA BAA requirements before medical positioning
- [ ] **gap-1.6** — Optional client discovery / marketplace (or partner directory) — evaluate vs software-only positioning

---

## Sprint 9 — Launch: billing & provider app store

**Goal:** Public launch readiness — billing options, upgrade flows, and store listings.

- [ ] **gap-7.5** — In-app upgrade prompts when hitting limits (seats, AI, monetization flags)
- [ ] **gap-7.6** — Annual billing option (~20% discount)
- [ ] **gap-1.5** — App Store / Play Store listings for provider app with screenshots + reviews flow

---

## Sprint 10 — Consumer booking app

**Goal:** Native/PWA consumer app + web → App Store → tenant deep link so customers land on the correct salon after install.

**Target flow:**

1. Customer on web booking for Glow Nails (`/book/glow-nails`)
2. Taps **Download OptiSchedule app**
3. App Store / Play Store → install
4. Opens app → lands on **Glow Nails** (slug preserved)
5. Signs in → appears as **Customer** under Glow Nails in dashboard
6. App primary/secondary colors and brand logos can be changed in dashboard from admin/business owner

- [ ] **gap-2.5** — Branded consumer booking app (native Capacitor + PWA parity)

#### Native app foundation

- [ ] **gap-2.5.1** — Consumer app shell (Capacitor) — book, account, subscriptions; separate from `provider-app/`
- [ ] **gap-2.5.2** — Active tenant context — app stores `slug` / `businessId`; all auth + API calls scoped to current salon
- [ ] **gap-2.5.3** — Tenant entry — deep link, salon code, or “recent salons” if no link; sign-in always after tenant is set

#### Web → App Store → tenant (install attribution)

- [ ] **gap-2.5.4** — Public booking banner — “Download app” + “Open in app” on `/book/{slug}` (web, current stack)
- [ ] **gap-2.5.5** — Universal Links (iOS) + App Links (Android) — `https://…/book/{slug}` opens consumer app when installed
- [ ] **gap-2.5.6** — Store CTA URLs carry tenant — smart link or query (`?slug=glow-nails` / deferred deep link) so **post-install first open** restores salon context
- [ ] **gap-2.5.7** — App first launch — read deep link / deferred slug → navigate to tenant home → then Google sign-in via `/public/{slug}/customer/auth`

#### Customer identity (unchanged backend contract)

- [ ] **gap-2.5.8** — Sign-in creates/finds `Customer` for active `businessId` only (same as web public booking today)
- [ ] **gap-2.5.9** — Per-tenant session — separate auth storage per `slug`; switching salon = switch tenant context

#### Store launch (consumer)

- [ ] **gap-2.5.10** — Consumer app App Store / Play Store listing (separate from provider app **gap-1.5**)

*(Integrates **sub-1** subscriptions — one-time vs plan picker, My subscriptions profile.)*

---

## Sprint 11 — Marketing alerts & subscription accounting

**Goal:** Notify the marketing team when customers register, and keep books in sync when subscriptions are sold.

- [ ] **gap-4.6** — New customer registered → email marketing team (see spec below)
- [ ] **gap-4.7** — Subscription purchased → create accounting record (see spec below)

### gap-4.6 — New customer → marketing email

**User story:** As a business owner, I want the marketing team notified when someone registers as a customer so we can welcome them or add them to campaigns.

- [ ] **gap-4.6.1** — Settings — `Settings → Notifications` (or Integrations): **Marketing team email(s)** (comma-separated or list); toggle **Email on new customer registration**
- [ ] **gap-4.6.2** — Trigger — on first customer create (public sign-up, booking checkout that creates customer, dashboard create); emit `customer.registered` or reuse `customer.upserted` with `isNew` flag
- [ ] **gap-4.6.3** — Email content — customer name, email, phone, source (web booking / app / dashboard), business name, link to dashboard customer profile
- [ ] **gap-4.6.4** — Delivery — use existing transactional email provider; log send failures; skip when toggle off or no recipients configured

### gap-4.7 — Subscription purchase → accounting

**User story:** When a customer buys a service subscription plan, I want an income line in accounting export / books without manual entry.

- [ ] **gap-4.7.1** — Event — emit `subscription.purchased` (or `payment.received` with `source: subscription`) when subscription checkout completes (**sub-1**)
- [ ] **gap-4.7.2** — Accounting row — date, plan name, amount paid, currency, customer name, subscription ID; type `income` / sub-type `subscription`
- [ ] **gap-4.7.3** — Integrate with **gap-4.1** export — include subscription purchases in QuickBooks / Xero / CSV export range
- [ ] **gap-4.7.4** — Optional — separate deferred-revenue handling later; MVP = recognize full plan price on purchase (document assumption)

*(Depends on **sub-1** subscription checkout; can stub event + export row before full sub-1 UI ships.)*

---

## Sprint 12 — Customer booking self-service & staff push

**Goal:** Registered customers can cancel or move appointments; assigned provider, staff, and managers get app push when bookings change.

- [ ] **gap-2.7** — Registered customer cancel & reschedule (see spec below)
- [ ] **gap-2.8** — Booking cancelled / rescheduled → notify provider, staff & manager via app (see spec below)

### gap-2.7 — Customer self-service cancel & reschedule

**User story:** As a registered customer, I want to cancel my appointment or pick a new date/time without calling the salon.

- [ ] **gap-2.7.1** — Policy settings — admin configures: allow cancel (yes/no), allow reschedule (yes/no), minimum notice (e.g. 24h before start), max reschedules per booking
- [ ] **gap-2.7.2** — API — `POST /public/{slug}/customer/bookings/:id/cancel` and `POST …/reschedule` (or PATCH with new slot); auth = public customer JWT; enforce policy + booking ownership
- [ ] **gap-2.7.3** — Reschedule UX — show available slots for same service/provider (or allow provider change per policy); validate conflicts server-side
- [ ] **gap-2.7.4** — Web public booking — “My appointments” for logged-in customer: Cancel / Reschedule actions with policy messaging
- [ ] **gap-2.7.5** — Consumer app (**gap-2.5**) — same flows on native app; confirmation screen with old vs new time
- [ ] **gap-2.7.6** — Side effects — emit `booking.cancelled` / `booking.rescheduled`; restore subscription credit per **sub-1.10** policy when applicable

### gap-2.8 — Staff push on cancel & reschedule

**User story:** When a customer cancels or moves an appointment, the assigned provider and managers should get an immediate app notification.

- [ ] **gap-2.8.1** — Extend **gap-2.1** `ProviderPushListener` — ensure `booking.cancelled` and `booking.rescheduled` fire for **customer-initiated** changes (not only dashboard)
- [ ] **gap-2.8.2** — Recipients — assigned provider (linked user), mobile-enabled managers; dedupe if same user
- [ ] **gap-2.8.3** — Push copy — “Jane cancelled Haircut at Mon 10:00” / “Jane rescheduled to Wed 14:00”; deep link to booking in provider app
- [ ] **gap-2.8.4** — Optional email/SMS to business — settings toggle separate from marketing email (**gap-4.6**)

*(Partial coverage exists via **gap-2.1** push listener; this sprint closes customer-initiated paths and consumer app parity.)*

---

## Sprint 13 — AI reliability & regression

**Goal:** Fix top failure modes; CI guardrails before expanding AI surface.

- [ ] **gap-3.2** — Fix top failure modes — reschedule time parsing (AM/PM), clearer conflict errors, partial undo gaps (e.g. create schedule)
- [ ] **gap-3.7** — Complete undo coverage for schedule mutations (snapshot period/slot IDs on create)
- [ ] **gap-3.1** — AI eval harness — golden NL prompts + expected plans; CI regression (see **ai-i9**)

---

## Sprint 14 — AI platform & limits

**Goal:** Unified gateway, capability matrix, shared client libs, plan-based AI caps.

- [ ] **ai-0.1** — Unified AI gateway — single entry routing by `surface: dashboard | provider`, role, scope (`AiGatewayService` wraps `AiCommandService` + `ProviderAiCommandService`)
- [ ] **ai-0.2** — Capability matrix — per-surface allowed intents; enforce server-side; hide unsupported intents in UI
- [ ] **ai-0.10** — Extract shared hooks/libs — `useAiCommand`, `useAiSuggestions`, `useProviderAiCommand`; shared AI client types
- [ ] **gap-3.3** — Enforce plan-based AI limits + usage meters (see `PLANS.md`, **ai-i10**)
- [ ] **ai-i10** — Cost & latency budgets — route simple reads to rules; reserve LLM for classify + complex plans

---

## Sprint 15 — AI dashboard UX core

**Goal:** Clarify-as-form, undo, one-click suggestions — less chat friction.

- [ ] **ai-d4** — Clarify-as-form — render `missing[]` as inline fields (date picker, employee select) instead of only text follow-ups
- [ ] **ai-d22** — Wire i18n for all AI strings (`ai.commandPlaceholder`, `ai.thinking`, etc.)
- [ ] **ai-d7** — Undo / rollback — after mutation, show "Undo" window using workflow execution log
- [ ] **ai-d3** — One-click run from suggestions — `orchestrix:prompt` optional auto-submit; "Run" vs "Edit" on chips

---

## Sprint 16 — AI dashboard depth

**Goal:** Macros, wizards, risk explainability, proactive reports.

- [ ] **ai-d5** — Command templates / macros — save frequent ops: "Monday morning setup", "End-of-week gap fill"
- [ ] **ai-d6** — Multi-step wizard mode — complex ops (`setup_week_schedule`) → guided steps with preview between stages
- [ ] **ai-d10** — Risk badges + policy explain — why approval required: "3 providers × 7 days = high risk"
- [ ] **ai-d11** — Execution timeline — step-by-step workflow progress with retry on failed step
- [ ] **ai-d18** — Weekly ops report — AI-generated: underutilized staff, top gaps, recommended template changes
- [ ] **ai-d19** — Notification center integration — in-app alerts: "Conflict detected — tap to resolve"

---

## Sprint 17 — AI page coverage & onboarding

**Goal:** AI on Customers, Reports, and during onboarding.

- [ ] **ai-d21** — Enable command bar on onboarding (or panel opens standalone mini-chat)
- [ ] **ai-d24** — AI panel on Customers — "Find no-shows", "Re-engage inactive"
- [ ] **ai-d25** — AI panel on Reports — "Explain this week's drop in utilization"
- [ ] **gap-6.3** — Complete AI i18n — all strings in EN / HY / RU (see **ai-d22**)
- [ ] **gap-6.6** — Enable AI assistant during onboarding with guided prompts (see **ai-d21**)
- [ ] **gap-8.6** — AI customer panels — no-show re-engagement, inactive lookup (see **ai-d24**)

---

## Sprint 18 — AI mobile commands

**Goal:** FAB, quick chips, and safe port of dashboard intents to mobile.

- [ ] **ai-m3** — Global AI FAB — floating assistant on all tabs (Today, Schedule, Profile)
- [ ] **ai-m6** — Quick action chips — contextual: "Mark all today paid", "Who's next?", "Any gaps this afternoon?"
- [ ] **ai-m8** — `check_availability` — own schedule only (provider view)
- [ ] **ai-m9** — `show_appointments` / `list_bookings` — enrich with service filters
- [ ] **ai-m11** — `block_schedule` — own lunch/break blocks only
- [ ] **ai-m13** — `summarize_utilization` — own week stats; managers see team summary

---

## Sprint 19 — AI mobile push & voice

**Goal:** Hands-free input and push → deep link → AI prefill.

- [ ] **ai-m5** — Voice input — Capacitor Speech Recognition → same text pipeline (hands-free in salon)
- [ ] **ai-m16** — Push deep links — `pushNotificationActionPerformed` → route + prefill AI prompt
- [ ] **ai-m17** — Foreground push banner — in-app toast: "New booking 14:00 — Add buffer?"
- [ ] **ai-m19** — End-of-day summary push — "4 appointments, 1 unpaid, 2 gaps tomorrow"
- [ ] **gap-2.2** — Push deep links into booking detail + AI prefill (see **ai-m16**)
- [ ] **gap-2.4** — Voice input on provider mobile (see **ai-m5**)
- [ ] **gap-2.6** — End-of-day / new-booking push summaries for providers (see **ai-m19**, **ai-m17**)

---

## Sprint 20 — AI mobile offline

**Goal:** AI commands and suggestions when connectivity drops.

- [ ] **ai-m20** — Offline command queue — queue safe mutations; replay when online
- [ ] **ai-m21** — Optimistic UI — instant feedback on "mark paid" with rollback on failure
- [ ] **ai-m22** — Cached last suggestions — show stale suggestions offline with "refresh when online"

---

## Sprint 21 — AI intelligence layer

**Goal:** Memory, handoff, coordination, optional RAG.

- [ ] **ai-i2** — Entity memory — "Gevorg" → default provider; "facemassage" → default service for this business
- [ ] **ai-i3** — Conversation summaries — compress long AI threads for session handoff dashboard ↔ mobile
- [ ] **ai-i6** — Cross-provider coordination — "If Maria cancels, offer slot to waitlist customer John"
- [ ] **ai-i8** — Optional RAG — embed SOP docs, past successful plans, business notes for better planning

---

## Sprint 22 — AI scheduling scenarios

**Goal:** Advanced NL scheduling ops beyond baseline template cascade.

- [ ] **ai-s2** — Smart block propagation — "Block lunch 12–13 for everyone, repeat 4 weeks, skip holidays"
- [ ] **ai-s3** — Schedule swap — "Swap Friday schedules between Gevorg and Maria"
- [ ] **ai-s4** — Capacity rebalance — "Move 2 facemassage slots from Gevorg to Maria on Friday"
- [ ] **ai-s5** — Holiday mode — "Close Dec 24–26 for all, extend Dec 23 hours"
- [ ] **ai-s6** — New hire onboarding schedule — "Set up Anna's first week from weekday template + assign massage services"

---

## Sprint 23 — AI booking & business ops

**Goal:** No-show sweeps, day replan, catalog/pricing/compliance NL ops.

- [ ] **ai-b3** — No-show handling — "Mark no-shows today, release slots, suggest rebooking messages"
- [ ] **ai-b4** — Payment sweep — "Mark all completed today as paid except walk-ins"
- [ ] **ai-b5** — Day replan — "Maria is sick — cancel her day and redistribute urgent bookings"
- [ ] **ai-o1** — Catalog from photo/menu — OCR + `create_services` batch with human review
- [ ] **ai-o2** — Pricing adjustment — "Raise all massage prices 10% from June 1"
- [ ] **ai-o3** — Staff-service matrix — "Assign all color services to senior stylists only"
- [ ] **ai-o4** — Compliance check — "Any appointments outside business hours this month?"
- [ ] **ai-o5** — Revenue forecast — "Project next week revenue from current schedule + historical no-show rate"

---

## Sprint 24 — AI enterprise & analytics

**Goal:** Multi-location, role permissions, admin analytics, public booking assistant.

- [ ] **ai-e1** — Multi-location businesses — AI scoped by branch
- [ ] **ai-e3** — Role-based intent permissions (receptionist vs owner)
- [ ] **ai-e4** — Custom intent plugins per vertical (salon, clinic, fitness)
- [ ] **ai-e5** — A/B test suggestion copy and auto-execute thresholds
- [ ] **ai-e6** — Admin analytics: command success rate, clarify rate, approval rate
- [ ] **ai-e7** — Human-in-the-loop SLA — escalate stuck tasks to owner
- [ ] **ai-e8** — Customer-facing AI (public booking assistant) tied to same orchestration rules
- [ ] **gap-3.5** — Command success / clarify / approval analytics dashboard (see **ai-e6**)

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

## Sprint 25 — Onboarding & pricing UX

**Goal:** Streamlined first-run setup and public pricing once product, consumer app, and AI are ready.

- [ ] **gap-6.1** — Simplified “first 30 minutes” onboarding — book link live in ≤3 steps
- [ ] **gap-7.4** — Public pricing page with seat calculator + feature comparison matrix

---

## Sprint 26 — Stripe plans & seats

**Goal:** Solo / Starter / Growth / Business tiers live in Stripe; entitlements and tier-gated UI.

- [ ] **gap-7.1** — Implement Solo / Starter / Growth / Business tiers in `plans.ts` + Stripe
- [ ] **gap-7.2** — Per-seat billing (provider + admin seats) with enforcement on employee create / invite
- [ ] **gap-7.3** — Freemium Solo tier — 1 provider, capped AI, no Stripe Connect
- [ ] **gap-5.2** — Implement `PlanLimits` entitlements in API + UI (see `backend/docs/PLANS.md`)
- [ ] **gap-6.2** — Hide advanced modules (AI Ops, monetization, integrations) until Starter+ or explicit enable

---

## Completed

### Phase 1 — Operations ERP (salon chains)

- [x] **erp-1** — Inventory — products / consumables linked to services
- [x] **erp-2** — Payroll / commissions (per-service % or flat, payout reports)
- [x] **erp-3** — Business expenses tracking + basic P&L reports
- [x] **erp-4** — Multi-location (locations, staff per location, cross-location reporting)

### Phase 3 — Platform maturity

- [x] **comms-4** — Push / app reminders for providers (Web Push + Capacitor native token registration; FCM/APNs delivery TBD)
- [x] **int-3** — Zapier / Make connector or marketplace listing
- [x] **polish-3** — GDPR / consent (marketing opt-in, data export / delete for customers)
- [x] **polish-4** — Expand localization (dates, currencies, more languages)
- [x] **int-4** — Accounting export (QuickBooks / Xero) — post-MVP

### Competitive gaps (done)

- [x] **gap-1.4** — Public marketing site: pricing page, testimonials, security/trust page + privacy/policy page

### AI baseline (done — maintain, extend last)

- [x] **ai-0.6** — Wire dead agents — register `ScheduleApplyAgent`; connect `SchedulingAgentService`
- [x] **ai-0.7** — Complete stub executors — reassignment, rebooking candidates, resolutions, waitlist lookup
- [x] **ai-0.8** — Enrich policy engine — real booking counts, business hours, buffer rules in plans
- [x] **ai-0.9** — WebSocket AI events — `ai.clarify`, `ai.task.progress`, `ai.task.completed`
- [x] **ai-d1** — Rich page context — calendar, schedule, bookings
- [x] **ai-d2** — Selection → AI actions — drag-select on calendar
- [x] **ai-d8** — Single task inbox — command bar + AI Ops link
- [x] **ai-d9** — Plan diff preview — calendar diff before approve
- [x] **ai-d12** — Conflict resolution workspace
- [x] **ai-d13** — Cancellation recovery board
- [x] **ai-d14** — Suggestions on every page
- [x] **ai-d15** — Realtime suggestion refresh
- [x] **ai-d16** — Autopilot rules
- [x] **ai-d17** — Morning briefing card
- [x] **ai-m1** — Completion pipeline parity on mobile
- [x] **ai-m2** — Context from screen on mobile
- [x] **ai-m10** — `reschedule_booking` — own bookings only
- [x] **ai-m12** — `fill_unused_slots` — own gaps only
- [x] **ai-m14** — `GET /provider/ai/suggestions`
- [x] **ai-m15** — Proactive cards on Today
- [x] **ai-m18** — AI push actions — Confirm, Suggest reschedule, Mark paid
- [x] **ai-i1** — Business playbooks — NL triggers playbook
- [x] **ai-i4** — Intent confidence routing
- [x] **ai-i5** — Multi-intent decomposition
- [x] **ai-i7** — Utilization agent — recommend template changes
- [x] **ai-s1** — Template cascade
- [x] **ai-b1** — Bulk smart cancel
- [x] **ai-b2** — Waitlist auto-fill

---

## Reference — early MVP build order (historical)

1. comms-1 — Email reminders  
2. comms-2 — SMS reminders  
3. pay-1 — Stripe prepay at booking (optional in dashboard settings)  
4. analytics-1 — Dashboard KPIs  
5. crm-1 + crm-2 — Customer history + no-shows  

<!-- - [ ] **polish-2** — Help center / in-app docs + support contact flow (Zendesk Help Center embed optional) -->
