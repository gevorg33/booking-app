import { CONSUMER_UNIVERSAL_LINK_PATHS } from './consumer-app-link.util';

export { CONSUMER_UNIVERSAL_LINK_PATHS };

export const UNIVERSAL_LINK_PATH_MATCH_SCENARIOS = [
  { id: 'book-slug', pathname: '/book/glow-nails', matches: true },
  { id: 'book-nested', pathname: '/book/glow-nails/checkout', matches: true },
  { id: 's-slug', pathname: '/s/glow-nails/book/svc-1', matches: true },
  { id: 'dashboard', pathname: '/dashboard', matches: false },
  { id: 'root', pathname: '/', matches: false },
] as const;

export const APP_LINK_CONFIG_SCENARIOS = [
  {
    id: 'production-ready',
    config: {
      appleTeamId: 'ABCDE12345',
      iosBundleId: 'com.optischedule.consumer',
      androidPackageName: 'com.optischedule.consumer',
      androidSha256Fingerprints: [
        '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:10:28:F5:69:FF:8D:72:9F:FF:3F:52:DB:E5',
      ],
    },
    valid: true,
  },
  {
    id: 'placeholder-team',
    config: {
      appleTeamId: 'TEAMID',
      iosBundleId: 'com.optischedule.consumer',
      androidPackageName: 'com.optischedule.consumer',
      androidSha256Fingerprints: ['AA:BB:CC'],
    },
    valid: false,
  },
  {
    id: 'placeholder-fingerprint',
    config: {
      appleTeamId: 'ABCDE12345',
      iosBundleId: 'com.optischedule.consumer',
      androidPackageName: 'com.optischedule.consumer',
      androidSha256Fingerprints: ['REPLACE_WITH_RELEASE_OR_DEBUG_SHA256_FINGERPRINT'],
    },
    valid: false,
  },
] as const;

export const WEB_FALLBACK_SCENARIOS = [
  {
    id: 'book-url',
    input: 'https://app.example.com/book/salon-a?serviceId=svc-1',
    expected: 'https://app.example.com/book/salon-a?serviceId=svc-1',
  },
  {
    id: 'custom-scheme-falls-back-to-web',
    input: 'optischedule://book/salon-a?serviceId=svc-1',
    webOrigin: 'https://app.example.com',
    expected: 'https://app.example.com/book/salon-a?serviceId=svc-1',
  },
  {
    id: 'relative-book-path',
    input: '/book/salon-a',
    webOrigin: 'https://app.example.com',
    expected: 'https://app.example.com/book/salon-a',
  },
  {
    id: 'non-app-link-https',
    input: 'https://app.example.com/dashboard',
    expected: null,
  },
  {
    id: 'empty-input',
    input: '   ',
    expected: null,
  },
] as const;
