import { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../config/firebase';

export const usePresence = (studentId: string | null) => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (!studentId) return;

    const presenceRef = ref(rtdb, `presence/${studentId}`);
    const connectedRef = ref(rtdb, '.info/connected');

    // Presence yazma: bağlantı kurulduğunda dene, hata varsa sessizce geç
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;
      // Firebase Auth kullanılmıyor (sayısal ID sistemi) → RTDB kuralları
      // anonim write'a izin vermiyorsa sadece read yap, hata basma
      set(presenceRef, true).catch(() => { /* RTDB rules deny anonymous write — ok */ });
      onDisconnect(presenceRef).remove().catch(() => {});
    });

    // Online sayacı: sadece okuma — her zaman çalışır
    const presenceCountRef = ref(rtdb, 'presence');
    const unsubscribeCount = onValue(presenceCountRef, (snapshot) => {
      let count = 0;
      snapshot.forEach(() => { count++; });
      setOnlineCount(count);
    });

    return () => {
      unsubscribeConnected();
      unsubscribeCount();
      // Temizlik: kendi presence'ını sil (hata olursa sessiz)
      set(presenceRef, null).catch(() => {});
    };
  }, [studentId]);

  return onlineCount;
};
