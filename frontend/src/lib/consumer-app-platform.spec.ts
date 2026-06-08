import { describe, expect, it } from 'vitest';
import { detectConsumerMobilePlatform } from './consumer-app-platform';

describe('consumer-app-platform', () => {
  it('detects iOS user agents', () => {
    expect(
      detectConsumerMobilePlatform({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      }),
    ).toBe('ios');
  });

  it('detects Android user agents', () => {
    expect(
      detectConsumerMobilePlatform({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7)',
      }),
    ).toBe('android');
  });

  it('returns other for desktop agents', () => {
    expect(
      detectConsumerMobilePlatform({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      }),
    ).toBe('other');
  });
});
