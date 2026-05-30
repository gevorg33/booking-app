# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

## Phase 1 — Operations ERP (salon chains)

- [x] **erp-1** — Inventory — products / consumables linked to services
- [x] **erp-2** — Payroll / commissions (per-service % or flat, payout reports)
- [x] **erp-3** — Business expenses tracking + basic P&L reports
- [x] **erp-4** — Multi-location (locations, staff per location, cross-location reporting)

---

## Phase 3 — Platform maturity

- [x] **comms-4** — Push / app reminders for providers (Web Push + Capacitor native token registration; FCM/APNs delivery TBD)
- [x] **int-3** — Zapier / Make connector or marketplace listing
- [x] **polish-3** — GDPR / consent (marketing opt-in, data export / delete for customers)
- [x] **polish-4** — Expand localization (dates, currencies, more languages)
- [x] **int-4** — Accounting export (QuickBooks / Xero) — post-MVP
<!-- - [ ] **polish-2** — Help center / in-app docs + support contact flow (Zendesk Help Center embed optional) -->

---

## Phase 4 — Competitive gaps (vs Fresha, Vagaro, Square, Acuity, Mindbody)

Gap analysis from competitive review. See also `backend/docs/PLANS.md`.

### 8.1 Trust & distribution

- [ ] **gap-1.4** — Public marketing site: pricing page, testimonials, security/trust page
- [ ] **gap-1.5** — App Store / Play Store listings for provider app with screenshots + reviews flow
- [ ] **gap-1.6** — Optional client discovery / marketplace (or partner directory) — evaluate vs software-only positioning

### 8.2 Mobile & notifications

- [ ] **gap-2.1** — Finish FCM/APNs push delivery for provider app (see **comms-4**)
- [ ] **gap-2.2** — Push deep links into booking detail + AI prefill (see **ai-m16**)
- [ ] **gap-2.3** — Offline-safe mutations on mobile — queue + replay (see **ai-m20**)
- [ ] **gap-2.4** — Voice input on provider mobile (see **ai-m5**)
- [ ] **gap-2.5** — Branded consumer booking app (PWA minimum; native optional) for App Store client discovery
- [ ] **gap-2.6** — End-of-day / new-booking push summaries for providers (see **ai-m19**, **ai-m17**)

### 8.3 AI reliability & trust

- [ ] **gap-3.1** — AI eval harness — golden NL prompts + expected plans; CI regression (see **ai-i9**)
- [ ] **gap-3.2** — Fix top failure modes — reschedule time parsing (AM/PM), clearer conflict errors, partial undo gaps (e.g. create schedule)
- [ ] **gap-3.3** — Enforce plan-based AI limits + usage meters (see `PLANS.md`, **ai-i10**)
- [ ] **gap-3.4** — Clarify-as-form UI instead of text-only follow-ups (see **ai-d4**)
- [ ] **gap-3.5** — Command success / clarify / approval analytics dashboard (see **ai-e6**)
- [ ] **gap-3.6** — Unified AI gateway + capability matrix enforced server-side (see **ai-0.1**, **ai-0.2**)
- [ ] **gap-3.7** — Complete undo coverage for schedule mutations (snapshot period/slot IDs on create)

### 8.4 Integrations & back-office

- [ ] **gap-4.1** — Accounting export — QuickBooks / Xero (see **int-4**)
- [ ] **gap-4.2** — Zendesk — widget, support form → ticket, customer sync (see **int-5**–**int-8**)
- [ ] **gap-4.3** — Commission / payout CSV export aligned with accounting workflows
- [ ] **gap-4.4** — Pre-built integration docs + “Connect in 5 min” templates (webhooks, API keys)
- [ ] **gap-4.5** — Zapier triggers: `booking.created`, `booking.cancelled`, `payment.received`

### 8.5 Compliance & enterprise readiness

