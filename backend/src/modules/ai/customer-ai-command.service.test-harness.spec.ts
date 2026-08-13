/**
 * F3 / e2e-bug.415 — the customer-side harness works.
 *
 * Kept deliberately thin. The dashboard harness spec already demonstrates the
 * pattern on a real method body; what this needs to establish is only that the
 * second service is constructible and that its dependency list is complete and
 * honest.
 *
 * The completeness check is the one that matters: the dep list is extracted
 * from the constructor by hand, so a dependency added later would silently be
 * left `undefined` and surface as a confusing `TypeError` inside whatever
 * method a future test calls. Asserting the count against the constructor's own
 * arity turns that into a named failure here instead.
 */
import {
  createCustomerAiCommandServiceForTest,
  CUSTOMER_AI_COMMAND_SERVICE_DEPS,
} from './customer-ai-command.service.test-harness.js';
import { CustomerAiCommandService } from './customer-ai-command.service.js';

describe('F3 — CustomerAiCommandService is constructible in a test', () => {
  it('builds without touching the 43-argument constructor', () => {
    expect(createCustomerAiCommandServiceForTest()).toBeInstanceOf(
      CustomerAiCommandService,
    );
  });

  it('the dep list matches the constructor arity, so none is silently missing', () => {
    // `Function.length` counts declared parameters before any default. None of
    // these have defaults, so it is exactly the injected-dependency count.
    expect(CUSTOMER_AI_COMMAND_SERVICE_DEPS).toHaveLength(
      CustomerAiCommandService.length,
    );
  });

  it('stubs every declared dependency', () => {
    const svc = createCustomerAiCommandServiceForTest() as any;
    for (const dep of CUSTOMER_AI_COMMAND_SERVICE_DEPS) {
      expect(svc[dep]).toBeDefined();
    }
  });

  it('overrides replace a named dependency', () => {
    const payments = { handleThing: jest.fn(() => 'sentinel') };
    const svc = createCustomerAiCommandServiceForTest({ payments }) as any;
    expect(svc.payments.handleThing()).toBe('sentinel');
  });
});
