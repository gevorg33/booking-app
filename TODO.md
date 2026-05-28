# OptiSchedule — Product Roadmap

Gap analysis vs. production-ready platforms (e.g. Alteg.io).  
Goal: **bookings + reminders + payments + staff schedule + reports** for salon/service businesses.

Status: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 1 — Table stakes (highest ROI)

- [x] **comms-1** — Email reminders (booking confirmation + 24h / 1h before)
- [x] **comms-2** — SMS reminders (Twilio or similar, opt-in + templates)
- [x] **comms-2b** — WhatsApp Business API (Meta Cloud, template messages, opt-in)
- [x] **comms-3** — Notification preferences (per customer + business settings)
- [x] **pay-1** — Stripe Checkout prepay on public booking flow
- [x] **pay-2** — Deposit vs full prepay options per service
- [x] **analytics-1** — Dashboard KPIs (bookings, revenue, utilization, no-show rate)
- [x] **crm-1** — Customer appointment history (timeline on customer detail)
- [x] **crm-2** — No-show tracking (flag bookings, count on customer profile)

---

## Phase 2 — CRM & reporting depth

- [x] **crm-3** — Customer segmentation (tags, last visit, no-show rate, VIP)
- [x] **analytics-2** — Staff performance reports (bookings, revenue, hours booked)
- [x] **analytics-3** — Service popularity + peak hours / day-of-week heatmaps
- [x] **analytics-4** — Exportable reports (CSV / PDF) for date ranges
- [x] **dist-1** — Embeddable booking widget (iframe / script for external sites)

---

## Phase 3 — Growth & distribution

- [x] **int-1** — Public REST API docs + API keys for business admins
- [x] **int-2** — Outbound webhooks (`booking.created`, `cancelled`, `payment.received`, etc.)
- [x] **polish-1** — Onboarding wizard (services → schedule → booking link)
- [ ] **int-5** — Zendesk integration — connect business Zendesk account (subdomain + API token)
- [ ] **int-6** — Zendesk — embed Web Widget in dashboard + public booking (help / contact support)
- [ ] **int-7** — Zendesk — auto-create tickets from in-app support form (attach business, customer, booking context)
- [ ] **int-8** — Zendesk — sync customer profile to Zendesk user (email, phone, appointment history link) -->
- [ ] **dist-2** — Google Reserve / Reserve with Google integration
- [ ] **dist-3** — Meta / Facebook & Instagram booking integration
- [ ] **dist-4** — Messenger booking (Telegram deep links or bots; WhatsApp outbound reminders via comms-2b)


---

## Phase 4 — Monetization extras

- [x] **pay-3** — Gift cards (purchase + redeem at checkout)
- [x] **pay-4** — Memberships / subscriptions (recurring plans + visit credits)
- [x] **crm-4** — Loyalty points / rewards program (earn on visit, redeem on booking)
- [x] **reviews-5** — Customer reviews for service providers 5 star ratings with comments
- [x] **staff-5** — add feature to invite service providers - adding them will send email notification to accept invitation, probably they gonna use the mobile app in the future to get push notifications but for now let's invite them into protal as a contributor role - they can add sevice types and book appointments in portal and create scedules for themselves only.

---

## Phase 5 — Operations ERP (salon chains)

- [x] **erp-1** — Inventory — products / consumables linked to services
- [x] **erp-2** — Payroll / commissions (per-service % or flat, payout reports)
- [x] **erp-3** — Business expenses tracking + basic P&L reports
- [x] **erp-4** — Multi-location (locations, staff per location, cross-location reporting)

---

## Phase 6 — Platform maturity

