/** adopt-2.1 / gap-2.5.10 — consumer App Store & Play Store listing schema */

export type StoreListingLocale = 'en' | 'hy' | 'ru';

export interface StoreListingIosFields {
  /** App Store name — max 30 characters */
  title: string;
  /** App Store subtitle — max 30 characters */
  subtitle: string;
  /** Comma-separated, no spaces — max 100 characters total */
  keywords: string;
  /** Optional promotional text — max 170 characters */
  promotionalText: string;
  /** App Store description — max 4000 characters */
  description: string;
}

export interface StoreListingAndroidFields {
  /** Play Store title — max 30 characters */
  title: string;
  /** Short description — max 80 characters */
  shortDescription: string;
  /** Full description — max 4000 characters */
  fullDescription: string;
}

export interface StoreListingScreenshotFrame {
  id: string;
  /** In-app route or screen id for capture instructions */
  captureRoute: string;
  caption: Record<StoreListingLocale, string>;
}

export interface StoreListingPreviewScene {
  id: string;
  startSec: number;
  endSec: number;
  visual: Record<StoreListingLocale, string>;
  onScreenText: Record<StoreListingLocale, string>;
}

export interface ConsumerStoreListing {
  locale: StoreListingLocale;
  ios: StoreListingIosFields;
  android: StoreListingAndroidFields;
}

export interface StoreListingLimitViolation {
  locale: StoreListingLocale;
  field: string;
  limit: number;
  length: number;
}

export const STORE_LISTING_LIMITS = {
  iosTitle: 30,
  iosSubtitle: 30,
  iosKeywords: 100,
  iosPromotionalText: 170,
  iosDescription: 4000,
  androidTitle: 30,
  androidShortDescription: 80,
  androidFullDescription: 4000,
} as const;

export const STORE_LISTING_LOCALES: readonly StoreListingLocale[] = ['en', 'hy', 'ru'];
