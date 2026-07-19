import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONSUMER_COPY_EN, CONSUMER_COPY_HY, CONSUMER_COPY_RU } from './consumer-copy-catalog.js';
import { formatCopy } from './copy.js';
import { guidedBookingStepLabel } from './guided-booking-flow.util.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('consumer chrome i18n (e2e-bug.13)', () => {
  it('translates tab labels out of English for hy/ru', () => {
    expect(CONSUMER_COPY_HY.tabHome).not.toBe(CONSUMER_COPY_EN.tabHome);
    expect(CONSUMER_COPY_HY.tabBook).not.toBe(CONSUMER_COPY_EN.tabBook);
    expect(CONSUMER_COPY_HY.tabAccount).not.toBe(CONSUMER_COPY_EN.tabAccount);
    expect(CONSUMER_COPY_RU.tabHome).not.toBe(CONSUMER_COPY_EN.tabHome);
    expect(CONSUMER_COPY_RU.tabBook).not.toBe(CONSUMER_COPY_EN.tabBook);
    expect(CONSUMER_COPY_RU.tabAccount).not.toBe(CONSUMER_COPY_EN.tabAccount);
  });

  it('uses Armenian script for profileViewDetails (not Salon-ի էջ)', () => {
    expect(CONSUMER_COPY_HY.profileViewDetails).toBe('Սրահի էջ');
    expect(CONSUMER_COPY_HY.profileViewDetails).not.toMatch(/Salon/i);
  });

  it('labels guided steps from locale copy', () => {
    expect(guidedBookingStepLabel('confirm', CONSUMER_COPY_HY)).toBe(
      CONSUMER_COPY_HY.guidedStepConfirm,
    );
    expect(guidedBookingStepLabel('service', CONSUMER_COPY_RU)).toBe(
      CONSUMER_COPY_RU.guidedStepService,
    );
  });

  it('formats the signed-in booking hint with name', () => {
    expect(formatCopy(CONSUMER_COPY_EN.bookingSignedInHint, { name: 'Test Customer' })).toContain(
      'Test Customer',
    );
    expect(formatCopy(CONSUMER_COPY_HY.bookingSignedInHint, { name: 'Test Customer' })).toContain(
      'Test Customer',
    );
    expect(formatCopy(CONSUMER_COPY_HY.bookingSignedInHint, { name: 'X' })).not.toMatch(
      /Signed in as/i,
    );
  });
});

describe('consumer chrome i18n (e2e-bug.54)', () => {
  const localizedChromeKeys = [
    'loginAccountHeading',
    'loginSubtitle',
    'loginGooglePopupBlocked',
    'loginGoogleCancelled',
    'loginGoogleFailed',
    'welcomeHeading',
    'welcomeSubtitle',
    'welcomeBookAgain',
    'welcomeSavedSalons',
    'welcomeYourSalons',
    'salonNotFound',
    'invalidSalonLink',
    'salonBookingUnavailable',
    'salonNotFoundBack',
    'welcomeContinue',
    'welcomeSaveSalonAria',
    'welcomeUnsaveSalonAria',
    'switchSalon',
    'switchSalonCurrentAria',
    'languagePickerAria',
    'checkoutContactName',
    'checkoutContactEmail',
    'checkoutContactPhone',
  ] as const;

  it.each(localizedChromeKeys)('translates %s out of English for hy/ru', (key) => {
    expect(CONSUMER_COPY_HY[key]).not.toBe(CONSUMER_COPY_EN[key]);
    expect(CONSUMER_COPY_RU[key]).not.toBe(CONSUMER_COPY_EN[key]);
  });

  it('wires SalonBottomTabBar labels through copy (no hardcoded Home/Book/Account)', () => {
    const source = readSrc('components/SalonBottomTabBar.tsx');
    expect(source).toContain('copy.tabHome');
    expect(source).toContain('copy.tabBook');
    expect(source).toContain('copy.tabAccount');
    expect(source).not.toMatch(/>\s*Home\s*</);
    expect(source).not.toMatch(/>\s*Book\s*</);
    expect(source).not.toMatch(/>\s*Account\s*</);
  });

  it('wires LoginPage through useConsumerCopy (no bare Sign in / Continue with Google)', () => {
    const source = readSrc('pages/LoginPage.tsx');
    expect(source).toContain('useConsumerCopy');
    expect(source).toContain('copy.signIn');
    expect(source).toContain('copy.loginSubtitle');
    expect(source).not.toMatch(/['"]Sign in['"]/);
    expect(source).not.toMatch(/Continue with Google/);
  });

  it('wires WelcomePage via resolveAppConsumerLocale (not forced English)', () => {
    const source = readSrc('pages/WelcomePage.tsx');
    expect(source).toContain('resolveAppConsumerLocale');
    expect(source).toContain('getConsumerCopy(resolveAppConsumerLocale())');
    expect(source).toContain('welcomeCopy.welcomeHeading');
    expect(source).not.toMatch(/getConsumerCopy\(\s*['"]en['"]\s*\)\s*;/);
    expect(source).not.toMatch(/['"]Book your salon['"]/);
  });

  it('requires localized copy props on switcher / language picker / checkout contact', () => {
    expect(readSrc('components/ConsumerTenantSwitcher.tsx')).toContain('copy.switchSalon');
    expect(readSrc('components/ConsumerLanguagePicker.tsx')).toContain('ariaLabel');
    expect(readSrc('components/ConsumerCheckoutContactForm.tsx')).toContain(
      'copy.checkoutContactName',
    );
    expect(readSrc('pages/SalonHomePage.tsx')).toContain('ariaLabel={copy.languagePickerAria}');
    expect(readSrc('pages/SalonHomePage.tsx')).toContain('copy={copy}');
    // e2e-bug.22 — picker + copy must share one locale state (no paired useConsumerLocale).
    expect(readSrc('pages/SalonHomePage.tsx')).toContain('useConsumerCopy');
    expect(readSrc('pages/SalonHomePage.tsx')).not.toMatch(
      /import\s+\{\s*useConsumerLocale\s*\}\s+from/,
    );
    expect(readSrc('pages/SalonHomePage.tsx')).toContain(
      'setConsumerLocale, enabledLocales, localeLabels } = useConsumerCopy',
    );
    expect(readSrc('pages/BookPage.tsx')).toContain('copy={copy}');
    expect(readSrc('pages/MultiServiceCheckoutPage.tsx')).toContain('copy={copy}');
    expect(readSrc('pages/PackageCheckoutPage.tsx')).toContain('copy={copy}');
  });
});
