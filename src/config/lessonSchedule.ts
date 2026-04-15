/**
 * NEP Ders Programı Konfigürasyonu
 * 
 * Ana Kural: Her hafta Perşembe saat 19.00–20.00 arası ders yapılır.
 * Bugünden itibaren sonraki Perşembe günleri otomatik hesaplanır.
 */

import { Lesson } from '../types/student';

/**
 * NOT: Zoom linki artık buraya yazılmıyor.
 * Lütfen `systemSettingsService.getZoomLink()` kullanın.
 * Admin paneli üzerinden Supabase `settings` tablosuna kaydedilir.
 */

// Ders saatleri (Türkiye saati - UTC+3)
const LESSON_HOUR_START = 19; // 19.00
const LESSON_HOUR_END = 20;   // 20.00
const LESSON_DAY = 4;         // Perşembe (0=Pazar, 4=Perşembe)

// Sabit Ders Takvimi (Modül 2.2 / Emir 8)
export const FIXED_LESSON_SCHEDULE: { lessonNo: number; date: string }[] = [
  { lessonNo: 8,  date: '2026-04-09' },
  { lessonNo: 9,  date: '2026-04-16' },
  { lessonNo: 10, date: '2026-04-23' },
  { lessonNo: 11, date: '2026-04-30' },
  { lessonNo: 12, date: '2026-05-07' },
  { lessonNo: 13, date: '2026-05-14' },
  { lessonNo: 14, date: '2026-05-21' },
  { lessonNo: 15, date: '2026-06-04' },
];

/**
 * Bugünden itibaren en yakın perşembe gününü hesapla
 */
export const getNextThursday = (fromDate: Date = new Date()): Date => {
  const d = new Date(fromDate);
  const day = d.getDay();
  // Perşembe'ye kaç gün var?
  let daysUntilThursday = (LESSON_DAY - day + 7) % 7;
  
  // Eğer bugün perşembe ise
  if (daysUntilThursday === 0) {
    const now = new Date();
    // Ders saati geçmediyse bugünü döndür
    if (now.getHours() < LESSON_HOUR_END) {
      daysUntilThursday = 0;
    } else {
      // Ders saati geçtiyse gelecek perşembeyi döndür
      daysUntilThursday = 7;
    }
  }
  
  d.setDate(d.getDate() + daysUntilThursday);
  return d;
};

/**
 * Belirli bir tarih için ders bilgisi oluştur
 */
export const createLessonForDate = (date: Date): Lesson => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const startTime = new Date(year, month, day, LESSON_HOUR_START, 0, 0).getTime();
  const endTime = new Date(year, month, day, LESSON_HOUR_END, 0, 0).getTime();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    startTime,
    endTime,
    title: `NEP Haftalık Ders — ${day} ${getMonthName(month)}`,
    zoomLink: '', // systemSettingsService.getZoomLink() ile alınır
    date: dateStr
  };
};

/**
 * Şu anki veya bir sonraki ders bilgisini getir
 */
export const getNextLesson = (): Lesson => {
  const now = new Date();
  const nowTime = now.getTime();

  // Sabit takvimden gelecekteki ilk dersi bul
  const upcoming = FIXED_LESSON_SCHEDULE
    .map(({ lessonNo, date }) => {
      const [year, month, day] = date.split('-').map(Number);
      const startTime = new Date(year, month - 1, day, LESSON_HOUR_START, 0, 0).getTime();
      const endTime   = new Date(year, month - 1, day, LESSON_HOUR_END,   0, 0).getTime();
      return { lessonNo, date, startTime, endTime };
    })
    .find(l => l.endTime > nowTime); // Bitişi geçmemiş ilk ders

  if (upcoming) {
    return {
      startTime: upcoming.startTime,
      endTime:   upcoming.endTime,
      title:     `Ders ${upcoming.lessonNo}`,
      zoomLink:  '', // systemSettingsService.getZoomLink() ile alınır
      date:      upcoming.date,
    };
  }

  // Tüm dersler geçtiyse eski dinamik hesaplamaya geri dön
  const nextThursday = getNextThursday();
  return createLessonForDate(nextThursday);
};

