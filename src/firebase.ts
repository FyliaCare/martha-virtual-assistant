// ============================================================
// Firebase — Initialization & Firestore instance
// ============================================================

import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDNYb9d1QFl-q-GVcX-cp-wYXqD4F7gcR0',
  authDomain: 'marthavirtualassist.firebaseapp.com',
  projectId: 'marthavirtualassist',
  storageBucket: 'marthavirtualassist.firebasestorage.app',
  messagingSenderId: '189641972795',
  appId: '1:189641972795:web:6daecae63d628669a7101e',
};

const app = initializeApp(firebaseConfig);

// Use persistent local cache with multi-tab support
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const firebaseEnabled = true;
