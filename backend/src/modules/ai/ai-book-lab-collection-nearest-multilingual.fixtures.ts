import type { BookLabCollectionNearestPromptFixture } from './ai-book-lab-collection-nearest.fixtures.js';

export const BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_CLASSIFIER_RULES = `- book_lab_collection_nearest HY/RU: ամրագրիր|գրանցիր + լաբ|արյան + ամենամոտ|ամենաառաջին|скорее|ближайш|раньше + лабораторный забор|забор крови.`;

export type BookLabCollectionNearestMultilingualScenario =
  BookLabCollectionNearestPromptFixture & {
    locale: 'hy' | 'ru';
  };

const LAB_NEAREST_I18N: Record<
  string,
  { hy: string; ru: string; testName?: string }
> = {
  'lab-draw-earliest-customer': {
    hy: 'Ամրագրիր լաբ հավաքման ամենամոտ slot-ը',
    ru: 'Запиши на лабораторный забор ближайший слот',
  },
  'blood-draw-soonest-customer': {
    hy: 'Գրանցիր իմ արյան վերցումը ամենաառաջին ազատ slot-ով',
    ru: 'Запиши мой забор крови на самое раннее время',
  },
  'lab-collection-nearest-customer': {
    hy: 'Ամրագրիր իմ լաբ հավաքումը ամենամոտ հասանելի slot-ով',
    ru: 'Забронируй мой лабораторный забор на ближайшее доступное время',
  },
  'collection-asap-customer': {
    hy: 'Գրանցիր իմ լաբ հավաքումը հնարավորինս շուտ',
    ru: 'Запиши мой лабораторный забор как можно скорее',
  },
  'cbc-earliest-customer': {
    hy: 'Ամրագրիր իմ CBC արյան վերցումը ամենամոտ slot-ով',
    ru: 'Запиши мой забор CBC на ближайший слот',
    testName: 'CBC',
  },
};

function buildBookLabCollectionNearestMultilingualScenarios(): BookLabCollectionNearestMultilingualScenario[] {
  const rows: BookLabCollectionNearestMultilingualScenario[] = [];
  for (const [id, i18n] of Object.entries(LAB_NEAREST_I18N)) {
    for (const locale of ['hy', 'ru'] as const) {
      rows.push({
        id: `${id}-${locale}`,
        prompt: locale === 'hy' ? i18n.hy : i18n.ru,
        surface: 'customer',
        orderedActions: ['list_my_lab_booking_requests', 'book_lab_collection'],
        rescueReason: 'book_lab_collection_nearest_compound',
        locale,
        ...(i18n.testName ? { testName: i18n.testName } : {}),
      });
    }
  }
  return rows;
}

export const BOOK_LAB_COLLECTION_NEAREST_MULTILINGUAL_SCENARIOS: BookLabCollectionNearestMultilingualScenario[] =
  buildBookLabCollectionNearestMultilingualScenarios();
