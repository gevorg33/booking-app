/**
 * AI-ROADMAP Phase 1 - fourth domain slice: `customer`.
 *
 * 34 registry entries under `apiModule: 'customer-crm'`: 19 reads, 15 mutations.
 * Where the payment slice exercised the money half of T2, this one exercises the
 * **PII** half - `delete_customer_data`, `privacy_delete`, `privacy_export`,
 * `export_customer_data`, `merge_customers`.
 *
 * The compensation declarations here are blunt, and should be. An export has
 * left the building; erasure is the point of the command; a merge folds two
 * histories together without recording the seam. None is reversible in the sense
 * a saga needs, and pretending otherwise would be worse than useless - Phase 5's
 * `partially_rolled_back` exists to say so.
 *
 * Note the surface split: the same capability appears twice, once for staff
 * acting on someone else (`customer.export_data`, manager+) and once for the
 * person themselves (`customer.privacy_export`, client). They are separate
 * registry entries and stay separate specs, because the actor differs and so
 * does the tier.
 */
import type { CommandSpec } from './ai-command-spec.types.js';

export const CUSTOMER_COMMAND_SPECS: readonly CommandSpec[] = [
  {
    id: 'customer.no_show_history',
    aliases: ['customer_no_show_history'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report how often a customer has failed to attend.',
    // §190 (C2/T0) — the staff-side lookup shape: the handler dereferences nothing
    // itself and passes `params` to `resolveCustomer`, which reads `customerId`
    // then `customerName`. Not to be confused with the `my_*` commands on the same
    // service, which take the customer from the session instead.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to look up.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer id — tried first by `resolveCustomer`.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'how many no shows has Gevorg had',
      'show me this customer no show history',
    ],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.discover_gift_card_products',
    aliases: ['discover_gift_card_products'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the gift cards available to buy.',
    variables: {},
    examples: ['what gift cards do you sell', 'show me gift card options'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.discover_packages',
    aliases: ['discover_packages'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the packages available to buy.',
    variables: {},
    examples: ['what packages do you offer', 'show me your bundles'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.discover_subscription_plans',
    aliases: ['discover_subscription_plans'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the subscription plans available to join.',
    // §190 (C2/T0) — one filter, read directly.
    variables: {
      serviceId: {
        type: 'string',
        description: 'Only plans covering this service.',
        required: false,
        resolver: 'service',
      },
    },
    examples: ['what memberships do you have', 'show me subscription options'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.explain_gift_card_order',
    aliases: ['explain_gift_card_order'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Explain the status and contents of a gift card order.',
    // §190 (C2/T0) — the order; the customer comes from the session.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Gift card order being explained.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'what happened to my gift card order',
      'explain my gift card purchase',
    ],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.explain_my_subscription',
    aliases: ['explain_my_subscription'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Explain what the customer subscription includes and when it renews.',
    // §190 (C2/T0) — two ids for the same thing, plus what
    // `parseExplainMySubscriptionFromPrompt` reads.
    variables: {
      subscriptionId: {
        type: 'string',
        description: 'Subscription being explained.',
        required: false,
        resolver: 'none',
      },
      customerSubscriptionId: {
        type: 'string',
        description: 'The customer-scoped id for the same subscription.',
        required: false,
        resolver: 'none',
      },
      focus: {
        type: 'string',
        description: 'Which aspect of the subscription to explain.',
        required: false,
        resolver: 'none',
      },
      subscriptionFirstVisit: {
        type: 'boolean',
        description: 'Explain the first-visit rules specifically.',
        required: false,
        resolver: 'none',
        source: 'orchestrator',
      },
    },
    examples: [
      'what does my membership include',
      'when does my subscription renew',
    ],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.get_my_locale',
    aliases: ['get_my_locale'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Report the language the customer is currently set to.',
    // §190 (C2/T0) — only the tenant slug, read by
    // `resolveBusinessSlugFromParamsOrId`; the customer comes from the session.
    variables: {
      slug: {
        type: 'string',
        description:
          'Business slug. A tenant identifier from the URL, not something the user says.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['what language am I set to', 'which locale do I have'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.gift_card_balance',
    aliases: ['gift_card_balance'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Report the balance of a gift card the customer holds.',
    // §190 (C2/T0) — the code; the customer comes from the session.
    variables: {
      giftCardCode: {
        type: 'string',
        description: 'Gift card code to check.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how much is on my gift card', 'my gift card balance'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.gift_card_redemption_history',
    aliases: ['gift_card_redemption_history'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List where and when a gift card has been spent.',
    variables: {},
    examples: [
      'where have I used my gift card',
      'gift card redemption history',
    ],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.list_bookings',
    aliases: ['list_customer_bookings'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the bookings belonging to a specific customer.',
    // §190 (C2/T0) — the staff-side lookup shape: the handler dereferences nothing
    // itself and passes `params` to `resolveCustomer`, which reads `customerId`
    // then `customerName`. Not to be confused with the `my_*` commands on the same
    // service, which take the customer from the session instead.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to look up.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer id — tried first by `resolveCustomer`.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['show me Gevorg bookings', 'list this customer appointments'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.list_gift_cards',
    aliases: ['list_customer_gift_cards'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the gift cards held by a specific customer.',
    // §190 (C2/T0) — the staff-side lookup shape: the handler dereferences nothing
    // itself and passes `params` to `resolveCustomer`, which reads `customerId`
    // then `customerName`. Not to be confused with the `my_*` commands on the same
    // service, which take the customer from the session instead.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to look up.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer id — tried first by `resolveCustomer`.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'what gift cards does Gevorg have',
      'list this customer gift cards',
    ],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.list_subscriptions',
    aliases: ['list_customer_subscriptions'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'List the subscriptions held by a specific customer.',
    // §190 (C2/T0) — the staff-side lookup shape: the handler dereferences nothing
    // itself and passes `params` to `resolveCustomer`, which reads `customerId`
    // then `customerName`. Not to be confused with the `my_*` commands on the same
    // service, which take the customer from the session instead.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to look up.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer id — tried first by `resolveCustomer`.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: ['what plan is Gevorg on', 'list this customer subscriptions'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.my_appointments',
    aliases: ['my_appointments'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'List the upcoming appointments belonging to the requesting customer.',
    variables: {},
    examples: ['what are my appointments', 'when is my next booking'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.my_gift_cards',
    aliases: ['my_gift_cards'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the gift cards belonging to the requesting customer.',
    variables: {},
    examples: ['what gift cards do I have', 'show my gift cards'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.my_profile',
    aliases: ['my_profile'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Show the profile details of the requesting customer.',
    variables: {},
    examples: ['show my profile', 'what details do you have for me'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.my_subscriptions',
    aliases: ['my_subscriptions'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'List the subscriptions belonging to the requesting customer.',
    variables: {},
    examples: ['what am I subscribed to', 'show my memberships'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.subscription_usage',
    aliases: ['subscription_usage'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description:
      'Report how much of a subscription allowance the customer has used.',
    // §190 (C2/T0) — one subscription; the customer comes from the session.
    variables: {
      subscriptionId: {
        type: 'string',
        description: 'Subscription whose usage is summarized.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how many visits do I have left', 'my subscription usage'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.subscription_usage_history',
    aliases: ['subscription_usage_history'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T0',
    description: 'Report subscription usage across customers over time.',
    // §190 (C2/T0) — the staff-side lookup shape: the handler dereferences nothing
    // itself and passes `params` to `resolveCustomer`, which reads `customerId`
    // then `customerName`. Not to be confused with the `my_*` commands on the same
    // service, which take the customer from the session instead. It also takes the
    // subscription, by id or plan name.
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to look up.',
        required: false,
        resolver: 'customer',
      },
      customerId: {
        type: 'string',
        description: 'Customer id — tried first by `resolveCustomer`.',
        required: false,
        resolver: 'customer',
      },
      subscriptionId: {
        type: 'string',
        description: 'Subscription whose usage history is listed.',
        required: false,
        resolver: 'none',
      },
      planName: {
        type: 'string',
        description: 'Plan name, when no subscription id is given.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['how are subscriptions being used', 'subscription usage report'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.track_physical_gift_card_order',
    aliases: ['track_physical_gift_card_order'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T0',
    description: 'Report the delivery status of a physical gift card order.',
    // §190 (C2/T0) — as `explain_gift_card_order`, for the shipping view.
    variables: {
      giftCardId: {
        type: 'string',
        description: 'Physical gift card order being tracked.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['where is my physical gift card', 'track my gift card delivery'],
    confirm: 'never',
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.cancel_subscription_admin',
    aliases: ['cancel_subscription_admin'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Cancel a subscription on the customer behalf.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer whose subscription to cancel.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: ['cancel Gevorg membership', 'end this customer subscription'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Cancelling stops billing and notifies the customer; resubscribing is a new agreement, not an undo.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.claim_gift_card_balance',
    aliases: ['claim_gift_card_balance'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Claim a gift card balance onto the customer account.',
    variables: {
      // `parseClaimGiftCardBalanceFromPrompt` prefers a supplied code over the
      // scenario match and the prompt extraction, in that order — so this is a
      // real input even though the handler body only touches `_prompt`. Same
      // shape as `booking.book_with_gift_card`.
      giftCardCode: {
        type: 'string',
        description:
          'Gift card to claim. Upper-cased; falls back to a code found in the message.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['claim this gift card', 'add the gift card to my account'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The data has left the system. An export cannot be recalled once delivered.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.delete_data',
    aliases: ['delete_customer_data'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Erase the personal data held for a customer, on request.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer whose data to erase.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: [
      'delete this customer data',
      'erase Gevorg personal information',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Erasure is the point of the command; the records no longer exist to restore.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.export_data',
    aliases: ['export_customer_data'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description:
      'Export the personal data held for a customer, for a subject access request.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer whose data to export.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: ['export this customer data', 'give me Gevorg data export'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The data has left the system. An export cannot be recalled once delivered.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.extend_subscription',
    aliases: ['extend_subscription'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Extend the subscription period for a customer.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer whose subscription to extend.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: ['give Gevorg another month', 'extend this subscription'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'The customer may already be relying on the extended period; shortening it back is a billing decision.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.merge',
    aliases: ['merge_customers'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Merge two customer records that refer to the same person.',
    variables: {
      // `handleMergeCustomersLogic`. Merging is not symmetric — the primary
      // survives and the secondary is folded into it — so naming which is
      // which is the whole command, not a detail. The ids take precedence over
      // the names, which go through `resolveCustomer`'s fuzzy match.
      primaryCustomerName: {
        type: 'string',
        description: 'The record that survives the merge.',
        required: false,
        resolver: 'customer',
      },
      secondaryCustomerName: {
        type: 'string',
        description: 'The record folded into the primary and retired.',
        required: false,
        resolver: 'customer',
      },
      primaryCustomerId: {
        type: 'string',
        description:
          'The surviving record, by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
      secondaryCustomerId: {
        type: 'string',
        description:
          'The retired record, by id. Takes precedence over the name.',
        required: false,
        resolver: 'customer',
      },
    },
    examples: [
      'merge these two customers',
      'combine the duplicate Gevorg records',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'A merge folds two histories into one and does not record the seam, so they cannot be separated again.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.privacy_delete',
    aliases: ['privacy_delete'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Erase the personal data of the requesting customer.',
    variables: {
      // `enrichPrivacyDeleteConfirmFromPrompt`. The *only* input, and it is
      // the two-step gate itself: the first turn returns a pending state, and
      // erasure runs on the second only once `confirm` is true — set either
      // explicitly or by an affirmative reply to that pending state.
      //
      // Declaring it matters more here than anywhere else in this backlog. An
      // undeclared `confirm` is invisible to a planner, and a planner that
      // cannot see the gate cannot be relied on not to set it. e2e-bug.200 is
      // open on this command's preview step.
      confirm: {
        type: 'boolean',
        description:
          'Second-step confirmation. Erasure only runs when true; the first turn returns a pending state instead.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['delete my data', 'erase my account information'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'Erasure is the point of the command; the records no longer exist to restore.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.privacy_export',
    aliases: ['privacy_export'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Export the personal data of the requesting customer.',
    variables: {},
    examples: ['export my data', 'send me everything you hold about me'],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason:
        'The data has left the system. An export cannot be recalled once delivered.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.request_gift_card_cancel',
    aliases: ['request_gift_card_cancel'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Ask for a gift card order to be cancelled.',
    // §177 (C2/T1) — the customer is injected by the dispatch as
    // `sessionCustomerId`, so it is not user input; the order and the note are.
    variables: {
      giftCardId: {
        type: 'string',
        description:
          'Gift card order to cancel. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
      customerNotes: {
        type: 'string',
        description: 'Why the customer wants it cancelled.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['cancel my gift card order', 'I want to cancel that gift card'],
    confirm: 'always',
    compensation: {
      kind: 'manual',
      reason:
        'Raises a request that a person acts on; withdrawing it needs the same person.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.request_gift_card_modify',
    aliases: ['request_gift_card_modify'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Ask for a change to a gift card order.',
    // §177 (C2/T1) — as `request_gift_card_cancel`, plus the requested change.
    variables: {
      giftCardId: {
        type: 'string',
        description:
          'Gift card order to modify. The handler refuses without it.',
        required: true,
        resolver: 'none',
      },
      modifyPayload: {
        type: 'object',
        description: 'The change being requested.',
        required: false,
        resolver: 'none',
      },
      customerNotes: {
        type: 'string',
        description: 'Free-text note accompanying the request.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'change the amount on my gift card order',
      'modify my gift card',
    ],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'manual',
      reason:
        'Raises a request that a person acts on; withdrawing it needs the same person.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.send_reengagement_message',
    aliases: ['send_reengagement_message'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Message customers who have not visited recently.',
    variables: {
      // `handleSendReengagementMessageLogic`. Outbound and unrecallable, and
      // this is the text that actually gets sent — not a template name.
      message: {
        type: 'string',
        description: 'Body of the message sent to the customer.',
        required: false,
        resolver: 'none',
      },
    },
    examples: [
      'message customers who have not been in for 60 days',
      'send a win back message',
    ],
    confirm: 'always',
    compensation: {
      kind: 'none',
      reason: 'The message has been sent. It cannot be unsent.',
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.tag',
    aliases: ['tag_customer'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T1',
    description: 'Add or remove a tag on a customer record.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to tag.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: ['tag Gevorg as VIP', 'remove the VIP tag from this customer'],
    confirm: 'if-ambiguous',
    compensation: {
      kind: 'inverse',
      command: 'customer.tag',
      captures: ['customerId', 'previousTags'],
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.update',
    aliases: ['update_customer'],
    domain: 'customer',
    surfaces: ['dashboard'],
    tiers: { dashboard: ['manager', 'owner'] },
    risk: 'T2',
    description: 'Change the stored details of a customer.',
    variables: {
      customerName: {
        type: 'string',
        description: 'Customer to change.',
        required: true,
        resolver: 'customer',
      },
    },
    examples: ['change Gevorg phone number', 'update this customer email'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'customer.update',
      captures: ['customerId', 'previousValues'],
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.update_my_locale',
    aliases: ['update_my_locale'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T1',
    description: 'Change the language the requesting customer sees.',
    // §177 (C2/T1) — `preferredLocale` with `locale` as an alias; the customer
    // comes from the session (`missing: ['sessionCustomerId']` is a sign-in
    // prompt, not a field the caller supplies).
    variables: {
      preferredLocale: {
        type: 'string',
        description:
          'Locale the customer wants. `locale` is accepted as an alias.',
        required: true,
        resolver: 'none',
      },
      locale: {
        type: 'string',
        description: 'Alias for `preferredLocale`.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['switch me to Armenian', 'change my language to Russian'],
    confirm: 'never',
    compensation: {
      kind: 'inverse',
      command: 'customer.update_my_locale',
      captures: ['previousLocale'],
    },
    handler: 'AiCustomerCrmService',
  },
  {
    id: 'customer.update_my_profile',
    aliases: ['update_my_profile'],
    domain: 'customer',
    surfaces: ['customer', 'public'],
    tiers: {
      customer: ['client'],
      public: ['client', 'staff', 'manager', 'owner'],
    },
    risk: 'T2',
    description: 'Change the stored details of the requesting customer.',
    variables: {
      // Declarable only after e2e-bug.441: `parseUpdateMyProfileFromPrompt`
      // took the message alone, so a supplied value was computed into
      // `enriched` and then dropped. It now takes `params` and prefers them.
      //
      // `email` is declared but **cannot be saved** — `PATCH me/profile`
      // supports name and phone only, and the handler returns an explicit
      // "not supported" reply for it. Declared anyway so a planner can carry
      // what the customer said and get that answer, rather than silently
      // routing an email change into a name field.
      name: {
        type: 'string',
        description:
          'New display name. Falls back to a name found in the message.',
        required: false,
        resolver: 'none',
      },
      phone: {
        type: 'string',
        description:
          'New phone number. Falls back to a number found in the message.',
        required: false,
        resolver: 'none',
      },
      email: {
        type: 'string',
        description:
          'New email address. Accepted but not yet saveable — the reply explains that email changes are unsupported.',
        required: false,
        resolver: 'none',
      },
    },
    examples: ['update my phone number', 'change my email address'],
    confirm: 'always',
    compensation: {
      kind: 'inverse',
      command: 'customer.update_my_profile',
      captures: ['previousValues'],
    },
    handler: 'AiCustomerCrmService',
  },
] as const;
