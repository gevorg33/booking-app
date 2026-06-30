import type { TenantAppInstallView } from '../../common/utils/tenant-app-install-settings.util.js';

/** Dashboard read intent (ai-cmd-ext-2.22). */
export const EXPLAIN_TENANT_APP_INSTALL_INTENT =
  'explain_tenant_app_install' as const;

/** Dashboard mutate intent (ai-cmd-ext-2.23). */
export const REGENERATE_TENANT_APP_INSTALL_QR_INTENT =
  'regenerate_tenant_app_install_qr' as const;

export const TENANT_APP_INSTALL_CLASSIFIER_RULES = `- explain_tenant_app_install: READ — admin dashboard help for Integrations → Growth QR / tenant app install landing. Per-tenant /get-app/[slug] page + QR code for customers to install the consumer app. Use for "explain tenant app install QR", "where is our get-app link", "show growth distribution QR". NOT how_to_download_app (customer on their phone), NOT regenerate_tenant_app_install_qr (mutate refresh), NOT configure_marketing_registration_email.
- regenerate_tenant_app_install_qr: MUTATE — admin refreshes Growth tab QR + landing assets for the tenant slug (/get-app/[slug]). Idempotent save via ensure/regenerate. Use for "regenerate tenant app install QR", "refresh our growth QR", "recreate get-app QR". NOT explain_tenant_app_install (read-only), NOT how_to_download_app (customer).
- Examples:
  - "Explain our tenant app install QR" → explain_tenant_app_install
  - "Where is the get-app link for our salon" → explain_tenant_app_install
  - "Regenerate tenant app install QR" → regenerate_tenant_app_install_qr
  - "Refresh our growth QR code" → regenerate_tenant_app_install_qr
  - NOT "How do I download the app on my phone" → how_to_download_app (customer)`;

export type ExplainTenantAppInstallPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof EXPLAIN_TENANT_APP_INSTALL_INTENT;
};

export const EXPLAIN_TENANT_APP_INSTALL_PROMPTS: ExplainTenantAppInstallPromptFixture[] =
  [
    {
      id: 'explain-qr',
      prompt: 'Explain our tenant app install QR',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'get-app-link',
      prompt: 'Where is the get-app link for our salon',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'landing-page',
      prompt: 'What is the app install landing page',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'growth-qr',
      prompt: 'Show the Growth QR for customer app downloads',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'customers-via-qr',
      prompt: 'How do customers install our app via QR',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'integrations-growth-tab',
      prompt: 'Explain app install link on integrations growth tab',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'venue-qr',
      prompt: 'Where can I find the venue QR for the consumer app',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'tenant-install-link',
      prompt: 'Show our tenant app install landing URL',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'growth-distribution',
      prompt: 'Tell me about growth distribution app install QR',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'customer-download-link',
      prompt: 'What link do customers scan to download our booking app',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'get-app-slug',
      prompt: 'Explain the get-app page for our business slug',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
    {
      id: 'open-growth-qr',
      prompt: 'How does the integrations Growth QR work for app installs',
      surface: 'dashboard',
      expectedAction: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    },
  ];

export type RegenerateTenantAppInstallQrPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof REGENERATE_TENANT_APP_INSTALL_QR_INTENT;
};

export const REGENERATE_TENANT_APP_INSTALL_QR_PROMPTS: RegenerateTenantAppInstallQrPromptFixture[] =
  [
    {
      id: 'regenerate-qr',
      prompt: 'Regenerate tenant app install QR',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'refresh-growth-qr',
      prompt: 'Refresh our growth QR code',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'recreate-get-app',
      prompt: 'Recreate the get-app QR for the salon',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'generate-new-qr',
      prompt: 'Generate new app install QR',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'update-venue-qr',
      prompt: 'Update the venue QR for customer downloads',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'regenerate-slug-assets',
      prompt: 'Regenerate slug QR assets on growth tab',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'refresh-install-assets',
      prompt: 'Refresh tenant app install assets',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'recreate-growth-tab',
      prompt: 'Recreate app install QR on integrations growth',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'generate-get-app-qr',
      prompt: 'Generate new QR for get-app landing',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'update-install-qr',
      prompt: 'Update the app install QR code',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'regenerate-consumer-qr',
      prompt: 'Regenerate our consumer app install QR',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
    {
      id: 'refresh-distribution-qr',
      prompt: 'Refresh the growth distribution QR',
      surface: 'dashboard',
      expectedAction: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    },
  ];

const REGENERATE_SIGNAL =
  /\b(regenerate|refresh|recreate|rotate|generate\s+new|update\s+the)\b/i;

const DASHBOARD_SCOPE =
  /\b(our|salon|business|venue|customers?|clients?|growth|integrations?|distribution|qr\s+code|get-app|install\s+link|landing\s+page|venue\s+qr|for\s+our)\b/i;

const DASHBOARD_OWNER_SCOPE =
  /\b(our|salon|business|venue|customers?|clients?|growth|integrations?|distribution|for\s+our|venue\s+qr|get-app)\b/i;

const TENANT_INSTALL_SIGNAL =
  /\b(tenant\s+app\s+install|app\s+install\s+(?:qr|landing|link|page)|get-app|growth\s+qr|venue\s+qr|install\s+qr|qr\s+(?:for\s+)?(?:app|install|download)|customer\s+(?:app\s+)?install\s+link|per-tenant\s+app|growth\s+distribution)\b/i;

const EXPLAIN_VERB =
  /\b(explain|show|tell\s+me|what\s+(?:is|link)|where\s+(?:is|can\s+i)|how\s+(?:do\s+customers|can\s+customers|does\s+the))\b/i;

const CUSTOMER_SELF_SIGNAL =
  /\b(on\s+my|my\s+(?:phone|iphone|android|device)|how\s+do\s+i|where\s+can\s+i|can\s+i|install\s+on\s+my)\b/i;

export function isExplainTenantAppInstallPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;

  if (
    REGENERATE_SIGNAL.test(text) &&
    /\b(qr|app\s+install|get-app)\b/i.test(text)
  ) {
    return false;
  }

  if (TENANT_INSTALL_SIGNAL.test(text)) {
    if (CUSTOMER_SELF_SIGNAL.test(text) && !DASHBOARD_OWNER_SCOPE.test(text)) {
      return false;
    }
    return true;
  }

  if (
    EXPLAIN_VERB.test(text) &&
    /\b(app\s+install|install\s+link|download\s+link|booking\s+app|qr|get-app|consumer\s+app\s+growth|scan)\b/i.test(
      text,
    )
  ) {
    if (CUSTOMER_SELF_SIGNAL.test(text) && !DASHBOARD_OWNER_SCOPE.test(text)) {
      return false;
    }
    return DASHBOARD_SCOPE.test(text) || !CUSTOMER_SELF_SIGNAL.test(text);
  }

  if (
    /\b(growth\s+tab|integrations?\s+(?:→|->|>|\/)?\s*growth|growth\s+distribution)\b/i.test(
      text,
    ) &&
    /\b(app|qr|install)\b/i.test(text)
  ) {
    return true;
  }

  return false;
}

