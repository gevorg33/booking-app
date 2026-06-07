import { MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS } from './ai-check-and-book-multilingual.fixtures.js';
import {
  buildMultilingualClassifierContext,
  CLASSIFIER_MULTILINGUAL_RULES,
  containsExtendedLatin,
  containsNonEnglishScript,
  looksLikeTransliteration,
  needsMultilingualNormalization,
  promptMentionsNativeServiceType,
  promptMentionsServiceType,
  recognizeServiceTypeTerms,
} from './ai-prompt-i18n.js';

/** Realistic dashboard commands (hy / ru / translit) used in production-like scenarios. */
const COMPLEX_COMMANDS = {
  hy: {
    showWithFilters:
      'Ցույց տուր Գևորգ Գասպարյանի բոլոր հաստատված ամրագրումները այս շաբաթ facemassage-ի համար',
    conditionalBook:
      'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00, եթե ոչ՝ ցանկացած ազատ մասնագետ',
    bulkCancelRange:
      'Չեղարկել բոլոր ամրագրումները ուրբաթ 16:30-17:30 միջակայքում և ուղարկել հաճախորդներին WhatsApp հիշեցում',
    fillGaps:
      'Լրացրու ազատ ժամերը հաջորդ շաբաթվա արեվոտը Գևորգի և Մարիայի համար իրենց ծառայություններով',
    utilization:
      'Որքան է զբաղվածությունը այս ամսում և ով է ամենազբաղված մասնագետը',
    reschedule:
      'Տեղափոխիր Մարիայի հանդիպումը 15/06/2026-ից հաջորդ երկուշաբթի 13:30, ծառայությունը փոխել hot stone massage',
    hideCalendar:
      'Թաքցնել օրացույցից բոլոր չեղարկված ամրագրումները այսօր բոլոր մասնագետների համար',
    waitlist:
      'Լրացրու սպասացանկից ուրբաթ 15:00 ազատ slot-ը facemassage-ի համար',
  },
  ru: {
    showTomorrow:
      'Покажи все подтверждённые записи Марии Торгомян на завтра для услуги стрижка',
    cancelNotify:
      'Отмени все записи на пятницу с 16:30 до 17:30 и уведоми клиентов в WhatsApp',
    bookFallback:
      'Запиши массаж на Геворга завтра в 10:00, если занят — на Марию в 10:00, иначе любой свободный мастер',
    fillWeek:
      'Заполни свободные слоты на следующей неделе днём для всех мастеров по их услугам',
    conflicts:
      'Кто имеет конфликты расписания на этой неделе и предложи исправления',
    paymentSweep:
      'Отметь все завершённые неоплаченные записи за последние 30 дней как оплаченные',
    reschedule:
      'Перенеси запись Марии с 15/06/2026 на следующий понедельник 13:30, смени услугу на hot stone massage',
  },
  translit: {
    compound:
      'pokazhi vse zapisi Gevorg na vagh@ i otmeni vse mezhdu 16:30-17:30',
    book: 'amsagrum facemassage Gevorg 10:00 vagh@ esli zanyat Mary',
    gaps: 'zapolni azat sloty na etoy nedele dlya Gevorg i Mary',
  },
} as const;

/** Commands that name a service type in Armenian or Russian (not only English catalog slugs). */
const SERVICE_TYPE_COMMANDS = {
  hy: {
    haircut: 'Ամրագրիր կտրում Գևորգի հետ վաղը 14:00',
    massage: 'Ցույց տուր բոլոր մասաժ ամրագրումները այս շաբաթ',
    facial: 'Փոխել ծառայությունը դիմահարդարում հաջորդ երկուշաբթի',
    manicure: 'Լրացրու ազատ slot-երը մանիկյուրի համար ուրբաթ',
  },
  ru: {
    haircut: 'Запиши стрижку на Геворга завтра в 11:00',
    massage: 'Покажи все записи на массаж на эту неделю',
    manicure: 'Заполни свободные слоты для маникюра в пятницу днём',
    coloring: 'Перенеси окрашивание Марии на следующий четверг 15:00',
  },
} as const;

