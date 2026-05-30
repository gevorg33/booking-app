# Subscription plans & feature limits

Product/pricing reference for OptiSchedule (Orchestrix). Aligns with `backend/src/modules/billing/plans.ts` and `business.subscriptionPlanId`.

---

## Pricing model (recommended)

Use **base + seats**, not flat unlimited:

| Plan | Base / mo | Provider seat | Admin seat | Target |
|------|-----------|---------------|------------|--------|
| **Solo** | $0 | — (1 included) | — | 1-person shop, trial |
| **Starter** | $9 | **$9/seat** | $5/seat | 2–5 staff salons/clinics |
| **Growth** | $19 | **$14/seat** | $7/seat | Teams that live in AI + mobile |
| **Business** | $49 | **$18/seat** | $9/seat | Multi-role ops, integrations |

- **Annual:** ~20% off.
- **Owner seat:** always free (1 per business).

### Cheapest credible public lineup

If the goal is the **lowest** viable pricing:

- **Solo:** Free (1 seat, 25 AI commands/mo)
- **Starter:** **$9 base + $8/provider** — true “cheapest paid” tier
- Defer a fourth tier until ~20+ paying businesses

That keeps entry around **~$25/mo for a 2-chair salon**, competitive without looking “too cheap to trust.”

### Per-seat floor (reference)

| Model | Cheapest viable range (USD/seat/mo) | Notes |
|--------|-------------------------------------|--------|
| **Provider seat** (books, has calendar) | **$8–12** | Hard floor if AI usage is capped |
| **Admin/manager seat** (dashboard, no calendar) | **$5–8** | Lower COGS, less mobile value |
| **With unlimited AI** | **$12–18+** | OpenAI cost dominates at scale |

Absolute floor: about **$6–8/provider/month** only with AI caps, annual billing, minimum seats, and self-serve support.

---

## What to restrict per plan

Think in **limits** (numbers) and **flags** (on/off).

### 1. Seats & team

| Limit | Solo | Starter | Growth | Business |
|--------|------|---------|--------|----------|
| Active **provider** seats (employees w/ calendar) | 1 | 5 | 15 | Unlimited |
| **Admin/manager** dashboard seats | 0 | 2 | 5 | Unlimited |
| Role management (change roles) | — | Owner only | Owner + Admin | Owner + Admin |
| Invites / send app access | 1/mo | Unlimited | Unlimited | Unlimited |

**Enforcement:** block creating employee #N+1 or invite when over limit; show upgrade on Employees page.

---

### 2. Scheduling & bookings (core — keep generous)

| Feature | Solo | Starter | Growth | Business |
|---------|------|---------|--------|----------|
| Bookings / customers | Unlimited | Unlimited | Unlimited | Unlimited |
| Schedule templates | 1 | 5 | Unlimited | Unlimited |
| Direct schedule / clear schedule | ✓ | ✓ | ✓ | ✓ |
| Block schedules | ✓ | ✓ | ✓ | ✓ |
| Public booking page | ✓ | ✓ | ✓ | ✓ |
| Provider mobile app | ✓ (1 user) | ✓ | ✓ | ✓ |
| Waitlist | — | ✓ | ✓ | ✓ |

**Enforcement:** mostly seat count; don’t cripple core scheduling on paid tiers.

---

### 3. AI (main cost driver — restrict hard here)

| Limit | Solo | Starter | Growth | Business |
|--------|------|---------|--------|----------|
| Dashboard AI commands / mo | 25 | 150 | 600 | 2,000 |
| Public booking AI / mo | 50 | 300 | 1,000 | Unlimited |
| AI Operations page (agents) | — | — | ✓ | ✓ |
| AI autopilot | — | — | Basic | Full |
| Voice input | — | ✓ | ✓ | ✓ |
| Undo AI commands | — | ✓ | ✓ | ✓ |
| Bring-your-own OpenAI key | — | — | ✓ | ✓ |

**Enforcement:** gate in AI gateway before command execution; soft warning at 80%, hard block at 100%.

