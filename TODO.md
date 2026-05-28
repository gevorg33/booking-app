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
