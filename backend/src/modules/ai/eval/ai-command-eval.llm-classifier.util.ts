import type { AppLocale } from '../../../common/i18n/messages.js';
import { localeLanguageInstruction } from '../../../common/i18n/messages.js';
import type { CommandSurface } from '../ai-command-registry.types.js';
import { buildDashboardClassifierSystemContent } from '../ai-command-dashboard-classifier.util.js';
import {
  appendMultilingualClassifierContext,
  buildClassifierCatalogContext,
  type ClassifierCatalog,
} from '../ai-command-routing.util.js';
import { buildCustomerClassifierSchema } from '../customer-ai-command.util.js';
import {
  buildMultilingualClassifierContext,
  needsMultilingualNormalization,
} from '../ai-prompt-i18n.js';
import { buildPublicClassifierSchema } from '../../public-booking/public-booking-assistant.service.js';
import type { AiCommandEvalCase, AiEvalLocale } from './ai-command-eval.types.js';

export const LLM_EVAL_CLASSIFIER_CATALOG: ClassifierCatalog = {
  employees: [
    { id: 'emp-1', name: 'Gevorg Gasparyan' } as ClassifierCatalog['employees'][0],
    { id: 'emp-2', name: 'Mary Torgomyan' } as ClassifierCatalog['employees'][0],
    { id: 'emp-3', name: 'Maria Lopez' } as ClassifierCatalog['employees'][0],
  ],
  services: [
    { id: 'svc-1', name: 'facemassage' } as ClassifierCatalog['services'][0],
    { id: 'svc-2', name: 'permanent lashes' } as ClassifierCatalog['services'][0],
    { id: 'svc-3', name: 'massage' } as ClassifierCatalog['services'][0],
  ],
  customers: [],
  templates: [],
};

export interface LlmEvalClassifierMessage {
  role: 'system' | 'user';
  content: string;
}

function toAppLocale(locale: AiEvalLocale | undefined): AppLocale {
  if (locale === 'hy' || locale === 'ru') {
    return locale;
  }
  return 'en';
}

/** Infer surface for requiresLlm golden cases when not explicitly tagged. */
export function inferLlmEvalSurface(evalCase: AiCommandEvalCase): CommandSurface {
  if (evalCase.surface) {
    return evalCase.surface;
  }

  const id = evalCase.id;
  const disambigMatch = id.match(
    /^llm-disambig-(dashboard|customer|public|provider)-/,
  );
  if (disambigMatch) {
    return disambigMatch[1] as CommandSurface;
  }
  if (
    id.includes('-dashboard-') ||
    id === 'llm-hy-conditional-book' ||
    id === 'llm-hy-check-book-compound' ||
    id === 'llm-en-bulk-cancel'
  ) {
    return 'dashboard';
  }
  if (id.includes('-customer-') || id === 'llm-ru-flexible-book') {
    return 'customer';
  }
  if (id.includes('-public-') || id.startsWith('llm-translit-public-')) {
    return 'public';
  }

  const action = evalCase.expect.action;
  if (
    action === 'book_appointment' ||
    (action === 'check_availability' && id.includes('public'))
  ) {
    return 'public';
  }
  if (action === 'book_nearest_slot' || action === 'check_providers_for_service') {
    return 'customer';
  }
  return 'dashboard';
}

export function buildLlmEvalCatalogContext(timeZone = 'UTC'): string {
  return buildClassifierCatalogContext(LLM_EVAL_CLASSIFIER_CATALOG, timeZone);
}

export function buildLlmEvalMultilingualHint(
  prompt: string,
  locale?: AiEvalLocale,
): string | null {
  if (locale && locale !== 'en') {
    return buildMultilingualClassifierContext(prompt, prompt, 'multilingual');
  }
  if (needsMultilingualNormalization(prompt)) {
    return buildMultilingualClassifierContext(prompt, prompt, 'multilingual');
  }
  return null;
}

/** Build production-equivalent classify_intent messages for one eval case. */
export function buildLlmEvalClassifierMessages(
  evalCase: AiCommandEvalCase,
  options: { timeZone?: string; catalogContext?: string } = {},
): { surface: CommandSurface; messages: LlmEvalClassifierMessage[] } {
  const surface = inferLlmEvalSurface(evalCase);
  const timeZone = options.timeZone ?? 'UTC';
  const catalogContext =
    options.catalogContext ?? buildLlmEvalCatalogContext(timeZone);
  const multilingualHint = buildLlmEvalMultilingualHint(
    evalCase.prompt,
    evalCase.locale,
  );
  const locale = toAppLocale(evalCase.locale);

  if (surface === 'dashboard') {
    return {
      surface,
      messages: [
        {
          role: 'system',
          content: buildDashboardClassifierSystemContent({
            catalogContext: appendMultilingualClassifierContext(
              catalogContext,
              multilingualHint,
            ),
          }),
        },
        { role: 'user', content: evalCase.prompt },
      ],
    };
  }

  if (surface === 'customer') {
    return {
      surface,
      messages: [
        {
          role: 'system',
          content: `${buildCustomerClassifierSchema()}\n\n${appendMultilingualClassifierContext(catalogContext, multilingualHint)}`.trim(),
        },
        { role: 'user', content: `User: ${evalCase.prompt}` },
      ],
    };
  }

  return {
    surface: 'public',
    messages: [
      {
        role: 'system',
        content:
          `${buildPublicClassifierSchema()}\n\n${localeLanguageInstruction(locale)}\n\n${appendMultilingualClassifierContext(catalogContext, multilingualHint)}`.trim(),
      },
      { role: 'user', content: evalCase.prompt },
    ],
  };
}
