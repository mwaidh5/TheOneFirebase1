
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCmKs7RNGNKvtVG-tT7n7QCf1ZpbFXBxD8",
  authDomain: "theonefirebase1-42441499-db7a8.firebaseapp.com",
  projectId: "theonefirebase1-42441499-db7a8",
  storageBucket: "theonefirebase1-42441499-db7a8.firebasestorage.app",
  messagingSenderId: "531868004786",
  appId: "1:531868004786:web:99f2f7295d11846fb834ab"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
export const storage = getStorage(app);