- [x] **dist-5** — Branded mobile app for service providers (Ionic React in `provider-app/` — iOS/Android, no dashboard; web PWA at `/provider` in `frontend/`)
- [~] **comms-4** — Push / app reminders for providers (Web Push + Capacitor native token registration; FCM/APNs delivery TBD)
- [ ] **int-3** — Zapier / Make connector or marketplace listing
- [ ] **polish-3** — GDPR / consent (marketing opt-in, data export / delete for customers)
- [ ] **polish-4** — Expand localization (dates, currencies, more languages)
<!-- - [ ] **int-4** — Accounting export (QuickBooks / Xero) — post-MVP -->
<!-- - [ ] **polish-2** — Help center / in-app docs + support contact flow (Zendesk Help Center embed optional) -->

---

## Already shipped (baseline)

- [x] Schedule templates + direct schedules + template edit
- [x] Public booking pages + AI booking assistant
- [x] Dashboard: bookings, appointments, customers, services, employees, calendar
- [x] AI command bar (book, create services, optimize schedule, etc.)
- [x] Stripe subscription billing (platform plan, not client prepay at booking)
- [x] Multi-language UI (EN / HY / RU) + light / dark theme

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
- [ ] **ai-0.3** — Port completion pipeline to mobile — resolve, validate, clarify parity with dashboard
- [ ] **ai-0.4** — Shared session memory — `employeeName`, `date`, `serviceName`, `timeSlot`, `templateName`, `allProviders`; mobile sends `context` on every command; optional server-side session keyed by user
- [ ] **ai-0.5** — Unify task approval — one task model, one approve endpoint; deprecate duplicate `POST /ai/command/tasks` vs `PUT /agents/tasks`
- [ ] **ai-0.6** — Wire dead agents — register `ScheduleApplyAgent` in `agent.module.ts`; connect `SchedulingAgentService`
- [ ] **ai-0.7** — Complete stub executors — `propose_reassignment`, `find_rebooking_candidates`, `propose_resolutions`; add `execute_reassignment`, waitlist lookup
- [ ] **ai-0.8** — Enrich policy engine — pass real booking counts, business hours, buffer rules into plans; show violations in preview
- [ ] **ai-0.9** — WebSocket AI events — `ai.clarify`, `ai.task.progress`, `ai.task.completed`; live progress in command bar + mobile toast
- [ ] **ai-0.10** — Extract shared hooks/libs — `useAiCommand`, `useAiSuggestions`, `useProviderAiCommand`; shared AI client types

### Phase 7.1 — Dashboard advanced orchestration

#### Context-aware command layer

- [ ] **ai-d1** — Rich page context — calendar: selected range, providers, view mode; schedule: active tab, template, employee; bookings: filters, selected row
- [ ] **ai-d2** — Selection → AI actions — drag-select on calendar → chip bar: "Block", "Fill gaps", "Apply template to selection"
- [ ] **ai-d3** — One-click run from suggestions — `orchestrix:prompt` optional auto-submit; "Run" vs "Edit" on chips
- [ ] **ai-d4** — Clarify-as-form — render `missing[]` as inline fields (date picker, employee select) instead of only text follow-ups
- [ ] **ai-d5** — Command templates / macros — save frequent ops: "Monday morning setup", "End-of-week gap fill"
- [ ] **ai-d6** — Multi-step wizard mode — complex ops (`setup_week_schedule`) → guided steps with preview between stages
- [ ] **ai-d7** — Undo / rollback — after mutation, show "Undo" window using workflow execution log

#### Unified AI Ops experience

- [ ] **ai-d8** — Single task inbox — command bar shows pending agent + command tasks; link to AI Ops for detail
- [ ] **ai-d9** — Plan diff preview — before approve: calendar diff (periods added/removed, bookings moved)
- [ ] **ai-d10** — Risk badges + policy explain — why approval required: "3 providers × 7 days = high risk"
- [ ] **ai-d11** — Execution timeline — step-by-step workflow progress with retry on failed step
- [ ] **ai-d12** — Conflict resolution workspace — dedicated UI for overlaps: side-by-side options, one-click apply fix
- [ ] **ai-d13** — Cancellation recovery board — freed slots + waitlist candidates + "Rebook all" AI action

#### Proactive & autonomous dashboard

