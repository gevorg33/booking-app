import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';

const HY_CONDITIONAL_BOOK =
  'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00, եթե ոչ՝ ցանկացած ազատ մասնագետ';

const HY_BULK_CANCEL =
  'Չեղարկել բոլոր ամրագրումները ուրբաթ 16:30-17:30 միջակայքում և ուղարկել հաճախորդներին WhatsApp';

const RU_BOOK_FALLBACK =
  'Запиши массаж на Геворга завтра в 10:00, если занят — на Марию в 10:00, иначе любой свободный мастер';

const TRANSLIT_COMPOUND =
  'pokazhi vse zapisi Gevorg na vagh@ i otmeni vse mezhdu 16:30-17:30';

describe('AiPromptNormalizationService', () => {
  let service: AiPromptNormalizationService;

  beforeEach(() => {
    service = new AiPromptNormalizationService();
  });

  it('passes through English unchanged', async () => {
    const result = await service.normalizeForClassifier(
      'biz-1',
      'u1',
      'Show appointments today',
    );
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe('Show appointments today');
    expect(result.classifierContext).toBeNull();
  });

  it('passes through complex English compound commands', async () => {
    const prompt =
      "Cancel all of Maria's appointments next week between 16:30-17:30, notify customers, then fill from waitlist on Friday 15:00 for facemassage";
    const result = await service.normalizeForClassifier('biz-1', 'u1', prompt);
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe(prompt);
    expect(result.classifierContext).toBeNull();
  });

  it('passes Armenian through for classify_intent with multilingual context', async () => {
    const prompt = 'Ցույց տուր բոլոր ամրագրումները այսօր';
    const result = await service.normalizeForClassifier('biz-1', 'u1', prompt);
    expect(result.method).toBe('multilingual');
    expect(result.normalized).toBe(prompt);
    expect(result.classifierContext).toContain('Armenian/Russian');
    expect(result.classifierContext).toContain(prompt);
  });

  it('preserves conditional Armenian booking text for classifier', async () => {
    const result = await service.normalizeForClassifier(
      'biz-1',
      'u1',
      HY_CONDITIONAL_BOOK,
    );
    expect(result.method).toBe('multilingual');
    expect(result.normalized).toBe(HY_CONDITIONAL_BOOK);
    expect(result.classifierContext).toContain('facemassage');
    expect(result.classifierContext).toContain('Գևորգ');
  });

  it('preserves bulk cancel Armenian with time range', async () => {
    const result = await service.normalizeForClassifier(
      'biz-1',
      'u1',
      HY_BULK_CANCEL,
    );
    expect(result.method).toBe('multilingual');
    expect(result.normalized).toBe(HY_BULK_CANCEL);
    expect(result.classifierContext).toContain('16:30');
    expect(result.classifierContext).toContain('WhatsApp');
  });

  it('preserves complex Russian fallback booking chain', async () => {
    const result = await service.normalizeForClassifier(
      'biz-2',
      'u2',
      RU_BOOK_FALLBACK,
    );
    expect(result.method).toBe('multilingual');
    expect(result.normalized).toBe(RU_BOOK_FALLBACK);
    expect(result.classifierContext).toContain(RU_BOOK_FALLBACK);
  });

  it('handles transliterated multi-step command', async () => {
    const result = await service.normalizeForClassifier(
      'biz-1',
      'u1',
      TRANSLIT_COMPOUND,
    );
    expect(result.method).toBe('multilingual');
    expect(result.normalized).toBe(TRANSLIT_COMPOUND);
    expect(result.original).toBe(TRANSLIT_COMPOUND);
  });

  it('caches multilingual context per business and prompt', async () => {
    const prompt = 'Ցույց տուր Գևորգի ամրագրումները վաղը';
    const first = await service.normalizeForClassifier('biz-1', 'u1', prompt);
    const second = await service.normalizeForClassifier('biz-1', 'u1', prompt);

    expect(first).toEqual(second);
    expect(first.method).toBe('multilingual');
  });

  it('does not share cache across businesses', async () => {
    const prompt = 'Ցույց տուր ամրագրումները';
    const a = await service.normalizeForClassifier('biz-a', 'u1', prompt);
    const b = await service.normalizeForClassifier('biz-b', 'u1', prompt);

    expect(a.classifierContext).toEqual(b.classifierContext);
    expect(a).not.toBe(b);
  });

  it('handles empty prompt', async () => {
    const result = await service.normalizeForClassifier('biz-1', 'u1', '  ');
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe('');
    expect(result.classifierContext).toBeNull();
  });
});
