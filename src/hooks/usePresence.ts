import { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../config/firebase';

export const usePresence = (studentId: string | null) => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!studentId) return;

    const presenceRef = ref(rtdb, `presence/${studentId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, true);
        onDisconnect(presenceRef).remove();
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
