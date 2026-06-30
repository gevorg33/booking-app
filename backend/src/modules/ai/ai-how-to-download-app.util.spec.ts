import {
  buildHowToDownloadAppGuidance,
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  isHowToDownloadAppPrompt,
  rescueHowToDownloadAppIntent,
} from './ai-how-to-download-app.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';

describe('ai-how-to-download-app.util (ai-cmd-ext-7.5)', () => {
  const sampleView = {
    slug: 'salon-demo',
    landingUrl: 'https://app.test/get-app/salon-demo?src=qr&utm_campaign=venue_qr',
    qrDataUrl: 'data:image/png;base64,abc',
    customSchemeUrl: 'optischedule://book/salon-demo',
    generatedAt: '2026-06-01T00:00:00.000Z',
  };

  it('builds customer guidance aligned with tenant get-app landing', () => {
    const guidance = buildHowToDownloadAppGuidance({
      view: sampleView,
      iosAppUrl: 'https://apps.apple.com/app',
      androidAppUrl: null,
    });
    expect(guidance.landingUrl).toContain('/get-app/salon-demo');
    expect(guidance.customSchemeUrl).toBe('optischedule://book/salon-demo');
    expect(guidance.summary).toContain('/get-app/');
    expect(guidance.iosUrl).toBe('https://apps.apple.com/app');
    expect(guidance.steps.some((step) => step.includes('Growth QR'))).toBe(true);
  });

  it.each(HOW_TO_DOWNLOAD_APP_PROMPTS.map((row) => [row.id, row] as const))(
    'detects how-to-download-app prompt $id',
    (_id, row) => {
      expect(isHowToDownloadAppPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(HOW_TO_DOWNLOAD_APP_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues how-to-download-app prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueMarketingGrowthIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('routes download prompts through dedicated rescue', () => {
    expect(
      rescueHowToDownloadAppIntent(
        'How do I download the app on my phone?',
        'unknown',
      )?.action,
    ).toBe('how_to_download_app');
  });

  it('does not steal dashboard tenant app install explain prompts', () => {
    expect(
      isHowToDownloadAppPrompt('Explain our tenant app install QR'),
    ).toBe(false);
    expect(
      rescueMarketingGrowthIntent(
        'Explain our tenant app install QR',
        'unknown',
      )?.action,
    ).toBe('explain_tenant_app_install');
  });
});
