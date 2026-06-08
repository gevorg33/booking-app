import { describe, expect, it } from 'vitest';
import { CONSUMER_OFFLINE_MUTATION_SCENARIOS } from './consumer-offline-mutation.fixtures.js';
import { shouldQueueConsumerOfflineMutation } from './consumer-offline-mutation.util.js';

describe('consumer-offline-mutation.util', () => {
  it.each(CONSUMER_OFFLINE_MUTATION_SCENARIOS)(
    '$id queue decision',
    ({ method, url, queued }) => {
      expect(shouldQueueConsumerOfflineMutation(method, url)).toBe(queued);
    },
  );
});
