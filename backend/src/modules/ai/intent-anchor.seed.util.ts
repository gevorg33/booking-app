import type {
  AiCommandEvalCase,
  AiEvalLocale,
} from './eval/ai-command-eval.types.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  IntentAnchor,
  SemanticIntentLocale,
} from './ai-semantic-intent.types.js';
import { looksLikeTransliteration } from './ai-prompt-i18n.js';

const ENTITY_NAME_PATTERN =
  /\b(anna|maria|james|gevorg|mary|karo|sophie|john|jane|lisa|david|sarah)\b/i;
const CODE_PATTERN = /\b(GCM-|GCB-|GCS-|emp-|cust-)\b/i;
const EMAIL_PATTERN = /@\w+\.\w+/;

/** Reject prompts with person names, codes, or emails — anchors must stay generic. */
export function isGenericSemanticAnchorPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (!trimmed || trimmed.length < 12) return false;
  if (ENTITY_NAME_PATTERN.test(trimmed)) return false;
  if (CODE_PATTERN.test(trimmed)) return false;
  if (EMAIL_PATTERN.test(trimmed)) return false;
  return true;
}

/** Normalize catalog-specific service nouns to generic "service" for anchor phrasing. */
export function sanitizePromptForSemanticAnchor(prompt: string): string {
  return prompt
    .replace(
      /\b(permanent lashes|permanent lips|spa day|beard trim|color treatment)\b/gi,
      'service',
    )
    .replace(/\b(massage|haircut|facial|manicure|lashes|lips)\b/gi, 'service')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSemanticLocale(locale?: AiEvalLocale): SemanticIntentLocale {
  if (locale === 'hy' || locale === 'ru' || locale === 'translit')
    return locale;
  return 'en';
}

/** Infer locale from script when eval cases omit locale (acc-3.12). */
export function detectSemanticPromptLocale(
  prompt: string,
): SemanticIntentLocale {
  if (/[\u0530-\u058F]/.test(prompt)) return 'hy';
  if (/[\u0400-\u04FF]/.test(prompt)) return 'ru';
  if (looksLikeTransliteration(prompt)) return 'translit';
  return 'en';
}

function defaultSurfacesForAction(action: string): CommandSurface[] {
  if (action === 'create_direct_schedule' || action === 'clear_schedule') {
    return ['dashboard'];
  }
  if (action === 'book_appointment' || action === 'check_availability') {
    return ['public'];
  }
  if (action === 'book_nearest_slot') {
    return ['dashboard', 'customer'];
  }
  return ['dashboard', 'customer', 'public'];
}

/** Convert eval golden case → anchor when flagged useSemanticIntentMatch (acc-3.12). */
export function evalCaseToIntentAnchor(
  evalCase: AiCommandEvalCase,
): IntentAnchor | null {
  const action =
    evalCase.expect.semanticMatchAction ??
    evalCase.expect.rescuedAction ??
    evalCase.expect.action;
  if (!action || evalCase.requiresLlm) return null;
  if (evalCase.expect.compoundSteps?.length) return null;
  if (evalCase.expect.expectValidationClarify) return null;
  if (!isGenericSemanticAnchorPrompt(evalCase.prompt)) return null;

  const phrase = sanitizePromptForSemanticAnchor(evalCase.prompt);
  if (!phrase) return null;

  return {
    id: `eval-${evalCase.id}`,
    action,
    phrase,
    locale: toSemanticLocale(
      evalCase.locale ?? detectSemanticPromptLocale(phrase),
    ),
    surfaces: evalCase.surface
      ? [evalCase.surface]
      : defaultSurfacesForAction(action),
    paramHints:
      evalCase.expect.semanticMatchParamsPartial ??
      evalCase.expect.paramsPartial,
    source: 'eval',
  };
}

export function dedupeIntentAnchors(anchors: IntentAnchor[]): IntentAnchor[] {
  const seen = new Set<string>();
  const out: IntentAnchor[] = [];
  for (const anchor of anchors) {
    const key = `${anchor.action}::${anchor.phrase.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(anchor);
  }
  return out;
}

export function mergeIntentAnchorBanks(
  canonical: IntentAnchor[],
  seeded: IntentAnchor[],
): IntentAnchor[] {
  const canonicalKeys = new Set(
    canonical.map((a) => `${a.action}::${a.phrase.toLowerCase()}`),
  );
  const merged = [...canonical];
  for (const anchor of seeded) {
    const key = `${anchor.action}::${anchor.phrase.toLowerCase()}`;
    if (canonicalKeys.has(key)) continue;
    merged.push(anchor);
  }
  return merged;
}
