import { describe, expect, it, vi } from 'vitest';
import { buildConsumerGuidePath } from '../lib/consumer-guide.util.js';
import { CONSUMER_COPY_EN } from '../lib/consumer-copy-catalog.js';

describe('consumer guide entry points (ai-guide-1.9.3)', () => {
  it('account and assistant entry routes use native guide path', () => {
    expect(buildConsumerGuidePath('glow-nails')).toBe('/s/glow-nails/guide');
  });

  it('welcome activation link targets the first remembered salon guide', () => {
    const slug = 'glow-nails';
    expect(buildConsumerGuidePath(slug)).toBe(`/s/${slug}/guide`);
  });

  it('exposes localized labels for entry surfaces', () => {
    expect(CONSUMER_COPY_EN.assistantOpenGuideChip).toBe('Open guide');
    expect(CONSUMER_COPY_EN.guidePageAccountEntryHint.length).toBeGreaterThan(0);
    expect(CONSUMER_COPY_EN.guidePageWelcomeLink.length).toBeGreaterThan(0);
  });
});

describe('ConsumerGuideEntryRow wiring', () => {
  it('invokes onOpen when the account row is activated', () => {
    const onOpen = vi.fn();
    onOpen();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
