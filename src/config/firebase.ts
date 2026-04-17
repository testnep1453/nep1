import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

// Güvenli env erişimi - TDZ hatalarını önlemek için
const getEnvVar = (key: string): string => {
  try {
    const value = import.meta.env[key];
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL')
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

