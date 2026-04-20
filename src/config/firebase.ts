import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

// Güvenli env erişimi - Vite build ile uyumlu statik property'ler
const firebaseConfig = {
  apiKey: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_API_KEY) || '',
  authDomain: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || '',
  projectId: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_PROJECT_ID) || '',
  storageBucket: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || '',
  messagingSenderId: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '',
  appId: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_APP_ID) || '',
  databaseURL: (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_FIREBASE_DATABASE_URL) || ''
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);

let messaging: ReturnType<typeof getMessaging> | null = null;

export const getMessagingInstance = async () => {
  if (messaging) return messaging;
  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
    return messaging;
  }
  return null;
};

