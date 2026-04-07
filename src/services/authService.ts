/**
 * Firebase Auth Servisi
 * 
 * Sayısal ID girişini Firebase Auth ile eşler.
 * Desteklenen yöntemler:
 *   1. Anonymous Auth — sayısal ID ile giriş
 *   2. Google Sign-In — Google hesabı ile giriş + otomatik e-posta
 *   3. E-posta doğrulama — link tabanlı Firebase doğrulama
 */

import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithCredential,
  EmailAuthProvider,
  User,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const ADMIN_STUDENT_ID = '1002';
const googleProvider = new GoogleAuthProvider();

// ============================================
// ANONYMOUS AUTH
// ============================================

/**
 * Firebase Anonymous Auth ile giriş yap ve studentId'yi eşle
 */
export const signInAndMapStudent = async (studentId: string): Promise<User | null> => {
  try {
    if (auth.currentUser) {
      const existingMapping = await getStudentMapping(auth.currentUser.uid);
      if (existingMapping?.studentId === studentId) {
        return auth.currentUser;
      }
    }

    const credential = await signInAnonymously(auth);
    const user = credential.user;

    await setDoc(doc(db, 'userMappings', user.uid), {
      studentId,
      isAdmin: studentId === ADMIN_STUDENT_ID,
      lastLogin: Date.now(),
    });

    return user;
  } catch {
    return null;
  }
};

// ============================================
// GOOGLE SIGN-IN
// ============================================

/**
 * Google ile giriş yap — e-posta otomatik doğrulanır
 * Dönüş: { email, isNewUser } veya null
 */
export const signInWithGoogle = async (): Promise<{ email: string; user: User } | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email;
    if (!email) return null;
    return { email, user: result.user };
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/popup-closed-by-user') {
      return null; // Kullanıcı popup'ı kapattı — normal durum
    }
    return null;
  }
};

/**
 * Google e-postasıyla eşleşen öğrenciyi bul
 */
export const findStudentByEmail = async (email: string): Promise<string | null> => {
  try {
    const q = query(collection(db, 'students'), where('email', '==', email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].id; // studentId
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Google auth sonrası userMappings'e kaydet
 */
export const mapGoogleUserToStudent = async (user: User, studentId: string): Promise<void> => {
  await setDoc(doc(db, 'userMappings', user.uid), {
    studentId,
    isAdmin: studentId === ADMIN_STUDENT_ID,
    email: user.email,
    provider: 'google',
    lastLogin: Date.now(),
  });
};

// ============================================
// EMAIL LINK VERIFICATION (doğrulama linki)
// ============================================

/**
 * E-posta doğrulama linki gönder
 */
export const sendVerificationLink = async (email: string, studentId: string): Promise<boolean> => {
  try {
    const actionCodeSettings = {
      url: `${window.location.origin}${import.meta.env.BASE_URL || '/'}?studentId=${studentId}&mode=emailVerify`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // E-postayı localStorage'a kaydet — geri dönüşte kullanılacak
    localStorage.setItem('emailForVerification', email);
    localStorage.setItem('pendingVerifyStudentId', studentId);
    return true;
  } catch {
    return false;
  }
};

/**
 * E-posta doğrulama linkini kontrol et (sayfa yüklendiğinde)
 */
export const handleEmailLinkVerification = async (): Promise<{ email: string; studentId: string } | null> => {
  try {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return null;
    }

    let email = localStorage.getItem('emailForVerification');
    const studentId = localStorage.getItem('pendingVerifyStudentId');

    if (!email) {
      // Kullanıcı farklı cihazdan gelmiş olabilir
      email = window.prompt('Doğrulama için e-posta adresinizi tekrar girin:');
    }

    if (!email || !studentId) return null;

    // Mevcut anonim kullanıcıyı email ile link'le
    if (auth.currentUser) {
      try {
        const credential = EmailAuthProvider.credentialWithLink(email, window.location.href);
        await linkWithCredential(auth.currentUser, credential);
      } catch {
        // Link zaten varsa signInWithEmailLink dene
        await signInWithEmailLink(auth, email, window.location.href);
      }
    } else {
      await signInWithEmailLink(auth, email, window.location.href);
    }

    // Temizle
    localStorage.removeItem('emailForVerification');
    localStorage.removeItem('pendingVerifyStudentId');

    // URL'den link parametrelerini temizle
    window.history.replaceState(null, '', window.location.pathname);

    return { email, studentId };
  } catch {
    return null;
  }
};

// ============================================
// EMAIL'İ STUDENT'A KAYDET
// ============================================

/**
 * Öğrencinin e-posta adresini Firestore'a kaydet
 */
export const saveStudentEmail = async (studentId: string, email: string): Promise<void> => {
  try {
    const studentRef = doc(db, 'students', studentId);
    await setDoc(studentRef, { email }, { merge: true });
  } catch {
    // Firestore yazma hatası — sessiz
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getStudentMapping = async (uid: string): Promise<{ studentId: string; isAdmin: boolean } | null> => {
  try {
    const snap = await getDoc(doc(db, 'userMappings', uid));
    if (snap.exists()) {
      return snap.data() as { studentId: string; isAdmin: boolean };
    }
    return null;
  } catch {
    return null;
  }
};

export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch {
    // Sessiz
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
