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
| **9** | Customer gift card purchase & delivery | **gc-1** |
| **10** | Launch — billing & provider app store | gap-7.5, gap-7.6, gap-1.5 |
| **11** | Consumer booking app | **gap-2.5** |
| **12** | Marketing alerts & subscription accounting | gap-4.6, gap-4.7 |
| **13** | Customer booking self-service & staff push | gap-2.7, gap-2.8, **pay-2** |
| **14** | AI reliability & regression | gap-3.2, gap-3.7, gap-3.1 |
| **15** | AI platform & limits | ai-0.1, ai-0.2, ai-0.10, gap-3.3, ai-i10 |
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
| **26** | Onboarding & pricing UX | gap-6.1, gap-7.4 |
| **27** | Stripe plans & seats | gap-7.1, gap-7.2, gap-7.3, gap-5.2, gap-6.2 |

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

## Sprint 12.a — Launch: billing

**Goal:** Public launch readiness — billing options, upgrade flows.

- [ ] **gap-7.5** — In-app upgrade prompts when hitting limits (seats, AI, monetization flags)
- [ ] **gap-7.6** — Annual billing option (~20% discount)

---

## Sprint 12.b — Marketing alerts & subscription accounting

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

## Sprint 13 — Customer booking self-service & staff push

**Goal:** Registered customers can cancel or move appointments; assigned provider, staff, and managers get app push when bookings change.

- [ ] **gap-2.7** — Registered customer cancel & reschedule (see spec below)
- [ ] **feature** — After a booking is completed and the customer receives the confirmation email, add a Reschedule / Cancel Booking button on the final "Booking Complete" step.
When the user clicks this button, provide two possible flows:
If the user does not have an account, prompt them to register using the same email address they entered during checkout. After registration, they should be able to view, reschedule, or cancel their bookings.
If the user accesses the booking through the confirmation email, the redirect URL should include a secure token or identifier associated with the booking/email, allowing the system to recognize the customer and take them directly to the booking management page without requiring additional steps.
The goal is to provide a seamless self-service experience for customers to manage their bookings after checkout.
- [ ] **gap-2.8** — Booking cancelled / rescheduled → notify provider, staff & manager via app (see spec below)
- [ ] **pay-2** — Customer **cash payment** option at booking when admin enables it (see spec below)

### gap-2.7 — Customer self-service cancel & reschedule

**User story:** As a registered customer, I want to cancel my appointment or pick a new date/time without calling the salon.

- [ ] **gap-2.7.1** — Policy settings — admin configures: allow cancel (yes/no), allow reschedule (yes/no), minimum notice (e.g. 24h before start), max reschedules per booking
- [ ] **gap-2.7.2** — API — `POST /public/{slug}/customer/bookings/:id/cancel` and `POST …/reschedule` (or PATCH with new slot); auth = public customer JWT; enforce policy + booking ownership
- [ ] **gap-2.7.3** — Reschedule UX — show available slots for same service/provider (or allow provider change per policy); validate conflicts server-side; **gap-8.3** package sub-bookings reschedule independently; **gap-8.7** same-visit group reschedules atomically
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

### pay-2 — Cash payment at booking (public checkout)

**User story:** As a customer, I want to choose **Pay in cash** at checkout when the business accepts cash, instead of being forced through online card payment only.

**User story (admin):** As a dashboard admin, I want to enable or disable cash as an accepted payment method for public bookings so customers can pay at the venue.

#### Admin settings (dashboard)

- [ ] **pay-2.1** — **Accept cash payments** toggle — business setting (e.g. Monetization → Payments or Business settings): when **off**, public checkout shows online payment only (Stripe when configured); when **on**, customer may select cash
- [ ] **pay-2.2** — **Rules** — optional: allow cash only when service prepayment is none/deposit; disallow cash when full prepayment required online; admin copy explaining when cash appears
- [ ] **pay-2.3** — **Public API** — expose `acceptCashPayments` (and related rules) on business/public booking config so frontend can show/hide cash option without extra round-trip

#### Customer checkout (public booking)

