import type { StoreListingScreenshotFrame } from './store-listing.types.js';

/** Five frames per locale — capture on 6.7" iPhone (1290×2796) and 1080×1920 Android phone */
export const CONSUMER_STORE_SCREENSHOT_FRAMES: StoreListingScreenshotFrame[] = [
  {
    id: 'welcome-salons',
    captureRoute: '/ (WelcomePage — Your salons + recent)',
    caption: {
      en: 'Return to your salons in one tap',
      hy: 'Մեկ հպումով վերադարձեք ձեր սրահներ',
      ru: 'Возвращайтесь к салонам в одно касание',
    },
  },
  {
    id: 'service-menu',
    captureRoute: '/s/{slug}/services',
    caption: {
      en: 'Browse services and prices',
      hy: 'Դիտեք ծառայություններն ու գները',
      ru: 'Услуги и цены в одном списке',
    },
  },
  {
    id: 'pick-time',
    captureRoute: '/s/{slug}/book/{serviceId}',
    caption: {
      en: 'Pick a stylist and time that works',
      hy: 'Ընտրեք մասնագետ և հարմար ժամ',
      ru: 'Выберите мастера и удобное время',
    },
  },
  {
    id: 'booking-confirmed',
    captureRoute: '/s/{slug}/book/{serviceId} (success state)',
    caption: {
      en: 'Confirm in seconds — booking done',
      hy: 'Հաստատեք վայրկյաններում',
      ru: 'Подтверждение за секунды',
    },
  },
  {
    id: 'my-appointments',
    captureRoute: '/s/{slug}/account',
    caption: {
      en: 'Manage upcoming visits anytime',
      hy: 'Կառավարեք գրանցումները ցանկացած պահի',
      ru: 'Управляйте записями в любое время',
    },
  },
];

export const CONSUMER_SCREENSHOT_EXPORT_SIZES = [
  { platform: 'ios', label: 'iPhone 6.7"', width: 1290, height: 2796 },
  { platform: 'ios', label: 'iPhone 6.5"', width: 1284, height: 2778 },
  { platform: 'android', label: 'Phone', width: 1080, height: 1920 },
  { platform: 'android', label: '7" tablet', width: 1200, height: 1920 },
] as const;
