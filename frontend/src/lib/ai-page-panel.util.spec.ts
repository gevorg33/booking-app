import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  aiPagePanelHasSuggestions,
  resolveAiPagePanelGroups,
} from './ai-page-panel.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string) => translate(messages, key);
}

describe('ai-page-panel.util', () => {
  const t = tEn();

  it('resolves onboarding guided groups by step', () => {
    const groups = resolveAiPagePanelGroups({
      route: '/dashboard/onboarding',
      onboardingStep: 'schedule',
      t,
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('guided');
    expect(groups[0].items.length).toBe(3);
  });

  it('resolves grouped customer retention prompts', () => {
    const groups = resolveAiPagePanelGroups({
      route: '/dashboard/customers',
      t,
    });
    expect(groups).toHaveLength(2);
    expect(groups[0].id).toBe('retention');
    expect(groups[0].items[0]).toContain('no-show');
    expect(groups[0].items[1]).toMatch(/inactive|Re-engage/i);
  });

  it('resolves grouped report insights with utilization drop prompt', () => {
    const groups = resolveAiPagePanelGroups({
      route: '/dashboard/reports',
      t,
    });
    expect(groups[0].id).toBe('insights');
    expect(groups[0].items[0]).toMatch(/utilization/i);
  });

  it('uses explicit suggestions when route is empty', () => {
    const groups = resolveAiPagePanelGroups({
      route: '',
      suggestions: ['Custom prompt A'],
      t,
    });
    expect(groups).toEqual([
      { id: 'commands', label: t('ai.quickCommands'), items: ['Custom prompt A'] },
    ]);
  });

  it('returns empty when no route or suggestions', () => {
    expect(resolveAiPagePanelGroups({ route: '', t })).toEqual([]);
    expect(aiPagePanelHasSuggestions([])).toBe(false);
  });

  it('detects non-empty suggestion groups', () => {
    expect(
      aiPagePanelHasSuggestions([{ id: 'x', label: 'X', items: ['one'] }]),
    ).toBe(true);
    expect(
      aiPagePanelHasSuggestions([{ id: 'x', label: 'X', items: [] }]),
    ).toBe(false);
  });
});
