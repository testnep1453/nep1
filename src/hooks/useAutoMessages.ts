/**
 * Otomatik Mesaj Sistemi - Zamanlanmış Push ve Feed
 * - H-24 (1 Gün Önce): "Yarın operasyon var!"
 * - T-60 Dakika: "Son 1 saat, hazırlanın."
 * - T-1 Dakika: "Fragman başlamak üzere, yerlerinizi alın."
 * - T-0 (Başlangıç): "Ders başladı, operasyon alanına!"
 *
 * Gönderim durumu artık Supabase'de tutulur (localStorage değil).
 * Bu sayede farklı cihazlarda admin girişi yapılsa bile mesaj
 * bir kez gönderilir.
 */

import { useEffect, useRef } from 'react';
import { addMessageToFirebase, getSettingStore, saveSettingStore } from '../services/dbFirebase';
import { getNextLesson } from '../config/lessonSchedule';
import { sendPushNotification } from '../services/fcm';

/** Supabase'de saklanan gönderilmiş mesaj ID'leri */
const SENT_MSGS_STORE_KEY = 'auto_messages_sent';

const getSentMessages = async (): Promise<Record<string, true>> => {
  return getSettingStore<Record<string, true>>(SENT_MSGS_STORE_KEY, {});
};

const markMessageSent = async (key: string): Promise<void> => {
  const sent = await getSentMessages();
  await saveSettingStore(SENT_MSGS_STORE_KEY, { ...sent, [key]: true });
};

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

      const sent = await getSentMessages();

      const sendIfTime = async (
        keySuffix: string,
        activeCondition: boolean,
        title: string,
        body: string,
      ) => {
        if (!activeCondition) return;
        const sentKey = `autoMsg_${keySuffix}_${lesson.date}`;
        if (sent[sentKey]) return; // Zaten gönderildi

        // Sisteme yaz
        await addMessageToFirebase(`⚠️ ${title.toUpperCase()}: ${body}`);
        // Push at
        await sendPushNotification(title, body);
        // Supabase'e kaydet (artık localStorage değil)
        await markMessageSent(sentKey);
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
