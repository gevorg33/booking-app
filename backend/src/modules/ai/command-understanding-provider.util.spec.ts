import { buildProviderClassifierContext } from './command-understanding-provider.util.js';

describe('command-understanding-provider.util (pipe-1.12.2)', () => {
  it('buildProviderClassifierContext includes view mode and session appendix', () => {
    const context = buildProviderClassifierContext({
      providerName: 'Maria',
      viewMode: 'provider',
      sessionContext: { lastPush: { bookingId: 'b1' } },
      pipelineContext: {
        originalPrompt: 'mark paid',
        normalizedPrompt: 'mark paid',
        classifierContext: null,
        method: 'passthrough',
      },
    });

    expect(context).toContain('Maria');
    expect(context).toContain('own appointments only');
  });
});
