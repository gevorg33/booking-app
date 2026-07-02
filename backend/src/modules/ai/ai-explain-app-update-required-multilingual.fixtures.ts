import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainAppUpdateRequiredAspect } from './ai-explain-app-update-required.fixtures.js';

export type ExplainAppUpdateRequiredMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_app_update_required';
  rescueReason: 'app_update_gate';
  aspect?: ExplainAppUpdateRequiredAspect;
};

export const EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain app update gate (customer mobile):
  - explain_app_update_required: hy «Ինչու պետք է թարմացնեմ հավելվածը», «Բաց թողնել թարմացումը»; ru «Почему нужно обновить приложение», «Пропустить обновление». READ AppVersionGate — NOT explain_offline_mode.`;

export const EXPLAIN_APP_UPDATE_REQUIRED_MULTILINGUAL_SCENARIOS: readonly ExplainAppUpdateRequiredMultilingualScenario[] =
  [
    {
      id: 'why-update-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու պետք է թարմացնեմ հավելվածը',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'why_update',
    },
    {
      id: 'skip-update-hy-customer',
      locale: 'hy',
      prompt: 'Բաց թողնել թարմացումը',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'skip_nudge',
    },
    {
      id: 'blocked-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու եմ արգելափակված թարմացման էկրանում',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'update_required',
    },
    {
      id: 'why-update-ru-customer',
      locale: 'ru',
      prompt: 'Почему нужно обновить приложение?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'why_update',
    },
    {
      id: 'skip-update-ru-customer',
      locale: 'ru',
      prompt: 'Пропустить обновление',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'skip_nudge',
    },
    {
      id: 'unavailable-ru-customer',
      locale: 'ru',
      prompt: 'Почему версия приложения недоступна?',
      surface: 'customer',
      expectedAction: 'explain_app_update_required',
      rescueReason: 'app_update_gate',
      aspect: 'kill_switch',
    },
  ];
