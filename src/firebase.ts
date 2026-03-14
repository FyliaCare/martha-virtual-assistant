// ============================================================
// Firebase — Initialization & Firestore instance
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if config is present (allows app to work without Firebase)
const isConfigured = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your-api-key-here';

const app = isConfigured ? initializeApp(firebaseConfig) : null;
export const firestore = app ? getFirestore(app) : null;

// Enable offline persistence so Firestore caches data locally
if (firestore) {
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('[Firebase] Persistence failed — multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('[Firebase] Persistence not supported in this browser');
    }
  });
}

export { isConfigured as firebaseEnabled };