export function buildExplainTenantAppInstallGuidance(input: {
  view: TenantAppInstallView;
}): {
  summary: string;
  landingUrl: string;
  customSchemeUrl: string;
  qrDataUrl: string;
  steps: string[];
  navigate: { path: string; label: string };
} {
  const { view } = input;
  const navigate = {
    path: '/dashboard/integrations',
    label: 'Open Integrations → Growth',
  };
  const steps = [
    `Open Integrations → Growth to view and download the QR code for your venue.`,
    `Share the landing page ${view.landingUrl} — customers scan the QR or open the link on their phone.`,
    `The page detects iOS/Android and offers the consumer app or mobile web booking for slug "${view.slug}".`,
    `Deep link scheme ${view.customSchemeUrl} opens the app when installed.`,
  ];
  const summary = `Your tenant app install landing page is ${view.landingUrl}. Open Integrations → Growth to copy the QR or link for in-venue customer downloads.`;
  return {
    summary,
    landingUrl: view.landingUrl,
    customSchemeUrl: view.customSchemeUrl,
    qrDataUrl: view.qrDataUrl,
    steps,
    navigate,
  };
}

export function isRegenerateTenantAppInstallQrPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text || !REGENERATE_SIGNAL.test(text)) return false;

  return (
    TENANT_INSTALL_SIGNAL.test(text) ||
    (/\b(qr|get-app|growth\s+qr|venue\s+qr|app\s+install)\b/i.test(text) &&
      /\b(salon|business|tenant|growth|integrations?|slug|venue|consumer\s+app|our)\b/i.test(
        text,
      ))
  );
}

export function buildRegenerateTenantAppInstallSummary(input: {
  view: TenantAppInstallView;
}): {
  summary: string;
  landingUrl: string;
  qrDataUrl: string;
  navigate: { path: string; label: string };
} {
  const { view } = input;
  const navigate = {
    path: '/dashboard/integrations',
    label: 'Open Integrations → Growth',
  };
  return {
    summary: `Regenerated tenant app install QR and landing link: ${view.landingUrl}. Open Integrations → Growth to download the updated QR.`,
    landingUrl: view.landingUrl,
    qrDataUrl: view.qrDataUrl,
    navigate,
  };
}

export function rescueRegenerateTenantAppInstallQrIntent(
  prompt: string,
  action: string,
): {
  action: typeof REGENERATE_TENANT_APP_INSTALL_QR_INTENT;
  rescueReason: string;
} | null {
  if (action === REGENERATE_TENANT_APP_INSTALL_QR_INTENT) return null;
  if (!isRegenerateTenantAppInstallQrPrompt(prompt)) return null;
  return {
    action: REGENERATE_TENANT_APP_INSTALL_QR_INTENT,
    rescueReason: 'tenant_app_install_regenerate',
  };
}

export function rescueExplainTenantAppInstallIntent(
  prompt: string,
  action: string,
): {
  action: typeof EXPLAIN_TENANT_APP_INSTALL_INTENT;
  rescueReason: string;
} | null {
  if (action === REGENERATE_TENANT_APP_INSTALL_QR_INTENT) return null;
  if (action === EXPLAIN_TENANT_APP_INSTALL_INTENT) return null;
  if (!isExplainTenantAppInstallPrompt(prompt)) return null;
  return {
    action: EXPLAIN_TENANT_APP_INSTALL_INTENT,
    rescueReason: 'tenant_app_install_explain',
  };
}
