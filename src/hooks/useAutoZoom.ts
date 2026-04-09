/**
 * Auto Zoom Hook - Supabase tabanlı
 * Perşembe 19:00:00 - 19:59:59 arası otomatik Zoom yönlendirmesi
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
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
        if (!hasRedirected.current) {
          setState({ status: 'redirecting', redirected: false, lessonDate: lesson.date });
          
          if (!hasRecordedAttendance.current) {
            recordAutoAttendance(studentId, lesson.date);
            hasRecordedAttendance.current = true;
          }
          
          setTimeout(() => {
            hasRedirected.current = true;
            setState(prev => ({ ...prev, status: 'in_lesson', redirected: true }));
            const encodedName = btoa(unescape(encodeURIComponent(studentName)));
            const finalLink = `${zoomLink}&un=${encodedName}`;
            window.location.href = finalLink;
          }, 3200);
        }
      } else if (isLessonEnded()) {
        if (hasRedirected.current || hasRecordedAttendance.current) {
          setState({ status: 'feedback', redirected: true, lessonDate: lesson.date });
        } else {
          setState({ status: 'lesson_ended', redirected: false, lessonDate: lesson.date });
        }
      } else {
        setState({ status: 'waiting', redirected: false, lessonDate: lesson.date });
        hasRedirected.current = false;
        hasRecordedAttendance.current = false;
      }
    };

    checkLesson();
    checkInterval.current = setInterval(checkLesson, 1000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [studentId, studentName, zoomLink]);

  return state;
};

const recordAutoAttendance = async (studentId: string, lessonDate: string) => {
  try {
    const id = `${lessonDate}_${studentId}`;

    // Zaten kayıtlıysa tekrar yazma
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (existing) return;

    await supabase.from('attendance').insert([{
      id,
      studentId,
      lessonDate,
      joinedAt: Date.now(),
      autoJoined: true,
      xpEarned: 100,
    }]);

    // Öğrencinin XP'sini güncelle
    const { data: studentData } = await supabase
      .from('students')
      .select('xp')
      .eq('id', studentId)
      .maybeSingle();

    if (studentData) {
      const newXp = (studentData.xp || 0) + 100;
      await supabase.from('students').update({
        xp: newXp,
        level: Math.floor(newXp / 200) + 1,
        lastSeen: Date.now(),
      }).eq('id', studentId);
    }
  } catch (error) {
    console.error('Yoklama kaydı hatası:', error);
  }
};
