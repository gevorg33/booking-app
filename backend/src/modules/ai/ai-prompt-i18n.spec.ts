import {
  buildMultilingualClassifierContext,
  containsExtendedLatin,
  containsNonEnglishScript,
  looksLikeTransliteration,
  needsMultilingualNormalization,
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
    book:
      'amsagrum facemassage Gevorg 10:00 vagh@ esli zanyat Mary',
    gaps: 'zapolni azat sloty na etoy nedele dlya Gevorg i Mary',
  },
} as const;

describe('ai-prompt-i18n detection', () => {
  describe('basic script detection', () => {
    it('detects Armenian script', () => {
      expect(containsNonEnglishScript('Ցույց տուր ամրագրումները')).toBe(true);
      expect(needsMultilingualNormalization('Ցույց տուր ամրագրումները')).toBe(true);
    });

    it('detects Russian script', () => {
      expect(containsNonEnglishScript('Покажи записи на завтра')).toBe(true);
      expect(needsMultilingualNormalization(COMPLEX_COMMANDS.ru.showTomorrow)).toBe(true);
    });

    it('detects Latin transliteration', () => {
      expect(looksLikeTransliteration('pokazhi zapisi vagh@')).toBe(true);
      expect(needsMultilingualNormalization('pokazhi zapisi vagh@')).toBe(true);
    });

    it('skips plain English commands', () => {
      expect(needsMultilingualNormalization('Show Gevorg appointments tomorrow')).toBe(false);
      expect(needsMultilingualNormalization('Cancel all appointments Friday 16:30-17:30 and notify customers')).toBe(
        false,
      );
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
      expect(needsMultilingualNormalization(COMPLEX_COMMANDS.hy.waitlist)).toBe(true);
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

    it('includes original and normalized after LLM', () => {
      const original = COMPLEX_COMMANDS.hy.showWithFilters;
      const normalized = 'Show all confirmed facemassage appointments for Gevorg Gasparyan this week';
      const ctx = buildMultilingualClassifierContext(original, normalized, 'llm');
      expect(ctx).toContain('User command (original)');
      expect(ctx).toContain('Normalized for classification');
      expect(ctx).toContain('Gevorg');
      expect(ctx).toContain(normalized);
    });

    it('includes fallback hint for untranslated Armenian', () => {
      const original = COMPLEX_COMMANDS.hy.bulkCancelRange;
      const ctx = buildMultilingualClassifierContext(original, original, 'fallback');
      expect(ctx).toContain('Armenian/Russian');
      expect(ctx).toContain(original);
    });

    it('includes fallback hint for complex Russian reschedule', () => {
      const original = COMPLEX_COMMANDS.ru.reschedule;
      const ctx = buildMultilingualClassifierContext(original, original, 'fallback');
      expect(ctx).toContain('Марии');
      expect(ctx).toContain('hot stone massage');
    });
  });
});
