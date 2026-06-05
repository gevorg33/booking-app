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
- [x] **gap-8.7** — Customer **multi-service booking** — customer picks multiple individual services in one flow (**separate** from admin packages; see spec below)

### sub-1 — Service subscription management (Dashboard Admin)

**User story:** As a Dashboard Admin, I want to create subscription plans for customers so they can prepay for a fixed number of appointments on a service at a discounted rate. As a customer on the public booking app, I want to see which services offer plans, choose **one-time** or **subscription** when booking, and view **my subscriptions** in my profile (expiration date and appointments left).

#### Plan configuration (admin)

- [x] **sub-1.1** — Subscription plan CRUD — name, associated service(s), duration (3 / 6 / 12 months or custom), included appointment count, start/expiration rules, pricing model, discount (fixed amount or % vs pay-per-appointment)
- [x] **sub-1.2** — Multiple plans per service — same service, different durations/discounts (e.g. Nail Care: 6 appts @ 5%, 12 @ 10%, 24 @ 20%)
- [x] **sub-1.3** — Pricing preview — show regular total (single price × appointments), subscription price after discount, total customer savings

#### Customer subscription lifecycle

- [x] **sub-1.4** — DB schema — `subscription_plans`, `customer_subscriptions`, `subscription_usage` (or equivalent); migration + indexes
- [x] **sub-1.5** — Activation & expiration — enforce period boundaries; status: active / expired / exhausted / cancelled
- [x] **sub-1.6** — Remaining balance — track appointments left; block booking when balance is 0
- [x] **sub-1.7** — Usage history — audit log per subscription (booking consumed, date, service, remaining after)

#### Booking & validation

- [x] **sub-1.8** — API — plan management, assign/purchase subscription for customer, balance lookup, usage endpoints
- [x] **sub-1.9** — Booking flow integration — eligible bookings consume subscription credits before charging standard service fee; show active subscription + remaining count in UI
- [x] **sub-1.10** — Validation — prevent over-booking beyond remaining balance; handle cancellation/refund credit policy (define: restore credit on cancel or not)

#### Dashboard UI

- [x] **sub-1.11** — Admin UI — list/create/edit subscription plans under Services or Monetization
- [x] **sub-1.12** — Dashboard customer profile — staff view of customer subscriptions: plan name, service, status, **expiration date**, **appointments remaining / included**, usage history

#### Public booking app (consumer)

**User story:** As a customer booking online, I want to see when a service offers subscription plans and choose between a one-time visit or subscribing to a plan.

- [x] **sub-1.13** — Service list/detail badge — if a service has active subscription plans, show indicator (e.g. “Plans available”, “Subscribe & save”) on service card and service detail
- [x] **sub-1.14** — Purchase type selector — after selecting a service with plans, offer **One-time appointment** vs **Subscription** (side-by-side or segmented control); default to one-time; hide subscription option when service has no plans
- [x] **sub-1.15** — Plan picker — when **Subscription** is selected, list available plans for that service (duration, included appointments, discount, regular vs subscription price, savings); customer selects one plan before continuing
- [x] **sub-1.16** — Subscribe & book checkout — new subscription purchase flow: pay subscription price (Stripe), create `customer_subscription`, then book first appointment (or prompt to book now vs later per start rules)
- [x] **sub-1.17** — Existing subscription path — if customer already has an active subscription for the service, show remaining appointments + **Use subscription** vs **Pay one-time**; pre-select subscription when balance > 0
- [x] **sub-1.18** — Booking step copy — throughout flow show what they’re paying (one-time service price vs plan price vs $0 when using remaining credit) and appointments left after booking
- [x] **sub-1.19** — **My subscriptions** (user profile) — logged-in customer sees all subscriptions: plan name, linked service, **expiration date**, **appointments remaining** (and total included), status (active / expired / exhausted); tap through to usage history or book next visit

*(Integrates with **gap-2.5** consumer app — Sprint 11.)*

#### Future-ready

