import { afterEach, describe, expect, it, vi } from 'vitest';

const capacitor = {
  isNativePlatform: vi.fn(() => false),
  getPlatform: vi.fn(() => 'web'),
};

vi.mock('@capacitor/core', () => ({
  Capacitor: capacitor,
}));

describe('api-base', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    capacitor.isNativePlatform.mockReturnValue(false);
    capacitor.getPlatform.mockReturnValue('web');
  });

  it('returns trimmed API URL on web', async () => {
    vi.stubEnv('VITE_API_URL', 'http://127.0.0.1:3001/');
    const { getPublicApiBaseUrl } = await import('./api-base.js');
    expect(getPublicApiBaseUrl()).toBe('http://127.0.0.1:3001');
  });

  it('defaults to local API when env is unset', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const { getPublicApiBaseUrl } = await import('./api-base.js');
    expect(getPublicApiBaseUrl()).toBe('http://127.0.0.1:3001');
  });

  it('maps localhost to 10.0.2.2 on Android emulator', async () => {
    vi.stubEnv('VITE_API_URL', 'http://127.0.0.1:3001');
    capacitor.isNativePlatform.mockReturnValue(true);
    capacitor.getPlatform.mockReturnValue('android');
    const { getPublicApiBaseUrl } = await import('./api-base.js');
    expect(getPublicApiBaseUrl()).toBe('http://10.0.2.2:3001');
  });

  it('keeps remote API URLs unchanged on Android', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    capacitor.isNativePlatform.mockReturnValue(true);
    capacitor.getPlatform.mockReturnValue('android');
    const { getPublicApiBaseUrl } = await import('./api-base.js');
    expect(getPublicApiBaseUrl()).toBe('https://api.example.com');
  });

  it('does not rewrite localhost on iOS native', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    capacitor.isNativePlatform.mockReturnValue(true);
    capacitor.getPlatform.mockReturnValue('ios');
    const { getPublicApiBaseUrl } = await import('./api-base.js');
    expect(getPublicApiBaseUrl()).toBe('http://localhost:3001');
  });
});
