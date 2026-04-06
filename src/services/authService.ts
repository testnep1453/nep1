/**
 * Firebase Auth Servisi
 * 
 * Sayısal ID girişini Firebase Anonymous Auth ile eşler.
 * Her giriş yapan kullanıcı:
 *   1. signInAnonymously() ile Firebase Auth token alır
 *   2. userMappings/{auth.uid} → { studentId, isAdmin } Firestore'a yazılır
 *   3. Security Rules bu mapping üzerinden yetki kontrolü yapar
 * 
 * MALIYET: Anonymous Auth ücretsiz. userMappings yazma = giriş başına 1 write.
 */

import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const ADMIN_STUDENT_ID = '1002';

/**
 * Firebase Anonymous Auth ile giriş yap ve studentId'yi eşle
 */
export const signInAndMapStudent = async (studentId: string): Promise<User | null> => {
  try {
    // Mevcut auth varsa ve aynı studentId ile eşleşiyorsa tekrar giriş yapma
    if (auth.currentUser) {
      const existingMapping = await getStudentMapping(auth.currentUser.uid);
      if (existingMapping?.studentId === studentId) {
        return auth.currentUser;
      }
    }

    // Anonymous sign in
    const credential = await signInAnonymously(auth);
    const user = credential.user;

    // studentId → auth.uid eşlemesini kaydet
    await setDoc(doc(db, 'userMappings', user.uid), {
      studentId,
      isAdmin: studentId === ADMIN_STUDENT_ID,
      lastLogin: Date.now(),
    });

    console.log(`[Auth] ${studentId} → ${user.uid} eşlendi`);
    return user;
  } catch (error) {
    console.warn('[Auth] Anonymous sign-in hatası:', error);
    // Auth başarısız olsa bile uygulamayı kırmamak için null dön
    return null;
  }
};

/**
 * Mevcut auth durumunu dinle
 */
export const onAuthChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Mevcut kullanıcının studentId mapping'ini oku
 */
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

/**
 * Çıkış yap (anonymous user silinir)
 */
export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.warn('[Auth] Sign-out hatası:', error);
  }
};

/**
 * Mevcut auth user'ı al
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
