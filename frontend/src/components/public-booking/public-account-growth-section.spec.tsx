import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getMessages, type AppLocale } from '@/i18n';
import en from '@/i18n/messages/en';
import hy from '@/i18n/messages/hy';
import ru from '@/i18n/messages/ru';
import type { PublicReferralProgram } from '@/lib/public-api';
import { PublicAccountGrowthSection } from './public-account-growth-section';

const getPublicCustomerReferralProgram = vi.fn();
vi.mock('@/lib/public-api', () => ({
  getPublicCustomerReferralProgram: (...args: unknown[]) =>
    getPublicCustomerReferralProgram(...args),
  claimPublicReferralCode: vi.fn(async () => ({ attached: false })),
}));

function buildProgram(
  overrides: Partial<PublicReferralProgram> = {},
): PublicReferralProgram {
  return {
    referralCode: 'FRIEND10',
    shareUrl: 'https://example.com/s/demo?ref=FRIEND10',
    enabled: true,
    referrerBonusPoints: 50,
    refereeBonusPoints: 20,
    refereePromoCode: null,
    conversionsCount: 0,
    ...overrides,
  };
}

describe('PublicAccountGrowthSection referral body i18n (e2e-bug.110)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    sessionStorage.clear();
    getPublicCustomerReferralProgram.mockReset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function renderWithProgram(
    program: PublicReferralProgram,
    locale: AppLocale = 'en',
  ) {
    getPublicCustomerReferralProgram.mockResolvedValue(program);
    await act(async () => {
      root.render(
        <I18nProvider initialLocale={locale}>
          <PublicAccountGrowthSection
            slug="demo"
            tenant={{ name: 'Demo Salon' }}
            customerId="cust-1"
          />
        </I18nProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  describe('catalog completeness — referralSectionBodyDynamic must exist in every locale, not just en', () => {
    // e2e-bug.110's actual root cause: getMessages('hy') deep-merges hy over en,
    // so a key missing from hy.ts/ru.ts silently falls back to English text
    // instead of ever returning the bare key — asserting against the raw,
    // unmerged catalog imports is the only way to catch that regression.
    it.each([
      ['en', en],
      ['hy', hy],
      ['ru', ru],
    ] as const)('%s.ts has a real, non-empty referralSectionBodyDynamic', (_locale, catalog) => {
      const value = (catalog.public as Record<string, unknown>)
        ?.referralSectionBodyDynamic;
      expect(typeof value).toBe('string');
      expect((value as string).trim().length).toBeGreaterThan(0);
    });

    it.each(['hy', 'ru'] as const)(
      '%s.ts translation is not the raw English string',
      (locale) => {
        const catalog = locale === 'hy' ? hy : ru;
        const localized = (catalog.public as Record<string, unknown>)
          .referralSectionBodyDynamic as string;
        expect(localized).not.toBe(en.public.referralSectionBodyDynamic);
      },
    );

    it.each(['hy', 'ru'] as const)(
      '%s.ts preserves both {referrerReward} and {refereeBonus} placeholders',
      (locale) => {
        const catalog = locale === 'hy' ? hy : ru;
        const localized = (catalog.public as Record<string, unknown>)
          .referralSectionBodyDynamic as string;
        expect(localized).toContain('{referrerReward}');
        expect(localized).toContain('{refereeBonus}');
      },
    );
  });

  describe('component renders the real translated + substituted text', () => {
    it('renders the dynamic body in English with real values substituted', async () => {
      await renderWithProgram(
        buildProgram({ referrerRewardSummary: '$10 off', refereeBonusPoints: 25 }),
        'en',
      );
      expect(container.textContent).toContain(
        'You earn $10 off per friend and they can receive 25 welcome points after their first visit.',
      );
    });

    it('renders the dynamic body in Armenian — no raw English leaks onto an hy page (e2e-bug.110)', async () => {
      await renderWithProgram(
        buildProgram({ referrerRewardSummary: '10 000 ֏', refereeBonusPoints: 25 }),
        'hy',
      );
      const messages = getMessages('hy');
      const expectedTemplate = (messages.public as Record<string, unknown>)
        .referralSectionBodyDynamic as string;
      // Sanity check the fixture itself isn't accidentally the English fallback.
      expect(expectedTemplate).not.toBe(en.public.referralSectionBodyDynamic);
      const expected = expectedTemplate
        .replace('{referrerReward}', '10 000 ֏')
        .replace('{refereeBonus}', '25');
      expect(container.textContent).toContain(expected);
      expect(container.textContent).not.toContain(
        'Share your invite link. You earn',
      );
    });

    it('renders the dynamic body in Russian', async () => {
      await renderWithProgram(
        buildProgram({ referrerRewardSummary: '500 ₽', refereeBonusPoints: 25 }),
        'ru',
      );
      const expected = ru.public.referralSectionBodyDynamic
        .replace('{referrerReward}', '500 ₽')
        .replace('{refereeBonus}', '25');
      expect(container.textContent).toContain(expected);
    });

    it('falls back to the static (non-dynamic) body when referrerRewardSummary is absent', async () => {
      await renderWithProgram(
        buildProgram({ referrerRewardSummary: undefined, referrerBonusPoints: 50 }),
        'hy',
      );
      const expected = hy.public.referralSectionBody
        .replace('{referrerBonus}', '50')
        .replace('{refereeBonus}', '20');
      expect(container.textContent).toContain(expected);
    });

    it('renders nothing when the referral program is disabled', async () => {
      await renderWithProgram(buildProgram({ enabled: false }));
      expect(container.querySelector('#account-growth')).toBeNull();
    });
  });
});
