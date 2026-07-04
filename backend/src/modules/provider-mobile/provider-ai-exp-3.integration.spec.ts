import { rescueProviderAiIntent } from './provider-ai-intent.util.js';
import { rescueProviderExp3Intent } from '../ai/ai-provider-exp-3.util.js';

describe('Provider AI exp-3 intents (prov-exp-5.3)', () => {
  it('maps block my lunch heuristic to block_my_time', () => {
    expect(rescueProviderAiIntent('Block my lunch today', 'unknown')).toBe(
      'block_my_time',
    );
  });

  it.each([
    ['Add shampoo to this booking', 'add_retail_to_booking'],
    ['Text Jane running late', 'send_client_message'],
    ['Block my break 3-3:15', 'block_my_time'],
    ['Request next Friday off', 'request_time_off'],
    [
      'Set retail cart to 2 shampoo and 1 conditioner',
      'set_retail_sales_lines',
    ],
  ])('rescues "%s" → %s', (prompt, expected) => {
    expect(rescueProviderExp3Intent(prompt, 'unknown')?.action).toBe(expected);
  });

  it('does not classify generic block schedule as block_my_time', () => {
    expect(
      rescueProviderExp3Intent('Block Maria lunch tomorrow', 'unknown'),
    ).toBeNull();
  });
});