/**
 * Şu an ders aktif mi? (Perşembe 19.00–20.00 arası)
 */
export const isLessonActive = (): boolean => {
  const now = new Date();
  const nowTime = now.getTime();
  return FIXED_LESSON_SCHEDULE.some(({ date }) => {
    const [year, month, day] = date.split('-').map(Number);
    const start = new Date(year, month - 1, day, LESSON_HOUR_START, 0, 0).getTime();
    const end   = new Date(year, month - 1, day, LESSON_HOUR_END,   0, 0).getTime();
    return nowTime >= start && nowTime < end;
  });
};

/**
 * Şu an ders saati geldi mi? (Perşembe 19.00–19.59)
 * Zero-click yönlendirme için kullanılır
 */
export const shouldAutoRedirectToZoom = (): boolean => {
  return isLessonActive();
};

/**
 * Bugün ders günü mü?
 */
export const isLessonDay = (): boolean => {
  return new Date().getDay() === LESSON_DAY;
};

/**
 * Ders sona erdi mi? (Perşembe 20:00 geçti mi?)
 */
export const isLessonEnded = (): boolean => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return FIXED_LESSON_SCHEDULE.some(({ date }) => {
    if (date !== today) return false;
    const [year, month, day] = date.split('-').map(Number);
    const end = new Date(year, month - 1, day, LESSON_HOUR_END, 0, 0).getTime();
    return Date.now() >= end;
  });
};

/**
 * Hatırlatma mesajı zamanı mı? (Çarşamba saat 19.00)
 */
export const isReminderTime = (): boolean => {
  const now = new Date();
  return now.getDay() === 3 && // Çarşamba
         now.getHours() === LESSON_HOUR_START &&
         now.getMinutes() === 0;
};

/**
 * Ders başlangıç mesajı zamanı mı? (Perşembe saat 19.00)
 */
export const isLessonStartTime = (): boolean => {
  const now = new Date();
  return now.getDay() === LESSON_DAY &&
         now.getHours() === LESSON_HOUR_START &&
         now.getMinutes() === 0;
};

/**
 * Gelecek N perşembeyi listele (arşiv veya planlama için)
 */
export const getUpcomingLessons = (count: number = 4): Lesson[] => {
  const lessons: Lesson[] = [];
  let current = getNextThursday();
  
  for (let i = 0; i < count; i++) {
    lessons.push(createLessonForDate(current));
    const next = new Date(current);
    next.setDate(next.getDate() + 7);
    current = next;
  }
  
  return lessons;
};

/**
 * Geçmiş dersleri hesapla (belirli bir başlangıç tarihinden itibaren)
 */
export const getPastLessons = (sinceDate: Date, count: number = 10): Lesson[] => {
  const lessons: Lesson[] = [];
  const now = new Date();
  let current = getNextThursday(sinceDate);
  
  while (current < now && lessons.length < count) {
    if (current.getDay() === LESSON_DAY) {
      lessons.push(createLessonForDate(current));
    }
    current.setDate(current.getDate() + 7);
  }
  
  return lessons.reverse();
};

// Ay isimleri (Türkçe)
const getMonthName = (month: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[month];
};

// Ders günü formatı
export const formatLessonDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${getMonthName(d.getMonth())} ${d.getFullYear()}, Perşembe`;
};

/**
 * @deprecated zoomLink artık buradan okunmaz.
 * Bunun yerine `systemSettingsService.getZoomLink()` kullanın.
 */
export const LESSON_CONFIG = {
  dayOfWeek: LESSON_DAY,
  startHour: LESSON_HOUR_START,
  endHour: LESSON_HOUR_END,
  zoomLink: '', // Supabase'den çekilir — bak: systemSettingsService
  dayName: 'Perşembe',
} as const;
