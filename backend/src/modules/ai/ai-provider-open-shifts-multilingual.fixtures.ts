import { SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS } from '../provider-mobile/provider-open-shifts.fixtures.js';
import type { ProviderOpenShiftsIntent } from './ai-provider-open-shifts.util.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ProviderOpenShiftsMultilingualScenario = {
  id: string;
  enScenarioId: string;
  locale: Extract<AiEvalLocale, 'hy' | 'ru'>;
  prompt: string;
  expectedAction: ProviderOpenShiftsIntent;
  rescueReason: string;
};

/** Classifier guidance for hy/ru provider open shifts (acc-2.4). */
export const PROVIDER_OPEN_SHIFTS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider open shifts / gap waitlist (prov-exp-7.3):
  - suggest_waitlist_for_gap: hy «լրացրու gap-ը 09/06/2026 14:00-15:30 suggest waitlist customers», «suggest waitlist customers իմ 10:00-11:00 gap-ի համար aysor»; ru «заполни gap 09/06/2026 с 14:00 до 15:30 suggest waitlist», «предложи waitlist клиентов для gap 10:00–11:00 сегодня». NOT fill_unused_slots and NOT coordinate_waitlist_offer.`;

export const PROVIDER_OPEN_SHIFTS_LEGACY_LOCALE_SIBLING_IDS: Record<
  string,
  { hy: string; ru: string }
> = {};

const OPEN_SHIFTS_I18N: Record<string, { hy: string; ru: string }> = {
  'fill-gap-waitlist': {
    hy: 'Լրացրու gap-ը 09/06/2026 14:00-15:30 — suggest waitlist customers',
    ru: 'Заполни gap 09/06/2026 с 14:00 до 15:30 — suggest waitlist customers',
  },
  'waitlist-for-open-slot': {
    hy: 'Suggest waitlist customers իմ 10:00-11:00 gap-ի համար aysor',
    ru: 'Предложи waitlist клиентов для моего gap 10:00–11:00 сегодня',
  },
  'who-on-waitlist-for-gap': {
    hy: 'Ո՞վ է waitlist-ում այս gap-ի համար',
    ru: 'Кто в waitlist для этого gap',
  },
  'suggest-waitlist-open-gap': {
    hy: 'Առաջարկիր waitlist այս բաց gap-ի համար',
    ru: 'Предложи waitlist для этого открытого gap',
  },
};

const DRAFT_WAITLIST_OFFER_MESSAGE_I18N: Record<
  string,
  { hy: string; ru: string }
> = {
  'draft-waitlist-message-gap': {
    hy: 'Գրիր SMS waitlist-ի համար երբ gap-ը բացվի',
    ru: 'Напиши SMS для waitlist когда откроется gap',
  },
  'draft-waitlist-message-top-client': {
    hy: 'Ուղարկիր հաղորդագրություն waitlist-ի առաջին հաճախորդին',
    ru: 'Отправь сообщение первому клиенту из waitlist',
  },
  'draft-waitlist-message-write': {
    hy: 'Գրիր waitlist առաջարկի հաղորդագրություն այս gap-ի համար',
    ru: 'Напиши сообщение-предложение для waitlist по этому gap',
  },
  'draft-waitlist-message-text': {
    hy: 'Ուղարկիր նամակ waitlist-ին այս բաց gap-ի մասին',
    ru: 'Напиши waitlist-у про этот открытый gap',
  },
};

const LIST_WAITLIST_FOR_MY_SERVICES_I18N: Record<
  string,
  { hy: string; ru: string }
> = {
  'list-waitlist-show-my-en': {
    hy: 'Ցուցադրիր իմ waitlist-ը',
    ru: 'Покажи мой waitlist',
  },
  'list-waitlist-whos-waiting-color-en': {
    hy: 'Ո՞վ է սպասում color-ի համար waitlist-ում',
    ru: 'Кто в waitlist на color?',
  },
  'list-waitlist-my-en': {
    hy: 'Իմ waitlist-ը',
    ru: 'Мой waitlist',
  },
  'list-waitlist-view-en': {
    hy: 'Տես իմ waitlist հաճախորդներին',
    ru: 'Посмотри мой waitlist клиентов',
  },
  'list-waitlist-check-en': {
    hy: 'Ստուգիր իմ waitlist-ը',
    ru: 'Проверь мой waitlist',
  },
  'list-waitlist-waiting-for-facial-en': {
    hy: 'Ո՞վ է սպասում facial-ի համար waitlist-ում',
    ru: 'Кто ждёт facial в waitlist?',
  },
  'list-waitlist-see-en': {
    hy: 'Տես իմ waitlist-ը այսօրվա համար',
    ru: 'Посмотри мой waitlist на сегодня',
  },
  'list-waitlist-list-en': {
    hy: 'Ցուցակագրիր իմ waitlist-ը',
    ru: 'Мой список waitlist',
  },
  'list-waitlist-whos-waiting-massage-en': {
    hy: 'Ո՞վ է սպասում massage-ի համար waitlist-ում',
    ru: 'Кто в waitlist на massage?',
  },
  'list-waitlist-waiting-for-blowdry-en': {
    hy: 'Ո՞վ է սպասում blowdry-ի համար այսօր waitlist-ում',
    ru: 'Кто ждёт blowdry сегодня в waitlist?',
  },
};

const LIST_REBOOKING_CANDIDATES_I18N: Record<
  string,
  { hy: string; ru: string }
> = {
  'rebooking-who-should-call-en': {
    hy: 'Ո՞ւմ պետք է զանգեմ այս չեղարկումից հետո',
    ru: 'Кому позвонить после этой отмены?',
  },
  'rebooking-candidates-en': {
    hy: 'Ում զանգեմ այս ազատ ժամի համար',
    ru: 'Кому позвонить на это освободившееся время?',
  },
  'rebooking-regulars-waitlist-en': {
    hy: 'Ում զանգեմ regulars-ի և waitlist-ի մասին',
    ru: 'Кому позвонить — regulars и waitlist для этой отмены?',
  },
  'rebooking-who-can-i-call-en': {
    hy: 'Ում պետք է զանգեմ այս slot-ը լրացնելու համար',
    ru: 'Кому позвонить, чтобы заполнить это окно?',
  },
  'rebooking-who-else-call-en': {
    hy: 'Ում ուրիշ պետք է զանգեմ չեղարկումից հետո',
    ru: 'Кому ещё позвонить после отмены?',
  },
  'rebooking-candidates-cancel-en': {
    hy: 'Ասա՝ ում պետք է զանգեմ այս չեղարկման համար',
    ru: 'Скажи, кому позвонить по поводу отмены',
  },
  'rebooking-regulars-only-en': {
    hy: 'Ում պետք է զանգեմ այս ծառայության regulars-ից',
    ru: 'Кому из regulars позвонить на это время?',
  },
  'rebooking-who-should-text-en': {
    hy: 'Ում պետք է զանգեմ լրացնելու այս բացը',
    ru: 'Кому позвонить, чтобы закрыть это окно?',
  },
  'rebooking-who-should-contact-en': {
    hy: 'Ում պետք է զանգեմ այս բաց տեղը լրացնելու համար',
    ru: 'Кому позвонить насчёт этого открывшегося места?',
  },
  'rebooking-candidates-generic-en': {
    hy: 'Ում պետք է զանգեմ այս բաց ժամը լրացնելու համար',
    ru: 'Кому позвонить, чтобы закрыть этот пробел?',
  },
};

const BOOK_WALK_IN_GAP_I18N: Record<string, { hy: string; ru: string }> = {
  'walk-in-quick-book-trim-en': {
    hy: 'Արագ ամրագրիր Trim walk-in հիմա',
    ru: 'Быстро забронируй Trim walk-in сейчас',
  },
  'walk-in-book-haircut-en': {
    hy: 'Ամրագրիր walk-in Haircut հիմա',
    ru: 'Забронируй walk-in Haircut сейчас',
  },
  'walk-in-book-gap-en': {
    hy: 'Ամրագրիր walk-in 14:00 gap-ում',
    ru: 'Забронируй walk-in в окне 14:00',
  },
  'walk-in-quick-book-massage-en': {
    hy: 'Արագ ամրագրիր Massage walk-in հիմա',
    ru: 'Быстро забронируй Massage walk-in сейчас',
  },
  'walk-in-book-blowdry-en': {
    hy: 'Ամրագրիր walk-in Blowdry հիմա',
    ru: 'Забронируй walk-in Blowdry сейчас',
  },
  'walk-in-quick-book-facial-en': {
    hy: 'Արագ ամրագրիր Facial walk-in այսօր',
    ru: 'Быстро забронируй Facial walk-in сегодня',
  },
  'walk-in-book-manicure-en': {
    hy: 'Գրանցիր walk-in Manicure հիմա',
    ru: 'Запиши walk-in Manicure сейчас',
  },
  'walk-in-quick-book-color-en': {
    hy: 'Արագ ամրագրիր Color walk-in հիմա',
    ru: 'Быстро забронируй Color walk-in сейчас',
  },
  'walk-in-book-pedicure-en': {
    hy: 'Գրանցիր walk-in Pedicure հիմա',
    ru: 'Запиши walk-in Pedicure сейчас',
  },
  'walk-in-quick-book-wax-en': {
    hy: 'Արագ ամրագրիր Wax walk-in հիմա',
    ru: 'Быстро забронируй Wax walk-in сейчас',
  },
};

function buildProviderOpenShiftsMultilingualScenarios(): ProviderOpenShiftsMultilingualScenario[] {
  const rows: ProviderOpenShiftsMultilingualScenario[] = [];

  for (const [enScenarioId, i18n] of Object.entries(OPEN_SHIFTS_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'suggest_waitlist_for_gap',
        rescueReason: 'fill_gap_waitlist',
      });
    }
  }
  for (const [enScenarioId, i18n] of Object.entries(
    DRAFT_WAITLIST_OFFER_MESSAGE_I18N,
  )) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'draft_waitlist_offer_message',
        rescueReason: 'draft_waitlist_offer_message',
      });
    }
  }
  for (const [enScenarioId, i18n] of Object.entries(
    LIST_WAITLIST_FOR_MY_SERVICES_I18N,
  )) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'list_waitlist_for_my_services',
        rescueReason: 'list_waitlist_for_my_services',
      });
    }
  }
  for (const [enScenarioId, i18n] of Object.entries(
    LIST_REBOOKING_CANDIDATES_I18N,
  )) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'list_rebooking_candidates',
        rescueReason: 'list_rebooking_candidates',
      });
    }
  }
  for (const [enScenarioId, i18n] of Object.entries(BOOK_WALK_IN_GAP_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${enScenarioId}-${locale}`,
        enScenarioId,
        locale,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        expectedAction: 'book_walk_in_gap',
        rescueReason: 'book_walk_in_gap',
      });
    }
  }

  return rows;
}

export const PROVIDER_OPEN_SHIFTS_EN_SCENARIO_IDS: string[] =
  SIMILAR_PROVIDER_OPEN_SHIFTS_PROMPTS.map((row) => row.id);

export const PROVIDER_OPEN_SHIFTS_MULTILINGUAL_SCENARIOS: ProviderOpenShiftsMultilingualScenario[] =
  buildProviderOpenShiftsMultilingualScenarios();
