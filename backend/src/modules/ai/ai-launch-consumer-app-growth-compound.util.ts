import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  extractMarketingEmailsFromPrompt,
  isConfigureMarketingRegistrationEmailPrompt,
} from './ai-integrations.util.js';
import {
  isExplainTenantAppInstallPrompt,
  isRegenerateTenantAppInstallQrPrompt,
} from './ai-tenant-app-install.util.js';

export const LAUNCH_CONSUMER_APP_GROWTH_STEP_ACTIONS = [
  'explain_tenant_app_install',
  'regenerate_tenant_app_install_qr',
  'configure_marketing_registration_email',
] as const;

export type LaunchConsumerAppGrowthStepAction =
  (typeof LAUNCH_CONSUMER_APP_GROWTH_STEP_ACTIONS)[number];

export const LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID =
  'launch_consumer_app_growth';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:explain|show|regenerate|refresh|configure|enable|set|launch)\b)/i;

export const LAUNCH_CONSUMER_APP_GROWTH_CLASSIFIER_RULES = `- launch_consumer_app_growth (compound): dashboard multi-step consumer app growth launch — decomposes to explain_tenant_app_install → regenerate_tenant_app_install_qr → configure_marketing_registration_email. Use for "launch consumer app growth end-to-end", "set up customer app growth: explain get-app QR, refresh growth QR, configure marketing registration email". NOT explain_tenant_app_install alone when user asks for full growth launch; NOT regenerate_tenant_app_install_qr alone when user also asks explain + registration email; NOT how_to_download_app (customer on phone); NOT create_promo_code|configure_loyalty_settings; NOT onboard_salon_notifications.`;

const FULL_CONSUMER_APP_GROWTH_CUE =
  /\b(?:launch\s+consumer\s+app\s+growth|consumer\s+app\s+growth\s+launch|launch\s+customer\s+app\s+growth|customer\s+app\s+growth\s+launch|growth\s+launch\s+end[\s-]to[\s-]end|end[\s-]to[\s-]end\s+consumer\s+app\s+growth|consumer\s+app\s+growth\s+setup|launch\s+app\s+growth|growth\s+distribution\s+launch|onboard\s+consumer\s+app\s+growth)\b/i;

const EXPLAIN_APP_INSTALL_STEP_CUE =
  /\b(?:explain|show|where\s+is|what\s+is|tell\s+me\s+about)\b.*\b(?:tenant\s+app\s+install|app\s+install\s+(?:qr|link|landing|page)|get-app|growth\s+qr|growth\s+distribution|install\s+link|venue\s+qr)\b/i;

const REGENERATE_QR_STEP_CUE =
  /\b(?:regenerate|refresh|recreate|generate\s+new|update)\b.*\b(?:qr|get-app|growth\s+qr|app\s+install|tenant\s+app\s+install|venue\s+qr)\b/i;

const MARKETING_REGISTRATION_STEP_CUE =
  /\b(?:configure|enable|set\s+up|turn\s+on)\b.*\b(?:marketing|registration)\b.*\b(?:email|notifications?)\b/i;

const CUSTOMER_SELF_DOWNLOAD_CUE =
  /\b(?:how\s+do\s+i|how\s+to|on\s+my\s+phone|my\s+iphone|my\s+android)\b.*\b(?:download|install)\b/i;

function countConsumerAppGrowthStepFamilies(prompt: string): number {
  let count = 0;
  if (
    isExplainTenantAppInstallPrompt(prompt) ||
    EXPLAIN_APP_INSTALL_STEP_CUE.test(prompt)
  ) {
    count += 1;
  }
  if (
    isRegenerateTenantAppInstallQrPrompt(prompt) ||
    REGENERATE_QR_STEP_CUE.test(prompt)
  ) {
    count += 1;
  }
  if (
    isConfigureMarketingRegistrationEmailPrompt(prompt) ||
    MARKETING_REGISTRATION_STEP_CUE.test(prompt)
  ) {
    count += 1;
  }
  return count;
}

function hasFullConsumerAppGrowthCue(prompt: string): boolean {
  if (FULL_CONSUMER_APP_GROWTH_CUE.test(prompt)) return true;
  return (
    /\b(?:set\s+up|setup|onboard|launch)\b/i.test(prompt) &&
    /\b(?:consumer\s+app|customer\s+app|app\s+growth|growth\s+distribution)\b/i.test(
      prompt,
    ) &&
    (/\b(?:end[\s-]to[\s-]end|from\s+scratch|growth\s+launch)\b/i.test(
      prompt,
    ) ||
      /\bgrowth\b/i.test(prompt))
  );
}

export function isLaunchConsumerAppGrowthCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 32) return false;
  if (CUSTOMER_SELF_DOWNLOAD_CUE.test(text)) return false;
  if (
    /\bmy\s+notifications?\b/i.test(text) &&
    !/\b(?:marketing|registration)\b/i.test(text)
  ) {
    return false;
  }

  const stepFamilies = countConsumerAppGrowthStepFamilies(text);
  const fullLaunch = hasFullConsumerAppGrowthCue(text);

  if (fullLaunch) return true;
  if (stepFamilies < 3) return false;

  return stepFamilies >= 3 || COMPOUND_MARKERS.test(text) || /;\s*/.test(text);
}

export type LaunchConsumerAppGrowthStep = {
  action: LaunchConsumerAppGrowthStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildLaunchConsumerAppGrowthCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities(
    {
      emailOnNewCustomerRegistration: true,
    },
    prompt,
  );

  const emails = extractMarketingEmailsFromPrompt(prompt);
  if (emails.length) {
    params.marketingTeamEmails = emails;
  }

  if (
    /\b(disable|turn\s+off)\b/i.test(prompt) &&
    /\b(marketing|registration)\b/i.test(prompt)
  ) {
    params.emailOnNewCustomerRegistration = false;
  }

  return params;
}

export function decomposeLaunchConsumerAppGrowthCompoundPrompt(
  prompt: string,
): LaunchConsumerAppGrowthStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isLaunchConsumerAppGrowthCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildLaunchConsumerAppGrowthCompoundParams(trimmed);
  const steps: LaunchConsumerAppGrowthStep[] = [
    {
      action: 'explain_tenant_app_install',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'regenerate_tenant_app_install_qr',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: 'configure_marketing_registration_email',
      params: { ...base },
      segment: trimmed,
    },
  ];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueLaunchConsumerAppGrowthCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isLaunchConsumerAppGrowthCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'launch_consumer_app_growth_compound',
  };
}
