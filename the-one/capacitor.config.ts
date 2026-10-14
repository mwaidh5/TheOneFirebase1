import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theone.training',
  appName: 'The One Training',
  webDir: 'dist',
  ios: {
    // 'never': the webview fills the whole screen and the CSS pads itself with
    // env(safe-area-inset-*) (index.html sets viewport-fit=cover, and AppShell /
    // BottomNav already use those insets). 'automatic' made iOS inset the
    // webview as well, so the insets were applied twice: the native white
    // background showed through as a strip under the tab bar, and env() read 0,
    // which let the status bar sit on top of the home screen's hero card.
    contentInset: 'never',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#ffffff',
  },
  backgroundColor: '#ffffff',
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
