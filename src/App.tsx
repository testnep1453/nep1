import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { StudentLogin } from './components/Auth/StudentLogin';
import { LoginTransitionOverlay } from './components/Transitions/LoginTransitionOverlay';
import { UnifiedDashboard } from './components/Dashboard/UnifiedDashboard';
import { Lesson, Theme } from './types/student';
import { requestNotificationPermission, setupNotificationListener } from './services/fcm';

type AppStatus = 'loggingIn' | 'loginSuccessTransition' | 'dashboard';

function App() {
  const { student, loading, login } = useAuth();
  const onlineCount = usePresence(student?.id || null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [appStatus, setAppStatus] = useState<AppStatus>('loggingIn');

  useEffect(() => {
    if (student) {
      requestNotificationPermission();
      setupNotificationListener((payload) => {
        console.log('Bildirim alındı:', payload);
      });

      const loadLesson = async () => {
        try {
          const lessonDoc = await getDoc(doc(db, 'lessons', 'nextLesson'));
          if (lessonDoc.exists()) {
            const data = lessonDoc.data();
            setLesson({
              startTime: data.startTime?.toMillis() || Date.now() + 3 * 24 * 60 * 60 * 1000,
              title: data.title || 'Sıradaki Ders',
              zoomLink: data.zoomLink || 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
            });
          } else {
            setLesson({
              startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
              title: 'Demo Ders',
              zoomLink: 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
            });
          }
        } catch (error) {
          console.error('Ders yüklenirken hata oluştu:', error);
          setLesson({
            startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
            title: 'Demo Ders',
            zoomLink: 'https://us06web.zoom.us/j/81331199971?pwd=wEBSZPJcBJg3MbV4FqGMO7ggJ3onM8.1'
          });
        }
      };

      loadLesson();
    }

    if (student && appStatus === 'loggingIn') {
      setAppStatus('loginSuccessTransition');
      // BEKLEME SÜRESİ YAVAŞLATILDI (5 Saniye)
      setTimeout(() => {
        setAppStatus('dashboard');
      }, 5000); 
    } else if (!student && appStatus === 'dashboard') {
      setAppStatus('loggingIn');
    }

  }, [student]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#25293c] flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">YÜKLENİYOR...</div>
      </div>
    );
  }

  if (appStatus === 'loginSuccessTransition' && student) {
    return <LoginTransitionOverlay studentName={student.name} />;
  }

  if (appStatus === 'loggingIn' && !student) {
    return <StudentLogin onLogin={login} />;
  }

  if (appStatus === 'dashboard' && student) {
    return (
      <UnifiedDashboard 
        student={student} 
        onLogout={() => { localStorage.removeItem('studentId'); window.location.reload(); }}
        lesson={lesson}
        onlineCount={onlineCount}
      />
    );
  }

  return null;
}

export default App;
