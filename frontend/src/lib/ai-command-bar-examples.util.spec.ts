import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { resolveCommandBarExamples } from './ai-command-bar-examples.util';

function tEn() {
  const messages = getMessages('en');
  return (key: string) => translate(messages, key);
}

describe('ai-command-bar-examples.util', () => {
  const tenant = {
    employees: [{ id: 'e1', name: 'Anna', isActive: true }],
    services: [{ id: 's1', name: 'Massage', isActive: true }],
  };

  it('returns dashboard examples from tenant context', () => {
    const examples = resolveCommandBarExamples({
      variant: 'dashboard',
      onboardingStep: 'type',
      tenant,
      t: tEn(),
    });
    expect(examples).toHaveLength(7);
    expect(examples.every((e) => e.trim().length > 0)).toBe(true);
    expect(examples).not.toEqual(
      resolveCommandBarExamples({
        variant: 'onboarding',
        onboardingStep: 'type',
        tenant,
        t: tEn(),
      }),
    );
  });

  it('returns onboarding step examples', () => {
    const examples = resolveCommandBarExamples({
      variant: 'onboarding',
      onboardingStep: 'review',
      tenant,
      t: tEn(),
    });
    expect(examples).toHaveLength(3);
    expect(examples[0]).toMatch(/catalog|service/i);
  });
});
