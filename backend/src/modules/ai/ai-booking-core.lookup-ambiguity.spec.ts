/**
 * tech-debt D5 slice 6 — the two read-only lookups refuse a guessed name.
 *
 * Read-only does not mean low-stakes here. `lookup_customer` answers with the
 * customer's *full detail record* — contact details and visit history — so a
 * tie hands back one person's record in response to a question about a
 * different person who happens to share their name.
 *
 * `lookup_service_assignment` is milder (the wrong namesake's service list),
 * but it is the same defect and the same fix.
 */
import { AiBookingCoreService } from './ai-booking-core.service.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';

/**
 * `customerService` is left null deliberately: it is only reached *after* a
 * customer resolves, so any test that slips past the refusal throws instead of
 * quietly passing.
 */
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
  undefined as any, // slotResolver
  undefined as any, // customerService — must not be reached on a tie
);

const cust = (id: string, name: string) => ({ id, name }) as Customer;
const emp = (id: string, name: string, serviceIds: string[] = []) =>
  ({ id, name, serviceIds }) as Employee;

const TIED_CUST = [cust('c1', 'John Smith'), cust('c2', 'John Smith')];
const TIED_EMP = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];

const lookupCustomer = (customers: Customer[], customerName: string) =>
  service.handleLookupCustomer('b1', { customerName }, customers);

// The discriminator is `assignmentLookup`, and `prompt` is left undefined so
// `enrichDashboardLookupAssignmentParams` cannot re-derive it from text and
// override the explicit value.
const lookupAssignment = (employees: Employee[], employeeName: string) =>
  service.handleLookupServiceAssignment('b1', employees, [] as Service[], {
    employeeName,
    assignmentLookup: 'services_for_provider',
  });

describe('tech-debt D5 — lookup_customer refuses to answer about a guessed person', () => {
  it('refuses when two customers share the name', async () => {
    const r = await lookupCustomer(TIED_CUST, 'John Smith');
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which customer/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('a genuine miss still reports "no customer found"', async () => {
    const r = await lookupCustomer(TIED_CUST, 'Zebediah');
    expect(r.success).toBe(false);
    expect(r.summary).toBe('No customer found matching "Zebediah".');
  });

  it('the "which customer should I look up" prompt is unchanged', async () => {
    const r = await lookupCustomer(TIED_CUST, '');
    expect(r.summary).toMatch(/which customer should I look up/i);
  });

  it('an unambiguous name proceeds to the detail fetch', async () => {
    // customerService is null, so reaching it throws — asserted rather than
    // swallowed, so this cannot pass just because nothing happened.
    await expect(
      lookupCustomer([cust('c1', 'John Smith'), cust('c2', 'Mary Poppins')],
        'John Smith'),
    ).rejects.toThrow();
  });
});

describe('tech-debt D5 — lookup_service_assignment refuses a guessed provider', () => {
  it('refuses when a first name matches two providers', async () => {
    const r = await lookupAssignment(TIED_EMP, 'Anna');
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
    expect((r.details as any).candidates.map((c: any) => c.id).sort()).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('a genuine miss still reports "no provider found"', async () => {
    const r = await lookupAssignment(TIED_EMP, 'Zebediah');
    expect(r.success).toBe(false);
    expect(r.summary).toBe('No provider found matching "Zebediah".');
  });

  it('an unambiguous provider name is answered, not refused', async () => {
    const r = await lookupAssignment(TIED_EMP, 'Anna Petrova');
    expect(r.summary ?? '').not.toMatch(/which provider/i);
  });
});
