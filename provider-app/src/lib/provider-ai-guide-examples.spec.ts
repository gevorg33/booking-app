import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import {
  buildProviderAiGuideExamples,
  resolveProviderAiExamples,
} from './provider-ai-guide-examples';

describe('provider-ai-guide-examples (ai-guide-1.0.3)', () => {
  it('returns guide-shaped examples when guide mode is active', () => {
    const en = getMessages('en');
    const t = (key: string) => translate(en, key);
    expect(resolveProviderAiExamples(t, true)[0]).toBe(
      translate(en, 'provider.exampleGuideToday'),
    );
    expect(buildProviderAiGuideExamples(t).length).toBe(4);
  });
});
