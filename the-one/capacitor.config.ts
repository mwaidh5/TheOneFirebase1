import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theone.training',
  appName: 'The One Training',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    FirebaseAuthentication: {
      // We use the native sign-in only to obtain the Google credential, then
      // sign in with the Firebase JS SDK (single source of truth in the web app).
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