- [ ] **ai-d14** — Suggestions on every page — not just home; schedule gaps on Schedule, conflicts on Calendar
- [ ] **ai-d15** — Realtime suggestion refresh — hook `useOperationalEvents` → invalidate suggestions on booking/schedule change
- [ ] **ai-d16** — Autopilot rules — owner configures: "Auto-fill gaps <30min", "Auto-apply weekday template every Sunday"
- [ ] **ai-d17** — Morning briefing card — dashboard home: today's utilization, conflicts, cancellations, suggested actions
- [ ] **ai-d18** — Weekly ops report — AI-generated: underutilized staff, top gaps, recommended template changes
- [ ] **ai-d19** — Notification center integration — in-app alerts: "Conflict detected — tap to resolve"

#### Dashboard coverage gaps (quick wins)

- [ ] **ai-d20** — Add `AiPagePanel` to `/dashboard/appointments`
- [ ] **ai-d21** — Enable command bar on onboarding (or panel opens standalone mini-chat)
- [ ] **ai-d22** — Wire i18n for all AI strings (`ai.commandPlaceholder`, `ai.thinking`, etc.)
- [ ] **ai-d23** — Invalidate cache after `optimize_schedule`, `resolve_conflicts`, `reassign_cancelled`
- [ ] **ai-d24** — AI panel on Customers — "Find no-shows", "Re-engage inactive"
- [ ] **ai-d25** — AI panel on Reports — "Explain this week's drop in utilization"

### Phase 7.2 — Provider mobile advanced orchestration

#### Mobile command intelligence

- [ ] **ai-m1** — Completion pipeline parity — same clarify chips, session inheritance, structured `missing[]` as dashboard
- [ ] **ai-m2** — Context from screen — Today: selected date; booking detail: customer, time, service pre-filled
- [ ] **ai-m3** — Global AI FAB — floating assistant on all tabs (Today, Schedule, Profile)
- [ ] **ai-m4** — Booking-detail AI entry — "Cancel because sick", "Mark done + paid", "Reschedule to 4pm" from modal
- [ ] **ai-m5** — Voice input — Capacitor Speech Recognition → same text pipeline (hands-free in salon)
- [ ] **ai-m6** — Quick action chips — contextual: "Mark all today paid", "Who's next?", "Any gaps this afternoon?"
- [ ] **ai-m7** — Confirm UX upgrade — preview list with avatars/times before bulk cancel; swipe to confirm

#### Safe dashboard intent port (mobile)

- [ ] **ai-m8** — `check_availability` — own schedule only (provider view)
- [ ] **ai-m9** — `show_appointments` / `list_bookings` — enrich with service filters
- [ ] **ai-m10** — `reschedule_booking` — own bookings only; conflict check
- [ ] **ai-m11** — `block_schedule` — own lunch/break blocks only
- [ ] **ai-m12** — `fill_unused_slots` — own gaps only; managers see team in team view
- [ ] **ai-m13** — `summarize_utilization` — own week stats; managers see team summary

#### Mobile proactive & push

- [ ] **ai-m14** — `GET /provider/ai/suggestions` — filtered: overdue confirmations, gap fill nudge, "3 unpaid today"
- [ ] **ai-m15** — Proactive cards on Today — top of Today page: 2–3 AI suggestion cards
- [ ] **ai-m16** — Push deep links — `pushNotificationActionPerformed` → route + prefill AI prompt
- [ ] **ai-m17** — Foreground push banner — in-app toast: "New booking 14:00 — Add buffer?"
- [ ] **ai-m18** — AI push actions — notification actions: "Confirm", "Suggest reschedule", "Mark paid"
- [ ] **ai-m19** — End-of-day summary push — "4 appointments, 1 unpaid, 2 gaps tomorrow"

#### Mobile reliability & offline

- [ ] **ai-m20** — Offline command queue — queue safe mutations; replay when online
- [ ] **ai-m21** — Optimistic UI — instant feedback on "mark paid" with rollback on failure
- [ ] **ai-m22** — Cached last suggestions — show stale suggestions offline with "refresh when online"

