import { describe, expect, it } from 'vitest';
import { buildConsumerAssistantExamples } from './consumer-assistant-examples.util.js';
import { CONSUMER_COPY_EN } from './consumer-copy-catalog.js';

describe('consumer-assistant-examples.util', () => {
  it('interpolates tenant service names into action examples', () => {
    const examples = buildConsumerAssistantExamples(CONSUMER_COPY_EN, false, {
      services: [{ id: 's1', name: 'Gel manicure', categoryName: 'Nails' }],
      providers: [{ id: 'p1', name: 'Lena' }],
    });
    expect(examples[0]).toContain('Gel manicure');
    expect(examples[2]).toContain('Gel manicure');
  });
});
