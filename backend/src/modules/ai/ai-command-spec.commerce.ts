/**
 * AI-ROADMAP Phase 1 - ninth domain slice: `commerce` (registry
 * `gift-fulfillment` + `retail-finance`).
 *
 * 52 entries ported together because they are one domain in practice: selling
 * things that are not appointments, and the money that follows. 16 reads, 36
 * mutations - the most write-heavy slice so far.
 *
 * Three compensation shapes, all already established:
 *
 * - **money** (§57): retail sales, expenses, commission rules, cancelled orders;
 * - **fulfilment status as audit trail** (§62's chain-of-custody reasoning
 *   applied to deliveries rather than specimens) - `mark_shipped`,
 *   `mark_delivered`, `capture_delivery_proof`;
 * - **data that has left** (§58): `payout_export`, `export_analytics_report`.
 *
 * Three commands are registered `mutating: true` while reading:
 * `explain_gift_card_order_details` was verified against its handler
 * (`getDashboardOrder`, formats, returns) and is a confirmed instance of the
 * e2e-bug.376 class; `delivery_queue` and `gift_card_creation_queue` are queue
 * listings and are recorded there as suspected without separate verification.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const COMMERCE_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'commerce.commission_report',
    aliases: ['commission_report'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report staff commission earned over a period.',
    // §204 (C2/T0) — the handler reads the location; `resolveFinanceDateRange`
    // reads `from`/`to` before falling back to the prompt.
    variables: {
      locationId: {
        type: 'string',
        description: 'Location to scope the report to.',
        required: false,
        resolver: 'none',
      },
      from: {
        type: 'string',
        description: 'Start of the reporting window.',
        required: false,
        resolver: 'date',
      },
      to: {
        type: 'string',
        description: 'End of the reporting window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['what commission is owed', 'commission report for last month'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.filter_awaiting_creation',
    aliases: ['filter_awaiting_creation'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List gift cards waiting to be made.',
    // §201 (C2/T0) — paged listing.
    variables: {
      page: {
        type: 'number',
        description: 'Page of results wanted.',
        required: false,
        resolver: 'none',
      },
      pageSize: {
        type: 'number',
        description: 'How many results per page.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what cards still need making', 'show awaiting creation'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.list_expenses',
    aliases: ['list_expenses'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List recorded business expenses.',
    // §204 (C2/T0) — scoped listing.
    variables: {
      locationId: {
        type: 'string',
        description: 'Location to scope the report to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what expenses have we logged', 'list our expenses'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.list_gift_card_change_requests',
    aliases: ['list_gift_card_change_requests'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List customer requests to change gift card orders.',
    // §201 (C2/T0) — filtered listing.
    variables: {
      status: {
        type: 'string',
        description: 'Only change requests in this status.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what gift card changes are requested', 'list change requests'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.list_gift_card_orders',
    aliases: ['list_gift_card_orders'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List gift card orders and their status.',
    // §201 (C2/T0) — paged listing with a free-text search.
    variables: {
      page: {
        type: 'number',
        description: 'Page of results wanted.',
        required: false,
        resolver: 'none',
      },
      pageSize: {
        type: 'number',
        description: 'How many results per page.',
        required: false,
        resolver: 'none',
      },
      search: {
        type: 'string',
        description: 'Free-text filter over the orders.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['show me gift card orders', 'list our gift card sales'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.list_products',
    aliases: ['list_products'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'List retail products in the catalogue.',
    // §204 (C2/T0) — scoped listing.
    variables: {
      locationId: {
        type: 'string',
        description: 'Location to scope the report to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what products do we stock', 'list our retail items'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.list_refunds',
    aliases: ['list_refunds'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List refunds that have been issued.',
    variables: {},
    examples: ['what refunds have we given', 'list our refunds'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.order_status_notifications',
    aliases: ['order_status_notifications'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description:
      'Explain the notifications sent as a gift card order progresses.',
    variables: {},
    examples: ['will you tell me when it ships', 'what updates will I get'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.print_packing_slip',
    aliases: ['print_packing_slip'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Produce a packing slip for a physical gift card order.',
    // §201 (C2/T0) — same `resolveGiftCardId` chain as the details command.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order in question.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Take the first card in the creation queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['print the packing slip', 'get me the packing note'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.search_retail_sku',
    aliases: ['search_retail_sku'],
    domain: 'commerce',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Find a retail product by name or SKU.',
    // §204 (C2/T0) — the handler reads both search keys;
    // `extractRetailSearchQuery` only falls back to the prompt.
    variables: {
      query: {
        type: 'string',
        description: 'Free-text search over the retail catalogue.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product searched for by name.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['find the shampoo sku', 'search for that product'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.shipping_method_quote',
    aliases: ['shipping_method_quote'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Quote the cost and speed of shipping options.',
    // §201 (C2/T0) — the quote is priced from all three.
    variables: {
      shippingMethodId: {
        type: 'string',
        description: 'Shipping method being quoted.',
        required: false,
        resolver: 'none',
      },
      amount: {
        type: 'number',
        description: 'Order amount the quote is based on.',
        required: false,
        resolver: 'money',
      },
      purchaserEmail: {
        type: 'string',
        description: 'Purchaser, used to resolve their address.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['how much is delivery', 'what shipping options are there'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.suggest_retail_upsell',
    aliases: ['suggest_retail_upsell'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Suggest a product to offer alongside a service.',
    // §204 (C2/T0) — the handler reads the appointment flag and service;
    // `resolveBooking` reads the booking, `resolveProviderBooking` the
    // provider, `resolveService` the service.
    variables: {
      myAppointment: {
        type: 'boolean',
        description:
          'Whether the upsell is for my own appointment.',
        required: false,
        resolver: 'none',
      },
      bookingId: {
        type: 'string',
        description: 'Booking the upsell attaches to.',
        required: false,
        resolver: 'appointment',
      },
      customerName: {
        type: 'string',
        description: 'Customer, used to find the booking.',
        required: false,
        resolver: 'customer',
      },
      serviceId: {
        type: 'string',
        description: 'Service being upsold against, by id.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service being upsold against, by name.',
        required: false,
        resolver: 'service',
      },
      employeeId: {
        type: 'string',
        description: 'Provider whose booking is used.',
        required: false,
        resolver: 'employee',
      },
      sessionEmployeeId: {
        type: 'string',
        description: 'Provider from the current session.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what should I offer with this',
      'suggest an upsell',
      'Suggest a retail upsell product for the deep tissue massage service',
    ],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.summarize_adoption_funnel',
    aliases: ['summarize_adoption_funnel'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise how customers move through the adoption funnel.',
    // §204 (C2/T0) — the window is a day count, not a date range.
    variables: {
      periodDays: {
        type: 'number',
        description: 'How many days the funnel covers.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how is adoption going', 'show the funnel'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.summarize_pl',
    aliases: ['summarize_pl'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise profit and loss for a period.',
    // §204 (C2/T0) — same location + `resolveFinanceDateRange` pair.
    variables: {
      locationId: {
        type: 'string',
        description: 'Location to scope the report to.',
        required: false,
        resolver: 'none',
      },
      from: {
        type: 'string',
        description: 'Start of the reporting window.',
        required: false,
        resolver: 'date',
      },
      to: {
        type: 'string',
        description: 'End of the reporting window.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['how profitable were we', 'show me the P and L'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.summarize_reviews',
    aliases: ['summarize_reviews'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T0',
    description: 'Summarise what customer reviews say.',
    // §204 (C2/T0) — optionally scoped to one provider.
    variables: {
      employeeId: {
        type: 'string',
        description: 'Provider whose reviews are summarized.',
        required: false,
        resolver: 'employee',
      },
    },
    examples: ['what are reviews saying', 'summarise our reviews'],
    confirm: 'never',
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.track_gift_card_shipment',
    aliases: ['track_gift_card_shipment'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T0',
    description: 'Track a physical gift card shipment.',
    // §201 (C2/T0) — the customer comes from the session; the card is named.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to track.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['where is my gift card', 'track my delivery'],
    confirm: 'never',
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.explain_gift_card_order_details',
    aliases: ['explain_gift_card_order_details'],
    domain: 'commerce',
    surfaces: ['dashboard', 'provider'],
    tiers: {
      dashboard: ['staff', 'manager', 'owner'],
      provider: ['client', 'staff', 'manager', 'owner'],
    },
    // e2e-bug.376, second wave (§123): registry fixed, so this can say what it
    // is. It was T1 with a `kind: 'none'` compensation only because a binding
    // passed its whole intent list as `mutateIntents` and conformance —
    // correctly — fails a spec that disagrees with the registry.
    risk: 'T0',
    description: 'Explain the details of a gift card order.',
    // §201 (C2/T0) — `resolveGiftCardId` reads the id, then the prompt, then
    // falls back to the head of the creation queue.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order in question.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Take the first card in the creation queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['explain this gift card order', 'what is on that order'],
    confirm: 'never',
    // Registered `mutating: true` but the handler only reads and formats
    // (`getDashboardOrder`). Specced as declared because conformance requires
    // agreement; this is a confirmed instance of the e2e-bug.376 class.
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.delivery_queue',
    aliases: ['delivery_queue'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    // e2e-bug.376, second wave (§123): registry fixed, so this can say what it
    // is. It was T1 with a `kind: 'none'` compensation only because a binding
    // passed its whole intent list as `mutateIntents` and conformance —
    // correctly — fails a spec that disagrees with the registry.
    risk: 'T0',
    description: 'Show the queue of gift cards awaiting delivery.',
    variables: {},
    examples: ['what is out for delivery', 'show the delivery queue'],
    confirm: 'never',
    // Registered `mutating: true` despite being a queue listing. Not
    // separately verified; recorded under e2e-bug.376 as a suspected instance.
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.gift_card_creation_queue',
    aliases: ['gift_card_creation_queue'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    // e2e-bug.376, second wave (§123): registry fixed, so this can say what it
    // is. It was T1 with a `kind: 'none'` compensation only because a binding
    // passed its whole intent list as `mutateIntents` and conformance —
    // correctly — fails a spec that disagrees with the registry.
    risk: 'T0',
    description: 'Show the queue of gift cards awaiting creation.',
    variables: {},
    examples: ['what cards need making', 'show the creation queue'],
    confirm: 'never',
    // Registered `mutating: true` despite being a queue listing. Not
    // separately verified; recorded under e2e-bug.376 as a suspected instance.
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.start_card_preparation',
    aliases: ['start_card_preparation'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Begin preparing a physical gift card.',
    // §177 (C2/T1) — reads nothing of its own. Identification runs through `resolveGiftCardId`,
    // which reads `giftCardId` then `useFirstInQueue` (`_prompt` is
    // pipeline-injected and so not declared).
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['start making that card', 'begin card preparation'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'commerce.start_card_preparation',
      captures: ['orderId', 'previousStatus'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.mark_card_ready',
    aliases: ['mark_card_ready'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Mark a gift card as ready to send.',
    // §177 (C2/T1) — reads nothing of its own. Identification runs through `resolveGiftCardId`,
    // which reads `giftCardId` then `useFirstInQueue` (`_prompt` is
    // pipeline-injected and so not declared).
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['that card is ready', 'mark it ready to ship'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.mark_card_ready',
      captures: ['orderId', 'previousStatus'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.assign_card_creator',
    aliases: ['assign_card_creator'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Assign someone to make a gift card.',
    // §177 (C2/T1) — two resolvers: `resolveGiftCardId` for the order and
    // `resolveEmployee` for the assignee, each with its own `missing` refusal.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Staff member id, when known.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description:
          'Staff member to assign. The handler refuses with `missing: [employeeName]` when neither is resolvable.',
        required: true,
        resolver: 'employee',
      },
    },
    examples: ['give that card to Mary to make', 'assign a card creator'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.assign_card_creator',
      captures: ['orderId', 'previousAssigneeId'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.assign_delivery_staff',
    aliases: ['assign_delivery_staff'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Assign someone to deliver a gift card.',
    // §177 (C2/T1) — same pair of resolvers as `assign_card_creator`.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      employeeId: {
        type: 'string',
        description: 'Staff member id, when known.',
        required: false,
        resolver: 'employee',
      },
      employeeName: {
        type: 'string',
        description:
          'Staff member to assign. The handler refuses with `missing: [employeeName]` when neither is resolvable.',
        required: true,
        resolver: 'employee',
      },
    },
    examples: ['send Gevorg to deliver that', 'assign delivery staff'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.assign_delivery_staff',
      captures: ['orderId', 'previousAssigneeId'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.mark_out_for_delivery',
    aliases: ['mark_out_for_delivery'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Mark a gift card as out for delivery.',
    // §177 (C2/T1) — reads nothing of its own. Identification runs through `resolveGiftCardId`,
    // which reads `giftCardId` then `useFirstInQueue` (`_prompt` is
    // pipeline-injected and so not declared).
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['it is on its way', 'mark out for delivery'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason:
        'Fulfilment status is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.mark_shipped',
    aliases: ['mark_shipped'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Mark a gift card order as shipped.',
    // §177 (C2/T1) — order identification plus the shipment details it records.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      carrier: {
        type: 'string',
        description: 'Shipping carrier.',
        required: false,
        resolver: 'none',
      },
      trackingNumber: {
        type: 'string',
        description: 'Carrier tracking number.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['that order has shipped', 'mark it shipped'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason:
        'Fulfilment status is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.mark_delivered',
    aliases: ['mark_delivered'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Mark a gift card as delivered.',
    // §177 (C2/T1) — reads nothing of its own. Identification runs through `resolveGiftCardId`,
    // which reads `giftCardId` then `useFirstInQueue` (`_prompt` is
    // pipeline-injected and so not declared).
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['it has been delivered', 'mark that as delivered'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason:
        'Fulfilment status is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.accept_delivery',
    aliases: ['accept_delivery'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Record that a delivery was accepted by the recipient.',
    // §177 (C2/T1) — `handleAcceptDeliveryLogic` is a one-line delegation to
    // `handleMarkOutForDeliveryLogic`, so it takes exactly the same inputs and has
    // exactly the same effect. Second duplicate-command pair found by this
    // campaign; see `e2e-bug.461`.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['they took the delivery', 'accept that delivery'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'none',
      reason:
        'Fulfilment status is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.capture_delivery_proof',
    aliases: ['capture_delivery_proof'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Attach proof that a delivery was made.',
    // §177 (C2/T1) — order identification plus the proof it stores; the handler
    // refuses when neither proof field is present.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      proofUrl: {
        type: 'string',
        description: 'Link to a photo or signature proving delivery.',
        required: false,
        resolver: 'none',
      },
      proofNote: {
        type: 'string',
        description: 'Free-text note recorded as delivery proof.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add the delivery photo', 'capture proof of delivery'],
    confirm: 'never',
    compensation: {
      kind: 'none',
      reason:
        'Fulfilment status is an audit trail; a correction is a new entry, not an erasure.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.notify_delay',
    aliases: ['notify_delay'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Tell a customer their gift card order is delayed.',
    // §177 (C2/T1) — order identification plus the reason sent to the customer.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order to act on.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      delayReason: {
        type: 'string',
        description: 'Why the order is delayed.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['let them know it is late', 'notify the delay'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The customer has been told; the message cannot be unsent.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.gift_fulfill_batch',
    aliases: ['gift_fulfill_batch'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T3',
    description: 'Fulfil a batch of gift card orders at once.',
    variables: {
      // `handleGiftFulfillBatchLogic` reads exactly one param.
      count: {
        type: 'number',
        description:
          'How many queued gift cards to fulfil in this batch. Omit to use the service default.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['fulfil all the pending cards', 'process the gift card batch'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Advances many orders and notifies each customer; unwinding needs per-order pre-state.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.cancel_gift_card_order',
    aliases: ['cancel_gift_card_order'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Cancel a gift card order.',
    variables: {
      // `resolveGiftCardId` — note `useFirstInQueue`, which is how "cancel the
      // next one" works. It is a *scope* flag, not a filter: with no id and no
      // queue flag the command declines rather than picking arbitrarily.
      giftCardId: {
        type: 'string',
        description:
          'Order to cancel. Falls back to an id found in the message.',
        required: false,
        resolver: 'none',
      },
      useFirstInQueue: {
        type: 'boolean',
        description:
          'Act on the first order in the fulfilment queue instead of naming one.',
        required: false,
        resolver: 'none',
      },
      reason: {
        type: 'string',
        description: 'Cancellation reason recorded on the order.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['cancel that gift card order', 'stop that order'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Money moved. Reversing it is a refund - a new financial event, not an undo.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.resolve_gift_card_change_request',
    aliases: ['resolve_gift_card_change_request'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description:
      'Approve or reject a customer request to change a gift card order.',
    variables: {
      // `handleResolveGiftCardChangeRequestLogic` reports
      // `missing: ['requestId', 'resolution']` when either is absent, with no
      // prompt fallback for either — but neither is `required` by this
      // backlog's criterion, because the handler asks rather than refusing.
      //
      // The description says "approve or reject"; the handler accepts a third
      // value, `needs_info`, which sends the request back to the customer
      // rather than settling it. The enum is what makes that reachable.
      requestId: {
        type: 'string',
        description: 'Change request to settle.',
        required: false,
        resolver: 'none',
      },
      resolution: {
        type: 'string',
        description:
          'How to settle it. `needs_info` returns the request to the customer instead of approving or denying.',
        required: false,
        resolver: 'none',
        enum: ['approve', 'deny', 'needs_info'],
      },
      specialistNotes: {
        type: 'string',
        description: 'Notes recorded with the decision.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['approve that change request', 'reject the gift card change'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The customer has been told the outcome of their request.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.extend_cancel_window',
    aliases: ['extend_cancel_window'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Give a customer longer to cancel a gift card order.',
    // §177 slice 16 — **corrected**. Earlier exempted as prompt-parsed on a grep of
    // the handler body, which showed only `params._prompt`. The reads happen inside
    // `parseCancelModifyWindowHours`, one level down — which reads exactly the
    // field the handler's `missing` hint names. The earlier exemption note
    // claimed it never read that param; that was wrong.
    variables: {
      cancelModifyWindowHours: {
        type: 'number',
        description:
          'New cancel/modify window in hours. Parsed from the prompt when omitted.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['give them another day to cancel', 'extend the cancel window'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'The customer may already be relying on the extended window; shortening it back is a service decision.',
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.update_gift_card_settings',
    aliases: ['update_gift_card_settings'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Change how gift cards are sold and fulfilled.',
    // §177 (C2/T1) — the only command in this cluster that reads its params
    // directly, with no resolver in between.
    variables: {
      digitalDeliveryEnabled: {
        type: 'boolean',
        description: 'Offer digital gift card delivery.',
        required: false,
        resolver: 'none',
      },
      physicalDeliveryEnabled: {
        type: 'boolean',
        description: 'Offer physical gift card delivery.',
        required: false,
        resolver: 'none',
      },
      cancelModifyEnabled: {
        type: 'boolean',
        description: 'Allow customers to cancel or modify an order.',
        required: false,
        resolver: 'none',
      },
      physicalCancelBeforeReady: {
        type: 'boolean',
        description:
          'Restrict cancellation of physical cards to before they are ready.',
        required: false,
        resolver: 'none',
      },
      defaultExpiryMonths: {
        type: 'number',
        description: 'Default gift card validity in months.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change our gift card rules', 'update gift card settings'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.update_gift_card_settings',
      captures: ['previousValues'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.enter_shipping_address',
    aliases: ['enter_shipping_address'],
    domain: 'commerce',
    surfaces: ['customer'],
    tiers: { customer: ['client'] },
    risk: 'T2',
    description: 'Give the shipping address for a physical gift card.',
    variables: {
      // `handleEnterShippingAddressLogic`. `sessionCustomerId` is injected and
      // stays undeclared as everywhere else. `shippingAddress` is a postal
      // address the customer supplies — declared because the command exists to
      // carry it, unlike the credential case in `configure_openai`.
      shippingAddress: {
        type: 'string',
        description: 'Where the physical card is posted.',
        required: false,
        resolver: 'none',
      },
      recipientName: {
        type: 'string',
        description: 'Name the card is addressed to.',
        required: false,
        resolver: 'none',
      },
      giftCardId: {
        type: 'string',
        description: 'Which gift card order the address is for.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['ship it to 12 High Street', 'here is my delivery address'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.enter_shipping_address',
      captures: ['orderId', 'previousAddress'],
    },
    handler: 'AiGiftFulfillmentService',
  },
  {
    id: 'commerce.add_retail_sale_to_booking',
    aliases: ['add_retail_sale_to_booking'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Add a retail sale to a booking.',
    variables: {
      // tech-debt C2 — `handleAddRetailSaleToBookingLogic` -> `resolveBooking`
      // + `resolveProduct`. Both resolvers accept an id or a name and fall back
      // to the message, so nothing here is required.
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to one identified in the message.',
        required: false,
        resolver: 'appointment',
      },
      productName: {
        type: 'string',
        description:
          'Product by name. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id, when it is already known.',
        required: false,
        resolver: 'none',
      },
      quantity: {
        type: 'number',
        description: 'How many units to add. Defaults to one.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a shampoo to that booking', 'sell them a product'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.remove_retail_line',
      captures: ['bookingId', 'previousLines'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.add_retail_to_my_booking',
    aliases: ['add_retail_to_my_booking'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Add a retail product to the provider own booking.',
    variables: {
      // `handleAddRetailToMyBookingLogic` — the provider-surface variant.
      // `employeeId`/`sessionEmployeeId` are session-injected and not declared,
      // for the reason `e2e-bug.399` records.
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to one identified in the message.',
        required: false,
        resolver: 'appointment',
      },
      productName: {
        type: 'string',
        description:
          'Product by name. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id, when it is already known.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add conditioner to my 3pm', 'sell them the serum'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.remove_retail_line',
      captures: ['bookingId', 'previousLines'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.remove_retail_line',
    aliases: ['remove_retail_line'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Remove a retail line from a booking.',
    variables: {
      // `handleRemoveRetailLineLogic` -> `resolveBooking` + `resolveProduct`,
      // with `extractProductNameFromPrompt` as the fallback.
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to one identified in the message.',
        required: false,
        resolver: 'appointment',
      },
      productName: {
        type: 'string',
        description:
          'Product by name. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id, when it is already known.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['take that product off', 'remove the retail line'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.add_retail_sale_to_booking',
      captures: ['bookingId', 'previousLines'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.set_retail_sales_lines',
    aliases: ['set_retail_sales_lines'],
    domain: 'commerce',
    surfaces: ['provider', 'dashboard'],
    tiers: {
      provider: ['client', 'staff', 'manager', 'owner'],
      dashboard: ['staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Set the full list of retail products sold on a booking.',
    variables: {
      // `handleSetRetailSalesLinesLogic`. Replaces the whole retail tab, so
      // `lines` is the entire new contents — omitting it does not mean "leave
      // as is", it means the command parses the list out of the message.
      bookingId: {
        type: 'string',
        description:
          'Booking to act on. Falls back to one identified in the message.',
        required: false,
        resolver: 'appointment',
      },
      lines: {
        type: 'object[]',
        description:
          'The complete set of retail lines for the booking. Falls back to lines parsed from the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['they bought shampoo and conditioner', 'set the retail lines'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.set_retail_sales_lines',
      captures: ['bookingId', 'previousLines'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.create_product',
    aliases: ['create_product'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Add a retail product to the catalogue.',
    // §177 (C2/T1) — `handleCreateProductLogic` refuses with `missing: ['name']`
    // and reads `productName` as an alias for it.
    variables: {
      name: {
        type: 'string',
        description: 'Product name. `productName` is accepted as an alias.',
        required: true,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Alias for `name`.',
        required: false,
        resolver: 'none',
      },
      sku: {
        type: 'string',
        description: 'Stock-keeping unit.',
        required: false,
        resolver: 'none',
      },
      retailPrice: {
        type: 'number',
        description: 'Price charged to the customer.',
        required: false,
        resolver: 'money',
      },
      unitCost: {
        type: 'number',
        description: 'Cost price per unit.',
        required: false,
        resolver: 'money',
      },
      quantityOnHand: {
        type: 'number',
        description: 'Opening stock level.',
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description: 'Location the stock belongs to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['add a new shampoo', 'create a retail product'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.delete_inventory_product',
      captures: ['productId'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.update_inventory_product',
    aliases: ['update_inventory_product'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Change a retail product.',
    // §177 (C2/T1) — identified via `resolveProduct`, then applies whichever
    // fields are present.
    variables: {
      productId: {
        type: 'string',
        description: 'Product id — tried first by `resolveProduct`.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product name, used when no id is supplied.',
        required: true,
        resolver: 'none',
      },
      newName: {
        type: 'string',
        description: 'Rename the product.',
        required: false,
        resolver: 'none',
      },
      sku: {
        type: 'string',
        description: 'New stock-keeping unit.',
        required: false,
        resolver: 'none',
      },
      retailPrice: {
        type: 'number',
        description: 'New retail price.',
        required: false,
        resolver: 'money',
      },
      unitCost: {
        type: 'number',
        description: 'New unit cost.',
        required: false,
        resolver: 'money',
      },
      reorderLevel: {
        type: 'number',
        description: 'Stock level at which to reorder.',
        required: false,
        resolver: 'none',
      },
      isActive: {
        type: 'boolean',
        description: 'Activate or deactivate the product.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['change the shampoo price', 'update that product'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.update_inventory_product',
      captures: ['productId', 'previousValues'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.delete_inventory_product',
    aliases: ['delete_inventory_product'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Remove a retail product from the catalogue.',
    // §177 (C2/T1) — identification is the whole input.
    variables: {
      productId: {
        type: 'string',
        description: 'Product id — tried first by `resolveProduct`.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product name, used when no id is supplied.',
        required: true,
        resolver: 'none',
      },
    },
    examples: ['delete that product', 'remove the old shampoo'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Past sales reference the product; recreating it does not restore those links.',
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.adjust_inventory',
    aliases: ['adjust_inventory'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T2',
    description: 'Change the recorded stock level of a product.',
    variables: {
      // `handleAdjustInventoryLogic` -> `resolveProduct` +
      // `extractInventoryDeltaFromPrompt`.
      productName: {
        type: 'string',
        description:
          'Product by name. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id, when it is already known.',
        required: false,
        resolver: 'none',
      },
      delta: {
        type: 'number',
        description:
          'Change in stock — negative to reduce. Falls back to a delta found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['we have 12 shampoos left', 'adjust the stock count'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.adjust_inventory',
      captures: ['productId', 'previousQuantity'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.link_product_to_service',
    aliases: ['link_product_to_service'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Link a retail product to a service so it can be suggested.',
    // §177 (C2/T1) — both sides of the link are resolved, each with its own
    // `missing` refusal, plus the quantity consumed per booking.
    variables: {
      productId: {
        type: 'string',
        description: 'Product id — tried first by `resolveProduct`.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product name, used when no id is supplied.',
        required: true,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service id — tried first by `resolveService`.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service name, used when no id is supplied.',
        required: true,
        resolver: 'service',
      },
      quantityPerService: {
        type: 'number',
        description:
          'Units of the product consumed by one booking of the service.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'suggest conditioner after a cut',
      'link that product to the service',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.unlink_inventory_product',
      captures: ['productId', 'serviceId'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.unlink_inventory_product',
    aliases: ['unlink_inventory_product'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Unlink a retail product from a service.',
    // §177 (C2/T1) — either the link id directly, or both sides to find it.
    variables: {
      linkId: {
        type: 'string',
        description: 'Product-to-service link id, when known.',
        required: false,
        resolver: 'none',
      },
      productId: {
        type: 'string',
        description: 'Product id — tried first by `resolveProduct`.',
        required: false,
        resolver: 'none',
      },
      productName: {
        type: 'string',
        description: 'Product name, used when no id is supplied.',
        required: true,
        resolver: 'none',
      },
      serviceId: {
        type: 'string',
        description: 'Service id — tried first by `resolveService`.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service name, used when no id is supplied.',
        required: true,
        resolver: 'service',
      },
    },
    examples: ['stop suggesting that product', 'unlink it from the service'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.link_product_to_service',
      captures: ['productId', 'serviceId'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.set_recommended_products',
    aliases: ['set_recommended_products'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['staff', 'manager', 'owner'] },
    risk: 'T1',
    description: 'Set which products are recommended.',
    // §177 (C2/T1) — scoped by service *or* category (`missing: ['serviceName',
    // 'categoryId']`), and takes the product set by id or by name
    // (`missing: ['productIds', 'productNames']`).
    variables: {
      serviceId: {
        type: 'string',
        description: 'Service id — tried first by `resolveService`.',
        required: false,
        resolver: 'service',
      },
      serviceName: {
        type: 'string',
        description: 'Service name, used when no id is supplied.',
        required: true,
        resolver: 'service',
      },
      categoryId: {
        type: 'string',
        description: 'Category scope, as an alternative to a service.',
        required: false,
        resolver: 'none',
      },
      productIds: {
        type: 'string[]',
        description: 'Products to recommend, by id.',
        required: false,
        resolver: 'none',
      },
      productNames: {
        type: 'string[]',
        description:
          'Products to recommend, by name. One of the two lists is required.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['recommend these three products', 'set our recommended items'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'commerce.set_recommended_products',
      captures: ['previousRecommendations'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.record_expense',
    aliases: ['record_expense'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Record a business expense.',
    variables: {
      // `handleRecordExpenseLogic`. `amount` and `description` are extracted
      // from the message when absent, which is the usual path for "record a
      // $40 taxi".
      amount: {
        type: 'number',
        description:
          'Expense amount. Falls back to an amount found in the message.',
        required: false,
        resolver: 'money',
      },
      description: {
        type: 'string',
        description: 'What the expense was for.',
        required: false,
        resolver: 'none',
      },
      currency: {
        type: 'string',
        description:
          'Currency of the amount, when it is not the business default.',
        required: false,
        resolver: 'none',
      },
      expenseDate: {
        type: 'string',
        description: 'Date of the expense, ISO 8601.',
        required: false,
        resolver: 'date',
      },
      locationId: {
        type: 'string',
        description: 'Location the expense belongs to.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['log 200 for supplies', 'record that expense'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.delete_expense',
      captures: ['expenseId'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.delete_expense',
    aliases: ['delete_expense'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Delete a recorded expense.',
    variables: {
      // `handleDeleteExpenseLogic` -> `enrichDeleteExpenseParamsFromPrompt`,
      // which fills `expenseId`, `category` and `description` from the message
      // when the params do not carry them.
      expenseId: {
        type: 'string',
        description: 'Expense to delete, when the id is known.',
        required: false,
        resolver: 'none',
      },
      category: {
        type: 'string',
        description:
          'Narrow to a category when the expense is named indirectly.',
        required: false,
        resolver: 'none',
      },
      description: {
        type: 'string',
        description: 'Text of the expense to match on.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['delete that expense', 'remove the supplies entry'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Financial records are reported on; removing one needs an accounting decision and an audit note.',
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.create_commission_rule',
    aliases: ['create_commission_rule'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Create a rule setting how commission is earned.',
    variables: {
      // `handleCreateCommissionRuleLogic` -> `resolveByName` + `resolveService`.
      employeeName: {
        type: 'string',
        description: 'Provider the rule applies to.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Service the rule applies to.',
        required: false,
        resolver: 'service',
      },
      type: {
        type: 'string',
        description: 'Whether the rule is a percentage or a flat amount.',
        required: false,
        resolver: 'none',
        enum: ['percentage', 'flat'],
      },
      value: {
        type: 'number',
        description: 'The percentage or flat amount.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['pay 10 percent on retail', 'create a commission rule'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'commerce.delete_commission_rule',
      captures: ['ruleId'],
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.delete_commission_rule',
    aliases: ['delete_commission_rule'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Delete a commission rule.',
    variables: {
      // `handleDeleteCommissionRuleLogic` -> `resolveByName` + `resolveService`.
      ruleId: {
        type: 'string',
        description: 'Rule to delete, when the id is known.',
        required: false,
        resolver: 'none',
      },
      employeeName: {
        type: 'string',
        description: 'Provider whose rule is being deleted.',
        required: false,
        resolver: 'employee',
      },
      serviceName: {
        type: 'string',
        description: 'Service whose rule is being deleted.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['remove that commission rule', 'delete the retail commission'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Commission already calculated under the rule has been reported and possibly paid.',
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.payout_export',
    aliases: ['payout_export'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Export a payout file for staff earnings.',
    variables: {
      // `handlePayoutExportLogic` -> `resolveDateRange`.
      format: {
        type: 'string',
        description: 'Export format.',
        required: false,
        resolver: 'none',
      },
      locationId: {
        type: 'string',
        description: 'Restrict the export to one location.',
        required: false,
        resolver: 'none',
      },
      dateFrom: {
        type: 'string',
        description: 'First day of the payout period, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'Last day of the payout period, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
    },
    examples: ['export the payout file', 'generate payouts for this month'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The data has left the system and cannot be recalled.',
    },
    handler: 'AiRetailFinanceService',
  },
  {
    id: 'commerce.export_analytics_report',
    aliases: ['export_analytics_report'],
    domain: 'commerce',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Export an analytics report.',
    variables: {
      // tech-debt C2 — `handleExportAnalyticsReportLogic` -> `resolveDateRange`
      // (`dateFrom`/`dateTo`), plus `format` and `locationId`.
      //
      // The date range is where `e2e-bug.261` lives: `resolveDateRange` falls
      // back to parsing the message, and "for this month" produces a NaN date
      // that reaches the query unchecked. Declaring the two date fields does not
      // fix that — it is a handler bug — but it gives a planner a way to supply
      // real dates instead of relying on the parse.
      dateFrom: {
        type: 'string',
        description: 'First day of the reporting period, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      dateTo: {
        type: 'string',
        description: 'Last day of the reporting period, ISO 8601 date.',
        required: false,
        resolver: 'date',
      },
      format: {
        type: 'string',
        description: 'Export format; anything other than `pdf` produces CSV.',
        required: false,
        resolver: 'none',
        enum: ['csv', 'pdf'],
      },
      locationId: {
        type: 'string',
        description: 'Restrict the report to one location.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['export the analytics', 'download our numbers'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The data has left the system and cannot be recalled.',
    },
    handler: 'AiRetailFinanceService',
  },
] as const;
