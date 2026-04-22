import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../config/firebase';

/**
 * Online ajan sayacı — sadece OKUMA yapar.
 * Firebase RTDB kuralları anonim write'a kapalı olduğundan
 * presence yazma desteği kaldırıldı; yalnızca /presence düğümünü izler.
 */
export const usePresence = (_studentId: string | null) => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const presenceCountRef = ref(rtdb, 'presence');
    const unsub = onValue(presenceCountRef, (snapshot) => {
      let count = 0;
      snapshot.forEach(() => { count++; });
      setOnlineCount(count);
    }, () => { /* izin yok — sessiz */ });

    return unsub;
  }, []);

  return onlineCount;
};

