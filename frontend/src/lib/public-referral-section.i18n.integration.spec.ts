import { describe, expect, it } from 'vitest';
import { getMessages, translate, type AppLocale } from '@/i18n';

const LOCALES: AppLocale[] = ['en', 'hy', 'ru'];

const REFERRAL_BODY_KEYS = [
  'public.referralSectionBody',
  'public.referralSectionBodyDynamic',
] as const;

describe('public referral section i18n (e2e-bug.110)', () => {
  it.each(LOCALES)(
    'resolves referral body keys in %s with expected placeholders',
    (locale) => {
      const messages = getMessages(locale);
      for (const key of REFERRAL_BODY_KEYS) {
        const value = translate(messages, key);
        expect(value, `${locale}:${key}`).not.toBe(key);
        expect(value.trim().length, `${locale}:${key}`).toBeGreaterThan(0);
        expect(value, `${locale}:${key}`).toContain('{refereeBonus}');
      }

      const dynamic = translate(messages, 'public.referralSectionBodyDynamic');
      expect(dynamic).toContain('{referrerReward}');
      expect(dynamic).not.toContain('{referrerBonus}');

      const staticBody = translate(messages, 'public.referralSectionBody');
      expect(staticBody).toContain('{referrerBonus}');
      expect(staticBody).not.toContain('{referrerReward}');
    },
  );

  it('does not leave English loyalty wording in Armenian referral copy', () => {
    const hy = getMessages('hy');
    expect(translate(hy, 'public.referralSectionBody')).not.toMatch(/\bloyalty\b/i);
    expect(translate(hy, 'public.referralSectionBodyDynamic')).not.toMatch(
      /\bloyalty\b/i,
    );
    expect(translate(hy, 'public.referralSectionBody')).toContain(
      'հավատարմության միավոր',
    );
  });

  it('interpolates the dynamic reward summary the same way as the account UI', () => {
    const hy = translate(
      getMessages('hy'),
      'public.referralSectionBodyDynamic',
    );
    const rendered = hy
      .replace('{referrerReward}', '$10 gift card')
      .replace('{refereeBonus}', '50');
    expect(rendered).toContain('$10 gift card');
    expect(rendered).toContain('50');
    expect(rendered).not.toContain('{referrerReward}');
    expect(rendered).not.toContain('{refereeBonus}');
  });
});
