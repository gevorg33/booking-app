/**
 * tech-debt D5 slice 2 — `AiBookingCoreService.handleCreateBooking` refuses to
 * book against a guessed customer.
 *
 * This is the mutating path, so the stakes differ from slice 1's completion
 * pipeline: there, a silent pick produced a wrong preview; here it writes a
 * booking onto the wrong person's record, which nobody notices until they
 * don't show up.
 *
 * Driven through the real `handleCreateBooking`, not through the private
 * resolver: a test of `resolveCustomerVerdict` alone would pass even if the
 * handler ignored the verdict entirely.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

// Repo-free for these inputs: `resolveCreateBookingServiceForParams` only
// touches `bookingRepo` for serviceRank === 'most_popular', and the ambiguity
// branch returns before any persistence. Same construction the e2e-333 spec
// uses for this service.
const service = new AiBookingCoreService(
  undefined as any, // bookingRepo
  undefined as any, // employeeRepo
  undefined as any, // serviceRepo
  undefined as any, // customerRepo
  undefined as any, // businessRepo
  undefined as any, // periodRepo
  undefined as any, // slotRepo
  undefined as any, // templateRepo
  undefined as any, // orchestration
  undefined as any, // planBuilder
  undefined as any, // scheduleHandlers
  undefined as any, // operations
  undefined as any, // schedulingEngine
  // slotResolver: reached only once a provider *is* resolved, which is exactly
  // the "not refused" cases below. Stubbed to report the slot unavailable so
  // those return a normal response instead of crashing on a null dependency —
  // the assertion is that the reply is not the ambiguity refusal, so any
  // deterministic non-refusal ending works.
  {
    checkSlotAvailability: async () => ({ available: false }),
    describeUnavailable: () => 'That time is not available.',
  } as any,
  undefined as any, // customerService
);

const cust = (id: string, name: string) => ({ id, name }) as Customer;
const SERVICES = [
  { id: 's1', name: 'Haircut', price: 30, durationMinutes: 30 },
] as unknown as Service[];

const book = (
  customers: Customer[],
  params: Record<string, unknown>,
  employees: Employee[] = [],
) =>
  service.handleCreateBooking(
    'biz-1',
    {
      serviceName: 'Haircut',
      date: '26_05_2026',
      timeSlot: '09:00',
      ...params,
    },
    employees,
    SERVICES,
    customers,
    undefined,
    'book them in',
  );

const emp = (id: string, name: string) => ({ id, name }) as Employee;

describe('tech-debt D5 — create_booking asks which customer instead of picking one', () => {
  it('refuses to book when two customers share the name', async () => {
    const r = await book([cust('c1', 'John Smith'), cust('c2', 'John Smith')], {
      customerName: 'John Smith',
    });
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which customer/i);
  });

  it('names the tied candidates so the caller can offer a choice', async () => {
    const r = await book([cust('c1', 'John Smith'), cust('c2', 'John Baker')], {
      customerName: 'John',
    });
    expect(r.success).toBe(false);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('an explicit customerId still wins outright, even when the name is a tie', async () => {
    const r = await book([cust('c1', 'John Smith'), cust('c2', 'John Smith')], {
      customerId: 'c2',
      customerName: 'John Smith',
    });
    // Not the ambiguity refusal: the id resolved it, so the handler proceeds
    // past customer resolution (and fails later, on repo access).
    expect(r.summary ?? '').not.toMatch(/which customer/i);
  });

  it('an unambiguous name still resolves and is not refused', async () => {
    const r = await book(
      [cust('c1', 'John Smith'), cust('c2', 'Mary Poppins')],
      { customerName: 'John Smith' },
    );
    expect(r.summary ?? '').not.toMatch(/which customer/i);
  });

  it('a genuine miss is not reported as ambiguity', async () => {
    const r = await book([cust('c1', 'John Smith')], {
      customerName: 'Zebediah',
    });
    expect(r.summary ?? '').not.toMatch(/which customer/i);
  });

  it('the missing-service message still wins when both are unresolved', async () => {
    const r = await book([cust('c1', 'John Smith'), cust('c2', 'John Smith')], {
      customerName: 'John Smith',
      serviceName: 'Nonexistent Service',
    });
    expect(r.success).toBe(false);
    expect(r.summary).not.toMatch(/which customer/i);
  });
});

describe('tech-debt D5 — create_booking asks which provider instead of picking one', () => {
  const TIED = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];

  it('refuses to book when a first name matches two providers', async () => {
    const r = await book([], { employeeName: 'Anna' }, TIED);
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('an explicit employeeId still wins outright, even when the name is a tie', async () => {
    const r = await book([], { employeeId: 'e2', employeeName: 'Anna' }, TIED);
    expect(r.summary ?? '').not.toMatch(/which provider/i);
  });

  it('an unambiguous provider name is not refused', async () => {
    const r = await book([], { employeeName: 'Anna Petrova' }, TIED);
    expect(r.summary ?? '').not.toMatch(/which provider/i);
  });

  it('no provider named at all is not refused — the slot picker handles it', async () => {
    const r = await book([], {}, TIED);
    expect(r.summary ?? '').not.toMatch(/which provider/i);
  });

  it('the plural employeeNames path is guarded too, not just the singular one', async () => {
    // Regression on slice 3: the singular guard reads `params.employeeName`,
    // but `providerPriority` is built from `params.employeeNames` FIRST, so
    // "book with Anna or Maria" reached the silent-pick matcher untouched.
    const r = await book([], { employeeNames: ['Anna'] }, TIED);
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('an unambiguous plural list is not refused', async () => {
    const r = await book([], { employeeNames: ['Anna Petrova'] }, TIED);
    expect(r.summary ?? '').not.toMatch(/which provider/i);
  });

  it('a tie anywhere in the list refuses, naming that entry', async () => {
    const r = await book([], { employeeNames: ['Anna Petrova', 'Anna'] }, TIED);
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
  });

  it('an ambiguous customer is reported before an ambiguous provider', async () => {
    // Both tie; the customer question is asked first so the user is not given
    // two questions at once.
    const r = await book(
      [cust('c1', 'John Smith'), cust('c2', 'John Smith')],
      { customerName: 'John Smith', employeeName: 'Anna' },
      TIED,
    );
    expect(r.summary).toMatch(/which customer/i);
  });
});
