import { Test, type TestingModule } from '@nestjs/testing';
import {
  ProviderCommandUnderstandingAdapter,
  buildProviderClassifyCallbacks,
  buildProviderUnderstandInput,
} from './provider-command-understanding.adapter.js';
import { buildProviderClassifierContext } from './command-understanding-provider.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import {
  PROVIDER_COMMAND_UNDERSTANDING_SURFACE,
  PROVIDER_UNDERSTANDING_ADAPTER_PIPE_MARKER,
} from './command-understanding-adapter.types.js';

describe('provider-command-understanding.adapter (pipe-1.12.2)', () => {
  it('exports pipe marker and provider surface constant', () => {
    expect(PROVIDER_UNDERSTANDING_ADAPTER_PIPE_MARKER).toBe('pipe-1.12.2');
    expect(PROVIDER_COMMAND_UNDERSTANDING_SURFACE).toBe('provider');
  });

  it('buildProviderClassifierContext includes provider name, view mode, and HY/RU hint', () => {
    const context = buildProviderClassifierContext({
      providerName: 'Anna',
      viewMode: 'team',
      sessionContext: { routeHint: 'calendar' },
      pipelineContext: {
        originalPrompt: 'Կտրվածք',
        normalizedPrompt: 'Կտրվածք',
        classifierContext: 'User locale: hy',
        method: 'passthrough',
      },
    });

    expect(context).toContain('Anna');
    expect(context).toContain('team');
    expect(context).toContain('User locale: hy');
  });

  it('buildProviderClassifyCallbacks forwards narrow shortlist', async () => {
    const classify = jest.fn().mockResolvedValue({
      action: 'list_bookings',
      params: {},
      reasoning: 'narrow',
      confidence: 0.7,
    });

    const { narrowReclassify } = buildProviderClassifyCallbacks({
      providerName: 'Anna',
      viewMode: 'self',
      classify,
    });

    await narrowReclassify!(['list_bookings', 'show_appointments'], {
      originalPrompt: 'schedule today',
      normalizedPrompt: 'schedule today',
      classifierContext: null,
      method: 'passthrough',
    });

    expect(classify).toHaveBeenCalledWith(
      'schedule today',
      expect.stringContaining('Anna'),
      ['list_bookings', 'show_appointments'],
    );
  });

  it('buildProviderUnderstandInput maps confidence bands and surface', () => {
    const input = buildProviderUnderstandInput({
      businessId: 'biz-provider',
      userId: 'user-1',
      effectivePrompt: 'Who is next on the floor?',
      providerName: 'Anna',
      viewMode: 'team',
      confidence: { low: 0.61, high: 0.88 },
      sessionConfidenceHigh: 0.9,
      lastAction: 'team_whos_next',
      employees: [{ id: 'e1', name: 'Anna' }],
      classify: jest.fn(),
    });

    expect(input.surface).toBe('provider');
    expect(input.confidenceLow).toBe(0.61);
    expect(input.confidenceHigh).toBe(0.9);
    expect(input.employees).toEqual([{ id: 'e1', name: 'Anna' }]);
    expect(input.lastAction).toBe('team_whos_next');
  });

  describe('ProviderCommandUnderstandingAdapter', () => {
    let adapter: ProviderCommandUnderstandingAdapter;
    let understandMock: jest.Mock;

    beforeEach(async () => {
      understandMock = jest.fn().mockResolvedValue({
        status: 'resolved',
        action: 'team_whos_next',
        params: {},
        reasoning: 'adapter',
        confidence: 0.91,
        candidates: [],
        trace: [],
        gate: {},
        context: {},
        normalization: {},
        surface: 'provider',
      });

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          ProviderCommandUnderstandingAdapter,
          {
            provide: CommandUnderstandingPipelineService,
            useValue: { understand: understandMock },
          },
        ],
      }).compile();

      adapter = moduleRef.get(ProviderCommandUnderstandingAdapter);
    });

    it('delegates understand to CommandUnderstandingPipelineService', async () => {
      await adapter.understand({
        businessId: 'biz-adapter',
        userId: 'user-1',
        effectivePrompt: 'Who is next?',
        providerName: 'Anna',
        viewMode: 'team',
        confidence: { low: 0.65, high: 0.82 },
        classify: jest.fn(),
      });

      expect(understandMock).toHaveBeenCalledTimes(1);
      expect(understandMock.mock.calls[0][0].surface).toBe('provider');
    });
  });
});
