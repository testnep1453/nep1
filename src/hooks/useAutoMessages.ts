/**
 * Otomatik Mesaj Sistemi - Zamanlanmış Push ve Feed
 * - H-24 (1 Gün Önce): "Yarın operasyon var!"
 * - T-60 Dakika: "Son 1 saat, hazırlanın."
 * - T-1 Dakika: "Fragman başlamak üzere, yerlerinizi alın."
 * - T-0 (Başlangıç): "Ders başladı, operasyon alanına!"
 */

import { useEffect, useRef } from 'react';
import { addMessageToFirebase } from '../services/dbFirebase';
import { getNextLesson } from '../config/lessonSchedule';
import { sendPushNotification } from '../services/fcm';

export const useAutoMessages = (isAdmin: boolean) => {
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Sadece admin hesabında tetiklenir, böylece sadece 1 kez atılır.
    if (!isAdmin) return;

    const checkAndSendMessages = async () => {
      const lesson = getNextLesson();
      if (!lesson) return;
      
      const now = Date.now();
      const t0 = lesson.startTime;
      const diffMin = Math.round((t0 - now) / 60000); // Kalan dakika

      const sendIfTime = async (keySuffix: string, activeCondition: boolean, title: string, body: string) => {
        if (activeCondition) {
          const sentKey = `autoMsg_${keySuffix}_${lesson.date}`;
          if (!localStorage.getItem(sentKey)) {
            // Sisteme yaz
            await addMessageToFirebase(`⚠️ ${title.toUpperCase()}: ${body}`);
            // Push at
            await sendPushNotification(title, body);
            // Birden çok kez atmamak için kaydet
            localStorage.setItem(sentKey, '1');
          }
        }
      };

      // - H-24: "Yarın operasyon var!"
      await sendIfTime('H24', diffMin <= 1440 && diffMin >= 1435, 'Operasyon Uyarısı', 'Yarın operasyon var!');
      
      // - T-60: "Son 1 saat, hazırlanın."
      await sendIfTime('T60', diffMin <= 60 && diffMin >= 58, 'Operasyon Uyarısı', 'Son 1 saat, hazırlanın.');
      
      // - T-1: "Fragman başlamak üzere, yerlerinizi alın."
      await sendIfTime('T1', diffMin <= 1 && diffMin >= 0, 'Fragman', 'Fragman başlamak üzere, yerlerinizi alın.');
      
      // - T-0: "Ders başladı, operasyon alanına!"
      await sendIfTime('T0', diffMin < 0 && diffMin >= -2, 'Ders Başladı', 'Ders başladı, operasyon alanına!');
    };

    checkAndSendMessages();
    checkInterval.current = setInterval(checkAndSendMessages, 30000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [isAdmin]);
};

