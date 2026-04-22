import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import StudentLogin from './components/Auth/StudentLogin';
import AdminLogin from './components/Admin/AdminLogin';
import AdminResetPassword from './components/Admin/AdminResetPassword';
import UnifiedDashboard from './components/Dashboard/UnifiedDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import LoginTransitionOverlay from './components/Transitions/LoginTransitionOverlay';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const { 
    student, 
    loading, 
    needsAdminAuth, 
    logout 
  } = useAuth();

  const [showTransition, setShowTransition] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // 1. ŞİFRE SIFIRLAMA KONTROLÜ (Catch-all)
  // URL'de ?admin_reset=1 varsa diğer her şeyi pas geçip sıfırlama ekranını açar
  const isAdminReset = new URLSearchParams(window.location.search).get('admin_reset') === '1';

  useEffect(() => {
    // Giriş başarılı olduğunda 5 saniyelik roket geçişini tetikle
    if (student && !isAppReady) {
      setShowTransition(true);
      const timer = setTimeout(() => {
        setShowTransition(false);
        setIsAppReady(true);
      }, 5000); // AGENTS.md kuralı: 5 saniye geçiş süresi
      return () => clearTimeout(timer);
    }
    
    // Çıkış yapıldığında hazır durumunu sıfırla
    if (!student) {
      setIsAppReady(false);
    }
  }, [student, isAppReady]);

  // Şifre sıfırlama modundaysak sadece o bileşeni döndür
  if (isAdminReset) {
    return (
      <ErrorBoundary>
        <AdminResetPassword />
      </ErrorBoundary>
    );
  }

  // Yükleme ekranı
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono">
        <div className="text-[#00F0FF] animate-pulse tracking-[0.3em] uppercase">
          Veri_Yükleniyor...
        </div>
      </div>
    );
  }

  // Giriş sonrası geçiş animasyonu (Roket Fırlatma)
  if (showTransition) {
    return <LoginTransitionOverlay studentName={student?.name || 'Ajan'} />;
  }

  // ANA AKIŞ
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white">
        {!student ? (
          // OTURUM AÇIK DEĞİLSE
          needsAdminAuth ? (
            <AdminLogin />
          ) : (
            <StudentLogin />
          )
        ) : (
          // OTURUM AÇIKSA
          isAppReady && (
            student.id === '1002' ? (
              <AdminDashboard admin={student} onLogout={logout} />
            ) : (
              <UnifiedDashboard student={student} onLogout={logout} />
            )
          )
        )}
      </div>
    </ErrorBoundary>
  );
}
