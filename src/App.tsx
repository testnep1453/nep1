import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useSessionTimeout, SESSION_TIMEOUT } from './hooks/useSessionTimeout';
import { StudentLogin } from './components/Auth/StudentLogin';
import { AdminAuth } from './components/Auth/AdminAuth';
import { EmailVerificationModal } from './components/Auth/EmailVerificationModal';
import { UnifiedDashboard } from './components/Dashboard/UnifiedDashboard';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getNextLesson } from './config/lessonSchedule';
import { requestNotificationPermission, setupNotificationListener } from './services/fcm';
import { recordLoginAndCheckSuspicious } from './services/loginAlertService';

type AppStatus = 'loggingIn' | 'adminAuth' | 'dashboard';

function App() {
  const {
    student,
    loading,
    login,
    loginWithGoogle,
    logout,
    pendingStudent,
    needsAdminAuth,
    confirmAdminAuth,
    cancelAdminAuth,
    needsEmailVerification,
    confirmEmailVerification,
  } = useAuth();

  const onlineCount = usePresence(student?.id || null);
  const [appStatus, setAppStatus] = useState<AppStatus>('loggingIn');

  const lesson = getNextLesson();

  const isAdmin = student?.id === '1002';

  useSessionTimeout({
    timeoutMs: isAdmin ? SESSION_TIMEOUT.ADMIN : SESSION_TIMEOUT.AGENT,
    onTimeout: () => {
      logout();
      window.location.reload();
    },
    enabled: !!student,
  });

  useEffect(() => {
    if (student) {
      requestNotificationPermission(student.id);
      setupNotificationListener((payload) => {
        void payload;
      });
      recordLoginAndCheckSuspicious(student.id);
    }

    if (student && appStatus === 'loggingIn') {
      setAppStatus('dashboard');
    } else if (!student && !needsAdminAuth && appStatus === 'dashboard') {
      setAppStatus('loggingIn');
    }
  }, [student]);

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

  if (needsEmailVerification && pendingStudent) {
    return (
      <EmailVerificationModal
        studentId={pendingStudent.id}
        studentName={pendingStudent.name}
        onVerified={(email) => {
          confirmEmailVerification(email);
        }}
        onBack={logout} // EKLENEN KISIM: Geri dönüş fonksiyonu eklendi
      />
    );
  }

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

  if (appStatus === 'loggingIn' && !student) {
    return (
      <StudentLogin
        onLogin={login}
        onLoginWithGoogle={loginWithGoogle}
      />
    );
  }

  if (appStatus === 'dashboard' && student) {
    const handleLogout = () => {
      logout();
      window.location.reload();
    };

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
