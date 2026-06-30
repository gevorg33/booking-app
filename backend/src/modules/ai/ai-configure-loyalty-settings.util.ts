/** Dashboard mutate intent (ai-cmd-ext-2.25). */

export const CONFIGURE_LOYALTY_SETTINGS_INTENT =
  'configure_loyalty_settings' as const;

export const CONFIGURE_LOYALTY_SETTINGS_CLASSIFIER_RULES = `- configure_loyalty_settings: MUTATE — admin updates Monetization → Loyalty earn rules (earnPercentCashback 0–100, optional enabled toggle). Use for "Set loyalty earn rate to 10%", "Enable loyalty program", "Configure loyalty settings — 5% cashback". NOT summarize_loyalty_program (read overview), NOT loyalty_points_balance (customer balance).
- Examples:
  - "Set loyalty earn rate to 10%" → earnPercentCashback=10
  - "Configure loyalty settings — 5% cashback" → earnPercentCashback=5
  - "Enable loyalty program" → enabled=true
  - "Disable loyalty program" → enabled=false
  - NOT "How does loyalty work" → summarize_loyalty_program
  - NOT "Check my loyalty points" → loyalty_points_balance`;

export type ConfigureLoyaltySettingsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'dashboard';
  expectedAction: typeof CONFIGURE_LOYALTY_SETTINGS_INTENT;
  paramsPartial?: Record<string, unknown>;
};

export const CONFIGURE_LOYALTY_SETTINGS_PROMPTS: ConfigureLoyaltySettingsPromptFixture[] =
  [
    {
      id: 'set-earn-10pct',
      prompt: 'Set loyalty earn rate to 10%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 10 },
    },
    {
      id: 'configure-5-cashback',
      prompt: 'Configure loyalty settings — 5% cashback',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 5 },
    },
    {
      id: 'update-earn-7-5',
      prompt: 'Update loyalty earn percent to 7.5%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 7.5 },
    },
    {
      id: 'enable-loyalty',
      prompt: 'Enable loyalty program',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { enabled: true },
    },
    {
      id: 'disable-loyalty',
      prompt: 'Disable loyalty program',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { enabled: false },
    },
    {
      id: 'turn-on-points',
      prompt: 'Turn on customer loyalty points',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { enabled: true },
    },
    {
      id: 'set-15-percent',
      prompt: 'Set earn cashback to 15 percent for loyalty',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 15 },
    },
    {
      id: 'adjust-earn-3',
      prompt: 'Adjust loyalty points earn rate to 3%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 3 },
    },
    {
      id: 'configure-20-back',
      prompt: 'Configure loyalty to give 20% back',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 20 },
    },
    {
      id: 'update-earn-12',
      prompt: 'Update loyalty settings: earn 12% on purchases',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 12 },
    },
    {
      id: 'turn-off-program',
      prompt: 'Turn off the loyalty program',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { enabled: false },
    },
    {
      id: 'set-cashback-8',
      prompt: 'Set loyalty cashback rate to 8%',
      surface: 'dashboard',
      expectedAction: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      paramsPartial: { earnPercentCashback: 8 },
    },
  ];

const CONFIGURE_VERB =
  /\b(configure|set|update|enable|disable|turn\s+on|turn\s+off|adjust|change)\b/i;

const READ_SIGNAL =
  /\b(summarize|summary|overview|explain|how\s+(?:does|do)|what\s+is|show\s+me|describe|list|report)\b/i;

export type ParsedConfigureLoyaltySettings = {
  earnPercentCashback?: number;
  enabled?: boolean;
  earnExcludedServiceIds?: string[];
};

function readNumberParam(
  params: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readBooleanParam(
  params: Record<string, unknown>,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  }
  return undefined;
}

function readUuidArrayParam(
  params: Record<string, unknown>,
  ...keys: string[]
): string[] | undefined {
  for (const key of keys) {
    const raw = params[key];
    if (!Array.isArray(raw)) continue;
    const ids = raw.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );
    if (ids.length) return ids;
  }
  return undefined;
}

export function extractEarnPercentFromPrompt(prompt: string): number | null {
  const patterns = [
    /\bearn(?:\s+rate|\s+percent|\s+cashback|\s+back)?[^.]{0,40}?(\d+(?:\.\d+)?)\s*%/i,
    /\b(\d+(?:\.\d+)?)\s*%\s+(?:cash\s*back|cashback|back)\b/i,
    /\b(?:to|at)\s+(\d+(?:\.\d+)?)\s*(?:percent|%)/i,
    /\b(\d+(?:\.\d+)?)\s+percent\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0 && value <= 100) return value;
  }
  return null;
}

export function extractLoyaltyEnabledFromPrompt(prompt: string): boolean | null {
  if (
    /\b(?:disable|turn\s+off|deactivate|pause)\b/i.test(prompt) &&
    /\bloyalty\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:enable|turn\s+on|activate|start)\b/i.test(prompt) &&
    /\bloyalty\b/i.test(prompt)
  ) {
    return true;
  }
  return null;
}

export function isConfigureLoyaltySettingsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (READ_SIGNAL.test(text) && !CONFIGURE_VERB.test(text)) return false;
  if (/\b(?:my\s+points|point\s+balance|redeem)\b/i.test(text)) return false;

  const hasLoyalty =
    /\bloyalty\b/i.test(text) ||
    /\b(?:earn\s+rate|earn\s+percent|earn\s+cashback|cashback\s+rate|points\s+earn)\b/i.test(
      text,
    );

  if (!hasLoyalty) return false;

  return (
    CONFIGURE_VERB.test(text) ||
    extractEarnPercentFromPrompt(text) != null ||
    extractLoyaltyEnabledFromPrompt(text) != null
  );
}

export function parseConfigureLoyaltySettingsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureLoyaltySettings | null {
  const hasParamSignal =
    readNumberParam(params, 'earnPercentCashback', 'earnPercent') != null ||
    readBooleanParam(params, 'enabled', 'loyaltyEnabled') != null ||
    readUuidArrayParam(params, 'earnExcludedServiceIds') != null;

  if (!isConfigureLoyaltySettingsPrompt(prompt) && !hasParamSignal) return null;

  const earnPercentCashback =
    readNumberParam(params, 'earnPercentCashback', 'earnPercent') ??
    extractEarnPercentFromPrompt(prompt) ??
    undefined;

  const enabled =
    readBooleanParam(params, 'enabled', 'loyaltyEnabled') ??
    extractLoyaltyEnabledFromPrompt(prompt) ??
    undefined;

  const earnExcludedServiceIds = readUuidArrayParam(
    params,
    'earnExcludedServiceIds',
  );

  const parsed: ParsedConfigureLoyaltySettings = {
    earnPercentCashback,
    enabled,
    earnExcludedServiceIds,
  };

  if (
    parsed.earnPercentCashback == null &&
    parsed.enabled == null &&
    !parsed.earnExcludedServiceIds?.length &&
    !isConfigureLoyaltySettingsPrompt(prompt)
  ) {
    return null;
  }

  return parsed;
}

export function rescueConfigureLoyaltySettingsIntent(
  prompt: string,
  action: string,
): {
  action: typeof CONFIGURE_LOYALTY_SETTINGS_INTENT;
  rescueReason: string;
} | null {
  if (
    isConfigureLoyaltySettingsPrompt(prompt) &&
    action !== CONFIGURE_LOYALTY_SETTINGS_INTENT
  ) {
    return {
      action: CONFIGURE_LOYALTY_SETTINGS_INTENT,
      rescueReason: 'configure_loyalty_settings',
    };
  }
  return null;
}
