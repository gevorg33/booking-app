import { Test, type TestingModule } from '@nestjs/testing';
import {
  PublicCommandUnderstandingAdapter,
  buildPublicClassifyCallbacks,
  buildPublicUnderstandInput,
} from './public-command-understanding.adapter.js';
import { buildPublicClassifierContext } from './command-understanding-public.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import {
  PUBLIC_COMMAND_UNDERSTANDING_SURFACE,
  PUBLIC_UNDERSTANDING_ADAPTER_PIPE_MARKER,
} from './command-understanding-adapter.types.js';

describe('public-command-understanding.adapter (pipe-1.12.4)', () => {
  it('exports pipe marker and public surface constant', () => {
    expect(PUBLIC_UNDERSTANDING_ADAPTER_PIPE_MARKER).toBe('pipe-1.12.4');
    expect(PUBLIC_COMMAND_UNDERSTANDING_SURFACE).toBe('public');
  });

  it('buildPublicClassifierContext includes locale, business block, and HY/RU hint', () => {
    const context = buildPublicClassifierContext({
      locale: 'hy',
      businessContextBlock: 'Business: Salon\nProviders: Anna',
      pipelineContext: {
        originalPrompt: 'book haircut',
        normalizedPrompt: 'book haircut',
        classifierContext: 'User locale: hy',
        method: 'passthrough',
      },
    });

    expect(context).toContain('Business: Salon');
    expect(context).toContain('Providers: Anna');
    expect(context).toContain('User locale: hy');
    expect(context).toContain('check_availability');
  });

  it('buildPublicClassifyCallbacks forwards narrow shortlist', async () => {
    const classify = jest.fn().mockResolvedValue({
      action: 'check_availability',
      params: {},
      reasoning: 'narrow',
      confidence: 0.72,
    });

    const { narrowReclassify } = buildPublicClassifyCallbacks({
      locale: 'en',
      businessContextBlock: 'Business: Demo',
      classify,
    });

    await narrowReclassify!(
      ['check_availability', 'book_appointment'],
      {
        originalPrompt: 'any openings tomorrow',
        normalizedPrompt: 'any openings tomorrow',
        classifierContext: null,
        method: 'passthrough',
      },
    );

    expect(classify).toHaveBeenCalledWith(
      'any openings tomorrow',
      expect.stringContaining('check_availability'),
      ['check_availability', 'book_appointment'],
    );
  });

  it('buildPublicUnderstandInput maps confidence bands and surface', () => {
    const input = buildPublicUnderstandInput({
      businessId: 'biz-public',
      effectivePrompt: 'What massages do you offer?',
      confidence: { low: 0.61, high: 0.88 },
      sessionConfidenceHigh: 0.9,
      lastAction: 'list_services',
      locale: 'en',
      businessContextBlock: 'Business: Spa',
      classify: jest.fn(),
    });

    expect(input.surface).toBe('public');
    expect(input.confidenceLow).toBe(0.61);
    expect(input.confidenceHigh).toBe(0.9);
    expect(input.lastAction).toBe('list_services');
  });

  describe('PublicCommandUnderstandingAdapter', () => {
    let adapter: PublicCommandUnderstandingAdapter;
    let understandMock: jest.Mock;

    beforeEach(async () => {
      understandMock = jest.fn().mockResolvedValue({
        status: 'resolved',
        action: 'list_services',
        params: {},
        reasoning: 'adapter',
        confidence: 0.91,
        candidates: [],
        trace: [],
        gate: {},
        context: {},
        normalization: {},
        surface: 'public',
      });

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          PublicCommandUnderstandingAdapter,
          {
            provide: CommandUnderstandingPipelineService,
            useValue: { understand: understandMock },
          },
        ],
      }).compile();

      adapter = moduleRef.get(PublicCommandUnderstandingAdapter);
    });

    it('delegates understand to CommandUnderstandingPipelineService', async () => {
      await adapter.understand({
        businessId: 'biz-adapter',
        effectivePrompt: 'List services under $50',
        confidence: { low: 0.65, high: 0.82 },
        locale: 'en',
        businessContextBlock: 'Business: Salon',
        classify: jest.fn(),
      });

      expect(understandMock).toHaveBeenCalledTimes(1);
      expect(understandMock.mock.calls[0][0].surface).toBe('public');
    });
  });
});
