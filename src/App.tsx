import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { StudentLogin } from './components/Auth/StudentLogin';
import { AdminAuth } from './components/Auth/AdminAuth';
import { UnifiedDashboard } from './components/Dashboard/UnifiedDashboard';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getNextLesson } from './config/lessonSchedule';
import { requestNotificationPermission, setupNotificationListener } from './services/fcm';
import { signOutUser } from './services/authService';

type AppStatus = 'loggingIn' | 'adminAuth' | 'dashboard';

function App() {
  const {
    student,
    loading,
    login,
    pendingStudent,
    needsConfirmation,
    confirmIdentity,
    rejectIdentity,
    needsAdminAuth,
    confirmAdminAuth,
    cancelAdminAuth,
  } = useAuth();

  const onlineCount = usePresence(student?.id || null);
  const [appStatus, setAppStatus] = useState<AppStatus>('loggingIn');

  // Lesson otomatik hesaplama (artık Firestore'a bağımlı değil — lessonSchedule.ts'den geliyor)
  const lesson = getNextLesson();

  useEffect(() => {
    if (student) {
      requestNotificationPermission();
      setupNotificationListener((payload) => {
        console.log('Bildirim alındı:', payload);
      });
    }

    if (student && appStatus === 'loggingIn') {
      setAppStatus('dashboard');
    } else if (!student && !needsAdminAuth && appStatus === 'dashboard') {
      setAppStatus('loggingIn');
    }
  }, [student]);

  // Admin auth ekranına geçiş
  useEffect(() => {
    if (needsAdminAuth) {
      setAppStatus('adminAuth');
    }
  }, [needsAdminAuth]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse tracking-widest">YÜKLENİYOR...</div>
      </div>
    );
  }

  // Admin giriş ekranı
  if (appStatus === 'adminAuth' && pendingStudent) {
    return (
      <AdminAuth
        adminName={pendingStudent.name}
        onSuccess={() => {
          confirmAdminAuth();
          setAppStatus('dashboard');
        }}
        onCancel={() => {
          cancelAdminAuth();
          setAppStatus('loggingIn');
        }}
      />
    );
  }



  if ((appStatus === 'loggingIn' && !student) || needsConfirmation) {
    return (
      <StudentLogin
        onLogin={login}
        pendingStudent={pendingStudent}
        needsConfirmation={needsConfirmation}
        onConfirm={() => {
          confirmIdentity();
          setAppStatus('dashboard');
        }}
        onReject={rejectIdentity}
      />
    );
  }

  if (appStatus === 'dashboard' && student) {
    const isAdmin = student.id === '1002';
    const handleLogout = () => {
      signOutUser().catch(() => {});
      localStorage.removeItem('studentId');
      window.location.reload();
    };

    // Admin → UnifiedDashboard (yönetim paneli)
    // Ajan → AgentDashboard (6 sekmeli ajan arayüzü)
    if (isAdmin) {
      return (
        <UnifiedDashboard
          student={student}
          onLogout={handleLogout}
          lesson={lesson}
          onlineCount={onlineCount}
        />
      );
    }

    return (
      <AgentDashboard
        student={student}
        onLogout={handleLogout}
        lesson={lesson}
        onlineCount={onlineCount}
      />
    );
  }

  return null;
}

function AppWithBoundary() {
  return (
    <ErrorBoundary fallbackMessage="Bir hata oluştu. Lütfen sayfayı yeniden yükleyin.">
      <App />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;