- [ ] **gap-5.1** — GDPR — marketing consent, customer data export, customer delete (see **polish-3**)
- [ ] **gap-5.2** — Implement `PlanLimits` entitlements in API + UI (see `backend/docs/PLANS.md`)
- [ ] **gap-5.3** — Multi-location AI scoping by branch (see **ai-e1**)
- [ ] **gap-5.4** — Data processing agreement (DPA) + privacy policy templates for EU customers
- [ ] **gap-5.5** — SOC 2 / security questionnaire one-pager (encryption, backups, access control)
- [ ] **gap-5.6** — Clinic/health vertical — evaluate HIPAA BAA requirements before medical positioning

### 8.6 Product polish & UX simplicity

- [ ] **gap-6.1** — Simplified “first 30 minutes” onboarding — book link live in ≤3 steps
- [ ] **gap-6.2** — Hide advanced modules (AI Ops, monetization, integrations) until Starter+ or explicit enable
- [ ] **gap-6.3** — Complete AI i18n — all strings in EN / HY / RU (see **ai-d22**)
- [ ] **gap-6.4** — Inventory → service linking UI (replace “coming soon” copy)
- [ ] **gap-6.5** — In-app help center + contextual “?” on Schedule, Calendar, Employees
- [ ] **gap-6.6** — Enable AI assistant during onboarding with guided prompts (see **ai-d21**)

### 8.7 Pricing & packaging maturity

- [ ] **gap-7.1** — Implement Solo / Starter / Growth / Business tiers in `plans.ts` + Stripe
- [ ] **gap-7.2** — Per-seat billing (provider + admin seats) with enforcement on employee create / invite
- [ ] **gap-7.3** — Freemium Solo tier — 1 provider, capped AI, no Stripe Connect
- [ ] **gap-7.4** — Public pricing page with seat calculator + feature comparison matrix
- [ ] **gap-7.5** — In-app upgrade prompts when hitting limits (seats, AI, monetization flags)
- [ ] **gap-7.6** — Annual billing option (~20% discount)

### 8.8 Vertical depth (salon / clinic)

- [ ] **gap-8.1** — Marketing automation — re-engage inactive customers, post-visit follow-ups
- [ ] **gap-8.2** — Resource / room / chair scheduling (multi-resource appointments)
- [ ] **gap-8.3** — Service packages / series (e.g. 10-session bundle with visit tracking)
- [ ] **gap-8.4** — Retail POS at chair — sell products during checkout (deeper than inventory module)
- [ ] **gap-8.5** — Vertical playbooks — pre-built services + schedule templates for “salon” vs “clinic”
- [ ] **gap-8.6** — AI customer panels — no-show re-engagement, inactive lookup (see **ai-d24**)

### Suggested competitive-gap build order (pre-sales)

1. **gap-2.1**, **gap-2.2** — reliable mobile push  
2. **gap-3.2**, **gap-3.1** — AI reliability + regression tests  
3. **gap-6.1**, **gap-7.4** — simple onboarding + pricing page  
4. **gap-5.2**, **gap-7.1** — plan limits + tiers  
5. **gap-1.3**, **gap-1.1** — Zapier + Google booking (distribution)

---

## Suggested build order (Phase 1)

1. comms-1 — Email reminders  
2. comms-2 — SMS reminders  
3. pay-1 — Stripe prepay at booking (Is optional, option to allow in dashboard settings)  
4. analytics-1 — Dashboard KPIs  
5. crm-1 + crm-2 — Customer history + no-shows  

---

## Phase 7 — AI Orchestration (Dashboard + Mobile)

Extend Orchestrix AI across dashboard and provider mobile with a unified orchestration layer.  
Baseline shipped: command completion pipeline (classify → resolve → validate → clarify), schedule/booking/catalog intents on dashboard, narrow booking ops on mobile.

**Architecture target:** Unified AI gateway → completion pipeline → plan builder → policy → workflow executors → specialist agents. Proactive suggestions + session memory on both surfaces.

