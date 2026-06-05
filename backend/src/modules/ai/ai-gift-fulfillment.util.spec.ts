import {
  rescueGiftFulfillmentIntent,
  isFulfillmentCompoundPrompt,
  decomposeFulfillmentCompoundPrompt,
  isListGiftCardOrdersPrompt,
  isFilterAwaitingCreationPrompt,
  isAssignCardCreatorPrompt,
  isAssignDeliveryStaffPrompt,
  isMarkShippedPrompt,
  isMarkDeliveredPrompt,
  isCancelGiftCardOrderPrompt,
  isExtendCancelWindowPrompt,
  isPrintPackingSlipPrompt,
  isGiftCardCreationQueuePrompt,
  isStartCardPreparationPrompt,
  isMarkCardReadyPrompt,
  isDeliveryQueuePrompt,
  isAcceptDeliveryPrompt,
  isMarkOutForDeliveryPrompt,
  isCaptureDeliveryProofPrompt,
  isNotifyDelayPrompt,
  isTrackGiftCardShipmentPrompt,
  isEnterShippingAddressPrompt,
  isShippingMethodQuotePrompt,
  isOrderStatusNotificationsPrompt,
  extractEmployeeNameFromPrompt,
  extractGiftCardIdFromPrompt,
  extractShippingAddressFromPrompt,
  extractCarrierTrackingFromPrompt,
  extractDelayReasonFromPrompt,
  extractCancelWindowHoursFromPrompt,
  extractProofFromPrompt,
  parseFirstCardFromQueue,
  resolveFulfillmentQueueHead,
  resolveShippingCity,
  parseCancelModifyWindowHours,
  isPhysicalGiftCardOrder,
  isShippedFulfillmentStatus,
  GIFT_FULFILLMENT_INTENTS,
  isGiftFulfillmentIntent,
} from './ai-gift-fulfillment.util.js';

