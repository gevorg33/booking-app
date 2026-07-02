import { Test } from '@nestjs/testing';
import * as decompositionUtil from './intent-decomposition.util.js';
import * as schemaModule from './intent-decomposition.schema.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { LlmService } from '../../engine/agent/llm.service.js';

describe('IntentDecompositionService', () => {
  const llm = {
    completeJson: jest.fn(),
  } as unknown as LlmService;

  const service = new IntentDecompositionService(llm);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can be constructed through Nest testing module', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        IntentDecompositionService,
        { provide: LlmService, useValue: llm },
      ],
    }).compile();
    const injected = moduleRef.get(IntentDecompositionService);
    expect(injected.isCompoundPrompt('Book package and apply promo')).toBe(
      true,
    );
  });

  it('detects compound prompts via shared markers', () => {
    expect(service.isCompoundPrompt('Book package and apply promo')).toBe(true);
    expect(service.isCompoundPrompt('hello')).toBe(false);
  });

  it('decomposes customer compounds deterministically without LLM', async () => {
    const steps = await service.decompose(
      'biz-1',
      'user-1',
      'Book spa day package for me and apply promo code WELCOME',
      'UTC',
      'customer',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'book_package',
      'apply_promo_code_checkout',
    ]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('decomposes dashboard golden cancel visit + waitlist without LLM', async () => {
    const steps = await service.decompose(
      'biz-1',
      undefined,
      'Cancel package visit and notify waitlist for Friday',
      'UTC',
      'dashboard',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('uses decomposePrompt defaults for timezone and surface', async () => {
    const steps = await service.decomposePrompt(
      'biz-1',
      undefined,
      'Cancel package visit and notify waitlist for Friday',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);
  });

  it('falls back to LLM for dashboard compounds without deterministic match', async () => {
    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'summarize_day', params: {}, reasoning: 'Summarize' },
        { action: 'list_bookings', params: {}, reasoning: 'List' },
      ],
    });

    const steps = await service.decomposePrompt(
      'biz-1',
      'owner-1',
      'Summarize today and then list all bookings for Maria',
      'America/New_York',
      'dashboard',
    );
    expect((llm.completeJson as jest.Mock).mock.calls[0][3].userId).toBe(
      'owner-1',
    );
    expect(steps).toHaveLength(2);
    expect(llm.completeJson).toHaveBeenCalled();
  });

  it('returns empty for non-compound prompts and failed LLM decomposition', async () => {
    expect(await service.decompose('biz-1', undefined, 'short')).toEqual([]);
    expect(
      await service.decompose('biz-1', undefined, 'List bookings today'),
    ).toEqual([]);
    (llm.completeJson as jest.Mock).mockRejectedValue(new Error('LLM down'));
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Optimize schedule and then rebalance capacity for next week',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);
  });

  it('filters unknown or disallowed LLM actions and single-step results', async () => {
    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'unknown', params: {}, reasoning: 'nope' },
        { params: {}, reasoning: 'missing action' },
        { action: 'not_in_registry_xyz', params: {}, reasoning: 'disallowed' },
      ],
    });
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Summarize day and then list bookings for team',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);

    (llm.completeJson as jest.Mock).mockResolvedValue(null);
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Summarize day and then list bookings for team',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);

    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [{ action: 'create_booking', params: {}, reasoning: '' }],
    });
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Book haircut and then notify waitlist customers',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);
  });

  it('handles LLM payloads without intents and preserves explicit reasoning', async () => {
    (llm.completeJson as jest.Mock).mockResolvedValue({});
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Summarize day and then list bookings for team',
        'UTC',
        'dashboard',
      ),
    ).toEqual([]);

    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        {
          action: 'summarize_day',
          params: {},
          reasoning: 'Provided reasoning',
        },
        { action: 'list_bookings', params: {}, reasoning: 'Also provided' },
      ],
    });
    const steps = await service.decompose(
      'biz-1',
      undefined,
      'Summarize day and then list bookings for team',
      'UTC',
      'dashboard',
    );
    expect(steps[0].reasoning).toBe('Provided reasoning');
  });

  it('maps LLM intents with default params and reasoning', async () => {
    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'summarize_day', params: undefined, reasoning: undefined },
        { action: 'list_bookings', params: { customerName: 'Maria' } },
      ],
    });

    const steps = await service.decomposePrompt(
      'biz-1',
      'owner-1',
      'Summarize today and then list all bookings for Maria',
    );
    expect(steps).toEqual([
      {
        action: 'summarize_day',
        params: {},
        reasoning: 'LLM compound step: summarize_day',
      },
      {
        action: 'list_bookings',
        params: { customerName: 'Maria' },
        reasoning: 'LLM compound step: list_bookings',
      },
    ]);
  });

  it('does not call LLM for customer surface when deterministic misses', async () => {
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'Optimize schedule and rebalance capacity',
        'UTC',
        'customer',
      ),
    ).toEqual([]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('returns empty for non-dashboard surfaces without deterministic match', async () => {
    expect(
      await service.decompose(
        'biz-1',
        undefined,
        'List providers and book appointment tomorrow',
        'UTC',
        'public',
      ),
    ).toEqual([]);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });

  it('uses default dashboard surface when omitted', async () => {
    const steps = await service.decompose(
      'biz-1',
      undefined,
      'Cancel package visit and notify waitlist for Friday',
    );
    expect(steps.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);

    const withTimezoneOnly = await service.decompose(
      'biz-1',
      undefined,
      'Cancel package visit and notify waitlist for Friday',
      'America/New_York',
    );
    expect(withTimezoneOnly.map((step) => step.action)).toEqual([
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ]);
  });

  it('falls through to LLM when deterministic decomposition yields a single step', async () => {
    const deterministicSpy = jest.spyOn(
      decompositionUtil,
      'decomposeDeterministicForSurface',
    );
    deterministicSpy.mockReturnValueOnce({
      surface: 'dashboard',
      source: 'deterministic',
      recipeId: 'partial_compound',
      steps: [{ action: 'summarize_day', params: {}, reasoning: 'only one' }],
    });
    (llm.completeJson as jest.Mock).mockResolvedValue({
      intents: [
        { action: 'summarize_day', params: {}, reasoning: 'Summarize' },
        { action: 'list_bookings', params: {}, reasoning: 'List' },
      ],
    });

    const steps = await service.decompose(
      'biz-1',
      undefined,
      'Summarize day and then list bookings for team',
      'UTC',
      'dashboard',
    );
    expect(steps).toHaveLength(2);
    expect(llm.completeJson).toHaveBeenCalled();
    deterministicSpy.mockRestore();
  });

  it('truncates deterministic steps to schema maxSteps and logs fallback recipe id', async () => {
    const deterministicSpy = jest.spyOn(
      decompositionUtil,
      'decomposeDeterministicForSurface',
    );
    deterministicSpy.mockReturnValueOnce({
      surface: 'dashboard',
      source: 'deterministic',
      steps: [
        { action: 'summarize_day', params: {}, reasoning: 'a' },
        { action: 'list_bookings', params: {}, reasoning: 'b' },
        { action: 'create_booking', params: {}, reasoning: 'c' },
      ],
    });
    const schemaSpy = jest.spyOn(schemaModule, 'buildDecompositionSchemaView');
    schemaSpy.mockReturnValueOnce({
      surface: 'dashboard',
      allowedActions: ['summarize_day', 'list_bookings', 'create_booking'],
      maxSteps: 2,
      compoundRecipeIds: [],
      promptBlock: 'test',
    });

    const steps = await service.decompose(
      'biz-1',
      undefined,
      'Summarize day and then list bookings for team',
      'UTC',
      'dashboard',
    );
    expect(steps).toHaveLength(2);
    deterministicSpy.mockRestore();
    schemaSpy.mockRestore();
  });

  it('delegates decompose and decomposePrompt to shared compound orchestration', async () => {
    const orchestrateSpy = jest.spyOn(
      decompositionUtil,
      'decomposeCompoundPrompt',
    );
    const mockedSteps = [
      { action: 'book_package', params: {}, reasoning: 'book' },
      { action: 'promo_code_help', params: {}, reasoning: 'promo' },
    ];
    orchestrateSpy.mockResolvedValue(mockedSteps);

    const prompt = 'Book spa day package and apply promo code WELCOME';
    const decomposed = await service.decompose(
      'biz-1',
      'cust-1',
      prompt,
      'UTC',
      'customer',
    );
    const viaPrompt = await service.decomposePrompt(
      'biz-1',
      'cust-1',
      prompt,
      'UTC',
      'customer',
    );

    expect(decomposed).toEqual(mockedSteps);
    expect(viaPrompt).toEqual(mockedSteps);
    expect(orchestrateSpy).toHaveBeenCalledTimes(2);
    expect(orchestrateSpy).toHaveBeenCalledWith(
      llm,
      'biz-1',
      'cust-1',
      prompt,
      'UTC',
      'customer',
    );
    orchestrateSpy.mockRestore();
  });

  it('returns deterministic provider compound steps', async () => {
    const steps = await service.decompose(
      'biz-1',
      'prov-1',
      'List my package visits and mark booking paid today',
      'UTC',
      'provider',
    );
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(llm.completeJson).not.toHaveBeenCalled();
  });
});
