import { describe, expect, it } from 'vitest';
import { getMessages, translate } from '@/i18n';
import { buildPublicAssistantExamples } from './public-assistant-examples.util';

describe('public-assistant-examples.util', () => {
  it('interpolates tenant service and provider names into action examples', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    const examples = buildPublicAssistantExamples(false, t, {
      providers: [{ id: 'p1', name: 'Maria' }],
      services: [{ id: 's1', name: 'Balayage', category: { name: 'Color' } }],
    });
    expect(examples[0]).toContain('Balayage');
    expect(examples[1]).toContain('Balayage');
    expect(examples[2]).toContain('Balayage');
  });
});