### Phase 7.0 — Platform foundation (do first)

Shared work that unlocks dashboard + mobile extensions.

- [ ] **ai-0.1** — Unified AI gateway — single entry routing by `surface: dashboard | provider`, role, scope (`AiGatewayService` wraps `AiCommandService` + `ProviderAiCommandService`)
- [ ] **ai-0.2** — Capability matrix — per-surface allowed intents; enforce server-side; hide unsupported intents in UI
- [x] **ai-0.6** — Wire dead agents — register `ScheduleApplyAgent` in `agent.module.ts`; connect `SchedulingAgentService`
- [x] **ai-0.7** — Complete stub executors — `propose_reassignment`, `find_rebooking_candidates`, `propose_resolutions`; add `execute_reassignment`, waitlist lookup
- [x] **ai-0.8** — Enrich policy engine — pass real booking counts, business hours, buffer rules into plans; show violations in preview
- [x] **ai-0.9** — WebSocket AI events — `ai.clarify`, `ai.task.progress`, `ai.task.completed`; live progress in command bar + mobile toast
- [ ] **ai-0.10** — Extract shared hooks/libs — `useAiCommand`, `useAiSuggestions`, `useProviderAiCommand`; shared AI client types

### Phase 7.1 — Dashboard advanced orchestration

#### Context-aware command layer

- [x] **ai-d1** — Rich page context — calendar: selected range, providers, view mode; schedule: active tab, template, employee; bookings: filters, selected row
- [x] **ai-d2** — Selection → AI actions — drag-select on calendar → chip bar: "Block", "Fill gaps", "Apply template to selection"
- [ ] **ai-d3** — One-click run from suggestions — `orchestrix:prompt` optional auto-submit; "Run" vs "Edit" on chips
- [ ] **ai-d4** — Clarify-as-form — render `missing[]` as inline fields (date picker, employee select) instead of only text follow-ups
- [ ] **ai-d5** — Command templates / macros — save frequent ops: "Monday morning setup", "End-of-week gap fill"
- [ ] **ai-d6** — Multi-step wizard mode — complex ops (`setup_week_schedule`) → guided steps with preview between stages
- [ ] **ai-d7** — Undo / rollback — after mutation, show "Undo" window using workflow execution log

#### Unified AI Ops experience

- [x] **ai-d8** — Single task inbox — command bar shows pending agent + command tasks; link to AI Ops for detail
- [x] **ai-d9** — Plan diff preview — before approve: calendar diff (periods added/removed, bookings moved)
- [ ] **ai-d10** — Risk badges + policy explain — why approval required: "3 providers × 7 days = high risk"
- [ ] **ai-d11** — Execution timeline — step-by-step workflow progress with retry on failed step
- [x] **ai-d12** — Conflict resolution workspace — dedicated UI for overlaps: side-by-side options, one-click apply fix
- [x] **ai-d13** — Cancellation recovery board — freed slots + waitlist candidates + "Rebook all" AI action

#### Proactive & autonomous dashboard

- [x] **ai-d14** — Suggestions on every page — not just home; schedule gaps on Schedule, conflicts on Calendar
- [x] **ai-d15** — Realtime suggestion refresh — hook `useOperationalEvents` → invalidate suggestions on booking/schedule change
- [x] **ai-d16** — Autopilot rules — owner configures: "Auto-fill gaps <30min", "Auto-apply weekday template every Sunday"
- [x] **ai-d17** — Morning briefing card — dashboard home: today's utilization, conflicts, cancellations, suggested actions
- [ ] **ai-d18** — Weekly ops report — AI-generated: underutilized staff, top gaps, recommended template changes
- [ ] **ai-d19** — Notification center integration — in-app alerts: "Conflict detected — tap to resolve"

#### Dashboard coverage gaps (quick wins)

