import { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb, auth } from '../config/firebase';

export const usePresence = (studentId: string | null) => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!studentId) return;

    const presenceRef = ref(rtdb, `presence/${studentId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    // Auth hazır olana kadar yazma denemesi yapma
    const trySetPresence = () => {
      if (!auth.currentUser) {
        // Auth henüz hazır değil — 1sn sonra tekrar dene
        const timer = setTimeout(trySetPresence, 1000);
        return () => clearTimeout(timer);
      }
      set(presenceRef, true).catch(() => {});
      onDisconnect(presenceRef).remove().catch(() => {});
      return undefined;
    };

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        trySetPresence();
      }
    });

    const presenceCountRef = ref(rtdb, 'presence');
    const unsubscribeCount = onValue(presenceCountRef, (snapshot) => {
      let count = 0;
      snapshot.forEach(() => { count++; });
      setOnlineCount(count);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeCount();
    };
  }, [studentId]);

  return onlineCount;
};
