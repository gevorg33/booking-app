import { Employee } from './employee.entity.js';

/**
 * Build a complete `Employee` for tests.
 *
 * F1 / e2e-bug.359 — third builder in the same family, and the file that needed
 * it shows why they come in sets: `ai-category-assignment.util.spec.ts` builds
 * services, categories **and** employees by hand, so it kept reporting missing
 * fields until each of the three had a builder. Wrapping only the services
 * moved the complaint to the nested category; wrapping those moved it to the
 * employees.
 *
 * Defaults are inert: an active employee with no services, no user link and no
 * relations loaded. Callers override what their assertion is about.
 */
export function makeEmployee(partial: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-test',
    business: undefined as unknown as Employee['business'],
    businessId: 'biz-test',
    user: undefined as unknown as Employee['user'],
    userId: 'user-test',
    name: 'Test employee',
    email: 'employee@example.test',
    phone: '',
    serviceIds: [],
    metadata: {},
    isActive: true,
    bookings: [],
    scheduleAssignments: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...partial,
  } as Employee;
}
