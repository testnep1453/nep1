import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { isLessonActive, isLessonEnded, getNextLesson } from '../config/lessonSchedule';
import { subscribeToSettingStore } from '../services/dbFirebase';

interface AutoZoomState {
  status: 'waiting' | 'redirecting' | 'in_lesson' | 'lesson_ended' | 'feedback';
  redirected: boolean;
  lessonDate: string;
}

export const useAutoZoom = (
  studentId: string | null,
  studentName: string,
  zoomLinkProp: string
) => {
  const [state, setState] = useState<AutoZoomState>({
    status: 'waiting',
    redirected: false,
    lessonDate: getNextLesson().date,
  });
  
  const [liveZoomLink, setLiveZoomLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasRedirected = useRef(false);
  const hasRecordedAttendance = useRef(false);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualOverrideRef = useRef(false);

  // Verileri Supabase'den gerçek zamanlı dinle
  useEffect(() => {
    try {
      const unsub = subscribeToSettingStore<Record<string, any> | null>('system_config', null, (data) => {
        if (!data) return;
        
        manualOverrideRef.current = data.manual_lesson_active === true;
        if (data.zoom_link) {
          setLiveZoomLink(data.zoom_link);
        }
        setIsLoading(false);
      });
      return () => unsub();
    } catch (err) {
      console.warn("Sistem ayarları yüklenemedi (401 veya tablo boş):", err);
      setIsLoading(false);
    }
  }, []);

  // Link eksikliği uyarısını sadece veri yüklendiğinde ve link gerçekten yoksa 1 kez ver
  useEffect(() => {
    if (!isLoading && !liveZoomLink && !zoomLinkProp && (isLessonActive() || manualOverrideRef.current)) {
      console.warn("Geçerli bir Zoom linki bulunamadı. Lütfen sistem ayarlarından ekleyin.");
    }
  }, [isLoading, liveZoomLink, zoomLinkProp]);

  useEffect(() => {
    if (!studentId) return;

    const checkLesson = () => {
      const lesson = getNextLesson();
      const isActive = isLessonActive() || manualOverrideRef.current;
      
      if (isActive) {
        if (!hasRedirected.current) {
          setState({ status: 'redirecting', redirected: false, lessonDate: lesson.date });
          
          if (!hasRecordedAttendance.current) {
            recordAutoAttendance(studentId, lesson.date);
            hasRecordedAttendance.current = true;
          }
          
          setTimeout(() => {
            // Veriler henüz yükleniyorsa bekle
            if (isLoading) return;

            const currentLink = liveZoomLink || zoomLinkProp;
            
            let finalUrl: URL | null = null;
            try {
              if (currentLink && currentLink.trim() !== '') {
                // Link'in protocol'ü yoksa ekle (örn: zoom.us -> https://zoom.us)
                const linkToTest = currentLink.includes('://') ? currentLink : `https://${currentLink}`;
                finalUrl = new URL(linkToTest);
              }
            } catch (e) {
              finalUrl = null;
            }

            if (finalUrl && (finalUrl.protocol === 'http:' || finalUrl.protocol === 'https:')) {
              hasRedirected.current = true;
              setState(prev => ({ ...prev, status: 'in_lesson', redirected: true }));
              
              try {
                const encodedName = btoa(unescape(encodeURIComponent(studentName)));
                finalUrl.searchParams.set('un', encodedName);
                
                console.log("Zoom'a yönlendiriliyor:", finalUrl.toString());
                window.location.href = finalUrl.toString();
              } catch (err) {
                console.error("Link oluşturma hatası:", err);
                hasRedirected.current = true; // Hata durumunda da tekrar denememesi için
                setState(prev => ({ ...prev, status: 'waiting', redirected: false }));
              }
            } else {
              // Uyarı useEffect içinde halledildi, burada sadece state'i güncelle
              hasRedirected.current = true; // Tekrar tekrar girmeye çalışmaması için
              setState(prev => ({ ...prev, status: 'waiting', redirected: false }));
            }
          }, 3200);
        }
      } else if (isLessonEnded() && !manualOverrideRef.current) {
        if (hasRedirected.current || hasRecordedAttendance.current) {
          setState({ status: 'feedback', redirected: true, lessonDate: lesson.date });
        } else {
          setState({ status: 'lesson_ended', redirected: false, lessonDate: lesson.date });
        }
      } else {
        if (!manualOverrideRef.current) {
          setState({ status: 'waiting', redirected: false, lessonDate: lesson.date });
          hasRedirected.current = false;
          hasRecordedAttendance.current = false;
        }
      }
    };

    checkLesson();
    checkInterval.current = setInterval(checkLesson, 1000);

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [studentId, studentName, zoomLinkProp, isLoading, liveZoomLink]);

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
