import type { TenantAppInstallView } from '../../common/utils/tenant-app-install-settings.util.js';
import { isExplainTenantAppInstallPrompt } from './ai-tenant-app-install.util.js';

export const CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES = `- how_to_download_app: READ — customer/consumer app or public booking: explain how to install the consumer app on their phone using the same per-tenant /get-app/[slug] landing link as the salon Growth QR (explain_tenant_app_install). Triggers: how/where to download/get/install the app, App Store, Google Play, install on my phone. Returns landingUrl, store links when configured, and deep-link scheme. NOT explain_tenant_app_install (dashboard owner QR setup), NOT switch_to_consumer_app (already installed — open app), NOT regenerate_tenant_app_install_qr (mutate).`;

export type HowToDownloadAppPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'how_to_download_app';
};

export const HOW_TO_DOWNLOAD_APP_PROMPTS: readonly HowToDownloadAppPromptFixture[] =
  [
    {
      id: 'how-download-app-customer',
      prompt: 'How do I download the app on my phone?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'get-the-app-customer',
      prompt: 'Get the consumer app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'install-on-phone-customer',
      prompt: 'Install the booking app on my iPhone',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'where-download-customer',
      prompt: 'Where can I download the mobile app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'app-store-link-customer',
      prompt: 'Is there an App Store link for this salon app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'google-play-customer',
      prompt: 'How do I get the app on Google Play?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'scan-qr-customer',
      prompt: 'How do I install from the salon QR code?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'get-app-page-customer',
      prompt: 'Where is the install page for the consumer app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'download-consumer-app-customer',
      prompt: 'Download the consumer booking app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'install-android-customer',
      prompt: 'Install the Android booking app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'how-get-app-public',
      prompt: 'How do I get the app?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'install-phone-public',
      prompt: 'Install on my phone',
      surface: 'public',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'download-booking-app-public',
      prompt: 'Download the booking app',
      surface: 'public',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'where-app-store-public',
      prompt: 'Where is the app store link?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
    },
    {
      id: 'get-mobile-app-public',
      prompt: 'How to get the mobile app for this salon',
      surface: 'public',
      expectedAction: 'how_to_download_app',
    },
  ];

const SWITCH_TO_CONSUMER_APP =
  /\b(open|switch|launch|use|go\s+to|take\s+me\s+to)\b.{0,30}\b(consumer\s+app|booking\s+app|the\s+app)\b/i;

export function isHowToDownloadAppPrompt(prompt: string): boolean {
  if (isExplainTenantAppInstallPrompt(prompt)) return false;
  if (SWITCH_TO_CONSUMER_APP.test(prompt)) return false;
  if (
    /\binstall\b/i.test(prompt) &&
    /\b(phone|iphone|android|device|my\s+phone)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(app\s+store|google\s+play)\b/i.test(prompt) &&
    /\b(link|download|get|install|where|is\s+there)\b/i.test(prompt)
  ) {
    return true;
  }
  return (
    (/\b(how\s+(?:do\s+i|to)|where\s+(?:is|can\s+i|do\s+i)|download|get|install|is\s+there)\b/i.test(
      prompt,
    ) ||
      /(ինչպես|նerbерн|download|get|скач|как|установ)/i.test(prompt)) &&
    (/\b(app|ios|android|iphone|mobile\s+app|consumer\s+app|booking\s+app|google\s+play|app\s+store|qr)\b/i.test(
      prompt,
    ) ||
      /(app|consumer app|booking app|прилож|мобильн|iphone|android|qr)/i.test(
        prompt,
      ))
  );
}

export function buildHowToDownloadAppGuidance(input: {
  view: TenantAppInstallView;
  iosAppUrl?: string | null;
  androidAppUrl?: string | null;
}): {
  summary: string;
  landingUrl: string;
  customSchemeUrl: string;
  iosUrl: string | null;
  androidUrl: string | null;
  slug: string;
  steps: string[];
} {
  const iosUrl = input.iosAppUrl?.trim() || null;
  const androidUrl = input.androidAppUrl?.trim() || null;
  const { view } = input;

  const steps = [
    `Open ${view.landingUrl} on your phone — the same /get-app link on the salon's in-venue Growth QR.`,
    'The page detects iOS or Android and offers the consumer app, App Store, Google Play, or mobile web booking.',
  ];
  if (iosUrl) steps.push(`Or install directly from the App Store: ${iosUrl}`);
  if (androidUrl) steps.push(`Or install from Google Play: ${androidUrl}`);
  steps.push(
    `After install, ${view.customSchemeUrl} opens the app for this salon ("${view.slug}").`,
  );
  if (view.qrDataUrl) {
    steps.unshift(
      'At the salon, scan the Growth QR on the front desk — it opens the same get-app page.',
    );
  }

  const storeHint =
    iosUrl || androidUrl
      ? ' Native store links are also available when configured.'
      : ' No native store links are configured — use the get-app page or mobile web booking.';

  const summary = `Install the consumer app for this salon at ${view.landingUrl}.${storeHint} After install, use ${view.customSchemeUrl} to open bookings directly.`;

  return {
    summary,
    landingUrl: view.landingUrl,
    customSchemeUrl: view.customSchemeUrl,
    iosUrl,
    androidUrl,
    slug: view.slug,
    steps,
  };
}

export function rescueHowToDownloadAppIntent(
  prompt: string,
  action: string,
): {
  action: 'how_to_download_app';
  rescueReason: string;
} | null {
  if (action === 'how_to_download_app') return null;
  if (!isHowToDownloadAppPrompt(prompt)) return null;
  return { action: 'how_to_download_app', rescueReason: 'download_app' };
}
