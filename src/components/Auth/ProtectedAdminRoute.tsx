/**
 * Protected Admin Route Component
 * Server-side admin verification to prevent localStorage spoofing
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        // 1. Check if user has an active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // 2. Server-side admin verification via admin_users table
        // This prevents localStorage spoofing attacks
        const { data: adminRecord, error } = await supabase
          .from('admin_users')
          .select('isSuperAdmin')
          .eq('userId', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Admin verification error:', error);
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // 3. Also verify the studentId matches admin ID (1002) as secondary check
        const studentId = localStorage.getItem('studentId');
        const isIdValid = studentId === '1002';
        
        // Both server and client checks must pass
        setIsAuthorized(!!adminRecord && isIdValid);
        
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#39FF14] animate-spin" />
          <p className="text-gray-400 text-sm font-mono">Güvenlik doğrulaması yapılıyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-white/[0.03] border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-gray-400 mb-6">
            Bu alana erişim yetkiniz yok. Admin yetkileri gereklidir.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Hook for admin status verification
 * Use this instead of local student.id === '1002' checks
 */
export const useAdminStatus = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from('admin_users')
          .select('*')
          .eq('userId', session.user.id)
          .maybeSingle();

        const studentId = localStorage.getItem('studentId');
        setIsAdmin(!!data && studentId === '1002');
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, isLoading };
};
