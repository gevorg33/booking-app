import type { TrackLabOrderStatusPromptFixture } from './ai-track-lab-order-status.fixtures.js';

export const TRACK_LAB_ORDER_STATUS_MULTILINGUAL_CLASSIFIER_RULES = `- track_lab_order_status HY/RU: hy «Պատրա՞ստ են իմ արդյունքները», «հետևիր իմ լաբ պատվերը», «որտեղ է իմ արյան վերլուծությունը»; ru «Готовы ли мои результаты», «отследить мой лабораторный заказ», «где мой анализ крови». Readiness tracking — NOT list/browse My Results and NOT status FAQ.`;

export type TrackLabOrderStatusMultilingualScenario =
  TrackLabOrderStatusPromptFixture & {
    locale: 'hy' | 'ru';
  };

const TRACK_I18N: Record<
  string,
  { hy: string; ru: string; testName?: string }
> = {
  'are-my-results-ready': {
    hy: 'Պատրա՞ստ են իմ արդյունքները',
    ru: 'Готовы ли мои результаты',
  },
  'any-results-ready': {
    hy: 'Իմ թեստի արդյունքներից որևէ մեկը պատրա՞ստ է',
    ru: 'Готовы ли какие-нибудь из моих результатов анализов',
  },
  'my-cbc-ready': {
    hy: 'CBC արդյունքներ ունե՞մ պատրաստ',
    ru: 'Есть ли у меня готовые результаты CBC',
    testName: 'CBC',
  },
  'track-lab-order': {
    hy: 'Հետևիր իմ լաբ պատվերը',
    ru: 'Отследить мой лабораторный заказ',
  },
  'lab-order-status': {
    hy: 'Իմ լաբ պատվeri կargavijak',
    ru: 'Статус моего лабораторного заказа',
  },
  'where-blood-work': {
    hy: 'Որտեղ է իմ արյան վերլուծությունը',
    ru: 'Где мой анализ крови',
  },
  'has-lab-come-back': {
    hy: 'Իմ արյան վերլուծությունը արդեն պատրա՞ստ է',
    ru: 'Вернулся ли уже мой анализ крови',
  },
  'is-lab-done': {
    hy: 'Իմ լաբ թեստը ավարտվա՞ծ է',
    ru: 'Мой лабораторный анализ уже готов',
  },
  'lipid-ready': {
    hy: 'Lipid panel-ը պատրա՞ստ է',
    ru: 'Готов ли уже мой липидный профиль',
    testName: 'lipid panel',
  },
  'where-cbc-result': {
    hy: 'Որտեղ է իմ CBC արդյունքը',
    ru: 'Где мой результат CBC',
    testName: 'CBC',
  },
};

function buildTrackLabOrderStatusMultilingualScenarios(): TrackLabOrderStatusMultilingualScenario[] {
  const rows: TrackLabOrderStatusMultilingualScenario[] = [];
  for (const [id, i18n] of Object.entries(TRACK_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${id}-${locale}`,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        surface: 'customer',
        expectedAction: 'track_lab_order_status',
        rescueReason: 'track_lab_order',
        locale,
        ...(i18n.testName ? { testName: i18n.testName } : {}),
      });
    }
  }
  return rows;
}

export const TRACK_LAB_ORDER_STATUS_MULTILINGUAL_SCENARIOS: TrackLabOrderStatusMultilingualScenario[] =
  buildTrackLabOrderStatusMultilingualScenarios();
