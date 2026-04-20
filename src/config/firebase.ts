import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';

// KESİN ÇÖZÜM: Vite build/environment variable sorunlarını baypas etmek için Firebase konfigürasyonu sabitlendi.
const firebaseConfig = {
  apiKey: "AIzaSyAr3M6KK_5ydX4iZRhfbuDfrcU0Y99n2Mg",
  authDomain: "neptest-41372.firebaseapp.com",
  projectId: "neptest-41372",
  storageBucket: "neptest-41372.firebasestorage.app",
  messagingSenderId: "271454077661",
  appId: "1:271454077661:web:7413795fc8e5b765df5134",
  databaseURL: "https://neptest-41372-default-rtdb.firebaseio.com/"
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

