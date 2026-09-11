import { Service } from './service.entity.js';
import { ServiceCategory } from './service-category.entity.js';
import { PrepaymentMode } from './service.entity.js';

/**
 * Build a complete `Service` for tests.
 *
 * F1 / e2e-bug.359 — the same reasoning as `makeResolvedCommand`: specs build
 * minimal service literals (`{ id, name, categoryId }`) and pass them where
 * `Service[]` is expected, so TypeScript reports the twenty-odd fields they
 * omit. Patching the omissions one at a time does not converge — each fix
 * exposes the next missing field on the same literal.
 *
 * Constructing the value instead satisfies the whole type at once, and adding a
 * column to the entity later breaks this one file rather than every spec that
 * ever built the shape by hand.
 *
 * Defaults are inert: an active, uncategorised, zero-deposit service. Callers
 * override exactly the fields their assertion is about, which also makes those
 * fields the visible subject of the test.
 */
export function makeService(partial: Partial<Service> = {}): Service {
  return {
    id: 'svc-test',
    business: undefined as unknown as Service['business'],
    businessId: 'biz-test',
    category: null,
    categoryId: null,
    name: 'Test service',
    description: '',
    durationMinutes: 30,
    bufferMinutes: 0,
    price: 0,
    currency: 'AMD',
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
    isActive: true,
    metadata: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  } as Service;
}

/**
 * Build a complete `ServiceCategory` for tests.
 *
 * Needed alongside `makeService` rather than after it: wrapping the service
 * literals moved the error *inward* to the nested `category: { id, name }`,
 * which is the same missing-fields complaint one level down. Builders only
 * converge when every nested entity has one — that is the difference between
 * this approach and patching properties, which reveals the next gap forever.
 */
export function makeServiceCategory(
  partial: Partial<ServiceCategory> = {},
): ServiceCategory {
  return {
    id: 'cat-test',
    business: undefined as unknown as ServiceCategory['business'],
    businessId: 'biz-test',
    name: 'Test category',
    description: '',
    sortOrder: 0,
    isActive: true,
    metadata: {},
    services: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  } as ServiceCategory;
}