- [ ] **ai-d21** — Enable command bar on onboarding (or panel opens standalone mini-chat)
- [ ] **ai-d22** — Wire i18n for all AI strings (`ai.commandPlaceholder`, `ai.thinking`, etc.)
- [ ] **ai-d24** — AI panel on Customers — "Find no-shows", "Re-engage inactive"
- [ ] **ai-d25** — AI panel on Reports — "Explain this week's drop in utilization"

### Phase 7.2 — Provider mobile advanced orchestration

#### Mobile command intelligence

- [x] **ai-m1** — Completion pipeline parity — same clarify chips, session inheritance, structured `missing[]` as dashboard
- [x] **ai-m2** — Context from screen — Today: selected date; booking detail: customer, time, service pre-filled
- [ ] **ai-m3** — Global AI FAB — floating assistant on all tabs (Today, Schedule, Profile)
- [ ] **ai-m5** — Voice input — Capacitor Speech Recognition → same text pipeline (hands-free in salon)
- [ ] **ai-m6** — Quick action chips — contextual: "Mark all today paid", "Who's next?", "Any gaps this afternoon?"

#### Safe dashboard intent port (mobile)

- [ ] **ai-m8** — `check_availability` — own schedule only (provider view)
- [ ] **ai-m9** — `show_appointments` / `list_bookings` — enrich with service filters
- [x] **ai-m10** — `reschedule_booking` — own bookings only; conflict check
- [ ] **ai-m11** — `block_schedule` — own lunch/break blocks only
- [x] **ai-m12** — `fill_unused_slots` — own gaps only; managers see team in team view
- [ ] **ai-m13** — `summarize_utilization` — own week stats; managers see team summary

#### Mobile proactive & push

- [x] **ai-m14** — `GET /provider/ai/suggestions` — filtered: overdue confirmations, gap fill nudge, "3 unpaid today"
- [x] **ai-m15** — Proactive cards on Today — top of Today page: 2–3 AI suggestion cards
- [ ] **ai-m16** — Push deep links — `pushNotificationActionPerformed` → route + prefill AI prompt
- [ ] **ai-m17** — Foreground push banner — in-app toast: "New booking 14:00 — Add buffer?"
- [x] **ai-m18** — AI push actions — notification actions: "Confirm", "Suggest reschedule", "Mark paid"
- [ ] **ai-m19** — End-of-day summary push — "4 appointments, 1 unpaid, 2 gaps tomorrow"

#### Mobile reliability & offline

- [ ] **ai-m20** — Offline command queue — queue safe mutations; replay when online
- [ ] **ai-m21** — Optimistic UI — instant feedback on "mark paid" with rollback on failure
- [ ] **ai-m22** — Cached last suggestions — show stale suggestions offline with "refresh when online"

### Phase 7.3 — Shared intelligence layer

- [x] **ai-i1** — Business playbooks — stored recipes: "Salon weekday", "Holiday closure"; NL triggers playbook
- [ ] **ai-i2** — Entity memory — "Gevorg" → default provider; "facemassage" → default service for this business
- [ ] **ai-i3** — Conversation summaries — compress long AI threads for session handoff dashboard ↔ mobile
- [x] **ai-i4** — Intent confidence routing — low confidence → clarify; medium → plan preview; high → auto-execute
- [x] **ai-i5** — Multi-intent decomposition — "Block lunch Mon-Fri and fill gaps this week" → sub-plan fan-out
- [ ] **ai-i6** — Cross-provider coordination — "If Maria cancels, offer slot to waitlist customer John"
- [x] **ai-i7** — Utilization agent (real) — implement `UTILIZATION_OPTIMIZATION` agent; recommend template changes
- [ ] **ai-i8** — Optional RAG — embed SOP docs, past successful plans, business notes for better planning
- [ ] **ai-i9** — Evaluation harness — golden NL prompts + expected plans; regression on prompt/schema changes
- [ ] **ai-i10** — Cost & latency budgets — route simple reads to rules; reserve LLM for classify + complex plans