describe('ai-prompt-i18n detection', () => {
  describe('basic script detection', () => {
    it('detects Armenian script', () => {
      expect(containsNonEnglishScript('Ցույց տուր ամրագրումները')).toBe(true);
      expect(needsMultilingualNormalization('Ցույց տուր ամրագրումները')).toBe(
        true,
      );
    });

    it('detects Russian script', () => {
      expect(containsNonEnglishScript('Покажи записи на завтра')).toBe(true);
      expect(
        needsMultilingualNormalization(COMPLEX_COMMANDS.ru.showTomorrow),
      ).toBe(true);
    });

    it('detects Latin transliteration', () => {
      expect(looksLikeTransliteration('pokazhi zapisi vagh@')).toBe(true);
      expect(needsMultilingualNormalization('pokazhi zapisi vagh@')).toBe(true);
    });

    it('skips plain English commands', () => {
      expect(
        needsMultilingualNormalization('Show Gevorg appointments tomorrow'),
      ).toBe(false);
      expect(
        needsMultilingualNormalization(
          'Cancel all appointments Friday 16:30-17:30 and notify customers',
        ),
      ).toBe(false);
    });

    it('skips empty and whitespace-only prompts', () => {
      expect(needsMultilingualNormalization('')).toBe(false);
      expect(needsMultilingualNormalization('   ')).toBe(false);
    });
  });

  describe('complex Armenian commands', () => {
    it.each([
      ['showWithFilters', COMPLEX_COMMANDS.hy.showWithFilters],
      ['conditionalBook', COMPLEX_COMMANDS.hy.conditionalBook],
      ['bulkCancelRange', COMPLEX_COMMANDS.hy.bulkCancelRange],
      ['fillGaps', COMPLEX_COMMANDS.hy.fillGaps],
      ['utilization', COMPLEX_COMMANDS.hy.utilization],
      ['reschedule', COMPLEX_COMMANDS.hy.reschedule],
      ['hideCalendar', COMPLEX_COMMANDS.hy.hideCalendar],
    ])('requires normalization: %s', (_label, prompt) => {
      expect(needsMultilingualNormalization(prompt)).toBe(true);
      expect(containsNonEnglishScript(prompt)).toBe(true);
    });

    it('detects mixed Armenian + Latin service names', () => {
      const prompt = COMPLEX_COMMANDS.hy.conditionalBook;
      expect(containsNonEnglishScript(prompt)).toBe(true);
      expect(needsMultilingualNormalization(prompt)).toBe(true);
    });

    it('detects waitlist command with embedded English slot', () => {
      expect(needsMultilingualNormalization(COMPLEX_COMMANDS.hy.waitlist)).toBe(
        true,
      );
    });
  });

  describe('complex Russian commands', () => {
    it.each([
      ['showTomorrow', COMPLEX_COMMANDS.ru.showTomorrow],
      ['cancelNotify', COMPLEX_COMMANDS.ru.cancelNotify],
      ['bookFallback', COMPLEX_COMMANDS.ru.bookFallback],
      ['fillWeek', COMPLEX_COMMANDS.ru.fillWeek],
      ['conflicts', COMPLEX_COMMANDS.ru.conflicts],
      ['paymentSweep', COMPLEX_COMMANDS.ru.paymentSweep],
      ['reschedule', COMPLEX_COMMANDS.ru.reschedule],
    ])('requires normalization: %s', (_label, prompt) => {
      expect(needsMultilingualNormalization(prompt)).toBe(true);
      expect(containsNonEnglishScript(prompt)).toBe(true);
    });
  });

  describe('complex transliteration commands', () => {
    it.each([
      ['compound', COMPLEX_COMMANDS.translit.compound],
      ['book', COMPLEX_COMMANDS.translit.book],
      ['gaps', COMPLEX_COMMANDS.translit.gaps],
    ])('requires normalization: %s', (_label, prompt) => {
      expect(looksLikeTransliteration(prompt)).toBe(true);
      expect(needsMultilingualNormalization(prompt)).toBe(true);
      expect(containsNonEnglishScript(prompt)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('English with non-ASCII names still passes through', () => {
      const prompt = 'Reschedule María’s appointment to Friday 13:30';
      expect(containsExtendedLatin(prompt)).toBe(true);
      expect(needsMultilingualNormalization(prompt)).toBe(true);
    });

    it('does not treat pure numbers and punctuation as multilingual', () => {
      expect(needsMultilingualNormalization('16:30-17:30')).toBe(false);
    });

    it('detects long multi-clause Armenian compound intent', () => {
      const prompt = `${COMPLEX_COMMANDS.hy.bulkCancelRange} — ապա լրացրու սպասացանկից`;
      expect(needsMultilingualNormalization(prompt)).toBe(true);
    });
  });

  describe('service type term recognition', () => {
    describe('Armenian service words', () => {
      it.each([
        ['haircut', SERVICE_TYPE_COMMANDS.hy.haircut, 'կտրում'],
        ['massage', SERVICE_TYPE_COMMANDS.hy.massage, 'մասաժ'],
        ['facial', SERVICE_TYPE_COMMANDS.hy.facial, 'դիմահարդարում'],
        ['manicure', SERVICE_TYPE_COMMANDS.hy.manicure, 'մանիկյուր'],
      ])('recognizes %s (%s)', (_label, prompt, expectedTerm) => {
        const terms = recognizeServiceTypeTerms(prompt);
        expect(
          terms.some((t) => t.locale === 'hy' && t.term === expectedTerm),
        ).toBe(true);
        expect(promptMentionsNativeServiceType(prompt)).toBe(true);
        expect(promptMentionsServiceType(prompt)).toBe(true);
        expect(needsMultilingualNormalization(prompt)).toBe(true);
      });

      it('recognizes Latin catalog name inside Armenian command', () => {
        const prompt = COMPLEX_COMMANDS.hy.conditionalBook;
        const terms = recognizeServiceTypeTerms(prompt);
        expect(terms).toEqual(
          expect.arrayContaining([{ term: 'facemassage', locale: 'latin' }]),
        );
        expect(promptMentionsNativeServiceType(prompt)).toBe(false);
        expect(promptMentionsServiceType(prompt)).toBe(true);
      });

      it('preserves Armenian service term in classifier multilingual context', () => {
        const prompt = SERVICE_TYPE_COMMANDS.hy.massage;
        const ctx = buildMultilingualClassifierContext(
          prompt,
          prompt,
          'multilingual',
        );
        expect(ctx).toContain('մասաժ');
      });
    });

    describe('Russian service words', () => {
      it.each([
        ['haircut', SERVICE_TYPE_COMMANDS.ru.haircut, 'стрижк'],
        ['massage', SERVICE_TYPE_COMMANDS.ru.massage, 'массаж'],
        ['manicure', SERVICE_TYPE_COMMANDS.ru.manicure, 'маникюр'],
        ['coloring', SERVICE_TYPE_COMMANDS.ru.coloring, 'окрашиван'],
      ])('recognizes %s (%s)', (_label, prompt, expectedRoot) => {
        const terms = recognizeServiceTypeTerms(prompt);
        expect(
          terms.some(
            (t) =>
              t.locale === 'ru' &&
              t.term.toLowerCase().includes(expectedRoot.toLowerCase()),
          ),
        ).toBe(true);
        expect(promptMentionsNativeServiceType(prompt)).toBe(true);
        expect(needsMultilingualNormalization(prompt)).toBe(true);
      });

      it('recognizes стрижка in complex show-tomorrow command', () => {
        const prompt = COMPLEX_COMMANDS.ru.showTomorrow;
        const terms = recognizeServiceTypeTerms(prompt);
        expect(terms).toEqual(
          expect.arrayContaining([{ term: 'стрижка', locale: 'ru' }]),
        );
        expect(promptMentionsNativeServiceType(prompt)).toBe(true);
      });

      it('recognizes массаж in book-fallback command', () => {
        const prompt = COMPLEX_COMMANDS.ru.bookFallback;
        expect(recognizeServiceTypeTerms(prompt)).toEqual(
          expect.arrayContaining([{ term: 'массаж', locale: 'ru' }]),
        );
      });

      it('preserves Russian service term in classifier multilingual context', () => {
        const prompt = SERVICE_TYPE_COMMANDS.ru.haircut;
        const ctx = buildMultilingualClassifierContext(
          prompt,
          prompt,
          'multilingual',
        );
        expect(ctx).toMatch(/стрижк/i);
      });
    });

    it('returns no native service terms for plain English scheduling', () => {
      const prompt = 'Show Gevorg appointments tomorrow for facemassage';
      expect(recognizeServiceTypeTerms(prompt)).toEqual([
        { term: 'facemassage', locale: 'latin' },
      ]);
      expect(promptMentionsNativeServiceType(prompt)).toBe(false);
      expect(needsMultilingualNormalization(prompt)).toBe(false);
    });

    it('returns empty list for prompts without service vocabulary', () => {
      expect(recognizeServiceTypeTerms('Show all appointments today')).toEqual(
        [],
      );
      expect(promptMentionsServiceType('Show all appointments today')).toBe(
        false,
      );
    });
  });

  describe('buildMultilingualClassifierContext', () => {
    it('returns null for English passthrough', () => {
      expect(
        buildMultilingualClassifierContext(
          'Show appointments today',
          'Show appointments today',
          'passthrough',
        ),
      ).toBeNull();
    });

    it('includes multilingual hint for Armenian commands', () => {
      const original = COMPLEX_COMMANDS.hy.showWithFilters;
      const ctx = buildMultilingualClassifierContext(
        original,
        original,
        'multilingual',
      );
      expect(ctx).toContain('Armenian/Russian');
      expect(ctx).toContain('Գևորգ');
      expect(ctx).toContain(original);
    });

    it('includes multilingual hint for bulk cancel Armenian', () => {
      const original = COMPLEX_COMMANDS.hy.bulkCancelRange;
      const ctx = buildMultilingualClassifierContext(
        original,
        original,
        'multilingual',
      );
      expect(ctx).toContain('Armenian/Russian');
      expect(ctx).toContain(original);
    });

    it('includes multilingual hint for complex Russian reschedule', () => {
      const original = COMPLEX_COMMANDS.ru.reschedule;
      const ctx = buildMultilingualClassifierContext(
        original,
        original,
        'multilingual',
      );
      expect(ctx).toContain('Марии');
      expect(ctx).toContain('hot stone massage');
    });
  });

  describe('CLASSIFIER_MULTILINGUAL_RULES (ai-cmd-h1.5)', () => {
    it('documents hy/ru check+book and flexible-slot phrasing', () => {
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/ամրագրիր մոտակա/i);
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/забронируй ближайший/i);
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /bookingFirstAvailable=true/i,
      );
    });

    it('documents hy/ru business compliance phrasing (ai-cmd-compliance-6)', () => {
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /configure_privacy_retention/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /admin_delete_customer_data/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /պահել հաճախորդի տվյալները 3 տարի/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /хранить данные клиента 3 года/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/մոռանալ այս հաճախորդին/i);
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(/забыть этого клиента/i);
    });

    it('documents hy/ru business currency phrasing (ai-cmd-curr-4)', () => {
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /configure_business_currency/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /սահմանել լռելյա արժույթը AMD/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /установить валюту по умолчанию AMD/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /bulk_update_service_currency/i,
      );
    });

    it('documents hy/ru recommendation product phrasing (ai-cmd-rec-4)', () => {
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /configure_recommendation_product/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /link_recommended_products/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /explain_recommendation_setup/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /ավելացրու շամպուն ապրանք checkout-ից հետո/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /рекомендовать шампунь и кондиционер после стрижки/i,
      );
      expect(CLASSIFIER_MULTILINGUAL_RULES).toMatch(
        /բացատրիր recommendation setup/i,
      );
    });

    it.each(MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS)(
      'requires normalization for check+book prompt: $id',
      ({ prompt }) => {
        expect(needsMultilingualNormalization(prompt)).toBe(true);
      },
    );
  });
});
