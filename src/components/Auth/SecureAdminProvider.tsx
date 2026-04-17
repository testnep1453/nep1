/**
 * Secure Admin Provider
 * Context-based admin state with server-side verification
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../config/supabase';

interface SecureAdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminError: string | null;
  refreshAdminStatus: () => Promise<void>;
}

const SecureAdminContext = createContext<SecureAdminContextType | undefined>(undefined);

export const useSecureAdmin = () => {
  const context = useContext(SecureAdminContext);
  if (!context) {
    throw new Error('useSecureAdmin must be used within SecureAdminProvider');
  }
  return context;
};

interface SecureAdminProviderProps {
  children: ReactNode;
}

export const SecureAdminProvider: React.FC<SecureAdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);

  const verifyAdminStatus = async () => {
    try {
      setIsLoading(true);
      setAdminError(null);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Server-side verification via admin_users table
      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('"isSuperAdmin"')
        .eq('"userId"', session.user.id)
        .maybeSingle();

      if (adminError) {
        setAdminError('Admin doğrulama hatası');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check localStorage studentId as secondary validation
      const studentId = localStorage.getItem('studentId');
      
      if (adminRecord && studentId === '1002') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        
        // Log potential security violation
        if (studentId === '1002' && !adminRecord) {
          console.warn('SECURITY: localStorage spoofing attempt detected');
          // Could send alert to security monitoring here
        }
      }
    } catch (error) {
      console.error('Admin verification failed:', error);
      setAdminError('Doğrulama başarısız');
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyAdminStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      verifyAdminStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SecureAdminContext.Provider value={{
      isAdmin,
      isLoading,
      adminError,
      refreshAdminStatus: verifyAdminStatus
    }}>
      {children}
    </SecureAdminContext.Provider>
  );
};
