/**
 * Otomatik Mesaj Sistemi
 * - Çarşamba 19:00 → "Yarın ders var!" hatırlatması
 * - Perşembe 19:00 → "Ders başladı!" bildirimi
 * Mesajlar Firestore messages koleksiyonuna otomatik yazılır
 */

import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { addMessageToFirebase } from '../services/dbFirebase';
import { isReminderTime, isLessonStartTime } from '../config/lessonSchedule';

const REMINDER_MESSAGES = [
  '📢 Ajanlar dikkat! Yarın saat 19:00\'da haftalık operasyon başlıyor. Hazırlıklarınızı tamamlayın!',
  '⚡ Hatırlatma: Yarın akşam 19:00\'da NEP dersi var. Tüm ajanların hazır olması bekleniyor!',
  '🔔 Yarınki operasyon için geri sayım başladı! Perşembe 19:00\'da buluşuyoruz.',
];

const LESSON_START_MESSAGES = [
  '🚀 DERS BAŞLADI! Tüm ajanlar operasyon alanına geçiş yapıyor...',
  '⏰ Operasyon saati geldi! Ders şu an aktif — Zoom\'a otomatik yönlendirme yapılıyor.',
  '🎯 NEP Haftalık Ders başladı! Ajanlar, görev alanına hoş geldiniz!',
];

export const useAutoMessages = (isAdmin: boolean) => {
  const reminderSentRef = useRef(false);
  const lessonStartSentRef = useRef(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Sadece admin girişinde kontrol et (duplikasyon önlemi)
    // Aslında herkes tetikleyebilir ama merkezi kontrol admin'de
    if (!isAdmin) return;

    const checkAndSendMessages = async () => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);

      // Çarşamba 19:00 hatırlatması
      if (isReminderTime() && !reminderSentRef.current) {
        const sentKey = `autoMsg_reminder_${today}`;
        const alreadySent = await checkMessageSent(sentKey);
        
        if (!alreadySent) {
          const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
          await addMessageToFirebase(msg);
          await markMessageSent(sentKey);
          reminderSentRef.current = true;
        }
      }

      // Perşembe 19:00 ders başlangıcı
      if (isLessonStartTime() && !lessonStartSentRef.current) {
        const sentKey = `autoMsg_start_${today}`;
        const alreadySent = await checkMessageSent(sentKey);
        
        if (!alreadySent) {
          const msg = LESSON_START_MESSAGES[Math.floor(Math.random() * LESSON_START_MESSAGES.length)];
          await addMessageToFirebase(msg);
          await markMessageSent(sentKey);
          lessonStartSentRef.current = true;
        }
      }

      // Gün değişince flag'leri sıfırla
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        reminderSentRef.current = false;
        lessonStartSentRef.current = false;
      }
    };

    // Her 30 saniyede bir kontrol
    checkAndSendMessages();
    checkInterval.current = setInterval(checkAndSendMessages, 30000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [isAdmin]);
};

// Mesajın zaten gönderilip gönderilmediğini kontrol et
const checkMessageSent = async (key: string): Promise<boolean> => {
  try {
    const ref = doc(db, 'system', 'autoMessages');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return !!snap.data()[key];
    }
    return false;
  } catch {
    return false;
  }
};

// Mesaj gönderildi olarak işaretle
const markMessageSent = async (key: string): Promise<void> => {
  try {
    const ref = doc(db, 'system', 'autoMessages');
    await setDoc(ref, { [key]: true }, { merge: true });
  } catch (error) {
    console.error('Auto message flag kayıt hatası:', error);
  }
};