- [ ] **pay-2.4** — **Payment method selector** — on confirm/checkout step when admin enabled cash: **Pay online** (Stripe — existing **pay-1** flow) vs **Pay in cash at visit**; hide cash option when admin disabled or service rules block it
- [ ] **pay-2.5** — **Cash booking flow** — selecting cash creates booking without Stripe session; `paymentStatus`: **pending** / **pay_at_venue**; amount due stored on booking metadata; confirmation copy: “Pay {amount} in cash when you arrive”
- [ ] **pay-2.6** — **Online still default** — when both methods available, default to online if service requires prepayment/deposit; cash pre-selected only when no online charge due or admin prefers cash-first (setting)

#### Staff & reconciliation

- [ ] **pay-2.7** — **Mark paid in dashboard / provider app** — staff confirms cash received → `paymentStatus` → **paid**; optional “Mark paid (cash)” action with timestamp + user id
- [ ] **pay-2.8** — **Reports & calendar** — show unpaid / pay-at-venue bookings; filter by payment method; loyalty earn on cash when marked paid (reuse eligible cash rules)

#### Edge cases

- [ ] **pay-2.9** — **Mixed checkout** — gift card / promo / loyalty + cash remainder: cash option covers **amount due** after credits; no Stripe for zero online portion
- [ ] **pay-2.10** — **Subscriptions & packages** — define whether **sub-1** / **gap-8.3** purchases require online pay or can use cash (default: online only for prepaid products)
- [ ] **pay-2.11** — **No-show / cancel** — cash bookings follow same cancel policy (**gap-2.7**); no automatic refund path

#### Example

Admin enables “Accept cash payments” → customer books Haircut ($30, no prepayment) → checkout shows **Pay in cash at visit** → booking confirmed, payment pending → stylist marks **Paid (cash)** after appointment.

*(Complements historical **pay-1** Stripe prepay; Stri
pe remains required when admin disables cash or service mandates online prepayment.)*

---

## Sprint 14 — AI reliability & regression

**Goal:** Fix top failure modes; CI guardrails before expanding AI surface.

- [ ] **gap-3.2** — Fix top failure modes — reschedule time parsing (AM/PM), clearer conflict errors, partial undo gaps (e.g. create schedule)
- [ ] **gap-3.7** — Complete undo coverage for schedule mutations (snapshot period/slot IDs on create)
- [ ] **gap-3.1** — AI eval harness — golden NL prompts + expected plans; CI regression (see **ai-i9**)

---

## Sprint 15 — AI platform & limits

**Goal:** Unified gateway, capability matrix, shared client libs, plan-based AI caps.

- [ ] **ai-0.1** — Unified AI gateway — single entry routing by `surface: dashboard | provider`, role, scope (`AiGatewayService` wraps `AiCommandService` + `ProviderAiCommandService`)
- [ ] **ai-0.2** — Capability matrix — per-surface allowed intents; enforce server-side; hide unsupported intents in UI
- [ ] **ai-0.10** — Extract shared hooks/libs — `useAiCommand`, `useAiSuggestions`, `useProviderAiCommand`; shared AI client types
- [ ] **gap-3.3** — Enforce plan-based AI limits + usage meters (see `PLANS.md`, **ai-i10**)
- [ ] **ai-i10** — Cost & latency budgets — route simple reads to rules; reserve LLM for classify + complex plans

---

## Sprint 16 — AI dashboard UX core

**Goal:** Clarify-as-form, undo, one-click suggestions — less chat friction.

- [ ] **ai-d4** — Clarify-as-form — render `missing[]` as inline fields (date picker, employee select) instead of only text follow-ups
- [ ] **ai-d22** — Wire i18n for all AI strings (`ai.commandPlaceholder`, `ai.thinking`, etc.)
- [ ] **ai-d7** — Undo / rollback — after mutation, show "Undo" window using workflow execution log
- [ ] **ai-d3** — One-click run from suggestions — `orchestrix:prompt` optional auto-submit; "Run" vs "Edit" on chips

---

## Sprint 17 — AI dashboard depth

**Goal:** Macros, wizards, risk explainability, proactive reports.

- [ ] **ai-d5** — Command templates / macros — save frequent ops: "Monday morning setup", "End-of-week gap fill"
- [ ] **ai-d6** — Multi-step wizard mode — complex ops (`setup_week_schedule`) → guided steps with preview between stages
- [ ] **ai-d10** — Risk badges + policy explain — why approval required: "3 providers × 7 days = high risk"
- [ ] **ai-d11** — Execution timeline — step-by-step workflow progress with retry on failed step
- [ ] **ai-d18** — Weekly ops report — AI-generated: underutilized staff, top gaps, recommended template changes
- [ ] **ai-d19** — Notification center integration — in-app alerts: "Conflict detected — tap to resolve"

