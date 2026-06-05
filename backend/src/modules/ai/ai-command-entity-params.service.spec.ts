import { Test } from '@nestjs/testing';
import { AiCommandEntityParamsService } from './ai-command-entity-params.service.js';

describe('AiCommandEntityParamsService', () => {
  it('delegates registry and util helpers', async () => {
    const module = await Test.createTestingModule({
      providers: [AiCommandEntityParamsService],
    }).compile();
    const service = module.get(AiCommandEntityParamsService);

    expect(service.accepts('book_package', 'packageId')).toBe(true);
    expect(service.acceptedParams('mark_paid')).toContain('paymentMethod');
    expect(service.intentsForParam('giftCardCode')).toContain(
      'book_with_gift_card',
    );
    expect(service.extractFromPrompt('pay cash at visit')).toMatchObject({
      paymentMethod: 'cash',
    });
    expect(service.promptBlock()).toContain('multiServiceGroupId');
    expect(service.normalize({ paymentMethod: 'gift card' })).toMatchObject({
      paymentMethod: 'gift_card',
    });
    expect(
      service.filterForIntent('book_package', {
        packageId: 'pkg-1001',
        locationId: 'loc-1001',
      }),
    ).toEqual({ packageId: 'pkg-1001' });
    expect(
      service.inherit({}, { packageId: 'pkg-1001' }, 'book_package'),
    ).toMatchObject({
      packageId: 'pkg-1001',
    });
    expect(service.sessionSlice({ resourceId: 'room-1001' })).toEqual({
      resourceId: 'room-1001',
    });
    expect(
      service.mergeCompoundStep({ packageId: 'pkg-1001' }, {}, 'mark_paid'),
    ).toMatchObject({
      packageId: 'pkg-1001',
    });
    expect(service.enrich({}, 'resource id room-abc123')).toMatchObject({
      resourceId: 'room-abc123',
    });
    expect(service.summarize('book_package')).toContain('packageId');
    expect(
      service.propagateAcrossSteps([
        {
          action: 'book_package',
          params: { packageId: 'pkg-1001', paymentMethod: 'cash' },
        },
        { action: 'book_with_cash', params: {} },
      ])[1].params.packageId,
    ).toBe('pkg-1001');
  });
});
