import type { CapacitorConfig } from '@capacitor/cli';

/** Customer booking app — separate from provider-app. */
const config: CapacitorConfig = {
  appId: 'com.optischedule.consumer',
  appName: 'OptiSchedule Book',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#f5f5f7',
      showSpinner: false,
    },
  },
};

export default config;
