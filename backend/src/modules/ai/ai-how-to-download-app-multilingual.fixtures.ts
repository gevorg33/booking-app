import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type HowToDownloadAppMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'how_to_download_app';
  rescueReason: 'download_app';
};

export const HOW_TO_DOWNLOAD_APP_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian how_to_download_app (customer mobile + public booking):
  - how_to_download_app customer: hy «Ինչպե՞ս ներբեռնել consumer app-ը», «Որտեղից ներբեռնեմ mobile app-ը»; ru «Как скачать приложение для записи», «Где скачать мобильное приложение». NOT switch_to_consumer_app (already installed).
  - how_to_download_app public: hy «Ինչպես ստանալ mobile app-ը այս booking page-ից», «Ներբեռնել booking app-ը iPhone-ում»; ru «Как скачать приложение с этой страницы записи», «Где ссылка на App Store для этого салона». NOT booking_help (how to book on page).`;

export const HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS: readonly HowToDownloadAppMultilingualScenario[] =
  [
    {
      id: 'how-to-download-app-hy-customer',
      locale: 'hy',
      prompt: 'Ինչպե՞ս ներբեռնել consumer app-ը',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'where-download-hy-customer',
      locale: 'hy',
      prompt: 'Որտեղից ներբեռնեմ mobile app-ը',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'how-to-download-app-ru-customer',
      locale: 'ru',
      prompt: 'Как скачать приложение для записи',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'where-download-ru-customer',
      locale: 'ru',
      prompt: 'Где скачать мобильное приложение',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'how-to-download-app-hy-public',
      locale: 'hy',
      prompt: 'Ինչպես ստանալ mobile app-ը այս booking page-ից',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'install-iphone-hy-public',
      locale: 'hy',
      prompt: 'Ներբեռնել booking app-ը iPhone-ում',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'how-to-download-app-ru-public',
      locale: 'ru',
      prompt: 'Как скачать приложение с этой страницы записи',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'app-store-ru-public',
      locale: 'ru',
      prompt: 'Где ссылка на App Store для этого салона',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
  ];
