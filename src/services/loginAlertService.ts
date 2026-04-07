/**
 * Login Alert Service
 * 
 * Giriş metadata'sını kaydeder, şüpheli girişleri admin'e bildirir.
 * Aynı hesaba kısa sürede farklı cihaz/IP'den giriş → alert.
 */

import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface LoginMetadata {
  studentId: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timestamp: ReturnType<typeof serverTimestamp>;
  isSuspicious: boolean;
  reason?: string;
}

/**
 * Giriş bilgisini kaydet ve şüpheli giriş analizi yap
 */
export const recordLoginAndCheckSuspicious = async (studentId: string): Promise<void> => {
  if (!auth.currentUser) return;

  const currentUA = navigator.userAgent;
  const currentPlatform = navigator.platform;

  try {
    // Son 24 saatteki girişleri kontrol et
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const loginsRef = collection(db, 'loginAlerts');
    const q = query(
      loginsRef,
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const snap = await getDocs(q);
    let isSuspicious = false;
    let reason = '';

    if (!snap.empty) {
      const recentLogins = snap.docs
        .map(d => d.data())
        .filter(d => {
          const ts = d.timestamp?.toMillis ? d.timestamp.toMillis() : d.timestamp;
          return ts > oneDayAgo;
        });

      // Farklı user-agent kontrolü (farklı cihaz/tarayıcı)
      const differentDevice = recentLogins.find(login => 
        login.userAgent !== currentUA || login.platform !== currentPlatform
      );

      if (differentDevice) {
        // 10 dakika içinde farklı cihazdan giriş → şüpheli
        const lastTs = differentDevice.timestamp?.toMillis 
          ? differentDevice.timestamp.toMillis() 
          : differentDevice.timestamp;
        if (Date.now() - lastTs < 10 * 60 * 1000) {
          isSuspicious = true;
          reason = `Aynı hesaba 10dk içinde farklı cihazdan giriş: ${currentUA.slice(0, 50)}`;
        }
      }
    }

    // Giriş kaydını Firestore'a yaz
    const metadata: LoginMetadata = {
      studentId,
      userAgent: currentUA,
      platform: currentPlatform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: serverTimestamp(),
      isSuspicious,
      reason: reason || undefined,
    };

    await addDoc(loginsRef, metadata);
  } catch {
    // Firestore erişimi yoksa sessiz geç
  }
};

/**
 * Admin paneli: Şüpheli girişleri getir
 */
export const getSuspiciousLogins = async (limitCount: number = 20) => {
  try {
    const q = query(
      collection(db, 'loginAlerts'),
      where('isSuspicious', '==', true),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};
