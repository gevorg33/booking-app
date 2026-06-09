import { PROVIDER_EXP_3_PROMPT_SCENARIOS } from './ai-provider-exp-3.fixtures.js';
import {
  extractBlockWindowFromPrompt,
  extractMessageTemplateHint,
  extractRetailProductName,
  extractSendMessageChannel,
  isAddRetailToBookingPrompt,
  isBlockMyTimePrompt,
  isProviderExp3Intent,
  isSendClientMessagePrompt,
  PROVIDER_EXP_3_INTENTS,
  rescueProviderExp3Intent,
} from './ai-provider-exp-3.util.js';

describe('ai-provider-exp-3.util (prov-exp-5.3)', () => {
  it('exports provider exp-3 intents', () => {
    expect(PROVIDER_EXP_3_INTENTS).toEqual([
      'add_retail_to_booking',
      'send_client_message',
      'block_my_time',
      'request_time_off',
    ]);
  });

  it.each(PROVIDER_EXP_3_PROMPT_SCENARIOS)(
    'rescues fixture prompt $id to $expectedAction',
    (scenario) => {
      expect(rescueProviderExp3Intent(scenario.prompt, 'unknown')?.action).toBe(
        scenario.expectedAction,
      );
    },
  );

  it('detects retail, message, and block prompts', () => {
    expect(isAddRetailToBookingPrompt('Add shampoo to this booking')).toBe(true);
    expect(isSendClientMessagePrompt('Text Jane running late')).toBe(true);
    expect(isBlockMyTimePrompt('Block my lunch today')).toBe(true);
    expect(isProviderExp3Intent('send_client_message')).toBe(true);
  });

  it('extracts helpers', () => {
    expect(extractSendMessageChannel('WhatsApp Jane', {})).toBe('whatsapp');
    expect(extractMessageTemplateHint('send running late template', {})).toBe(
      'running-late',
    );
    expect(
      extractMessageTemplateHint('send confirming tomorrow message', {}),
    ).toBe('confirming-tomorrow');
    expect(extractBlockWindowFromPrompt('block 12:00 to 13:00')).toEqual({
      startTime: '12:00',
      endTime: '13:00',
    });
    expect(
      extractRetailProductName('Add shampoo to booking', {}),
    ).toBeTruthy();
    expect(extractRetailProductName('add retail', { productName: 'Oil' })).toBe(
      'Oil',
    );
    expect(extractMessageTemplateHint('hello', { templateId: 'custom' })).toBe(
      'custom',
    );
    expect(
      extractMessageTemplateHint('hello', { messageTemplate: 'confirming-tomorrow' }),
    ).toBe('confirming-tomorrow');
    expect(isBlockMyTimePrompt('block Maria schedule')).toBe(false);
    expect(isAddRetailToBookingPrompt('remove retail line')).toBe(false);
    expect(isSendClientMessagePrompt('add staff note for Jane')).toBe(false);
    expect(extractMessageTemplateHint('plain text', {})).toBeNull();
    expect(
      extractMessageTemplateHint('plain', { templateLabel: 'Late notice' }),
    ).toBe('Late notice');
  });

  it('does not override classified exp-3 action', () => {
    expect(
      rescueProviderExp3Intent('add retail', 'add_retail_to_booking'),
    ).toBeNull();
  });

  it('covers retail and message prompt branches', () => {
    expect(
      isAddRetailToBookingPrompt('Add retail product to my appointment'),
    ).toBe(true);
    expect(isAddRetailToBookingPrompt('Show my booking list')).toBe(false);
    expect(extractSendMessageChannel('text client', { channel: 'sms' })).toBe(
      'sms',
    );
    expect(extractBlockWindowFromPrompt('no range')).toEqual({
      startTime: null,
      endTime: null,
    });
    expect(isProviderExp3Intent('unknown')).toBe(false);
  });
});
