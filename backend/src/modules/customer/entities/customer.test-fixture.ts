import { Customer } from './customer.entity.js';

/**
 * Build a complete `Customer` for tests.
 *
 * Same reasoning as `makeService` / `makeBusiness`: specs build minimal customer
 * literals (`{ id, name, businessId, isActive }`) and hand them where `Customer[]`
 * is expected, so TypeScript reports the nine fields they omit. Patching those one
 * at a time does not converge — each fix exposes the next.
 *
 * This became reachable only after `*LogicDeps` stopped demanding the full
 * `Pick<Repository<Customer>, 'find'>`: while the untestable `save`/`find`
 * overloads were the reported error, the incomplete literal underneath was
 * invisible.
 *
 * Defaults are inert: an active, non-VIP, untagged customer with no bookings.
 * Callers override exactly the fields their assertion is about.
 */
export function makeCustomer(partial: Partial<Customer> = {}): Customer {
  return {
    id: 'cust-test',
    business: undefined as unknown as Customer['business'],
    businessId: 'biz-test',
    name: 'Test customer',
    email: 'customer@example.test',
    phone: '',
    metadata: {},
    tags: [],
    isVip: false,
    isActive: true,
    bookings: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  };
}
