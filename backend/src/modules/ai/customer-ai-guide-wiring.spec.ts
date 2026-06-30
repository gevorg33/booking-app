import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CUSTOMER_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'customer-ai-command.service.ts'),
  'utf8',
);

describe('CustomerAiCommandService guide wiring (ai-guide-1.5.2 / 1.5.4 / 1.6.3)', () => {
  it('rescues and dispatches consumer app guide intents', () => {
    expect(CUSTOMER_SERVICE_SOURCE).toContain('rescueProductGuideIntent');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('enrichGuideTopicFromPrompt');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('dispatchCustomerAppGuideIntent');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('mergeCustomerActivationGuideContext');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('mapCustomerActivationGuideRoute');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('isAppGuideIntent(action)');
    expect(CUSTOMER_SERVICE_SOURCE).toContain('customer_app_guide');
  });
});
