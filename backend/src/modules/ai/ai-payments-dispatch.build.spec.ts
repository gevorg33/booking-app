import { COMMAND_REGISTRY } from './ai-command-registry.js';
import {
  PAYMENTS_LOGIC_DISPATCH_MAP,
  buildPaymentsLogicDispatchMap,
} from './ai-payments-dispatch.build.js';
import {
  DASHBOARD_PAYMENTS_MUTATE_INTENTS,
  DASHBOARD_PAYMENTS_READ_INTENTS,
  PROVIDER_PAYMENTS_INTENTS,
} from './ai-payments.util.js';
import { listAiPaymentsServiceRegistryIntentIds } from './ai-payments-dispatch.util.js';

describe('ai-payments-dispatch.build (ai-cmd-ext-6.2)', () => {
  it('builds a stable map at module init', () => {
    expect(PAYMENTS_LOGIC_DISPATCH_MAP.size).toBe(
      buildPaymentsLogicDispatchMap().size,
    );
    expect(PAYMENTS_LOGIC_DISPATCH_MAP.size).toBe(30);
  });

  it('maps every dashboard payments intent', () => {
    const dashboardPayments = [
      ...DASHBOARD_PAYMENTS_MUTATE_INTENTS,
      ...DASHBOARD_PAYMENTS_READ_INTENTS,
    ];
    const missing = dashboardPayments.filter(
      (id) => !PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect(missing).toEqual([]);
  });

  it('maps every provider payments intent', () => {
    const missing = PROVIDER_PAYMENTS_INTENTS.filter(
      (id) => !PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect(missing).toEqual([]);
  });

  it('maps every registry AiPaymentsService intent', () => {
    const registryIds = listAiPaymentsServiceRegistryIntentIds();
    const missing = registryIds.filter(
      (id) => !PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect({ missing, registryIds }).toEqual({
      missing: [],
      registryIds,
    });
  });

  it('does not include non-payments registry handlers', () => {
    const currencyOnly = COMMAND_REGISTRY.filter(
      (entry) => entry.handler === 'AiBusinessCurrencyService',
    ).map((entry) => entry.id);
    const leaked = currencyOnly.filter((id) =>
      PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect(leaked).toEqual([]);
  });
});
