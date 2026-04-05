
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getMessaging, isSupported } from "firebase/messaging";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCmKs7RNGNKvtVG-tT7n7QCf1ZpbFXBxD8",
  authDomain: "theonefirebase1-42441499-db7a8.firebaseapp.com",
  projectId: "theonefirebase1-42441499-db7a8",
  storageBucket: "theonefirebase1-42441499-db7a8.firebasestorage.app",
  messagingSenderId: "531868004786",
  appId: "1:531868004786:web:99f2f7295d11846fb834ab"
};

const app = initializeApp(firebaseConfig);

// ─── Core Services ────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
export const storage = getStorage(app);

// ─── Firebase AI Logic (Gemini) ───────────────────────────────────────────────
// Initialized after Firebase AI Logic is enabled in the Firebase Console.
// See: Firebase Console → AI Logic → Get Started
const ai = getAI(app, { backend: new GoogleAIBackend() });
export const aiModel = getGenerativeModel(ai, {
  model: "gemini-2.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,   // Lower = more consistent structured output
    maxOutputTokens: 8192,
  },
});

// ─── App Check (Bot Protection) ───────────────────────────────────────────────
// STEP: Paste your reCAPTCHA v3 Site Key below after completing console setup.
// Firebase Console → App Check → your web app → reCAPTCHA v3
// Google reCAPTCHA: https://www.google.com/recaptcha → register site → copy Site Key
const RECAPTCHA_SITE_KEY = "6Ldnrp4sAAAAAP4xdFO8Iy8U_4aC_IpZ2fTCT9_P";

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

// ─── Cloud Messaging (Push Notifications) ─────────────────────────────────────
// FCM is only supported in secure contexts (HTTPS) and requires the service worker.
// It is lazily initialised to avoid errors in unsupported browsers.
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

// STEP: Paste your VAPID key below after generating it in the Firebase Console.
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair
export const VAPID_KEY = "BDJJzc7YoOT2Fuouv22IkE6jfSjlR5dOtiwl2NGPVWMMczTr9Z2SLgckGW6OMuluN6K0NXqDGviMHCJ5vekaBPO"; // ← Paste your VAPID key here