**Solo:** simple commands only (book, cancel, list) — deny `optimize_schedule`, `day_replan`, bulk ops.

---

### 4. CRM & customers

| Feature | Solo | Starter | Growth | Business |
|---------|------|---------|--------|----------|
| Customer directory | ✓ | ✓ | ✓ | ✓ |
| Customer segments / VIP insights | — | — | ✓ | ✓ |
| Export customers | — | — | — | ✓ |
| Internal notes on customers | ✓ | ✓ | ✓ | ✓ |

---

### 5. Monetization (Stripe Connect features)

| Feature | Solo | Starter | Growth | Business |
|---------|------|---------|--------|----------|
| Stripe Connect (take payments) | — | ✓ | ✓ | ✓ |
| Promo codes | — | ✓ | ✓ | ✓ |
| Loyalty points | — | — | ✓ | ✓ |
| Customer memberships | — | — | ✓ | ✓ |
| Commissions / payouts | — | — | — | ✓ |
| Gift cards (future) | — | — | — | ✓ |

**Enforcement:** hide Monetization tabs in UI; API returns `403` with upgrade hint.

---

### 6. Analytics & ops

| Feature | Solo | Starter | Growth | Business |
|---------|------|---------|--------|----------|
| Dashboard overview | Basic | Basic | Advanced | Advanced |
| Reports page | — | Basic | Full | Full |
| Reviews management | — | ✓ | ✓ | ✓ |
| Utilization / revenue AI queries | — | — | ✓ | ✓ |
| Webhooks / integrations | — | — | 3 endpoints | Unlimited |
| AI audit log retention | 7 days | 30 days | 90 days | 1 year |

---

### 7. Support & branding

| Feature | Solo | Starter | Growth | Business |
|---------|------|---------|--------|----------|
| Email support | Community | Standard | Priority | Priority + SLA |
| Remove “Powered by” on public booking | — | — | ✓ | ✓ |
| Custom domain (future) | — | — | — | ✓ |

---

## Marketing tier story

**Solo — Free**  
*Run bookings for yourself.*  
1 provider, public page, light AI, no payments stack.

**Starter — ~$27/mo for 2 providers** ($9 base + 2×$9)  
*Small team scheduling.*  
Full calendar, mobile, payments, promo codes, team roles.

**Growth — ~$47/mo for 2 providers** ($19 + 2×$14)  
*AI-powered front desk.*  
AI Ops, loyalty, segments, higher AI limits — main differentiator.

**Business — anchor tier**  
*Run the whole operation.*  
Commissions, webhooks, exports, unlimited scale.

---

## Implementation notes

Extend `plans.ts` beyond marketing `features[]`:

```ts
interface PlanLimits {
  maxProviderSeats: number | null;
  maxAdminSeats: number | null;
  aiCommandsPerMonth: number;
  publicAiPerMonth: number;
  maxScheduleTemplates: number | null;
  flags: {
    aiOps: boolean;
    aiAutopilot: boolean;
    stripeConnect: boolean;
    promoCodes: boolean;
    loyalty: boolean;
    memberships: boolean;
    commissions: boolean;
    webhooks: boolean;
    customerExport: boolean;
    advancedReports: boolean;
    byoOpenAiKey: boolean;
  };
}
```

Enforce in three places:

1. **API guards** — seat create, AI command, monetization routes
2. **Frontend** — hide nav items + upgrade prompts (`/dashboard/billing`)
3. **Usage counters** — `AiUsageService.getMonthlySummary` vs plan limit

`business.subscriptionPlanId` is sufficient to start gating.

---

## What not to restrict (keeps product fair)

- Unlimited **customer** records on paid plans
- Unlimited **bookings** on paid plans
- Core **schedule + calendar** on Starter+
- **1 owner** always included

Customers churn when bookings are capped; they upgrade when **seats, AI, and money features** are capped.

---

## Current code state

Today `plans.ts` defines a single active tier:

- **Starter** — $19/mo flat per business (not yet per-seat)
- Checkout via Stripe inline `price_data` in `BillingService`

This document describes the **target** tier structure; implementation of limits and additional plans is pending.
