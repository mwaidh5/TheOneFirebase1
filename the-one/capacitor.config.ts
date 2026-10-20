import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.theone.training',
  appName: 'The One Training',
  webDir: 'dist',
  server: {
    // The app loads the live site, so every merge to main (which deploys
    // Firebase Hosting) updates the app instantly — no new build needed for
    // web changes. Only native changes (plugins, Info.plist, Swift) need one.
    url: 'https://theonefirebase1-42441499-db7a8.web.app/',
    cleartext: false,
    // Bundled page shown when the site can't be reached (no signal).
    errorPath: 'offline.html',
    // Hosts that must open inside the app's webview rather than Safari.
    allowNavigation: [
      'theonefirebase1-42441499-db7a8.web.app',
      'theonefirebase1-42441499-db7a8.firebaseapp.com',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
    ],
  },
  // Lets the live site tell which app build it is running in, so a future
  // native feature can fall back on builds that don't have it yet.
  appendUserAgent: 'TheOneApp/1',
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
