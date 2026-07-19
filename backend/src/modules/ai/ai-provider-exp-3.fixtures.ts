/** prov-exp-5.3 — provider mobile retail, messaging, block time, time-off AI. */

export const PROVIDER_EXP_3_CLASSIFIER_RULES = `- add_retail_to_booking: MUTATE — add one retail product to own active booking (bookingId or customerName + session). Triggers: add shampoo to this booking, sell product on my appointment. NOT add_retail_sale_to_booking (dashboard admin), NOT set_retail_sales_lines (bulk cart replace).
- set_retail_sales_lines: MUTATE — bulk-replace the entire retail cart on a booking with one or more product+quantity lines in one call (lines[]: {productName or productId, quantity}). Requires bookingId or customerName plus lines. Triggers: set retail cart to 2 shampoo and 1 conditioner, replace the cart with 3 candles, update retail lines to 1 shampoo. NOT add_retail_to_booking (adds one product without replacing the rest of the cart).
- remove_retail_from_booking: MUTATE — remove one retail product line from own active booking (bookingId or customerName + session). Triggers: remove the serum from cart, undo product add, delete shampoo from this booking. NOT add_retail_to_booking (adds a line), NOT set_retail_sales_lines (bulk cart replace), NOT explain_retail_cart (read-only).
- send_client_message: READ — open SMS/WhatsApp with canned template for booking client. Requires bookingId and/or customerName; optional templateId/template label, channel=sms|whatsapp. Triggers: text client running late, send confirming tomorrow message. NOT add_client_note (internal staff note).
- explain_message_templates: READ — list the business-configured canned SMS/WhatsApp templates available to send (label + resolved preview for this booking). Triggers: what templates can I send, show canned messages, what message templates are there. Editing templates stays dashboard-only. NOT send_client_message (actually opens the SMS/WhatsApp link).
- notify_client_ready: MUTATE — open SMS/WhatsApp telling the client their chair/turn is ready now (uses a configured "ready"/"your turn" template if one exists, else a default message). Requires bookingId and/or customerName. Triggers: tell her chair is ready, send your turn message, let him know we're ready. NOT send_client_message (generic canned template, not the ready-specific default).
- block_my_time: MUTATE — block lunch/break on own calendar (instant, not approval). Requires date + start/end times. Triggers: block my lunch 12-1, block my break. NOT block_schedule (manager/team), NOT request_time_off (needs approval).
- extend_my_block: MUTATE — push the end time of your own most-recent one-off block later, by a duration (extendMinutes) or to a specific time (newEndTime). Triggers: extend lunch 30 minutes, push break to 2:30, make my lunch longer, add 20 minutes to my break. NOT block_my_time (creates a new block).
- request_time_off: MUTATE — submit unavailable date range for manager approval. Triggers: request Friday off, PTO next week. NOT block_my_time (instant block).`;