- [x] **sub-1.20** — Schema & API design — support future multi-service subscription bundles (don't ship bundles yet; avoid rework)

**Example (Nail Care @ $25/visit):**

| Plan | Duration | Appointments | Discount | Regular | Subscription | Savings |
|------|----------|--------------|----------|---------|--------------|---------|
| Short | 3 mo | 6 | 5% | $150 | $142.50 | $7.50 |
| Medium | 6 mo | 12 | 10% | $300 | $270 | $30 |
| Annual | 12 mo | 24 | 20% | $600 | $480 | $120 |

### gap-8.3 — Admin service packages (catalog)

> **Not the same as gap-8.7.** Admin packages are a **single product** on the Services tab (one card with sub-services + admin discount). **gap-8.7** is when the **customer** freely picks multiple standalone services — no package product, no admin bundle price.

**User stories:**

- **Admin:** Select multiple services, set a **total discount**, optional expiration; create, edit, deactivate, delete; package appears on public **Services** tab as **one offering** that lists included sub-services.
- **Customer:** Book that package like one service; on **Confirm booking**, schedule **each sub-service** with its own date/time/provider; pay once at the **discounted package price**.

#### Admin — package catalog (dashboard)

- [x] **gap-8.3.1** — **Package CRUD** — create / edit / **deactivate** / **delete**: name, description, image (optional), **multi-select services** (+ quantities), display order, `isActive`
- [x] **gap-8.3.2** — **Package discount** — show sum of underlying service prices vs **package price**; discount as **fixed amount** or **percent** off total; savings preview in admin
- [x] **gap-8.3.3** — **Package offer expiration** — optional `expiresAt`; hide from Services tab when expired; checkout grace policy (admin setting)
- [x] **gap-8.3.4** — **Dashboard UI** — **Services** or **Packages** tab: list/filter active · inactive · expired; duplicate; block delete when future bookings reference package

#### Public booking — Services tab (one package = one card)

- [x] **gap-8.3.5** — **Services tab display** — active packages shown **as one service card** (not separate cards per sub-service): package name, bundle price, "Includes: …", "Save X%", validity; detail view lists **sub-services** with durations and struck-through individual prices
- [x] **gap-8.3.6** — **Select package** — customer taps **one** package product; session expands into sub-service line items internally (customer does **not** assemble services à la carte)
- [x] **gap-8.3.7** — **Per sub-service scheduling (confirm page)** — each included service uses **existing single-service** slot/provider UI; customer picks **date & time per sub-service**; smart defaults (earliest slot per line)
- [x] **gap-8.3.8** — **Single checkout** — one payment at **package price**; create **linked bookings** (`packagePurchaseId`) — one booking per sub-service
- [x] **gap-8.3.9** — **Confirm guards** — block checkout until every sub-service has a slot; re-validate all lines on submit
- [x] **gap-8.3.10** — **DB schema & API** — `service_packages`, `service_package_items`, `package_purchases`; public list/detail; `POST …/book-package` *(admin catalog API done; public booking pending)*
- [x] **gap-8.3.11** — **Deactivate / delete / expired offer** — hidden from Services tab when inactive or expired; delete blocked with open bookings
- [x] **gap-8.3.12** — **Cancel / reschedule / promos** — sub-appointments independent (**gap-2.7**); promo/subscription rules per admin policy
- [x] **gap-8.3.13** — **Dashboard calendar** — linked appointments share package badge/group

#### Examples (gap-8.3)

1. Admin creates **"Spa day package"** (15% off) → **one card** on Services tab → customer books package → confirm: Massage Tue, Facial Thu, Manicure Fri → one discounted payment.
2. Package expired → card hidden from Services tab.

---

### gap-8.7 — Customer multi-service booking (ad-hoc)

> **Separate from gap-8.3.** Customer chooses **multiple individual services** from the regular service list (multi-select / cart). **No admin package**, **no package discount** — total price = sum of services. Scheduling: same-visit block and/or per-service dates (admin setting).

**User story:** As a customer, I want to select several available services myself and book them together — total duration calculated, earliest slot suggested, provider changeable including providers available on later days.

#### Settings (dashboard)

- [x] **gap-8.7.1** — Enable/disable **multi-service booking** (separate toggle from admin packages)
- [x] **gap-8.7.2** — **Max duration** + **max service count**; turnover buffer; **service compatibility** matrix
- [x] **gap-8.7.3** — Scheduling mode: **same-visit block** vs **per-service dates** (admin default; v1 may ship one mode)

#### Customer UI (public booking)

- [x] **gap-8.7.4** — **Multi-select on Services tab** — cart of **normal single services** (not package cards); live total duration + **sum of service prices**
- [x] **gap-8.7.5** — Block when over max duration/count; incompatible pair warnings

#### Same-visit block scheduling

- [x] **gap-8.7.6** — **Block availability API** — contiguous slot for total duration; provider qualified for all selected services
- [x] **gap-8.7.7** — **Default auto-pick** — earliest slot + first free qualified provider
- [x] **gap-8.7.8** — **Provider picker** + **"Show providers available on later days"**
- [x] **gap-8.7.9** — Atomic conflict validation on submit

#### Per-service dates mode (optional)

- [x] **gap-8.7.10** — Confirm page: one date/time picker per selected service (same UX as **gap-8.3.7**, **no package discount**)

#### Booking record & edge cases

- [x] **gap-8.7.11** — **DB / API** — `multi_service_booking_group` (distinct from `package_purchases`); staff booking parity
- [x] **gap-8.7.12** — No provider for all services; past closing; resources (**gap-8.2**); list change invalidates slots
- [x] **gap-8.7.13** — Cancel/reschedule: same-visit = atomic; per-service dates = independent (**gap-2.7**)

#### Examples (gap-8.7)

1. Customer checks **Haircut** + **Beard trim** (two singles, no package) → 50m block → Maria Tue 10:00 → pays sum of both prices.
2. Three services exceed 3h max → must remove one before continuing.

*(Independent of **gap-8.3** package catalog; builds on slot resolver + **gap-8.2**.)*

---

## Sprint 6 — Growth & vertical playbooks

**Goal:** Retention automation and faster vertical setup.

- [x] **gap-8.1** — Marketing automation — re-engage inactive customers, post-visit follow-ups
- [x] **gap-8.5** — Vertical playbooks — pre-built services + schedule templates for “salon” vs “clinic”

---

## Sprint 7 — Retail POS & enterprise trust

**Goal:** Chair-side retail and enterprise sales collateral.

- [x] **gap-8.4** — Retail POS at chair — sell products during checkout (deeper than inventory module)
- [x] **gap-5.4** — Data processing agreement (DPA) + privacy policy templates for EU customers
- [x] **gap-5.5** — SOC 2 / security questionnaire one-pager (encryption, backups, access control)

---

## Sprint 8 — Strategy & compliance eval

**Goal:** Decide medical vertical and marketplace positioning before building either.

- [x] **gap-5.6** — Clinic/health vertical — evaluate HIPAA BAA requirements before medical positioning
- [x] **gap-1.6** — Optional client discovery / marketplace (or partner directory) — evaluate vs software-only positioning

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

## Sprint 9 — Customer gift card purchase & delivery

**Goal:** Let customers buy gift cards for themselves or others — monetary, service-specific, or bundled — with digital or physical delivery and full redemption tracking.

- [x] **gc-1** — Customer gift card purchase — types, delivery, redemption, balance & history (core shipped; Zendesk cancel/modify & WhatsApp delivery pending)

#### Gift card types

- [x] **gc-1.1** — **Monetary gift cards** — customer chooses any amount or selects from business-defined preset amounts; balance decrements on redemption until exhausted
- [x] **gc-1.2** — **Service-specific gift cards** — purchase a gift card tied to one service (e.g. Classic Manicure); recipient redeems for one appointment on that service
- [x] **gc-1.3** — **Service bundle gift cards** — single gift card includes multiple services (e.g. 1 Haircut + 1 Beard Trim + 1 Facial); recipient redeems each included service individually until all are used

#### Purchase flow (buyer)

- [x] **gc-1.4** — Public purchase UI — “Buy gift card” entry on `/book/{slug}`; choose type (monetary / service / bundle), amount or service(s), buy for self vs gift to someone else
- [x] **gc-1.5** — Recipient details — recipient name, email, phone (optional), personal message (optional); purchaser email for receipt
- [x] **gc-1.6** — Delivery method — **Digital** (email / WhatsApp code) or **Physical** (ship printed card to address); show only methods enabled by business settings
- [x] **gc-1.7** — Stripe checkout — pay gift card price (+ shipping fee when physical); on success create gift card record and trigger fulfillment

#### Digital gift card delivery

- [x] **gc-1.8** — Unique code generation — cryptographically safe, business-scoped code after purchase (extend existing `GC-…` pattern or typed prefixes per card type)
- [x] **gc-1.9** — Email delivery — send code, balance or included services, expiration (if any), personal message, and redemption instructions to recipient (and receipt to purchaser)
- [x] **gc-1.10** — WhatsApp delivery — when recipient phone is provided, send gift card details via WhatsApp (Twilio / Business API or existing messaging integration)

#### Physical gift card delivery (mail / courier)

**User story:** As a customer, I want to order physical delivery of a gift card so the recipient receives a printed card at their address.

- [x] **gc-1.11** — Shipping address form — collect everything needed for delivery: recipient name, phone, full address (line 1, line 2, city, state/region, postal code, country), optional delivery instructions; validate required fields per country
- [x] **gc-1.12** — Delivery options — business-configured shipping methods (standard / express), estimated delivery window, shipping fee added at checkout when physical is selected
- [x] **gc-1.13** — Fulfillment workflow — order status: `pending` → **`awaiting_card_creation`** → **`ready_for_delivery`** → `out_for_delivery` → `shipped` / `delivered` (or `failed` / `cancelled`); store carrier + tracking when applicable; email/SMS to purchaser and recipient on key status changes
- [x] **gc-1.14** — Printed card + code — physical package includes unique redemption code (same code as digital path); code remains inactive or hidden until delivery confirmed (define policy: active on purchase vs active on ship)
- [x] **gc-1.15** — Dashboard fulfillment — staff view/filter physical gift card orders, print packing slip, assign card creator / delivery staff, mark shipped with tracking, mark delivered; optional export for fulfillment partner

#### Provider app — card creation & delivery handoff

**User story:** When a customer orders physical gift card delivery, the **card creator** is notified in the provider app to prepare the card; when ready, the **delivery staff** is notified to pick up and deliver.

- [x] **gc-1.32** — **Card creator push** — on physical gift card order (post-payment), send provider app push to assigned **card creator** role(s): “New gift card to prepare” + order summary (type, amount/services, recipient message, delivery method)
- [x] **gc-1.33** — **Card creator queue (provider app)** — list orders in `awaiting_card_creation`; open detail with printable template, recipient message, bundle/service breakdown; actions: start / mark **card ready**
- [x] **gc-1.34** — **Mark card ready** — card creator sets status to **`ready_for_delivery`** (`done` from creation step); timestamp + staff id recorded; purchaser optional “your gift card is being prepared” notification
- [x] **gc-1.35** — **Delivery staff push** — when status becomes `ready_for_delivery`, push to assigned **delivery** role(s): “Gift card ready for delivery” + pickup summary and full shipping address / phone / instructions
- [x] **gc-1.36** — **Delivery staff queue (provider app)** — list ready cards; actions: accept pickup → `out_for_delivery` → `delivered` (capture proof optional: photo / signature); sync with dashboard fulfillment board

*(Provider push reuses **gap-2.1** FCM/APNs — Sprint 1.)*

#### Business settings (dashboard)

- [x] **gc-1.16** — Gift card products — admin configures preset monetary amounts, which services/bundles are purchasable; **optional expiration date** per product (default validity period, e.g. 12 months) and whether purchasers may request custom expiry
- [x] **gc-1.17** — Bundle builder — define named bundles (service list + quantity per service) for sale as gift cards
- [x] **gc-1.18** — Delivery settings — enable/disable digital and physical delivery; shipping zones & fees; ship-from address; printable card template (logo, message layout); assign default **card creator** and **delivery** staff (or role pools) for provider app notifications
- [x] **gc-1.19** — **Admin expiration management** — set, extend, or clear expiration on any gift card from dashboard; optional business-wide default expiry; audit log of admin changes; enforce expiry at redemption (build on existing per-card `expiresAt`)
- [x] **gc-1.37** — **Cancel / modify policy (admin)** — dashboard setting per business: **allow cancel/modify** within configurable window after order (e.g. **1 day after purchase**) or **disallow cancel/modify entirely**; separate rules optional for digital vs physical (e.g. no cancel after card is `ready_for_delivery`); show remaining window to customer in UI

#### Redemption & validation

- [x] **gc-1.20** — Checkout redemption — apply gift card code during public booking checkout and staff booking creation (extend current single-use monetary flow)
- [x] **gc-1.21** — Type-aware redemption — monetary: apply up to remaining balance; service: consume one credit for matching service; bundle: consume one credit per included service line item
- [x] **gc-1.22** — Guardrails — reject expired codes, zero balance, wrong service for service/bundle cards, over-redemption beyond available balance or remaining credits

#### Cancel & modify (customer request → Zendesk → sales specialist)

**User story:** As a customer, I want to cancel or modify a gift card / bundle order I placed; the request goes to a sales specialist who applies the change after review.

- [x] **gc-1.23** — **Request cancel or modify** — from public account “My gift cards” / order detail: actions **Cancel order** and **Modify order**; enabled only per **gc-1.37** policy (e.g. within 24h of order, or hidden when admin disabled); also block when ineligible: fully redeemed or physical order past allowed creation stage
- [x] **gc-1.24** — **Modify request form** — customer describes desired changes: bundle/service lineup, monetary amount, recipient or delivery address, personal message, expiration preference; attach reason/notes
- [x] **gc-1.25** — **Zendesk ticket on submit** — auto-create ticket via existing Zendesk integration with gift card order id, code, type (monetary / service / bundle), purchaser & recipient, delivery method, fulfillment status, amount/credits, current expiration, and customer request payload; tag/route to **sales specialist** queue
- [x] **gc-1.26** — **Sales specialist fulfillment** — dashboard or Zendesk side panel shows linked gift card; specialist applies approved changes (update bundle services, balance, recipient, shipping, expiration, cancel + Stripe refund); ticket status synced when resolved
- [x] **gc-1.27** — **Customer notifications** — email (and WhatsApp if on file) when request is received, when specialist needs info, and when cancel/modify is completed or denied

#### Balance, history & dashboard

- [x] **gc-1.28** — DB schema — gift card type, recipient/purchaser fields, delivery method, shipping address, fulfillment status (`awaiting_card_creation`, `ready_for_delivery`, etc.), assigned card creator / delivery staff ids, service/bundle linkage, per-service credits remaining, redemption ledger, **modification/cancel request** records linked to Zendesk ticket id (migration + indexes)
- [x] **gc-1.29** — Balance & history API — remaining monetary balance or service credits; redemption history with date, booking, amount/credit consumed
- [x] **gc-1.30** — Dashboard — list purchased gift cards, status, **admin-managed expiration**, balance/credits left, delivery/fulfillment status; purchaser/recipient and shipping details; pending cancel/modify requests
- [x] **gc-1.31** — Customer profile — purchaser view of gift cards in public account; track physical order status and tracking link; **Cancel / Modify** actions and request status (pending / in review / completed)

#### Examples

1. **Monetary (digital):** Customer buys $100 card → recipient gets code via email/WhatsApp → code applies toward any eligible service until balance is $0.
2. **Monetary (physical):** Customer buys $100 card, selects physical delivery → **card creator** gets provider app push → prepares card → marks **ready for delivery** → **delivery staff** gets push → delivers to recipient address → recipient redeems code from the card.
3. **Service:** Customer buys “Classic Manicure” card → recipient redeems once for that service.
4. **Bundle:** Customer buys package (Haircut + Beard Trim + Facial) → recipient redeems each service once until all three are used.
5. **Cancel / modify:** Customer requests to change bundle services within admin window (e.g. 1 day) → Zendesk ticket → sales specialist updates order → customer notified; after window or if admin disabled cancel, actions are hidden.
6. **Expiration:** Admin sets optional 12-month default on gift card products; can extend or clear expiry on a specific card from dashboard; expired codes rejected at checkout.
7. **No cancel policy:** Admin sets “cancel/modify not allowed” → customer never sees Cancel/Modify buttons; changes only via support contact.

*(Zendesk ticket flow reuses **gap-4.2** integration — Sprint 2.)*

---

## Sprint 11 — Consumer booking app

**Goal:** Native/PWA consumer app + web → App Store → tenant deep link so customers land on the correct salon after install.

**Target flow:**

1. Customer on web booking for Glow Nails (`/book/glow-nails`)
2. Taps **Download OptiSchedule app**
3. App Store / Play Store → install
4. Opens app → lands on **Glow Nails** (slug preserved)
5. Signs in → appears as **Customer** under Glow Nails in dashboard
6. App primary/secondary colors and brand logos can be changed in dashboard from admin/business owner

- [x] **gap-2.5** — Branded consumer booking app (native Capacitor + PWA parity) — iOS-first in `consumer-app/`

#### Native app foundation

- [x] **gap-2.5.1** — Consumer app shell (Capacitor) — book, account, subscriptions; separate from `provider-app/`
- [x] **gap-2.5.2** — Active tenant context — app stores `slug` / `businessId`; all auth + API calls scoped to current salon
- [x] **gap-2.5.3** — Tenant entry — deep link, salon code, or “recent salons” if no link; sign-in always after tenant is set

#### Web → App Store → tenant (install attribution)

- [x] **gap-2.5.4** — Public booking banner — “Download app” + “Open in app” on `/book/{slug}` (web, current stack)
- [x] **gap-2.5.5** — Universal Links (iOS) + App Links (Android) — AASA, `assetlinks.json`, configure scripts
- [x] **gap-2.5.6** — Store CTA URLs carry tenant — `?slug=` on App Store URL + deferred deep link in `localStorage`
- [x] **gap-2.5.7** — App first launch — read deep link / deferred slug → navigate to tenant home → Google sign-in via `/public/{slug}/auth/google`

#### Customer identity (unchanged backend contract)

- [x] **gap-2.5.8** — Sign-in creates/finds `Customer` for active `businessId` only (same as web public booking today)
- [x] **gap-2.5.9** — Per-tenant session — separate auth storage per `slug`; switching salon = switch tenant context

#### Store launch (consumer)

- [ ] **gap-2.5.10** — Consumer app App Store / Play Store listing (separate from provider app **gap-1.5**)

*(Integrates **sub-1** subscriptions — one-time vs plan picker, My subscriptions profile.)*

---

## Sprint 12.a — Launch: billing

**Goal:** Public launch readiness — billing options, upgrade flows.

- [x] **gap-7.5** — In-app upgrade prompts when hitting limits (seats, AI, monetization flags)
- [x] **gap-7.6** — Annual billing option (~20% discount)

---

## Sprint 12.b — Marketing alerts & subscription accounting

**Goal:** Notify the marketing team when customers register, and keep books in sync when subscriptions are sold.

**Status:** Shipped. Run `npm run test:sprint12b` in `backend/` (55 tests, per-file 100% statements/lines/functions on Sprint 12.b modules).

- [x] **gap-4.6** — New customer registered → email marketing team (see spec below)
- [x] **gap-4.7** — Subscription purchased → create accounting record (see spec below)

### gap-4.6 — New customer → marketing email

**User story:** As a business owner, I want the marketing team notified when someone registers as a customer so we can welcome them or add them to campaigns.

- [x] **gap-4.6.1** — Settings — `Settings → Notifications`: **Marketing team email(s)** (comma-separated); toggle **Email on new customer registration**
- [x] **gap-4.6.2** — Trigger — `customer.registered` on first create (dashboard, web booking checkout, Google sign-in)
- [x] **gap-4.6.3** — Email content — customer name, email, phone, source, business name, dashboard profile link
- [x] **gap-4.6.4** — Delivery — Resend/email service; warn on failures; skip when toggle off or no recipients

### gap-4.7 — Subscription purchase → accounting

**User story:** When a customer buys a service subscription plan, I want an income line in accounting export / books without manual entry.

- [x] **gap-4.7.1** — Event — `subscription.purchased` + `payment.received` with `source: subscription` on checkout complete
- [x] **gap-4.7.2** — Accounting row — plan name, amount paid, currency, customer, subscription ID; `income` / `incomeSubType: subscription`
- [x] **gap-4.7.3** — **gap-4.1** export — subscription purchases in QuickBooks / Xero / CSV by purchase date
- [x] **gap-4.7.4** — MVP recognizes full plan price on purchase (no deferred revenue)


*(Depends on **sub-1** subscription checkout; can stub event + export row before full sub-1 UI ships.)*

---

## Sprint 13 — Customer booking self-service & staff push

**Goal:** Registered customers can cancel or move appointments; assigned provider, staff, and managers get app push when bookings change.

**Status (web + backend + consumer app):** Shipped except **gap-8.7** same-visit atomic customer reschedule for ad-hoc multi-service (package visit self-service shipped). Run `npm run test:sprint13` in `backend/`, `npm run test:sprint11` in `consumer-app/`.

- [x] **gap-2.7** — Registered customer cancel & reschedule (see spec below)
- [x] **feature** — After checkout, confirmation email + success step link to **Manage booking** (`/book/{slug}/manage?bookingId=&token=`). Token flow works without login; optional Google sign-in on manage page; logged-in customers use **My appointments** (`/account`). Cancel/reschedule on manage page and account (not inline on success step).
- [x] **gap-2.8** — Booking cancelled / rescheduled → notify provider, staff & manager via app (see spec below)
- [x] **pay-2** — Customer **cash payment** option at booking when admin enables it (see spec below)

### gap-2.7 — Customer self-service cancel & reschedule

**User story:** As a registered customer, I want to cancel my appointment or pick a new date/time without calling the salon.

- [x] **gap-2.7.1** — Policy settings — `Settings → Public booking`: allow cancel/reschedule, minimum notice, max reschedules, allow provider change on reschedule
- [x] **gap-2.7.2** — API — JWT: `POST /public/{slug}/me/bookings/:id/cancel|reschedule`; token (no login): `POST /public/{slug}/bookings/manage/cancel|reschedule` + `GET …/bookings/manage`; policy + ownership enforced
- [x] **gap-2.7.3** — Reschedule UX — **done (web):** single booking + **package visit** cancel/reschedule (all sub-appointments in one flow). **Deferred:** **gap-8.7** same-visit multi-service group reschedules atomically via customer API
- [x] **gap-2.7.4** — Web public booking — `/book/{slug}/account` “My appointments” + `/manage` token page; `PublicCustomerBookingActions` with policy messaging
- [x] **gap-2.7.5** — Consumer app (**gap-2.5**) — cancel/reschedule on account + manage token; confirmation with old vs new time
- [x] **gap-2.7.6** — Side effects — `booking.cancelled` / `booking.rescheduled` events; `restoreCreditForBooking` on cancel via shared `BookingService.cancel`

### gap-2.8 — Staff push on cancel & reschedule

**User story:** When a customer cancels or moves an appointment, the assigned provider and managers should get an immediate app notification.

- [x] **gap-2.8.1** — Extend **gap-2.1** `ProviderPushListener` — customer-initiated cancel/reschedule (`Cancelled by customer`, reschedule payload with old → new time)
- [x] **gap-2.8.2** — Recipients — assigned provider (linked user), mobile-enabled managers; dedupe if same user
- [x] **gap-2.8.3** — Push copy — customer-initiated cancel/reschedule messages; deep link to booking in provider app
- [x] **gap-2.8.4** — Optional email to business — `notifyBusinessOnCustomerBookingChange` toggle in **Settings → Notifications**; `sendBusinessCustomerBookingChange` on customer cancel/reschedule

*(Customer-initiated push + business email shipped; native consumer app parity remains **gap-2.7.5**.)*

### pay-2 — Cash payment at booking (public checkout)

**User story:** As a customer, I want to choose **Pay in cash** at checkout when the business accepts cash, instead of being forced through online card payment only.

**User story (admin):** As a dashboard admin, I want to enable or disable cash as an accepted payment method for public bookings so customers can pay at the venue.

#### Admin settings (dashboard)

- [x] **pay-2.1** — **Accept cash payments** toggle — `PublicBookingSelfServiceSettings` (with self-service policy)
- [x] **pay-2.2** — **Rules** — server blocks cash when prepayment due (full/deposit with amount due); settings hint explains when cash appears
- [x] **pay-2.3** — **Public API** — `acceptCashPayments` on public business/catalog config

#### Customer checkout (public booking)

- [x] **pay-2.4** — **Payment method selector** — checkout **Pay online** vs **Pay in cash at visit** when enabled and rules allow
- [x] **pay-2.5** — **Cash booking flow** — no Stripe session; `paymentStatus` pending; metadata `paymentMethod: cash`, `payAtVenue: true`; manage token issued; confirmation copy for cash due
- [x] **pay-2.6** — **Online still default** — cash hidden/blocked when prepayment required and amount due > 0; Stripe skipped when cash selected and credits cover online portion

#### Staff & reconciliation

- [x] **pay-2.7** — **Mark paid in provider app** — push action `mark_paid` sets paid + completed; cash metadata `paidVia`, `paidAt`, `paidByUserId`
- [x] **pay-2.8** — **Calendar** — “Pay at venue only” filter + badge; loyalty award on transition to `paymentStatus: paid` (incl. mark paid)

#### Edge cases

- [x] **pay-2.9** — **Mixed checkout** — promo/loyalty/gift card + cash remainder; no Stripe when cash selected and online amount due is 0
- [x] **pay-2.10** — **Subscriptions & packages** — online only (`purchasePlanId` / `bookPackage` require payment); single-service cash per prepayment rules
- [x] **pay-2.11** — **No-show / cancel** — cash bookings use same **gap-2.7** cancel policy; no card refund path

#### Example

Admin enables “Accept cash payments” → customer books Haircut ($30, no prepayment) → checkout shows **Pay in cash at visit** → booking confirmed, payment pending → stylist marks **Paid (cash)** after appointment.

*(Complements **pay-1** Stripe prepay; Stripe remains required when admin disables cash or service mandates online prepayment.)*

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

### Platform prerequisites (do first)

- [x] **ai-cmd-0** — **Command registry** — single source of truth: intent id, surface(s), tier, mutating?, orchestration vs read-only, links to API module
- [x] **ai-cmd-0.1** — **Shared entity params** — `packageId`, `packagePurchaseId`, `multiServiceGroupId`, `subscriptionPlanId`, `customerSubscriptionId`, `giftCardCode`, `giftCardOrderId`, `resourceId`, `locationId`, `paymentMethod`, `serviceIds[]`, `categoryDraft[]`
- [x] **ai-cmd-0.2** — **Extend capability matrix** — `AiSurface` adds `customer`; `DASHBOARD_INTENTS` / `PROVIDER_INTENTS` / `CUSTOMER_INTENTS` generated from registry
- [x] **ai-cmd-0.3** — **Intent decomposition schema** — compound commands for “book package + apply promo” / “cancel visit + notify waitlist”
- [x] **ai-cmd-0.4** — **Eval golden cases** — per-intent NL fixtures in `ai-command-eval.cases.ts` (extend **gap-3.1**)
- [x] **ai-cmd-0.5** — **Customer gateway** — route public/consumer assistant through `AiGatewayService` with `surface: customer` (**ai-e8**)

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

### 1. Booking & appointments

**Dashboard admin (42 intents)**

| Intent | Example NL | Maps to |
|--------|------------|---------|
| `create_booking` | *(shipped)* | Single service booking |
| `create_booking_subscription_credit` | “Book Maria for nail care using her subscription credit” | **sub-1** credit consumption |
| `create_booking_cash` | “Book walk-in haircut tomorrow 3pm, pay at venue” | **pay-2** |
| `create_package_booking` | “Book spa day package for James — massage Tue, facial Thu” | **gap-8.3** staff-assisted |
| `create_multi_service_booking` | “Book haircut + beard trim same visit Tuesday 10am” | **gap-8.7** staff-assisted |
| `cancel_bookings` | *(shipped)* | Single / bulk cancel |
| `cancel_package_visit` | “Cancel all appointments in Sofia’s spa package visit” | **gap-8.3.12** |
| `cancel_multi_service_group` | “Cancel John’s multi-service block booking” | **gap-8.7.13** same-visit atomic |
| `reschedule_booking` | *(shipped)* | Single reschedule |
| `reschedule_package_visit` | “Move Sofia’s package visit to next week same times” | **gap-2.7** package visit |
| `reschedule_multi_service_group` | “Move the haircut+beard block to Friday 2pm” | **gap-8.7** same-visit |
| `list_bookings` / `show_appointments` | *(shipped)* | Filters by date, provider, status |
| `list_cash_pending_bookings` | “Show all pay-at-venue appointments today” | **pay-2.8** |
| `list_package_bookings` | “Show package visits this week” | **gap-8.3.13** |
| `list_multi_service_bookings` | “List multi-service groups for Saturday” | **gap-8.7.11** |
| `update_bookings` | *(shipped)* | Notes, status, payment flags |
| `mark_paid` | “Mark booking #123 paid cash” | **pay-2.7** dashboard parity |
| `bulk_smart_cancel` | *(shipped)* | Cancel + notify + waitlist |
| `fill_slot_from_waitlist` | *(shipped)* | |
| `assign_booking_resource` | “Assign room 2 to the 2pm facial” | **gap-8.2** |
| `explain_booking_policy` | “Can this customer still cancel?” | **gap-2.7** policy read |

**Provider (18)** — own scope unless manager: `list_bookings`, `show_appointments`, `reschedule_booking`, `cancel_bookings`, `mark_paid`, `mark_no_shows`, `check_availability`, `block_schedule`, `fill_unused_slots`, `summarize_day`, `list_package_appointments_today`, `confirm_booking`, `add_booking_note`, `suggest_reschedule` *(push)*, `coordinate_waitlist_offer` *(shipped)*

**Customer (22)** — `book_appointment` *(shipped basic)*, `book_package`, `book_multi_service`, `check_package_availability`, `check_multi_service_availability`, `select_subscription_plan`, `use_subscription_credit`, `cancel_my_booking`, `reschedule_my_booking`, `cancel_package_visit_self`, `reschedule_package_visit_self`, `list_my_appointments`, `get_manage_link`, `explain_cancel_policy`, `book_with_cash`, `book_with_gift_card`, `change_provider_on_reschedule`, `add_services_to_cart`, `remove_service_from_cart`, `show_cart_total_duration`, `booking_help` *(shipped)*

- [x] **ai-cmd-b1** — Dashboard: subscription-credit + cash + package + multi-service **create** intents
- [x] **ai-cmd-b2** — Dashboard: package visit + multi-service group **cancel/reschedule** (+ list/mark_paid/policy/resource read/mutate)
- [x] **ai-cmd-b3** — Customer: full self-service + cart + package/multi-service booking flows
- [x] **ai-cmd-b4** — Provider: scoped package/multi-service views + `mark_paid`

---

### 2. Catalog & monetization

**Dashboard admin (38 intents)**

| Intent | Example NL | Maps to |
|--------|------------|---------|
| `create_service` / `create_services` | *(shipped)* | |
| `create_service_category` | “Add category Color with 3 placeholder services” | Service categories |
| `bulk_create_catalog` | “Create category Hair with services: Women’s cut 60m $65, Men’s cut 30m $35” | **Bulk categories + types** |
| `update_service` / `update_service_prices` | *(shipped)* | |
| `deactivate_service` | “Hide balayage from public booking” | |
| `create_package` | “Create Spa Day package: massage + facial, 15% off, expires Dec 31” | **gap-8.3** |
| `update_package` / `deactivate_package` / `duplicate_package` | Package CRUD | **gap-8.3.1–4** |
| `create_subscription_plan` | “Add 12-month nail plan: 24 visits, 20% off” | **sub-1.1–3** |
| `update_subscription_plan` / `deactivate_subscription_plan` | Plan CRUD | **sub-1** |
| `assign_subscription_to_customer` | “Give Anna the 6-month massage plan” | **sub-1** admin assign |
| `configure_gift_card_products` | “Enable $50/$100 presets and Classic Manicure service card” | **gc-1.16** |
| `create_gift_card_bundle` | “Sell bundle: haircut + beard + facial as gift card” | **gc-1.17** |
| `configure_multi_service_settings` | “Enable multi-service booking, max 3 services, 180 min” | **gap-8.7.1–3** |
| `set_service_compatibility` | “Block massage + chemical peel same visit” | **gap-8.7.2** |
| `apply_vertical_playbook` | “Apply salon playbook catalog and weekday template” | **gap-8.5** |
| `import_services_from_menu` | *(shipped Sprint 24)* | |
| `list_packages` / `list_subscription_plans` | Read catalog | |

**Provider (4)** — `list_services`, `list_packages_public`, `explain_service_duration`, `list_my_assigned_services`

**Customer (14)** — `list_services` *(shipped)*, `list_packages`, `describe_package_includes`, `list_subscription_plans_for_service`, `compare_one_time_vs_subscription`, `list_gift_card_options`, `show_service_badges`, `filter_services_by_category`, `explain_multi_service_rules`, `explain_package_savings`

- [x] **ai-cmd-c1** — Dashboard: **bulk_create_catalog** (categories + services in one command)
- [x] **ai-cmd-c2** — Dashboard: package + subscription plan CRUD intents
- [x] **ai-cmd-c3** — Dashboard: gift card product + multi-service settings intents
- [x] **ai-cmd-c4** — Customer: package/subscription/gift card discovery intents

---

### 3. Customer account & CRM

**Dashboard (16)** — `lookup_customer` / `summarize_customers` *(shipped)*, `list_customer_subscriptions`, `subscription_usage_history`, `extend_subscription`, `cancel_subscription_admin`, `list_customer_gift_cards`, `list_customer_bookings`, `merge_customers`, `export_customer_data`, `delete_customer_data`, `send_reengagement_message`, `tag_customer`, `customer_no_show_history`

**Provider (6)** — `lookup_customer_limited`, `customer_next_appointment`, `customer_notes`, `customer_allergies` *(if in metadata)*

**Customer (18)** — `my_profile`, `my_appointments`, `my_subscriptions`, `subscription_usage`, `my_gift_cards`, `gift_card_balance`, `gift_card_redemption_history`, `request_gift_card_cancel`, `request_gift_card_modify`, `track_physical_gift_card_order`, `update_profile`, `sign_out`, `switch_salon` *(consumer app)*, `privacy_export`, `privacy_delete`

- [x] **ai-cmd-u1** — Customer: **my_*** account intents (appointments, subscriptions, gift cards)
- [x] **ai-cmd-u2** — Customer: gift card cancel/modify request → Zendesk handoff
- [x] **ai-cmd-u3** — Dashboard: subscription + gift card customer 360

---

### 4. Schedule, templates & resources

**Dashboard (28)** — *(most schedule intents shipped)* + `list_scheduling_resources`, `create_resource`, `update_resource`, `deactivate_resource`, `assign_resource_hours`, `list_resource_conflicts`, `explain_resource_conflict`, `configure_multi_service_scheduling_mode`

**Provider (12)** — *(shipped schedule subset)* + `my_resource_assignments`, `block_resource_unavailable`

**Customer (8)** — `check_availability` *(shipped)*, `check_multi_service_block_availability`, `check_package_line_availability`, `earliest_slot_all_services`, `providers_available_later_days`, `explain_why_no_slots`

- [x] **ai-cmd-s1** — Dashboard: **scheduling resource** CRUD + assignment intents (**gap-8.2**)
- [x] **ai-cmd-s2** — Customer: multi-service block + package per-line availability

---

### 5. Payments, gift cards & accounting

**Dashboard (14)** — `payment_sweep` *(shipped)*, `summarize_unpaid`, `configure_cash_payments`, `validate_gift_card`, `adjust_gift_card_balance`, `extend_gift_card_expiry`, `refund_gift_card_order`, `export_accounting`, `export_commissions`, `explain_checkout_total`, `list_subscription_revenue`

**Provider (8)** — `mark_paid` *(shipped push)*, `payment_sweep` *(shipped)*, `explain_payment_status`, `collect_cash_confirm`

**Customer (10)** — `apply_gift_card_code`, `check_gift_card_balance`, `buy_gift_card`, `buy_gift_card_physical`, `choose_payment_method`, `pay_online`, `pay_cash_at_visit`, `purchase_subscription_checkout`, `explain_why_stripe_required`, `receipt_status`

- [x] **ai-cmd-p1** — Payments: cash + gift card + subscription checkout intents (all surfaces)
- [x] **ai-cmd-p2** — Dashboard: accounting + commission export triggers (**gap-4.1**, **gap-4.3**, **gap-4.7**)

---

### 6. Gift card physical fulfillment (Provider-heavy)

**Dashboard (10)** — `list_gift_card_orders`, `filter_awaiting_creation`, `assign_card_creator`, `assign_delivery_staff`, `mark_shipped`, `mark_delivered`, `cancel_gift_card_order`, `extend_cancel_window`, `print_packing_slip`

**Provider (12)** — `gift_card_creation_queue`, `start_card_preparation`, `mark_card_ready`, `delivery_queue`, `accept_delivery`, `mark_out_for_delivery`, `mark_delivered`, `capture_delivery_proof`, `notify_delay`

**Customer (8)** — `track_gift_card_shipment`, `buy_physical_gift_card`, `enter_shipping_address`, `shipping_method_quote`, `order_status_notifications`

- [x] **ai-cmd-g1** — Provider: **gc-1.32–36** fulfillment queue intents
- [x] **ai-cmd-g2** — Dashboard + customer: order tracking + policy intents

---

### 7. Integrations & back-office

**Dashboard (12)** — `list_webhooks`, `create_webhook`, `test_webhook`, `rotate_api_key`, `list_zapier_triggers`, `configure_zapier`, `run_accounting_export`, `configure_zendesk`, `create_support_ticket`, `sync_customer_to_zendesk`, `configure_marketing_registration_email`, `list_integration_health`

**Customer (2)** — `contact_support`, `open_ticket_for_order`

- [x] **ai-cmd-i1** — Dashboard: integration configuration + export intents (**Sprints 2–3, 12**)

---

### 8. Inventory, retail POS & finance

**Dashboard (14)** — `list_products`, `create_product`, `link_product_to_service`, `adjust_inventory`, `add_retail_sale_to_booking`, `remove_retail_line`, `record_expense`, `list_expenses`, `summarize_pl`, `commission_report`, `payout_export`

**Provider (2)** — `suggest_retail_upsell`, `add_retail_to_my_booking` *(if permitted)*

- [x] **ai-cmd-r1** — Dashboard: inventory + POS + expense intents (**gap-6.4**, **gap-8.4**, ERP)

---

### 9. Marketing, growth & billing

**Dashboard (10)** — `configure_marketing_automation`, `summarize_automation_performance`, `trigger_reengagement`, `list_inactive_customers`, `explain_plan_limits`, `suggest_upgrade`, `toggle_annual_billing`, `summarize_new_registrations`

**Customer (4)** — `how_to_download_app`, `switch_to_consumer_app`, `promo_code_help`, `loyalty_points_balance`

- [x] **ai-cmd-m1** — Dashboard: marketing automation + billing explain intents (**gap-8.1**, **gap-7.5**)

---

### 10. Push, offline & notifications

**Provider (10)** — `explain_last_push`, `open_booking_from_push`, `offline_queue_status`, `retry_offline_action`, `dismiss_push`, `end_of_day_summary` *(shipped)*, `new_booking_push_actions` *(shipped)*

**Dashboard (6)** — `configure_push_recipients`, `test_push`, `notification_history`, `toggle_business_email_on_customer_change`

**Customer (4)** — `enable_notifications`, `appointment_reminder_preferences`

- [x] **ai-cmd-n1** — Provider: offline queue + push explain (**Sprints 1, 20**)

---

### Implementation phases (suggested)

| Phase | Focus | Est. intents | Priority |
|-------|--------|--------------|----------|
| **A** | **ai-cmd-0** platform + customer gateway | Registry + 15 customer self-service | P0 — unlocks Sprint 13 parity |
| **B** | Booking depth | 25 intents | P0 — **gap-8.3**, **gap-8.7**, **sub-1**, **pay-2** |
| **C** | Catalog bulk | 20 intents | P0 — **bulk_create_catalog**, packages, plans |
| **D** | Gift cards | 30 intents | P1 — **gc-1** full surface |
| **E** | Integrations + finance | 26 intents | P2 — Sprints 2–3, 7, 12 |
| **F** | Marketing + misc | 20 intents | P2 — Sprints 4, 6, 10–12 |

**Test plan (when implementing)**

- [x] **ai-cmd-t1** — `test:ai-cmd` — 100% util/plan/logic coverage per phase (mirror **test:sprint23–25**)
- [x] **ai-cmd-t2** — Golden NL eval cases per new intent (**gap-3.1**)
- [x] **ai-cmd-t3** — Integration specs: dashboard + provider + customer gateway per domain
- [x] **ai-cmd-t4** — Command completion validators for clarify fields (dates, `serviceIds`, `packageId`, etc.)

### AI command handlers & NLU quality (ongoing — **ai-cmd-h**)

**Goal:** NL commands work end-to-end — classify correctly, rescue misclassifications, run handlers without false clarify forms, and keep regression coverage as phrasing drifts.

**Principle:** Deterministic decomposition + heuristics for high-volume compound patterns; LLM classifiers for single-step intent + param extraction; post-LLM rescue as safety net. Prefer fixing classifiers and shared rules over one-off regex growth.

**Surfaces in scope:** dashboard (`AiCommandService`), customer (`CustomerAiCommandService`), public web (`PublicBookingAssistantService`), provider (`ProviderAiCommandService`).

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

## Sprint 14 — AI reliability & regression

**Goal:** Fix top failure modes; CI guardrails before expanding AI surface.

- [x] **gap-3.2** — Fix top failure modes — reschedule time parsing (AM/PM), clearer conflict errors, partial undo gaps (e.g. create schedule)
- [x] **gap-3.7** — Complete undo coverage for schedule mutations (snapshot period/slot IDs on create)
- [x] **gap-3.1** — AI eval harness — golden NL prompts + expected plans; CI regression (`npm run test:sprint14`)

---

## Sprint 15 — AI platform & limits

**Goal:** Unified gateway, capability matrix, shared client libs, plan-based AI caps.

- [x] **ai-0.1** — Unified AI gateway — single entry routing by `surface: dashboard | provider`, role, scope (`AiGatewayService` wraps `AiCommandService` + `ProviderAiCommandService`)
- [x] **ai-0.2** — Capability matrix — per-surface allowed intents; enforce server-side; hide unsupported intents in UI
- [x] **ai-0.10** — Extract shared hooks/libs — `useAiCommand`, `useAiSuggestions`, `useProviderAiCommand`; shared AI client types
- [x] **gap-3.3** — Enforce plan-based AI limits + usage meters (see `PLANS.md`, **ai-i10**)
- [x] **ai-i10** — Cost & latency budgets — route simple reads to rules; reserve LLM for classify + complex plans

---

## Sprint 16 — AI dashboard UX core

**Goal:** Clarify-as-form, undo, one-click suggestions — less chat friction.

- [x] **ai-d4** — Clarify-as-form — render `missing[]` as inline fields (date picker, employee select) instead of only text follow-ups
- [x] **ai-d22** — Wire i18n for all AI strings (`ai.commandPlaceholder`, `ai.thinking`, etc.)
- [x] **ai-d7** — Undo / rollback — after mutation, show "Undo" window using workflow execution log
- [x] **ai-d3** — One-click run from suggestions — `orchestrix:prompt` optional auto-submit; "Run" vs "Edit" on chips

**Status:** Shipped. Run `npm run test:sprint16` in `frontend/` (44 tests, 100% coverage on sprint16 libs: i18n registry, clarify, command-bar session/undo, Orchestrix events + integration).

---

## Sprint 17 — AI dashboard depth

**Goal:** Macros, wizards, risk explainability, proactive reports.

- [x] **ai-d5** — Command templates / macros — save frequent ops: "Monday morning setup", "End-of-week gap fill"
- [x] **ai-d6** — Multi-step wizard mode — complex ops (`setup_week_schedule`) → guided steps with preview between stages
- [x] **ai-d10** — Risk badges + policy explain — why approval required: "3 providers × 7 days = high risk"
- [x] **ai-d11** — Execution timeline — step-by-step workflow progress with retry on failed step
- [x] **ai-d18** — Weekly ops report — AI-generated: underutilized staff, top gaps, recommended template changes
- [x] **ai-d19** — Notification center integration — in-app alerts: "Conflict detected — tap to resolve"

**Status:** Shipped. Backend: `npm run test:sprint17` (32 tests, 100% stmts/lines on sprint17 modules; branch thresholds 75% `ai-events`, 82% `ai-weekly-report` for Nest constructor DI). Frontend: `npm run test:sprint17` (14 tests, 100% on notification center + `use-ai-events`). Sprint 16: `npm run test:sprint16` in `frontend/`.

---

## Sprint 18 — AI page coverage & onboarding

**Goal:** AI on Customers, Reports, and during onboarding.

- [x] **ai-d21** — Enable command bar on onboarding (or panel opens standalone mini-chat)
- [x] **ai-d24** — AI panel on Customers — "Find no-shows", "Re-engage inactive"
- [x] **ai-d25** — AI panel on Reports — "Explain this week's drop in utilization"
- [x] **gap-6.3** — Complete AI i18n — all strings in EN / HY / RU (see **ai-d22**)
- [x] **gap-6.6** — Enable AI assistant during onboarding with guided prompts (see **ai-d21**)
- [x] **gap-8.6** — AI customer panels — no-show re-engagement, inactive lookup (see **ai-d24**)

**Status:** Shipped. Frontend: `npm run test:sprint18` (25 tests, 100% on sprint18 libs + `AiPagePanel`). Backend: `npm run test:sprint18` (customer metric heuristics). Onboarding page mounts `AiCommandBar` with step-guided prompts; Customers/Reports use grouped AI panels.

---

## Sprint 19 — AI mobile commands

**Goal:** FAB, quick chips, and safe port of dashboard intents to mobile.

- [x] **ai-m3** — Global AI FAB — floating assistant on all tabs (Today, Schedule, Profile)
- [x] **ai-m6** — Quick action chips — contextual: "Mark all today paid", "Who's next?", "Any gaps this afternoon?"
- [x] **ai-m8** — `check_availability` — own schedule only (provider view)
- [x] **ai-m9** — `show_appointments` / `list_bookings` — enrich with service filters
- [x] **ai-m11** — `block_schedule` — own lunch/break blocks only
- [x] **ai-m13** — `summarize_utilization` — own week stats; managers see team summary

**Status:** Shipped. Provider app: `npm run test:sprint19` (quick chips, shell route util, `ProviderAiShell` integration — 100% on sprint19 UI libs). Backend: `npm run test:sprint19` (intent rescue + sprint19 util unit + command integration). `ProviderAiShell` + FAB on all tabs; quick chips per route; provider AI commands for availability, appointments, blocks, utilization.

---

## Sprint 20 — AI mobile push & voice

**Goal:** Hands-free input and push → deep link → AI prefill.

- [x] **ai-m5** — Voice input — Web Speech API in provider AI assistant (same text pipeline as typed commands)
- [x] **ai-m16** — Push deep links — `pushNotificationActionPerformed` → route + booking modal + AI prefill
- [x] **ai-m17** — Foreground push banner — in-app toast: "New booking 14:00 — Add buffer?"
- [x] **ai-m19** — End-of-day summary push — "4 appointments, 1 unpaid, 2 gaps tomorrow"
- [x] **gap-2.2** — Push deep links into booking detail + AI prefill (see **ai-m16**)
- [x] **gap-2.4** — Voice input on provider mobile (see **ai-m5**)
- [x] **gap-2.6** — End-of-day / new-booking push summaries for providers (see **ai-m19**, **ai-m17**)

**Status:** Shipped — 100% unit/integration coverage on Sprint 20 scope. Backend: `npm run test:sprint20` — **18 tests** (push payload, EOD summary, EOD scheduler, push-action service). Provider app: `npm run test:sprint20` — **34 tests** (deep links, foreground toast, native push helpers, voice input + speech recognition, `ProviderPushBridge`, `ProviderAiVoiceButton`).

---

## Sprint 21 — AI mobile offline

**Goal:** AI commands and suggestions when connectivity drops.

- [x] **ai-m20** — Offline command queue — queue safe mutations; replay when online
- [x] **ai-m21** — Optimistic UI — instant feedback on "mark paid" with rollback on failure
- [x] **ai-m22** — Cached last suggestions — show stale suggestions offline with "refresh when online"

**Status:** Shipped — 100% unit + integration coverage on Sprint 21 scope. Provider app: `npm run test:sprint21` (**44 tests**: offline queue/API utils, optimistic patches, AI assistant offline util, suggestions query/cache, `ProviderOfflineBanner`, `ProviderAiSuggestions`, `ProviderAiAssistant` offline flows).

---

## Sprint 22 — AI intelligence layer

**Goal:** Memory, handoff, coordination, optional RAG.

- [x] **ai-i2** — Entity memory — "Gevorg" → default provider; "facemassage" → default service for this business
- [x] **ai-i3** — Conversation summaries — compress long AI threads for session handoff dashboard ↔ mobile
- [x] **ai-i6** — Cross-provider coordination — "If Maria cancels, offer slot to waitlist customer John"
- [x] **ai-i8** — Optional RAG — embed SOP docs, past successful plans, business notes for better planning

**Status:** Shipped — 100% unit + integration coverage on Sprint 22 scope. Backend: `npm run test:sprint22` (**88 tests**: entity memory util + service, conversation summary util + service, intelligence context, coordination, RAG util + service, gateway meta, gateway sprint22 integration, provider sprint22 util + integration, settings rag merge; 100% stmts/branches/lines on all scoped util modules).

---

## Sprint 23 — AI scheduling scenarios

**Goal:** Advanced NL scheduling ops beyond baseline template cascade.

- [x] **ai-s2** — Smart block propagation — "Block lunch 12–13 for everyone, repeat 4 weeks, skip holidays"
- [x] **ai-s3** — Schedule swap — "Swap Friday schedules between Gevorg and Maria"
- [x] **ai-s4** — Capacity rebalance — "Move 2 facemassage slots from Gevorg to Maria on Friday"
- [x] **ai-s5** — Holiday mode — "Close Dec 24–26 for all, extend Dec 23 hours"
- [x] **ai-s6** — New hire onboarding schedule — "Set up Anna's first week from weekday template + assign massage services"

**Status:** Shipped — Sprint 23 scheduling scenarios wired through intent rescue, plan builders, and workflow executors. Backend: `npm run test:sprint23` (**62 tests**, 100% stmts/branches/lines on `ai-sprint23.util`, `ai-sprint23-plan.util`, `ai-sprint23.logic` + integration specs for intent rescue, plan builders, handlers, command-completion validators; thin `AiSprint23Service` wrapper).

---

## Sprint 24 — AI booking & business ops ✅ shipped

**Goal:** No-show sweeps, day replan, catalog/pricing/compliance NL ops.

- [x] **ai-b3** — No-show handling — `no_show_recovery` intent: mark no-shows → find freed slots (incl. NO_SHOW) → waitlist candidates → rebooking proposals
- [x] **ai-b4** — Payment sweep — `excludeWalkIns` + `statusFilter=COMPLETED` from NL; `filterBookingsForPaymentSweep`
- [x] **ai-b5** — Day replan — `sick_day_replan`: cancel bookings, notify, redistribute urgent, block sick day
- [x] **ai-o1** — Catalog from photo/menu — `import_services_from_menu`: `parseMenuTextToServices` + review plan (`requiresApproval`)
- [x] **ai-o2** — Pricing adjustment — `update_service_prices` + `update_service` workflow step
- [x] **ai-o3** — Staff-service matrix — `staff_service_matrix`: senior assign + junior remove by category/seniority
- [x] **ai-o4** — Compliance check — `check_schedule_compliance` read-only vs business hours
- [x] **ai-o5** — Revenue forecast — `revenue_forecast` from schedule + historical no-show rate
- [x] **ai-o5** — Time-of-day availability — morning (&lt;12), afternoon (12–17), evening (&gt;17) in `check_availability`

---

## Sprint 25 — AI enterprise & analytics

**Goal:** Multi-location, role permissions, admin analytics, public booking assistant.

**Status:** Shipped. Backend: `npm run test:sprint25` (100% stmts/lines/branches on sprint25 util/plan/logic). Frontend: analytics + enterprise panels on AI Ops.

- [x] **ai-e1** — Multi-location businesses — AI scoped by branch
- [x] **ai-e3** — Role-based intent permissions (receptionist vs owner)
- [x] **ai-e4** — Custom intent plugins per vertical (salon, clinic, fitness)
- [x] **ai-e5** — A/B test suggestion copy and auto-execute thresholds
- [x] **ai-e6** — Admin analytics: command success rate, clarify rate, approval rate
- [x] **ai-e7** — Human-in-the-loop SLA — escalate stuck tasks to owner
- [x] **ai-e8** — Customer-facing AI (public booking assistant) tied to same orchestration rules
- [x] **gap-3.5** — Command success / clarify / approval analytics dashboard (see **ai-e6**)

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

## Sprint 28 — Multi-currency support

**Goal:** Dashboard admin selects a default currency for the business; all prices, payments, and exports respect it across web, iOS, and Android.

**Status:** Core v1 shipped — admin currency settings, API/profile exposure, backend enforcement, public booking display, Stripe checkout, accounting export. Dashboard sweep, mobile apps, notifications, reports labels, and AI commands remain.

- [x] **curr-1** — Multi-currency support (admin default currency selection) (core v1)

**Key files:** `business-currency.util.ts`, `business.service.ts`, `public-booking.service.ts`, `booking-payment.service.ts`, `business-currency-settings.tsx`, `frontend/src/lib/business-currency.ts`

**Tests (Sprint 28):**
- Backend: `npm run test:sprint28` — **430 tests**; `business-currency.util` + `notification-currency.util` 100% util coverage + integration specs: `business-currency`, `stripe-currency`, `analytics.currency` (all `SUPPORTED_BUSINESS_CURRENCIES`, staff/services/P&L `currency`, CSV/PDF export labels, no FX sum), `dashboard.currency`, `reports-currency` (dashboard overview + analytics pipeline), `business-currency.pipeline`, `public-booking-currency`, `service.currency`, `multi-service-bookings.currency`, `service-packages.currency`, `booking-payment.currency`, `accounting-integration.currency`, `notifications-currency`, `booking-payment.service`, `gift-card-purchase.service`, `ai-weekly-report.service`
- Frontend: `npm run test:sprint28` — **276 tests**; `business-currency.ts` + `public-currency.ts` + `use-business-currency.ts` 100% coverage + scenario matrix: `business-currency.integration`, `business-currency.display.integration`, `business-currency.stripe.integration`, `reports-currency.integration` (9 report surfaces, all supported currencies, API unwrap, P&L labels, CSV meta), `business-currency.dashboard.integration`, `public-currency.spec`, `public-currency.integration`, `use-business-currency.spec`, `use-business-currency.integration`
- Consumer app: `npm run test:sprint28` — `business-currency.ts` 100% coverage + `tenant-store.currency.integration` (profile.currency on bootstrap → service price fallback)
- Provider app: `npm run test:sprint28` — **111 tests**; `business-currency.ts` + `use-business-currency.ts` + `booking-payment-summary.ts` + `BookingPaymentBreakdown.tsx` 100% coverage + scenario matrix (`business-currency.scenario.integration`, `business-currency.provider.integration` — 13 surfaces), unit specs (`booking-payment-summary.spec`, `booking-types.currency.spec`), integration specs (`BookingPaymentBreakdown.integration`, `use-business-currency.integration`, `auth-store.currency.integration`, payment/POS grand total, today/schedule headline fallback)
- Backend (curr-1.6 add-ons): `auth-currency.integration`, `provider-mobile.currency.integration`, expanded `booking-payment-summary.util.spec` (business default + POS grand total + `withBookingPaymentSummary` settings passthrough)
```bash
cd backend && npm run test:sprint28
cd frontend && npm run test:sprint28
cd provider-app && npm run test:sprint28
```

### curr-1.1 — Settings & storage
- [x] **curr-1.1** — `Settings → General`: currency selector (ISO 4217 list, e.g. USD, EUR, AMD, RUB); persisted as `business.settings.currency`; default `USD`
- [x] **curr-1.2** — Public API — expose `currency` + `stripeCurrencySupported` on `/public/{slug}/profile`
- [x] **curr-1.3** — Backend enforcement — new services default to business currency; checkout/Stripe uses `resolvePriceCurrency`; existing per-service codes unchanged until edited

### curr-1.2 — Display layer
- [x] **curr-1.4** — Dashboard — all monetary values (services, commissions, reports, payroll, gift cards, subscriptions) formatted with business currency symbol
- [x] **curr-1.5** — Public booking (web) — profile exposes `currency`; `resolveTenantPriceCurrency` / `formatPublicMoney` on service cards, checkout, multi-service, packages, gift cards, tours, account loyalty; consumer app reads `profile.currency` on tenant bootstrap and formats service prices with tenant fallback
- [x] **curr-1.6** — Provider app — auth exposes `business.currency`; booking payment breakdown + POS retail/grand totals; today/schedule headlines use `resolveTenantPriceCurrency`; provider-mobile API includes retail lines + business-default currency in `paymentSummary`
- [x] **curr-1.7** — Email / WhatsApp notifications — `notification-currency.util` formats booking confirmation/reminder email+SMS+WhatsApp price lines; gift card recipient balance + purchaser receipt use business currency symbol; templates expose `priceLineText` / `purchaseLineText`

### curr-1.3 — Payments & exports
- [x] **curr-1.8** — Stripe — all Connect checkout sessions (service, package, multi-service, gift card) use resolved business/service currency via `resolvePriceCurrency` / `getBusinessDefaultCurrency`; public profile exposes `stripeCurrencySupported`; admin `BusinessCurrencySettings` shows `isStripeChargeCurrencySupported` warning when Stripe Connect is linked and currency may be unsupported
- [x] **curr-1.9** — Accounting export (QuickBooks / Xero / CSV) — currency column uses business default when row currency absent
- [x] **curr-1.10** — Reports — revenue KPIs show currency label (`Revenue ({currency})`, dashboard overview `currency`, analytics API `currency` on staff/services/P&L); CSV/PDF exports + AI weekly fallback use `formatBusinessMoney`; no cross-currency conversion (single-currency per business v1)

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

## Sprint 29 — Per-tenant language enablement

**Goal:** Each tenant selects which languages to activate; only enabled languages show translation fields; public app and dashboard respect the selection.

- [x] **lang-1** — Per-tenant language enablement (core v1)

### lang-1.1 — Admin language settings
- [x] **lang-1.1** — `Settings → Languages`: multi-select from supported locales (EN, HY, RU); at least one must be enabled; default language picker; saves to `business.settings.enabledLocales[]` + `business.settings.defaultLocale`
- [x] **lang-1.2** — Default language — public booking page and consumer app default to `defaultLocale`; staff/dashboard default to user preference then `defaultLocale`

### lang-1.2 — Translation field gating
- [x] **lang-1.3** — Services, categories — translation fields rendered **only for enabled locales**; disabled locales hidden (not shown, not validated)
- [x] **lang-1.3b** — Packages — `localizedNames` on service packages (metadata JSONB); admin `LocalizedNamesFields` gated to `enabledLocales`; backend strips/rejects disabled locales; public booking resolves display name by visitor locale
- [x] **lang-1.4** — Business public profile (name, description, tagline, address) — same tab gating; only enabled locale fields shown
- [x] **lang-1.5** — Email templates — locale variant tabs shown only for enabled locales
- [x] **lang-1.6** — Backend validation — reject translation payloads for locales not in `enabledLocales`; strip on save

### lang-1.3 — Public booking & apps
- [x] **lang-1.7** — Public booking language switcher — only show enabled locales in language picker on `/book/{slug}`
- [x] **lang-1.8** — Consumer app — language picker constrained to tenant's enabled locales
- [x] **lang-1.9** — Provider app — same constraint; fallback to `defaultLocale` if user preference not in enabled list

**Tests (lang-1.3b packages):**
- Backend: `service-packages.locale.integration` (CRUD gating, all `SUPPORTED_LOCALES`, duplicate, clear, dashboard list), `public-booking-packages.locale.integration` (`?locale=` → `listPublicPackages`), `service-packages.service.spec` unit cases; `test:sprint29` enforces 100% on `business-locale.util.ts` + `service-packages.service.ts`
- Frontend: `service-packages.locale.integration` + `service-packages.spec` (form round-trip, payload trim, gating contract); `test:sprint29` enforces 100% on `business-locale.ts` + `service-packages.ts`

```bash
cd backend && npm run test:sprint29
cd frontend && npm run test:sprint29
# Cross-module locale scenarios (services, packages, email templates, public profile):
cd backend && npx jest --testPathPatterns='(business-locale|business.service.locale|service-localized-names|service-packages.locale|public-booking-packages.locale|notification-email-template.locale)'
cd consumer-app && npx vitest run src/lib/tenant-locale.spec.ts
cd provider-app && npx vitest run src/i18n/resolve-locale.spec.ts
```

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

## Sprint 30 — Tours vertical (business type: Tour operator)

**Goal:** When a new tenant selects "Tour operator" at onboarding, they get a pre-built tour template with full-day / multi-day booking flows, service type pictures, and tour-specific UX. Existing tenants unaffected.

- [x] **vert-tour-1** — Tour operator vertical (core v1)

### vert-tour-1.1 — Onboarding business type
- [x] **vert-tour-1.1** — Add `tour_operator` to `BUSINESS_TYPE_OPTIONS` and `BUSINESS_TYPE_TO_PLAYBOOK`; map to new `tour` playbook
- [x] **vert-tour-1.2** — Onboarding step: when `tour_operator` selected, show **tour-specific preview** (sample services: "Full Day City Tour", "3-Day Mountain Trek", etc.) before applying playbook

### vert-tour-1.2 — Tour playbook (catalog + schedule templates)
- [x] **vert-tour-1.3** — `TOUR_PLAYBOOK` constant — pre-built categories (Day Tours, Multi-Day Tours, Private Tours), sample services with: name, duration (8h / 1d / 3d), price, `serviceType: tour`, `coverImage` placeholder
- [x] **vert-tour-1.4** — Schedule templates for tours — full-day blocks (08:00–18:00 Mon–Sun); apply via existing `applyVerticalPlaybook` flow

### vert-tour-1.3 — Tour-specific booking UX
- [x] **vert-tour-1.5** — Service card for tours — show cover image (uploaded from dashboard), duration badge ("3 days"), group size (optional), difficulty level (optional); distinct card layout vs standard service card
- [x] **vert-tour-1.6** — Full-day / multi-day slot selection — `isDayLevelTour` + `dayLevelBooking` on public services; `getServiceDaySlots` collapses to single departure per day for tours ≥1d; capacity via `remainingSpots` + `countTourPaxForDate` (**deferred:** dedicated date-only picker UI, consecutive-day blocking in availability calendar → **vert-tour-1.10** / **ai-cmd-tour-6**)
- [x] **vert-tour-1.7** — Booking form — group size selector (1–N pax), notes/special requirements; price = per-person × pax
- [x] **vert-tour-1.8** — Tour booking record — `buildTourBookingMetadata` stores `paxCount`, `tourStartDate`, `tourEndDate`, `specialRequirements` on booking metadata at checkout; `extractTourBookingMetadata` + capacity keyed on `tourStartDate` (**deferred:** dashboard calendar multi-day span rendering → **vert-tour-1.10** / **ai-cmd-tour-7**)
- [x] **vert-tour-1.9** — Tour service admin fields — dashboard service edit: cover image URL, max group size, difficulty, meeting point, included items, duration days; only shown for `serviceType: tour`

### vert-tour-1.4 — Dashboard calendar & capacity
- [x] **vert-tour-1.10** — Calendar — multi-day tours rendered as span across days; color-coded by tour service (`tour-calendar.ts`, week bookings API `startDate`/`endDate`, tour departures row on provider calendar)
- [x] **vert-tour-1.11** — Tour capacity — max group size enforcement at booking; `remainingSpots` on public day-slots API when capped

**Tests (Sprint 30):**
```bash
cd backend && npm run test:sprint30
cd frontend && npm run test:sprint30
```
- Backend unit: `tour-service.util.spec.ts` (100% util coverage)
- Backend unit: `vertical-playbooks.constants.spec.ts` (tour_operator mapping, TOUR_PLAYBOOK structure)
- Backend unit: `service.tour.spec.ts` (create/update/clear tour metadata on services)
- Backend unit: `booking-payment.tour.spec.ts` (per-person × pax checkout pricing)
- Backend integration: `onboarding-vertical-playbook.spec.ts` (tour preview, recommend, apply playbook, catalog metadata)
- Backend integration: `public-booking-tour.integration.spec.ts` + `public-booking-tour-16-18.integration.spec.ts` (shared `public-booking-tour.harness.ts`) — **vert-tour-1.6**: day-level collapse, sub-day multi-slot, legacy overlap pax, `dayLevelBooking` on `getServices`; **vert-tour-1.8**: 1/3/5/7-day end dates, singular spot message, uncapped tour metadata, blank notes
- Frontend unit: `tour-service.spec.ts` (100% util coverage)
- Frontend integration: `tour-booking.integration.spec.ts` + `tour-booking-16-18.integration.spec.ts` (day-level vs 8h city tour, pax payload, date span, clamp, per-person totals)
- Frontend unit: `tour-calendar.spec.ts` (100% util coverage)
- Frontend integration: `tour-calendar.integration.spec.ts` + `tour-calendar-110.integration.spec.ts` — **vert-tour-1.10**: multi-day span columns, week clipping (before/after), lane stacking (2–3 tours), single-day span, non-tour exclusion, special requirements, cancelled status, palette cycling, API→span pipeline
- Backend unit: `tour-calendar.util.spec.ts` (overlap + week range helpers)
- Backend unit: `booking.service.calendar-tour.spec.ts` (`findAll` week `startDate`/`endDate` query builder, tour metadata overlap SQL, employee/hidden filters, legacy single-day fallback)
- Backend integration: `booking-calendar-tour.integration.spec.ts` — week inclusion matrix (in-week standard/tour, pre/post-week spanning tours, outside-week exclusion, `tourEndDate` fallback)

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

## Sprint 31 — Clinic vertical (business type: Clinic / Polyclinic)

**Goal:** When a new tenant selects "Clinic" or "Polyclinic" at onboarding, they get clinic-specific templates, flows, and the ability to store and display lab/test results. Existing salon/beauty_clinic tenants unaffected by new results feature.

- [x] **vert-clinic-1** — Clinic vertical (core v1)

### vert-clinic-1.1 — Onboarding business type
- [x] **vert-clinic-1.1** — Add `polyclinic` and `clinic` to `BUSINESS_TYPE_OPTIONS`; map `polyclinic`, `clinic`, `beauty_clinic`, `dental` → `clinic` playbook; dedicated **clinic onboarding preview** showing sample departments/services
- [x] **vert-clinic-1.2** — Clinic onboarding — clinic-specific catalog preview: departments (General Practice, Laboratory, Cardiology), appointment types (Consultation, Lab Test, Procedure); apply via `applyVerticalPlaybook`

### vert-clinic-1.2 — Clinic playbook (catalog + schedule)
- [x] **vert-clinic-1.3** — Extended `CLINIC_PLAYBOOK` — Laboratory department with sample test services; `serviceType: lab_test`, `consultation`, `procedure` on services
- [x] **vert-clinic-1.4** — Clinic schedule templates — Mon–Fri 09:00–17:00, Sat 09:00–13:00; apply via existing flow

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

## Sprint 32 — Post-checkout product recommendations

**Goal:** After completing the booking checkout, customers see recommended products linked to the service or service category, with images and descriptions configured by the admin.

- [x] **rec-1** — Post-checkout product recommendations (core v1)

### rec-1.1 — Admin product configuration
- [x] **rec-1.1** — Product catalog for recommendations — Operations → **Inventory**: create/edit product with name, description, image URL, optional display retail price, external link, `isActive`
- [x] **rec-1.2** — Service / category linking — Services page service + category edit: **Recommended products** multi-select; `service_recommended_products` + `category_recommended_products` join tables
- [x] **rec-1.3** — Priority & display order — selection order = `sortOrder`; max 5 products default via `business.settings.publicBooking.recommendations.maxProductCount`; category fallback when no service-level products

### rec-1.2 — Checkout integration
- [x] **rec-1.4** — API — `GET /public/{slug}/checkout/recommendations?serviceId=&categoryId=` — active linked products; service-first, category fallback
- [x] **rec-1.5** — Web checkout success step — **"You might also like"** dismissible product cards after booking confirmed (`checkout-form.tsx`)
- [x] **rec-1.6** — Consumer app checkout success — same product recommendation cards (`BookPage` success screen, `ConsumerProductRecommendationCards`, `fetchCheckoutRecommendations`)
- [x] **rec-1.7** — No-recommendation fallback — section hidden when API returns empty (no empty state)

### rec-1.3 — Analytics
- [x] **rec-1.8** — Impression + click tracking — `product_recommendation.shown` / `.clicked` events (`POST /checkout/recommendations/events`, EventStore, web + consumer app cards)

**Tests (Sprint 32):**
```bash
cd backend && npm run test:sprint32
cd frontend && npm run test:sprint32
cd consumer-app && npm run test:sprint32
```
- Backend unit: `product-recommendation.util.spec.ts`, `product-recommendation-settings.util.spec.ts` (100% util coverage)
- Backend unit: `product-recommendation.service.spec.ts` (list/set service+category links, empty clear, not-found guards)
- Backend unit: `inventory.recommendation.spec.ts` (create/update product recommendation fields, includeInactive)
- Backend integration: `product-recommendation.integration.spec.ts` (service-first, category fallback, max count, category-only)
- Backend integration: `public-booking-recommendation.integration.spec.ts` (image resolve, category-only, disabled booking, empty fallback)
- Frontend unit: `product-recommendation.spec.ts` (100% util coverage)
- Frontend integration: `product-recommendation.integration.spec.ts` (max count, dismiss, optional price/link, empty fallback)
- Consumer app unit: `product-recommendation.spec.ts`, `checkout-recommendations.spec.ts`, `resolve-public-image-url.spec.ts`, `api-base.spec.ts` (100% util coverage)
- Consumer app integration: `product-recommendation.integration.spec.ts` + `checkout-recommendations-16.integration.spec.ts` — **rec-1.6**: API path/query, service-first vs category-only, empty/error fallback, dismiss, max count, card view models (image/price/link), success end time
- Backend unit: `product-recommendation-analytics.util.spec.ts` (event payload, dedupe, EventType mapping, whitespace guards)
- Backend integration: `product-recommendation-analytics.integration.spec.ts`, `product-recommendation-analytics-18.integration.spec.ts`, `public-booking-recommendation-analytics.integration.spec.ts` — **rec-1.8**: shown/clicked publish, category-only, invalid product/event rejection, disabled booking guard, `recorded:false` passthrough
- Frontend unit/integration: `product-recommendation-analytics.spec.ts`, `product-recommendation-analytics.integration.spec.ts`, `product-recommendation-analytics-18.integration.spec.ts` — **rec-1.8**: impression dedupe, web checkout payloads, click tracking, API error swallow, events path
- Consumer app unit/integration: `product-recommendation-analytics.spec.ts`, `product-recommendation-analytics.integration.spec.ts`, `product-recommendation-analytics-18.integration.spec.ts`, `checkout-recommendations.spec.ts` (impression dedupe) — **rec-1.8**: consumer surface shown/clicked payloads, re-render dedupe, API error swallow

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

## Sprint 34 — Date format settings (admin-controlled, all apps)

**Goal:** Dashboard admin can select a preferred date format for the business; the setting is respected across the dashboard, provider app, consumer app, and public booking web — overriding browser/locale defaults.

- [x] **fmt-1** — Admin-controlled date format across all apps (core v1)

### fmt-1.1 — Admin settings
- [x] **fmt-1.1** — `Settings → General`: **Date format** selector — options: `DD/MM/YYYY` (default), `MM/DD/YYYY` (US), `YYYY-MM-DD` (ISO); persisted as `business.settings.dateFormat`
- [x] **fmt-1.2** — **Time format** selector alongside date format — `24h` (default) or `12h (AM/PM)`; persisted as `business.settings.timeFormat`
- [x] **fmt-1.3** — Public API — expose `dateFormat` and `timeFormat` on `/public/{slug}/profile`; auth business summary includes formats; apps cache on load

### fmt-1.2 — Backend formatting
- [x] **fmt-1.4** — `formatDateDisplay` / `formatTimeDisplay` utils — accept `dateFormat` + `timeFormat` options from business settings
- [x] **fmt-1.5** — Email / WhatsApp notifications — booking confirmations, reminders, gift card emails use `notification-date-format` helpers; `formatResultReadyNotificationWhen` ready for clinic result-ready (vert-clinic-1.x)

### fmt-1.3 — Dashboard
- [x] **fmt-1.6** — Dashboard date/time helpers use active business format cache (`BusinessDateFormatBootstrap` on layout, `bootstrapAuthBusinessDateFormats`, settings save sync); full sweep of every surface deferred
- [x] **fmt-1.7** — Date input fields — `DatePicker` typed input + format hint/placeholder from business `dateFormat`; `parseBusinessDateInput` / `parseBusinessDateToKey`; `toIsoDay` respects active format

### fmt-1.4 — Provider app
- [x] **fmt-1.8** — Provider app reads `dateFormat` + `timeFormat` from auth business; `BusinessDateFormatBootstrap` on app load; `DatePicker` + display helpers use business formats; push notification body text deferred

### fmt-1.5 — Consumer app & public booking web
- [x] **fmt-1.9** — Consumer app — tenant profile bootstrap sets active formats; appointment/date helpers respect business settings
- [x] **fmt-1.10** — Public booking web — tenant profile bootstrap; checkout/slot/summary format helpers use business settings
- [x] **fmt-1.11** — Fallback — if `dateFormat` not set, default to `DD/MM/YYYY` + `24h` (existing behavior unchanged)

**Tests (Sprint 34):**
```bash
cd backend && npm run test:sprint34
cd frontend && npm run test:sprint34
cd consumer-app && npm run test:sprint34
cd provider-app && npm run test:sprint34
```
- Backend: `business-date-format.util.spec.ts`, `notification-date-format.util.spec.ts` (6× format matrix + null/Date inputs, 100% util coverage), `notifications-date-format.integration.spec.ts` (**fmt-1.5**: confirmation/cancellation/reminder/grouped/business-change/gift-card channels × format matrix), `gift-card-delivery-content.util.spec.ts` (expiry DD/MM, MM/DD, ISO + WhatsApp), `public-booking-date-format.integration.spec.ts`, `auth-date-format.integration.spec.ts` — `npm run test:sprint34` (124 tests)
- Frontend unit/integration: `business-date-format.spec.ts`, `business-date-format.integration.spec.ts`, `business-date-format-dashboard.integration.spec.ts`, `business-date-format-16.integration.spec.ts`, `business-date-format-17.integration.spec.ts`, `business-date-input.integration.spec.ts` (**fmt-1.7** 6× parse matrix + ambiguous dates), `date-picker-17.integration.spec.tsx`, `business-date-format-bootstrap.integration.spec.tsx`, `store.date-format.spec.ts`, `date-format.spec.ts`, `date-format.dashboard.integration.spec.ts` — **fmt-1.6/1.7** (100% `business-date-format.ts` + `date-format.ts`, 106 tests)
- Consumer app: `business-date-format.spec.ts`, `tenant-store.date-format.spec.ts`, `date-format.spec.ts`
- Provider app: `business-date-format.spec.ts`, `date-format.business.spec.ts`, `date-format-17.integration.spec.ts`, `date-format.util.spec.ts`, `auth-store.date-format.spec.ts`, `date-picker-17.integration.spec.tsx`, `BusinessDateFormatBootstrap.integration.spec.tsx` (**fmt-1.8**, 100% `business-date-format.ts`, 100% lines/stmts `date-format.ts`, 41 tests)

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

## Sprint 36 — Tax / VAT configuration

**Goal:** Admin configures tax rules per business; tax is calculated and displayed at checkout; included in accounting exports and receipts. Supports tax-inclusive and tax-exclusive pricing models.

- [x] **tax-1** — Tax / VAT configuration (core v1)

### tax-1.1 — Admin tax settings
- [x] **tax-1.1** — `Settings → Tax`: enable tax toggle; **tax name** (e.g. "VAT", "GST", "Sales Tax"); **tax rate** (%); **tax model**: `inclusive` (price already includes tax, show breakdown) vs `exclusive` (tax added on top at checkout)
- [x] **tax-1.2** — **Per-service tax override** — service edit: optional tax rate override (e.g. some services exempt, different rate for medical vs beauty); inherit business default when not set
- [x] **tax-1.3** — **Tax number** — business VAT/tax registration number field; shown on receipts and invoices (**stored**; receipt footer display deferred)
- [x] **tax-1.4** — **Multiple tax rules** (v2, optional) — support stacking taxes (e.g. federal + state/province); v1 ships single rate only; `settings.tax.rules[]`; parallel stacking in `calculateStackedTaxBreakdown`; checkout exposes `taxRules[]` per-line breakdown; Settings UI toggle for stacked rules

### tax-1.2 — Checkout calculation
- [x] **tax-1.5** — Public booking checkout — show tax line: `exclusive`: subtotal + tax = total; `inclusive`: total with "incl. X% VAT" note; tax amount stored on booking record (**metadata via booking payment**)
- [x] **tax-1.6** — Backend — `business-tax.util` (`calculateTaxBreakdown`, `applyTaxToCheckoutAmount`); applied at public booking checkout via `CheckoutPricingService` + `BookingPaymentService` (**subscription / gift card / package checkout deferred**)
- [x] **tax-1.7** — Stripe — pass correct `amount` (inclusive: full price; exclusive: price + tax) to `PaymentIntent`; tax breakdown stored in `booking.metadata`; `booking-payment-stripe-tax.util` + Stripe session/PaymentIntent metadata; frozen `checkoutPricing` on fulfillment; package/multi-service booking metadata
- [ ] **tax-1.8** — Ameria / other gateways — same tax-aware total passed to payment initiation

### tax-1.3 — Display layer
- [x] **tax-1.9** — Public booking web — service cards show price with "incl. VAT" badge when inclusive; checkout summary shows subtotal + tax line + total
- [x] **tax-1.10** — Consumer app — same tax breakdown in checkout and booking confirmation
- [x] **tax-1.11** — Provider app — booking detail shows tax breakdown; "Mark paid" records tax-inclusive amount
- [x] **tax-1.12** — Dashboard — booking list + customer profile show tax amount; staff booking creation applies same tax rules

### tax-1.4 — Receipts & exports
- [x] **tax-1.13** — Email receipt — booking confirmation email shows subtotal, tax name + rate, tax amount, total; VAT/tax number in footer (`buildBookingPriceLines`, `resolveEmailFooterNote`, i18n receipt lines)
- [x] **tax-1.14** — Accounting export — tax columns: `subtotal`, `taxRate`, `taxAmount`, `total`, `taxName`; QuickBooks memo + Xero `Tax on Sales` line items (`booking-receipt-tax.util`, `accounting-export.service`)
- [x] **tax-1.15** — Reports — revenue report splits `grossRevenue` vs `taxCollected` vs `netRevenue` (analytics P&L, dashboard month stats, operations P&L UI)

**Tests (Sprint 36):**
- Backend: `npm run test:sprint36` — `business-tax.util` + `booking-payment-stripe-tax.util` + `booking-receipt-tax.util` + `notification-currency.util` + `accounting-export.service` + `booking-payment-summary.util` 100% coverage + integration specs: `business-tax`, `public-booking-tax`, `public-booking-stripe-tax`, `booking-payment.tax`, `booking-payment-stripe-tax`, `booking-payment-summary`, `booking-payment-staff-tax`, `booking-mark-paid-tax`, `customer-detail-tax`, `booking-receipt-tax`, `notification-receipt-tax`, `notification-currency`, `accounting-integration.tax`, `accounting-export.tax`, `analytics.tax-revenue`, `dashboard.tax-revenue`, `stripe-checkout-tax`, `service.tax`, `checkout-pricing.tax` (Stripe/checkout/display/receipt/export/report tax scenarios)
- Frontend: `npm run test:sprint36` — `business-tax.ts` + `booking-payment-summary.ts` 100% coverage + `booking-types-tax` + `tax-revenue-reports` integration (tax-inclusive headline, P&L gross/tax/net labels, dashboard month tax stats)
- Consumer: `npm run test:sprint36` — 26 tests; `business-tax.ts` + `CheckoutTaxSummary.tsx` 100% coverage (inclusive badge, stacked checkout lines, exclusive/inclusive breakdown UI)
- Provider: `npm run test:sprint36` — 29 tests; `booking-payment-summary.ts` + `BookingPaymentBreakdown.tsx` 100% coverage (stacked/inclusive/aggregate tax rows)
- Receipts/exports slice: backend **301 tests** across `booking-receipt-tax`, `notification-receipt-tax`, `notification-currency`, `accounting-integration.tax`, `accounting-export.tax`, `analytics.tax-revenue`, `dashboard.tax-revenue`; frontend **58 tests** including `tax-revenue-reports` integration

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

## Sprint 37 — GDPR & HIPAA compliance hardening

**Goal:** Full GDPR compliance for EU customers; HIPAA-ready mode for medical/clinic tenants in the US; admin controls for data retention, consent, and audit logs.

- [x] **compliance-1** — GDPR & HIPAA compliance hardening (core v1)

### compliance-1.1 — GDPR (EU — all tenants)
- [x] **compliance-1.1** — **Data retention policy** — `Settings → Privacy`: configurable retention periods per data type (booking history, customer PII, AI command logs, audit logs); automated purge job respects retention rules (**settings stored**; automated purge job deferred)
- [x] **compliance-1.2** — **Right to erasure (forget me)** — customer-initiated: `DELETE /public/{slug}/me/data` → anonymize PII (hashed placeholders); admin-initiated: `DELETE /businesses/{id}/customers/{id}/data`
- [x] **compliance-1.3** — **Data export (portability)** — `GET /public/{slug}/me/data` + admin `GET .../customers/{id}/data-export` (**email delivery within 24h deferred**)
- [x] **compliance-1.4** — **Consent management** — marketing opt-in/out (**polish-3** ✅); granular AI + third-party consent at checkout; consent log with timestamp (+ optional IP)
- [x] **compliance-1.5** — **Cookie consent banner** — public booking: configurable banner with accept/reject; stored in `localStorage` (**backend sync deferred**)
- [~] **compliance-1.6** — **DPA (Data Processing Agreement)** — DPA template exists (**gap-5.4** ✅ / Enterprise Trust tab); e-sign step + signed DPA storage deferred
- [x] **compliance-1.7** — **Privacy policy version tracking** — `privacyPolicyVersion` on business settings; `shouldPromptPrivacyReconsent` helper (**checkout re-consent UI prompt deferred**)
- [x] **compliance-1.8** — **Breach notification workflow** — admin: "Report data breach" form → auto-draft notification email to affected customers + log incident with timestamp; 72h GDPR deadline reminder

### compliance-1.2 — HIPAA (US clinic vertical only)
- [x] **compliance-1.9** — **HIPAA mode toggle** — `Settings → Compliance`: enable HIPAA mode (clinic / polyclinic / beauty_clinic / dental only)
- [x] **compliance-1.10** — **BAA (Business Associate Agreement)** — require admin BAA acceptance before enabling; store `baaAcceptedAt`, `baaAcceptedByUserId`, `baaVersion`
- [x] **compliance-1.11** — **PHI field encryption** — when HIPAA mode on: `referralNotes`, `symptoms`, `patient_test_results.notes` encrypted at rest (AES-256); decrypted only for authorized staff; encryption key per business stored in KMS / secrets manager
- [x] **compliance-1.12** — **Access audit log** — every read/write of PHI fields logged: `userId`, `role`, `action`, `resourceType`, `resourceId`, `timestamp`, `ip`; retention minimum 6 years; viewable by owner only
- [x] **compliance-1.13** — **Session timeout** — dashboard enforces configurable inactivity auto-logout when HIPAA mode on (`useHipaaSessionTimeout` + banner notice; **provider app deferred**)
- [x] **compliance-1.14** — **Minimum necessary access** — HIPAA mode: staff role sees only PHI for their own assigned bookings; manager sees all; owner sees all; enforced at API layer (`phi-minimum-access.util` + booking PHI decrypt paths)
- [x] **compliance-1.15** — **AI + PHI guard** — `objectContainsPhiFields` + `phi-ai-guard.util`; blocks PHI in AI command `context` when HIPAA on (**free-text LLM prompt PHI scan deferred**)

### compliance-1.3 — Shared / cross-cutting
- [x] **compliance-1.16** — **Compliance dashboard** — GDPR checklist + sub-processors + HIPAA status + breach log + PHI audit in `Settings → Compliance` (**dedicated owner page deferred**)
- [x] **compliance-1.17** — **Data residency hint** — informational `dataResidencyRegion` on privacy settings + public profile
- [x] **compliance-1.18** — **Third-party sub-processor list** — in-dashboard sub-processor list in compliance settings (Article 28)

**Tests (Sprint 37):**
- Backend: `npm run test:sprint37` — **186+ tests**; utils at **100%** lines/branches/functions; compliance services at **100%** lines/statements/functions (branch floors: phi-field 93%+, phi-access-audit 94%+, breach/controller 80%+ for Nest DI ctor paths). Specs: `business-compliance`, `phi-encryption`, `phi-minimum-access`, `phi-ai-guard`, `breach-notification`, `phi-field.service`, `phi-access-audit.service`, `compliance-breach.service`, `compliance.controller`, `compliance.module`, `compliance.integration`, `compliance-scenarios`, `public-booking-compliance`, `public-booking-consent`, `customer-privacy`, `booking-phi-compliance`, `booking-phi-minimum-access`, `ai-gateway-phi-guard`
- Frontend: `npm run test:sprint37` — **52 tests**; `business-compliance.ts`, `compliance-workflow.ts`, `hipaa-session-timeout.ts`, `cookie-consent.ts` at **100%** coverage + scenario matrix (HIPAA session timeout, minimum-necessary PHI masking, breach deadline approaching/overdue/safe, owner-only panels, GDPR checklist, cookie consent)

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
