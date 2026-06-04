import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import { buildProviderAiExamples } from './provider-ai-examples';

describe('buildProviderAiExamples', () => {
  it('returns four example prompts from the catalog', () => {
    const en = getMessages('en');
    const examples = buildProviderAiExamples((key) => translate(en, key));
    expect(examples).toEqual([
      translate(en, 'provider.exampleSickCancel'),
      translate(en, 'provider.exampleMarkJohn'),
      translate(en, 'provider.exampleMarkAllPaid'),
      translate(en, 'provider.exampleScheduleToday'),
    ]);
  });
});
