/**
 * Auto Zoom Hook
 * Perşembe 19:00:00 - 19:59:59 arası otomatik Zoom yönlendirmesi
 * Ders bitince (20:00) sonraki haftanın geri sayımına geçer
 */

import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { isLessonActive, isLessonEnded, getNextLesson } from '../config/lessonSchedule';

interface AutoZoomState {
  status: 'waiting' | 'redirecting' | 'in_lesson' | 'lesson_ended' | 'feedback';
  redirected: boolean;
  lessonDate: string;
}

export const useAutoZoom = (
  studentId: string | null,
  studentName: string,
  zoomLink: string
) => {
  const [state, setState] = useState<AutoZoomState>({
    status: 'waiting',
    redirected: false,
    lessonDate: getNextLesson().date,
  });
  
  const hasRedirected = useRef(false);
  const hasRecordedAttendance = useRef(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const checkLesson = () => {
      const lesson = getNextLesson();
      
      if (isLessonActive()) {
        // Ders aktif — yönlendir
        if (!hasRedirected.current) {
          setState({ status: 'redirecting', redirected: false, lessonDate: lesson.date });
          
          // Yoklamayı kaydet
          if (!hasRecordedAttendance.current) {
            recordAutoAttendance(studentId, lesson.date);
            hasRecordedAttendance.current = true;
          }
          
          // Terminal efekti sonrası yönlendir
          setTimeout(() => {
            hasRedirected.current = true;
            setState(prev => ({ ...prev, status: 'in_lesson', redirected: true }));
            
            // Zoom'a yönlendir
            const encodedName = btoa(unescape(encodeURIComponent(studentName)));
            const finalLink = `${zoomLink}&un=${encodedName}`;
            window.location.href = finalLink;
          }, 3200); // Terminal animasyonu süresi
        }
      } else if (isLessonEnded()) {
        // Ders bitti
        if (hasRedirected.current || hasRecordedAttendance.current) {
          setState({ status: 'feedback', redirected: true, lessonDate: lesson.date });
        } else {
          setState({ status: 'lesson_ended', redirected: false, lessonDate: lesson.date });
        }
      } else {
        // Ders yok — bekleme modunda
        setState({ status: 'waiting', redirected: false, lessonDate: lesson.date });
        hasRedirected.current = false;
        hasRecordedAttendance.current = false;
      }
    };

    // İlk kontrol
    checkLesson();
    
    // Her saniye kontrol et
    checkInterval.current = setInterval(checkLesson, 1000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [studentId, studentName, zoomLink]);

  return state;
};

/**
 * Otomatik yoklama kaydı
 */
const recordAutoAttendance = async (studentId: string, lessonDate: string) => {
  try {
    const attendanceRef = doc(db, 'attendance', `${lessonDate}_${studentId}`);
    
    // Zaten kayıtlıysa tekrar yazma
    const existing = await getDoc(attendanceRef);
    if (existing.exists()) return;
    
    await setDoc(attendanceRef, {
      studentId,
      lessonDate,
      joinedAt: Date.now(),
      autoJoined: true,
      xpEarned: 100,
    });

    // Öğrencinin XP'sini güncelle
    const studentRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentRef);
    if (studentDoc.exists()) {
      const data = studentDoc.data();
      const currentXp = data.xp || 0;
      const newXp = currentXp + 100;
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(studentRef, {
        xp: newXp,
        level: Math.floor(newXp / 200) + 1,
        lastSeen: Date.now(),
      });
    }
  } catch (error) {
    console.error('Yoklama kaydı hatası:', error);
  }
};
