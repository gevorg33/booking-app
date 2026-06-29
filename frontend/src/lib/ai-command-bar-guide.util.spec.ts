import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import {
  buildCommandBarGuideExamples,
  buildContextualGuidePromptForRoute,
  mixCommandBarFirstOpenExamples,
  resolveCommandBarRoute,
  resolveRouteGuidePlaybook,
  assertCommandBarGuideRouteCoverage,
} from './ai-command-bar-guide.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, vars);
}

describe('ai-command-bar-guide.util', () => {
  it('resolves nested dashboard paths to the nearest route key', () => {
    expect(resolveCommandBarRoute('/dashboard/schedule/templates')).toBe('/dashboard/schedule');
    expect(resolveCommandBarRoute('/dashboard/unknown')).toBe('/dashboard');
    expect(resolveCommandBarRoute(null)).toBe('/dashboard');
  });

  it('builds route-specific guide examples with contextual playbook prompt', () => {
    const schedule = buildCommandBarGuideExamples('/dashboard/schedule', tEn());
    const fallback = buildCommandBarGuideExamples('/dashboard/unknown', tEn());
    expect(schedule).toHaveLength(3);
    expect(schedule[0]).toMatch(/this page/i);
    expect(schedule[1]).toMatch(/How do I set up a weekly schedule on this page/i);
    expect(schedule[2]).toMatch(/schedule templates/i);
    expect(schedule).not.toEqual(fallback);
  });

  it('ai-guide-1.3.2 — builds contextual how-do-I-on-this-page from playbook task', () => {
    const playbook = resolveRouteGuidePlaybook('/dashboard/schedule');
    expect(playbook.topicId).toBe('dashboard.core.schedule');
    expect(buildContextualGuidePromptForRoute('/dashboard/schedule', tEn())).toBe(
      'How do I set up a weekly schedule on this page?',
    );
  });

  it('mixes guide-first examples when guide mode is off', () => {
    const mixed = mixCommandBarFirstOpenExamples({
      route: '/dashboard/schedule',
      guideExamples: ['g1', 'g2', 'g3'],
      actionExamples: ['a1', 'a2', 'a3', 'a4'],
      guideMode: false,
    });
    expect(mixed).toEqual(['g1', 'g2', 'g3', 'a1', 'a2', 'a3', 'a4']);
  });

  it('shows guide-only examples when guide mode is on', () => {
    const guideOnly = mixCommandBarFirstOpenExamples({
      route: '/dashboard/schedule',
      guideExamples: ['g1', 'g2', 'g3'],
      actionExamples: ['a1', 'a2'],
      guideMode: true,
    });
    expect(guideOnly).toEqual(['g1', 'g2', 'g3']);
  });

  it('ai-guide-1.1.6 — covers every dashboard nav route with guide prompts and playbooks', () => {
    expect(() => assertCommandBarGuideRouteCoverage()).not.toThrow();
  });
});
