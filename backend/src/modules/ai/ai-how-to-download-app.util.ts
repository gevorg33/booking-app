import type { TenantAppInstallView } from '../../common/utils/tenant-app-install-settings.util.js';
import {
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  type HowToDownloadAppPromptFixture,
} from './ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from './ai-how-to-download-app-multilingual.fixtures.js';
import { isExplainTenantAppInstallPrompt } from './ai-tenant-app-install.util.js';

const SWITCH_TO_CONSUMER_APP =
  /\b(open|switch|launch|use|go\s+to|take\s+me\s+to)\b.{0,30}\b(consumer\s+app|booking\s+app|the\s+app)\b/i;

function matchHowToDownloadAppScenario(
  prompt: string,
): HowToDownloadAppPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of HOW_TO_DOWNLOAD_APP_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isHowToDownloadAppPrompt(prompt: string): boolean {
  if (matchHowToDownloadAppScenario(prompt)) return true;
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
