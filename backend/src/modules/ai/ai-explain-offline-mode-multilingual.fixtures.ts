import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ExplainOfflineModeAspect } from './ai-explain-offline-mode.fixtures.js';

export type ExplainOfflineModeMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_offline_mode';
  rescueReason: 'consumer_offline';
  aspect?: ExplainOfflineModeAspect;
};

export const EXPLAIN_OFFLINE_MODE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain offline mode (customer mobile):
  - explain_offline_mode: hy «Ինչու է գրվում offline», «Կհամաժամացվի՞ արդյոք ամրագրումը»; ru «Почему пишет offline», «Синхронизируется ли запись». READ consumer offline banner / queue — NOT provider offline_queue_status.`;

export const EXPLAIN_OFFLINE_MODE_MULTILINGUAL_SCENARIOS: readonly ExplainOfflineModeMultilingualScenario[] =
  [
    {
      id: 'why-offline-hy-customer',
      locale: 'hy',
      prompt: 'Ինչու է գրվում offline',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'why_offline',
    },
    {
      id: 'will-sync-hy-customer',
      locale: 'hy',
      prompt: 'Կհամաժամացվի՞ արդյոք ամրագրումը',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
    {
      id: 'queued-hy-customer',
      locale: 'hy',
      prompt: 'Քանի փոփոխություն է սպասում համաժամացման',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'queued_changes',
    },
    {
      id: 'why-offline-ru-customer',
      locale: 'ru',
      prompt: 'Почему пишет offline?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'why_offline',
    },
    {
      id: 'will-sync-ru-customer',
      locale: 'ru',
      prompt: 'Синхронизируется ли моя запись?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'will_sync',
    },
    {
      id: 'cached-ru-customer',
      locale: 'ru',
      prompt: 'Почему показываются сохранённые данные салона?',
      surface: 'customer',
      expectedAction: 'explain_offline_mode',
      rescueReason: 'consumer_offline',
      aspect: 'cached_browse',
    },
  ];
