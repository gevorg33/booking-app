import { describe, expect, it, vi } from 'vitest';
import {
  MOBILE_GUIDE_ASSISTANT_SEED_EVENT,
  formatGuideTopicAskPrompt,
} from '@mobile-guide/mobile-guide-topic-ask.util.ts';
import {
  buildProviderGuideTopicAskPrompt,
  fireProviderGuideAssistantSeed,
} from './provider-guide-assistant-seed.util';

describe('provider-guide-assistant-seed (ai-guide-1.9.15)', () => {
  it('builds walk-through prompt from topic title', () => {
    expect(
      buildProviderGuideTopicAskPrompt(
        'Getting started in the provider app',
        'Walk me through {topic}',
      ),
    ).toBe('Walk me through Getting started in the provider app');
  });

  it('fires assistant seed event with topicId and prompt', () => {
    const listener = vi.fn();
    window.addEventListener(MOBILE_GUIDE_ASSISTANT_SEED_EVENT, listener);

    fireProviderGuideAssistantSeed({
      topicId: 'provider-getting-started',
      topicTitle: 'Getting started in the provider app',
      walkThroughTemplate: 'Walk me through {topic}',
    });

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0]?.[0] as CustomEvent;
    expect(event.detail).toEqual({
      topicId: 'provider-getting-started',
      prompt: 'Walk me through Getting started in the provider app',
    });

    window.removeEventListener(MOBILE_GUIDE_ASSISTANT_SEED_EVENT, listener);
  });

  it('shares formatGuideTopicAskPrompt helper with mobile guide package', () => {
    expect(formatGuideTopicAskPrompt('Calendar tab', 'Walk me through {topic}')).toBe(
      'Walk me through Calendar tab',
    );
  });
});