### Phase 7.3 — Shared intelligence layer

- [ ] **ai-i1** — Business playbooks — stored recipes: "Salon weekday", "Holiday closure"; NL triggers playbook
- [ ] **ai-i2** — Entity memory — "Gevorg" → default provider; "facemassage" → default service for this business
- [ ] **ai-i3** — Conversation summaries — compress long AI threads for session handoff dashboard ↔ mobile
- [ ] **ai-i4** — Intent confidence routing — low confidence → clarify; medium → plan preview; high → auto-execute
- [ ] **ai-i5** — Multi-intent decomposition — "Block lunch Mon-Fri and fill gaps this week" → sub-plan fan-out
- [ ] **ai-i6** — Cross-provider coordination — "If Maria cancels, offer slot to waitlist customer John"
- [ ] **ai-i7** — Utilization agent (real) — implement `UTILIZATION_OPTIMIZATION` agent; recommend template changes
- [ ] **ai-i8** — Optional RAG — embed SOP docs, past successful plans, business notes for better planning
- [ ] **ai-i9** — Evaluation harness — golden NL prompts + expected plans; regression on prompt/schema changes
- [ ] **ai-i10** — Cost & latency budgets — route simple reads to rules; reserve LLM for classify + complex plans

### Phase 7.4 — Advanced orchestration scenarios

#### Scheduling orchestration

- [ ] **ai-s1** — Template cascade — "Apply weekday template to whole team next week, then fill 9–19 gaps"
- [ ] **ai-s2** — Smart block propagation — "Block lunch 12–13 for everyone, repeat 4 weeks, skip holidays"
- [ ] **ai-s3** — Schedule swap — "Swap Friday schedules between Gevorg and Maria"
- [ ] **ai-s4** — Capacity rebalance — "Move 2 facemassage slots from Gevorg to Maria on Friday"
- [ ] **ai-s5** — Holiday mode — "Close Dec 24–26 for all, extend Dec 23 hours"
- [ ] **ai-s6** — New hire onboarding schedule — "Set up Anna's first week from weekday template + assign massage services"

#### Booking orchestration

- [ ] **ai-b1** — Bulk smart cancel — "Cancel all facemassage tomorrow, notify customers, free slots for waitlist"
- [ ] **ai-b2** — Waitlist auto-fill — "Fill cancelled 14:00 slot from waitlist"
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
- [ ] **ai-e2** — Audit log for every AI mutation (who approved, which plan, diff)
- [ ] **ai-e3** — Role-based intent permissions (receptionist vs owner)
- [ ] **ai-e4** — Custom intent plugins per vertical (salon, clinic, fitness)
- [ ] **ai-e5** — A/B test suggestion copy and auto-execute thresholds
- [ ] **ai-e6** — Admin analytics: command success rate, clarify rate, approval rate
- [ ] **ai-e7** — Human-in-the-loop SLA — escalate stuck tasks to owner
- [ ] **ai-e8** — Customer-facing AI (public booking assistant) tied to same orchestration rules

### Phase 7 — Already shipped (AI baseline)

- [x] **ai-base-1** — Dashboard AI command bar (book, cancel, schedule ops, catalog)
- [x] **ai-base-2** — Command completion pipeline (classify → resolve → validate → clarify)
- [x] **ai-base-3** — Schedule orchestration intents (`apply_schedule`, `block_schedule`, `fill_unused_slots`, `create_direct_schedule`, etc.)
- [x] **ai-base-4** — Proactive suggestions on dashboard home (`GET /ai/suggestions`)
- [x] **ai-base-5** — AI page panels on Schedule, Calendar, Bookings, Employees, Services, AI Ops, Onboarding
- [x] **ai-base-6** — Workflow executors for schedule mutations + booking plans
- [x] **ai-base-7** — Provider mobile AI (cancel/update/list/summarize + bulk confirm)
- [x] **ai-base-8** — Provider cancel-note LLM suggestion

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
