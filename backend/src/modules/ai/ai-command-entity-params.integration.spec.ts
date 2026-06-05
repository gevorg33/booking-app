import { Test } from '@nestjs/testing';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { AiCommandEntityParamsService } from './ai-command-entity-params.service.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import { decomposeCustomerBookingCompoundPrompt } from './ai-self-service-booking.util.js';
import { decomposeProviderBookingCompoundPrompt } from './ai-provider-booking.util.js';

describe('ai-command-entity-params integration', () => {
  it('bootstraps AiCommandEntityParamsService in Nest', async () => {
    const module = await Test.createTestingModule({
      providers: [AiCommandEntityParamsService],
    }).compile();

    const service = module.get(AiCommandEntityParamsService);
    expect(service.acceptedParams('bulk_create_catalog')).toContain(
      'categoryDraft',
    );
  });

  it('inherits shared entity params through CommandCompletionPipelineService', () => {
    const pipeline = new CommandCompletionPipelineService();

    expect(
      pipeline.mergeSessionContext({ employeeName: 'Maria' }, undefined),
    ).toEqual({
      employeeName: 'Maria',
    });

    const merged = pipeline.mergeSessionContext(
      {},
      {
        packageId: 'pkg-1001',
        paymentMethod: 'cash',
        employeeName: 'Maria',
        date: '01/06/2026',
      },
      'book_with_cash',
    );
    expect(merged.paymentMethod).toBe('cash');
    expect(merged.employeeName).toBe('Maria');
    expect(merged.packageId).toBeUndefined();

    const sessionContext = pipeline.buildSessionContext({
      action: 'book_package',
      params: {},
      enrichedParams: {
        packageId: 'pkg-1001',
        paymentMethod: 'cash',
        date: '2026-06-01',
      },
      reasoning: 'book package',
      entities: {},
    } as any);
    expect(sessionContext.packageId).toBe('pkg-1001');
    expect(sessionContext.paymentMethod).toBe('cash');
    expect(sessionContext.date).toBe(formatDateDisplay('2026-06-01'));

    const providerSession = pipeline.buildProviderSessionContext({
      packageId: 'pkg-1001',
      paymentMethod: 'cash',
      customerName: 'Anna',
    });
    expect(providerSession.packageId).toBe('pkg-1001');
    expect(providerSession.paymentMethod).toBe('cash');
    expect(providerSession.customerName).toBe('Anna');
  });

  it('propagates shared params through sprint compound decomposers', () => {
    const customerSteps = decomposeCustomerBookingCompoundPrompt(
      'Book spa day package id pkg-spa-day and book with cash at visit',
    );
    expect(customerSteps.length).toBeGreaterThanOrEqual(2);
    expect(customerSteps[0].params.packageId).toBe('pkg-spa-day');
    expect(customerSteps[1].params.paymentMethod).toBe('cash');
    expect(customerSteps[1].params.packageId).toBe('pkg-spa-day');

    const providerSteps = decomposeProviderBookingCompoundPrompt(
      'List my package visits for package purchase purchase-abc123 and mark booking book-abcdef123456 paid',
    );
    expect(providerSteps).toHaveLength(2);
    expect(providerSteps[0].params.packagePurchaseId).toBe('purchase-abc123');
    expect(providerSteps[1].params.bookingId).toBe('book-abcdef123456');
  });
});
