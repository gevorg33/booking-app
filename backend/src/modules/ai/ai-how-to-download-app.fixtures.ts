export type HowToDownloadAppPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'how_to_download_app';
  rescueReason: 'download_app';
};

export const CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES = `- how_to_download_app: READ — customer/consumer app or public booking: explain how to install the consumer app on their phone using the same per-tenant /get-app/[slug] landing link as the salon Growth QR (explain_tenant_app_install). Triggers: how/where to download/get/install the app, App Store, Google Play, install on my phone, get the app, scan salon QR. Returns landingUrl, store links when configured, and deep-link scheme. NOT explain_tenant_app_install (dashboard owner QR setup), NOT switch_to_consumer_app (already installed — open app), NOT regenerate_tenant_app_install_qr (mutate), NOT guide_user_flow (how to book on this page).`;

export const HOW_TO_DOWNLOAD_APP_PROMPTS: readonly HowToDownloadAppPromptFixture[] =
  [
    {
      id: 'how-download-app-customer',
      prompt: 'How do I download the app on my phone?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'get-the-app-customer',
      prompt: 'Get the consumer app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'install-on-phone-customer',
      prompt: 'Install the booking app on my iPhone',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'where-download-customer',
      prompt: 'Where can I download the mobile app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'app-store-link-customer',
      prompt: 'Is there an App Store link for this salon app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'google-play-customer',
      prompt: 'How do I get the app on Google Play?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'scan-qr-customer',
      prompt: 'How do I install from the salon QR code?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'get-app-page-customer',
      prompt: 'Where is the install page for the consumer app?',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'download-consumer-app-customer',
      prompt: 'Download the consumer booking app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'install-android-customer',
      prompt: 'Install the Android booking app',
      surface: 'customer',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'how-get-app-public',
      prompt: 'How do I get the app?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'install-phone-public',
      prompt: 'Install on my phone',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'download-booking-app-public',
      prompt: 'Download the booking app',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'where-app-store-public',
      prompt: 'Where is the app store link?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'get-mobile-app-public',
      prompt: 'How to get the mobile app for this salon',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'get-app-booking-page-public',
      prompt: 'Can I get the app from this booking page?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'install-iphone-public',
      prompt: 'How do I install the app on my iPhone from here?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'google-play-public',
      prompt: 'Is there a Google Play link for this salon app?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'scan-qr-public',
      prompt: 'How do I install from the salon QR code on this page?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'get-app-page-public',
      prompt: 'Where is the get-app page for this salon?',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
    {
      id: 'download-consumer-app-public',
      prompt: 'Download the consumer app for this salon',
      surface: 'public',
      expectedAction: 'how_to_download_app',
      rescueReason: 'download_app',
    },
  ];

export const HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown-customer',
    prompt: 'How do I download the app on my phone?',
    surface: 'customer' as const,
    misclassifiedAction: 'unknown',
    expectedAction: 'how_to_download_app' as const,
  },
  {
    id: 'misclassified-guide-user-flow-public',
    prompt: 'How do I get the app?',
    surface: 'public' as const,
    misclassifiedAction: 'guide_user_flow',
    expectedAction: 'how_to_download_app' as const,
  },
  {
    id: 'misclassified-booking-help-public',
    prompt: 'Install on my phone',
    surface: 'public' as const,
    misclassifiedAction: 'booking_help',
    expectedAction: 'how_to_download_app' as const,
  },
  {
    id: 'misclassified-explain-tenant-app-install',
    prompt: 'Get the consumer app',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_tenant_app_install',
    expectedAction: 'how_to_download_app' as const,
  },
] as const;
