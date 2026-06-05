import {
  buildSharedEntityParamsPromptBlock,
  enrichParamsWithSharedEntities,
  extractPaymentMethodFromPrompt,
  extractServiceIdsFromPrompt,
  extractSharedEntityParamsFromPrompt,
  filterSharedParamsForIntent,
  inheritSharedEntityParams,
  mergeCompoundStepParams,
  normalizeSharedEntityParams,
  parseCategoryDraftFromPrompt,
  pickSharedEntitySessionSlice,
  propagateSharedEntityParamsAcrossSteps,
  summarizeSharedParamsForIntent,
} from './ai-command-entity-params.util.js';

describe('ai-command-entity-params.util', () => {
  it('extracts explicit, colon, hash, and compound entity ids', () => {
    expect(
      extractSharedEntityParamsFromPrompt('package id pkg-spa-day-001'),
    ).toMatchObject({
      packageId: 'pkg-spa-day-001',
    });
    expect(
      extractSharedEntityParamsFromPrompt('package: pkg-colon-001'),
    ).toMatchObject({
      packageId: 'pkg-colon-001',
    });
    expect(
      extractSharedEntityParamsFromPrompt('package # pkg-hash-001'),
    ).toMatchObject({
      packageId: 'pkg-hash-001',
    });
    expect(
      extractSharedEntityParamsFromPrompt(
        'Cancel package purchase purchase-abc123 for multi-service group id group-visit-99',
      ),
    ).toMatchObject({
      packagePurchaseId: 'purchase-abc123',
      multiServiceGroupId: 'group-visit-99',
    });
    expect(
      extractSharedEntityParamsFromPrompt('resource id room-seven-01'),
    ).toMatchObject({
      resourceId: 'room-seven-01',
    });
    expect(
      extractSharedEntityParamsFromPrompt('gift card order id gc-order-88'),
    ).toMatchObject({
      giftCardOrderId: 'gc-order-88',
    });
    expect(
      extractSharedEntityParamsFromPrompt('gc order id gc-order-99'),
    ).toMatchObject({
      giftCardOrderId: 'gc-order-99',
    });
    expect(
      extractSharedEntityParamsFromPrompt('order id order-abcdef'),
    ).toMatchObject({
      giftCardOrderId: 'order-abcdef',
    });
  });

  it('extracts location, categoryDraft, and serviceIds into shared params', () => {
    expect(
      extractSharedEntityParamsFromPrompt('location id loc-west-01'),
    ).toMatchObject({
      locationId: 'loc-west-01',
    });
    expect(
      extractSharedEntityParamsFromPrompt('branch id branch-north-01'),
    ).toMatchObject({
      locationId: 'branch-north-01',
    });
    expect(
      extractSharedEntityParamsFromPrompt(
        "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
      ).categoryDraft?.[0]?.categoryName,
    ).toBe('Hair');
    expect(
      extractSharedEntityParamsFromPrompt(
        'book multi-service id multi-svc-1001',
      ).multiServiceGroupId,
    ).toBe('multi-svc-1001');
    expect(
      extractSharedEntityParamsFromPrompt(
        'subscription enrollment id enroll-12345',
      ).customerSubscriptionId,
    ).toBe('enroll-12345');
    expect(extractServiceIdsFromPrompt('service ids: ab, cd')).toBeUndefined();
    expect(extractServiceIdsFromPrompt('services [ab, xy]')).toBeUndefined();
  });

  it('extracts subscription, payment, service ids, and gift card codes', () => {
    expect(
      extractSharedEntityParamsFromPrompt(
        'subscription plan id plan-annual-12',
      ),
    ).toMatchObject({
      subscriptionPlanId: 'plan-annual-12',
    });
    expect(
      extractSharedEntityParamsFromPrompt(
        'customer subscription id sub-enroll-99',
      ),
    ).toMatchObject({
      customerSubscriptionId: 'sub-enroll-99',
    });
    expect(
      extractSharedEntityParamsFromPrompt(
        'Book package id pkg-spa-day-001 and pay cash at visit with code GCM-ABCD1234',
      ),
    ).toMatchObject({
      packageId: 'pkg-spa-day-001',
      paymentMethod: 'cash',
      giftCardCode: 'GCM-ABCD1234',
    });

    expect(extractPaymentMethodFromPrompt('walk-in cash')).toBe('cash');
    expect(extractPaymentMethodFromPrompt('with gift card')).toBe('gift_card');
    expect(extractPaymentMethodFromPrompt('use my subscription')).toBe(
      'subscription_credit',
    );
    expect(extractPaymentMethodFromPrompt('card payment')).toBe('online');
    expect(extractPaymentMethodFromPrompt('pay online with stripe')).toBe(
      'online',
    );
    expect(extractPaymentMethodFromPrompt('nonsense')).toBeUndefined();

    expect(
      extractServiceIdsFromPrompt('service ids: svc-1001, svc-1002'),
    ).toEqual(['svc-1001', 'svc-1002']);
    expect(
      extractServiceIdsFromPrompt('services [svc-1001, svc-1002]'),
    ).toEqual(['svc-1001', 'svc-1002']);
    expect(extractServiceIdsFromPrompt('service ids: ab')).toBeUndefined();
    expect(extractSharedEntityParamsFromPrompt('')).toEqual({});
  });

  it('skips duplicate package and subscription ids', () => {
    expect(
      extractSharedEntityParamsFromPrompt(
        'package id pkg-same-01 and package purchase id pkg-same-01',
      ),
    ).toMatchObject({ packageId: 'pkg-same-01' });
    expect(
      extractSharedEntityParamsFromPrompt(
        'subscription plan id sub-same-01 and subscription id sub-same-01',
      ),
    ).toMatchObject({ subscriptionPlanId: 'sub-same-01' });
  });

  it('parses categoryDraft for bulk catalog prompts', () => {
    const draft = parseCategoryDraftFromPrompt(
      "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
    );
    expect(draft?.[0]?.categoryName).toBe('Hair');
    expect(draft?.[0]?.services).toHaveLength(2);
    expect(parseCategoryDraftFromPrompt('no catalog here')).toBeUndefined();
  });

  it('normalizes classifier params and payment aliases', () => {
    expect(
      normalizeSharedEntityParams({
        packageId: ' pkg-1 ',
        giftCardCode: 'gcm-test12',
        paymentMethod: 'pay_cash',
        serviceIds: 'svc-a, svc-b',
        categoryDraft: [
          {
            categoryName: 'Color',
            description: 'Salon color',
            services: [
              {
                serviceName: 'Balayage',
                durationMinutes: 90,
                price: 120,
                bufferMinutes: 10,
                currency: 'USD',
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      packageId: 'pkg-1',
      giftCardCode: 'GCM-TEST12',
      paymentMethod: 'cash',
      serviceIds: ['svc-a', 'svc-b'],
    });

    expect(
      normalizeSharedEntityParams({ paymentMethod: 'card' }),
    ).toMatchObject({
      paymentMethod: 'card',
    });
    expect(
      normalizeSharedEntityParams({ paymentMethod: 'stripe' }),
    ).toMatchObject({
      paymentMethod: 'online',
    });
    expect(
      normalizeSharedEntityParams({ paymentMethod: 'giftcard' }),
    ).toMatchObject({
      paymentMethod: 'gift_card',
    });
    expect(
      normalizeSharedEntityParams({ paymentMethod: 'subscription' }),
    ).toMatchObject({
      paymentMethod: 'subscription_credit',
    });
    expect(
      normalizeSharedEntityParams({ serviceIds: 'svc-1001, svc-1002' }),
    ).toMatchObject({
      serviceIds: ['svc-1001', 'svc-1002'],
    });
  });

  it('normalizes invalid and empty shared entity values', () => {
    expect(normalizeSharedEntityParams({ paymentMethod: 'bitcoin' })).toEqual(
      {},
    );
    expect(normalizeSharedEntityParams({ paymentMethod: 42 })).toEqual({});
    expect(
      normalizeSharedEntityParams({ paymentMethod: 'online', packageId: 'ab' }),
    ).toEqual({
      paymentMethod: 'online',
    });
    expect(normalizeSharedEntityParams({ giftCardCode: '  ' })).toEqual({});
    expect(normalizeSharedEntityParams({ giftCardCode: 12345 })).toEqual({});
    expect(
      normalizeSharedEntityParams({ packageId: null, resourceId: '' }),
    ).toEqual({});
    expect(normalizeSharedEntityParams({ serviceIds: [] })).toEqual({});
    expect(normalizeSharedEntityParams({ serviceIds: ['ab'] })).toEqual({});
    expect(
      normalizeSharedEntityParams({ serviceIds: [1, 'svc-1001'] }),
    ).toMatchObject({
      serviceIds: ['svc-1001'],
    });
    expect(normalizeSharedEntityParams({ serviceIds: [1, 2, 3] })).toEqual({});
    expect(normalizeSharedEntityParams({ serviceIds: '   ' })).toEqual({});
    expect(
      normalizeSharedEntityParams({
        categoryDraft: [
          null,
          'invalid',
          { categoryName: '', services: [] },
          { categoryName: 'Empty', services: 'nope' },
          {
            categoryName: 'Nails',
            services: [
              null,
              { serviceName: '', durationMinutes: 90, price: 10 },
              { serviceName: 'Quick', durationMinutes: 5, price: 10 },
              {
                serviceName: 'Polish',
                durationMinutes: 30,
                price: 25,
                description: 42,
                bufferMinutes: '5',
                currency: 99,
              },
            ],
          },
          {
            categoryName: 'Brows',
            description: 99,
            services: [{ serviceName: 'Tint', durationMinutes: 20, price: 15 }],
          },
          {
            categoryName: 'Defaults',
            services: [
              { serviceName: 'NoDuration', price: 25 },
              { serviceName: 'NoPrice', durationMinutes: 45 },
            ],
          },
        ],
      }),
    ).toMatchObject({
      categoryDraft: expect.arrayContaining([
        expect.objectContaining({ categoryName: 'Nails' }),
        expect.objectContaining({ categoryName: 'Brows' }),
        expect.objectContaining({
          categoryName: 'Defaults',
          services: [
            expect.objectContaining({ serviceName: 'NoPrice', price: 0 }),
          ],
        }),
      ]),
    });
    expect(normalizeSharedEntityParams({ categoryDraft: 'invalid' })).toEqual(
      {},
    );
    expect(normalizeSharedEntityParams({ serviceIds: 'ab, cd' })).toEqual({});
    expect(
      normalizeSharedEntityParams({
        categoryDraft: [
          {
            categoryName: 42,
            services: [{ serviceName: 'X', durationMinutes: 60, price: 10 }],
          },
        ],
      }),
    ).toEqual({});
    expect(
      normalizeSharedEntityParams({
        categoryDraft: [
          {
            categoryName: 'Skipped',
            services: [{ serviceName: 'Bad', durationMinutes: 5, price: 10 }],
          },
          {
            categoryName: 'Bare',
            services: [{ durationMinutes: 60, price: 20 }],
          },
        ],
      }),
    ).toEqual({});
    expect(
      normalizeSharedEntityParams({ paymentMethod: '', categoryDraft: null }),
    ).toEqual({});
    expect(
      normalizeSharedEntityParams({
        categoryDraft: [
          {
            categoryName: 'Spa',
            services: [
              { serviceName: 'Massage', durationMinutes: 60, price: 80 },
              {
                serviceName: 'Facial',
                durationMinutes: 45,
                price: 60,
                description: 'Deep cleanse',
              },
            ],
          },
        ],
      }).categoryDraft,
    ).toHaveLength(1);
    expect(
      normalizeSharedEntityParams({ paymentMethod: 'pay_at_venue' }),
    ).toMatchObject({
      paymentMethod: 'cash',
    });
  });

  it('filters, inherits, and slices session params', () => {
    expect(inheritSharedEntityParams({ employeeName: 'A' }, undefined)).toEqual(
      {
        employeeName: 'A',
      },
    );
    expect(
      inheritSharedEntityParams(
        {},
        { packageId: 'pkg-1', giftCardCode: 'GCM-TEST12' },
      ),
    ).toMatchObject({
      packageId: 'pkg-1',
      giftCardCode: 'GCM-TEST12',
    });

    const session = {
      packageId: 'pkg-1',
      paymentMethod: 'cash',
      locationId: 'loc-downtown',
    };
    expect(filterSharedParamsForIntent('book_package', session)).toEqual({
      packageId: 'pkg-1',
    });
    expect(
      filterSharedParamsForIntent('book_package', { packageId: '' }),
    ).toEqual({});
    expect(
      inheritSharedEntityParams({}, session, 'book_with_cash'),
    ).toMatchObject({
      paymentMethod: 'cash',
    });
    expect(
      inheritSharedEntityParams(
        { packageId: 'pkg-2' },
        session,
        'book_package',
      ),
    ).toEqual({
      packageId: 'pkg-2',
    });
    expect(inheritSharedEntityParams({}, session, 'create_booking')).toEqual(
      {},
    );
    expect(
      pickSharedEntitySessionSlice({ ...session, employeeName: 'Maria' }),
    ).toMatchObject(session);
    expect(pickSharedEntitySessionSlice({ employeeName: 'Maria' })).toEqual({});
  });

  it('merges and propagates shared params across compound steps', () => {
    const steps = propagateSharedEntityParamsAcrossSteps([
      {
        action: 'book_package',
        params: { packageId: 'pkg-spa-1', paymentMethod: 'cash' },
      },
      { action: 'book_with_cash', params: {} },
      {
        action: 'apply_gift_card_code',
        params: { giftCardCode: 'GCM-EXTRA1' },
      },
    ]);

    expect(steps[1].params).toMatchObject({
      packageId: 'pkg-spa-1',
      paymentMethod: 'cash',
    });
    expect(steps[2].params.giftCardCode).toBe('GCM-EXTRA1');

    expect(
      mergeCompoundStepParams({ packageId: 'pkg-1001' }, {}, 'mark_paid'),
    ).toMatchObject({
      packageId: 'pkg-1001',
    });
    expect(
      mergeCompoundStepParams(
        { packageId: 'pkg-1001' },
        { categoryDraft: [{ categoryName: 'X', services: [] }] },
        'book_package',
      ),
    ).not.toHaveProperty('categoryDraft');
    expect(
      mergeCompoundStepParams(
        { paymentMethod: 'cash' },
        { paymentMethod: 'online' },
        'mark_paid',
      ),
    ).toMatchObject({ paymentMethod: 'online' });
    expect(
      mergeCompoundStepParams({}, { packageId: 'pkg-1001' }, 'book_package'),
    ).toMatchObject({
      packageId: 'pkg-1001',
    });
    expect(
      mergeCompoundStepParams(
        { packageId: 'pkg-1001' },
        { packageId: 'pkg-1001' },
        'book_package',
      ).packageId,
    ).toBe('pkg-1001');
    expect(
      inheritSharedEntityParams(
        { paymentMethod: 'online' },
        { paymentMethod: 'cash' },
        'mark_paid',
      ).paymentMethod,
    ).toBe('online');
  });

  it('builds prompt blocks and enriches params', () => {
    expect(buildSharedEntityParamsPromptBlock()).toContain('categoryDraft[]');
    expect(summarizeSharedParamsForIntent('unknown_intent')).toContain(
      'no shared entity params',
    );
    expect(summarizeSharedParamsForIntent('book_package')).toContain(
      'packageId',
    );
    expect(enrichParamsWithSharedEntities({ employeeName: 'Maria' })).toEqual({
      employeeName: 'Maria',
    });
    expect(
      enrichParamsWithSharedEntities(
        { employeeName: 'Maria' },
        'book package id pkg-99 and pay cash at visit',
      ),
    ).toMatchObject({
      employeeName: 'Maria',
      packageId: 'pkg-99',
      paymentMethod: 'cash',
    });
  });
});
