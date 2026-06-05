import {
  buildIntelligenceClassifierAppendix,
  extractIntelligenceBlocks,
  stripIntelligenceKeysFromSessionContext,
} from './ai-intelligence-context.util.js';

describe('ai-intelligence-context.util', () => {
  it('extracts intelligence blocks from gateway context', () => {
    expect(
      extractIntelligenceBlocks({
        _entityMemoryBlock: 'memory',
        _conversationSummary: 'summary',
        _ragContextBlock: 'rag',
        _capabilityHints: 'hints',
      }),
    ).toEqual({
      entityMemoryBlock: 'memory',
      conversationSummary: 'summary',
      ragContextBlock: 'rag',
      capabilityHints: 'hints',
    });
  });

  it('builds classifier appendix in stable order', () => {
    const appendix = buildIntelligenceClassifierAppendix({
      capabilityHints: 'hints',
      entityMemoryBlock: 'memory',
      conversationSummary: 'summary',
      ragContextBlock: 'rag',
    });
    expect(appendix.indexOf('hints')).toBeLessThan(appendix.indexOf('memory'));
    expect(appendix).toContain('rag');
  });

  it('strips internal intelligence keys from session context', () => {
    expect(
      stripIntelligenceKeysFromSessionContext({
        _entityMemoryBlock: 'x',
        customerName: 'John',
      }),
    ).toEqual({ customerName: 'John' });
    expect(
      stripIntelligenceKeysFromSessionContext({ _ragContextBlock: 'only' }),
    ).toBeUndefined();
  });
});
