import type { CapacitorConfig } from '@capacitor/cli';

/** Standalone provider app — bundled static build, no Next.js / dashboard. */
const config: CapacitorConfig = {
  appId: 'com.optischedule.provider',
  appName: 'OptiSchedule Provider',
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
      backgroundColor: '#030712',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
