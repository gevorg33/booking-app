import {
  CUSTOMER_ADOPT_6_CLASSIFIER_RULES,
  CUSTOMER_ADOPT_6_GROWTH_INTENTS,
  CUSTOMER_ADOPT_6_PROMPT_SCENARIOS,
} from './ai-adopt-6-growth-loops.fixtures.js';
import { rescueAdopt6GrowthIntent } from './ai-adopt-6-growth-loops.util.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { CUSTOMER_INTENTS } from './ai-command-registry.build.js';

describe('ai-adopt-6-growth-loops integration (adopt-6.6)', () => {
  it('registers all adopt-6 customer intents on the customer surface', () => {
    for (const intent of CUSTOMER_ADOPT_6_GROWTH_INTENTS) {
      expect(CUSTOMER_INTENTS).toContain(intent);
    }
  });

  it('wires adopt-6 classifier rules into buildCustomerClassifierSchema', () => {
    const schema = buildCustomerClassifierSchema();
    expect(schema).toContain(CUSTOMER_ADOPT_6_CLASSIFIER_RULES.trim().slice(0, 40));
    for (const intent of CUSTOMER_ADOPT_6_GROWTH_INTENTS) {
      expect(schema).toContain(intent);
    }
  });

  it.each(CUSTOMER_ADOPT_6_PROMPT_SCENARIOS)(
    '$id rescues to $action on consumer surface',
    ({ prompt, action }) => {
      const rescued = rescueAdopt6GrowthIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(action);
    },
  );
});
