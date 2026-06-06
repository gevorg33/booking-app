import {
  isPrivacyDeletePrompt,
  isPrivacyExportPrompt,
} from './ai-customer-crm.util.js';
import { isHowToDownloadAppPrompt } from './ai-marketing-growth.util.js';

export const DATA_RIGHTS_INTENTS = ['explain_data_rights'] as const;

export type DataRightsIntent = (typeof DATA_RIGHTS_INTENTS)[number];

export type DataRightsAspect = 'export' | 'delete' | 'cookie_banner' | 'all';

export function isDataRightsIntent(action: string): action is DataRightsIntent {
  return (DATA_RIGHTS_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasReadCue(prompt: string): boolean {
  if (
    /\b(explain|what|how|why|where|which|can\s+i|could\s+i|do\s+i|tell\s+me|describe|mean|means|rights?)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(ինչ|ինչու|ինչպես|բացատրիր|իրավունք)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(что|почему|как|объясни|права)/i.test(prompt);
  }
  return false;
}

function hasDataRightsTopic(prompt: string): boolean {
  if (
    /\b(data\s+rights?|right\s+to\s+(?:erasure|access|portability)|gdpr|personal\s+data|account\s+data|privacy)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(export|download|delete|erase|remove|forget)\b/i.test(prompt) &&
    /\b(data|information|account|profile)\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\b(cookie\s*(?:banner|consent|notice)|cookies?\s+policy)\b/i.test(prompt)) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(տվյալ|հաշիվ|cookie|գաղտնիություն|իրավունք)/i.test(prompt);
  }
  if (containsCyrillicScript(prompt)) {
    return /(данн|аккаунт|cookie|конфиденциальн|права)/i.test(prompt);
  }
  return false;
}

function isDashboardPrivacyAdminPrompt(prompt: string): boolean {
  return (
    /\b(our salon|dashboard|business settings|keep customer data|retention period|sub[\s-]?processors?|gdpr checklist|hipaa)\b/i.test(
      prompt,
    ) ||
    (/\b(enable|disable|configure|set|keep)\b/i.test(prompt) &&
      /\b(cookie\s+banner|cookie\s+consent)\b/i.test(prompt) &&
      /\b(booking page|our)\b/i.test(prompt))
  );
}

function isDirectPrivacyMutatePrompt(prompt: string): boolean {
  if (isPrivacyExportPrompt(prompt) || isPrivacyDeletePrompt(prompt)) {
    return !hasReadCue(prompt);
  }
  return false;
}

export function isExplainDataRightsPrompt(prompt: string): boolean {
  if (isHowToDownloadAppPrompt(prompt)) return false;
  if (isDashboardPrivacyAdminPrompt(prompt)) return false;
  if (isDirectPrivacyMutatePrompt(prompt)) return false;

  if (
    /\b(cookie\s*(?:banner|consent|notice)|cookies?\s+policy)\b/i.test(prompt) &&
    (hasReadCue(prompt) ||
      /\b(see|shown|showing|appear|displayed|this\s+page|here)\b/i.test(prompt))
  ) {
    return true;
  }

  if (hasReadCue(prompt) && hasDataRightsTopic(prompt)) {
    return true;
  }

  if (
    /\bwhat\s+are\s+my\s+data\s+rights?\b/i.test(prompt) ||
    /\bhow\s+do\s+i\s+(?:export|delete|download|erase)\b/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function parseExplainDataRightsAspect(
  prompt: string,
  params: Record<string, unknown> = {},
): DataRightsAspect {
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  if (
    aspectFromParams &&
    ['export', 'delete', 'cookie_banner', 'all'].includes(aspectFromParams)
  ) {
    return aspectFromParams as DataRightsAspect;
  }

  const lower = prompt.toLowerCase();
  const hasExport =
    /\b(export|download|portability|access)\b/i.test(prompt) &&
    /\b(data|information|account|profile)\b/i.test(prompt);
  const hasDelete =
    /\b(delete|erase|remove|forget|erasure)\b/i.test(prompt) &&
    /\b(data|account|information|profile)\b/i.test(prompt);
  const hasCookie = /\b(cookie\s*(?:banner|consent|notice)|cookies?\s+policy)\b/i.test(
    lower,
  );

  const aspects = [hasExport, hasDelete, hasCookie].filter(Boolean).length;
  if (aspects > 1) return 'all';
  if (hasCookie) return 'cookie_banner';
  if (hasDelete) return 'delete';
  if (hasExport) return 'export';
  return 'all';
}

export function parseExplainDataRightsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { aspect: DataRightsAspect } | null {
  if (!isExplainDataRightsPrompt(prompt)) return null;
  return { aspect: parseExplainDataRightsAspect(prompt, params) };
}

export function rescueExplainDataRightsIntent(
  prompt: string,
  action: string,
): { action: DataRightsIntent; rescueReason: string } | null {
  if (isDataRightsIntent(action)) return null;
  if (!isExplainDataRightsPrompt(prompt)) return null;
  return {
    action: 'explain_data_rights',
    rescueReason: 'explain_data_rights',
  };
}
