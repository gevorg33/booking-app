import {
  CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES,
  HOW_TO_DOWNLOAD_APP_PROMPTS,
  HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS,
} from './ai-how-to-download-app.fixtures.js';
import { HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS } from './ai-how-to-download-app-multilingual.fixtures.js';
import {
  buildHowToDownloadAppGuidance,
  isHowToDownloadAppPrompt,
  rescueHowToDownloadAppIntent,
} from './ai-how-to-download-app.util.js';
import { rescueHowToDownloadAppCustomerPublicIntent } from './ai-how-to-download-app-customer-public.util.js';
import { detectHowToDownloadAppCustomerPublicAction } from './ai-how-to-download-app-customer-public.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-how-to-download-app.util (ai-cmd-customer-4.5.7)', () => {
  const sampleView = {
    slug: 'salon-demo',
    landingUrl:
      'https://app.test/get-app/salon-demo?src=qr&utm_campaign=venue_qr',
    qrDataUrl: 'data:image/png;base64,abc',
    customSchemeUrl: 'optischedule://book/salon-demo',
    generatedAt: '2026-06-01T00:00:00.000Z',
  };

  it('exports shared classifier rules for customer and public', () => {
    expect(CUSTOMER_PUBLIC_HOW_TO_DOWNLOAD_APP_CLASSIFIER_RULES).toContain(
      'how_to_download_app',
    );
    expect(buildCustomerClassifierSchema()).toContain('how_to_download_app');
    expect(buildPublicClassifierSchema()).toContain('how_to_download_app');
  });

  it('builds customer/public guidance aligned with tenant get-app landing', () => {
    const guidance = buildHowToDownloadAppGuidance({
      view: sampleView,
      iosAppUrl: 'https://apps.apple.com/app',
      androidAppUrl: null,
    });
    expect(guidance.landingUrl).toContain('/get-app/salon-demo');
    expect(guidance.customSchemeUrl).toBe('optischedule://book/salon-demo');
    expect(guidance.summary).toContain('/get-app/');
    expect(guidance.iosUrl).toBe('https://apps.apple.com/app');
    expect(guidance.steps.some((step) => step.includes('Growth QR'))).toBe(
      true,
    );
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
      expect(rescueMarketingGrowthIntent(row.prompt, 'unknown')?.action).toBe(
        row.expectedAction,
      );
      expect(
        rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')
          ?.action,
      ).toBe(row.expectedAction);
    },
  );

  it.each(
    HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual how-to-download-app prompt $id', (_id, row) => {
    expect(isHowToDownloadAppPrompt(row.prompt)).toBe(true);
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(row.prompt, 'unknown')?.action,
    ).toBe('how_to_download_app');
  });

  it.each(
    HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues misclassified how-to-download-app for $id', (_id, row) => {
    expect(
      rescueHowToDownloadAppCustomerPublicIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('how_to_download_app');
  });

  it('routes download prompts through dedicated rescue', () => {
    expect(
      rescueHowToDownloadAppIntent(
        'How do I download the app on my phone?',
        'unknown',
      )?.action,
    ).toBe('how_to_download_app');
  });

  it('does not steal dashboard tenant app install explain prompts', () => {
    expect(isHowToDownloadAppPrompt('Explain our tenant app install QR')).toBe(
      false,
    );
    expect(
      rescueMarketingGrowthIntent(
        'Explain our tenant app install QR',
        'unknown',
      )?.action,
    ).toBe('explain_tenant_app_install');
  });

  it('does not classify switch-to-app prompts as download', () => {
    expect(isHowToDownloadAppPrompt('Switch to consumer app')).toBe(false);
  });

  it('e2e-bug.94 does not treat get-an-appointment as download-app', () => {
    expect(
      isHowToDownloadAppPrompt("what's the soonest I can get an appointment?"),
    ).toBe(false);
  });

  it('detects heuristic install and store-link prompts without fixture match', () => {
    expect(isHowToDownloadAppPrompt('Install on my phone please')).toBe(true);
    expect(
      isHowToDownloadAppPrompt('Is there an app store link for downloads?'),
    ).toBe(true);
  });

  it('registers eval golden cases for every fixture scenario', () => {
    const ids = new Set(
      AI_COMMAND_EVAL_HOW_TO_DOWNLOAD_APP_CASES.map((row) => row.id),
    );
    for (const row of HOW_TO_DOWNLOAD_APP_PROMPTS) {
      expect(ids.has(`how-to-download-app-${row.id}`)).toBe(true);
    }
    for (const row of HOW_TO_DOWNLOAD_APP_MULTILINGUAL_SCENARIOS) {
      expect(ids.has(`how-to-download-app-${row.id}`)).toBe(true);
    }
    for (const row of HOW_TO_DOWNLOAD_APP_RESCUE_SCENARIOS) {
      expect(ids.has(`how-to-download-app-rescue-${row.id}`)).toBe(true);
    }
  });
});
