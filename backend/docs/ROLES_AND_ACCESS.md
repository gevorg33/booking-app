# Roles and Access

This document describes who can see and do what in the booking platform, including AI commands.

## Role tiers

| Tier | Who | MemberRole mapping |
|------|-----|-------------------|
| **Client** | Customer using public booking | No business membership |
| **Staff** | Service provider, front-desk contributor | `staff`, `contributor` |
| **Manager** | Location/team manager | `manager` |
| **Owner** | Business owner, admin | `owner`, `admin` |

Implementation: `backend/src/modules/ai/access-control.matrix.ts`

---

## Client (customer)

**Can see**
- Their own bookings (public booking flow / confirmation)
- Public business services, providers, availability

**Cannot see**
- Staff schedules (other providers)
- Revenue, analytics, payment totals
- Internal CRM notes, VIP segments, contact exports

**AI access:** Public booking assistant only (`public-booking` module). Dashboard AI is blocked.

---

## Staff

**Can see**
- Assigned / own bookings
- Limited customer info (name, upcoming & recent appointment — no email/phone/segment in AI lookup)
- Public services, own availability

**Cannot see**
- Full business financials (revenue, unpaid sweeps, utilization analytics)
- Owner-only operations (optimize schedule, template setup, bulk no-show sweeps)
- Full staff directory & cross-provider revenue rankings
- CRM insights (VIP segments, top spenders, waitlist bulk)

**AI access:** Dashboard (scoped to linked `employeeId`) and provider mobile (own calendar). Team-wide mobile view requires manager+ membership.

---

## Manager / Owner

**Can see**
- Revenue, booking analytics, utilization
- All staff schedules
- CRM insights (segments, top spenders, waitlist)
- Internal customer profile fields (email, phone, segment, notes via CRM UI)

**AI access:** Full dashboard AI. Owner tier includes admin accounts. Manager tier is identical except `optimize_schedule` is reserved for owner on dashboard AI.

---

## Enforcement layers

1. **JWT** — `membershipRole` + `employeeId` on token (not global `user.role`)
2. **Access tier** — `resolveAccessTier(membershipRole)` in gateway
3. **Intent deny-list** — per tier in `DASHBOARD_DENIED_BY_TIER` / `PROVIDER_DENIED_BY_TIER`
4. **Data category checks** — revenue requests blocked for staff/client
5. **Staff scoping** — booking list/show intents forced to `_scopedEmployeeId`
6. **Prompt security** — injection, export, availability bypass (see `AI_COMMAND_ARCHITECTURE.md`)

---

## API mapping fix

Dashboard AI now uses `user.membershipRole` from JWT (previously incorrectly used global `user.role`, which defaulted many users to owner-level access).

```typescript
// ai-command.controller.ts
membershipRole: user?.membershipRole,
employeeId: user?.employeeId,
```
