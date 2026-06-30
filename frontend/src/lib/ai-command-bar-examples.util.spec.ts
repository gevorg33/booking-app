import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { resolveCommandBarExamples } from './ai-command-bar-examples.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string, vars?: Record<string, string | number>) =>
    translate(messages, key, vars);
}

describe('ai-command-bar-examples.util', () => {
  const tenant = {
    employees: [{ id: 'e1', name: 'Anna', isActive: true }],
    services: [{ id: 's1', name: 'Massage', isActive: true }],
  };

  it('returns mixed guide-first dashboard examples for a route', () => {
    const examples = resolveCommandBarExamples({
      variant: 'dashboard',
      onboardingStep: 'type',
      tenant,
      t: tEn(),
      pathname: '/dashboard/schedule',
      guideMode: false,
    });
    expect(examples).toHaveLength(7);
    expect(examples.every((e) => e.trim().length > 0)).toBe(true);
    expect(examples[0]).toMatch(/this page/i);
    expect(examples[1]).toMatch(/How do I set up a weekly schedule on this page/i);
    expect(examples[3]).toMatch(/template|schedule|week/i);
  });

  it('returns guide-only examples when guide mode is on', () => {
    const examples = resolveCommandBarExamples({
      variant: 'dashboard',
      onboardingStep: 'type',
      tenant,
      t: tEn(),
      pathname: '/dashboard/schedule',
      guideMode: true,
    });
    expect(examples).toHaveLength(3);
    expect(examples.every((e) => /how|what|walk|explain/i.test(e))).toBe(true);
  });

  it('returns onboarding setup playbooks with one action example', () => {
    const examples = resolveCommandBarExamples({
      variant: 'onboarding',
      onboardingStep: 'review',
      tenant,
      t: tEn(),
      pathname: '/dashboard/onboarding',
      guideMode: false,
    });
    expect(examples).toHaveLength(4);
    expect(examples[0]).toMatch(/service catalog|add a service/i);
    expect(examples[1]).toMatch(/Walk me through Employees & access/i);
    expect(examples[3]).toMatch(/catalog|service/i);
  });

  it('ai-guide-1.3.5 — returns guide-only onboarding examples when help chip is on', () => {
    const examples = resolveCommandBarExamples({
      variant: 'onboarding',
      onboardingStep: 'review',
      tenant,
      t: tEn(),
      pathname: '/dashboard/onboarding',
      guideMode: true,
    });
    expect(examples).toHaveLength(3);
    expect(examples.every((e) => /how|what|walk|explain/i.test(e))).toBe(true);
  });
});
