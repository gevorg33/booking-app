/**
 * F3 / e2e-bug.415 — the harness works, demonstrated on a real method body.
 *
 * `executeReadOnlySubIntent` is used as the proof because it is exactly the
 * shape F3 says is untestable: a private method on `AiCommandService` whose
 * behaviour lives in its own body. Until now the only way to reach it was
 * `Object.create(AiCommandService.prototype)` written out per spec — which this
 * session did twice — with no shared account of what the 73 dependencies are.
 */
import {
  createAiCommandServiceForTest,
  AI_COMMAND_SERVICE_DEPS,
} from './ai-command.service.test-harness.js';
import type { Employee } from '../employee/entities/employee.entity.js';

const emp = (id: string, name: string) => ({ id, name }) as Employee;
const TIED = [emp('e1', 'Anna Petrova'), emp('e2', 'Anna Kowalski')];

const CATALOG = {
  employees: TIED,
  services: [],
  customers: [],
  templates: [],
} as any;

describe('F3 — AiCommandService is constructible in a test', () => {
  it('builds without touching the 73-argument constructor', () => {
    const svc = createAiCommandServiceForTest();
    expect(svc).toBeInstanceOf(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./ai-command.service.js').AiCommandService,
    );
  });

  it('the dep list matches the constructor arity, so none is silently missing', () => {
    // The list is extracted from the constructor by hand, so a dependency added
    // later would be left `undefined` and surface as a confusing `TypeError`
    // inside whatever method a future test happens to call. `Function.length`
    // counts declared parameters before any default; none of these have
    // defaults, so it is exactly the injected-dependency count.
    expect(AI_COMMAND_SERVICE_DEPS).toHaveLength(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./ai-command.service.js').AiCommandService.length,
    );
  });

  it('stubs every declared dependency', () => {
    const svc = createAiCommandServiceForTest() as any;
    for (const dep of AI_COMMAND_SERVICE_DEPS) {
      expect(svc[dep]).toBeDefined();
    }
  });

  it('an unstubbed dependency member is a jest.fn, not a crash', () => {
    const svc = createAiCommandServiceForTest() as any;
    // Reaching for any method on any dependency yields a mock rather than a
    // TypeError, so a test fails on its assertion rather than on plumbing.
    expect(typeof svc.bookingCore.handleListBookings).toBe('function');
    expect(svc.bookingCore.handleListBookings()).toBeUndefined();
  });

  it('overrides replace a named dependency', () => {
    const bookingCore = { handleListBookings: jest.fn(() => 'sentinel') };
    const svc = createAiCommandServiceForTest({ bookingCore }) as any;
    expect(svc.bookingCore.handleListBookings()).toBe('sentinel');
  });
});

describe('F3 — a real method body is now assertable', () => {
  it('executeReadOnlySubIntent refuses a tied provider name', async () => {
    // The same assertion as ai-command.read-subintent-ambiguity.spec.ts, but
    // reached through the harness rather than a hand-rolled prototype object.
    const svc = createAiCommandServiceForTest() as any;
    const r = await svc.executeReadOnlySubIntent(
      'b1',
      'show annas bookings',
      'list_bookings',
      { employeeName: 'Anna' },
      CATALOG,
      'UTC',
    );
    expect(r.success).toBe(false);
    expect(r.summary).toMatch(/which provider/i);
  });

  it('delegates to the injected collaborator when the name is unambiguous', async () => {
    // Parameters are typed as `any[]` on purpose: the assertion below reads
    // call argument 4, and an untyped `jest.fn()` infers a zero-length
    // parameter tuple, so indexing it fails `tsc` while passing at runtime.
    const handleListBookings = jest.fn(async (..._args: any[]) => ({
      success: true,
      action: 'list_bookings',
      summary: 'ok',
    }));
    const svc = createAiCommandServiceForTest({
      bookingCore: { handleListBookings },
    }) as any;

    const r = await svc.executeReadOnlySubIntent(
      'b1',
      'show annas bookings',
      'list_bookings',
      { employeeName: 'Anna Petrova' },
      CATALOG,
      'UTC',
    );

    expect(handleListBookings).toHaveBeenCalledTimes(1);
    // The resolved provider's name is threaded through as the scope label —
    // a property of this method body, which F3 says could previously only be
    // asserted by comment.
    expect(handleListBookings.mock.calls[0][4]).toBe('Anna Petrova');
    expect(r.success).toBe(true);
  });
});