---

## Sprint 18 — AI page coverage & onboarding

**Goal:** AI on Customers, Reports, and during onboarding.

- [ ] **ai-d21** — Enable command bar on onboarding (or panel opens standalone mini-chat)
- [ ] **ai-d24** — AI panel on Customers — "Find no-shows", "Re-engage inactive"
- [ ] **ai-d25** — AI panel on Reports — "Explain this week's drop in utilization"
- [ ] **gap-6.3** — Complete AI i18n — all strings in EN / HY / RU (see **ai-d22**)
- [ ] **gap-6.6** — Enable AI assistant during onboarding with guided prompts (see **ai-d21**)
- [ ] **gap-8.6** — AI customer panels — no-show re-engagement, inactive lookup (see **ai-d24**)

---

## Sprint 19 — AI mobile commands

**Goal:** FAB, quick chips, and safe port of dashboard intents to mobile.

- [ ] **ai-m3** — Global AI FAB — floating assistant on all tabs (Today, Schedule, Profile)
- [ ] **ai-m6** — Quick action chips — contextual: "Mark all today paid", "Who's next?", "Any gaps this afternoon?"
- [ ] **ai-m8** — `check_availability` — own schedule only (provider view)
- [ ] **ai-m9** — `show_appointments` / `list_bookings` — enrich with service filters
- [ ] **ai-m11** — `block_schedule` — own lunch/break blocks only
- [ ] **ai-m13** — `summarize_utilization` — own week stats; managers see team summary

---

## Sprint 20 — AI mobile push & voice

**Goal:** Hands-free input and push → deep link → AI prefill.

- [ ] **ai-m5** — Voice input — Capacitor Speech Recognition → same text pipeline (hands-free in salon)
- [ ] **ai-m16** — Push deep links — `pushNotificationActionPerformed` → route + prefill AI prompt
- [ ] **ai-m17** — Foreground push banner — in-app toast: "New booking 14:00 — Add buffer?"
- [ ] **ai-m19** — End-of-day summary push — "4 appointments, 1 unpaid, 2 gaps tomorrow"
- [ ] **gap-2.2** — Push deep links into booking detail + AI prefill (see **ai-m16**)
- [ ] **gap-2.4** — Voice input on provider mobile (see **ai-m5**)
- [ ] **gap-2.6** — End-of-day / new-booking push summaries for providers (see **ai-m19**, **ai-m17**)

---

## Sprint 21 — AI mobile offline

**Goal:** AI commands and suggestions when connectivity drops.

- [ ] **ai-m20** — Offline command queue — queue safe mutations; replay when online
- [ ] **ai-m21** — Optimistic UI — instant feedback on "mark paid" with rollback on failure
- [ ] **ai-m22** — Cached last suggestions — show stale suggestions offline with "refresh when online"

---

## Sprint 22 — AI intelligence layer

**Goal:** Memory, handoff, coordination, optional RAG.

- [ ] **ai-i2** — Entity memory — "Gevorg" → default provider; "facemassage" → default service for this business
- [ ] **ai-i3** — Conversation summaries — compress long AI threads for session handoff dashboard ↔ mobile
- [ ] **ai-i6** — Cross-provider coordination — "If Maria cancels, offer slot to waitlist customer John"
- [ ] **ai-i8** — Optional RAG — embed SOP docs, past successful plans, business notes for better planning

---

## Sprint 23 — AI scheduling scenarios

**Goal:** Advanced NL scheduling ops beyond baseline template cascade.

- [ ] **ai-s2** — Smart block propagation — "Block lunch 12–13 for everyone, repeat 4 weeks, skip holidays"
- [ ] **ai-s3** — Schedule swap — "Swap Friday schedules between Gevorg and Maria"
- [ ] **ai-s4** — Capacity rebalance — "Move 2 facemassage slots from Gevorg to Maria on Friday"
- [ ] **ai-s5** — Holiday mode — "Close Dec 24–26 for all, extend Dec 23 hours"
- [ ] **ai-s6** — New hire onboarding schedule — "Set up Anna's first week from weekday template + assign massage services"

---

## Sprint 24 — AI booking & business ops

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

## Sprint 25 — AI enterprise & analytics

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
