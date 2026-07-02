import { Test, type TestingModule } from '@nestjs/testing';
import {
  CustomerCommandUnderstandingAdapter,
  buildCustomerClassifyCallbacks,
  buildCustomerUnderstandInput,
} from './customer-command-understanding.adapter.js';
import { buildCustomerClassifierContext } from './command-understanding-customer.util.js';
import { CommandUnderstandingPipelineService } from './command-understanding-pipeline.service.js';
import {
  CUSTOMER_COMMAND_UNDERSTANDING_SURFACE,
  CUSTOMER_UNDERSTANDING_ADAPTER_PIPE_MARKER,
} from './command-understanding-adapter.types.js';

describe('customer-command-understanding.adapter (pipe-1.12.3)', () => {
  it('exports pipe marker and customer surface constant', () => {
    expect(CUSTOMER_UNDERSTANDING_ADAPTER_PIPE_MARKER).toBe('pipe-1.12.3');
    expect(CUSTOMER_COMMAND_UNDERSTANDING_SURFACE).toBe('customer');
  });

  it('buildCustomerClassifierContext includes capability hints and HY/RU hint', () => {
    const context = buildCustomerClassifierContext({
      sessionContext: { _capabilityHints: 'Customer capability hints block' },
      pipelineContext: {
        originalPrompt: 'book haircut',
        normalizedPrompt: 'book haircut',
        classifierContext: 'User locale: hy',
        method: 'passthrough',
      },
    });

    expect(context).toContain('Customer capability hints block');
    expect(context).toContain('User locale: hy');
    expect(context).toContain('list_my_appointments');
  });

  it('buildCustomerClassifyCallbacks forwards narrow shortlist', async () => {
    const classify = jest.fn().mockResolvedValue({
      action: 'check_availability',
      params: {},
      reasoning: 'narrow',
      confidence: 0.72,
    });

    const { narrowReclassify } = buildCustomerClassifyCallbacks({
      sessionContext: {},
      classify,
    });

    await narrowReclassify!(['check_availability', 'book_appointment'], {
      originalPrompt: 'any openings tomorrow',
      normalizedPrompt: 'any openings tomorrow',
      classifierContext: null,
      method: 'passthrough',
    });

    expect(classify).toHaveBeenCalledWith(
      'any openings tomorrow',
      expect.stringContaining('check_availability'),
      ['check_availability', 'book_appointment'],
    );
  });

  it('buildCustomerUnderstandInput maps confidence bands and surface', () => {
    const input = buildCustomerUnderstandInput({
      businessId: 'biz-customer',
      effectivePrompt: 'Show my upcoming appointments',
      confidence: { low: 0.61, high: 0.88 },
      sessionConfidenceHigh: 0.9,
      lastAction: 'list_my_appointments',
      classify: jest.fn(),
    });

    expect(input.surface).toBe('customer');
    expect(input.confidenceLow).toBe(0.61);
    expect(input.confidenceHigh).toBe(0.9);
    expect(input.lastAction).toBe('list_my_appointments');
  });

  describe('CustomerCommandUnderstandingAdapter', () => {
    let adapter: CustomerCommandUnderstandingAdapter;
    let understandMock: jest.Mock;

    beforeEach(async () => {
      understandMock = jest.fn().mockResolvedValue({
        status: 'resolved',
        action: 'list_my_appointments',
        params: {},
        reasoning: 'adapter',
        confidence: 0.91,
        candidates: [],
        trace: [],
        gate: {},
        context: {},
        normalization: {},
        surface: 'customer',
      });

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          CustomerCommandUnderstandingAdapter,
          {
            provide: CommandUnderstandingPipelineService,
            useValue: { understand: understandMock },
          },
        ],
      }).compile();

      adapter = moduleRef.get(CustomerCommandUnderstandingAdapter);
    });

    it('delegates understand to CommandUnderstandingPipelineService', async () => {
      await adapter.understand({
        businessId: 'biz-adapter',
        effectivePrompt: 'Show my appointments',
        confidence: { low: 0.65, high: 0.82 },
        classify: jest.fn(),
      });

      expect(understandMock).toHaveBeenCalledTimes(1);
      expect(understandMock.mock.calls[0][0].surface).toBe('customer');
    });
  });
});
