import { Business } from './business.entity.js';

/**
 * Build a complete `Business` for tests.
 *
 * F1 / e2e-bug.359 — the `TS2352` cluster ("conversion may be a mistake") is
 * this shape: specs write `({ id, name, slug, timezone, settings }) as Business`
 * and TypeScript objects because the literal overlaps the entity too little for
 * the assertion to be plausible. The cast is the tell: the fixture is not a
 * `Business`, it is five of its twenty-odd fields.
 *
 * Fourth in the family with `makeService` / `makeServiceCategory` /
 * `makeEmployee`, and they compose — a spec that needs a business with services
 * builds both rather than casting either.
 */
export function makeBusiness(partial: Partial<Business> = {}): Business {
  return {
    id: 'biz-test',
    name: 'Test business',
    slug: 'test-business',
    description: '',
    phone: '',
    email: 'business@example.test',
    address: '',
    timezone: 'Asia/Yerevan',
    settings: {},
    isActive: true,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: 'active',
    subscriptionPlanId: null,
    subscriptionCurrentPeriodEnd: null,
    members: [],
    services: [],
    employees: [],
    customers: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  } as Business;
}