### Phase 7.4 — Advanced orchestration scenarios

#### Scheduling orchestration

- [x] **ai-s1** — Template cascade — "Apply weekday template to whole team next week, then fill 9–19 gaps"
- [ ] **ai-s2** — Smart block propagation — "Block lunch 12–13 for everyone, repeat 4 weeks, skip holidays"
- [ ] **ai-s3** — Schedule swap — "Swap Friday schedules between Gevorg and Maria"
- [ ] **ai-s4** — Capacity rebalance — "Move 2 facemassage slots from Gevorg to Maria on Friday"
- [ ] **ai-s5** — Holiday mode — "Close Dec 24–26 for all, extend Dec 23 hours"
- [ ] **ai-s6** — New hire onboarding schedule — "Set up Anna's first week from weekday template + assign massage services"

#### Booking orchestration

- [x] **ai-b1** — Bulk smart cancel — "Cancel all facemassage tomorrow, notify customers, free slots for waitlist"
- [x] **ai-b2** — Waitlist auto-fill — "Fill cancelled 14:00 slot from waitlist"
- [ ] **ai-b3** — No-show handling — "Mark no-shows today, release slots, suggest rebooking messages"
- [ ] **ai-b4** — Payment sweep — "Mark all completed today as paid except walk-ins"
- [ ] **ai-b5** — Day replan — "Maria is sick — cancel her day and redistribute urgent bookings"

#### Business ops orchestration

- [ ] **ai-o1** — Catalog from photo/menu — OCR + `create_services` batch with human review
- [ ] **ai-o2** — Pricing adjustment — "Raise all massage prices 10% from June 1"
- [ ] **ai-o3** — Staff-service matrix — "Assign all color services to senior stylists only"
- [ ] **ai-o4** — Compliance check — "Any appointments outside business hours this month?"
- [ ] **ai-o5** — Revenue forecast — "Project next week revenue from current schedule + historical no-show rate"

### Phase 7.5 — Enterprise & scale

- [ ] **ai-e1** — Multi-location businesses — AI scoped by branch
- [ ] **ai-e3** — Role-based intent permissions (receptionist vs owner)
- [ ] **ai-e4** — Custom intent plugins per vertical (salon, clinic, fitness)
- [ ] **ai-e5** — A/B test suggestion copy and auto-execute thresholds
- [ ] **ai-e6** — Admin analytics: command success rate, clarify rate, approval rate
- [ ] **ai-e7** — Human-in-the-loop SLA — escalate stuck tasks to owner
- [ ] **ai-e8** — Customer-facing AI (public booking assistant) tied to same orchestration rules

### Suggested AI build order

**Sprint 1 (foundation):** ai-0.3, ai-0.4, ai-0.5, ai-m1, ai-m2, ai-d1, ai-d20, ai-d23  

**Sprint 2 (mobile parity + proactive):** ai-m14, ai-m15, ai-m4, ai-m7, ai-d14, ai-d15, ai-0.9  

**Sprint 3 (real agents):** ai-0.6, ai-0.7, ai-0.8, ai-d8, ai-d9, ai-d12, ai-d13, ai-i7  

**Sprint 4 (advanced scenarios):** ai-s1, ai-b1, ai-b2, ai-m10, ai-m12, ai-i5, ai-d2  

**Sprint 5 (autonomous ops):** ai-d16, ai-d17, ai-m18, ai-i1, ai-i4, ai-e2  

### AI success metrics

| Metric | Target |
|--------|--------|
| Command completion rate (no clarify) | >75% |
| Clarify → success on 2nd turn | >90% |
| Auto-execute rate (low-risk) | >60% |
| Approval → execute rate | >80% |
| Mobile AI adoption (DAU providers using AI) | >40% |
| Mean time to resolve conflict via AI | <2 min |
