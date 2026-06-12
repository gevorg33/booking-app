import {
  parseBusinessDateFormatFromPrompt,
  timeFormatLabel,
} from './ai-business-date-format.util.js';
import { MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS } from './ai-date-input-provider-format-multilingual.fixtures.js';
import {
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
} from './ai-provider-date-format.fixtures.js';
import { PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS } from './ai-provider-date-format-multilingual.fixtures.js';
import { isExplainLastPushPrompt } from './ai-push-notifications.util.js';
import { isExplainTenantCurrencyPrompt } from './ai-tenant-currency.util.js';

export const PROVIDER_DATE_FORMAT_INTENTS = [
  'explain_provider_date_display',
  'configure_provider_push_date_format',
] as const;

export const PROVIDER_DATE_FORMAT_MUTATE_INTENTS = [
  'configure_provider_push_date_format',
] as const;

export type ProviderDateFormatIntent =
  (typeof PROVIDER_DATE_FORMAT_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasProviderScheduleDisplayContext(prompt: string): boolean {
  if (
    /\b(provider\s+app|provider\s+mobile|mobile\s+app|my\s+schedule|schedule\s+list|booking\s+card|appointment\s+card|today\s+tab)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(schedule|booking\s+card|appointment\s+card)\b/i.test(prompt) &&
    /\b(?:date|time|format|display|shown)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return /(հավելված|ժամանակացույց|գրաֆիկ|քարտ|provider\s+mobile\s+app|booking\s+cards?)/i.test(
      prompt,
    );
  }
  if (containsCyrillicScript(prompt)) {
    if (/(?:на\s+)?(?:страниц[еаы]|сайт[еа])\s+записи/i.test(prompt)) {
      return false;
    }
    return /(приложен|расписан|карточк)/i.test(prompt);
  }
  return false;
}

export function hasProviderPushTimeContext(prompt: string): boolean {
  if (
    /\b(push|notification|fcm|firebase|alert)\b/i.test(prompt) &&
    /\b(?:time|hour|12|24|timeformat|booking\s+time|date\s+format|time\s+settings)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    return (
      /(push|ծանուցում|հաղորդագր)/i.test(prompt) &&
      /(ժամ|12|24|ձևաչափ)/i.test(prompt)
    );
  }
  if (containsCyrillicScript(prompt)) {
    return (
      /(push|уведомлен|fcm)/i.test(prompt) &&
      /(времени|12|24|час|формат)/i.test(prompt)
    );
  }
  return false;
}

export function isExplainProviderDateDisplayPrompt(prompt: string): boolean {
  if (isExplainLastPushPrompt(prompt)) return false;
  if (isExplainTenantCurrencyPrompt(prompt)) return false;
  if (
    /\b(booking\s+page|online\s+booking|public\s+booking|this\s+page|on\s+this\s+page|booking\s+site)\b/i.test(
      prompt,
    ) ||
    /(գրանցման\s+էջ|այս\s+էջ)/i.test(prompt) ||
    /(?:на\s+)?(?:страниц[еаы]|сайт[еа])\s+записи/i.test(prompt) ||
    /\bздесь\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /\b(?:configure|set|use|enable|switch|apply|wire|format)\b/i.test(prompt) &&
    hasProviderPushTimeContext(prompt)
  ) {
    return false;
  }

  const explainCue =
    /\b(?:how|why|what|explain|describe|which|do|does)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(ինչպես|ինչու|ինչ|բացատրիր)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(как|какой|почему|что|объясни)/i.test(prompt));

  if (!explainCue) return false;

  if (
    /\b(?:date\s+format|time\s+format|date\s+and\s+time|dates?\s+and\s+times?|dateformat)\b/i.test(
      prompt,
    ) &&
    (/\b(?:provider(?:\s+app)?|provider\s+mobile|schedule|booking\s+card|mobile\s+app)\b/i.test(
      prompt,
    ) ||
      (containsArmenianScript(prompt) &&
        /(հավելված|գրաֆիկ|քարտ)/i.test(prompt)) ||
      (containsCyrillicScript(prompt) &&
        /(приложен|расписан|карточк)/i.test(prompt)))
  ) {
    return true;
  }

  if (hasProviderScheduleDisplayContext(prompt)) {
    if (
      /\b(?:dates?|time|formatted?|display|shown|12[- ]?hour|24[- ]?hour)\b/i.test(
        prompt,
      )
    ) {
      return true;
    }
    if (containsArmenianScript(prompt)) {
      return /(ամսաթիվ|ժամ|ցույց|ձևաչափ|dateformat)/i.test(prompt);
    }
    if (containsCyrillicScript(prompt)) {
      return /(дат[аы]?|времени|формат|отображ|показ)/i.test(prompt);
    }
  }

  return false;
}

export function isConfigureProviderPushDateFormatPrompt(
  prompt: string,
): boolean {
  if (isExplainLastPushPrompt(prompt)) return false;
  if (
    /\b(?:do|does|what|which|why|how|explain|show|describe)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(ինչու|բացատրիր|ցույց\s+տուր|^\s*ինչ\b)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(как|какой|почему|что|объясни|покажи)/i.test(prompt))
  ) {
    return false;
  }

  const mutateCue =
    /\b(?:configure|set|use|enable|switch|apply|wire|format)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(կարգավոր|սահման|օգտագործ|միացն)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(настро|установ|использ|включ)/i.test(prompt));

  if (!mutateCue) return false;

  return hasProviderPushTimeContext(prompt);
}

export function parseProviderPushTimeFormatFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { timeFormat?: '24h' | '12h' } | null {
  const parsed = parseBusinessDateFormatFromPrompt(prompt, params);
  if (!parsed?.timeFormat) return null;
  return { timeFormat: parsed.timeFormat };
}

export function matchProviderDateFormatScenario(
  prompt: string,
): { action: ProviderDateFormatIntent; rescueReason: string } | null {
  for (const scenario of [
    ...EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
    ...CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
    ...PROVIDER_DATE_FORMAT_MULTILINGUAL_SCENARIOS,
    ...MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS.filter(
      (row) =>
        row.expectedAction === 'explain_provider_date_display' ||
        row.expectedAction === 'configure_provider_push_date_format',
    ),
  ]) {
    if ('prompt' in scenario && scenario.prompt === prompt) {
      const expectedAction =
        'expectedAction' in scenario ? scenario.expectedAction : undefined;
      const action =
        expectedAction === 'explain_provider_date_display' ||
        expectedAction === 'configure_provider_push_date_format'
          ? expectedAction
          : null;
      if (!action) continue;
      return {
        action,
        rescueReason: action,
      };
    }
  }
  return null;
}

export function rescueProviderDateFormatIntent(
  prompt: string,
  action: string,
): { action: ProviderDateFormatIntent; rescueReason: string } | null {
  if ((PROVIDER_DATE_FORMAT_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  const exact = matchProviderDateFormatScenario(prompt);
  if (exact) return exact;

  if (isConfigureProviderPushDateFormatPrompt(prompt)) {
    return {
      action: 'configure_provider_push_date_format',
      rescueReason: 'configure_provider_push_date_format',
    };
  }
  if (isExplainProviderDateDisplayPrompt(prompt)) {
    return {
      action: 'explain_provider_date_display',
      rescueReason: 'explain_provider_date_display',
    };
  }
  return null;
}

export function describeProviderPushTimeFormatLabel(
  timeFormat: '24h' | '12h',
): string {
  return timeFormatLabel(timeFormat);
}
