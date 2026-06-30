import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  ORCHESTRIX_OPEN,
  ORCHESTRIX_RUN,
} from './orchestrix-events';
import {
  fireGuideAssistantSeedForTopic,
  fireGuideAssistantSeedFromHash,
  readGuidePageHashAnchor,
  resolveGuideAssistantSeedFromAnchor,
} from './dashboard-guide-hash.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, vars);
}

describe('dashboard-guide-hash.util', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads normalized guide page hash anchors', () => {
    expect(readGuidePageHashAnchor('#schedule')).toBe('schedule');
    expect(readGuidePageHashAnchor('')).toBeNull();
    expect(readGuidePageHashAnchor('#unknown-section')).toBe('unknown-section');
  });

  it('resolves corpus topicIds from guide anchors', () => {
    expect(resolveGuideAssistantSeedFromAnchor('schedule')).toEqual({
      topicId: 'dashboard.core.schedule',
      anchor: 'schedule',
    });
    expect(resolveGuideAssistantSeedFromAnchor('not-a-topic')).toBeNull();
  });

  it('fires guide-mode Orchestrix run for a topic', () => {
    fireGuideAssistantSeedForTopic('dashboard.core.schedule', tEn());
    const calls = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0].type).toBe(ORCHESTRIX_RUN);
    expect(calls[0][0].detail).toEqual({
      prompt: 'Walk me through Schedule',
      autoSubmit: true,
      assistantMode: 'guide',
      guideTopicId: 'dashboard.core.schedule',
    });
    expect(calls[1][0].type).toBe(ORCHESTRIX_OPEN);
  });

  it('seeds assistant from hash fragments', () => {
    expect(fireGuideAssistantSeedFromHash(tEn(), '#ai-command-bar')).toBe(true);
    expect(fireGuideAssistantSeedFromHash(tEn(), '#missing')).toBe(false);

    const runEvent = (window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(runEvent.detail.guideTopicId).toBe('dashboard.ai.command-bar');
  });
});
