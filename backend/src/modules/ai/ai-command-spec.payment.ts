/**
 * AI-ROADMAP Phase 1 — third domain slice: `payment`.
 *
 * 42 registry entries under `apiModule: 'payments'`: 23 reads and 19 mutations.
 * The slice that finally exercises the money tier — 12 commands are T2, and §47's
 * conformance rule "money is never declared reversible" applies to every one.
 *
 * Every T2 here declares `none` or `manual`. That is not caution, it is the
 * definition: a refund is a second financial event with its own record, timing
 * and possibly fees. A saga that "undid" a payment by issuing one would be
 * moving money to tidy up a failed plan.
 *
 * `surfaces`, `handler` and the tier maps are derived from the live gate
 * (`isIntentAllowed` plus the gateway's dashboard-client refusal), not copied
 * from the registry's own `tiers` field — which §56 measured as disagreeing with
 * reality for 29 of 34 commands. The conformance suite checks every one.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const PAYMENT_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'payment.audit_services_missing_online_payment',
    aliases: ['audit_services_missing_online_payment'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'List services that cannot be paid for online, so the gaps can be fixed.',
    variables: {},
    examples: [
      'which services have no online payment',
      'audit services missing card payment',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.check_gift_card_balance',
    aliases: ['check_gift_card_balance'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Report the remaining balance on a gift card.',
    variables: {},
    examples: ["what's left on my gift card", 'check my gift card balance'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.check_providers_for_service',
    aliases: ['check_providers_for_service'],
    domain: 'payment',
    surfaces: ['dashboard', 'customer'],
    tiers: { dashboard: ['staff', 'manager', 'owner'], customer: ['client'] },
    risk: 'T0',
    description: 'List which providers offer a given service.',
    variables: {},
    examples: [
      'who does deep tissue massage',
      'which staff can do a facial',
      'is anybody open tomorrow evening for Swedish massage',
      'is anybody open Friday morning for facial',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.compare_services',
    aliases: ['compare_services'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Compare services on price, duration and what they include.',
    variables: {},
    examples: ['compare your massage options', 'which facial is best value'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_amount_due_now',
    aliases: ['explain_amount_due_now'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain what must be paid now versus later for a booking.',
    variables: {},
    examples: ['how much do I pay now', 'what is due at booking'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_checkout_total',
    aliases: ['explain_checkout_total'],
    domain: 'payment',
    surfaces: ['dashboard', 'customer', 'public'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Break down the checkout total into its line items.',
    variables: {},
    examples: ['why is my total this much', 'break down the checkout price'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_payment_options_for_service',
    aliases: ['explain_payment_options_for_service'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain how a particular service can be paid for.',
    variables: {},
    examples: [
      'how can I pay for a massage',
      'what payment options for the facial',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_public_booking_checkout',
    aliases: ['explain_public_booking_checkout'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description:
      'Explain how checkout works for bookings made on the public page.',
    variables: {},
    examples: [
      'how does public booking checkout work',
      'explain guest checkout',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_service_online_payment_setup',
    aliases: ['explain_service_online_payment_setup'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Explain how to enable online payment for a service.',
    variables: {},
    examples: [
      'how do I turn on online payment',
      'set up card payment for a service',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_service_price',
    aliases: ['explain_service_price'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'State the price of a service and what it covers.',
    variables: {},
    examples: [
      'how much is a deep tissue massage',
      'what does the facial cost',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_why_stripe_required',
    aliases: ['explain_why_stripe_required'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain why card details are required to complete a booking.',
    variables: {},
    examples: [
      'why do I need to enter a card',
      'why is payment required upfront',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.export_accounting',
    aliases: ['export_accounting'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Export accounting records for a period.',
    variables: {},
    examples: [
      'export last month accounting',
      'download the accounting report',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.export_commissions',
    aliases: ['export_commissions'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Export staff commission records for a period.',
    variables: {},
    examples: [
      'export commissions for last month',
      'download the commission report',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.filter_services_no_prepayment',
    aliases: ['filter_services_no_prepayment'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List services that can be booked without paying in advance.',
    variables: {},
    examples: [
      'what can I book without paying now',
      'services with no prepayment',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.find_soonest_appointment',
    aliases: ['find_soonest_appointment'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Find the earliest available appointment matching what the customer wants.',
    variables: {},
    examples: ['when is the soonest massage', 'earliest available appointment'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.get_booking_quote',
    aliases: ['get_booking_quote'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Quote the price of a booking before it is made.',
    variables: {},
    examples: [
      'how much would that booking cost',
      'quote me for a massage friday',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.get_gift_card_quote',
    aliases: ['get_gift_card_quote'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Quote the cost of buying a gift card.',
    variables: {},
    examples: [
      'how much for a 100 dollar gift card',
      'what would a gift card cost',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.get_multi_service_quote',
    aliases: ['get_multi_service_quote'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Quote the total for several services booked in one visit.',
    variables: {},
    examples: ['how much for a massage and a facial', 'quote a spa day'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.get_package_quote',
    aliases: ['get_package_quote'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Quote the price of a package.',
    variables: {},
    examples: ['how much is the bridal package', 'what does the bundle cost'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.list_subscription_revenue',
    aliases: ['list_subscription_revenue'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report revenue from subscription plans.',
    variables: {},
    examples: [
      'how much are subscriptions making',
      'subscription revenue this month',
    ],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.receipt_status',
    aliases: ['receipt_status'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description:
      'Report whether a receipt has been issued and where to find it.',
    variables: {},
    examples: ['where is my receipt', 'did I get a receipt'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.summarize_unpaid',
    aliases: ['summarize_unpaid'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise appointments that have not been paid for.',
    variables: {},
    examples: ['who has not paid', 'show me unpaid bookings'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.validate_gift_card',
    aliases: ['validate_gift_card'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Check whether a gift card code is valid and usable.',
    variables: {},
    examples: ['is this gift card code valid', 'check gift card ABC123'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.adjust_gift_card_balance',
    aliases: ['adjust_gift_card_balance'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change the remaining balance on a gift card.',
    variables: {
      // tech-debt C2 — read from `handleAdjustGiftCardBalanceLogic`. The two
      // names the handler itself reports in `missing:` are `giftCardCode` and
      // `amount`, so those are the ones declared under those spellings.
      //
      // All optional: the handler needs (`giftCardId` OR `giftCardCode`) and
      // (`newBalance` OR `delta`/`amount`), and `required` has no "one of"
      // form. Marking either side required would refuse the other phrasing.
      giftCardCode: {
        type: 'string',
        description:
          'Code of the card to adjust. Falls back to a code found in the message.',
        required: false,
        resolver: 'none',
      },
      giftCardId: {
        type: 'string',
        description: 'Id of the card, when it is already known.',
        required: false,
        resolver: 'none',
      },
      amount: {
        type: 'number',
        description:
          'Amount to add or subtract — "add 50" is +50. Use `newBalance` instead to set an absolute figure.',
        required: false,
        resolver: 'money',
      },
      newBalance: {
        type: 'number',
        description: 'Absolute balance to set the card to.',
        required: false,
        resolver: 'money',
      },
      note: {
        type: 'string',
        description: 'Audit note stored with the adjustment.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add 50 to that gift card', 'correct the gift card balance'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Reversing a financial record is a finance operation that needs a human and an audit entry.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.apply_gift_card_code',
    aliases: ['apply_gift_card_code'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Apply a gift card code to the current purchase.',
    variables: {
      // `handleApplyGiftCardCodeLogic`, plus `resolveService` for the service
      // the card is being applied against.
      giftCardCode: {
        type: 'string',
        description:
          'Card code to apply. Falls back to a code found in the message; the command clarifies if neither carries one.',
        required: false,
        resolver: 'none',
      },
      serviceName: {
        type: 'string',
        description:
          'Service being paid for, used to check the card is valid against it.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['use my gift card', 'apply code GIFT100'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.book_nearest_slot',
    aliases: ['book_nearest_slot'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T1',
    description: 'Book the earliest slot matching what the customer asked for.',
    variables: {},
    examples: ['book the nearest slot', 'get me the soonest appointment'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'payment.book_nearest_slot',
      captures: ['appointmentId'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.buy_gift_card',
    aliases: ['buy_gift_card'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Buy a gift card for the customer themselves.',
    variables: {
      // `handleBuyGiftCardLogic`. `cardType` and `deliveryMethod` are *not*
      // declared: the handler hardcodes `monetary` and derives delivery from
      // which command was called, so a planner filling them changes nothing.
      amount: {
        type: 'number',
        description:
          'Face value. Falls back to an amount in the message, then to the first preset the business offers.',
        required: false,
        resolver: 'money',
      },
      purchaserName: {
        type: 'string',
        description: 'Name to put on the purchase.',
        required: false,
        resolver: 'none',
      },
      purchaserEmail: {
        type: 'string',
        description: 'Where to send the card. Defaults to a guest address.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['buy a 100 dollar gift card', 'purchase a gift card'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.buy_gift_card_for_someone',
    aliases: ['buy_gift_card_for_someone'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Buy a gift card as a present for someone else.',
    variables: {
      // `handleBuyGiftCardForSomeoneLogic` reads these through
      // `parseBuyGiftCardForSomeoneFromPrompt`, which merges params with what
      // it can extract from the message — so none is required on its own.
      //
      // `recipientName` resolves to nothing: a gift-card recipient is usually
      // not an existing customer, and `resolver: 'customer'` would ask the
      // system to find a record that does not exist.
      recipientName: {
        type: 'string',
        description: 'Who the card is for.',
        required: false,
        resolver: 'none',
      },
      recipientEmail: {
        type: 'string',
        description: 'Where to send a digital card.',
        required: false,
        resolver: 'none',
      },
      amount: {
        type: 'number',
        description: 'Face value of the card.',
        required: false,
        resolver: 'money',
      },
      deliveryMethod: {
        type: 'string',
        description: 'How the card reaches them.',
        required: false,
        resolver: 'none',
        enum: ['digital', 'physical'],
      },
    },
    examples: ['buy a gift card for my mum', 'send a gift card to a friend'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.buy_gift_card_physical',
    aliases: ['buy_gift_card_physical'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Buy a physical gift card to be delivered.',
    variables: {
      // Same handler as `buy_gift_card` with `physical = true`; see there for
      // why `deliveryMethod` is not a declared input.
      amount: {
        type: 'number',
        description:
          'Face value. Falls back to an amount in the message, then to the first preset the business offers.',
        required: false,
        resolver: 'money',
      },
      purchaserName: {
        type: 'string',
        description: 'Name to put on the purchase.',
        required: false,
        resolver: 'none',
      },
      purchaserEmail: {
        type: 'string',
        description: 'Contact address for the order.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['buy a physical gift card', 'order a printed gift card'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.choose_payment_method',
    aliases: ['choose_payment_method'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Choose how a booking will be paid for, before paying.',
    variables: {},
    examples: ['I want to pay by card', 'pay cash at the visit instead'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'payment.choose_payment_method',
      captures: ['bookingId', 'previousMethod'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.collect_cash_confirm',
    aliases: ['collect_cash_confirm'],
    domain: 'payment',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Confirm that cash was collected for a visit.',
    variables: {
      // `handleCollectCashConfirmLogic`. `bookingId` is genuinely required —
      // the handler returns `missing: ['bookingId']` with no fallback.
      bookingId: {
        type: 'string',
        description: 'Booking the cash was collected against.',
        required: true,
        resolver: 'appointment',
      },
      amount: {
        type: 'number',
        description:
          'Cash collected. Falls back to an amount found in the message; the booking is marked paid either way.',
        required: false,
        resolver: 'money',
      },
    },
    examples: ['I took cash for that visit', 'confirm cash payment'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.configure_cash_payments',
    aliases: ['configure_cash_payments'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Turn cash payment on or off for the business.',
    variables: {},
    examples: ['stop accepting cash', 'allow cash payments'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'payment.configure_cash_payments',
      captures: ['previousEnabled'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.configure_checkout_defaults',
    aliases: ['configure_checkout_defaults'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change the default checkout settings for new bookings.',
    variables: {},
    examples: ['change our checkout defaults', 'set default payment settings'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'payment.configure_checkout_defaults',
      captures: ['previousValues'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.configure_service_deposit_policy',
    aliases: ['configure_service_deposit_policy'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Set how much deposit a service requires up front.',
    variables: {},
    examples: [
      'require a 20 percent deposit for massages',
      'set the deposit policy',
    ],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'payment.configure_service_deposit_policy',
      captures: ['serviceId', 'previousPolicy'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.configure_service_online_payment',
    aliases: ['configure_service_online_payment'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Turn online payment on or off for a service.',
    variables: {},
    examples: [
      'allow online payment for facials',
      'stop taking card for massages',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'payment.configure_service_online_payment',
      captures: ['serviceId', 'previousEnabled'],
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.confirm_stripe_payment',
    aliases: ['confirm_stripe_payment'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description:
      'Finalise a booking after the customer returns from a completed card checkout.',
    variables: {
      // `handleConfirmStripePaymentLogic`. Two spellings for one thing:
      // `e2e-bug.188` added `pendingCheckoutSessionId` because the widget's
      // own context carries the in-progress checkout under that name. Neither
      // is required alone — the handler accepts either.
      sessionId: {
        type: 'string',
        description: 'Stripe checkout session to confirm.',
        required: false,
        resolver: 'none',
      },
      pendingCheckoutSessionId: {
        type: 'string',
        description:
          'The in-progress checkout the client is carrying, used when `sessionId` is absent.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'I already paid, finish my booking',
      'my stripe checkout says complete',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.explain_payment_status',
    aliases: ['explain_payment_status'],
    domain: 'payment',
    surfaces: ['provider'],
    tiers: { provider: ['client', 'staff', 'manager', 'owner'] },
    // e2e-bug.376 fixed: T0, and no compensation. §57 had to spec this as T1
    // with a `kind: 'none'` compensation because the registry declared it
    // mutating and the conformance suite — correctly — fails on a spec that
    // disagrees. The registry was wrong: a duplicated binding passed the whole
    // `PROVIDER_PAYMENTS_INTENTS` list as its own `mutateIntents`, so a read got
    // registered as a write. With the duplicate gone this can say what it is.
    risk: 'T0',
    description: 'Report whether a booking has been paid.',
    variables: {},
    examples: ['has that booking been paid', 'payment status for my 3pm'],
    confirm: 'never',
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.extend_gift_card_expiry',
    aliases: ['extend_gift_card_expiry'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Push back the expiry date on a gift card.',
    variables: {
      // `handleExtendGiftCardExpiryLogic`. Card identified by id or code;
      // the new expiry is expressed one of three ways.
      giftCardCode: {
        type: 'string',
        description:
          'Code of the card. Falls back to a code found in the message.',
        required: false,
        resolver: 'none',
      },
      giftCardId: {
        type: 'string',
        description: 'Id of the card, when it is already known.',
        required: false,
        resolver: 'none',
      },
      extendMonths: {
        type: 'number',
        description: 'Months to add to the current expiry.',
        required: false,
        resolver: 'none',
      },
      extendDays: {
        type: 'number',
        description: 'Days to add to the current expiry.',
        required: false,
        resolver: 'none',
      },
      expiresAt: {
        type: 'string',
        description:
          'Absolute new expiry, ISO 8601 date. Null clears the expiry entirely.',
        required: false,
        resolver: 'date',
      },
      note: {
        type: 'string',
        description: 'Audit note stored with the change.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'extend that gift card expiry',
      'give the gift card another year',
    ],
    confirm: 'always',
    // §47's money rule caught this: it was first declared `inverse`, on the
    // reasoning that an expiry date is just a field. But a customer may have
    // relied on the extension, and silently pulling it back to tidy up a failed
    // plan shortens the life of an instrument they hold. T2 means the tier
    // decides, not the field type.
    compensation: {
      kind: 'manual',
      reason:
        'A customer may already be relying on the extended expiry; shortening it back is a finance decision.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.pay_cash_at_visit',
    aliases: ['pay_cash_at_visit'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Record that the customer will pay cash when they arrive.',
    variables: {
      // `handlePayCashAtVisitLogic` → `enrichCashPaymentParamsFromPrompt` →
      // `resolveService`.
      serviceName: {
        type: 'string',
        description: 'Service the customer intends to pay for in person.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['I will pay cash at the visit', 'let me pay in person'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.pay_online',
    aliases: ['pay_online'],
    domain: 'payment',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Start or continue a card checkout for a booking.',
    variables: {
      // `handlePayOnlineLogic` → `enrichPayOnlineParamsFromPrompt` →
      // `resolveService`. Only the human reference is declared: `customerId`
      // and `sessionCustomerId` are injected from the session, and inviting a
      // planner to fill an id it cannot know is what `e2e-bug.399` was about.
      serviceName: {
        type: 'string',
        description: 'Service being paid for.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['pay for my booking now', 'I want to pay online'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.purchase_subscription_checkout',
    aliases: ['purchase_subscription_checkout'],
    domain: 'payment',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Start checkout for a subscription plan.',
    variables: {
      // `handlePurchaseSubscriptionCheckoutLogic`. Genuinely required — the
      // handler returns `missing: ['planId']` with no fallback.
      planId: {
        type: 'string',
        description: 'Subscription plan to price the checkout for.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['sign me up for the gold membership', 'buy the monthly plan'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
  {
    id: 'payment.refund_gift_card_order',
    aliases: ['refund_gift_card_order'],
    domain: 'payment',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Refund a gift card order.',
    variables: {
      // `handleRefundGiftCardOrderLogic`. `reason` is not optional in
      // practice — the handler clarifies for it — but it falls back to one
      // extracted from the message, so declaring it required would refuse the
      // phrasing that supplies it inline.
      giftCardCode: {
        type: 'string',
        description:
          'Code of the order to refund. Falls back to a code found in the message.',
        required: false,
        resolver: 'none',
      },
      giftCardId: {
        type: 'string',
        description: 'Id of the order, when it is already known.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description:
          'Why it is being refunded. The command asks for this before refunding if neither the params nor the message carry it.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'refund that gift card order',
      'cancel and refund gift card QATEST',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund — a new financial event with its own record, not an undo.',
    },
    handler: 'AiPaymentsService',
  },
] as const;
