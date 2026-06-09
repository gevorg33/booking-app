# OptiSchedule Provider (Ionic React)

Standalone **provider-only** mobile app for iOS and Android. This app does **not** include the business dashboard — only Today, Schedule, and Profile for linked employees.

## Stack

- Ionic React 8 + Vite
- Capacitor 8 (bundled `dist/` — no Next.js WebView)
- React Query + Zustand

## Setup

```bash
cd provider-app
npm install
cp .env.example .env
# Set VITE_API_URL to your backend (e.g. http://127.0.0.1:3001)
```

## Development (browser)

```bash
npm run dev
```

Open http://127.0.0.1:5173

## Native builds

```bash
npm run build
npx cap sync
npm run cap:ios      # open Xcode
npm run cap:android  # open Android Studio
```

On a physical device, set `VITE_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.10:3001`) before building.

## vs `frontend/`

| | `frontend/` | `provider-app/` |
|---|---|---|
| Purpose | Admin dashboard + web PWA at `/provider` | Native provider app only |
| Native | Deprecated Capacitor wrapper | Ionic React + bundled assets |
| Dashboard | Yes (web) | **No** |

## Provider expansion (Sprints 59–62)

Shipped slices **prov-exp-1** through **prov-exp-10** (excluding **prov-exp-8** waitlist — deferred). Each user-visible action below maps to a **provider AI intent** on `PROVIDER_INTENT_SCHEMA` or is explicitly **dashboard-only**.

Source of truth (CI-enforced): `backend/src/modules/provider-mobile/provider-exp-ai-parity.fixtures.ts`

### CI gate

Run the full program exit gate from the backend (includes backend unit/integration, provider-mobile integration, and provider-app vitest slices):

```bash
cd backend
npm run test:provider-exp
```

Provider-app-only vitest slices:

```bash
cd provider-app
npm run test:provider-exp
```

Parity checklist gate alone:

```bash
cd backend
npm run test:provider-exp-11
```

### AI / UI parity checklist

| Task | Screen | UI action | Provider AI intent(s) or dashboard-only |
|------|--------|-----------|----------------------------------------|
| prov-exp-1.1 | Booking detail | View customer snapshot card | `summarize_client` |
| prov-exp-1.1 | Booking detail | Tap phone to call client | dashboard-only — native tel: deep link |
| prov-exp-1.2 | Booking detail | View visit history strip | `show_client_history` |
| prov-exp-1.3 | Booking detail | Add staff note | `add_client_note` |
| prov-exp-1.4 | Booking detail | Package / subscription / multi-service badges | `summarize_client`, `list_my_package_visits`, `list_my_multi_service_groups` |
| prov-exp-1.5 | Booking detail | View pre-visit intake summary | `summarize_client` |
| prov-exp-1.5 | Booking detail | Open full intake answers | dashboard-only — manager PHI review on web |
| prov-exp-2.1 | Profile / Insights | Personal stats rollup | `my_stats`, `summarize_my_revenue` |
| prov-exp-2.1 | Profile / Insights | Manager team stats toggle | `my_stats` (scope=team) |
| prov-exp-2.2 | Profile | Reviews inbox | `my_stats` |
| prov-exp-2.2 | Profile | Request review | dashboard-only — policy on dashboard |
| prov-exp-2.3 | Profile / Insights | Tip totals | `my_stats`, `summarize_my_revenue` |
| prov-exp-3.1 | Today / Booking | Check in client | `check_in_client` |
| prov-exp-3.2 | Booking detail | Running late / ready now | `mark_running_late` |
| prov-exp-3.3 | Today | Today timeline | `show_appointments`, `summarize_day`, `summarize_my_appointments` |
| prov-exp-4.1 | Today (manager) | Team floor board | `team_floor_status` |
| prov-exp-4.2 | Booking (manager) | Reassign to another provider | dashboard-only — dedicated mobile API; AI via dashboard ops |
| prov-exp-4.3 | Today (manager) | Who's next (2h queue) | `team_whos_next` |
| prov-exp-5.1 | Booking detail | Add / save retail cart | `add_retail_to_booking`, `suggest_retail_upsell` |
| prov-exp-5.2 | Booking detail | Search SKU / quick-add | `add_retail_to_booking` |
| prov-exp-6.1 | Booking detail | SMS / WhatsApp client | `send_client_message` |
| prov-exp-6.2 | Booking detail | Pick canned template | `send_client_message` |
| prov-exp-6.2 | Dashboard | Edit canned templates | dashboard-only |
| prov-exp-7.1 | Schedule | Block lunch / break | `block_my_time`, `block_schedule` |
| prov-exp-7.2 | Schedule | Submit time-off request | `request_time_off` |
| prov-exp-7.2 | Schedule | View time-off status | `list_my_time_off_requests` |
| prov-exp-7.2 | Dashboard | Approve / deny time off | dashboard-only — `approve_time_off_request` / `deny_time_off_request` |
| prov-exp-7.3 | Calendar | Fill open shift gap | `suggest_waitlist_for_gap`, `fill_unused_slots` |
| prov-exp-9.1 | Booking detail | Referral / first-visit badges | `summarize_client` |
| prov-exp-9.2 | Booking detail | Loyalty quick view | `summarize_client` |
| prov-exp-9.2 | Dashboard | Adjust loyalty points | dashboard-only |
| prov-exp-10.1 | Profile / header | Notification center | `explain_last_push` |
| prov-exp-10.1 | Notification center | Open booking from push | `open_booking_from_push`, `confirm_booking_from_push` |
| prov-exp-10.1 | Notification center | Dismiss / mark read | `dismiss_push` |
| prov-exp-10.2 | Calendar | Month grid + utilization bands | `check_availability`, `summarize_utilization` |
| prov-exp-10.3 | App (global) | Accessibility preferences | dashboard-only — local device UI |
| prov-exp-10.4 | Profile | Language switch (EN/HY/RU) | dashboard-only — client locale picker |

### Deferred (not in prov-exp-11 gate)

| Task | Notes |
|------|-------|
| prov-exp-8.1 | Waitlist panel — not shipped |
| prov-exp-8.2 | Rebooking candidates — not shipped |

### Per-slice test gates

| Slice | Backend | Provider app |
|-------|---------|--------------|
| prov-exp-1 (customer context + AI) | `npm run test:provider-exp-1` | — |
| prov-exp-2 (stats, reviews, tips + AI) | `npm run test:provider-exp-2` | — |
| prov-exp-3.1–3.3 (check-in, late, timeline) | `npm run test:provider-exp-3.1` … `3.3` | — |
| prov-exp-3 AI (retail, message, block, PTO) | `npm run test:provider-exp-3` | — |
| prov-exp-4 (team floor) | `npm run test:provider-exp-4.1` … `4.3` | — |
| prov-exp-5 (retail POS) | `npm run test:provider-exp-5.1`, `5.2` | `test:provider-exp-5.2` |
| prov-exp-6 (comms) | `npm run test:provider-exp-6.1`, `6.2` | `test:provider-exp-6.1`, `6.2` |
| prov-exp-7 (schedule self-service) | `npm run test:provider-exp-7.1` … `7.3` | `test:provider-exp-7.1` … `7.3` |
| prov-exp-9 (badges, loyalty) | `npm run test:provider-exp-9.1`, `9.2` | — |
| prov-exp-10 (push, calendar, a11y, i18n) | `npm run test:provider-exp-10.1`, `10.2` | `test:provider-exp-10.3`, `10.4` |
| prov-exp-11 (program exit) | `npm run test:provider-exp-11` | included in backend `test:provider-exp` |
