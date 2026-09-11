/**
 * tech-debt D5 — the public assistant's ambiguity clarification must exist in
 * every locale, not just English.
 *
 * `t()` falls back to the English catalog when a key is missing from `hy`/`ru`
 * (messages.ts:1506). That fallback is why a missing translation is *invisible*
 * in normal testing: the string still renders, just in the wrong language —
 * which is exactly the shape of e2e-bug.108 ("raw English error overrides
 * Armenian translation"). Asserting "it returns something" would therefore pass
 * on a catalog with no Armenian entry at all.
 *
 * So these assert the rendered strings are *distinct per locale*, which the
 * fallback cannot satisfy.
 */
import { t, type AppLocale } from './messages.js';

const VARS = { name: 'Anna', options: 'Anna Petrova, Anna Kowalski' };
const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

describe('assistant.providerAmbiguous', () => {
  it.each(LOCALES)('renders in %s with both placeholders substituted', (locale) => {
    const out = t(locale, 'assistant.providerAmbiguous', VARS);
    expect(out).not.toBe('assistant.providerAmbiguous'); // key echoed = missing
    expect(out).toContain('Anna');
    expect(out).toContain('Anna Petrova, Anna Kowalski');
    expect(out).not.toMatch(/\{(name|options)\}/); // no unsubstituted placeholder
  });

  it('is genuinely translated, not the English fallback', () => {
    const [en, hy, ru] = LOCALES.map((l) =>
      t(l, 'assistant.providerAmbiguous', VARS),
    );
    expect(hy).not.toBe(en);
    expect(ru).not.toBe(en);
    expect(hy).not.toBe(ru);
  });

  it('the Armenian and Russian entries use their own scripts', () => {
    expect(t('hy', 'assistant.providerAmbiguous', VARS)).toMatch(/\p{Script=Armenian}/u);
    expect(t('ru', 'assistant.providerAmbiguous', VARS)).toMatch(/\p{Script=Cyrillic}/u);
  });
});
