import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROVIDER_SERVICE_SOURCE = readFileSync(
  join(__dirname, '../provider-mobile/provider-ai-command.service.ts'),
  'utf8',
);

describe('ProviderAiCommandService guide wiring (ai-guide-1.4.1 / 1.6.3 / 1.8.6)', () => {
  it('rescues and enriches product guide intents on provider entry path', () => {
    expect(PROVIDER_SERVICE_SOURCE).toContain('rescueProductGuideIntent');
    expect(PROVIDER_SERVICE_SOURCE).toContain('enrichGuideTopicFromPrompt');
    expect(PROVIDER_SERVICE_SOURCE).toContain('dispatchProviderProductGuideIntent');
    expect(PROVIDER_SERVICE_SOURCE).toContain('dispatchProviderAppGuideIntent');
    expect(PROVIDER_SERVICE_SOURCE).toContain('runSurfaceProductGuideIntent');
    expect(PROVIDER_SERVICE_SOURCE).toContain('isAppGuideIntent(parsed.action)');
  });
});
