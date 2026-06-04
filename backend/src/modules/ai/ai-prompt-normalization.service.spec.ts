import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';

const HY_CONDITIONAL_BOOK =
  'Ամրագրիր facemassage Գևորգի հետ վաղը 09:00, եթե զբաղված է՝ Մարիայի հետ 09:00, եթե ոչ՝ ցանկացած ազատ մասնագետ';

const HY_BULK_CANCEL =
  'Չեղարկել բոլոր ամրագրումները ուրբաթ 16:30-17:30 միջակայքում և ուղարկել հաճախորդներին WhatsApp';

const RU_BOOK_FALLBACK =
  'Запиши массаж на Геворга завтра в 10:00, если занят — на Марию в 10:00, иначе любой свободный мастер';

const TRANSLIT_COMPOUND =
  'pokazhi vse zapisi Gevorg na vagh@ i otmeni vse mezhdu 16:30-17:30';

describe('AiPromptNormalizationService', () => {
  const openAi = {
    isAvailableForBusiness: jest.fn(),
    chatCompletion: jest.fn(),
  } as unknown as OpenAiGatewayService;

  let service: AiPromptNormalizationService;

  const mockLlmResponse = (content: string) => {
    (openAi.isAvailableForBusiness as jest.Mock).mockResolvedValue(true);
    (openAi.chatCompletion as jest.Mock).mockResolvedValue({
      choices: [{ message: { content } }],
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiPromptNormalizationService(openAi);
  });

  it('passes through English unchanged', async () => {
    const result = await service.normalizeForClassifier('biz-1', 'u1', 'Show appointments today');
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe('Show appointments today');
    expect(result.classifierContext).toBeNull();
    expect(openAi.chatCompletion).not.toHaveBeenCalled();
  });

  it('passes through complex English compound commands', async () => {
    const prompt =
      "Cancel all of Maria's appointments next week between 16:30-17:30, notify customers, then fill from waitlist on Friday 15:00 for facemassage";
    const result = await service.normalizeForClassifier('biz-1', 'u1', prompt);
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe(prompt);
    expect(openAi.chatCompletion).not.toHaveBeenCalled();
  });

  it('normalizes simple Armenian via LLM', async () => {
    mockLlmResponse('Show all appointments today');

    const result = await service.normalizeForClassifier('biz-1', 'u1', 'Ցույց տուր բոլոր ամրագրումները այսօր');
    expect(result.method).toBe('llm');
    expect(result.normalized).toBe('Show all appointments today');
    expect(result.classifierContext).toContain('Normalized for classification');
    expect(openAi.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'normalize_prompt', businessId: 'biz-1' }),
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Ցույց տուր բոլոր ամրագրումները այսօր' }),
        ]),
        temperature: 0,
      }),
    );
  });

  it('normalizes conditional Armenian booking preserving names', async () => {
    const normalized =
      'Book facemassage with Gevorg tomorrow 09:00, if busy then Mary at 09:00, else any available provider';
    mockLlmResponse(normalized);

    const result = await service.normalizeForClassifier('biz-1', 'u1', HY_CONDITIONAL_BOOK);
    expect(result.method).toBe('llm');
    expect(result.normalized).toBe(normalized);
    expect(result.classifierContext).toContain('facemassage');
    expect(result.classifierContext).toContain('Գևորգ');
  });

  it('normalizes bulk cancel with time range and channel', async () => {
    const normalized =
      'Cancel all appointments Friday between 16:30-17:30 and notify customers via WhatsApp';
    mockLlmResponse(normalized);

    const result = await service.normalizeForClassifier('biz-1', 'u1', HY_BULK_CANCEL);
    expect(result.method).toBe('llm');
    expect(result.normalized).toContain('16:30');
    expect(result.normalized).toContain('WhatsApp');
  });

  it('normalizes complex Russian fallback booking chain', async () => {
    const normalized =
      'Book massage with Gevorg tomorrow 10:00, if busy Mary at 10:00, else any free provider';
    mockLlmResponse(normalized);

    const result = await service.normalizeForClassifier('biz-2', 'u2', RU_BOOK_FALLBACK);
    expect(result.method).toBe('llm');
    expect(result.normalized).toBe(normalized);
    expect(openAi.chatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'biz-2' }),
      expect.objectContaining({
        messages: expect.arrayContaining([{ role: 'user', content: RU_BOOK_FALLBACK }]),
      }),
    );
  });

  it('normalizes transliterated multi-step command', async () => {
    const normalized = 'Show all Gevorg appointments tomorrow and cancel all between 16:30-17:30';
    mockLlmResponse(normalized);

    const result = await service.normalizeForClassifier('biz-1', 'u1', TRANSLIT_COMPOUND);
    expect(result.method).toBe('llm');
    expect(result.normalized).toBe(normalized);
    expect(result.original).toBe(TRANSLIT_COMPOUND);
  });

  it('caches normalization per business and prompt', async () => {
    mockLlmResponse('Show Gevorg appointments tomorrow');

    const prompt = 'Ցույց տուր Գևորգի ամրագրումները վաղը';
    const first = await service.normalizeForClassifier('biz-1', 'u1', prompt);
    const second = await service.normalizeForClassifier('biz-1', 'u1', prompt);

    expect(first.normalized).toBe(second.normalized);
    expect(openAi.chatCompletion).toHaveBeenCalledTimes(1);
  });

  it('does not share cache across businesses', async () => {
    mockLlmResponse('Show appointments');

    const prompt = 'Ցույց տուր ամրագրումները';
    await service.normalizeForClassifier('biz-a', 'u1', prompt);
    await service.normalizeForClassifier('biz-b', 'u1', prompt);

    expect(openAi.chatCompletion).toHaveBeenCalledTimes(2);
  });

  it('falls back when LLM is unavailable', async () => {
    (openAi.isAvailableForBusiness as jest.Mock).mockResolvedValue(false);

    const result = await service.normalizeForClassifier('biz-1', 'u1', 'Չեղարկել ամրագրումները');
    expect(result.method).toBe('fallback');
    expect(result.normalized).toBe('Չեղարկել ամրագրումները');
    expect(result.classifierContext).toContain('Armenian/Russian');
  });

  it('falls back when LLM returns empty content', async () => {
    (openAi.isAvailableForBusiness as jest.Mock).mockResolvedValue(true);
    (openAi.chatCompletion as jest.Mock).mockResolvedValue({
      choices: [{ message: { content: '   ' } }],
    });

    const result = await service.normalizeForClassifier('biz-1', 'u1', HY_BULK_CANCEL);
    expect(result.method).toBe('fallback');
    expect(result.normalized).toBe(HY_BULK_CANCEL);
    expect(result.classifierContext).toContain(HY_BULK_CANCEL);
  });

  it('collapses extra whitespace from LLM output', async () => {
    mockLlmResponse('Show   appointments   today');

    const result = await service.normalizeForClassifier('biz-1', 'u1', 'Ցույց տուր ամրագրումները');
    expect(result.normalized).toBe('Show appointments today');
  });

  it('handles empty prompt', async () => {
    const result = await service.normalizeForClassifier('biz-1', 'u1', '  ');
    expect(result.method).toBe('passthrough');
    expect(result.normalized).toBe('');
    expect(result.classifierContext).toBeNull();
    expect(openAi.chatCompletion).not.toHaveBeenCalled();
  });
});
