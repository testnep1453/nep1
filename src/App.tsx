import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePresence } from './hooks/usePresence';
import { useSessionTimeout, SESSION_TIMEOUT } from './hooks/useSessionTimeout';
import { StudentLogin } from './components/Auth/StudentLogin';
import { AdminAuth } from './components/Auth/AdminAuth';
import { EmailVerificationModal } from './components/Auth/EmailVerificationModal';
import { PasswordVerificationModal } from './components/Auth/PasswordVerificationModal';
import { UnifiedDashboard } from './components/Dashboard/UnifiedDashboard';
import { AgentDashboard } from './components/Agent/AgentDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getNextLesson } from './config/lessonSchedule';
import { requestNotificationPermission, setupNotificationListener } from './services/fcm';
import { recordLoginAndCheckSuspicious } from './services/loginAlertService';
import { useCommandListener } from './hooks/useCommandListener';
import { TrailerOverlay } from './components/CommandOverlay';
import { extractYoutubeId } from './services/supabaseService';
import { resetSystemCommands } from './services/commandService';
import { validateAdminSession, endAdminSession } from './services/adminSessionService';

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
    cancelEmailVerification,
    needsPasswordVerification,
    confirmPasswordVerification,
    cancelPasswordVerification,
  } = useAuth();

  const { lastCommand, setLastCommand } = useCommandListener();
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
      // Removed auto-request for notification permission to fix browser error
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
    if (lastCommand?.command === 'START_LESSON') {
      // Dispatch a custom event for redirection to 'yoklama' (attendance)
      // This is a robust way to change tab without react-router or lifting state up
      window.dispatchEvent(new CustomEvent('system-navigation', { detail: { target: 'yoklama' } }));
    }
  }, [lastCommand]);

  useEffect(() => {
    if (needsAdminAuth) {
      setAppStatus('adminAuth');
    }
  }, [needsAdminAuth]);

  // GÜVENLİK: Admin için her 30 saniyede bir oturum geçerliliği kontrolü
  // Başka cihazdan giriş yapıldıysa bu oturum düşer
  useEffect(() => {
    if (!isAdmin || !student) return;
    const check = async () => {
      const valid = await validateAdminSession();
      if (!valid) {
        alert('Oturumunuz başka bir cihazdan sonlandırıldı. Güvenlik gereği çıkış yapılıyor.');
        await endAdminSession();
        logout();
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin, student, logout]);

  // 1. Ekran: Yükleniyor
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse tracking-widest">YÜKLENİYOR...</div>
      </div>
    );
  }

  // 2. Ekran: E-posta Doğrulama
  if (needsEmailVerification && pendingStudent) {
    return (
      <EmailVerificationModal
        studentId={pendingStudent.id}
        onVerified={(email) => {
          confirmEmailVerification(email);
        }}
        onCancel={cancelEmailVerification}
      />
    );
  }

  // 3. Ekran: OTP Kimlik Doğrulama
  if (needsPasswordVerification && pendingStudent) {
    return (
      <PasswordVerificationModal
        student={pendingStudent}
        onVerified={confirmPasswordVerification}
        onCancel={cancelPasswordVerification}
      />
    );
  }

  // 4. Ekran: Admin Giriş ve Onay
  if (appStatus === 'adminAuth' && pendingStudent) {
    return (
      <AdminAuth
        adminName={pendingStudent.name}
        adminEmail={pendingStudent.email}
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

  // 4. Ekran: Normal Öğrenci Giriş
  if (appStatus === 'loggingIn' && !student) {
    return (
      <StudentLogin
        onLogin={login}
        onLoginWithGoogle={loginWithGoogle}
      />
    );
  }

  // 5. Ekran: Ana Paneller (Admin veya Ajan)
  let content = null;
  if (appStatus === 'dashboard' && student) {
    const handleLogout = () => {
      logout();
      window.location.reload();
    };

    if (isAdmin) {
      content = (
        <UnifiedDashboard
          student={student}
          onLogout={handleLogout}
          lesson={lesson}
          onlineCount={onlineCount}
        />
      );
    } else {
      content = (
        <AgentDashboard
          student={student}
          onLogout={handleLogout}
          lesson={lesson}
        />
      );
    }
  }

  return (
    <>
      {content}
      {lastCommand?.command === 'START_TRAILER' && lastCommand.payload?.video_url && (
        <TrailerOverlay 
          videoId={extractYoutubeId(lastCommand.payload.video_url)} 
          onClose={async () => {
             await resetSystemCommands();
             setLastCommand({ ...lastCommand, command: 'RESET' });
          }}
          isResettable={isAdmin}
        />
      )}
    </>
  );
}

// Hata Yakalayıcı (ErrorBoundary) ile Sarmalama
function AppWithBoundary() {
  return (
    <ErrorBoundary fallbackMessage="Bir hata oluştu. Lütfen sayfayı yeniden yükleyin.">
      <App />
    </ErrorBoundary>
  );
}

export default AppWithBoundary;