export const PROVIDER_EXP_3_PROMPT_SCENARIOS = [
  {
    id: 'add-retail-product-en',
    prompt: 'Add shampoo to this booking',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'add-retail-my-appointment-en',
    prompt: 'Add retail product to my appointment for Jane',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'add-retail-named-en',
    prompt: 'Sell conditioner on my booking',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'add-retail-attach-en',
    prompt: 'Attach a retail product to this appointment',
    surface: 'provider' as const,
    expectedAction: 'add_retail_to_booking',
  },
  {
    id: 'send-message-running-late-en',
    prompt: 'Text Jane that I am running late',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-template-en',
    prompt: 'Send confirming tomorrow message to my client',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-whatsapp-en',
    prompt: 'WhatsApp the client running late template',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'send-message-sms-en',
    prompt: 'SMS customer Sam the running late snippet',
    surface: 'provider' as const,
    expectedAction: 'send_client_message',
  },
  {
    id: 'block-my-lunch-en',
    prompt: 'Block my lunch 12:00 to 13:00 today',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'block-my-break-en',
    prompt: 'Block my break tomorrow 3-3:15pm',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'block-my-time-en',
    prompt: 'Block my time 14:00-14:30 on Friday',
    surface: 'provider' as const,
    expectedAction: 'block_my_time',
  },
  {
    id: 'request-time-off-friday-en',
    prompt: 'Request next Friday off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'request-pto-en',
    prompt: 'I need next week off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'request-time-off-plain-en',
    prompt: 'Request time off next week',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'request-time-off-take-monday-en',
    prompt: 'Take Monday off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'request-time-off-tomorrow-en',
    prompt: 'I need tomorrow off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'set-retail-lines-two-en',
    prompt: 'Set retail cart to 2 shampoo and 1 conditioner',
    surface: 'provider' as const,
    expectedAction: 'set_retail_sales_lines',
  },
  {
    id: 'set-retail-lines-replace-en',
    prompt: 'Replace the retail cart with 3 candles',
    surface: 'provider' as const,
    expectedAction: 'set_retail_sales_lines',
  },
  {
    id: 'set-retail-lines-update-en',
    prompt: 'Update retail lines to 1 shampoo',
    surface: 'provider' as const,
    expectedAction: 'set_retail_sales_lines',
  },
  {
    id: 'remove-retail-serum-en',
    prompt: 'Remove the serum from cart',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-undo-en',
    prompt: 'Undo product add',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-shampoo-booking-en',
    prompt: 'Remove shampoo from this booking',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-conditioner-cart-en',
    prompt: 'Delete conditioner from the retail cart',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-my-booking-en',
    prompt: 'Remove the product from my booking',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-take-off-cart-en',
    prompt: 'Take the olaplex off the cart',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-this-item-en',
    prompt: 'Remove this item from the cart',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-undo-adding-en',
    prompt: 'Undo adding the retail product',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-line-shampoo-en',
    prompt: 'Remove the shampoo line from this booking',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'remove-retail-just-added-en',
    prompt: 'Delete the product line I just added',
    surface: 'provider' as const,
    expectedAction: 'remove_retail_from_booking',
  },
  {
    id: 'explain-templates-what-can-i-send-en',
    prompt: 'What templates can I send?',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-show-canned-en',
    prompt: 'Show canned messages',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-what-are-there-en',
    prompt: 'What message templates are there?',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-list-mine-en',
    prompt: 'List my canned messages',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-which-have-en',
    prompt: 'Which templates do I have?',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-explain-en',
    prompt: 'Explain the message templates',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-what-can-i-use-en',
    prompt: 'What canned messages can I use?',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-show-me-en',
    prompt: 'Show me the templates',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-sms-available-en',
    prompt: 'What SMS templates are available?',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'explain-templates-see-mine-en',
    prompt: 'See my message templates',
    surface: 'provider' as const,
    expectedAction: 'explain_message_templates',
  },
  {
    id: 'notify-ready-chair-en',
    prompt: 'Tell her chair is ready',
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-your-turn-en',
    prompt: "Send 'your turn' message",
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-let-him-know-en',
    prompt: "Let him know we're ready",
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-table-en',
    prompt: 'Notify the client their table is ready',
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-their-turn-en',
    prompt: "Tell them it's their turn",
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-let-her-know-en',
    prompt: "Let her know she's ready",
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-for-her-en',
    prompt: "Tell the client we're ready for her",
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-room-en',
    prompt: 'Notify him the room is ready',
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-send-message-en',
    prompt: 'Send her a ready message',
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'notify-ready-my-client-en',
    prompt: 'Tell my client their chair is ready',
    surface: 'provider' as const,
    expectedAction: 'notify_client_ready',
  },
  {
    id: 'extend-block-lunch-minutes-en',
    prompt: 'Extend lunch 30 minutes',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-push-break-en',
    prompt: 'Push break to 2:30',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-break-minutes-en',
    prompt: 'Extend my break 15 minutes',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-push-lunch-en',
    prompt: 'Push my lunch to 1:30pm',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-make-longer-en',
    prompt: 'Make my lunch longer',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-add-minutes-en',
    prompt: 'Add 20 minutes to my break',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-by-minutes-en',
    prompt: 'Extend the block by 10 minutes',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-push-block-en',
    prompt: 'Push my block to 3pm',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-until-en',
    prompt: 'Extend break until 2:45',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
  {
    id: 'extend-block-add-mins-lunch-en',
    prompt: 'Add 30 mins to my lunch',
    surface: 'provider' as const,
    expectedAction: 'extend_my_block',
  },
] as const;
