import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import { buildProviderAiExamples } from './provider-ai-examples';

describe('buildProviderAiExamples', () => {
  it('interpolates tenant service names into action examples', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    const examples = buildProviderAiExamples(t, {
      employees: [{ id: 'e1', name: 'Maria', isActive: true }],
      services: [{ id: 's1', name: 'Balayage', categoryName: 'Color', isActive: true }],
    });
    expect(examples).toHaveLength(8);
    expect(examples[1]).toContain('Balayage');
    expect(examples[1]).not.toContain('John');
  });

  it('uses fallback service name without tenant catalog', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    const examples = buildProviderAiExamples(t);
    expect(examples[1]).toContain(translate(en, 'provider.fallbackService'));
  });
});
