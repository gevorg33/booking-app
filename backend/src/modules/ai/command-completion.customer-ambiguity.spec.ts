/**
 * e2e-bug.362 (D5) — the first `fuzzyMatchByName` caller migrated onto the §46
 * resolver, tested through `resolve()` rather than through a hand-built
 * `entities` object.
 *
 * That distinction matters: the previous attempt at this ticket asserted on
 * entities it constructed itself, so it passed with and without the change and
 * proved nothing. These drive the real pipeline, so removing the fix fails them.
 */
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { validateCommand } from './command-completion.validator.js';

const cust = (id: string, name: string) => ({ id, name }) as any;

const resolve = (customers: any[], customerName: string) =>
  new CommandCompletionPipelineService().resolve(
    'b1',
    `book ${customerName} in`,
    {
      action: 'create_booking',
      params: {
        customerName,
        serviceName: 'Haircut',
        date: '26_05_2026',
        timeSlot: '09:00',
      },
      reasoning: '',
      confidence: 0.9,
    } as any,
    {
      employees: [],
      services: [cust('s1', 'Haircut')],
      customers,
      templates: [],
    } as any,
  );

describe('e2e-bug.362 — customer resolution refuses to pick between namesakes', () => {
  it('leaves customer unresolved when two people share the name', () => {
    const r = resolve(
      [cust('c1', 'John Smith'), cust('c2', 'John Smith')],
      'John Smith',
    );
    expect(r.entities.customer).toBeUndefined();
    expect(r.entities.customers?.map((c) => c.id).sort()).toEqual(['c1', 'c2']);
  });

  it('leaves customer unresolved when a first name matches two people', () => {
    const r = resolve(
      [cust('c1', 'John Smith'), cust('c2', 'John Baker')],
      'John',
    );
    expect(r.entities.customer).toBeUndefined();
    expect(r.entities.customers).toHaveLength(2);
  });

  it('still resolves an unambiguous customer', () => {
    const r = resolve(
      [cust('c1', 'John Smith'), cust('c2', 'Mary Poppins')],
      'John Smith',
    );
    expect(r.entities.customer?.id).toBe('c1');
    expect(r.entities.customers).toBeUndefined();
  });

  it('still finds nobody when nobody matches', () => {
    const r = resolve([cust('c1', 'John Smith')], 'Zebediah');
    expect(r.entities.customer).toBeUndefined();
    expect(r.entities.customers).toBeUndefined();
  });

  it('asks which customer rather than claiming none exists', () => {
    const r = resolve(
      [cust('c1', 'John Smith'), cust('c2', 'John Smith')],
      'John Smith',
    );
    const issue = validateCommand(r).issues.find(
      (i) => i.field === 'customerName',
    );
    expect(issue).toBeDefined();
    expect(issue!.message).toMatch(/more than one customer/i);
    expect(issue!.message).not.toMatch(/could not find/i);
  });

  it('still says "could not find" for a genuine miss', () => {
    const r = resolve([cust('c1', 'John Smith')], 'Zebediah');
    const issue = validateCommand(r).issues.find(
      (i) => i.field === 'customerName',
    );
    expect(issue).toBeDefined();
    expect(issue!.message).toMatch(/could not find/i);
  });
});
