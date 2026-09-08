/**
 * tech-debt D5-b — the injected resolver callbacks refuse a tie.
 *
 * The compound services (CRM, catalog, subscription-credit) resolve customer
 * names they parse out of the prompt themselves, so — unlike D5-a's handlers —
 * the caller cannot guard them: it does not know the names yet. That is why
 * this item was filed as a callee-contract change.
 *
 * It was not one *at the time*: the callback signature was `(list, name) =>
 * Customer | undefined`, and `undefined` already means "ask the user" on every
 * callee, so refusing a tie needed no new channel. e2e-bug.488 later revisited
 * that — sharing the not-found channel is safe but tells the caller the name is
 * unknown when it matched twice — and added an **optional** third parameter so
 * a tie can also name its candidates. The refusal below is unchanged; only the
 * message the callee can build on top of it is richer. For the original:
 * `ai-customer-crm.logic.ts` answers it with
 * `failure(..., 'Specify which customer …', { clarify: true, missing:
 * ['customerName'] })`. So a tie can use the channel that already exists,
 * exactly as D5-a's `buildCreateBookingPlanOnly` uses `null`.
 *
 * Before this, `resolveCustomer` → `fuzzyMatchByName` → first-on-ties, so a
 * compound mutated whichever namesake sorted first.
 */
import { createAiCommandServiceForTest } from './ai-command.service.test-harness.js';
import type { Customer } from '../customer/entities/customer.entity.js';

const cus = (id: string, name: string) => ({ id, name }) as Customer;
const TIED = [cus('c1', 'John Smith'), cus('c2', 'John Smyth')];
const UNIQUE = [cus('c1', 'John Smith'), cus('c2', 'Mary Jones')];

const strict = (list: Customer[], name: string) =>
  (createAiCommandServiceForTest() as any).resolveCustomerStrict(list, name);

describe('D5-b — resolveCustomerStrict', () => {
  it('returns undefined for a tie instead of the first namesake', () => {
    expect(strict(TIED, 'John')).toBeUndefined();
  });

  it('still resolves an unambiguous name', () => {
    expect(strict(UNIQUE, 'John')?.id).toBe('c1');
  });

  it('resolves an exact full name even when a namesake exists', () => {
    // The tie is on the partial "John"; the full name is not ambiguous.
    expect(strict(TIED, 'John Smith')?.id).toBe('c1');
  });

  it('returns undefined for a name that matches nobody', () => {
    // Unchanged behaviour — the callee already renders this as "specify which
    // customer", which is why a tie can safely share the channel.
    expect(strict(UNIQUE, 'Zebediah')).toBeUndefined();
  });
});

describe('D5-b — resolveEmployeeStrict', () => {
  const emp = (id: string, name: string) => ({ id, name }) as any;
  const TIED_E = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];
  const UNIQUE_E = [emp('e1', 'Anna Petrova'), emp('e2', 'Bob Stone')];
  const strictEmp = (list: any[], name: string) =>
    (createAiCommandServiceForTest() as any).resolveEmployeeStrict(list, name);

  it('returns undefined for a tie', () => {
    expect(strictEmp(TIED_E, 'Anna')).toBeUndefined();
  });

  it('still resolves an unambiguous provider', () => {
    expect(strictEmp(UNIQUE_E, 'Anna')?.id).toBe('e1');
  });
});

describe('D5-b — the callbacks handed to compound services use it', () => {
  const SRC = require('node:fs').readFileSync(
    require('node:path').join(__dirname, 'ai-command.service.ts'),
    'utf8',
  ) as string;

  it('no compound callback still injects the silent-pick resolver', () => {
    // The whole point is that every injection site moved. A new one written
    // the old way reintroduces the defect silently.
    expect(SRC).not.toContain('this.resolveCustomer(list, name)');
  });

  it('the strict resolver is actually injected somewhere', () => {
    // Guards against the assertion above passing because the callbacks were
    // deleted rather than migrated.
    expect(SRC).toContain('this.resolveCustomerStrict(list, name, onAmbiguous)');
  });

  it('the provider callback migrated too', () => {
    expect(SRC).toContain('this.resolveEmployeeStrict(list, name, onAmbiguous)');
    expect(SRC).not.toMatch(/resolveEmployee: \(list, name\) =>\s*\n\s*this\.resolveEmployee\(list, name\)/);
  });

  /**
   * e2e-bug.488 — every injection site must forward the ambiguity channel.
   *
   * The third parameter is optional so that callees could adopt it one at a
   * time, which means a site that simply omits it still compiles and still
   * behaves correctly — it just silently goes back to reporting a tie as
   * "Specify which customer", the exact defect 488 was filed for. Nothing in
   * the type system can catch that, so it is asserted here.
   */
  it('no injection site drops the ambiguity channel', () => {
    expect(SRC).not.toMatch(
      /this\.resolve(?:Customer|Employee)Strict\(list, name\)/,
    );
  });

  it('the strict resolvers accept the ambiguity callback', () => {
    // Pins the declarations, so the assertions above cannot be satisfied by a
    // call site that passes an argument the method does not take.
    expect(SRC).toMatch(
      /private resolveCustomerStrict\([\s\S]{0,200}?onAmbiguous\?: OnAmbiguousName,/,
    );
    expect(SRC).toMatch(
      /private resolveEmployeeStrict\([\s\S]{0,200}?onAmbiguous\?: OnAmbiguousName,/,
    );
  });
});
