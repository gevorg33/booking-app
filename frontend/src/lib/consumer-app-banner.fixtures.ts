import type { ConsumerMobilePlatform } from './consumer-app-platform';

export const CONSUMER_APP_BANNER_SERVICE_ID_SCENARIOS = [
  { id: 'service-id-query', params: { serviceId: 'svc-1' }, expected: 'svc-1' },
  { id: 'services-query-first', params: { services: 'svc-a,svc-b' }, expected: 'svc-a' },
  { id: 'empty', params: {}, expected: undefined },
  { id: 'blank-service-id', params: { serviceId: '  ' }, expected: undefined },
] as const;

export const CONSUMER_APP_BANNER_STORE_SCENARIOS: Array<{
  id: string;
  platform: ConsumerMobilePlatform;
  iosUrl: string;
  androidUrl: string;
  showIos: boolean;
  showAndroid: boolean;
}> = [
  {
    id: 'ios-mobile',
    platform: 'ios',
    iosUrl: 'https://apps.apple.com/app/id1',
    androidUrl: '',
    showIos: true,
    showAndroid: false,
  },
  {
    id: 'android-mobile',
    platform: 'android',
    iosUrl: '',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.app',
    showIos: false,
    showAndroid: true,
  },
  {
    id: 'desktop-both-stores',
    platform: 'other',
    iosUrl: 'https://apps.apple.com/app/id1',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.app',
    showIos: true,
    showAndroid: true,
  },
];
