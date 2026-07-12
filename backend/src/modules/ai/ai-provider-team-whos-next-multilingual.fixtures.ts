import { SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS } from '../provider-mobile/provider-team-whos-next.fixtures.js';
import type { ProviderTeamWhosNextIntent } from './ai-provider-team-whos-next.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderTeamWhosNextMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderTeamWhosNextIntent;
  rescueReason: ProviderTeamWhosNextIntent;
};

/** Classifier guidance for hy/ru team who's next (acc-2.4). */
export const PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian team who's next queue (prov-exp-4.3, manager/owner only):
  - team_whos_next: hy «ո՞վ է հաջորդը թիմում հաջորդ 2 ժամում», «ո՞վ է հաջորդը բոլոր provider-ների համար»; ru «кто следующий в команде в ближайшие 2 часа», «покажи кто следующий у всех провайдеров». NOT team_floor_status (floor counts) and NOT show_appointments (own schedule list).`;

export const PROVIDER_TEAM_WHOS_NEXT_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const TEAM_WHOS_NEXT_I18N: Record<string, { hy: string; ru: string }> = {
  'across-team': {
    hy: 'Ո՞վ է հաջորդը թիմում հաջորդ 2 ժամում',
    ru: 'Кто следующий в команде в ближайшие 2 часа',
  },
  'all-providers': {
    hy: 'Ո՞վ է հաջորդը բոլոր provider-ների համար',
    ru: 'Покажи кто следующий у всех провайдеров',
  },
  'team-queue': {
    hy: 'Թիմը — ո՞վ է հաջորդը հերթում',
    ru: 'Команда — кто следующий в очереди',
  },
  'next-2-hours': {
    hy: 'Ո՞վ է հաջորդը հաջորդ 2 ժամում թիմի համար',
    ru: 'Кто следующий в ближайшие 2 часа для команды',
  },
  'every-provider': {
    hy: 'Ցույց տուր ո՞վ է հաջորդը բոլոր provider-ների համար',
    ru: 'Кто следующий среди всех провайдеров',
  },
};

function buildProviderTeamWhosNextMultilingualScenarios(): ProviderTeamWhosNextMultilingualScenario[] {
  const rows: ProviderTeamWhosNextMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(TEAM_WHOS_NEXT_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'team_whos_next',
        rescueReason: 'team_whos_next',
      });
    }
  }

  return rows;
}

export const PROVIDER_TEAM_WHOS_NEXT_EN_SCENARIO_IDS: string[] =
  SIMILAR_PROVIDER_TEAM_WHOS_NEXT_PROMPTS.map((row) => row.id);

export const PROVIDER_TEAM_WHOS_NEXT_MULTILINGUAL_SCENARIOS: ProviderTeamWhosNextMultilingualScenario[] =
  buildProviderTeamWhosNextMultilingualScenarios();