describe('ai-gift-fulfillment.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard fulfillment prompts', () => {
      expect(isListGiftCardOrdersPrompt('List gift card orders')).toBe(true);
      expect(isListGiftCardOrdersPrompt('List awaiting creation orders')).toBe(
        false,
      );
      expect(
        isFilterAwaitingCreationPrompt('List awaiting card creation orders'),
      ).toBe(true);
      expect(isAssignCardCreatorPrompt('Assign card creator to Anna')).toBe(
        true,
      );
      expect(isAssignDeliveryStaffPrompt('Assign delivery staff to John')).toBe(
        true,
      );
      expect(isMarkShippedPrompt('Mark gift card order shipped')).toBe(true);
      expect(isMarkDeliveredPrompt('Mark gift card order delivered')).toBe(
        true,
      );
      expect(isCancelGiftCardOrderPrompt('Cancel gift card order')).toBe(true);
      expect(
        isCancelGiftCardOrderPrompt('Cancel gift card request window'),
      ).toBe(false);
      expect(
        isExtendCancelWindowPrompt('Extend cancel window to 48 hours'),
      ).toBe(true);
      expect(isPrintPackingSlipPrompt('Print packing slip for order')).toBe(
        true,
      );
    });

    it('detects provider fulfillment prompts', () => {
      expect(
        isGiftCardCreationQueuePrompt('Show gift card creation queue'),
      ).toBe(true);
      expect(isStartCardPreparationPrompt('Start card preparation')).toBe(true);
      expect(isMarkCardReadyPrompt('Mark card ready for delivery')).toBe(true);
      expect(isDeliveryQueuePrompt('Show delivery queue')).toBe(true);
      expect(isAcceptDeliveryPrompt('Accept delivery assignment')).toBe(true);
      expect(isMarkOutForDeliveryPrompt('Mark out for delivery')).toBe(true);
      expect(isCaptureDeliveryProofPrompt('Capture delivery proof photo')).toBe(
        true,
      );
      expect(isNotifyDelayPrompt('Notify customer about delay')).toBe(true);
    });

    it('detects customer fulfillment prompts', () => {
      expect(isTrackGiftCardShipmentPrompt('Track my gift card shipment')).toBe(
        true,
      );
      expect(
        isEnterShippingAddressPrompt('Enter shipping address 123 Main St'),
      ).toBe(true);
      expect(isShippingMethodQuotePrompt('Get shipping method quote')).toBe(
        true,
      );
      expect(
        isOrderStatusNotificationsPrompt('Enable order status notifications'),
      ).toBe(true);
      expect(
        isOrderStatusNotificationsPrompt('Show order status notifications'),
      ).toBe(true);
      expect(
        isOrderStatusNotificationsPrompt(
          'order status notification preferences',
        ),
      ).toBe(true);
    });
  });

  describe('extractors and helpers', () => {
    it('extracts employee names, ids, addresses, tracking, and proof', () => {
      expect(extractEmployeeNameFromPrompt('Assign card creator to Anna')).toBe(
        'Anna',
      );
      expect(
        extractEmployeeNameFromPrompt(
          'assign delivery staff to Maria Smith and mark ready',
        ),
      ).toBe('Maria Smith');
      expect(extractEmployeeNameFromPrompt('no name here')).toBeNull();
      expect(
        extractGiftCardIdFromPrompt(
          'order 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(extractGiftCardIdFromPrompt('no id')).toBeNull();
      const address = extractShippingAddressFromPrompt(
        'Enter shipping address 123 Main St Boston, MA 02101',
      );
      expect(address?.line1).toContain('123 Main St');
      expect(address?.city).toBeTruthy();
      expect(extractShippingAddressFromPrompt('no address')).toBeNull();
      expect(
        extractCarrierTrackingFromPrompt('Mark shipped UPS tracking ABC123456'),
      ).toMatchObject({
        carrier: 'UPS',
        trackingNumber: 'ABC123456',
      });
      expect(extractDelayReasonFromPrompt('Notify delay because weather')).toBe(
        'weather',
      );
      expect(
        extractCancelWindowHoursFromPrompt('extend cancel window 48 hours'),
      ).toBe(48);
      expect(
        extractCancelWindowHoursFromPrompt('extend cancel window 2 days'),
      ).toBe(48);
      expect(
        extractCancelWindowHoursFromPrompt('extend cancel window'),
      ).toBeNull();
      expect(
        extractProofFromPrompt('Capture proof https://proof.example/photo.jpg'),
      ).toMatchObject({
        proofUrl: 'https://proof.example/photo.jpg',
      });
      expect(parseFirstCardFromQueue([{ id: 'gc-1' }, { id: 'gc-2' }])).toBe(
        'gc-1',
      );
      expect(parseFirstCardFromQueue([])).toBeNull();
    });
  });

  describe('rescueGiftFulfillmentIntent', () => {
    it('rescues all fulfillment intents from unknown', () => {
      expect(
        rescueGiftFulfillmentIntent('List gift card orders', 'unknown')?.action,
      ).toBe('list_gift_card_orders');
      expect(
        rescueGiftFulfillmentIntent('List awaiting card creation', 'unknown')
          ?.action,
      ).toBe('filter_awaiting_creation');
      expect(
        rescueGiftFulfillmentIntent('Assign card creator to Anna', 'unknown')
          ?.action,
      ).toBe('assign_card_creator');
      expect(
        rescueGiftFulfillmentIntent('Assign delivery staff to John', 'unknown')
          ?.action,
      ).toBe('assign_delivery_staff');
      expect(
        rescueGiftFulfillmentIntent('Mark gift card order shipped', 'unknown')
          ?.action,
      ).toBe('mark_shipped');
      expect(
        rescueGiftFulfillmentIntent('Mark gift card delivered', 'unknown')
          ?.action,
      ).toBe('mark_delivered');
      expect(
        rescueGiftFulfillmentIntent('Cancel gift card order', 'unknown')
          ?.action,
      ).toBe('cancel_gift_card_order');
      expect(
        rescueGiftFulfillmentIntent('Extend cancel window 72 hours', 'unknown')
          ?.action,
      ).toBe('extend_cancel_window');
      expect(
        rescueGiftFulfillmentIntent('Print packing slip', 'unknown')?.action,
      ).toBe('print_packing_slip');
      expect(
        rescueGiftFulfillmentIntent('Show gift card creation queue', 'unknown')
          ?.action,
      ).toBe('gift_card_creation_queue');
      expect(
        rescueGiftFulfillmentIntent('Start card preparation', 'unknown')
          ?.action,
      ).toBe('start_card_preparation');
      expect(
        rescueGiftFulfillmentIntent('Mark card ready', 'unknown')?.action,
      ).toBe('mark_card_ready');
      expect(
        rescueGiftFulfillmentIntent('Show delivery queue', 'unknown')?.action,
      ).toBe('delivery_queue');
      expect(
        rescueGiftFulfillmentIntent('Accept delivery', 'unknown')?.action,
      ).toBe('accept_delivery');
      expect(
        rescueGiftFulfillmentIntent('Mark out for delivery', 'unknown')?.action,
      ).toBe('mark_out_for_delivery');
      expect(
        rescueGiftFulfillmentIntent('Capture delivery proof', 'unknown')
          ?.action,
      ).toBe('capture_delivery_proof');
      expect(
        rescueGiftFulfillmentIntent('Notify delay because traffic', 'unknown')
          ?.action,
      ).toBe('notify_delay');
      expect(
        rescueGiftFulfillmentIntent('Track my gift card shipment', 'unknown')
          ?.action,
      ).toBe('track_gift_card_shipment');
      expect(
        rescueGiftFulfillmentIntent(
          'Enter shipping address 123 Main St Boston',
          'unknown',
        )?.action,
      ).toBe('enter_shipping_address');
      expect(
        rescueGiftFulfillmentIntent('Get shipping method quote', 'unknown')
          ?.action,
      ).toBe('shipping_method_quote');
      expect(
        rescueGiftFulfillmentIntent(
          'Enable order status notifications',
          'unknown',
        )?.action,
      ).toBe('order_status_notifications');
    });

    it('skips rescue for payments payments and customerCrm generic track', () => {
      expect(
        rescueGiftFulfillmentIntent(
          'Buy physical gift card shipped',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueGiftFulfillmentIntent('Buy gift card $50', 'unknown'),
      ).toBeNull();
      expect(
        rescueGiftFulfillmentIntent(
          'Track my physical gift card order',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueGiftFulfillmentIntent(
          'Enable order status notifications',
          'unknown',
        )?.action,
      ).toBe('order_status_notifications');
      expect(
        rescueGiftFulfillmentIntent(
          'list_gift_card_orders',
          'list_gift_card_orders',
        ),
      ).toBeNull();
      expect(rescueGiftFulfillmentIntent('hello world', 'unknown')).toBeNull();
    });

    it('skips compound prompts unless compound_intent action', () => {
      expect(
        rescueGiftFulfillmentIntent(
          'Show gift card creation queue and mark first card ready',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueGiftFulfillmentIntent(
          'Show gift card creation queue and mark first card ready',
          'compound_intent',
        )?.action,
      ).toBe('gift_card_creation_queue');
    });
  });

  describe('compound decomposition', () => {
    it('decomposes multi-command fulfillment prompts', () => {
      const provider =
        'Show gift card creation queue and mark first card ready';
      expect(isFulfillmentCompoundPrompt(provider)).toBe(true);
      const providerSteps = decomposeFulfillmentCompoundPrompt(provider);
      expect(providerSteps.map((s) => s.action)).toEqual([
        'gift_card_creation_queue',
        'mark_card_ready',
      ]);

      const dashboard = decomposeFulfillmentCompoundPrompt(
        'List awaiting creation orders and assign card creator to Anna',
      );
      expect(dashboard.map((s) => s.action)).toEqual([
        'filter_awaiting_creation',
        'assign_card_creator',
      ]);

      const customer = decomposeFulfillmentCompoundPrompt(
        'Enter shipping address 123 Main St Boston and get shipping method quote and enable order status notifications',
      );
      expect(customer.length).toBe(3);
      expect(customer.map((s) => s.action)).toContain('enter_shipping_address');
      expect(customer.map((s) => s.action)).toContain('shipping_method_quote');
      expect(customer.map((s) => s.action)).toContain(
        'order_status_notifications',
      );

      const track = decomposeFulfillmentCompoundPrompt(
        'Track my gift card shipment and show order status notifications',
      );
      expect(track.map((s) => s.action)).toEqual([
        'track_gift_card_shipment',
        'order_status_notifications',
      ]);

      const semicolon = decomposeFulfillmentCompoundPrompt(
        'List gift card orders; print packing slip',
      );
      expect(semicolon.map((s) => s.action)).toEqual([
        'list_gift_card_orders',
        'print_packing_slip',
      ]);
    });

    it('returns empty or single for edge cases', () => {
      expect(decomposeFulfillmentCompoundPrompt('')).toEqual([]);
      expect(decomposeFulfillmentCompoundPrompt('hello world')).toEqual([]);
      expect(isFulfillmentCompoundPrompt('hi')).toBe(false);
      expect(
        isFulfillmentCompoundPrompt('Buy physical gift card shipped'),
      ).toBe(false);
      expect(
        decomposeFulfillmentCompoundPrompt('List gift card orders'),
      ).toHaveLength(1);
      expect(
        decomposeFulfillmentCompoundPrompt(
          'List gift card orders and foobar widgets',
        ),
      ).toHaveLength(1);
      expect(
        decomposeFulfillmentCompoundPrompt('mark ready and unknown widgets')[0]
          ?.action,
      ).toBe('mark_card_ready');
    });

    it('decomposes remaining segment types', () => {
      const all = decomposeFulfillmentCompoundPrompt(
        'Assign delivery staff to Anna and mark shipped UPS tracking ABC123 and mark delivered',
      );
      expect(all.length).toBe(3);

      const providerOps = decomposeFulfillmentCompoundPrompt(
        'Start card preparation and show delivery queue and accept delivery and capture delivery proof',
      );
      expect(providerOps.length).toBe(4);

      const policy = decomposeFulfillmentCompoundPrompt(
        'Cancel gift card order and extend cancel window 48 hours',
      );
      expect(policy.map((s) => s.action)).toEqual([
        'cancel_gift_card_order',
        'extend_cancel_window',
      ]);

      const delay = decomposeFulfillmentCompoundPrompt(
        'Notify delay because weather and mark out for delivery',
      );
      expect(delay.length).toBe(2);
      expect(
        extractProofFromPrompt('note "signed by recipient"'),
      ).toMatchObject({ proofNote: 'signed by recipient' });
      expect(extractProofFromPrompt('plain text only')).toMatchObject({
        proofNote: 'plain text only',
      });
      expect(extractCarrierTrackingFromPrompt('no tracking here')).toEqual({});
      expect(extractDelayReasonFromPrompt('notify delay')).toBeNull();
      expect(
        extractEmployeeNameFromPrompt('assign card creator to Maria'),
      ).toBe('Maria');
      expect(
        extractEmployeeNameFromPrompt(
          'assign delivery staff to Sam Lee and mark ready',
        ),
      ).toBe('Sam Lee');
      expect(extractGiftCardIdFromPrompt('order abc')).toBeNull();
      expect(
        extractGiftCardIdFromPrompt(
          'order 550e8400-e29b-41d4-a716-446655440000',
        ),
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      const fullAddress = extractShippingAddressFromPrompt(
        'Ship to 10 Oak Ave, Boston, MA 02108',
      );
      expect(fullAddress?.city).toBe('Boston');
      expect(fullAddress?.stateRegion).toBe('MA');
      expect(fullAddress?.postalCode).toBe('02108');
      expect(
        extractShippingAddressFromPrompt('10 Oak Street Somewhere'),
      ).toMatchObject({
        line1: '10 Oak Street',
      });
      expect(decomposeFulfillmentCompoundPrompt('   ')).toEqual([]);
      expect(
        decomposeFulfillmentCompoundPrompt(
          'Assign delivery staff to Anna and mark shipped UPS tracking ABC123 and capture delivery proof https://proof/x',
        )[1]?.params,
      ).toMatchObject({ carrier: 'UPS', trackingNumber: 'ABC123' });
      expect(
        decomposeFulfillmentCompoundPrompt(
          'extend cancel window 48 hours and print packing slip',
        )[0]?.params,
      ).toMatchObject({ cancelModifyWindowHours: 48 });
      expect(
        extractEmployeeNameFromPrompt('assign card creator to maria'),
      ).toBe('maria');
      expect(
        extractShippingAddressFromPrompt('ship 45 Pine Road Austin'),
      ).toMatchObject({ line1: '45 Pine Road' });
      expect(extractShippingAddressFromPrompt('   ')).toBeNull();
      expect(
        extractShippingAddressFromPrompt('Somewhere, MA 02101'),
      ).toMatchObject({
        city: 'Somewhere',
        stateRegion: 'MA',
        postalCode: '02101',
      });
      expect(
        extractShippingAddressFromPrompt('Boston, MA 02101'),
      ).toMatchObject({
        line1: '',
        city: 'Boston',
        stateRegion: 'MA',
      });
      expect(
        extractShippingAddressFromPrompt('99 Oak Lane Portland'),
      ).toMatchObject({
        line1: '99 Oak Lane',
        city: 'Portland',
      });
      expect(extractShippingAddressFromPrompt('0 , MA 02101')).toBeNull();
      expect(extractShippingAddressFromPrompt('123')).toBeNull();
      expect(
        extractShippingAddressFromPrompt('123 Main Street Boston'),
      ).toMatchObject({
        line1: '123 Main Street',
        city: 'Boston',
      });
      expect(
        extractShippingAddressFromPrompt('123 Main Street Boston, MA 02101'),
      ).toMatchObject({
        line1: '123 Main Street',
        stateRegion: 'MA',
        postalCode: '02101',
      });
      expect(
        decomposeFulfillmentCompoundPrompt(
          'list gift card orders and foo bar baz and print packing slip',
        ).map((s) => s.action),
      ).toEqual(['list_gift_card_orders', 'print_packing_slip']);
      expect(
        decomposeFulfillmentCompoundPrompt(' ; list gift card orders').map(
          (s) => s.action,
        ),
      ).toEqual(['list_gift_card_orders']);
      expect(
        decomposeFulfillmentCompoundPrompt(
          'list gift card orders and zzz unknown command foobar',
        ).length,
      ).toBe(1);
      expect(
        decomposeFulfillmentCompoundPrompt(
          'list gift card orders; ; print packing slip',
        ).length,
      ).toBe(2);
      expect(
        decomposeFulfillmentCompoundPrompt(
          `print packing slip for order 550e8400-e29b-41d4-a716-446655440000`,
        )[0]?.params.giftCardId,
      ).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(
        decomposeFulfillmentCompoundPrompt(
          'list gift card orders and foobar widgets unknown',
        ).length,
      ).toBe(1);
      expect(
        decomposeFulfillmentCompoundPrompt(
          'capture delivery proof note "signed" and notify delay because rain',
        )[0]?.params.proofNote,
      ).toBe('signed');
      expect(isFulfillmentCompoundPrompt('Buy gift card $50 and ship')).toBe(
        false,
      );
      expect(
        decomposeFulfillmentCompoundPrompt(
          'mark shipped and mark delivered and cancel gift card order',
        ).map((s) => s.action),
      ).toEqual(['mark_shipped', 'mark_delivered', 'cancel_gift_card_order']);
      expect(
        classifyViaDecompose(
          'show delivery queue and notify delay because rain',
        ),
      ).toEqual(['delivery_queue', 'notify_delay']);
    });
  });

  function classifyViaDecompose(prompt: string) {
    return decomposeFulfillmentCompoundPrompt(prompt).map((s) => s.action);
  }

  it('covers helper branch utilities', () => {
    expect(resolveFulfillmentQueueHead({ queue: [{ id: 'q1' }] })).toBe('q1');
    expect(resolveFulfillmentQueueHead({ orders: [{ id: 'o1' }] })).toBe('o1');
    expect(resolveFulfillmentQueueHead({})).toBeNull();
    expect(parseCancelModifyWindowHours({ cancelModifyWindowHours: 24 })).toBe(
      24,
    );
    expect(
      parseCancelModifyWindowHours({}, 'extend cancel window 12 hours'),
    ).toBe(12);
    expect(
      parseCancelModifyWindowHours({ cancelModifyWindowHours: 0 }),
    ).toBeNull();
    expect(
      parseCancelModifyWindowHours({ cancelModifyWindowHours: Number.NaN }),
    ).toBeNull();
    expect(isPhysicalGiftCardOrder({ deliveryMethod: 'physical' })).toBe(true);
    expect(isPhysicalGiftCardOrder({ deliveryMethod: 'digital' })).toBe(false);
    expect(isPhysicalGiftCardOrder(null)).toBe(false);
    expect(isShippedFulfillmentStatus('shipped')).toBe(true);
    expect(isShippedFulfillmentStatus('delivered')).toBe(true);
    expect(isShippedFulfillmentStatus('processing')).toBe(false);
    expect(
      extractShippingAddressFromPrompt('55 Park Ave Denver'),
    ).toMatchObject({ city: 'Denver' });
    expect(extractShippingAddressFromPrompt('Denver, CO 80202')).toMatchObject({
      city: 'Denver',
    });
    expect(resolveShippingCity(null, null)).toBe('');
  });

  it('registers giftFulfillment intents', () => {
    for (const intent of GIFT_FULFILLMENT_INTENTS) {
      expect(isGiftFulfillmentIntent(intent)).toBe(true);
    }
    expect(isGiftFulfillmentIntent('buy_gift_card_physical')).toBe(false);
  });
});
